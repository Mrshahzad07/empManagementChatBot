import React from 'react';
import {
  Box, Grid, Card, CardContent, Typography, alpha, CircularProgress
} from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/api';
import { useAppSelector } from '../../store';

const COLORS = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#C62828', '#37474F', '#0277BD', '#FF6F00'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const isHR = user?.role === 'hr' || user?.role === 'admin';

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', user?.role],
    queryFn: () => {
      if (isHR) return analyticsApi.hr().then((r) => r.data);
      return analyticsApi.employee().then((r) => r.data);
    },
  });

  const chartColors = {
    text: isDark ? '#8BA0BC' : '#4A5568',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    bg: isDark ? '#0F1C2E' : '#FFFFFF',
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const SectionCard = ({ title, children, xs = 12, md = 6, height = 320 }: any) => (
    <Grid item xs={xs} md={md}>
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>{title}</Typography>
          <Box sx={{ height: { xs: Math.min(height, 240), sm: height } }}>
            {children}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  if (!isHR) {
    // Employee Analytics
    const leaveByType = analytics?.leave_by_type || [];
    const salaryTrend = analytics?.salary_trend || [];

    return (
      <Box>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>My Analytics</Typography>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Leave Days Used', value: analytics?.total_leave_used || 0, color: '#1565C0' },
            { label: 'Leaves This Year', value: analytics?.leaves_this_year || 0, color: '#E65100' },
            { label: 'Pending Leaves', value: analytics?.pending_leaves || 0, color: '#FF6F00' },
            { label: 'Chat Messages', value: analytics?.chat_messages || 0, color: '#6A1B9A' },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ border: `1px solid ${alpha(stat.color, 0.2)}` }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {leaveByType.length > 0 && (
            <SectionCard title="Leave Usage by Type" md={4} height={280}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={leaveByType} dataKey="used" nameKey="leave_type" innerRadius={60} outerRadius={100} label>
                    {leaveByType.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {salaryTrend.length > 0 && (
            <SectionCard title="Salary Trend" md={8} height={280}>
              <ResponsiveContainer>
                <AreaChart data={salaryTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="label" tick={{ fill: chartColors.text, fontSize: 11 }} />
                  <YAxis tick={{ fill: chartColors.text, fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Net Salary']} />
                  <Area type="monotone" dataKey="net_salary" stroke="#1565C0" fill={alpha('#1565C0', 0.15)} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          )}
        </Grid>
      </Box>
    );
  }

  // HR Analytics
  const departmentLeave = analytics?.department_leave || [];
  const monthlyLeave = analytics?.monthly_leave_trend || [];
  const leaveTypeBreakdown = analytics?.leave_type_breakdown || [];
  const headcountByDept = analytics?.headcount_by_department || [];

  return (
    <Box>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>HR Analytics Dashboard</Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Employees', value: analytics?.total_employees || 0, color: '#1565C0' },
          { label: 'Active Employees', value: analytics?.active_employees || 0, color: '#2E7D32' },
          { label: 'Pending Leaves', value: analytics?.pending_leave_requests || 0, color: '#E65100' },
          { label: 'Total Leave Days (Year)', value: analytics?.total_leave_days_this_year || 0, color: '#6A1B9A' },
        ].map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card sx={{ border: `1px solid ${alpha(stat.color, 0.2)}` }}>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {headcountByDept.length > 0 && (
          <SectionCard title="Headcount by Department" md={5} height={300}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={headcountByDept} dataKey="count" nameKey="department"
                  innerRadius={70} outerRadius={110} label={({ department, count }) => `${department}: ${count}`}>
                  {headcountByDept.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {monthlyLeave.length > 0 && (
          <SectionCard title="Monthly Leave Applications" md={7} height={300}>
            <ResponsiveContainer>
              <BarChart data={monthlyLeave}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#2E7D32" name="Approved" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#E65100" name="Pending" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#C62828" name="Rejected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {leaveTypeBreakdown.length > 0 && (
          <SectionCard title="Leave Type Breakdown" md={6} height={280}>
            <ResponsiveContainer>
              <BarChart data={leaveTypeBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <YAxis type="category" dataKey="leave_type" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_days" fill="#1565C0" name="Total Days" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {departmentLeave.length > 0 && (
          <SectionCard title="Leave Days by Department" md={6} height={280}>
            <ResponsiveContainer>
              <BarChart data={departmentLeave}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="department" tick={{ fill: chartColors.text, fontSize: 10 }} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_days" fill={alpha('#1565C0', 0.8)} name="Leave Days" radius={[4, 4, 0, 0]}>
                  {departmentLeave.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
      </Grid>
    </Box>
  );
}
