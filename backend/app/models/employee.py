from app.core.database import Base
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey,
    Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class EmploymentTypeEnum(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    intern = "intern"


class EmploymentStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    terminated = "terminated"
    on_leave = "on_leave"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(SAEnum(GenderEnum))
    address = Column(Text)
    profile_photo = Column(String(500))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation = Column(String(150))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=1)
    date_of_joining = Column(Date)
    employment_type = Column(SAEnum(EmploymentTypeEnum), default=EmploymentTypeEnum.full_time)
    employment_status = Column(SAEnum(EmploymentStatusEnum), default=EmploymentStatusEnum.active)
    reporting_manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    pan_number = Column(String(20))
    aadhar_number = Column(String(20))
    bank_account_number = Column(String(50))
    bank_ifsc = Column(String(20))
    bank_name = Column(String(100))
    pf_number = Column(String(50))
    esi_number = Column(String(50))
    uan_number = Column(String(50))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="employees")
    role = relationship("Role", back_populates="employees")
    reporting_manager = relationship("Employee", remote_side=[id], foreign_keys=[reporting_manager_id])
    leave_balances = relationship("LeaveBalance", back_populates="employee", foreign_keys="LeaveBalance.employee_id")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    salary_records = relationship("SalaryRecord", back_populates="employee", foreign_keys="SalaryRecord.employee_id")
    salary_slips = relationship("SalarySlip", back_populates="employee")
    documents = relationship("Document", back_populates="employee", foreign_keys="Document.employee_id")
    notifications = relationship("Notification", back_populates="employee")
    chat_sessions = relationship("ChatSession", back_populates="employee")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
