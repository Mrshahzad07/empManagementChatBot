// TypeScript types for the entire application

export interface User {
  id: number;
  employee_id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: 'employee' | 'hr' | 'admin';
  designation?: string;
  department?: { id: number; name: string };
  profile_photo?: string;
  date_of_joining?: string;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LeaveBalance {
  id: number;
  leave_type: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  carry_forward: number;
}

export interface LeaveBalanceSummary {
  total_allocated: number;
  total_used: number;
  total_pending: number;
  total_remaining: number;
  balances: LeaveBalance[];
}

export interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  reviewed_at?: string;
  review_comment?: string;
  is_emergency: boolean;
  created_via?: string;
  employee_name?: string;
  employee_id_str?: string;
}

export interface SalaryRecord {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  month_name: string;
  basic_salary: number;
  hra: number;
  transport_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  other_allowances: number;
  bonus: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_deduction: number;
  professional_tax: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  payment_status: string;
  payment_date?: string;
  has_slip: boolean;
  slip_id?: number;
}

export interface Document {
  id: number;
  document_type: string;
  document_name: string;
  description?: string;
  financial_year?: string;
  download_count: number;
  status: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  read_at?: string;
  priority: string;
  action_url?: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  publish_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  tool_name?: string;
  tool_result?: any;
  action_taken?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  status: string;
  message_count: number;
  last_message_at?: string;
  created_at: string;
}

export interface ChatAction {
  type: string;
  data: any;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export type ThemeMode = 'light' | 'dark';
