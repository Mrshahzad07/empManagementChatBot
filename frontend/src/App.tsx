import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from './store';
import { fetchMeThunk } from './store/authSlice';
import { getTheme } from './theme';

// Layout
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/Login';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard';
import ChatPage from './pages/chat/ChatPage';
import LeavePage from './pages/leave/LeavePage';
import HRSalaryDispatcher from './pages/salary/HRSalaryDispatcher';
import HRSalaryPayments from './pages/salary/HRSalaryPayments';
import HRLeaveApproval from './pages/leave/HRLeaveApproval';
import SalaryPage from './pages/salary/SalaryPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import DocumentGenerator from './pages/documents/DocumentGenerator';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleGuard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAppSelector((s) => s.auth);
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const theme = getTheme(themeMode);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMeThunk()).unwrap().catch(() => {
        navigate('/login');
      });
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: themeMode === 'dark' ? '#0F1C2E' : 'white',
            color: themeMode === 'dark' ? 'white' : '#0D2137',
            border: themeMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#2E7D32', secondary: 'white' } },
          error: { iconTheme: { primary: '#C62828', secondary: 'white' } },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />

          {/* HR Routes */}
          <Route path="hr/salary-dispatcher" element={
            <RoleGuard roles={['hr']}>
              <HRSalaryDispatcher />
            </RoleGuard>
          } />
          <Route path="hr/salary-payments" element={
            <RoleGuard roles={['hr']}>
              <HRSalaryPayments />
            </RoleGuard>
          } />
          <Route path="hr/leave-approval" element={
            <RoleGuard roles={['hr']}>
              <HRLeaveApproval />
            </RoleGuard>
          } />
          <Route path="hr/document-generator" element={
            <RoleGuard roles={['hr']}>
              <DocumentGenerator />
            </RoleGuard>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
