import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = '/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401, auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // No refresh token - redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token: newRefresh } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefresh);

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        processQueue(null, access_token);

        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${access_token}` };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      const message = error.response?.data?.detail || error.message || 'An error occurred';
      if (error.response?.status === 403) {
        toast.error('Access denied. Insufficient permissions.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again.');
      } else if (error.response?.status !== 404) {
        // Don't toast 404s - handled by components
        toast.error(typeof message === 'string' ? message : 'Request failed');
      }
    }

    return Promise.reject(error);
  }
);

// ── API Helpers ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
};

export const leaveApi = {
  getBalance: (year?: number) => api.get('/leave/balance', { params: { year } }),
  applyLeave: (data: any) => api.post('/leave/apply', data),
  getHistory: (params?: any) => api.get('/leave/history', { params }),
  getPending: (params?: any) => api.get('/leave/pending', { params }),
  approve: (id: number, comment?: string) => api.put(`/leave/${id}/approve`, { status: 'approved', comment }),
  reject: (id: number, comment?: string) => api.put(`/leave/${id}/reject`, { status: 'rejected', comment }),
  cancel: (id: number) => api.delete(`/leave/${id}/cancel`),
  getPolicies: () => api.get('/leave/policies'),
};

export const salaryApi = {
  getSlips: (params?: any) => api.get('/salary/slips', { params }),
  downloadSlip: async (salaryRecordId: number) => {
    try {
      const response = await api.get(`/salary/slips/${salaryRecordId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onload = function() {
        const link = document.createElement('a');
        link.href = reader.result as string;
        link.download = `salary_slip_${salaryRecordId}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  },
  downloadSlipUrl: (salaryRecordId: number) => `${BASE_URL}/salary/slips/${salaryRecordId}/download`,
  bulkDownload: (year: number, monthFrom?: number, monthTo?: number) =>
    api.post('/salary/bulk-download', { year, month_from: monthFrom, month_to: monthTo }, { responseType: 'blob' }),
  getSummary: () => api.get('/salary/summary'),
  upload: (records: any[]) => api.post('/salary/upload', records),
  getMonthlyRegister: (month: number, year: number) => api.get('/salary/monthly-register', { params: { month, year } }),
  markAsPaid: (recordId: number) => api.put(`/salary/${recordId}/pay`),
};

export const documentsApi = {
  list: (docType?: string) => api.get('/documents', { params: { doc_type: docType } }),
  download: async (docId: number) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onload = function() {
        const link = document.createElement('a');
        link.href = reader.result as string;
        link.download = `document_${docId}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error('Failed to download document');
    }
  },
  downloadUrl: (docId: number) => `${BASE_URL}/documents/${docId}/download`,
  generateDraft: (data: any) => api.post('/documents/generate-draft', data),
  saveGenerated: (data: any) => api.post('/documents/save-generated', data),
  downloadGenerated: async (data: any) => {
    try {
      const response = await api.post('/documents/download-generated', data, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onload = function() {
        const link = document.createElement('a');
        link.href = reader.result as string;
        link.download = `${data.document_name}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error('Failed to download generated document');
    }
  },
};

export const chatApi = {
  sendMessage: (message: string, sessionId?: string) =>
    api.post('/chat/message', { message, session_id: sessionId }),
  getSessions: () => api.get('/chat/sessions'),
  getSessionMessages: (sessionId: string) => api.get(`/chat/sessions/${sessionId}/messages`),
  archiveSession: (sessionId: string) => api.delete(`/chat/sessions/${sessionId}`),
};

export const notificationsApi = {
  list: (unreadOnly?: boolean) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const analyticsApi = {
  employee: () => api.get('/analytics/employee'),
  hr: () => api.get('/analytics/hr'),
  admin: () => api.get('/analytics/admin'),
};

export const adminApi = {
  getEmployees: (params?: any) => api.get('/admin/employees', { params }),
  getEmployee: (id: number) => api.get(`/admin/employees/${id}`),
  createEmployee: (data: any) => api.post('/admin/employees', data),
  updateEmployee: (id: number, data: any) => api.put(`/admin/employees/${id}`, data),
  deactivateEmployee: (id: number) => api.delete(`/admin/employees/${id}/deactivate`),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data: any) => api.post('/admin/announcements', null, { params: data }),
  getDepartments: () => api.get('/admin/departments'),
};

export default api;
