import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, LinearProgress,
  Tab, Tabs, alpha, Skeleton, Tooltip
} from '@mui/material';
import {
  Add, CheckCircle, Cancel, AccessTime, EventNote, Pending
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { LeaveRequest, LeaveBalance } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LEAVE_COLORS: Record<string, string> = {
  annual: '#1565C0', sick: '#C62828', casual: '#2E7D32',
  emergency: '#E65100', marriage: '#6A1B9A', unpaid: '#37474F',
};

const STATUS_CONFIG: Record<string, any> = {
  pending: { color: 'warning', label: 'Pending', icon: <AccessTime fontSize="small" /> },
  approved: { color: 'success', label: 'Approved', icon: <CheckCircle fontSize="small" /> },
  rejected: { color: 'error', label: 'Rejected', icon: <Cancel fontSize="small" /> },
  cancelled: { color: 'default', label: 'Cancelled', icon: <Cancel fontSize="small" /> },
};

export default function LeavePage() {
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    is_emergency: false,
  });

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => leaveApi.getBalance().then((r) => r.data),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['leave-history-all'],
    queryFn: () => leaveApi.getHistory({ limit: 50 }).then((r) => r.data),
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => leaveApi.applyLeave(data),
    onSuccess: () => {
      toast.success('Leave applied successfully! Pending HR approval.');
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['leave-history-all'] });
      setApplyOpen(false);
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '', is_emergency: false });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to apply leave');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leaveApi.cancel(id),
    onSuccess: () => {
      toast.success('Leave request cancelled');
      queryClient.invalidateQueries({ queryKey: ['leave-history-all'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });

  const handleApply = () => {
    if (!form.start_date || !form.end_date || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    applyMutation.mutate(form);
  };

  const LEAVE_TYPES = ['annual', 'sick', 'casual', 'emergency', 'marriage', 'maternity', 'paternity', 'unpaid'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Leave Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Apply for leaves, track your balance and history
          </Typography>
        </Box>
      </Box>

      {/* Balance Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Leave Balance — {new Date().getFullYear()}
          </Typography>
          {balanceLoading ? (
            <Grid container spacing={2}>
              {[...Array(4)].map((_, i) => <Grid item xs={6} md={3} key={i}><Skeleton height={80} /></Grid>)}
            </Grid>
          ) : (
            <>
              {/* Summary row */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                  { label: 'Total Allocated', value: balanceData?.total_allocated || 0, color: '#1565C0' },
                  { label: 'Days Used', value: balanceData?.total_used || 0, color: '#C62828' },
                  { label: 'Days Pending', value: balanceData?.total_pending || 0, color: '#E65100' },
                  { label: 'Days Remaining', value: balanceData?.total_remaining || 0, color: '#2E7D32' },
                ].map((s) => (
                  <Grid item xs={6} md={3} key={s.label}>
                    <Box sx={{
                      p: 2, borderRadius: 2, textAlign: 'center',
                      background: alpha(s.color, 0.06),
                      border: `1px solid ${alpha(s.color, 0.15)}`,
                    }}>
                      <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Per-type grid */}
              <Grid container spacing={1.5}>
                {balanceData?.balances?.map((b: LeaveBalance) => (
                  <Grid item xs={12} sm={6} md={4} key={b.leave_type}>
                    <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                          {b.leave_type}
                        </Typography>
                        <Chip
                          label={`${b.remaining} left`}
                          size="small"
                          sx={{
                            background: alpha(LEAVE_COLORS[b.leave_type] || '#1565C0', 0.1),
                            color: LEAVE_COLORS[b.leave_type] || '#1565C0',
                            fontWeight: 700, fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={b.allocated > 0 ? (b.used / b.allocated) * 100 : 0}
                        sx={{
                          mb: 0.5,
                          '& .MuiLinearProgress-bar': { background: LEAVE_COLORS[b.leave_type] || '#1565C0' },
                          background: alpha(LEAVE_COLORS[b.leave_type] || '#1565C0', 0.1),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {b.used} used · {b.pending} pending · {b.allocated} total
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography variant="h6" fontWeight={700}>Leave History</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell align="center">Days</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reason</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Applied On</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : history?.length > 0 ? (
                  history.map((req: LeaveRequest) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <Chip
                          label={req.leave_type}
                          size="small"
                          sx={{
                            background: alpha(LEAVE_COLORS[req.leave_type] || '#1565C0', 0.1),
                            color: LEAVE_COLORS[req.leave_type] || '#1565C0',
                            fontWeight: 700, textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>{req.start_date}</TableCell>
                      <TableCell>{req.end_date}</TableCell>
                      <TableCell align="center">
                        <Chip label={req.total_days} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Tooltip title={req.reason}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {req.reason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="caption">
                          {format(new Date(req.applied_at), 'dd MMM yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_CONFIG[req.status]?.label}
                          color={STATUS_CONFIG[req.status]?.color}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        {req.review_comment && (
                          <Tooltip title={req.review_comment}>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 100 }}>
                              {req.review_comment}
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <EventNote sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                      <Typography color="text.secondary">No leave requests found</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        To apply for leave, please ask the AI Assistant.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
