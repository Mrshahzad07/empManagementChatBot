# AI Employee Operating System (AI-EOS)

Welcome to the **AI Employee Operating System**, an AI-powered HR self-service platform designed to streamline human resource management, employee self-service, leave processing, salary dispatching, and automated support through conversational AI.

This repository consists of a tightly integrated full-stack application. It uses a modern web development stack to deliver a fast, scalable, and responsive user experience while ensuring secure, robust data management on the backend.

---

## 📁 Project Structure

The project is divided into two main directories:

- `/frontend`: The user interface of the application, built with React, Vite, and TypeScript.
- `/backend`: The REST API server and core business logic, built with Python, FastAPI, and SQLAlchemy.

```text
d:\chatbot\
├── backend/
│   ├── app/
│   │   ├── api/            # API routing and endpoints (Auth, Leave, Salary, Chat, etc.)
│   │   ├── core/           # Configuration, Database connection, Security
│   │   ├── chatbot/        # AI logic integration (Groq/OpenAI)
│   │   ├── database/       # Database migrations & seeds
│   │   ├── models/         # SQLAlchemy ORM models (Database schema)
│   │   ├── schemas/        # Pydantic models for request/response validation
│   │   └── services/       # Core business logic (Salary calculation, Leave processing, Audits)
│   ├── tests/              # Unit and integration tests
│   ├── uploads/            # Local storage for documents, logos, and salary slips
│   ├── main.py             # FastAPI application entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components (Buttons, Modals, Forms)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Application views (Dashboard, Chat, Salary, Leave)
│   │   ├── services/       # API integration using Axios and React Query
│   │   ├── store/          # Global state management using Redux Toolkit
│   │   ├── theme/          # Material UI (MUI) custom theming
│   │   ├── types/          # TypeScript interfaces and types
│   │   └── utils/          # Helper functions and formatters
│   ├── package.json        # Node.js dependencies and scripts
│   └── vite.config.ts      # Vite bundler configuration
│
└── docker-compose.yml      # Container orchestration
```

---

## 🛠️ Tech Stack Used

### **Backend**
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast, high-performance web framework for building APIs with Python based on standard Python type hints.
*   **Server**: **Uvicorn** - An ASGI web server implementation for Python.
*   **Database ORM**: **SQLAlchemy 2.0** - The Python SQL toolkit and Object Relational Mapper.
*   **Database**: **MySQL** (via `pymysql`) - Relational database for storing employee data, leaves, salaries, etc.
*   **Data Validation**: **Pydantic V2** - Data parsing and validation library.
*   **Authentication**: **JWT** (JSON Web Tokens), `python-jose`, and `passlib[bcrypt]` for secure password hashing.
*   **AI Integration**: **Groq** and **OpenAI** for powering the AI Chatbot to assist employees with policies and HR queries.
*   **File Generation**: **ReportLab** for dynamically generating PDF salary slips.
*   **Rate Limiting**: **SlowAPI** to protect endpoints from abuse.

### **Frontend**
*   **Library**: [React 18](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/) - Extremely fast frontend tooling.
*   **Language**: **TypeScript** for static type checking and better developer experience.
*   **UI Framework**: **Material UI (MUI) v6** - Comprehensive suite of UI tools for styling, along with **Emotion**.
*   **State Management**: **Redux Toolkit** for global application state, paired with **React Query (TanStack Query)** for asynchronous state management and caching of API requests.
*   **Routing**: **React Router v7** for declarative routing.
*   **Animations**: **Framer Motion** for smooth and dynamic UI micro-animations.
*   **Data Visualization**: **Recharts** for building the analytics dashboard.
*   **HTTP Client**: **Axios** for connecting to the FastAPI backend.

---

## ⚙️ Backend Architecture & Important Functions

The backend follows a layered architectural pattern, promoting separation of concerns.

### 1. The Entry Point (`backend/app/main.py`)
This file initializes the FastAPI application.
*   **`lifespan`**: Manages the startup and shutdown sequence. It ensures critical directories (for salary slips, documents, etc.) exist and verifies the database connection and tables.
*   **CORS Middleware**: Configured to allow cross-origin requests from the frontend.
*   **Global Exception Handler**: Catches unhandled server errors to return graceful JSON responses instead of crashing.
*   **Router Inclusion**: All modules (`auth`, `leave`, `salary`, `documents`, `chat`, etc.) are mounted under the `/api/v1` prefix.

### 2. API Layer (`backend/app/api/`)
Defines the HTTP endpoints, input/output validation (via Pydantic), and delegates complex work to the Service layer.

*   **`auth.py`**: Handles `/login`, `/register`, and token refresh. It verifies credentials against the database and issues JWTs.
*   **`salary.py`**: Contains endpoints for HR to process payroll, generate salary slips, and for employees to download their slips.
*   **`leave.py`**: Endpoints for applying for leave, viewing leave balances, and for managers/HR to approve or reject leave requests.
*   **`chat.py`**: The conversational interface endpoint where user prompts are sent to the AI service.

### 3. Service Layer (`backend/app/services/`)
This is where the core business logic resides, keeping the API layer clean.

*   **`salary_service.py`**:
    *   *Important Function*: **`generate_salary_slip`** - Computes deductions, taxes, and net pay. It then leverages ReportLab to draw a formatted PDF file and saves it to the local disk.
    *   *Important Function*: **`process_payroll`** - A batch operation that loops through active employees and generates their monthly salary records.
*   **`leave_service.py`**:
    *   *Important Function*: **`calculate_leave_balance`** - Evaluates the number of accrued leaves vs. taken leaves based on company policy.
    *   *Important Function*: **`approve_leave_request`** - Updates the leave status, deducts the balance, and triggers a notification to the employee.
*   **`audit_service.py`**:
    *   Logs critical actions (like salary dispatch or policy changes) to maintain a secure audit trail.

### 4. Database Models (`backend/app/models/`)
Defines the SQLAlchemy classes that map directly to MySQL tables.
*   **`employee.py`**: Contains the `Employee` model storing personal info, department ID, and role.
*   **`salary.py`**: Contains the `SalaryRecord` model which ties an employee to a specific month's payout.
*   **`leave.py`**: Contains `LeaveRequest` and `LeaveBalance` tracking employee time off.

### 5. Chatbot Module (`backend/app/chatbot/`)
*   Integrates with LLMs (Large Language Models) via the Groq or OpenAI APIs.
*   It utilizes Retrieval-Augmented Generation (RAG) concepts by fetching company policies from the database/filesystem and appending them to the context window so the AI can answer company-specific HR questions accurately.

---

## 💻 Frontend Architecture

The frontend is a Single Page Application (SPA) structured around features and scalable component design.

*   **`src/pages/`**: Contains the main views.
    *   `Dashboard` - Shows analytics (Recharts) and quick stats.
    *   `Salary` - HR views for dispatching salary and Employee views for downloading slips.
    *   `ChatPage` - The interface for the AI assistant.
*   **State Management Flow**:
    *   **React Query** is used to fetch and cache data (like fetching the list of employees or leave balances). It automatically handles loading states, errors, and background refetching.
    *   **Redux Toolkit** is used for synchronous global state, such as storing the currently authenticated user's session data and theme preferences (light/dark mode).
*   **Styling Strategy**: Uses MUI's robust component library combined with custom theme overrides (`src/theme/`) to ensure a premium, visually appealing user interface with smooth transitions powered by Framer Motion.

## 🚀 How to Run the Application

1. **Start the Database**:
   You can run MySQL locally or use Docker.
   ```bash
   docker-compose up -d
   ```

2. **Run Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

*(Ensure you have configured your `.env` files in both directories based on `.env.example`)*
