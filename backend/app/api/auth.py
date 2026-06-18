from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, verify_token
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, ChangePasswordRequest
from app.core.security import get_password_hash
from app.services.audit_service import log_action
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(
        Employee.email == login_data.email.lower().strip(),
        Employee.is_active == True
    ).first()

    if not employee or not verify_password(login_data.password, employee.password_hash):
        await log_action(db, None, "login_failed", "employee", None,
                        f"Failed login attempt for: {login_data.email}",
                        ip_address=request.client.host if request.client else None,
                        status="failure")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Update last login
    employee.last_login = datetime.now(timezone.utc)
    db.commit()

    token_data = {"sub": str(employee.id), "role": employee.role.name, "emp_id": employee.employee_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    await log_action(db, employee.id, "login", "employee", str(employee.id),
                    f"Employee {employee.full_name} logged in",
                    ip_address=request.client.host if request.client else None)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        employee_id=employee.id,
        role=employee.role.name,
        full_name=employee.full_name,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = verify_token(data.refresh_token, "refresh")
    employee_id = payload.get("sub")
    employee = db.query(Employee).filter(Employee.id == int(employee_id), Employee.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Employee not found")

    token_data = {"sub": str(employee.id), "role": employee.role.name, "emp_id": employee.employee_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        employee_id=employee.id,
        role=employee.role.name,
        full_name=employee.full_name,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(request: Request, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    await log_action(db, current_user.id, "logout", "employee", str(current_user.id),
                    f"Employee {current_user.full_name} logged out",
                    ip_address=request.client.host if request.client else None)
    return {"message": "Logged out successfully"}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    await log_action(db, current_user.id, "password_changed", "employee", str(current_user.id),
                    "Password changed successfully")
    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_me(current_user: Employee = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.name,
        "designation": current_user.designation,
        "department": {"id": current_user.department.id, "name": current_user.department.name} if current_user.department else None,
        "profile_photo": current_user.profile_photo,
        "date_of_joining": current_user.date_of_joining,
        "last_login": current_user.last_login,
    }
