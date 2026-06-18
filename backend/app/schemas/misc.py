from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    tool_name: Optional[str] = None
    tool_result: Optional[Any] = None
    action_taken: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponseOut(BaseModel):
    session_id: str
    message: ChatMessageOut
    actions: Optional[List[Dict[str, Any]]] = None


class ChatSessionOut(BaseModel):
    id: str
    title: str
    status: str
    message_count: int
    last_message_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    read_at: Optional[datetime] = None
    priority: str
    action_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    document_type: str
    document_name: str
    description: Optional[str] = None
    financial_year: Optional[str] = None
    download_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    category: str
    priority: str
    is_pinned: bool
    publish_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
