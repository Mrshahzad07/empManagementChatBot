from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_hr_or_admin
from app.models.employee import Employee
from app.models.salary import SalaryRecord, SalarySlip
from app.schemas.salary import SalaryRecordOut, SalarySlipOut, BulkDownloadRequest, SalaryUploadRecord, MONTH_NAMES
from app.services.salary_service import SalaryService
from app.services.audit_service import log_action
from app.services.notification_service import create_notification
import os

router = APIRouter(prefix="/salary", tags=["Salary Management"])


def build_salary_out(record: SalaryRecord) -> SalaryRecordOut:
    slip = record.salary_slip
    return SalaryRecordOut(
        id=record.id,
        employee_id=record.employee_id,
        month=record.month,
        year=record.year,
        month_name=MONTH_NAMES.get(record.month, ""),
        basic_salary=float(record.basic_salary or 0),
        hra=float(record.hra or 0),
        transport_allowance=float(record.transport_allowance or 0),
        medical_allowance=float(record.medical_allowance or 0),
        special_allowance=float(record.special_allowance or 0),
        other_allowances=float(record.other_allowances or 0),
        bonus=float(record.bonus or 0),
        gross_salary=record.gross_salary,
        pf_deduction=float(record.pf_deduction or 0),
        esi_deduction=float(record.esi_deduction or 0),
        tds_deduction=float(record.tds_deduction or 0),
        professional_tax=float(record.professional_tax or 0),
        loan_deduction=float(record.loan_deduction or 0),
        other_deductions=float(record.other_deductions or 0),
        total_deductions=record.total_deductions,
        net_salary=record.net_salary,
        working_days=record.working_days or 26,
        present_days=record.present_days or 26,
        absent_days=record.absent_days or 0,
        lop_days=float(record.lop_days or 0),
        payment_status=record.payment_status,
        payment_date=record.payment_date,
        has_slip=slip is not None,
        slip_id=slip.id if slip else None
    )


@router.get("/slips", response_model=List[SalaryRecordOut])
async def get_salary_slips(
    year: Optional[int] = None,
    month: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SalaryRecord).filter(
        SalaryRecord.employee_id == current_user.id,
        SalaryRecord.payment_status == "paid"
    )
    if year:
        query = query.filter(SalaryRecord.year == year)
    if month:
        query = query.filter(SalaryRecord.month == month)

    records = query.order_by(SalaryRecord.year.desc(), SalaryRecord.month.desc()).offset(skip).limit(limit).all()
    return [build_salary_out(r) for r in records]


@router.get("/slips/{slip_id}/download")
async def download_salary_slip(
    slip_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find slip by salary_record_id or slip_id
    record = db.query(SalaryRecord).filter(
        SalaryRecord.id == slip_id,
        SalaryRecord.employee_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Salary record not found")

    service = SalaryService(db)
    pdf_path = await service.get_or_generate_slip(record, current_user)

    await log_action(db, current_user.id, "salary_slip_download", "salary_slip", str(slip_id),
                    f"Downloaded salary slip for {MONTH_NAMES.get(record.month, '')} {record.year}")

    filename = f"salary_slip_{current_user.employee_id}_{record.year}_{record.month:02d}.pdf"
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/bulk-download")
async def bulk_download_salary_slips(
    request: BulkDownloadRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SalaryRecord).filter(
        SalaryRecord.employee_id == current_user.id,
        SalaryRecord.year == request.year,
        SalaryRecord.payment_status == "paid"
    )
    if request.month_from:
        query = query.filter(SalaryRecord.month >= request.month_from)
    if request.month_to:
        query = query.filter(SalaryRecord.month <= request.month_to)

    records = query.order_by(SalaryRecord.month.asc()).all()

    if not records:
        raise HTTPException(status_code=404, detail="No salary records found for the specified period")

    service = SalaryService(db)
    zip_path = await service.generate_bulk_zip(records, current_user, request.year)

    await log_action(db, current_user.id, "salary_bulk_download", "salary_slip", str(request.year),
                    f"Bulk downloaded {len(records)} salary slips for {request.year}")

    filename = f"salary_slips_{current_user.employee_id}_{request.year}.zip"
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/upload", dependencies=[Depends(require_hr_or_admin)])
async def upload_salary_data(
    records: List[SalaryUploadRecord],
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = SalaryService(db)
    result = await service.upload_salary_records(records, current_user)

    for emp_id in result["processed_employees"]:
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if emp:
            await create_notification(
                db, emp_id, "Salary Slip Ready 💰",
                "Your salary slip has been generated and is ready for download.",
                "salary_generated", action_url="/salary"
            )

    return result


@router.get("/summary")
async def get_salary_summary(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    current_year = datetime.now().year

    records = db.query(SalaryRecord).filter(
        SalaryRecord.employee_id == current_user.id,
        SalaryRecord.payment_status == "paid"
    ).order_by(SalaryRecord.year.desc(), SalaryRecord.month.desc()).all()

    if not records:
        return {"total_records": 0, "latest_salary": None, "yearly_data": {}}

    latest = records[0] if records else None
    yearly = {}
    for r in records:
        key = str(r.year)
        if key not in yearly:
            yearly[key] = {"total_net": 0, "months": 0}
        yearly[key]["total_net"] += r.net_salary
        yearly[key]["months"] += 1

    return {
        "total_records": len(records),
        "latest_salary": {
            "month": latest.month,
            "month_name": MONTH_NAMES.get(latest.month, ""),
            "year": latest.year,
            "net_salary": latest.net_salary
        } if latest else None,
        "yearly_data": yearly
    }

@router.get("/monthly-register", dependencies=[Depends(require_hr_or_admin)])
async def get_monthly_register(
    month: int,
    year: int,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    records = db.query(SalaryRecord, Employee).join(Employee, SalaryRecord.employee_id == Employee.id).filter(
        SalaryRecord.month == month,
        SalaryRecord.year == year
    ).all()
    
    result = []
    for record, emp in records:
        data = build_salary_out(record).model_dump()
        data["employee_name"] = emp.full_name
        data["employee_code"] = emp.employee_id
        result.append(data)
    
    return result


@router.put("/{record_id}/pay", dependencies=[Depends(require_hr_or_admin)])
async def make_salary_payment(
    record_id: int,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    record = db.query(SalaryRecord).filter(SalaryRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    from datetime import datetime
    record.payment_status = "paid"
    record.payment_date = datetime.now().date()
    db.commit()
    
    await log_action(db, current_user.id, "salary_payment", "salary_record", str(record.id),
                    f"Marked salary for {MONTH_NAMES.get(record.month, '')} {record.year} as paid")
                    
    await create_notification(
        db, record.employee_id, "Salary Paid 💸",
        f"Your salary for {MONTH_NAMES.get(record.month, '')} {record.year} has been credited.",
        "salary_paid", action_url="/salary"
    )
    
    return {"message": "Payment marked successfully"}
