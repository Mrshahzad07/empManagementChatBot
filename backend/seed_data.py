"""
Seed script: Creates demo data for the AI-EOS platform.
Run: python seed_data.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.core.security import get_password_hash
from app.models import *


def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    print("🌱 Starting seed...")

    try:
        # ── Roles ─────────────────────────────────────────────────
        roles = {}
        for name, desc in [
            ("employee", "Regular employee with self-service access"),
            ("hr", "HR manager with team management access"),
            ("admin", "System administrator with full access"),
        ]:
            r = db.query(Role).filter(Role.name == name).first()
            if not r:
                r = Role(name=name, description=desc)
                db.add(r)
                db.flush()
            roles[name] = r
        print("  ✅ Roles created")

        # ── Departments ───────────────────────────────────────────
        depts = {}
        for name, code, desc in [
            ("Engineering", "ENG", "Software Development"),
            ("Human Resources", "HR", "People Operations"),
            ("Finance", "FIN", "Finance and Accounts"),
            ("Marketing", "MKT", "Marketing and Growth"),
            ("Operations", "OPS", "Operations"),
        ]:
            d = db.query(Department).filter(Department.code == code).first()
            if not d:
                d = Department(name=name, code=code, description=desc)
                db.add(d)
                db.flush()
            depts[code] = d
        print("  ✅ Departments created")

        # ── Leave Policies ────────────────────────────────────────
        policies_data = [
            ("annual", 18, 15, 3, True, 5, False, "none", "Annual paid leave"),
            ("sick", 12, 7, 0, False, 0, True, "none", "Sick leave"),
            ("casual", 6, 3, 1, False, 0, False, "none", "Casual leave"),
            ("maternity", 180, 180, 30, False, 0, True, "female", "Maternity leave"),
            ("paternity", 15, 15, 7, False, 0, False, "male", "Paternity leave"),
            ("emergency", 5, 5, 0, False, 0, False, "none", "Emergency leave"),
            ("marriage", 5, 5, 15, False, 0, True, "none", "Marriage leave"),
            ("unpaid", 30, 30, 1, False, 0, False, "none", "Unpaid leave"),
        ]
        for data in policies_data:
            existing = db.query(LeavePolicy).filter(LeavePolicy.leave_type == data[0]).first()
            if not existing:
                p = LeavePolicy(
                    leave_type=data[0], annual_quota=data[1], max_consecutive_days=data[2],
                    min_notice_days=data[3], carry_forward_allowed=data[4],
                    max_carry_forward=data[5], requires_document=data[6],
                    gender_specific=data[7], description=data[8]
                )
                db.add(p)
        db.flush()
        print("  ✅ Leave policies created")

        # ── Employees ─────────────────────────────────────────────
        employees_data = [
            {
                "employee_id": "EMP001",
                "email": "admin@techcorp.com",
                "password": "Admin@123",
                "first_name": "Arjun",
                "last_name": "Sharma",
                "phone": "+91-9876543210",
                "designation": "System Administrator",
                "role": "admin",
                "department": "OPS",
                "doj": date(2020, 1, 15),
                "gender": "male",
                "pan": "ARJSH1234A",
                "bank": "HDFC Bank",
                "account": "50100123456789",
                "ifsc": "HDFC0001234",
                "pf": "KA/BAN/0001/1234567",
                "uan": "100123456789",
            },
            {
                "employee_id": "EMP002",
                "email": "hr@techcorp.com",
                "password": "HR@123456",
                "first_name": "Priya",
                "last_name": "Mehta",
                "phone": "+91-9876543211",
                "designation": "HR Manager",
                "role": "hr",
                "department": "HR",
                "doj": date(2021, 3, 1),
                "gender": "female",
                "pan": "PRYME5678B",
                "bank": "ICICI Bank",
                "account": "012345678901",
                "ifsc": "ICIC0001234",
                "pf": "KA/BAN/0001/2345678",
                "uan": "100234567890",
            },
            {
                "employee_id": "EMP003",
                "email": "employee@techcorp.com",
                "password": "Emp@123456",
                "first_name": "Rahul",
                "last_name": "Kumar",
                "phone": "+91-9876543212",
                "designation": "Senior Software Engineer",
                "role": "employee",
                "department": "ENG",
                "doj": date(2022, 6, 15),
                "gender": "male",
                "pan": "RAHKU9012C",
                "bank": "SBI Bank",
                "account": "30123456789",
                "ifsc": "SBIN0001234",
                "pf": "KA/BAN/0001/3456789",
                "uan": "100345678901",
            },
        ]

        created_employees = {}
        for emp_data in employees_data:
            existing = db.query(Employee).filter(Employee.email == emp_data["email"]).first()
            if not existing:
                emp = Employee(
                    employee_id=emp_data["employee_id"],
                    email=emp_data["email"],
                    password_hash=get_password_hash(emp_data["password"]),
                    first_name=emp_data["first_name"],
                    last_name=emp_data["last_name"],
                    phone=emp_data["phone"],
                    designation=emp_data["designation"],
                    role_id=roles[emp_data["role"]].id,
                    department_id=depts[emp_data["department"]].id,
                    date_of_joining=emp_data["doj"],
                    gender=emp_data["gender"],
                    pan_number=emp_data["pan"],
                    bank_name=emp_data["bank"],
                    bank_account_number=emp_data["account"],
                    bank_ifsc=emp_data["ifsc"],
                    pf_number=emp_data["pf"],
                    uan_number=emp_data["uan"],
                    employment_type="full_time",
                    employment_status="active"
                )
                db.add(emp)
                db.flush()
                created_employees[emp_data["employee_id"]] = emp
            else:
                created_employees[emp_data["employee_id"]] = existing
        print("  ✅ Employees created")

        # ── Leave Balances ────────────────────────────────────────
        emp_record = created_employees.get("EMP003")
        if emp_record:
            for year in [2025, 2026]:
                for policy_type, quota, used_val in [
                    ("annual", 18, 7), ("sick", 12, 3), ("casual", 6, 2),
                    ("emergency", 5, 1), ("marriage", 5, 0), ("unpaid", 30, 0),
                    ("maternity", 180, 0), ("paternity", 15, 0)
                ]:
                    existing_bal = db.query(LeaveBalance).filter(
                        LeaveBalance.employee_id == emp_record.id,
                        LeaveBalance.year == year,
                        LeaveBalance.leave_type == policy_type
                    ).first()
                    if not existing_bal:
                        lb = LeaveBalance(
                            employee_id=emp_record.id,
                            year=year,
                            leave_type=policy_type,
                            allocated=quota,
                            used=used_val if year == 2025 else max(0, used_val - 2),
                            pending=0
                        )
                        db.add(lb)
        print("  ✅ Leave balances created")

        # ── Salary Records (Jan 2025 - May 2026) ─────────────────
        emp_record = created_employees.get("EMP003")
        if emp_record:
            admin_record = created_employees.get("EMP001")
            salary_months = [
                (1, 2025), (2, 2025), (3, 2025), (4, 2025), (5, 2025),
                (6, 2025), (7, 2025), (8, 2025), (9, 2025), (10, 2025),
                (11, 2025), (12, 2025),
                (1, 2026), (2, 2026), (3, 2026), (4, 2026), (5, 2026),
            ]
            for month, year in salary_months:
                existing_sal = db.query(SalaryRecord).filter(
                    SalaryRecord.employee_id == emp_record.id,
                    SalaryRecord.month == month,
                    SalaryRecord.year == year
                ).first()
                if not existing_sal:
                    # Slight salary increase from 2025 to 2026
                    base = 75000 if year == 2025 else 82500
                    sr = SalaryRecord(
                        employee_id=emp_record.id,
                        month=month,
                        year=year,
                        basic_salary=base,
                        hra=int(base * 0.4),
                        transport_allowance=5000,
                        medical_allowance=1250,
                        special_allowance=15000,
                        other_allowances=0,
                        bonus=50000 if month == 12 else 0,
                        pf_deduction=int(base * 0.12),
                        esi_deduction=0,
                        tds_deduction=8500 if year == 2025 else 9500,
                        professional_tax=200,
                        working_days=26,
                        present_days=26,
                        absent_days=0,
                        payment_status="paid",
                        payment_date=date(year, month, 28),
                        payment_mode="bank_transfer",
                        transaction_id=f"TXN{year}{month:02d}{emp_record.id:04d}",
                        created_by=admin_record.id if admin_record else None
                    )
                    db.add(sr)
        print("  ✅ Salary records created")

        # ── Leave Requests (history) ───────────────────────────────
        emp_record = created_employees.get("EMP003")
        hr_record = created_employees.get("EMP002")
        if emp_record and hr_record:
            today = date.today()
            history_leaves = [
                (date(2025, 2, 10), date(2025, 2, 12), "casual", "Family function", "approved"),
                (date(2025, 4, 5), date(2025, 4, 5), "sick", "Fever and cold", "approved"),
                (date(2025, 7, 14), date(2025, 7, 18), "annual", "Vacation to Goa", "approved"),
                (date(2025, 10, 2), date(2025, 10, 3), "casual", "Personal work", "rejected"),
                (date(2025, 12, 23), date(2025, 12, 27), "annual", "Christmas and New Year holidays", "approved"),
            ]
            for start, end, ltype, reason, status in history_leaves:
                existing_lr = db.query(LeaveRequest).filter(
                    LeaveRequest.employee_id == emp_record.id,
                    LeaveRequest.start_date == start
                ).first()
                if not existing_lr:
                    days = (end - start).days + 1
                    lr = LeaveRequest(
                        employee_id=emp_record.id,
                        leave_type=ltype,
                        start_date=start,
                        end_date=end,
                        total_days=days,
                        reason=reason,
                        status=status,
                        reviewed_by=hr_record.id,
                        reviewed_at=datetime.now(),
                        review_comment="Approved." if status == "approved" else "Insufficient reason.",
                        created_via="chat"
                    )
                    db.add(lr)

        # ── Announcements ──────────────────────────────────────────
        admin_record = created_employees.get("EMP001")
        if admin_record:
            ann_data = [
                (
                    "🚀 Welcome to AI Employee OS!",
                    "We are thrilled to launch our AI-powered Employee Self-Service Platform. "
                    "You can now apply for leaves, download salary slips, and access all HR services "
                    "through a natural language conversation. Just type what you need in the chat!",
                    "general", "high", True
                ),
                (
                    "📊 Q2 2026 Performance Reviews",
                    "The Q2 performance review cycle begins on July 1st, 2026. "
                    "Please submit your self-appraisal by June 25th. "
                    "Your manager will complete the review by July 10th.",
                    "hr", "medium", False
                ),
                (
                    "🎉 Annual Company Picnic - July 5th",
                    "Save the date! Our annual company picnic is scheduled for July 5th, 2026 "
                    "at Cubbon Park, Bangalore. Family members are welcome. RSVP by June 30th.",
                    "event", "low", False
                ),
                (
                    "💰 Salary Credit - May 2026",
                    "May 2026 salaries have been credited to your respective bank accounts. "
                    "Please download your salary slips from the platform.",
                    "finance", "high", False
                ),
            ]
            for title, content, cat, priority, pinned in ann_data:
                existing_ann = db.query(Announcement).filter(Announcement.title == title).first()
                if not existing_ann:
                    ann = Announcement(
                        title=title, content=content, category=cat,
                        priority=priority, is_pinned=pinned,
                        created_by=admin_record.id, target_role="all"
                    )
                    db.add(ann)

        # ── Notifications ──────────────────────────────────────────
        emp_record = created_employees.get("EMP003")
        if emp_record:
            notif_data = [
                ("Leave Approved ✅", "Your annual leave from Jul 14 to Jul 18, 2025 has been approved.", "leave_approved", "high"),
                ("Salary Slip Ready 💰", "Your salary slip for May 2026 is ready for download.", "salary_generated", "medium"),
                ("New Announcement 📢", "Annual Company Picnic - July 5th. Check announcements for details.", "announcement", "low"),
            ]
            from app.models.misc import Notification
            for title, message, ntype, priority in notif_data:
                existing_notif = db.query(Notification).filter(
                    Notification.employee_id == emp_record.id,
                    Notification.title == title
                ).first()
                if not existing_notif:
                    notif = Notification(
                        employee_id=emp_record.id,
                        title=title, message=message,
                        notification_type=ntype, priority=priority
                    )
                    db.add(notif)

        db.commit()
        print("\n🎉 Seed data created successfully!")
        print("\n📋 Login Credentials:")
        print("  ┌─────────────────────────────────────────────┐")
        print("  │  Admin:    admin@techcorp.com / Admin@123   │")
        print("  │  HR:       hr@techcorp.com / HR@123456      │")
        print("  │  Employee: employee@techcorp.com / Emp@123456│")
        print("  └─────────────────────────────────────────────┘")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
