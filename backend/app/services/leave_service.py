from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date, timedelta
from typing import Optional
from app.models.leave import LeaveBalance, LeaveRequest, LeavePolicy, LeaveTypeEnum, LeaveStatusEnum
from app.models.employee import Employee
from app.schemas.leave import LeaveApplyRequest


class LeaveService:
    def __init__(self, db: Session):
        self.db = db

    def _count_working_days(self, start: date, end: date) -> float:
        """Count working days between two dates (Mon-Sat, excludes Sundays)."""
        total = 0
        current = start
        while current <= end:
            if current.weekday() != 6:  # 6 = Sunday
                total += 1
            current += timedelta(days=1)
        return float(total)

    async def apply_leave(self, employee: Employee, request: LeaveApplyRequest) -> LeaveRequest:
        today = date.today()

        # Validate dates
        if request.start_date < today:
            raise HTTPException(status_code=400, detail="Cannot apply leave for past dates")
        if request.end_date < request.start_date:
            raise HTTPException(status_code=400, detail="End date cannot be before start date")

        total_days = self._count_working_days(request.start_date, request.end_date)
        if request.half_day:
            total_days = 0.5

        if total_days <= 0:
            raise HTTPException(status_code=400, detail="Invalid leave duration")

        # Get policy
        policy = self.db.query(LeavePolicy).filter(
            LeavePolicy.leave_type == request.leave_type,
            LeavePolicy.is_active == True
        ).first()

        if policy:
            # Check consecutive day limit
            if total_days > policy.max_consecutive_days:
                raise HTTPException(
                    status_code=400,
                    detail=f"Maximum consecutive days for {request.leave_type} is {policy.max_consecutive_days}"
                )

            # Check notice period (skip for emergency leaves)
            if not request.is_emergency and policy.min_notice_days > 0:
                notice_required = today + timedelta(days=policy.min_notice_days)
                if request.start_date < notice_required:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Minimum {policy.min_notice_days} days notice required for {request.leave_type} leave"
                    )

        # Check leave balance
        year = request.start_date.year
        balance = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id,
            LeaveBalance.leave_type == request.leave_type,
            LeaveBalance.year == year
        ).first()

        if not balance:
            # Create balance entry if not exists
            if policy:
                balance = LeaveBalance(
                    employee_id=employee.id,
                    year=year,
                    leave_type=request.leave_type,
                    allocated=policy.annual_quota,
                    used=0,
                    pending=0
                )
                self.db.add(balance)
                self.db.flush()
            else:
                raise HTTPException(status_code=400, detail="Leave balance not configured")

        if request.leave_type != "unpaid":
            available = balance.remaining
            if total_days > available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient leave balance. Available: {available}, Requested: {total_days}"
                )

        # Check for overlapping leaves
        overlapping = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status.in_(["pending", "approved"]),
            LeaveRequest.start_date <= request.end_date,
            LeaveRequest.end_date >= request.start_date
        ).first()

        if overlapping:
            raise HTTPException(
                status_code=400,
                detail=f"You already have a leave request from {overlapping.start_date} to {overlapping.end_date}"
            )

        # Create leave request
        is_hr = employee.role_id == 2
        status = LeaveStatusEnum.approved if is_hr else LeaveStatusEnum.pending
        
        leave = LeaveRequest(
            employee_id=employee.id,
            leave_type=request.leave_type,
            start_date=request.start_date,
            end_date=request.end_date,
            total_days=total_days,
            reason=request.reason,
            status=status,
            half_day=request.half_day,
            half_day_session=request.half_day_session,
            is_emergency=request.is_emergency,
            created_via="chat"
        )
        self.db.add(leave)

        # Update balance
        if is_hr:
            balance.used += int(total_days) if total_days == int(total_days) else 1
        else:
            balance.pending += int(total_days) if total_days == int(total_days) else 1
            
        self.db.commit()
        self.db.refresh(leave)
        return leave

    async def review_leave(self, leave_id: int, status: str, reviewer_id: int, comment: Optional[str] = None) -> LeaveRequest:
        from datetime import datetime, timezone
        leave = self.db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")
        if leave.status != "pending":
            raise HTTPException(status_code=400, detail="Leave is not in pending state")

        old_status = leave.status
        leave.status = status
        leave.reviewed_by = reviewer_id
        leave.reviewed_at = datetime.now(timezone.utc)
        leave.review_comment = comment

        # Update balance
        balance = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == leave.employee_id,
            LeaveBalance.leave_type == leave.leave_type,
            LeaveBalance.year == leave.start_date.year
        ).first()

        if balance:
            days_int = max(1, int(leave.total_days))
            if status == "approved":
                balance.pending = max(0, balance.pending - days_int)
                balance.used += days_int
            elif status == "rejected":
                balance.pending = max(0, balance.pending - days_int)

        self.db.commit()
        self.db.refresh(leave)
        return leave
