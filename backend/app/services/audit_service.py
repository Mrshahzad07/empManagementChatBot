from sqlalchemy.orm import Session
from typing import Optional
from app.models.misc import AuditLog
from datetime import datetime, timezone


async def log_action(
    db: Session,
    employee_id: Optional[int],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    description: Optional[str] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    session_id: Optional[str] = None,
    status: str = "success"
):
    try:
        log = AuditLog(
            employee_id=employee_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            status=status
        )
        db.add(log)
        db.commit()
    except Exception as e:
        # Don't let audit logging break main flow
        db.rollback()
        print(f"Audit log error: {e}")
