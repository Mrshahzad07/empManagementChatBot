from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_hr_or_admin
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeavePolicy, LeaveTypeEnum, LeaveStatusEnum
from app.schemas.leave import (
    LeaveBalanceOut, LeaveApplyRequest, LeaveRequestOut,
    LeaveReviewRequest, LeaveBalanceSummary, LeavePolicyOut
)
from app.services.leave_service import LeaveService
from app.services.audit_service import log_action
from app.services.notification_service import create_notification

router = APIRouter(prefix="/leave", tags=["Leave Management"])


@router.get("/balance", response_model=LeaveBalanceSummary)
async def get_leave_balance(
    year: Optional[int] = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    if not year:
        year = datetime.now().year

    balances = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.year == year
    ).all()

    total_allocated = sum(b.allocated for b in balances)
    total_used = sum(b.used for b in balances)
    total_pending = sum(b.pending for b in balances)
    total_remaining = sum(b.remaining for b in balances)

    return LeaveBalanceSummary(
        total_allocated=total_allocated,
        total_used=total_used,
        total_pending=total_pending,
        total_remaining=total_remaining,
        balances=[LeaveBalanceOut(
            id=b.id,
            leave_type=b.leave_type,
            year=b.year,
            allocated=b.allocated,
            used=b.used,
            pending=b.pending,
            remaining=b.remaining,
            carry_forward=b.carry_forward
        ) for b in balances]
    )


@router.post("/apply", response_model=LeaveRequestOut)
async def apply_leave(
    request: LeaveApplyRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LeaveService(db)
    leave_request = await service.apply_leave(current_user, request)

    await log_action(db, current_user.id, "leave_applied", "leave_request", str(leave_request.id),
                    f"Leave applied: {request.leave_type} from {request.start_date} to {request.end_date}")

    # Notify HR
    hr_employees = db.query(Employee).filter(Employee.role_id == 2, Employee.is_active == True).all()
    for hr in hr_employees:
        await create_notification(
            db, hr.id, "New Leave Request",
            f"{current_user.full_name} has applied for {request.leave_type} leave from {request.start_date} to {request.end_date}",
            "leave_applied", action_url="/hr/leave-approval"
        )

    return LeaveRequestOut(
        id=leave_request.id,
        leave_type=leave_request.leave_type,
        start_date=leave_request.start_date,
        end_date=leave_request.end_date,
        total_days=float(leave_request.total_days),
        reason=leave_request.reason,
        status=leave_request.status,
        applied_at=leave_request.applied_at,
        reviewed_at=leave_request.reviewed_at,
        review_comment=leave_request.review_comment,
        is_emergency=leave_request.is_emergency,
        created_via=leave_request.created_via
    )


@router.get("/history", response_model=List[LeaveRequestOut])
async def get_leave_history(
    status: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id)

    if status:
        query = query.filter(LeaveRequest.status == status)
    if year:
        query = query.filter(LeaveRequest.start_date >= date(year, 1, 1),
                            LeaveRequest.start_date <= date(year, 12, 31))

    requests = query.order_by(LeaveRequest.applied_at.desc()).offset(skip).limit(limit).all()

    return [LeaveRequestOut(
        id=r.id,
        leave_type=r.leave_type,
        start_date=r.start_date,
        end_date=r.end_date,
        total_days=float(r.total_days),
        reason=r.reason,
        status=r.status,
        applied_at=r.applied_at,
        reviewed_at=r.reviewed_at,
        review_comment=r.review_comment,
        is_emergency=r.is_emergency,
        created_via=r.created_via
    ) for r in requests]


@router.get("/pending", response_model=List[LeaveRequestOut])
async def get_pending_leaves(
    department_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id).options(joinedload(LeaveRequest.employee)).filter(
        LeaveRequest.status == LeaveStatusEnum.pending
    )
    if department_id:
        query = query.filter(Employee.department_id == department_id)

    requests = query.order_by(LeaveRequest.applied_at.asc()).offset(skip).limit(limit).all()

    return [LeaveRequestOut(
        id=r.id,
        leave_type=r.leave_type,
        start_date=r.start_date,
        end_date=r.end_date,
        total_days=float(r.total_days),
        reason=r.reason,
        status=r.status,
        applied_at=r.applied_at,
        reviewed_at=r.reviewed_at,
        review_comment=r.review_comment,
        is_emergency=r.is_emergency,
        created_via=r.created_via,
        employee_name=r.employee.full_name if r.employee else None,
        employee_id_str=r.employee.employee_id if r.employee else None
    ) for r in requests]


@router.put("/{leave_id}/approve")
async def approve_leave(
    leave_id: int,
    review: LeaveReviewRequest,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = LeaveService(db)
    leave = await service.review_leave(leave_id, "approved", current_user.id, review.comment)

    await log_action(db, current_user.id, "leave_approved", "leave_request", str(leave_id),
                    f"Leave {leave_id} approved by {current_user.full_name}")

    await create_notification(
        db, leave.employee_id, "Leave Approved ✅",
        f"Your {leave.leave_type} leave from {leave.start_date} to {leave.end_date} has been approved.",
        "leave_approved", action_url="/leave"
    )

    return {"message": "Leave approved successfully", "leave_id": leave_id}


@router.put("/{leave_id}/reject")
async def reject_leave(
    leave_id: int,
    review: LeaveReviewRequest,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = LeaveService(db)
    leave = await service.review_leave(leave_id, "rejected", current_user.id, review.comment)

    await log_action(db, current_user.id, "leave_rejected", "leave_request", str(leave_id),
                    f"Leave {leave_id} rejected by {current_user.full_name}")

    await create_notification(
        db, leave.employee_id, "Leave Rejected ❌",
        f"Your {leave.leave_type} leave from {leave.start_date} to {leave.end_date} has been rejected. Reason: {review.comment or 'No reason provided'}",
        "leave_rejected", action_url="/leave"
    )

    return {"message": "Leave rejected", "leave_id": leave_id}


@router.delete("/{leave_id}/cancel")
async def cancel_leave(
    leave_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.employee_id == current_user.id
    ).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be cancelled")

    # Restore pending balance
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.leave_type == leave.leave_type,
        LeaveBalance.year == leave.start_date.year
    ).first()
    if balance:
        balance.pending = max(0, balance.pending - int(leave.total_days))

    leave.status = "cancelled"
    db.commit()

    return {"message": "Leave cancelled successfully"}


@router.get("/policies", response_model=List[LeavePolicyOut])
async def get_leave_policies(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    policies = db.query(LeavePolicy).filter(LeavePolicy.is_active == True).all()
    return [LeavePolicyOut(
        id=p.id,
        leave_type=p.leave_type,
        annual_quota=p.annual_quota,
        max_consecutive_days=p.max_consecutive_days,
        min_notice_days=p.min_notice_days,
        carry_forward_allowed=p.carry_forward_allowed,
        requires_document=p.requires_document,
        description=p.description
    ) for p in policies]
