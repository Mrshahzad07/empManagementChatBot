from app.core.database import Base
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey,
    Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class DocumentTypeEnum(str, enum.Enum):
    offer_letter = "offer_letter"
    appointment_letter = "appointment_letter"
    experience_letter = "experience_letter"
    salary_slip = "salary_slip"
    form16 = "form16"
    tax_document = "tax_document"
    policy = "policy"
    certificate = "certificate"
    id_card = "id_card"
    relieving_letter = "relieving_letter"
    other = "other"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    document_type = Column(SAEnum(DocumentTypeEnum), nullable=False)
    document_name = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_size_kb = Column(Integer)
    mime_type = Column(String(100), default="application/pdf")
    is_template = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    financial_year = Column(String(10))
    valid_from = Column(Date)
    valid_until = Column(Date)
    uploaded_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    download_count = Column(Integer, default=0)
    status = Column(SAEnum("active", "archived", "deleted", name="doc_status_enum"), default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="documents", foreign_keys=[employee_id])
    uploader = relationship("Employee", foreign_keys=[uploaded_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SAEnum(
        "leave_approved", "leave_rejected", "leave_applied",
        "salary_generated", "document_uploaded", "announcement",
        "system", "reminder", "alert",
        name="notification_type_enum"
    ), nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    action_url = Column(String(500))
    action_data = Column(JSON)
    priority = Column(SAEnum("low", "medium", "high", "urgent", name="notification_priority"), default="medium")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    employee = relationship("Employee", back_populates="notifications")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="New Conversation")
    status = Column(SAEnum("active", "archived", name="session_status"), default="active")
    message_count = Column(Integer, default=0)
    last_message_at = Column(DateTime, nullable=True)
    context_data = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    role = Column(SAEnum("user", "assistant", "system", "tool", name="message_role"), nullable=False)
    content = Column(Text, nullable=False)
    tool_name = Column(String(100))
    tool_args = Column(JSON)
    tool_result = Column(JSON)
    action_taken = Column(String(100))
    tokens_used = Column(Integer)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(50))
    description = Column(Text)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String(36))
    status = Column(SAEnum("success", "failure", "warning", name="audit_status"), default="success")
    created_at = Column(DateTime, server_default=func.now())


class CompanyPolicy(Base):
    __tablename__ = "company_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100))
    content = Column(Text)
    file_path = Column(String(500))
    file_name = Column(String(255))
    version = Column(String(20), default="1.0")
    effective_date = Column(Date)
    is_active = Column(Boolean, default=True)
    embedding_status = Column(SAEnum("pending", "processing", "done", "error", name="embedding_status"), default="pending")
    chunk_count = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(SAEnum("general", "hr", "it", "finance", "event", "alert", name="announcement_category"), default="general")
    priority = Column(SAEnum("low", "medium", "high", "urgent", name="announcement_priority"), default="medium")
    target_role = Column(SAEnum("all", "employee", "hr", "admin", name="target_role_enum"), default="all")
    target_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    publish_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
