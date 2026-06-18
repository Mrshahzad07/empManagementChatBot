from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class LeaveBalanceOut(BaseModel):
    id: int
    leave_type: str
    year: int
    allocated: int
    used: int
    pending: int
    remaining: int
    carry_forward: int

    model_config = {"from_attributes": True}


class LeaveApplyRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    half_day: bool = False
    half_day_session: Optional[str] = None
    is_emergency: bool = False


class LeaveRequestOut(BaseModel):
    id: int
    leave_type: str
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    is_emergency: bool
    created_via: Optional[str] = None
    employee_name: Optional[str] = None
    employee_id_str: Optional[str] = None

    model_config = {"from_attributes": True}


class LeaveReviewRequest(BaseModel):
    status: str  # approved or rejected
    comment: Optional[str] = None


class LeaveBalanceSummary(BaseModel):
    total_allocated: int
    total_used: int
    total_pending: int
    total_remaining: int
    balances: List[LeaveBalanceOut]


class LeavePolicyOut(BaseModel):
    id: int
    leave_type: str
    annual_quota: int
    max_consecutive_days: int
    min_notice_days: int
    carry_forward_allowed: bool
    requires_document: bool
    description: Optional[str] = None

    model_config = {"from_attributes": True}
