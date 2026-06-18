from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.misc import ChatSession
from app.schemas.misc import ChatMessageRequest, ChatResponseOut, ChatMessageOut, ChatSessionOut
from app.chatbot.engine import ChatEngine
from app.services.audit_service import log_action
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("/message", response_model=ChatResponseOut)
async def send_message(
    request: ChatMessageRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 characters)")

    engine = ChatEngine(db, current_user)
    assistant_msg, session_id, tool_result = await engine.process_message(
        request.message,
        session_id=request.session_id
    )

    await log_action(
        db, current_user.id, "chat_message", "chat_session", session_id,
        f"Chat: {request.message[:100]}",
        new_values={"tool_used": assistant_msg.tool_name}
    )

    # Build actions list for frontend
    actions = None
    if tool_result and isinstance(tool_result, dict):
        action_type = tool_result.get("action")
        if action_type:
            actions = [{"type": action_type, "data": tool_result}]
        elif tool_result.get("status") == "success" and "download_url" in tool_result:
            actions = [{"type": "download", "data": tool_result}]

    return ChatResponseOut(
        session_id=session_id,
        message=ChatMessageOut(
            id=assistant_msg.id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            tool_name=assistant_msg.tool_name,
            tool_result=assistant_msg.tool_result,
            action_taken=assistant_msg.action_taken,
            created_at=assistant_msg.created_at
        ),
        actions=actions
    )


@router.get("/sessions", response_model=List[ChatSessionOut])
async def get_chat_sessions(
    skip: int = 0,
    limit: int = 20,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.employee_id == current_user.id,
        ChatSession.status == "active"
    ).order_by(ChatSession.last_message_at.desc()).offset(skip).limit(limit).all()

    return [ChatSessionOut(
        id=s.id,
        title=s.title,
        status=s.status,
        message_count=s.message_count or 0,
        last_message_at=s.last_message_at,
        created_at=s.created_at
    ) for s in sessions]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.employee_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    from app.models.misc import ChatMessage
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    return {
        "session": ChatSessionOut(
            id=session.id,
            title=session.title,
            status=session.status,
            message_count=session.message_count or 0,
            last_message_at=session.last_message_at,
            created_at=session.created_at
        ),
        "messages": [ChatMessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            tool_name=m.tool_name,
            tool_result=m.tool_result,
            action_taken=m.action_taken,
            created_at=m.created_at
        ) for m in messages if m.role in ("user", "assistant")]
    }


@router.delete("/sessions/{session_id}")
async def archive_session(
    session_id: str,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.employee_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "archived"
    db.commit()
    return {"message": "Session archived"}
