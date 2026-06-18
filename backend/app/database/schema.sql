-- ============================================
-- AI Employee Operating System - MySQL Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS ai_eos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_eos;

-- ─────────────────────────────────────────
-- DEPARTMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('employee', 'hr', 'admin') NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    profile_photo VARCHAR(500),
    department_id INT,
    designation VARCHAR(150),
    role_id INT NOT NULL DEFAULT 1,
    date_of_joining DATE,
    employment_type ENUM('full_time', 'part_time', 'contract', 'intern') DEFAULT 'full_time',
    employment_status ENUM('active', 'inactive', 'terminated', 'on_leave') DEFAULT 'active',
    reporting_manager_id INT,
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_name VARCHAR(100),
    pf_number VARCHAR(50),
    esi_number VARCHAR(50),
    uan_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department_id),
    INDEX idx_role (role_id)
);

-- ─────────────────────────────────────────
-- LEAVE BALANCE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_balance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    year INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency', 'marriage', 'unpaid') NOT NULL,
    allocated INT NOT NULL DEFAULT 0,
    used INT NOT NULL DEFAULT 0,
    pending INT NOT NULL DEFAULT 0,
    remaining INT GENERATED ALWAYS AS (allocated - used - pending) VIRTUAL,
    carry_forward INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_year_type (employee_id, year, leave_type),
    INDEX idx_employee_year (employee_id, year)
);

-- ─────────────────────────────────────────
-- LEAVE REQUESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency', 'marriage', 'unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_comment TEXT,
    half_day BOOLEAN DEFAULT FALSE,
    half_day_session ENUM('morning', 'afternoon') NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    attachment_path VARCHAR(500),
    created_via ENUM('chat', 'form', 'hr') DEFAULT 'chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee_status (employee_id, status),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status)
);

-- ─────────────────────────────────────────
-- SALARY RECORDS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    medical_allowance DECIMAL(12,2) DEFAULT 0,
    special_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) GENERATED ALWAYS AS (basic_salary + hra + transport_allowance + medical_allowance + special_allowance + other_allowances) STORED,
    pf_deduction DECIMAL(12,2) DEFAULT 0,
    esi_deduction DECIMAL(12,2) DEFAULT 0,
    tds_deduction DECIMAL(12,2) DEFAULT 0,
    professional_tax DECIMAL(12,2) DEFAULT 0,
    loan_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) GENERATED ALWAYS AS (pf_deduction + esi_deduction + tds_deduction + professional_tax + loan_deduction + other_deductions) STORED,
    net_salary DECIMAL(12,2) GENERATED ALWAYS AS (basic_salary + hra + transport_allowance + medical_allowance + special_allowance + other_allowances - pf_deduction - esi_deduction - tds_deduction - professional_tax - loan_deduction - other_deductions) STORED,
    working_days INT DEFAULT 26,
    present_days INT DEFAULT 26,
    absent_days INT DEFAULT 0,
    lop_days DECIMAL(4,1) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    payment_status ENUM('pending', 'paid', 'hold') DEFAULT 'pending',
    payment_mode ENUM('bank_transfer', 'cheque', 'cash') DEFAULT 'bank_transfer',
    transaction_id VARCHAR(100),
    remarks TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
    UNIQUE KEY unique_employee_month_year (employee_id, month, year),
    INDEX idx_employee_year (employee_id, year),
    INDEX idx_payment_status (payment_status)
);

-- ─────────────────────────────────────────
-- SALARY SLIPS (Generated PDFs)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_slips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salary_record_id INT NOT NULL,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_kb INT,
    verification_id VARCHAR(64) UNIQUE,
    download_count INT DEFAULT 0,
    last_downloaded_at TIMESTAMP NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salary_record_id) REFERENCES salary_records(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_slip (employee_id, month, year),
    INDEX idx_employee_year (employee_id, year)
);

-- ─────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    document_type ENUM(
        'offer_letter', 'appointment_letter', 'experience_letter',
        'salary_slip', 'form16', 'tax_document', 'policy',
        'certificate', 'id_card', 'relieving_letter', 'other'
    ) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_kb INT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    financial_year VARCHAR(10),
    valid_from DATE,
    valid_until DATE,
    uploaded_by INT,
    download_count INT DEFAULT 0,
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee_type (employee_id, document_type),
    INDEX idx_type (document_type)
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM(
        'leave_approved', 'leave_rejected', 'leave_applied',
        'salary_generated', 'document_uploaded', 'announcement',
        'system', 'reminder', 'alert'
    ) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(500),
    action_data JSON,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_read (employee_id, is_read),
    INDEX idx_created (created_at)
);

-- ─────────────────────────────────────────
-- CHAT SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(255) DEFAULT 'New Conversation',
    status ENUM('active', 'archived') DEFAULT 'active',
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP NULL,
    context_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_status (employee_id, status)
);

-- ─────────────────────────────────────────
-- CHAT MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    employee_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system', 'tool') NOT NULL,
    content TEXT NOT NULL,
    tool_name VARCHAR(100),
    tool_args JSON,
    tool_result JSON,
    action_taken VARCHAR(100),
    tokens_used INT,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_employee (employee_id)
);

-- ─────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    description TEXT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(36),
    status ENUM('success', 'failure', 'warning') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    INDEX idx_entity (entity_type, entity_id)
);

-- ─────────────────────────────────────────
-- COMPANY POLICIES (RAG)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    embedding_status ENUM('pending', 'processing', 'done', 'error') DEFAULT 'pending',
    chunk_count INT DEFAULT 0,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('general', 'hr', 'it', 'finance', 'event', 'alert') DEFAULT 'general',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    target_role ENUM('all', 'employee', 'hr', 'admin') DEFAULT 'all',
    target_department_id INT,
    is_pinned BOOLEAN DEFAULT FALSE,
    publish_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    attachment_path VARCHAR(500),
    view_count INT DEFAULT 0,
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (target_department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- LEAVE POLICIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_type ENUM('annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency', 'marriage', 'unpaid') NOT NULL UNIQUE,
    annual_quota INT NOT NULL DEFAULT 0,
    max_consecutive_days INT DEFAULT 30,
    min_notice_days INT DEFAULT 1,
    carry_forward_allowed BOOLEAN DEFAULT FALSE,
    max_carry_forward INT DEFAULT 0,
    requires_document BOOLEAN DEFAULT FALSE,
    gender_specific ENUM('none', 'male', 'female') DEFAULT 'none',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────

INSERT INTO roles (name, description) VALUES
('employee', 'Regular employee with self-service access'),
('hr', 'HR manager with team management access'),
('admin', 'System administrator with full access');

INSERT INTO departments (name, code, description) VALUES
('Engineering', 'ENG', 'Software Development and Engineering'),
('Human Resources', 'HR', 'Human Resources and People Operations'),
('Finance', 'FIN', 'Finance and Accounts'),
('Marketing', 'MKT', 'Marketing and Growth'),
('Operations', 'OPS', 'Operations and Business');

INSERT INTO leave_policies (leave_type, annual_quota, max_consecutive_days, min_notice_days, carry_forward_allowed, max_carry_forward, requires_document, description) VALUES
('annual', 18, 15, 3, TRUE, 5, FALSE, 'Annual paid leave for all employees'),
('sick', 12, 7, 0, FALSE, 0, TRUE, 'Sick leave with medical certificate for >2 days'),
('casual', 6, 3, 1, FALSE, 0, FALSE, 'Casual leave for personal errands'),
('maternity', 180, 180, 30, FALSE, 0, TRUE, 'Maternity leave as per Maternity Benefit Act'),
('paternity', 15, 15, 7, FALSE, 0, FALSE, 'Paternity leave for new fathers'),
('emergency', 5, 5, 0, FALSE, 0, FALSE, 'Emergency leave without prior notice'),
('marriage', 5, 5, 15, FALSE, 0, TRUE, 'Marriage leave once in service'),
('unpaid', 30, 30, 1, FALSE, 0, FALSE, 'Unpaid leave when paid leaves exhausted');

-- Passwords: Admin@123, HR@123456, Emp@123456 (bcrypt hashed - will be replaced by seed script)
INSERT INTO employees (employee_id, email, password_hash, first_name, last_name, phone, department_id, designation, role_id, date_of_joining, gender, employment_type)
VALUES
('EMP001', 'admin@techcorp.com', '$2b$12$placeholder_admin', 'Arjun', 'Sharma', '+91-9876543210', 5, 'System Administrator', 3, '2020-01-15', 'male', 'full_time'),
('EMP002', 'hr@techcorp.com', '$2b$12$placeholder_hr', 'Priya', 'Mehta', '+91-9876543211', 2, 'HR Manager', 2, '2021-03-01', 'female', 'full_time'),
('EMP003', 'employee@techcorp.com', '$2b$12$placeholder_emp', 'Rahul', 'Kumar', '+91-9876543212', 1, 'Senior Software Engineer', 1, '2022-06-15', 'male', 'full_time');

-- Leave Balances for 2025 and 2026
INSERT INTO leave_balance (employee_id, year, leave_type, allocated, used, pending)
SELECT 
    e.id,
    2025,
    lp.leave_type,
    lp.annual_quota,
    FLOOR(RAND() * 5),
    0
FROM employees e
CROSS JOIN leave_policies lp
WHERE e.role_id = 1;

INSERT INTO leave_balance (employee_id, year, leave_type, allocated, used, pending)
SELECT 
    e.id,
    2026,
    lp.leave_type,
    lp.annual_quota,
    FLOOR(RAND() * 3),
    0
FROM employees e
CROSS JOIN leave_policies lp
WHERE e.role_id = 1;

-- Salary Records for EMP003 (Jan 2025 - May 2026)
INSERT INTO salary_records (employee_id, month, year, basic_salary, hra, transport_allowance, medical_allowance, special_allowance, pf_deduction, esi_deduction, tds_deduction, professional_tax, working_days, present_days, payment_status, payment_date, created_by)
SELECT 
    3 as employee_id,
    m.month,
    m.year,
    75000 as basic_salary,
    30000 as hra,
    5000 as transport_allowance,
    1250 as medical_allowance,
    15000 as special_allowance,
    9000 as pf_deduction,
    0 as esi_deduction,
    8500 as tds_deduction,
    200 as professional_tax,
    26 as working_days,
    26 as present_days,
    'paid' as payment_status,
    DATE(CONCAT(m.year, '-', LPAD(m.month, 2, '0'), '-28')) as payment_date,
    1 as created_by
FROM (
    SELECT 1 month, 2025 year UNION SELECT 2,2025 UNION SELECT 3,2025 UNION SELECT 4,2025 UNION
    SELECT 5,2025 UNION SELECT 6,2025 UNION SELECT 7,2025 UNION SELECT 8,2025 UNION
    SELECT 9,2025 UNION SELECT 10,2025 UNION SELECT 11,2025 UNION SELECT 12,2025 UNION
    SELECT 1,2026 UNION SELECT 2,2026 UNION SELECT 3,2026 UNION SELECT 4,2026 UNION SELECT 5,2026
) m;

-- Announcements
INSERT INTO announcements (title, content, category, priority, target_role, is_pinned, created_by) VALUES
('Welcome to AI Employee OS!', 'We are excited to launch our new AI-powered Employee Self-Service Platform. You can now apply for leaves, download salary slips, and access all HR services through natural language conversation. Just type what you need!', 'general', 'high', 'all', TRUE, 1),
('Q2 2026 Performance Reviews', 'The Q2 performance review cycle begins on July 1st. Please ensure your self-appraisal forms are submitted by June 25th.', 'hr', 'medium', 'all', FALSE, 2),
('Office Closed - June 20th', 'The office will remain closed on June 20th on account of a public holiday. Please plan your work accordingly.', 'general', 'medium', 'all', FALSE, 2);
