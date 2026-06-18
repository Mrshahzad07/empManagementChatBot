from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_hr_or_admin, require_admin
from app.models.employee import Employee
from app.models.misc import AuditLog, Announcement
from app.models.department import Department
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeListOut
from app.core.security import get_password_hash
from app.services.audit_service import log_action
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin & HR Management"])


# ── Employee Management ────────────────────────────────────────
@router.get("/employees", response_model=List[EmployeeListOut])
async def list_employees(
    department_id: Optional[int] = None,
    role_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if role_id:
        query = query.filter(Employee.role_id == role_id)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_term)) |
            (Employee.last_name.ilike(search_term)) |
            (Employee.email.ilike(search_term)) |
            (Employee.employee_id.ilike(search_term))
        )

    employees = query.offset(skip).limit(limit).all()
    return employees


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: int,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("/employees", response_model=EmployeeOut)
async def create_employee(
    data: EmployeeCreate,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Employee).filter(
        (Employee.email == data.email) | (Employee.employee_id == data.employee_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email or ID already exists")

    emp = Employee(
        employee_id=data.employee_id,
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        department_id=data.department_id,
        designation=data.designation,
        role_id=data.role_id,
        date_of_joining=data.date_of_joining,
        employment_type=data.employment_type,
        pan_number=data.pan_number,
        bank_account_number=data.bank_account_number,
        bank_ifsc=data.bank_ifsc,
        bank_name=data.bank_name,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    # Create leave balances for current year
    from app.models.leave import LeaveBalance, LeavePolicy
    from datetime import date
    year = date.today().year
    policies = db.query(LeavePolicy).filter(LeavePolicy.is_active == True).all()
    for policy in policies:
        lb = LeaveBalance(
            employee_id=emp.id,
            year=year,
            leave_type=policy.leave_type,
            allocated=policy.annual_quota,
            used=0, pending=0
        )
        db.add(lb)
    db.commit()

    await log_action(db, current_user.id, "employee_created", "employee", str(emp.id),
                    f"Created employee: {emp.full_name} ({emp.employee_id})")
    return emp


@router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(emp, field, value)

    db.commit()
    await log_action(db, current_user.id, "employee_updated", "employee", str(employee_id),
                    f"Updated employee: {emp.full_name}", new_values=update_data)
    return {"message": "Employee updated successfully"}


@router.delete("/employees/{employee_id}/deactivate")
async def deactivate_employee(
    employee_id: int,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.is_active = False
    emp.employment_status = "terminated"
    db.commit()
    await log_action(db, current_user.id, "employee_deactivated", "employee", str(employee_id),
                    f"Deactivated employee: {emp.full_name}")
    return {"message": "Employee deactivated"}


# ── Audit Logs ────────────────────────────────────────────────
@router.get("/audit-logs")
async def get_audit_logs(
    action: Optional[str] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if employee_id:
        query = query.filter(AuditLog.employee_id == employee_id)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return [{
        "id": log.id,
        "employee_id": log.employee_id,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "description": log.description,
        "status": log.status,
        "ip_address": log.ip_address,
        "created_at": log.created_at.isoformat() if log.created_at else None
    } for log in logs]


# ── Announcements ─────────────────────────────────────────────
@router.get("/announcements")
async def get_announcements(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    announcements = db.query(Announcement).filter(
        Announcement.is_active == True,
        Announcement.publish_at <= now
    ).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).limit(10).all()

    return [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "category": a.category,
        "priority": a.priority,
        "is_pinned": a.is_pinned,
        "publish_at": a.publish_at.isoformat() if a.publish_at else None
    } for a in announcements]


@router.post("/announcements")
async def create_announcement(
    title: str,
    content: str,
    category: str = "general",
    priority: str = "medium",
    is_pinned: bool = False,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    announcement = Announcement(
        title=title,
        content=content,
        category=category,
        priority=priority,
        is_pinned=is_pinned,
        created_by=current_user.id
    )
    db.add(announcement)
    db.commit()

    # Notify all employees
    from app.services.notification_service import create_notification
    all_employees = db.query(Employee).filter(Employee.is_active == True, Employee.role_id == 1).all()
    for emp in all_employees:
        await create_notification(
            db, emp.id, f"📢 {title}", content[:150] + "...",
            "announcement", action_url="/dashboard"
        )

    await log_action(db, current_user.id, "announcement_created", "announcement",
                    str(announcement.id), f"Created announcement: {title}")

    return {"message": "Announcement created", "id": announcement.id}


# ── Departments ────────────────────────────────────────────────
@router.get("/departments")
async def get_departments(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    departments = db.query(Department).filter(Department.is_active == True).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in departments]
