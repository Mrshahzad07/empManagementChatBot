from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime


class EmployeeBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    date_of_joining: Optional[date] = None
    employment_type: Optional[str] = "full_time"
    pan_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    employee_id: str
    password: str
    role_id: int = 1


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    model_config = {"from_attributes": True}


class RoleOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class EmployeeOut(BaseModel):
    id: int
    employee_id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    designation: Optional[str] = None
    date_of_joining: Optional[date] = None
    employment_type: Optional[str] = None
    employment_status: Optional[str] = None
    department: Optional[DepartmentOut] = None
    role: Optional[RoleOut] = None
    profile_photo: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListOut(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: str
    designation: Optional[str] = None
    department: Optional[DepartmentOut] = None
    role: Optional[RoleOut] = None
    employment_status: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
