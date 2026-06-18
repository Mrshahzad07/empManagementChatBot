from sqlalchemy.orm import Session
from typing import Optional
from app.models.misc import Notification


async def create_notification(
    db: Session,
    employee_id: int,
    title: str,
    message: str,
    notification_type: str,
    action_url: Optional[str] = None,
    priority: str = "medium",
    action_data: Optional[dict] = None
):
    try:
        notification = Notification(
            employee_id=employee_id,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            priority=priority,
            action_data=action_data
        )
        db.add(notification)
        db.commit()
        return notification
    except Exception as e:
        db.rollback()
        print(f"Notification error: {e}")
        return None
