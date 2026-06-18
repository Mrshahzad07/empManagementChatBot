from app.core.database import Base
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey,
    Enum as SAEnum, DECIMAL, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class LeaveTypeEnum(str, enum.Enum):
    annual = "annual"
    sick = "sick"
    casual = "casual"
    maternity = "maternity"
    paternity = "paternity"
    emergency = "emergency"
    marriage = "marriage"
    unpaid = "unpaid"


class LeaveStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class LeaveBalance(Base):
    __tablename__ = "leave_balance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    leave_type = Column(SAEnum(LeaveTypeEnum), nullable=False)
    allocated = Column(Integer, nullable=False, default=0)
    used = Column(Integer, nullable=False, default=0)
    pending = Column(Integer, nullable=False, default=0)
    carry_forward = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="leave_balances", foreign_keys=[employee_id])

    @property
    def remaining(self) -> int:
        return max(0, self.allocated - self.used - self.pending)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(SAEnum(LeaveTypeEnum), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(DECIMAL(4, 1), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(SAEnum(LeaveStatusEnum), default=LeaveStatusEnum.pending)
    applied_at = Column(DateTime, server_default=func.now())
    reviewed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_comment = Column(Text)
    half_day = Column(Boolean, default=False)
    half_day_session = Column(SAEnum("morning", "afternoon", name="half_day_session"), nullable=True)
    is_emergency = Column(Boolean, default=False)
    attachment_path = Column(String(500))
    created_via = Column(SAEnum("chat", "form", "hr", name="created_via_enum"), default="chat")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    reviewer = relationship("Employee", foreign_keys=[reviewed_by])


class LeavePolicy(Base):
    __tablename__ = "leave_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    leave_type = Column(SAEnum(LeaveTypeEnum), nullable=False, unique=True)
    annual_quota = Column(Integer, nullable=False, default=0)
    max_consecutive_days = Column(Integer, default=30)
    min_notice_days = Column(Integer, default=1)
    carry_forward_allowed = Column(Boolean, default=False)
    max_carry_forward = Column(Integer, default=0)
    requires_document = Column(Boolean, default=False)
    gender_specific = Column(SAEnum("none", "male", "female", name="gender_specific_enum"), default="none")
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
