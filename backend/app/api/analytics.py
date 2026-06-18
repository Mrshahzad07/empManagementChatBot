from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_hr_or_admin
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.salary import SalaryRecord
from app.models.misc import Document, AuditLog, Notification, ChatMessage
from app.schemas.salary import MONTH_NAMES

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/employee")
async def employee_analytics(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_year = datetime.now().year

    # Leave usage by type
    leave_balances = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.year == current_year
    ).all()

    leave_data = [{
        "type": b.leave_type,
        "allocated": b.allocated,
        "used": b.used,
        "remaining": b.remaining
    } for b in leave_balances]

    # Salary trend (last 12 months)
    salary_records = db.query(SalaryRecord).filter(
        SalaryRecord.employee_id == current_user.id,
        SalaryRecord.payment_status == "paid"
    ).order_by(SalaryRecord.year.asc(), SalaryRecord.month.asc()).limit(12).all()

    salary_trend = [{
        "month": MONTH_NAMES.get(r.month, ""),
        "month_num": r.month,
        "year": r.year,
        "net_salary": r.net_salary,
        "gross_salary": r.gross_salary
    } for r in salary_records]

    # Document count
    doc_count = db.query(Document).filter(
        Document.employee_id == current_user.id,
        Document.status == "active"
    ).count()

    # Leave request stats
    leave_stats = {
        "total": db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id).count(),
        "approved": db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id, LeaveRequest.status == "approved").count(),
        "pending": db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id, LeaveRequest.status == "pending").count(),
        "rejected": db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id, LeaveRequest.status == "rejected").count(),
    }

    return {
        "employee_id": current_user.employee_id,
        "full_name": current_user.full_name,
        "leave_data": leave_data,
        "salary_trend": salary_trend,
        "document_count": doc_count,
        "leave_stats": leave_stats,
        "year": current_year
    }


@router.get("/hr", dependencies=[Depends(require_hr_or_admin)])
async def hr_analytics(
    db: Session = Depends(get_db)
):
    current_year = datetime.now().year

    # Total employees
    total_employees = db.query(Employee).filter(Employee.role_id == 1, Employee.is_active == True).count()

    # Pending leaves
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "pending").count()

    # Leave requests by month (current year) — SQLite-compatible using Python-level grouping
    from datetime import date as d
    year_start = d(current_year, 1, 1)
    year_end = d(current_year, 12, 31)
    leaves_this_year = db.query(LeaveRequest).filter(
        LeaveRequest.start_date >= year_start,
        LeaveRequest.start_date <= year_end
    ).all()

    month_counts: dict = {}
    for leave in leaves_this_year:
        m = leave.start_date.month
        month_counts[m] = month_counts.get(m, 0) + 1
    monthly_leave_data = [{"month": MONTH_NAMES.get(m, ""), "count": c} for m, c in sorted(month_counts.items())]

    # Department-wise leave usage
    from app.models.department import Department
    dept_counts: dict = {}
    for leave in leaves_this_year:
        emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
        if emp and emp.department:
            dept_name = emp.department.name
            dept_counts[dept_name] = dept_counts.get(dept_name, 0) + 1
    dept_data = [{"department": name, "count": cnt} for name, cnt in dept_counts.items()]

    # Payroll summary (current year)
    salary_records = db.query(SalaryRecord).filter(
        SalaryRecord.year == current_year,
        SalaryRecord.payment_status == "paid"
    ).all()
    total_payroll = sum(float(r.net_salary or 0) for r in salary_records)

    # Recent leave status distribution
    status_counts: dict = {}
    for leave in leaves_this_year:
        s = leave.status
        status_counts[s] = status_counts.get(s, 0) + 1
    status_dist = [{"status": s, "count": c} for s, c in status_counts.items()]

    return {
        "total_employees": total_employees,
        "pending_leaves": pending_leaves,
        "monthly_leave_data": monthly_leave_data,
        "department_leave_data": dept_data,
        "payroll_summary": {
            "total_net_paid": total_payroll,
            "records_count": len(salary_records)
        },
        "leave_status_distribution": status_dist,
        "year": current_year
    }



@router.get("/admin", dependencies=[Depends(require_hr_or_admin)])
async def admin_analytics(db: Session = Depends(get_db)):
    # System stats
    total_users = db.query(Employee).filter(Employee.is_active == True).count()
    total_chat_messages = db.query(ChatMessage).count()
    total_audit_logs = db.query(AuditLog).count()
    total_notifications = db.query(Notification).count()

    # Recent audit actions
    recent_audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
    audit_data = [{
        "id": a.id,
        "action": a.action,
        "description": a.description,
        "status": a.status,
        "created_at": a.created_at.isoformat() if a.created_at else None
    } for a in recent_audits]

    return {
        "system_stats": {
            "total_users": total_users,
            "total_chat_messages": total_chat_messages,
            "total_audit_logs": total_audit_logs,
            "total_notifications": total_notifications
        },
        "recent_audit_logs": audit_data
    }
