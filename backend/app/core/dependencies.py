from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_token
from app.models.employee import Employee

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Employee:
    token = credentials.credentials
    payload = verify_token(token, "access")
    employee_id: Optional[int] = payload.get("sub")
    if employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    employee = db.query(Employee).filter(
        Employee.id == int(employee_id),
        Employee.is_active == True
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee not found or inactive",
        )
    return employee


async def get_current_active_employee(
    current_user: Employee = Depends(get_current_user),
) -> Employee:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive employee")
    return current_user


async def require_hr_or_admin(
    current_user: Employee = Depends(get_current_user),
) -> Employee:
    if current_user.role.name not in ("hr", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Admin access required",
        )
    return current_user


async def require_admin(
    current_user: Employee = Depends(get_current_user),
) -> Employee:
    if current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
