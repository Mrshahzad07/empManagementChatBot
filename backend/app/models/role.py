from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class RoleEnum(str, enum.Enum):
    employee = "employee"
    hr = "hr"
    admin = "admin"


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(SAEnum(RoleEnum), nullable=False, unique=True)
    description = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    employees = relationship("Employee", back_populates="role")
