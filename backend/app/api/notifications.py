from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.misc import Notification
from app.schemas.misc import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
async def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.employee_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    return [NotificationOut(
        id=n.id,
        title=n.title,
        message=n.message,
        notification_type=n.notification_type,
        is_read=n.is_read,
        read_at=n.read_at,
        priority=n.priority,
        action_url=n.action_url,
        created_at=n.created_at
    ) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification).filter(
        Notification.employee_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timezone
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.employee_id == current_user.id
    ).first()
    if notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_read(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timezone
    db.query(Notification).filter(
        Notification.employee_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True, "read_at": datetime.now(timezone.utc)})
    db.commit()
    return {"message": "All notifications marked as read"}
