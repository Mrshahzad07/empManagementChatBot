# 🚀 AI Employee Operating System (AI-EOS) — Project Presentation

> **Presentation Guide:** Complete project overview covering architecture, AI integration, tech stack, working model, and deployment.  
> **Version:** 1.0.0 | **Date:** June 2026  
> **Type:** Final Year / Professional Project Presentation

---

## 📑 Table of Contents

1. [Project Introduction](#1--project-introduction)
2. [Problem Statement & Motivation](#2--problem-statement--motivation)
3. [Technology Stack](#3--technology-stack)
4. [System Architecture](#4--system-architecture)
5. [AI Integration — Working Model](#5--ai-integration--working-model)
6. [Database Design (ER Model)](#6--database-design-er-model)
7. [Key Features & Modules](#7--key-features--modules)
8. [API Endpoints Reference](#8--api-endpoints-reference)
9. [Frontend Architecture](#9--frontend-architecture)
10. [Authentication & Security Flow](#10--authentication--security-flow)
11. [AI Chatbot — Deep Dive](#11--ai-chatbot--deep-dive)
12. [Step-by-Step Server Setup & Running Guide](#12--step-by-step-server-setup--running-guide)
13. [Docker Deployment Guide](#13--docker-deployment-guide)
14. [Testing & Demo Credentials](#14--testing--demo-credentials)
15. [Future Enhancements](#15--future-enhancements)
16. [Conclusion](#16--conclusion)

---

## 1. 🎯 Project Introduction

### What is AI-EOS?

**AI Employee Operating System (AI-EOS)** is a full-stack, AI-powered **HR self-service platform** that enables employees to manage their HR tasks through a conversational AI chatbot. Instead of navigating complex HR portals, employees simply chat in natural language (English, Hindi, or Hinglish) to:

- ✅ Apply for leaves
- ✅ Download salary slips (auto-generated PDFs)
- ✅ Check leave balances
- ✅ Access HR documents (offer letters, Form 16, etc.)
- ✅ Read company announcements
- ✅ Get notifications

### Project Highlights

| Feature | Description |
|---------|-------------|
| **AI-Powered Chatbot** | Groq Llama 3 LLM with function calling |
| **Multilingual Support** | English, Hindi, and Hinglish |
| **PDF Generation** | Dynamic salary slips using ReportLab |
| **Role-Based Access** | Employee, HR, and Admin roles |
| **Real-Time Tool Calling** | AI executes business logic in real-time |
| **Full-Stack** | React + FastAPI + MySQL/SQLite |
| **Containerized** | Docker Compose for one-command deployment |

---

## 2. 🔍 Problem Statement & Motivation

### The Problem

Traditional HR systems suffer from:
- **Complex UI** — Employees struggle with multi-step forms and navigating deep menus
- **Language Barrier** — Most HR portals are English-only, alienating a large portion of the Indian workforce
- **High HR Workload** — HR teams spend excessive time answering repetitive queries (leave balance, salary queries)
- **No Intelligent Assistance** — Existing systems are purely transactional with no smart guidance

### Our Solution

Build an **AI assistant** that:
1. Understands natural language in **3 languages** (English, Hindi, Hinglish)
2. **Executes real actions** (not just answers questions) — applies leave, generates PDFs
3. Works alongside a **premium web dashboard** for visual data access
4. Uses **LLM tool calling** to bridge conversational AI with database operations

---

## 3. 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Backend programming language |
| **FastAPI** | 0.115.5 | High-performance async web framework |
| **Uvicorn** | 0.32.1 | ASGI server for FastAPI |
| **SQLAlchemy** | 2.0.36 | ORM (Object-Relational Mapper) |
| **Pydantic** | 2.10.3 | Data validation & serialization |
| **PyMySQL** | 1.1.1 | MySQL database driver |
| **python-jose** | 3.3.0 | JWT token creation & verification |
| **passlib** | 1.7.4 | Bcrypt password hashing |
| **ReportLab** | 4.2.5 | Dynamic PDF generation |
| **Groq SDK** | 0.13.0 | Groq Cloud API client for Llama 3 |
| **OpenAI SDK** | 1.58.1 | Alternative LLM client (Ollama compatible) |
| **SlowAPI** | 0.1.9 | API rate limiting |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI component library |
| **TypeScript** | 5.7.3 | Static type checking |
| **Vite** | 6.0.5 | Build tool & dev server |
| **Material UI (MUI)** | 6.4.0 | Component library & design system |
| **Redux Toolkit** | 2.5.0 | Global state management |
| **React Query** | 5.62.0 | Server state & caching |
| **React Router** | 7.1.1 | Client-side routing |
| **Framer Motion** | 11.15.0 | Animations & transitions |
| **Recharts** | 2.15.4 | Data visualization charts |
| **Axios** | 1.7.9 | HTTP client for API calls |

### AI / ML Technologies

| Technology | Purpose |
|------------|---------|
| **Groq Cloud** | High-speed LLM inference API |
| **Llama 3.3 70B** | Large Language Model for conversation |
| **Tool Calling (Function Calling)** | AI executes database operations |
| **Intent Parsing** | Rule-based NLP for Hindi/Hinglish |
| **Language Detection** | Unicode analysis for multilingual support |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **MySQL 8.0** | Production relational database |
| **SQLite** | Local development database |
| **Nginx** | Frontend static file serving |

---

## 4. 📐 System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│                  React 18 + TypeScript + MUI                     │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │Dashboard │  │Chat Page │  │  Salary  │  │  Leave   │       │
│   │(Recharts)│  │(AI Chat) │  │  Page    │  │  Page    │       │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│        │              │              │              │             │
│   ┌────┴──────────────┴──────────────┴──────────────┴─────┐      │
│   │           Axios HTTP Client + JWT Interceptor          │      │
│   │           Redux Toolkit + React Query                  │      │
│   └───────────────────────┬───────────────────────────────┘      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS / REST API
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                               │
│               FastAPI (Python) + Uvicorn ASGI                     │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │                    API LAYER                             │     │
│   │  /auth  │  /salary  │  /leave  │  /chat  │  /documents  │     │
│   └────┬─────────┬──────────┬──────────┬─────────┬──────────┘     │
│        │         │          │          │         │                 │
│   ┌────┴─────────┴──────────┴──────────┴─────────┴──────────┐     │
│   │                  SERVICE LAYER                           │     │
│   │  SalaryService │ LeaveService │ AuditService │ NotifSvc  │     │
│   └────┬─────────────────────┬──────────────────────────────┘     │
│        │                     │                                    │
│   ┌────┴─────────────────────┴──────────────────────────────┐     │
│   │               AI CHATBOT MODULE                          │     │
│   │  ChatEngine  │  ToolExecutor  │  IntentParser            │     │
│   │       │              │                                   │     │
│   │       ▼              ▼                                   │     │
│   │  ┌─────────┐   ┌──────────┐                              │     │
│   │  │ Groq    │   │  11 AI   │                              │     │
│   │  │ Llama 3 │   │  Tools   │                              │     │
│   │  └─────────┘   └──────────┘                              │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                   │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │              DATA ACCESS LAYER (SQLAlchemy ORM)           │    │
│   │  Employee │ SalaryRecord │ LeaveRequest │ ChatSession     │    │
│   └──────────────────────────┬───────────────────────────────┘    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │   MySQL / SQLite  │
                     │    Database       │
                     └──────────────────┘
```

### Architecture Pattern: Layered Architecture

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **API Layer** | HTTP endpoint definitions, input validation | `api/*.py` |
| **Service Layer** | Business logic, calculations, rules | `services/*.py` |
| **AI Module** | LLM integration, tool calling, NLP | `chatbot/*.py` |
| **Data Layer** | ORM models, database access | `models/*.py` |
| **Core** | Configuration, security, dependencies | `core/*.py` |

---

## 5. 🤖 AI Integration — Working Model

### How the AI Chatbot Works (Step by Step)

This is the core innovation of the project. The AI doesn't just chat — it **executes real business actions**.

#### The Tool Calling Flow

```
Employee Types: "How many leaves do I have?"
         │
         ▼
┌─────────────────────┐
│  1. ChatEngine      │  ← Receives the message
│     receives msg    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  2. Language         │  ← Detects: English / Hindi / Hinglish
│     Detection        │     Uses Unicode analysis + keyword matching
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  3. Build Context    │  ← System prompt + employee info + conversation history
│     + History        │     Last 20 messages for multi-turn context
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  4. FIRST LLM CALL  │  ← Sends message + 11 tool definitions to Groq
│     (with tools)     │     AI decides: "I should call get_leave_balance"
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  5. Tool Execution   │  ← ToolExecutor queries REAL database
│     (Database Query) │     Returns: {annual: 11, sick: 9, casual: 4}
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  6. SECOND LLM CALL │  ← AI receives raw data, writes human response:
│     (format result)  │     "You have 11 annual, 9 sick, 4 casual leaves 🎉"
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  7. Save & Return    │  ← Saves to chat_messages table
│     Response         │     Returns formatted response to frontend
└────────┘
```

### AI Model Configuration

```
┌──────────────────────────────────────────────┐
│              AI MODEL DETAILS                 │
├──────────────────────────────────────────────┤
│  Provider:    Groq Cloud                      │
│  Model:       Llama 3.3 70B Versatile         │
│  Temperature: 0.3 (low = more deterministic)  │
│  Max Tokens:  2048 (first call)               │
│               1024 (second call)              │
│  Tool Choice: "auto" (AI decides when to use) │
│  Fallback:    Ollama (local, OpenAI-compat.)  │
└──────────────────────────────────────────────┘
```

### The 11 AI Tools (Function Calling)

The AI has access to 11 tools that it can invoke based on user intent:

| # | Tool Name | Trigger Examples | What It Does |
|---|-----------|------------------|-------------|
| 1 | `get_leave_balance` | "How many leaves?", "kitni chutti?" | Queries leave_balance table |
| 2 | `apply_leave` | "I need leave tomorrow", "kal chutti chahiye" | Creates leave request + notifies HR |
| 3 | `get_leave_history` | "Show my past leaves", "leave status" | Returns leave request records |
| 4 | `cancel_leave` | "Cancel my leave #5", "chutti cancel karo" | Cancels pending leave + restores balance |
| 5 | `get_salary_slip` | "March ka slip do", "payslip for May" | Returns download link for PDF |
| 6 | `get_salary_history` | "2025 ke saare slips", "salary history" | Lists all salary records |
| 7 | `get_document` | "Offer letter chahiye", "Form 16" | Fetches specific document |
| 8 | `list_documents` | "Show my documents", "mere documents" | Lists all employee documents |
| 9 | `get_notifications` | "Any notifications?", "koi update?" | Returns recent notifications |
| 10 | `get_announcements` | "Company news", "office updates" | Returns active announcements |
| 11 | `generate_pdf_letter` | "Write a sick leave application" | Generates custom PDF document |

### Multilingual Support Model

```
┌─────────────────────────────────────────────┐
│           LANGUAGE DETECTION FLOW            │
├─────────────────────────────────────────────┤
│                                              │
│  Input: "मुझे कल छुट्टी चाहिए"                │
│         │                                    │
│         ▼                                    │
│  Count Devanagari chars (U+0900 to U+097F)   │
│  hindi_chars = 14, total = 16                │
│  ratio = 14/16 = 0.875                       │
│         │                                    │
│         ▼                                    │
│  ratio > 0.5 → Language = "hindi"            │
│         │                                    │
│         ▼                                    │
│  System Prompt += "Respond ONLY in Hindi"    │
│         │                                    │
│         ▼                                    │
│  AI Response: "आपकी छुट्टी का अनुरोध..."       │
│                                              │
├─────────────────────────────────────────────┤
│  Input: "Kal mujhe chutti chahiye"           │
│         │                                    │
│         ▼                                    │
│  Hindi chars = 0, ratio = 0                  │
│  Check Hinglish keywords: "kal" ✓            │
│  Language = "hinglish"                       │
│         │                                    │
│         ▼                                    │
│  AI Response: "Aapki leave request submit    │
│  ho gayi hai!"                               │
└─────────────────────────────────────────────┘
```

### Fallback System (When AI is Down)

If the Groq API is unavailable, the system falls back to a **rule-based intent parser**:

```
User says: "I need leave tomorrow for 2 days"
         │
         ▼
┌─ AI Service Error ─┐
│  Groq API timeout  │
└────────┬───────────┘
         │
         ▼
┌─ Keyword Matching ─────────────┐
│  "leave" detected → Leave flow │
│  parse_leave_type("...") → "annual" │
│  parse_date_range("...") → (tomorrow, tomorrow+1, 2) │
│  → Execute apply_leave tool directly │
└─────────────────────────────────┘
```

---

## 6. 🗄️ Database Design (ER Model)

### Entity-Relationship Diagram

```
┌──────────────┐     ┌─────────────┐     ┌───────────────┐
│   ROLES      │     │ DEPARTMENTS │     │  EMPLOYEES    │
├──────────────┤     ├─────────────┤     ├───────────────┤
│ id (PK)      │◄───┐│ id (PK)     │◄───┐│ id (PK)       │
│ name         │    ││ name        │    ││ employee_id   │
│ description  │    ││ code        │    ││ email         │
└──────────────┘    │└─────────────┘    ││ password_hash │
                    │                   ││ first_name    │
                    │                   ││ last_name     │
                    └───────────────────┤│ department_id │──── FK
                                        ││ role_id       │──── FK
                                        ││ designation   │
                                        │└───────┬───────┘
                                        │        │
               ┌────────────────────────┼────────┼────────────────────┐
               │                        │        │                    │
               ▼                        ▼        ▼                    ▼
    ┌───────────────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐
    │  LEAVE_BALANCE    │  │  LEAVE_REQUESTS  │  │ SALARY_RECORDS  │  │ CHAT_SESSIONS│
    ├───────────────────┤  ├──────────────────┤  ├─────────────────┤  ├──────────────┤
    │ id (PK)           │  │ id (PK)          │  │ id (PK)         │  │ id (PK,UUID) │
    │ employee_id (FK)  │  │ employee_id (FK) │  │ employee_id (FK)│  │ employee_id  │
    │ year              │  │ leave_type       │  │ month           │  │ title        │
    │ leave_type        │  │ start_date       │  │ year            │  │ message_count│
    │ allocated         │  │ end_date         │  │ basic_salary    │  └──────┬───────┘
    │ used              │  │ total_days       │  │ hra             │         │
    │ pending           │  │ reason           │  │ net_salary      │         ▼
    │ remaining (calc)  │  │ status           │  │ payment_status  │  ┌──────────────┐
    └───────────────────┘  │ reviewed_by (FK) │  │ payment_date    │  │CHAT_MESSAGES │
                           │ created_via      │  └────────┬────────┘  ├──────────────┤
                           └──────────────────┘           │           │ id (PK)      │
                                                          ▼           │ session_id   │
                                                ┌─────────────────┐   │ role         │
                                                │  SALARY_SLIPS   │   │ content      │
                                                ├─────────────────┤   │ tool_name    │
                                                │ id (PK)         │   │ tool_args    │
                                                │ salary_record_id│   │ tool_result  │
                                                │ file_path       │   │ tokens_used  │
                                                │ verification_id │   └──────────────┘
                                                │ download_count  │
                                                └─────────────────┘
```

### Key Table Descriptions

| Table | Records | Key Fields |
|-------|---------|------------|
| `employees` | All employees | Personal info, bank details, PAN, PF |
| `salary_records` | Monthly salary | Earnings, deductions, attendance |
| `salary_slips` | Generated PDFs | File path, download count, verification ID |
| `leave_balance` | Per-year leave quotas | Allocated, used, pending, remaining |
| `leave_requests` | Each leave application | Dates, type, status, reviewer |
| `leave_policies` | Company leave rules | Max days, notice period, carry-forward |
| `chat_sessions` | Conversation containers | Title, message count, context |
| `chat_messages` | Individual messages | Role, content, tool data, tokens |
| `documents` | HR documents | Type, file path, status |
| `notifications` | In-app alerts | Title, type, read status |
| `announcements` | Company-wide news | Category, priority, pinned |
| `audit_logs` | All system actions | Action, entity, IP, old/new values |

---

## 7. 🌟 Key Features & Modules

### Module 1: AI Chatbot (Natural Language HR)

- **Multi-turn conversations** with context memory (last 20 messages)
- **11 executable tools** for real HR actions
- **Trilingual** — English, Hindi, Hinglish
- **Fallback parser** when AI is offline
- **Session management** — multiple conversations, archiving

### Module 2: Leave Management

- Apply, cancel, approve, reject leaves
- **8 leave types** with configurable policies
- Auto-balance tracking (allocated, used, pending, remaining)
- Half-day and emergency leave support
- Overlap detection prevents double-booking
- Auto-approve for HR users

### Module 3: Salary Management

- **PDF salary slip generation** with professional formatting
- Company branding (logo, CIN, colors)
- Detailed breakdown: earnings, deductions, attendance, net pay
- Bulk download as ZIP
- HR bulk upload endpoint
- Monthly register view for HR

### Module 4: Document Management

- 10 document types (offer letter, Form 16, etc.)
- AI-generated PDF letters on demand
- Download tracking and versioning
- Template support

### Module 5: Analytics Dashboard

- Employee-facing: leave summary, salary trends
- HR-facing: department analytics, leave patterns
- Built with Recharts data visualization

### Module 6: Notification System

- Real-time in-app notifications
- Types: leave updates, salary credits, announcements
- Priority levels: low, medium, high, urgent
- Mark as read / mark all read

### Module 7: Admin Panel

- Employee CRUD operations
- Department management
- Audit log viewer (compliance)
- Announcement management

---

## 8. 📡 API Endpoints Reference

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Email/password login, returns JWT | ❌ |
| POST | `/refresh` | Refresh expired access token | ❌ |
| POST | `/logout` | Invalidate session (audit log) | ✅ |
| POST | `/change-password` | Update password | ✅ |
| GET | `/me` | Get current user profile | ✅ |

### Salary (`/api/v1/salary`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/slips` | List salary records | ✅ Employee |
| GET | `/slips/{id}/download` | Download PDF salary slip | ✅ Employee |
| POST | `/bulk-download` | Download ZIP of multiple slips | ✅ Employee |
| GET | `/summary` | Salary statistics | ✅ Employee |
| POST | `/upload` | Bulk upload salary data | ✅ HR Only |
| GET | `/monthly-register` | View all employees' salary | ✅ HR Only |
| PUT | `/{id}/pay` | Mark salary as paid | ✅ HR Only |

### Leave (`/api/v1/leave`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get leave balances | ✅ Employee |
| POST | `/apply` | Apply for leave | ✅ Employee |
| GET | `/history` | Leave request history | ✅ Employee |
| GET | `/pending` | Pending requests (for HR) | ✅ HR Only |
| PUT | `/{id}/approve` | Approve leave | ✅ HR Only |
| PUT | `/{id}/reject` | Reject leave | ✅ HR Only |
| DELETE | `/{id}/cancel` | Cancel own leave | ✅ Employee |

### Chat (`/api/v1/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/message` | Send message to AI | ✅ Employee |
| GET | `/sessions` | List chat sessions | ✅ Employee |
| GET | `/sessions/{id}/messages` | Get session messages | ✅ Employee |
| DELETE | `/sessions/{id}` | Archive session | ✅ Employee |

---

## 9. 💻 Frontend Architecture

### Component Hierarchy

```
<Provider store={store}>              ← Redux Provider
  <BrowserRouter>                     ← React Router
    <QueryClientProvider>             ← React Query Provider
      <ThemeProvider theme={theme}>   ← MUI Theming (Light/Dark)
        <CssBaseline />               ← Global CSS reset
        <Toaster />                   ← Toast notifications
        <Routes>
          <Route path="/login" → LoginPage />
          <Route path="/" → AuthGuard + Layout>
            ├── /dashboard → EmployeeDashboard
            ├── /chat → ChatPage (AI Chat)
            ├── /leave → LeavePage
            ├── /salary → SalaryPage
            ├── /documents → DocumentsPage
            ├── /analytics → AnalyticsPage
            ├── /hr/salary-dispatcher → [HR] HRSalaryDispatcher
            ├── /hr/salary-payments → [HR] HRSalaryPayments
            └── /hr/leave-approval → [HR] HRLeaveApproval
          </Route>
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
</Provider>
```

### State Management Strategy

```
┌────────────────────────────────────────┐
│          STATE MANAGEMENT               │
├────────────────────────────────────────┤
│                                        │
│  Redux Toolkit (Synchronous State)     │
│  ├── auth: user, tokens, isAuth        │
│  └── ui: themeMode (light/dark)        │
│                                        │
│  React Query (Async Server State)      │
│  ├── Leave balances (cached 30s)       │
│  ├── Salary records (cached 30s)       │
│  ├── Notifications (auto-refetch)      │
│  └── Chat sessions (on-demand)         │
│                                        │
│  Why Both?                             │
│  • Redux = client state (who am I?)    │
│  • React Query = server state          │
│    (with caching, retries, stale data) │
└────────────────────────────────────────┘
```

### Key Frontend Technologies in Action

| Feature | Technology Used |
|---------|----------------|
| UI Components | Material UI v6 (Buttons, Tables, Dialogs, etc.) |
| Styling | Emotion CSS-in-JS + MUI theming |
| Animations | Framer Motion (page transitions, micro-animations) |
| Charts | Recharts (salary trends, leave analytics) |
| HTTP Calls | Axios with JWT auto-attach interceptor |
| PDF Downloads | Blob URL generation + auto-download trigger |
| Toast Alerts | react-hot-toast |
| Date Handling | date-fns v4 |

---

## 10. 🔐 Authentication & Security Flow

### Login Flow (Sequence Diagram)

```
User                Frontend              Backend                Database
 │                    │                      │                      │
 │  Enter email/pass  │                      │                      │
 │───────────────────>│                      │                      │
 │                    │  POST /auth/login    │                      │
 │                    │─────────────────────>│                      │
 │                    │                      │  Query employees     │
 │                    │                      │─────────────────────>│
 │                    │                      │  Employee record     │
 │                    │                      │<─────────────────────│
 │                    │                      │                      │
 │                    │                      │  verify_password()   │
 │                    │                      │  (bcrypt compare)    │
 │                    │                      │                      │
 │                    │                      │  create_access_token()│
 │                    │                      │  create_refresh_token()│
 │                    │                      │                      │
 │                    │                      │  log_action("login") │
 │                    │                      │─────────────────────>│
 │                    │                      │                      │
 │                    │  {access_token,      │                      │
 │                    │   refresh_token,     │                      │
 │                    │   role, name}        │                      │
 │                    │<─────────────────────│                      │
 │                    │                      │                      │
 │                    │  localStorage.set()  │                      │
 │                    │  Redux: setAuth()    │                      │
 │                    │                      │                      │
 │  Redirect to       │                      │                      │
 │  /dashboard        │                      │                      │
 │<───────────────────│                      │                      │
```

### JWT Token Structure

```json
{
  "sub": "3",                    // Employee internal ID
  "role": "employee",            // Role for frontend guards
  "emp_id": "EMP003",            // Business employee ID
  "exp": 1719776400,             // Expiration timestamp
  "type": "access"               // Distinguishes access vs. refresh
}
```

### Auto-Refresh Flow

```
Request → 401 Unauthorized
     │
     ▼
┌─ Is Refreshing? ─┐
│   NO              │ YES → Queue this request
│                   │       (wait for refresh to complete)
└────────┬──────────┘
         ▼
POST /auth/refresh {refresh_token}
         │
         ├── Success → Store new tokens, retry original request
         │
         └── Failure → Clear tokens, redirect to /login
```

---

## 11. 🧠 AI Chatbot — Deep Dive

### Conversation Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI CONVERSATION PIPELINE                      │
│                                                                  │
│  User Message ──► Language Detection ──► Context Building ──►    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              GROQ LLAMA 3 (FIRST CALL)                    │   │
│  │                                                            │   │
│  │  Input: System Prompt + History + User Message + 11 Tools  │   │
│  │  Output: Either a text response OR a tool_call             │   │
│  └──────┬──────────────────────────────────┬────────────────┘   │
│         │                                  │                     │
│    [No Tool Call]                    [Tool Call Detected]         │
│         │                                  │                     │
│         ▼                                  ▼                     │
│    Direct Response              Execute Tool (Real DB Query)     │
│    "Hello! How can                       │                       │
│     I help you?"                         ▼                       │
│                              ┌──────────────────────┐            │
│                              │  GROQ LLAMA 3        │            │
│                              │  (SECOND CALL)       │            │
│                              │                      │            │
│                              │  Input: Tool Result  │            │
│                              │  Output: Formatted   │            │
│                              │  human response      │            │
│                              └──────────┬───────────┘            │
│                                         │                        │
│                                         ▼                        │
│                              "You have 11 annual,                │
│                               9 sick, and 4 casual               │
│                               leaves remaining 🎉"               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Example: Complete AI Interaction

**User says:** "Kal se 3 din ki sick leave chahiye, mujhe bukhar hai"

```
Step 1: Language Detection
  → Hindi chars: 0, Hinglish keywords: ["kal", "chahiye", "mujhe"]
  → Result: "hinglish"

Step 2: System Prompt includes:
  "Employee: Rahul Kumar, ID: EMP003, Dept: Engineering"
  "Current date: Wednesday, 18 June 2026"
  "Respond ONLY in Hinglish"

Step 3: First LLM Call → AI decides to call tool:
  {
    "name": "apply_leave",
    "arguments": {
      "start_date": "2026-06-19",
      "end_date": "2026-06-21",
      "leave_type": "sick",
      "reason": "Bukhar hai (fever)"
    }
  }

Step 4: ToolExecutor runs apply_leave()
  → Validates dates (not in past ✅)
  → Counts working days: 3
  → Checks policy: max consecutive = 7 ✅
  → Checks balance: 9 remaining ≥ 3 ✅
  → No overlapping leaves ✅
  → Creates LeaveRequest record
  → Notifies HR
  → Returns: {"status": "success", "leave_id": 42, "total_days": 3}

Step 5: Second LLM Call → AI formats response:
  "Aapki 3 din ki sick leave request submit ho gayi hai! 🏥
   📅 Date: 19 June se 21 June 2026
   📋 Leave ID: #42
   ⏳ Status: Pending (HR approval ka wait karein)
   🙏 Jaldi theek ho jaiye!"
```

---

## 12. 🖥️ Step-by-Step Server Setup & Running Guide

### Prerequisites

Before starting, ensure you have installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Python | 3.11+ | python.org |
| Node.js | 18+ | nodejs.org |
| Git | Latest | git-scm.com |
| MySQL | 8.0 (optional, SQLite for dev) | mysql.com |
| Docker | Latest (optional) | docker.com |

---

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd chatbot
```

---

### Step 2: Backend Setup

#### 2.1 Create a Python Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (macOS/Linux)
source venv/bin/activate
```

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs 22 packages including:
- `fastapi`, `uvicorn` — Web framework & server
- `sqlalchemy`, `pymysql` — Database ORM & driver
- `groq`, `openai` — AI model clients
- `reportlab` — PDF generation
- `python-jose`, `passlib` — JWT & password security

#### 2.3 Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings
```

**Key `.env` settings to configure:**

```env
# Database (SQLite for local development)
DATABASE_URL=sqlite:///./ai_eos.db

# AI Provider — Get free API key from https://console.groq.com
AI_PROVIDER=groq
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
GROQ_MODEL=llama-3.1-8b-instant

# Company details (shown on salary slips)
COMPANY_NAME=Your Company Name
```

#### 2.4 Seed the Database with Demo Data

```bash
python seed_data.py
```

**Output:**
```
🌱 Starting seed...
  ✅ Roles created
  ✅ Departments created
  ✅ Leave policies created
  ✅ Employees created
  ✅ Leave balances created
  ✅ Salary records created

🎉 Seed data created successfully!

📋 Login Credentials:
  ┌─────────────────────────────────────────────┐
  │  Admin:    admin@techcorp.com / Admin@123    │
  │  HR:       hr@techcorp.com / HR@123456       │
  │  Employee: employee@techcorp.com / Emp@123456│
  └─────────────────────────────────────────────┘
```

#### 2.5 Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**What happens:**
1. FastAPI app initializes
2. Upload directories are created (`uploads/salary_slips`, `uploads/documents`, etc.)
3. Database tables are auto-created via `Base.metadata.create_all()`
4. All 8 API routers are registered under `/api/v1`
5. Server starts listening on `http://localhost:8000`

**Verify:** Open `http://localhost:8000/api/docs` for Swagger UI.

---

### Step 3: Frontend Setup

#### 3.1 Install Node.js Dependencies

```bash
cd frontend
npm install
```

This installs React, MUI, Redux, Axios, Framer Motion, Recharts, and all other dependencies.

#### 3.2 Start the Development Server

```bash
npm run dev
```

**Output:**
```
VITE v6.0.5  ready in 350 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.x:3000/
```

**How Vite proxy works:**
- Frontend runs on port `3000`
- API calls to `/api/*` are automatically proxied to `http://localhost:8000`
- This eliminates CORS issues during development

---

### Step 4: Access the Application

Open `http://localhost:3000` in your browser.

**Login with demo credentials:**

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| Employee | employee@techcorp.com | Emp@123456 | Self-service + AI Chat |
| HR Manager | hr@techcorp.com | HR@123456 | + Leave approval, salary dispatch |
| Admin | admin@techcorp.com | Admin@123 | + Employee management, audit logs |

---

### Step 5: Test the AI Chatbot

1. Login as **Employee** (employee@techcorp.com)
2. Navigate to **Chat** page
3. Try these prompts:
   - `"How many leaves do I have?"`
   - `"Show me my salary slip for May 2026"`
   - `"I need leave tomorrow for fever"`
   - `"Meri salary history dikhao"` (Hinglish)
   - `"Write me a sick leave application letter"`

---

## 13. 🐳 Docker Deployment Guide

### One-Command Deployment

```bash
# From the project root directory
docker-compose up -d
```

This starts 3 containers:

| Container | Port | Service |
|-----------|------|---------|
| `ai_eos_mysql` | 3306 | MySQL 8.0 database |
| `ai_eos_backend` | 8000 | FastAPI backend |
| `ai_eos_frontend` | 3000 | Nginx + React frontend |

### Check Container Status

```bash
docker-compose ps
docker-compose logs backend    # View backend logs
docker-compose logs -f mysql   # Follow MySQL logs
```

### Stop All Containers

```bash
docker-compose down             # Stop containers
docker-compose down -v          # Stop + remove volumes (deletes data)
```

---

## 14. 🧪 Testing & Demo Credentials

### Demo Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Arjun Sharma | admin@techcorp.com | Admin@123 | System Administrator |
| Priya Mehta | hr@techcorp.com | HR@123456 | HR Manager |
| Rahul Kumar | employee@techcorp.com | Emp@123456 | Software Engineer |

### Pre-loaded Demo Data

- **17 Salary Records** — Jan 2025 to May 2026 for Rahul Kumar
- **5 Leave Requests** — Mix of approved, rejected statuses
- **Leave Balances** — 2025 and 2026 with realistic usage
- **4 Announcements** — Company news, events
- **3 Notifications** — Leave approval, salary credit alerts

### Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Employee Login | Login as employee@techcorp.com | Dashboard with stats |
| AI Chat - Leave | Type "I need leave tomorrow" | AI asks for reason, then applies |
| AI Chat - Salary | Type "Show me May 2026 salary slip" | Download link provided |
| HR Salary Upload | Login as HR, go to Salary Dispatcher | Upload salary data for employees |
| HR Leave Approval | Login as HR, go to Leave Approval | Approve/reject pending requests |
| Multilingual Chat | Type "Kal mujhe chutti chahiye" | Response in Hinglish |

### API Testing (via Swagger)

1. Open `http://localhost:8000/api/docs`
2. Click **Authorize** → Enter JWT token
3. Test any endpoint directly from the browser

---

## 15. 🔮 Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| **RAG (Retrieval-Augmented Generation)** | Feed company policy PDFs into LLM context for policy-specific answers |
| **Voice Interface** | Speech-to-text for hands-free HR queries |
| **WhatsApp Integration** | Connect chatbot to WhatsApp Business API |
| **Advanced Analytics** | ML-based leave pattern prediction |
| **Payroll Integration** | Direct bank transfer API integration |
| **Mobile App** | React Native mobile application |
| **Email Notifications** | SMTP integration for leave approvals |
| **SSO Integration** | Google/Microsoft OAuth for enterprise login |

---

## 16. 📝 Conclusion

The **AI Employee Operating System** demonstrates how modern AI (LLMs with tool calling) can transform traditional HR systems into intelligent, conversational platforms. Key innovations include:

1. **LLM Tool Calling** — The AI doesn't just chat; it executes real database operations
2. **Multilingual NLP** — Serves India's diverse workforce in English, Hindi, and Hinglish
3. **Professional PDF Generation** — Dynamic, branded salary slips
4. **Layered Architecture** — Clean separation of concerns for maintainability
5. **Production-Ready** — JWT auth, audit logging, Docker deployment, rate limiting

### Technical Achievement Summary

| Metric | Value |
|--------|-------|
| Total Backend Files | 25+ Python files |
| Total Frontend Files | 20+ TSX/TS files |
| Database Tables | 12 tables |
| API Endpoints | 30+ REST endpoints |
| AI Tools | 11 function-callable tools |
| Languages Supported | 3 (English, Hindi, Hinglish) |
| Leave Types | 8 configurable types |
| Lines of Code | ~5,000+ |

---

> **Thank you!** This project showcases the intersection of AI, full-stack development, and real-world HR automation. Questions? Let's discuss! 🚀

---

*End of Presentation Document*
