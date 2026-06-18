from app.core.database import Base
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey,
    Enum as SAEnum, DECIMAL, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    hold = "hold"


class SalaryRecord(Base):
    __tablename__ = "salary_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # Earnings
    basic_salary = Column(DECIMAL(12, 2), nullable=False, default=0)
    hra = Column(DECIMAL(12, 2), default=0)
    transport_allowance = Column(DECIMAL(12, 2), default=0)
    medical_allowance = Column(DECIMAL(12, 2), default=0)
    special_allowance = Column(DECIMAL(12, 2), default=0)
    other_allowances = Column(DECIMAL(12, 2), default=0)
    bonus = Column(DECIMAL(12, 2), default=0)
    overtime_amount = Column(DECIMAL(12, 2), default=0)

    # Deductions
    pf_deduction = Column(DECIMAL(12, 2), default=0)
    esi_deduction = Column(DECIMAL(12, 2), default=0)
    tds_deduction = Column(DECIMAL(12, 2), default=0)
    professional_tax = Column(DECIMAL(12, 2), default=0)
    loan_deduction = Column(DECIMAL(12, 2), default=0)
    other_deductions = Column(DECIMAL(12, 2), default=0)

    # Attendance
    working_days = Column(Integer, default=26)
    present_days = Column(Integer, default=26)
    absent_days = Column(Integer, default=0)
    lop_days = Column(DECIMAL(4, 1), default=0)
    overtime_hours = Column(DECIMAL(6, 2), default=0)

    # Payment
    payment_date = Column(Date)
    payment_status = Column(SAEnum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    payment_mode = Column(SAEnum("bank_transfer", "cheque", "cash", name="payment_mode_enum"), default="bank_transfer")
    transaction_id = Column(String(100))
    remarks = Column(Text)
    created_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="unique_employee_month_year"),
    )

    employee = relationship("Employee", back_populates="salary_records", foreign_keys=[employee_id])
    salary_slip = relationship("SalarySlip", back_populates="salary_record", uselist=False)

    @property
    def gross_salary(self) -> float:
        return float(
            (self.basic_salary or 0) + (self.hra or 0) + (self.transport_allowance or 0) +
            (self.medical_allowance or 0) + (self.special_allowance or 0) +
            (self.other_allowances or 0) + (self.bonus or 0) + (self.overtime_amount or 0)
        )

    @property
    def total_deductions(self) -> float:
        return float(
            (self.pf_deduction or 0) + (self.esi_deduction or 0) + (self.tds_deduction or 0) +
            (self.professional_tax or 0) + (self.loan_deduction or 0) + (self.other_deductions or 0)
        )

    @property
    def net_salary(self) -> float:
        return self.gross_salary - self.total_deductions


class SalarySlip(Base):
    __tablename__ = "salary_slips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    salary_record_id = Column(Integer, ForeignKey("salary_records.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_size_kb = Column(Integer)
    verification_id = Column(String(64), unique=True)
    download_count = Column(Integer, default=0)
    last_downloaded_at = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, server_default=func.now())

    salary_record = relationship("SalaryRecord", back_populates="salary_slip")
    employee = relationship("Employee", back_populates="salary_slips")
