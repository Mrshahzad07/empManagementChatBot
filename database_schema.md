# Database Schema Documentation

This document provides a comprehensive overview of the database tables and their structure for the application.

## Table: `departments`
Stores company department information.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | String(100) | Not Null, Unique | Department name |
| `code` | String(20) | Not Null, Unique | Department code |
| `description` | Text | | Department description |
| `is_active` | Boolean | Default: True | Status |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `roles`
Stores user roles.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | Enum | Not Null, Unique | Role name (employee, hr, admin) |
| `description` | String(255) | | Role description |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |

## Table: `employees`
Stores employee profiles and details.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | String(20) | Not Null, Unique | Company employee ID |
| `email` | String(255) | Not Null, Unique, Index | Email address |
| `password_hash` | String(255) | Not Null | Hashed password |
| `first_name` | String(100) | Not Null | First name |
| `last_name` | String(100) | Not Null | Last name |
| `phone` | String(20) | | Phone number |
| `date_of_birth` | Date | | Date of birth |
| `gender` | Enum | | Gender |
| `address` | Text | | Home address |
| `profile_photo` | String(500) | | Photo URL / path |
| `department_id` | Integer | Foreign Key (`departments.id`) | Department |
| `designation` | String(150) | | Job title |
| `role_id` | Integer | Foreign Key (`roles.id`), Default: 1 | Role |
| `date_of_joining` | Date | | Joining date |
| `employment_type` | Enum | Default: full_time | Type |
| `employment_status` | Enum | Default: active | Status |
| `reporting_manager_id` | Integer | Foreign Key (`employees.id`) | Manager |
| `pan_number` | String(20) | | PAN |
| `aadhar_number` | String(20) | | Aadhar |
| `bank_account_number`| String(50) | | Bank account |
| `bank_ifsc` | String(20) | | Bank IFSC |
| `bank_name` | String(100) | | Bank Name |
| `pf_number` | String(50) | | PF Number |
| `esi_number` | String(50) | | ESI Number |
| `uan_number` | String(50) | | UAN Number |
| `is_active` | Boolean | Default: True | Account active status |
| `last_login` | DateTime | | Last login timestamp |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `leave_balance`
Stores leave balances for employees.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Employee |
| `year` | Integer | Not Null | Year of balance |
| `leave_type` | Enum | Not Null | Type of leave |
| `allocated` | Integer | Not Null, Default: 0 | Allocated days |
| `used` | Integer | Not Null, Default: 0 | Used days |
| `pending` | Integer | Not Null, Default: 0 | Pending requested days |
| `carry_forward` | Integer | Default: 0 | Carried forward days |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `leave_requests`
Stores employee leave requests.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Employee |
| `leave_type` | Enum | Not Null | Type of leave |
| `start_date` | Date | Not Null | Leave start date |
| `end_date` | Date | Not Null | Leave end date |
| `total_days` | Decimal(4,1) | Not Null | Duration |
| `reason` | Text | Not Null | Reason for leave |
| `status` | Enum | Default: pending | Request status |
| `applied_at` | DateTime | Default: func.now() | Applied timestamp |
| `reviewed_by` | Integer | Foreign Key (`employees.id`) | Reviewer |
| `reviewed_at` | DateTime | | Review timestamp |
| `review_comment`| Text | | Reviewer comments |
| `half_day` | Boolean | Default: False | Is half day |
| `half_day_session`| Enum | | Morning/Afternoon |
| `is_emergency` | Boolean | Default: False | Emergency leave flag |
| `attachment_path`| String(500) | | Path to attachment |
| `created_via` | Enum | Default: chat | Platform used |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `leave_policies`
Stores leave policy rules.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `leave_type` | Enum | Not Null, Unique | Type of leave |
| `annual_quota` | Integer | Not Null, Default: 0 | Annual allowed quota |
| `max_consecutive_days`| Integer | Default: 30 | Max consecutive days |
| `min_notice_days`| Integer | Default: 1 | Min notice period |
| `carry_forward_allowed`| Boolean | Default: False | Carry forward enabled |
| `max_carry_forward`| Integer | Default: 0 | Max days to carry forward|
| `requires_document`| Boolean | Default: False | Document proof needed |
| `gender_specific`| Enum | Default: none | Applicable gender |
| `description` | Text | | Policy description |
| `is_active` | Boolean | Default: True | Status |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `documents`
Stores details about employee documents and generic company documents.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Employee (if applicable)|
| `document_type` | Enum | Not Null | Type of document |
| `document_name` | String(255) | Not Null | Given document name |
| `description` | Text | | Document description |
| `file_path` | String(500) | | File path |
| `file_name` | String(255) | | Original file name |
| `file_size_kb` | Integer | | File size |
| `mime_type` | String(100) | Default: application/pdf | MIME type |
| `is_template` | Boolean | Default: False | Template flag |
| `is_public` | Boolean | Default: False | Publicly available flag |
| `financial_year`| String(10) | | Financial year |
| `valid_from` | Date | | Validity start |
| `valid_until` | Date | | Validity end |
| `uploaded_by` | Integer | Foreign Key (`employees.id`) | Uploader |
| `download_count`| Integer | Default: 0 | Times downloaded |
| `status` | Enum | Default: active | Status |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `notifications`
Stores notifications to be sent to employees.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Target employee |
| `title` | String(255) | Not Null | Notification title |
| `message` | Text | Not Null | Content |
| `notification_type`| Enum | Not Null | Type of notification |
| `is_read` | Boolean | Default: False | Read status |
| `read_at` | DateTime | | Read timestamp |
| `action_url` | String(500) | | Related URL |
| `action_data` | JSON | | Related payload |
| `priority` | Enum | Default: medium | Priority level |
| `expires_at` | DateTime | | Expiry timestamp |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |

## Table: `chat_sessions`
Stores chat sessions of users.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | String(36) | Primary Key | UUID identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | User |
| `title` | String(255) | Default: New Conversation | Session title |
| `status` | Enum | Default: active | Status |
| `message_count` | Integer | Default: 0 | Number of messages |
| `last_message_at`| DateTime | | Timestamp of last msg |
| `context_data` | JSON | | Contextual payload |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `chat_messages`
Stores individual chat messages in a session.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `session_id` | String(36) | Foreign Key (`chat_sessions.id`) | Parent session |
| `employee_id` | Integer | Foreign Key (`employees.id`) | User |
| `role` | Enum | Not Null | user/assistant/system/tool|
| `content` | Text | Not Null | Message text |
| `tool_name` | String(100) | | Executed tool name |
| `tool_args` | JSON | | Arguments for tool |
| `tool_result` | JSON | | Output from tool |
| `action_taken` | String(100) | | Extracted action |
| `tokens_used` | Integer | | Token count |
| `response_time_ms`| Integer | | Time taken |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |

## Table: `audit_logs`
Tracks actions performed by users in the system.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | User |
| `action` | String(100) | Not Null | Action description |
| `entity_type` | String(50) | | Affected entity |
| `entity_id` | String(50) | | Affected entity ID |
| `description` | Text | | Details |
| `old_values` | JSON | | State before action |
| `new_values` | JSON | | State after action |
| `ip_address` | String(45) | | Origin IP |
| `user_agent` | Text | | Origin Agent |
| `session_id` | String(36) | | Session UUID |
| `status` | Enum | Default: success | Action status |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |

## Table: `company_policies`
Stores company policy documents.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `title` | String(255) | Not Null | Policy Title |
| `category` | String(100) | | Policy category |
| `content` | Text | | Extracted text content |
| `file_path` | String(500) | | Attachment path |
| `file_name` | String(255) | | Attachment file name |
| `version` | String(20) | Default: 1.0 | Policy version |
| `effective_date` | Date | | Effective from date |
| `is_active` | Boolean | Default: True | Active flag |
| `embedding_status`| Enum | Default: pending | RAG embedding state |
| `chunk_count` | Integer | Default: 0 | Number of chunks |
| `uploaded_by` | Integer | Foreign Key (`employees.id`) | Uploader |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `announcements`
Stores announcements to be made to employees.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `title` | String(255) | Not Null | Announcement title |
| `content` | Text | Not Null | Body |
| `category` | Enum | Default: general | Announcement category |
| `priority` | Enum | Default: medium | Priority |
| `target_role` | Enum | Default: all | Target roles |
| `target_department_id`| Integer | Foreign Key (`departments.id`)| Target department |
| `is_pinned` | Boolean | Default: False | Pinned flag |
| `publish_at` | DateTime | Default: func.now() | Go-live timestamp |
| `expires_at` | DateTime | | Expiry timestamp |
| `view_count` | Integer | Default: 0 | Number of views |
| `created_by` | Integer | Foreign Key (`employees.id`) | Creator |
| `is_active` | Boolean | Default: True | Status |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `salary_records`
Stores monthly salary records for employees.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Employee |
| `month` | Integer | Not Null | Salary month |
| `year` | Integer | Not Null | Salary year |
| `basic_salary` | Decimal(12,2) | Not Null, Default: 0 | Earnings |
| `hra` | Decimal(12,2) | Default: 0 | Earnings |
| `transport_allowance`| Decimal(12,2) | Default: 0 | Earnings |
| `medical_allowance`| Decimal(12,2) | Default: 0 | Earnings |
| `special_allowance`| Decimal(12,2) | Default: 0 | Earnings |
| `other_allowances`| Decimal(12,2) | Default: 0 | Earnings |
| `bonus` | Decimal(12,2) | Default: 0 | Earnings |
| `overtime_amount` | Decimal(12,2) | Default: 0 | Earnings |
| `pf_deduction` | Decimal(12,2) | Default: 0 | Deductions |
| `esi_deduction` | Decimal(12,2) | Default: 0 | Deductions |
| `tds_deduction` | Decimal(12,2) | Default: 0 | Deductions |
| `professional_tax`| Decimal(12,2) | Default: 0 | Deductions |
| `loan_deduction` | Decimal(12,2) | Default: 0 | Deductions |
| `other_deductions`| Decimal(12,2) | Default: 0 | Deductions |
| `working_days` | Integer | Default: 26 | Attendance |
| `present_days` | Integer | Default: 26 | Attendance |
| `absent_days` | Integer | Default: 0 | Attendance |
| `lop_days` | Decimal(4,1) | Default: 0 | Loss of Pay Days |
| `overtime_hours` | Decimal(6,2) | Default: 0 | OT Hours |
| `payment_date` | Date | | Date paid |
| `payment_status` | Enum | Default: pending | Payment status |
| `payment_mode` | Enum | Default: bank_transfer | Payment method |
| `transaction_id` | String(100) | | Payment txn ID |
| `remarks` | Text | | Notes |
| `created_by` | Integer | Foreign Key (`employees.id`) | Processed by |
| `created_at` | DateTime | Default: func.now() | Creation timestamp |
| `updated_at` | DateTime | Default: func.now() | Last update timestamp |

## Table: `salary_slips`
Stores generated salary slip documents.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `salary_record_id`| Integer | Foreign Key (`salary_records.id`) | Salary Record |
| `employee_id` | Integer | Foreign Key (`employees.id`) | Employee |
| `month` | Integer | Not Null | Payslip month |
| `year` | Integer | Not Null | Payslip year |
| `file_path` | String(500) | | Document path |
| `file_name` | String(255) | | Document filename |
| `file_size_kb` | Integer | | File size |
| `verification_id` | String(64) | Unique | Hash for verification |
| `download_count` | Integer | Default: 0 | Download count |
| `last_downloaded_at`| DateTime | | Download timestamp |
| `generated_at` | DateTime | Default: func.now() | Generation timestamp |
