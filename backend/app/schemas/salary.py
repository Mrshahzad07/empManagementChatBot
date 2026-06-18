from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class SalaryRecordOut(BaseModel):
    id: int
    employee_id: int
    month: int
    year: int
    month_name: str
    basic_salary: float
    hra: float
    transport_allowance: float
    medical_allowance: float
    special_allowance: float
    other_allowances: float
    bonus: float
    gross_salary: float
    pf_deduction: float
    esi_deduction: float
    tds_deduction: float
    professional_tax: float
    loan_deduction: float
    other_deductions: float
    total_deductions: float
    net_salary: float
    working_days: int
    present_days: int
    absent_days: int
    lop_days: float
    payment_status: str
    payment_date: Optional[date] = None
    has_slip: bool = False
    slip_id: Optional[int] = None

    model_config = {"from_attributes": True}


class SalarySlipOut(BaseModel):
    id: int
    month: int
    year: int
    month_name: str
    net_salary: float
    verification_id: Optional[str] = None
    download_count: int
    generated_at: datetime

    model_config = {"from_attributes": True}


class BulkDownloadRequest(BaseModel):
    year: int
    month_from: Optional[int] = None
    month_to: Optional[int] = None


class SalaryUploadRecord(BaseModel):
    employee_id: str
    month: int
    year: int
    basic_salary: float
    hra: float = 0
    transport_allowance: float = 0
    medical_allowance: float = 0
    special_allowance: float = 0
    other_allowances: float = 0
    bonus: float = 0
    pf_deduction: float = 0
    esi_deduction: float = 0
    tds_deduction: float = 0
    professional_tax: float = 0
    loan_deduction: float = 0
    working_days: int = 26
    present_days: int = 26
    absent_days: int = 0
    lop_days: float = 0
    payment_status: str = "paid"
    payment_date: Optional[date] = None


MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December"
}
