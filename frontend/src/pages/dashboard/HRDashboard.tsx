import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  Skeleton, alpha, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Chip, List, ListItem,
  ListItemText, ListItemIcon, Divider
} from '@mui/material';
import {
  People, EventNote, AccountBalanceWallet, Timeline,
  History, Visibility, Edit, DeleteOutline
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi, analyticsApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import EmployeeDialog from './EmployeeDialog';

const COLORS = ['#1565C0', '#2E7D32', '#FF6F00', '#C62828', '#9C27B0', '#009688'];

export default function HRDashboard() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const { data: hrAnalytics, isLoading: hrLoading } = useQuery({
    queryKey: ['hr-analytics'],
    queryFn: () => analyticsApi.hr().then(r => r.data),
  });

  const { data: adminAnalytics, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.admin().then(r => r.data),
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['admin-employees', { limit: 5 }],
    queryFn: () => adminApi.getEmployees({ limit: 5 }).then(r => r.data),
  });

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', id?: number) => {
    setDialogMode(mode);
    setSelectedEmployeeId(id || null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await adminApi.deactivateEmployee(id);
        toast.success('Employee deactivated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to deactivate employee');
      }
    }
  };

  if (hrLoading) return <Typography>Loading Analytics...</Typography>;

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          HR Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Overview of company performance, employee metrics, and system activities
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #1565C0, #0D47A1)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
                <People sx={{ fontSize: { xs: 24, sm: 32 }, opacity: 0.8 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>Total Employees</Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', sm: '3rem' } }}>
                {hrAnalytics?.total_employees || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #FF6F00, #E65100)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
                <EventNote sx={{ fontSize: { xs: 24, sm: 32 }, opacity: 0.8 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>Pending Leaves</Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', sm: '3rem' } }}>
                {hrAnalytics?.pending_leaves || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2E7D32, #1B5E20)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
                <AccountBalanceWallet sx={{ fontSize: { xs: 24, sm: 32 }, opacity: 0.8 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>Total Payroll YTD</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '2.125rem' } }}>
                ₹ {(hrAnalytics?.payroll_summary?.total_net_paid || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                <Timeline sx={{ verticalAlign: 'middle', mr: 1, color: '#1565C0' }} />
                Monthly Leave Trends ({hrAnalytics?.year})
              </Typography>
              <Box sx={{ height: 300 }}>
                {hrAnalytics?.monthly_leave_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hrAnalytics.monthly_leave_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(21,101,192,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>No leave data available</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                <People sx={{ verticalAlign: 'middle', mr: 1, color: '#FF6F00' }} />
                Leave Distribution by Dept
              </Typography>
              <Box sx={{ height: 300 }}>
                {hrAnalytics?.department_leave_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hrAnalytics.department_leave_data}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="department"
                      >
                        {hrAnalytics.department_leave_data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>No department data available</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row: Employees and Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" fontWeight={700}>Recent Employees</Typography>
              <Button variant="contained" size="small" onClick={() => handleOpenDialog('add')}>
                Add Employee
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: alpha('#000', 0.02) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees?.map((emp: any) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{emp.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.employee_id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.role?.name || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={emp.is_active ? 'Active' : 'Inactive'} 
                          size="small" 
                          sx={{ 
                            height: 20, fontSize: '0.7rem', fontWeight: 600,
                            backgroundColor: emp.is_active ? alpha('#2E7D32', 0.1) : alpha('#C62828', 0.1),
                            color: emp.is_active ? '#2E7D32' : '#C62828'
                          }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit', emp.id)}>
                          <Edit fontSize="small" color="primary" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(emp.id)}>
                          <DeleteOutline fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" fontWeight={700}>
                <History sx={{ verticalAlign: 'middle', mr: 1, color: '#9C27B0' }} />
                Activity Feed
              </Typography>
            </Box>
            <List sx={{ p: 0, maxHeight: 360, overflow: 'auto' }}>
              {adminLoading ? (
                <Typography sx={{ p: 3 }}>Loading...</Typography>
              ) : adminAnalytics?.recent_audit_logs?.slice(0, 5).map((log: any, index: number) => (
                <React.Fragment key={log.id}>
                  <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block" color="text.primary">
                            {log.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < 4 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      <EmployeeDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        mode={dialogMode} 
        employeeId={selectedEmployeeId} 
      />
    </Box>
  );
}
