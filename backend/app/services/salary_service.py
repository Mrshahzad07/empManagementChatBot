import os
import uuid
import zipfile
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import (
    HexColor, white, black, grey, lightgrey
)
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.core.config import settings
from app.models.salary import SalaryRecord, SalarySlip
from app.models.employee import Employee
from app.schemas.salary import SalaryUploadRecord, MONTH_NAMES


# Brand Colors
PRIMARY = HexColor("#1565C0")
PRIMARY_LIGHT = HexColor("#E3F2FD")
SECONDARY = HexColor("#0D47A1")
ACCENT = HexColor("#FF6F00")
BG_LIGHT = HexColor("#F8FAFF")
TEXT_DARK = HexColor("#1A1A2E")
TEXT_MEDIUM = HexColor("#424242")
TEXT_LIGHT = HexColor("#757575")
SUCCESS = HexColor("#2E7D32")
DANGER = HexColor("#C62828")
BORDER = HexColor("#CFD8DC")
TABLE_HEADER_BG = HexColor("#1565C0")
TABLE_ALT_ROW = HexColor("#F5F8FF")


class SalaryService:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_generate_slip(self, record: SalaryRecord, employee: Employee) -> str:
        """Get existing PDF or generate a new one."""
        slip = self.db.query(SalarySlip).filter(
            SalarySlip.salary_record_id == record.id
        ).first()

        if slip and slip.file_path and os.path.exists(slip.file_path):
            # Update download count
            slip.download_count += 1
            slip.last_downloaded_at = datetime.now()
            self.db.commit()
            return slip.file_path

        # Generate PDF
        pdf_path = await self._generate_pdf(record, employee)

        # Save or update slip record
        verification_id = str(uuid.uuid4()).replace("-", "").upper()[:16]
        file_size_kb = os.path.getsize(pdf_path) // 1024

        if slip:
            slip.file_path = pdf_path
            slip.verification_id = verification_id
            slip.file_size_kb = file_size_kb
            slip.download_count += 1
            slip.last_downloaded_at = datetime.now()
            slip.generated_at = datetime.now()
        else:
            file_name = f"salary_slip_{employee.employee_id}_{record.year}_{record.month:02d}.pdf"
            slip = SalarySlip(
                salary_record_id=record.id,
                employee_id=employee.id,
                month=record.month,
                year=record.year,
                file_path=pdf_path,
                file_name=file_name,
                file_size_kb=file_size_kb,
                verification_id=verification_id,
                download_count=1,
                last_downloaded_at=datetime.now()
            )
            self.db.add(slip)

        self.db.commit()
        return pdf_path

    async def _generate_pdf(self, record: SalaryRecord, employee: Employee) -> str:
        """Generate professional PDF salary slip using ReportLab."""
        slip_dir = settings.salary_slips_dir
        os.makedirs(slip_dir, exist_ok=True)

        filename = f"salary_slip_{employee.employee_id}_{record.year}_{record.month:02d}.pdf"
        pdf_path = os.path.join(slip_dir, filename)

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            leftMargin=1.5 * cm,
            rightMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm
        )

        story = []
        styles = getSampleStyleSheet()

        # ── Header / Company Banner ──────────────────────────────────
        company_header_data = [[
            Paragraph(
                f'<font color="white"><b>{settings.COMPANY_NAME}</b></font>',
                ParagraphStyle('co_name', fontSize=16, textColor=white, leading=20, fontName='Helvetica-Bold')
            ),
            Paragraph(
                f'<font color="white" size="8">{settings.COMPANY_ADDRESS}<br/>'
                f'Email: {settings.COMPANY_EMAIL} | Phone: {settings.COMPANY_PHONE}<br/>'
                f'CIN: {settings.COMPANY_CIN}</font>',
                ParagraphStyle('co_addr', fontSize=8, textColor=white, leading=12)
            )
        ]]

        header_table = Table(company_header_data, colWidths=[7 * cm, 11 * cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, -1), white),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 0.4 * cm))

        # ── Payslip Title ──────────────────────────────────────────────
        month_name = MONTH_NAMES.get(record.month, "")
        title_style = ParagraphStyle('title', fontSize=14, fontName='Helvetica-Bold',
                                     textColor=PRIMARY, alignment=TA_CENTER)
        story.append(Paragraph(f"SALARY SLIP — {month_name.upper()} {record.year}", title_style))
        story.append(Spacer(1, 0.3 * cm))
        story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
        story.append(Spacer(1, 0.3 * cm))

        # ── Employee Info ───────────────────────────────────────────────
        dept_name = employee.department.name if employee.department else "N/A"
        emp_info_data = [
            ["Employee Name:", employee.full_name, "Employee ID:", employee.employee_id],
            ["Department:", dept_name, "Designation:", employee.designation or "N/A"],
            ["Date of Joining:", str(employee.date_of_joining or "N/A"), "PAN Number:", employee.pan_number or "N/A"],
            ["Bank Name:", employee.bank_name or "N/A", "Account No:", employee.bank_account_number or "XXXXXXXXXX"],
            ["PF Number:", employee.pf_number or "N/A", "UAN Number:", employee.uan_number or "N/A"],
        ]

        label_style = ParagraphStyle('label', fontSize=9, fontName='Helvetica-Bold', textColor=TEXT_MEDIUM)
        value_style = ParagraphStyle('value', fontSize=9, textColor=TEXT_DARK)

        emp_table_data = []
        for row in emp_info_data:
            emp_table_data.append([
                Paragraph(row[0], label_style),
                Paragraph(str(row[1]), value_style),
                Paragraph(row[2], label_style),
                Paragraph(str(row[3]), value_style),
            ])

        emp_table = Table(emp_table_data, colWidths=[4 * cm, 6 * cm, 4 * cm, 4 * cm])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, TABLE_ALT_ROW]),
        ]))
        story.append(emp_table)
        story.append(Spacer(1, 0.5 * cm))

        # ── Attendance ──────────────────────────────────────────────────
        att_title = ParagraphStyle('sec_title', fontSize=11, fontName='Helvetica-Bold',
                                   textColor=white, backColor=SECONDARY, leftIndent=-6, leading=20)
        story.append(Paragraph(" ◆  ATTENDANCE DETAILS", att_title))
        story.append(Spacer(1, 0.2 * cm))

        att_data = [
            ["Working Days", "Present Days", "Absent Days", "LOP Days", "OT Hours"],
            [
                str(record.working_days or 26),
                str(record.present_days or 26),
                str(record.absent_days or 0),
                str(float(record.lop_days or 0)),
                str(float(record.overtime_hours or 0))
            ]
        ]
        att_table = Table(att_data, colWidths=[3.6 * cm] * 5)
        att_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('BACKGROUND', (0, 1), (-1, 1), TABLE_ALT_ROW),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(att_table)
        story.append(Spacer(1, 0.4 * cm))

        # ── Earnings & Deductions ───────────────────────────────────────
        story.append(Paragraph(" ◆  EARNINGS & DEDUCTIONS", att_title))
        story.append(Spacer(1, 0.2 * cm))

        earnings = [
            ("Basic Salary", float(record.basic_salary or 0)),
            ("House Rent Allowance (HRA)", float(record.hra or 0)),
            ("Transport Allowance", float(record.transport_allowance or 0)),
            ("Medical Allowance", float(record.medical_allowance or 0)),
            ("Special Allowance", float(record.special_allowance or 0)),
            ("Other Allowances", float(record.other_allowances or 0)),
            ("Bonus", float(record.bonus or 0)),
            ("Overtime Amount", float(record.overtime_amount or 0)),
        ]

        deductions = [
            ("Provident Fund (PF)", float(record.pf_deduction or 0)),
            ("ESI Deduction", float(record.esi_deduction or 0)),
            ("Tax Deducted at Source (TDS)", float(record.tds_deduction or 0)),
            ("Professional Tax", float(record.professional_tax or 0)),
            ("Loan Deduction", float(record.loan_deduction or 0)),
            ("Other Deductions", float(record.other_deductions or 0)),
        ]

        # Build combined table
        header_row = [
            Paragraph("EARNINGS", ParagraphStyle('eh', fontSize=9, fontName='Helvetica-Bold', textColor=white)),
            Paragraph("AMOUNT (₹)", ParagraphStyle('eh', fontSize=9, fontName='Helvetica-Bold', textColor=white)),
            Paragraph("DEDUCTIONS", ParagraphStyle('dh', fontSize=9, fontName='Helvetica-Bold', textColor=white)),
            Paragraph("AMOUNT (₹)", ParagraphStyle('dh', fontSize=9, fontName='Helvetica-Bold', textColor=white)),
        ]

        max_rows = max(len(earnings), len(deductions))
        while len(earnings) < max_rows:
            earnings.append(("", 0))
        while len(deductions) < max_rows:
            deductions.append(("", 0))

        sal_val_style = ParagraphStyle('sv', fontSize=9, alignment=TA_RIGHT, textColor=TEXT_DARK)
        sal_label_style = ParagraphStyle('sl', fontSize=9, textColor=TEXT_DARK)
        sal_label_bold = ParagraphStyle('slb', fontSize=9, fontName='Helvetica-Bold', textColor=TEXT_DARK)

        table_data = [header_row]
        for i in range(max_rows):
            e_label, e_amt = earnings[i]
            d_label, d_amt = deductions[i]
            row = [
                Paragraph(e_label, sal_label_style),
                Paragraph(f"₹ {e_amt:,.2f}" if e_amt else "", sal_val_style),
                Paragraph(d_label, sal_label_style),
                Paragraph(f"₹ {d_amt:,.2f}" if d_amt else "", sal_val_style),
            ]
            table_data.append(row)

        # Totals row
        gross = record.gross_salary
        total_ded = record.total_deductions
        table_data.append([
            Paragraph("GROSS SALARY", ParagraphStyle('gt', fontSize=9, fontName='Helvetica-Bold', textColor=SUCCESS)),
            Paragraph(f"₹ {gross:,.2f}", ParagraphStyle('gv', fontSize=9, fontName='Helvetica-Bold', textColor=SUCCESS, alignment=TA_RIGHT)),
            Paragraph("TOTAL DEDUCTIONS", ParagraphStyle('dt', fontSize=9, fontName='Helvetica-Bold', textColor=DANGER)),
            Paragraph(f"₹ {total_ded:,.2f}", ParagraphStyle('dv', fontSize=9, fontName='Helvetica-Bold', textColor=DANGER, alignment=TA_RIGHT)),
        ])

        sal_table = Table(table_data, colWidths=[5.5 * cm, 3 * cm, 5.5 * cm, 3 * cm])
        row_count = len(table_data)
        sal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), SUCCESS),
            ('BACKGROUND', (2, 0), (3, 0), DANGER),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, row_count - 2), [white, TABLE_ALT_ROW]),
            ('BACKGROUND', (0, row_count - 1), (-1, row_count - 1), HexColor("#E8F5E9")),
            ('FONTNAME', (0, row_count - 1), (-1, row_count - 1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ]))
        story.append(sal_table)
        story.append(Spacer(1, 0.5 * cm))

        # ── Net Salary Banner ────────────────────────────────────────────
        net_salary = record.net_salary
        net_data = [[
            Paragraph(
                f'<font color="white" size="12"><b>NET SALARY PAYABLE: ₹ {net_salary:,.2f}</b></font>',
                ParagraphStyle('net', fontSize=14, textColor=white, alignment=TA_CENTER,
                               fontName='Helvetica-Bold', leading=20)
            )
        ]]
        net_table = Table(net_data, colWidths=[18 * cm])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), ACCENT),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ]))
        story.append(net_table)
        story.append(Spacer(1, 0.4 * cm))

        # ── Payment Details ──────────────────────────────────────────────
        payment_date_str = str(record.payment_date) if record.payment_date else "N/A"
        pay_data = [
            [Paragraph("Payment Date:", label_style), Paragraph(payment_date_str, value_style),
             Paragraph("Payment Mode:", label_style), Paragraph((record.payment_mode or "Bank Transfer").replace("_", " ").title(), value_style)],
            [Paragraph("Transaction ID:", label_style), Paragraph(record.transaction_id or "N/A", value_style),
             Paragraph("Payment Status:", label_style),
             Paragraph(
                 f'<font color="#2E7D32"><b>{(record.payment_status or "paid").upper()}</b></font>',
                 ParagraphStyle('ps', fontSize=9)
             )],
        ]
        pay_table = Table(pay_data, colWidths=[4 * cm, 6 * cm, 4 * cm, 4 * cm])
        pay_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(pay_table)
        story.append(Spacer(1, 0.5 * cm))

        # ── Footer ───────────────────────────────────────────────────────
        verification_id = str(uuid.uuid4()).replace("-", "").upper()[:16]
        generated_at = datetime.now().strftime("%d %b %Y %H:%M:%S")

        footer_data = [[
            Paragraph(
                f'<font size="7" color="#757575">This is a computer-generated salary slip and does not require a signature. '
                f'| Verification ID: <b>{verification_id}</b> | Generated on: {generated_at}</font>',
                ParagraphStyle('footer', fontSize=7, textColor=TEXT_LIGHT, alignment=TA_CENTER)
            )
        ]]
        footer_table = Table(footer_data, colWidths=[18 * cm])
        footer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor("#ECEFF1")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ]))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
        story.append(Spacer(1, 0.2 * cm))
        story.append(footer_table)

        # Build PDF
        doc.build(story)
        return pdf_path

    async def generate_bulk_zip(self, records: List[SalaryRecord], employee: Employee, year: int) -> str:
        """Generate ZIP of multiple salary slips."""
        zip_dir = settings.salary_slips_dir
        os.makedirs(zip_dir, exist_ok=True)
        zip_filename = f"salary_slips_{employee.employee_id}_{year}_{datetime.now().strftime('%Y%m%d%H%M%S')}.zip"
        zip_path = os.path.join(zip_dir, zip_filename)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for record in records:
                pdf_path = await self.get_or_generate_slip(record, employee)
                month_name = MONTH_NAMES.get(record.month, str(record.month))
                arc_name = f"salary_slip_{month_name}_{year}.pdf"
                zf.write(pdf_path, arc_name)

        return zip_path

    async def upload_salary_records(self, records: List[SalaryUploadRecord], uploader: Employee) -> dict:
        """Bulk upload salary records from HR."""
        processed = 0
        errors = []
        processed_employees = []

        for rec in records:
            try:
                emp = self.db.query(Employee).filter(Employee.employee_id == rec.employee_id).first()
                if not emp:
                    errors.append(f"Employee {rec.employee_id} not found")
                    continue

                existing = self.db.query(SalaryRecord).filter(
                    SalaryRecord.employee_id == emp.id,
                    SalaryRecord.month == rec.month,
                    SalaryRecord.year == rec.year
                ).first()

                if existing:
                    # Update
                    for field, value in rec.model_dump(exclude={"employee_id"}).items():
                        if hasattr(existing, field):
                            setattr(existing, field, value)
                    existing.created_by = uploader.id
                else:
                    salary = SalaryRecord(
                        employee_id=emp.id,
                        created_by=uploader.id,
                        **{k: v for k, v in rec.model_dump(exclude={"employee_id"}).items()}
                    )
                    self.db.add(salary)

                processed += 1
                if emp.id not in processed_employees:
                    processed_employees.append(emp.id)

            except Exception as e:
                errors.append(f"Error for {rec.employee_id}: {str(e)}")

        self.db.commit()
        return {"processed": processed, "errors": errors, "processed_employees": processed_employees}
