# 📖 AI Employee Operating System — Complete Code Explanation

> **Document Purpose:** Line-by-line code walkthrough for every major file in the AI-EOS project.  
> **Last Updated:** June 2026  
> **Author:** Project Development Team

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Backend — Core Layer](#2-backend--core-layer)
   - 2.1 [config.py — Application Configuration](#21-configpy--application-configuration)
   - 2.2 [database.py — Database Connection Engine](#22-databasepy--database-connection-engine)
   - 2.3 [security.py — JWT & Password Security](#23-securitypy--jwt--password-security)
   - 2.4 [dependencies.py — FastAPI Dependency Injection](#24-dependenciespy--fastapi-dependency-injection)
3. [Backend — Database Models](#3-backend--database-models)
   - 3.1 [employee.py — Employee Model](#31-employeepy--employee-model)
   - 3.2 [salary.py — Salary Models](#32-salarypy--salary-models)
   - 3.3 [leave.py — Leave Models](#33-leavepy--leave-models)
   - 3.4 [misc.py — Auxiliary Models](#34-miscpy--auxiliary-models)
4. [Backend — Service Layer (Business Logic)](#4-backend--service-layer-business-logic)
   - 4.1 [salary_service.py — Salary & PDF Generation](#41-salary_servicepy--salary--pdf-generation)
   - 4.2 [leave_service.py — Leave Application Logic](#42-leave_servicepy--leave-application-logic)
   - 4.3 [audit_service.py — Audit Trail Logger](#43-audit_servicepy--audit-trail-logger)
   - 4.4 [notification_service.py — In-App Notifications](#44-notification_servicepy--in-app-notifications)
5. [Backend — API Endpoints Layer](#5-backend--api-endpoints-layer)
   - 5.1 [main.py — FastAPI Application Entry Point](#51-mainpy--fastapi-application-entry-point)
   - 5.2 [auth.py — Authentication Endpoints](#52-authpy--authentication-endpoints)
   - 5.3 [salary.py — Salary API Endpoints](#53-salarypy--salary-api-endpoints)
   - 5.4 [chat.py — AI Chat API Endpoints](#54-chatpy--ai-chat-api-endpoints)
6. [Backend — AI Chatbot Module](#6-backend--ai-chatbot-module)
   - 6.1 [engine.py — ChatEngine (The Brain)](#61-enginepy--chatengine-the-brain)
   - 6.2 [tools.py — AI Tool Calling Layer](#62-toolspy--ai-tool-calling-layer)
   - 6.3 [intent_parser.py — Multilingual NLP Parser](#63-intent_parserpy--multilingual-nlp-parser)
7. [Frontend — React Application](#7-frontend--react-application)
   - 7.1 [main.tsx — React DOM Entry Point](#71-maintsx--react-dom-entry-point)
   - 7.2 [App.tsx — Application Router & Guards](#72-apptsx--application-router--guards)
   - 7.3 [store/index.ts — Redux Store Configuration](#73-storeindexts--redux-store-configuration)
   - 7.4 [store/authSlice.ts — Authentication State](#74-storeauthslicets--authentication-state)
   - 7.5 [services/api.ts — Axios API Client](#75-servicesapits--axios-api-client)
8. [Infrastructure & Configuration](#8-infrastructure--configuration)
   - 8.1 [docker-compose.yml — Container Orchestration](#81-docker-composeyml--container-orchestration)
   - 8.2 [vite.config.ts — Frontend Build Configuration](#82-viteconfigts--frontend-build-configuration)
   - 8.3 [seed_data.py — Demo Data Seeder](#83-seed_datapy--demo-data-seeder)

---

## 1. Project Overview

The **AI Employee Operating System (AI-EOS)** is a full-stack, AI-powered HR self-service platform. It integrates a conversational AI chatbot (powered by Groq/Llama 3) that employees can use to perform HR tasks like applying for leaves, downloading salary slips, and accessing company documents — all through natural language, including Hindi and Hinglish.

**Architecture Pattern:** The project follows a **layered architecture**:

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│   React 18 + TypeScript + MUI + Redux + Vite        │
├─────────────────────────────────────────────────────┤
│                    API LAYER                          │
│   FastAPI Endpoints (auth, salary, leave, chat...)   │
├─────────────────────────────────────────────────────┤
│                 SERVICE LAYER                        │
│   Business Logic (salary calc, leave rules, audit)   │
├─────────────────────────────────────────────────────┤
│              AI / CHATBOT MODULE                     │
│   Groq LLM + Tool Calling + Intent Parsing           │
├─────────────────────────────────────────────────────┤
│                 DATA ACCESS LAYER                    │
│   SQLAlchemy ORM Models + MySQL/SQLite               │
└─────────────────────────────────────────────────────┘
```

---

## 2. Backend — Core Layer

### 2.1 `config.py` — Application Configuration

**File:** `backend/app/core/config.py`

This file centralizes all application settings using Pydantic's `BaseSettings`, which automatically reads values from `.env` files and environment variables.

```python
from pydantic_settings import BaseSettings
# BaseSettings is imported from pydantic-settings — it auto-loads
# environment variables and .env file values into Python typed fields.

from pydantic import field_validator
# field_validator allows custom validation logic on settings fields.

from typing import List
import os
```

**The `Settings` Class:**

```python
class Settings(BaseSettings):
    # ── Application Settings ──
    APP_NAME: str = "AI Employee OS"     # Display name of the application
    APP_ENV: str = "development"          # Environment (development/production)
    DEBUG: bool = True                    # Enable debug logging

    # ── Security Settings ──
    SECRET_KEY: str = "your-super-secret-jwt-key..."  # JWT signing secret
    ALGORITHM: str = "HS256"                           # JWT hashing algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480            # Token lifespan = 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7                # Refresh token = 7 days
    BCRYPT_ROUNDS: int = 12                           # Password hashing difficulty

    # ── Database Settings ──
    DATABASE_URL: str = "mysql+pymysql://user:pass@host:3306/db"
    # SQLAlchemy connection string. pymysql is the MySQL driver.
    # In local dev, this is overridden to "sqlite:///./ai_eos.db"

    # ── AI Provider Settings ──
    AI_PROVIDER: str = "groq"             # "groq" or "ollama"
    GROQ_API_KEY: str = ""                # API key for Groq cloud service
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  # LLM model name
    OLLAMA_BASE_URL: str = "http://localhost:11434"  # Local Ollama server
    OLLAMA_MODEL: str = "llama3.3:70b"    # Ollama model name

    # ── Company Branding ──
    COMPANY_NAME: str = "TechCorp Solutions Pvt. Ltd."
    COMPANY_ADDRESS: str = "..."          # Printed on salary slips
    COMPANY_EMAIL: str = "hr@techcorp.com"
    COMPANY_CIN: str = "U72200KA..."      # Company Identification Number
```

**Computed Properties:**

```python
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]
        # Converts comma-separated string "http://localhost:3000,http://localhost:5173"
        # into a Python list: ["http://localhost:3000", "http://localhost:5173"]

    @property
    def salary_slips_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "salary_slips")
        # Constructs path: "uploads/salary_slips"
```

**Singleton Instance:**

```python
settings = Settings()
# Creates a single global instance. Every module imports this
# to access configuration values: `from app.core.config import settings`
```

---

### 2.2 `database.py` — Database Connection Engine

**File:** `backend/app/core/database.py`

This file establishes the database connection using SQLAlchemy.

```python
from sqlalchemy import create_engine
# create_engine creates a pool of database connections

from sqlalchemy.ext.declarative import declarative_base
# declarative_base returns a base class from which all ORM models inherit

from sqlalchemy.orm import sessionmaker, Session
# sessionmaker creates a factory for database session objects
```

**Engine Creation (with SQLite vs MySQL detection):**

```python
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite needs special args because it's single-threaded by default
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # Allow multi-thread access
        echo=settings.DEBUG,  # Print SQL queries when DEBUG=True
    )
else:
    # MySQL/PostgreSQL production configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,      # Test connection health before use
        pool_recycle=3600,        # Recycle connections every 1 hour
        pool_size=10,             # Maintain 10 connections in the pool
        max_overflow=20,          # Allow up to 20 additional connections
        echo=settings.DEBUG,
    )
```

**Session Factory & Dependency:**

```python
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Creates a session factory. autocommit=False means we must
# explicitly call db.commit() to save changes.

Base = declarative_base()
# Base class for all ORM models. Every model inherits from this.
# Example: class Employee(Base): ...

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db        # Yields the session to the endpoint
    finally:
        db.close()      # Automatically closes session after request completes
# This is a FastAPI dependency — injected into endpoints via Depends(get_db)
```

---

### 2.3 `security.py` — JWT & Password Security

**File:** `backend/app/core/security.py`

Handles password hashing (bcrypt) and JWT token creation/verification.

```python
from jose import JWTError, jwt
# python-jose library for JWT encoding/decoding

from passlib.context import CryptContext
# passlib provides bcrypt password hashing

pwd_context = CryptContext(
    schemes=["bcrypt"],                    # Use bcrypt algorithm
    deprecated="auto",                      # Auto-handle deprecated schemes
    bcrypt__rounds=settings.BCRYPT_ROUNDS   # 12 rounds = ~250ms per hash
)
```

**Password Functions:**

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
    # Compares a plaintext password against a bcrypt hash.
    # Returns True if they match. Used during login.

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
    # Converts plaintext to bcrypt hash. Used during registration.
    # Example output: "$2b$12$LJ3m4..."
```

**JWT Token Functions:**

```python
def create_access_token(data: dict, expires_delta=None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    # Adds expiration timestamp and token type to the payload
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    # Signs the payload with HS256 algorithm using SECRET_KEY

def verify_token(token: str, token_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            raise credentials_exception
            # Prevents using a refresh token as an access token
        return payload
    except JWTError:
        raise credentials_exception
        # Raises HTTP 401 if token is invalid or expired
```

---

### 2.4 `dependencies.py` — FastAPI Dependency Injection

**File:** `backend/app/core/dependencies.py`

Defines reusable authentication dependencies that can be injected into any endpoint.

```python
security = HTTPBearer()
# Expects "Authorization: Bearer <token>" header in requests

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Employee:
    token = credentials.credentials          # Extract the JWT string
    payload = verify_token(token, "access")  # Decode and validate
    employee_id = payload.get("sub")         # "sub" holds the employee ID
    
    employee = db.query(Employee).filter(
        Employee.id == int(employee_id),
        Employee.is_active == True            # Only active employees
    ).first()
    
    if not employee:
        raise HTTPException(status_code=401, detail="Employee not found or inactive")
    return employee
    # Returns the full Employee ORM object for use in endpoints
```

**Role-Based Guards:**

```python
async def require_hr_or_admin(current_user = Depends(get_current_user)) -> Employee:
    if current_user.role.name not in ("hr", "admin"):
        raise HTTPException(status_code=403, detail="HR or Admin access required")
    return current_user
    # Used as: salary_router.post("/upload", dependencies=[Depends(require_hr_or_admin)])

async def require_admin(current_user = Depends(get_current_user)) -> Employee:
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

---

## 3. Backend — Database Models

### 3.1 `employee.py` — Employee Model

**File:** `backend/app/models/employee.py`

Defines the `Employee` table — the central entity in the system.

```python
class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"
# Python enum that maps to MySQL ENUM type. str inheritance
# allows JSON serialization.

class Employee(Base):
    __tablename__ = "employees"
    # Maps this class to the "employees" database table

    id = Column(Integer, primary_key=True, autoincrement=True)
    # Auto-incrementing primary key

    employee_id = Column(String(20), nullable=False, unique=True)
    # Business-facing ID like "EMP001", distinct from internal `id`

    email = Column(String(255), nullable=False, unique=True, index=True)
    # Indexed for fast login lookups. Unique constraint prevents duplicates.

    password_hash = Column(String(255), nullable=False)
    # Stores bcrypt hash, never the plain password

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    # Foreign key linking to the departments table

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=1)
    # Foreign key to roles table. Default = 1 (employee role)

    reporting_manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    # Self-referential FK — an employee reports to another employee

    # Financial details for salary slip generation
    pan_number = Column(String(20))
    bank_account_number = Column(String(50))
    bank_ifsc = Column(String(20))
    pf_number = Column(String(50))
    uan_number = Column(String(50))
```

**ORM Relationships:**

```python
    department = relationship("Department", back_populates="employees")
    # Enables: employee.department.name → "Engineering"

    role = relationship("Role", back_populates="employees")
    # Enables: employee.role.name → "hr"

    salary_records = relationship("SalaryRecord", back_populates="employee", ...)
    # Enables: employee.salary_records → list of salary entries

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    # Computed property. Not stored in DB, calculated on access.
```

---

### 3.2 `salary.py` — Salary Models

**File:** `backend/app/models/salary.py`

Two tables: `SalaryRecord` (monthly salary data) and `SalarySlip` (generated PDF metadata).

```python
class SalaryRecord(Base):
    __tablename__ = "salary_records"

    # ── Earnings Columns ──
    basic_salary = Column(DECIMAL(12, 2), nullable=False, default=0)
    # DECIMAL(12,2) means up to 12 digits with 2 decimal places
    # e.g., 75000.00

    hra = Column(DECIMAL(12, 2), default=0)               # House Rent Allowance
    transport_allowance = Column(DECIMAL(12, 2), default=0)
    medical_allowance = Column(DECIMAL(12, 2), default=0)
    special_allowance = Column(DECIMAL(12, 2), default=0)

    # ── Deduction Columns ──
    pf_deduction = Column(DECIMAL(12, 2), default=0)       # Provident Fund (12%)
    esi_deduction = Column(DECIMAL(12, 2), default=0)      # Employee State Insurance
    tds_deduction = Column(DECIMAL(12, 2), default=0)      # Tax Deducted at Source
    professional_tax = Column(DECIMAL(12, 2), default=0)   # State-level tax

    # ── Unique Constraint ──
    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="unique_employee_month_year"),
    )
    # Prevents duplicate salary entries for the same employee+month+year
```

**Computed Properties (not stored in DB):**

```python
    @property
    def gross_salary(self) -> float:
        return float(
            (self.basic_salary or 0) + (self.hra or 0) + (self.transport_allowance or 0) +
            (self.medical_allowance or 0) + (self.special_allowance or 0) +
            (self.other_allowances or 0) + (self.bonus or 0) + (self.overtime_amount or 0)
        )
        # Sum of ALL earnings = Gross Salary

    @property
    def net_salary(self) -> float:
        return self.gross_salary - self.total_deductions
        # Net = Gross - Deductions (the take-home amount)
```

---

### 3.3 `leave.py` — Leave Models

**File:** `backend/app/models/leave.py`

Three tables: `LeaveBalance`, `LeaveRequest`, and `LeavePolicy`.

```python
class LeaveTypeEnum(str, enum.Enum):
    annual = "annual"
    sick = "sick"
    casual = "casual"
    maternity = "maternity"      # 180 days for female employees
    paternity = "paternity"      # 15 days for male employees
    emergency = "emergency"
    marriage = "marriage"
    unpaid = "unpaid"            # No balance check needed
```

**LeaveBalance — Tracks how many leaves each employee has:**

```python
class LeaveBalance(Base):
    allocated = Column(Integer, default=0)   # Total given (e.g., 18 annual)
    used = Column(Integer, default=0)         # Actually taken
    pending = Column(Integer, default=0)      # Awaiting approval

    @property
    def remaining(self) -> int:
        return max(0, self.allocated - self.used - self.pending)
        # Available = Allocated - Used - Pending
        # max(0, ...) prevents negative values
```

**LeaveRequest — Each leave application:**

```python
class LeaveRequest(Base):
    status = Column(SAEnum(LeaveStatusEnum), default=LeaveStatusEnum.pending)
    # Lifecycle: pending → approved/rejected/cancelled
    
    created_via = Column(SAEnum("chat", "form", "hr", name="..."), default="chat")
    # Tracks whether leave was applied via AI chat, web form, or by HR directly
```

---

### 3.4 `misc.py` — Auxiliary Models

**File:** `backend/app/models/misc.py`

Contains models for Documents, Notifications, Chat, Announcements, and Audit Logs.

**ChatSession & ChatMessage — Multi-turn conversation storage:**

```python
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String(36), primary_key=True)     # UUID string
    title = Column(String(255), default="New Conversation")
    message_count = Column(Integer, default=0)     # Auto-incremented per message
    context_data = Column(JSON)                    # Extensible metadata storage

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    role = Column(SAEnum("user", "assistant", "system", "tool", ...), nullable=False)
    # "user" = employee message, "assistant" = AI response, "tool" = tool result

    tool_name = Column(String(100))        # e.g., "get_leave_balance"
    tool_args = Column(JSON)               # e.g., {"year": 2026}
    tool_result = Column(JSON)             # e.g., {"status": "success", ...}
    tokens_used = Column(Integer)          # LLM token consumption tracking
    response_time_ms = Column(Integer)     # Response latency in milliseconds
```

**AuditLog — Immutable action trail:**

```python
class AuditLog(Base):
    action = Column(String(100), nullable=False)     # e.g., "login", "salary_payment"
    entity_type = Column(String(50))                  # e.g., "employee", "salary_record"
    old_values = Column(JSON)                         # State before change
    new_values = Column(JSON)                         # State after change
    ip_address = Column(String(45))                   # Client IP for security
    status = Column(SAEnum("success", "failure", "warning", ...), default="success")
```

---

## 4. Backend — Service Layer (Business Logic)

### 4.1 `salary_service.py` — Salary & PDF Generation

**File:** `backend/app/services/salary_service.py`

This is one of the most critical services. It handles PDF salary slip generation using **ReportLab**.

**Brand Colors Definition:**

```python
PRIMARY = HexColor("#1565C0")          # Blue — company branding
ACCENT = HexColor("#FF6F00")           # Orange — used for Net Salary banner
SUCCESS = HexColor("#2E7D32")          # Green — for earnings totals
DANGER = HexColor("#C62828")           # Red — for deductions totals
TABLE_HEADER_BG = HexColor("#1565C0")  # Blue header rows
TABLE_ALT_ROW = HexColor("#F5F8FF")   # Alternating row background
```

**`get_or_generate_slip()` — Smart caching method:**

```python
async def get_or_generate_slip(self, record: SalaryRecord, employee: Employee) -> str:
    slip = self.db.query(SalarySlip).filter(
        SalarySlip.salary_record_id == record.id
    ).first()

    if slip and slip.file_path and os.path.exists(slip.file_path):
        slip.download_count += 1          # Increment download counter
        slip.last_downloaded_at = datetime.now()
        self.db.commit()
        return slip.file_path             # Return cached PDF path
    
    pdf_path = await self._generate_pdf(record, employee)  # Generate new PDF
    # ... save SalarySlip record to DB ...
    return pdf_path
```

**`_generate_pdf()` — ReportLab PDF construction:**

The method builds a professional salary slip PDF with these sections:
1. **Company Header Banner** — Blue background with company name, address, CIN
2. **Payslip Title** — "SALARY SLIP — JUNE 2026"
3. **Employee Info Table** — Name, ID, Department, PAN, Bank details
4. **Attendance Details** — Working days, present, absent, LOP
5. **Earnings & Deductions Table** — Side-by-side comparison with totals
6. **Net Salary Banner** — Orange highlighted final pay amount
7. **Payment Details** — Date, mode, transaction ID
8. **Footer** — Verification ID and generation timestamp

```python
doc = SimpleDocTemplate(pdf_path, pagesize=A4, ...)
story = []  # List of PDF elements built sequentially

# Company header with blue background
header_table = Table(company_header_data, colWidths=[7*cm, 11*cm])
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), PRIMARY),    # Blue background
    ('TEXTCOLOR', (0,0), (-1,-1), white),        # White text
    ('ROUNDEDCORNERS', [8, 8, 8, 8]),            # Rounded corners
]))
story.append(header_table)

# ... builds all sections ...

doc.build(story)  # Renders the PDF file to disk
```

**`upload_salary_records()` — Bulk HR upload:**

```python
async def upload_salary_records(self, records: List[SalaryUploadRecord], uploader) -> dict:
    for rec in records:
        emp = self.db.query(Employee).filter(
            Employee.employee_id == rec.employee_id
        ).first()
        
        existing = self.db.query(SalaryRecord).filter(
            SalaryRecord.employee_id == emp.id,
            SalaryRecord.month == rec.month,
            SalaryRecord.year == rec.year
        ).first()

        if existing:
            # UPDATE existing record
            for field, value in rec.model_dump(exclude={"employee_id"}).items():
                setattr(existing, field, value)
        else:
            # CREATE new salary record
            salary = SalaryRecord(employee_id=emp.id, **rec.model_dump(...))
            self.db.add(salary)
    
    self.db.commit()
    return {"processed": processed, "errors": errors, "processed_employees": [...]}
```

---

### 4.2 `leave_service.py` — Leave Application Logic

**File:** `backend/app/services/leave_service.py`

Handles the complete leave lifecycle: application → validation → balance check → approval.

**Working Days Calculator:**

```python
def _count_working_days(self, start: date, end: date) -> float:
    total = 0
    current = start
    while current <= end:
        if current.weekday() != 6:  # 6 = Sunday
            total += 1               # Monday(0) to Saturday(5) = working days
        current += timedelta(days=1)
    return float(total)
# Example: Mon to Fri = 5 working days, Mon to Sat = 6 working days
```

**`apply_leave()` — Full validation pipeline:**

```python
async def apply_leave(self, employee, request) -> LeaveRequest:
    # STEP 1: Date validation
    if request.start_date < today:
        raise HTTPException(400, "Cannot apply leave for past dates")

    # STEP 2: Calculate working days
    total_days = self._count_working_days(request.start_date, request.end_date)
    if request.half_day:
        total_days = 0.5

    # STEP 3: Check company policy
    policy = self.db.query(LeavePolicy).filter(
        LeavePolicy.leave_type == request.leave_type
    ).first()
    if total_days > policy.max_consecutive_days:
        raise HTTPException(400, f"Maximum consecutive days is {policy.max_consecutive_days}")

    # STEP 4: Notice period check (skip for emergencies)
    if not request.is_emergency and policy.min_notice_days > 0:
        if request.start_date < today + timedelta(days=policy.min_notice_days):
            raise HTTPException(400, f"Minimum {policy.min_notice_days} days notice required")

    # STEP 5: Check leave balance
    if request.leave_type != "unpaid":
        if total_days > balance.remaining:
            raise HTTPException(400, f"Insufficient balance. Available: {balance.remaining}")

    # STEP 6: Check for overlapping leaves
    overlapping = self.db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee.id,
        LeaveRequest.status.in_(["pending", "approved"]),
        LeaveRequest.start_date <= request.end_date,
        LeaveRequest.end_date >= request.start_date
    ).first()

    # STEP 7: Auto-approve for HR, pending for others
    status = "approved" if employee.role_id == 2 else "pending"

    # STEP 8: Create the leave request
    leave = LeaveRequest(employee_id=employee.id, status=status, ...)
    self.db.add(leave)
    
    # STEP 9: Update balance (pending count for employees, used count for HR)
    if is_hr:
        balance.used += int(total_days)
    else:
        balance.pending += int(total_days)
```

---

### 4.3 `audit_service.py` — Audit Trail Logger

**File:** `backend/app/services/audit_service.py`

A simple but critical service that logs every important action for compliance.

```python
async def log_action(
    db, employee_id, action, entity_type=None, entity_id=None,
    description=None, old_values=None, new_values=None,
    ip_address=None, status="success"
):
    try:
        log = AuditLog(
            employee_id=employee_id,
            action=action,              # e.g., "login", "salary_payment"
            entity_type=entity_type,    # e.g., "employee", "salary_record"
            entity_id=entity_id,        # ID of the affected entity
            description=description,    # Human-readable description
            ip_address=ip_address,      # Client IP for security tracing
            status=status               # "success" or "failure"
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()                   # NEVER let audit failure break main flow
        print(f"Audit log error: {e}")
```

---

### 4.4 `notification_service.py` — In-App Notifications

**File:** `backend/app/services/notification_service.py`

Creates in-app notifications for events like leave approvals, salary credits, etc.

```python
async def create_notification(
    db, employee_id, title, message, notification_type,
    action_url=None, priority="medium"
):
    notification = Notification(
        employee_id=employee_id,
        title=title,                      # e.g., "Salary Slip Ready 💰"
        message=message,                  # Detailed message body
        notification_type=notification_type,  # e.g., "salary_generated"
        action_url=action_url,            # e.g., "/salary" — deep link
        priority=priority                 # "low", "medium", "high", "urgent"
    )
    db.add(notification)
    db.commit()
```

---

## 5. Backend — API Endpoints Layer

### 5.1 `main.py` — FastAPI Application Entry Point

**File:** `backend/app/main.py`

The root file that bootstraps the entire backend application.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ON STARTUP:
    for dir_path in [settings.salary_slips_dir, settings.documents_dir, ...]:
        os.makedirs(dir_path, exist_ok=True)
        # Creates upload directories if they don't exist
    
    Base.metadata.create_all(bind=engine)
    # Creates all database tables based on ORM models.
    # Safe to call repeatedly — it won't drop existing tables.
    
    yield  # Application runs here
    
    # ON SHUTDOWN:
    logger.info("Shutting down...")
```

**FastAPI App Initialization:**

```python
app = FastAPI(
    title="AI Employee Operating System",
    description="AI-powered HR self-service platform",
    version="1.0.0",
    docs_url="/api/docs",           # Swagger UI at /api/docs
    redoc_url="/api/redoc",         # ReDoc at /api/redoc
    openapi_url="/api/openapi.json", # OpenAPI schema
    lifespan=lifespan                # Lifecycle handler
)
```

**CORS Middleware (Cross-Origin Resource Sharing):**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # ["http://localhost:3000", ...]
    allow_credentials=True,                     # Allow cookies/auth headers
    allow_methods=["*"],                        # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],                        # Allow all headers
)
# This is REQUIRED for the React frontend (port 3000) to call
# the FastAPI backend (port 8000) without browser CORS errors.
```

**Global Exception Handler:**

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={
        "detail": "An internal server error occurred. Please try again."
    })
# Catches ANY unhandled exception and returns a clean JSON error
# instead of crashing the server or exposing stack traces.
```

**Router Registration:**

```python
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)      # → /api/v1/auth/...
app.include_router(salary.router, prefix=PREFIX)     # → /api/v1/salary/...
app.include_router(chat.router, prefix=PREFIX)       # → /api/v1/chat/...
# Each router handles its own URL sub-paths
```

---

### 5.2 `auth.py` — Authentication Endpoints

**File:** `backend/app/api/auth.py`

```python
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, login_data: LoginRequest, db = Depends(get_db)):
    # 1. Find employee by email
    employee = db.query(Employee).filter(
        Employee.email == login_data.email.lower().strip(),
        Employee.is_active == True
    ).first()

    # 2. Verify password
    if not employee or not verify_password(login_data.password, employee.password_hash):
        await log_action(db, None, "login_failed", ...)  # Audit failed attempt
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Update last login timestamp
    employee.last_login = datetime.now(timezone.utc)
    db.commit()

    # 4. Create JWT tokens
    token_data = {"sub": str(employee.id), "role": employee.role.name, "emp_id": employee.employee_id}
    access_token = create_access_token(token_data)      # Short-lived (8 hours)
    refresh_token = create_refresh_token(token_data)    # Long-lived (7 days)

    # 5. Audit successful login
    await log_action(db, employee.id, "login", ...)

    # 6. Return tokens + user info
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        employee_id=employee.id,
        role=employee.role.name,
        full_name=employee.full_name,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # In seconds
    )
```

---

### 5.3 `salary.py` — Salary API Endpoints

**File:** `backend/app/api/salary.py`

```python
@router.get("/slips/{slip_id}/download")
async def download_salary_slip(slip_id: int, current_user = Depends(get_current_user), ...):
    # 1. Find salary record (ensures employee can only access their own)
    record = db.query(SalaryRecord).filter(
        SalaryRecord.id == slip_id,
        SalaryRecord.employee_id == current_user.id  # Security: own records only
    ).first()

    # 2. Get or generate the PDF
    service = SalaryService(db)
    pdf_path = await service.get_or_generate_slip(record, current_user)

    # 3. Audit the download
    await log_action(db, current_user.id, "salary_slip_download", ...)

    # 4. Return PDF as downloadable file
    return FileResponse(pdf_path, media_type="application/pdf", filename=filename)


@router.post("/upload", dependencies=[Depends(require_hr_or_admin)])
async def upload_salary_data(records: List[SalaryUploadRecord], ...):
    # HR-only endpoint for bulk salary data upload
    service = SalaryService(db)
    result = await service.upload_salary_records(records, current_user)

    # Notify each employee their slip is ready
    for emp_id in result["processed_employees"]:
        await create_notification(db, emp_id, "Salary Slip Ready 💰", ...)
    
    return result
```

---

### 5.4 `chat.py` — AI Chat API Endpoints

**File:** `backend/app/api/chat.py`

```python
@router.post("/message", response_model=ChatResponseOut)
async def send_message(request: ChatMessageRequest, current_user = Depends(get_current_user), ...):
    # 1. Validate input
    if len(request.message) > 2000:
        raise HTTPException(400, "Message too long")

    # 2. Initialize the AI engine with employee context
    engine = ChatEngine(db, current_user)

    # 3. Process the message (this calls the LLM!)
    assistant_msg, session_id, tool_result = await engine.process_message(
        request.message,
        session_id=request.session_id  # Continue existing conversation
    )

    # 4. Build actions list for frontend rendering
    actions = None
    if tool_result and isinstance(tool_result, dict):
        action_type = tool_result.get("action")
        if action_type:
            actions = [{"type": action_type, "data": tool_result}]
        # Actions tell the frontend to render download buttons,
        # salary tables, document links, etc.

    # 5. Return structured response
    return ChatResponseOut(session_id=session_id, message=..., actions=actions)
```

---

## 6. Backend — AI Chatbot Module

### 6.1 `engine.py` — ChatEngine (The Brain)

**File:** `backend/app/chatbot/engine.py`

This is the **most important file** in the AI integration. It orchestrates the complete AI conversation flow with **tool calling**.

**System Prompt — The AI's personality and rules:**

```python
SYSTEM_PROMPT = """You are an AI HR Assistant for {company_name}...

Rules:
1. NEVER make up salary, leave, or employee data. Always use the provided tools.
2. For every HR-related request, call the appropriate tool first, then respond.
3. Identify the language (English, Hindi, Hinglish) and respond in the SAME language.
4. When applying for leave, confirm all details before calling apply_leave.
5. Always show monetary values in Indian Rupee format (₹).
...
Employee information: {employee_info}
Current date: {current_date}
"""
# The system prompt is DYNAMICALLY filled with:
# - Company name from settings
# - Employee's name, ID, department (personalized context)
# - Current date (for relative date parsing)
```

**ChatEngine Class — Initialization:**

```python
class ChatEngine:
    def __init__(self, db: Session, employee: Employee):
        self.db = db
        self.employee = employee
        self.tool_executor = ToolExecutor(db, employee)
        # ToolExecutor handles executing business logic when AI calls a tool
        self._client = None  # Lazy-loaded LLM client
```

**`_get_client()` — Lazy LLM Client Initialization:**

```python
def _get_client(self):
    if self._client is None:
        if settings.AI_PROVIDER == "groq":
            from groq import Groq
            self._client = Groq(api_key=settings.GROQ_API_KEY)
            # Uses Groq's cloud API (fast inference for Llama 3)
        else:
            from openai import OpenAI
            self._client = OpenAI(
                base_url=f"{settings.OLLAMA_BASE_URL}/v1",
                api_key="ollama"
            )
            # Uses local Ollama server with OpenAI-compatible API
    return self._client
```

**`process_message()` — The Main AI Pipeline (most critical function):**

```python
async def process_message(self, user_message, session_id=None):
    start_time = time.time()

    # STEP 1: Get or create chat session
    session = self._get_or_create_session(session_id)

    # STEP 2: Save user message to database
    self._save_message(session, "user", user_message)

    # STEP 3: Detect language (English/Hindi/Hinglish)
    lang = detect_language(user_message)
    # Appends language instruction to system prompt:
    # "The employee is writing in Hindi. Respond ONLY in Hindi."

    # STEP 4: Build conversation history (last 20 messages)
    history = self._get_conversation_history(session)

    # STEP 5: Construct messages array for the LLM
    messages = [{"role": "system", "content": system_content}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # STEP 6: FIRST LLM CALL — with tool definitions
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=TOOL_DEFINITIONS,      # All available tools the AI can call
        tool_choice="auto",          # AI decides when to use tools
        max_tokens=2048,
        temperature=0.3              # Low temperature = more deterministic
    )

    message = response.choices[0].message

    # STEP 7: Check if AI decided to call a tool
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        tool_name = tool_call.function.name        # e.g., "get_leave_balance"
        tool_args = json.loads(tool_call.function.arguments)  # e.g., {"year": 2026}

        # STEP 8: Execute the tool (runs real business logic!)
        tool_result = await self.tool_executor.execute(tool_name, tool_args)
        # Returns real data from the database

        # STEP 9: Send tool result back to AI
        messages.append({"role": "assistant", "tool_calls": [...]})
        messages.append({"role": "tool", "content": json.dumps(tool_result)})

        # STEP 10: SECOND LLM CALL — AI formulates human-friendly response
        final_response = client.chat.completions.create(
            model=model, messages=messages, max_tokens=1024
        )
        # AI takes the raw JSON data and writes a natural language response
    else:
        # Direct response without tool call (e.g., greeting, general question)
        final_response = message.content
```

**Error Handling & Fallback Intent Parser:**

```python
    except Exception as e:
        # When AI service is unavailable, use rule-based fallback
        if any(k in lower_msg for k in ["leave", "chutti", "vacation"]):
            # Parse intent manually
            leave_type = parse_leave_type(user_message)
            start, end, days = parse_date_range(user_message)
            if start and end:
                tool_result = await self.tool_executor.execute("apply_leave", {...})
                final_response = f"Leave request for {days} day(s) submitted."

        elif any(k in lower_msg for k in ["salary", "payslip", "slip"]):
            # Fetch last month's salary slip
            tool_result = await self.tool_executor.execute("get_salary_slip", {month, year})

        elif "api_key" in error_str.lower():
            final_response = "⚠️ AI service is not configured. Set up GROQ_API_KEY."
```

---

### 6.2 `tools.py` — AI Tool Calling Layer

**File:** `backend/app/chatbot/tools.py`

This file defines **what tools the AI can use** and **how they execute**.

**Tool Definitions (OpenAI function calling format):**

```python
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_leave_balance",
            "description": "Get the employee's leave balance for a given year...",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "The year to check..."},
                    "leave_type": {
                        "type": "string",
                        "enum": ["annual", "sick", "casual", ...]
                    }
                }
            }
        }
    },
    # ... 10 more tools defined similarly
]
# These definitions are sent to the LLM so it knows WHAT tools exist
# and what parameters each tool accepts.
```

**Complete List of 11 AI Tools:**

| Tool Name | Purpose |
|-----------|---------|
| `get_leave_balance` | Check remaining leave days |
| `apply_leave` | Submit a leave request |
| `get_leave_history` | View past leave requests |
| `cancel_leave` | Cancel a pending leave |
| `get_salary_slip` | Download salary slip PDF |
| `get_salary_history` | View all past salary records |
| `get_document` | Fetch a specific document |
| `list_documents` | List all available documents |
| `get_notifications` | Read notifications |
| `get_announcements` | View company announcements |
| `generate_pdf_letter` | Generate a custom PDF letter |

**ToolExecutor Class — Tool Dispatch:**

```python
class ToolExecutor:
    async def execute(self, tool_name: str, tool_args: Dict) -> Dict:
        tool_map = {
            "get_leave_balance": self._get_leave_balance,
            "apply_leave": self._apply_leave,
            "get_salary_slip": self._get_salary_slip,
            # ... all 11 tools mapped to their handler methods
        }
        handler = tool_map.get(tool_name)
        return await handler(**tool_args)
```

**Example Tool — `_apply_leave()`:**

```python
async def _apply_leave(self, start_date, end_date, leave_type, reason, ...):
    # Parse dates from string to date objects
    start = dt.strptime(start_date, "%Y-%m-%d").date()
    end = dt.strptime(end_date, "%Y-%m-%d").date()

    # Create Pydantic request schema
    request = LeaveApplyRequest(
        leave_type=leave_type, start_date=start, end_date=end,
        reason=reason, half_day=half_day, is_emergency=is_emergency
    )

    # Delegate to LeaveService (business logic layer)
    service = LeaveService(self.db)
    leave = await service.apply_leave(self.employee, request)

    # Notify HR about the new leave request
    hr_employees = self.db.query(Employee).filter(Employee.role_id == 2).all()
    for hr in hr_employees:
        await create_notification(self.db, hr.id, "New Leave Request", ...)

    return {
        "status": "success",
        "leave_id": leave.id,
        "total_days": float(leave.total_days),
        "note": "Your leave request has been submitted and is pending HR approval."
    }
```

---

### 6.3 `intent_parser.py` — Multilingual NLP Parser

**File:** `backend/app/chatbot/intent_parser.py`

A rule-based NLP module that parses dates, leave types, and languages from Hindi/English/Hinglish text. Used as a **fallback** when the AI service is unavailable.

**Multilingual Leave Type Detection:**

```python
LEAVE_TYPE_MAP = {
    "vacation": "annual", "holiday": "annual", "annual": "annual",
    "chutti": "annual", "छुट्टी": "annual",     # Hindi
    "sick": "sick", "bimaar": "sick", "बीमार": "sick",  # Hindi
    "shaadi": "marriage", "vivah": "marriage",    # Hindi
    "emergency": "emergency", "achaanak": "emergency",
}

def parse_leave_type(text: str) -> str:
    text_lower = text.lower()
    for keyword, leave_type in LEAVE_TYPE_MAP.items():
        if keyword in text_lower:
            return leave_type
    return "annual"  # Default if no keyword matched
```

**Relative Date Parsing (supports "kal", "parso", weekday names):**

```python
RELATIVE_DATE_MAP = {
    "today": 0, "aaj": 0, "आज": 0,              # Today
    "tomorrow": 1, "kal": 1, "कल": 1,            # Tomorrow
    "day after tomorrow": 2, "parso": 2,          # Day after tomorrow
}

def parse_date_from_text(text, today=None):
    if any(w in text_lower for w in ("tomorrow", "kal", "kl", "कल")):
        return today + timedelta(days=1)
    
    # Weekday names (English + Hindi)
    for day_name, day_num in WEEKDAY_MAP.items():
        if day_name in text_lower:
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0: days_ahead += 7
            return today + timedelta(days=days_ahead)
    
    # Date patterns: "15/06/2026", "15 June 2026", "June 15, 2026"
    date_patterns = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'(\d{1,2})\s+(?:of\s+)?([a-zA-Z]+)\s+(\d{4})',
    ]
```

**Language Detection:**

```python
def detect_language(text: str) -> str:
    hindi_chars = len(re.findall(r'[\u0900-\u097F]', text))
    # Counts Devanagari Unicode characters (range U+0900 to U+097F)
    total_chars = len(text.replace(" ", ""))
    hindi_ratio = hindi_chars / total_chars

    if hindi_ratio > 0.5:
        return "hindi"       # Mostly Devanagari script
    elif hindi_ratio > 0.1:
        return "hinglish"    # Mix of Hindi and English
    else:
        # Check for Hinglish keywords written in Roman script
        hinglish_words = ["kal", "aaj", "chutti", "mujhe", "kya", "hai"]
        if any(word in text.lower() for word in hinglish_words):
            return "hinglish"
        return "english"
```

---

## 7. Frontend — React Application

### 7.1 `main.tsx` — React DOM Entry Point

**File:** `frontend/src/main.tsx`

```tsx
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>        {/* Redux store wraps entire app */}
      <BrowserRouter>               {/* Enables client-side routing */}
        <App />                     {/* Root component */}
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
// Provider makes the Redux store available to all child components
// BrowserRouter enables <Route> and useNavigate() throughout the app
```

---

### 7.2 `App.tsx` — Application Router & Guards

**File:** `frontend/src/App.tsx`

```tsx
// React Query configuration for server state management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,              // Data is "fresh" for 30 seconds
      retry: 1,                       // Retry failed requests once
      refetchOnWindowFocus: false,    // Don't refetch when tab gains focus
    },
  },
});

// Authentication guard — redirects unauthenticated users to /login
function AuthGuard({ children }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Role-based guard — restricts routes to specific roles
function RoleGuard({ children, roles }) {
  const { user } = useAppSelector((s) => s.auth);
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

**Route Definitions:**

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
    <Route path="dashboard" element={<EmployeeDashboard />} />
    <Route path="chat" element={<ChatPage />} />
    <Route path="leave" element={<LeavePage />} />
    <Route path="salary" element={<SalaryPage />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="analytics" element={<AnalyticsPage />} />

    {/* HR-only routes */}
    <Route path="hr/salary-dispatcher" element={
      <RoleGuard roles={['hr']}><HRSalaryDispatcher /></RoleGuard>
    } />
    <Route path="hr/leave-approval" element={
      <RoleGuard roles={['hr']}><HRLeaveApproval /></RoleGuard>
    } />
  </Route>
</Routes>
```

---

### 7.3 `store/index.ts` — Redux Store Configuration

**File:** `frontend/src/store/index.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,    // Authentication state (user, tokens)
    ui: uiReducer,        // UI state (theme mode: light/dark)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
    // Disabled because we store non-serializable values (like dates)
});

// TypeScript types for typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom typed hooks — use these instead of plain useDispatch/useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

### 7.4 `store/authSlice.ts` — Authentication State

**File:** `frontend/src/store/authSlice.ts`

```typescript
// Initial state — reads tokens from localStorage for session persistence
const initialState: AuthState = {
  user: null,
  access_token: localStorage.getItem('access_token'),
  refresh_token: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  // !! converts truthy/falsy to boolean: "abc" → true, null → false
  isLoading: false,
};

// Async thunk for login — calls the API and dispatches success/failure
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(email, password);
      return res.data;  // Contains access_token, refresh_token, user info
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);

// Reducer handles the async states
.addCase(loginThunk.fulfilled, (state, action) => {
    const { access_token, refresh_token, ...userData } = action.payload;
    state.access_token = access_token;
    state.isAuthenticated = true;
    state.user = userData;
    localStorage.setItem('access_token', access_token);    // Persist for page refresh
    localStorage.setItem('refresh_token', refresh_token);
})
```

---

### 7.5 `services/api.ts` — Axios API Client

**File:** `frontend/src/services/api.ts`

This is the **central HTTP client** that handles all API communication, including automatic JWT attachment and token refresh.

**Axios Instance:**

```typescript
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',                              // Proxied by Vite to localhost:8000
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,                                   // 30 second timeout
});
```

**Request Interceptor — Auto-attach JWT:**

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    // Every request automatically includes the JWT in Authorization header
  }
  return config;
});
```

**Response Interceptor — Auto-refresh on 401:**

```typescript
api.interceptors.response.use(
  (response) => response,   // Pass through successful responses
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token expired! Try to refresh it.
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await axios.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken
      });
      // Store new tokens
      localStorage.setItem('access_token', response.data.access_token);
      // Retry the original request with the new token
      return api(originalRequest);
    }
    // Queue management prevents multiple simultaneous refresh attempts
  }
);
```

**API Helper Objects:**

```typescript
export const chatApi = {
  sendMessage: (message, sessionId?) => 
    api.post('/chat/message', { message, session_id: sessionId }),
  getSessions: () => api.get('/chat/sessions'),
  getSessionMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  archiveSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
};

export const salaryApi = {
  downloadSlip: async (salaryRecordId) => {
    const response = await api.get(`/salary/slips/${salaryRecordId}/download`, {
      responseType: 'blob'   // Binary response for PDF
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salary_slip_${salaryRecordId}.pdf`);
    link.click();            // Trigger browser download
    window.URL.revokeObjectURL(url);  // Clean up memory
  },
};
```

---

## 8. Infrastructure & Configuration

### 8.1 `docker-compose.yml` — Container Orchestration

**File:** `docker-compose.yml`

Defines three services that work together:

```yaml
services:
  mysql:
    image: mysql:8.0                              # Official MySQL 8.0 image
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}          # From .env file
      MYSQL_DATABASE: ${DB_NAME}                   # Auto-creates the database
    ports:
      - "3306:3306"                                # Expose MySQL port
    volumes:
      - mysql_data:/var/lib/mysql                  # Persist data across restarts
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]          # Wait until MySQL is ready
      interval: 10s
      retries: 10

  backend:
    build: ./backend                               # Builds from backend/Dockerfile
    ports:
      - "8000:8000"                                # FastAPI API server
    depends_on:
      mysql:
        condition: service_healthy                 # Waits for MySQL to be ready
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend                              # Builds from frontend/Dockerfile
    ports:
      - "3000:80"                                  # Nginx serves the built React app
    depends_on:
      - backend                                    # Starts after backend is running
```

---

### 8.2 `vite.config.ts` — Frontend Build Configuration

**File:** `frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],       // Enables React JSX transform
  server: {
    port: 3000,              // Development server runs on port 3000
    proxy: {
      '/api': {
        target: 'http://localhost:8000',   // Proxy API calls to FastAPI backend
        changeOrigin: true,
      }
    }
    // This proxy means frontend code can call "/api/v1/auth/login"
    // and Vite forwards it to "http://localhost:8000/api/v1/auth/login"
    // This avoids CORS issues during development.
  },
  build: {
    outDir: 'dist',          // Production build output directory
    sourcemap: false,        // No source maps in production
  }
})
```

---

### 8.3 `seed_data.py` — Demo Data Seeder

**File:** `backend/seed_data.py`

Creates initial demo data for development and testing. Run with `python seed_data.py`.

**What it creates:**
1. **3 Roles:** employee, hr, admin
2. **5 Departments:** Engineering, HR, Finance, Marketing, Operations
3. **8 Leave Policies:** annual (18 days), sick (12), casual (6), maternity (180), etc.
4. **3 Demo Users:** Admin, HR Manager, Employee
5. **Leave Balances:** For years 2025 and 2026
6. **17 Salary Records:** January 2025 through May 2026
7. **5 Leave Request History:** With various statuses
8. **4 Announcements:** Company news and events
9. **3 Notifications:** Leave approved, salary ready, etc.

**Demo Login Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techcorp.com | Admin@123 |
| HR Manager | hr@techcorp.com | HR@123456 |
| Employee | employee@techcorp.com | Emp@123456 |

---

*End of Code Explanation Document*
