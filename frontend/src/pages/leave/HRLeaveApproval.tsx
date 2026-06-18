import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, Badge, alpha, Skeleton, Tooltip, Grid
} from '@mui/material';
import { CheckCircle, Cancel, AccessTime, Person, Gavel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { LeaveRequest } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LEAVE_COLORS: Record<string, string> = {
  annual: '#1565C0', sick: '#C62828', casual: '#2E7D32',
  emergency: '#E65100', marriage: '#6A1B9A', unpaid: '#37474F',
};

export default function HRLeaveApproval() {
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const queryClient = useQueryClient();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState(0);

  const { data: pendingLeaves, isLoading } = useQuery({
    queryKey: ['hr-pending-leaves'],
    queryFn: () => leaveApi.getPending({ limit: 100 }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      leaveApi.approve(id, comment),
    onSuccess: () => {
      toast.success('Leave approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] });
      setReviewOpen(false);
      setComment('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      leaveApi.reject(id, comment),
    onSuccess: () => {
      toast.success('Leave rejected.');
      queryClient.invalidateQueries({ queryKey: ['hr-pending-leaves'] });
      setReviewOpen(false);
      setComment('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reject'),
  });

  const handleReview = () => {
    if (!selectedLeave) return;
    if (action === 'approve') {
      approveMutation.mutate({ id: selectedLeave.id, comment });
    } else {
      if (!comment.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      rejectMutation.mutate({ id: selectedLeave.id, comment });
    }
  };

  const openReview = (leave: LeaveRequest, act: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setAction(act);
    setComment('');
    setReviewOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Leave Approval</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Review and manage employee leave requests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Badge badgeContent={pendingLeaves?.length || 0} color="error">
            <Chip
              icon={<Gavel />}
              label="Pending Requests"
              color="warning"
              sx={{ fontWeight: 700 }}
            />
          </Badge>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Pending', value: pendingLeaves?.length || 0, color: '#E65100', icon: <AccessTime /> },
          { label: 'Emergency', value: pendingLeaves?.filter((l: LeaveRequest) => l.is_emergency).length || 0, color: '#C62828', icon: <Cancel /> },
        ].map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card sx={{ border: `1px solid ${alpha(stat.color, 0.2)}` }}>
              <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                </Box>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: alpha(stat.color, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.color,
                }}>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pending Leave Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography variant="h6" fontWeight={700}>Pending Leave Requests</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>To</TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Days</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reason</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Applied</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : pendingLeaves?.length > 0 ? (
                  pendingLeaves.map((leave: LeaveRequest) => (
                    <TableRow key={leave.id} sx={{ background: leave.is_emergency ? alpha('#C62828', 0.03) : undefined }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{
                            width: 32, height: 32, fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                            display: { xs: 'none', sm: 'flex' },
                          }}>
                            {leave.employee_name?.split(' ').map((n) => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: { xs: 80, sm: 150 } }}>{leave.employee_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{leave.employee_id_str}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.leave_type}
                          size="small"
                          sx={{
                            background: alpha(LEAVE_COLORS[leave.leave_type] || '#1565C0', 0.1),
                            color: LEAVE_COLORS[leave.leave_type] || '#1565C0',
                            fontWeight: 700, textTransform: 'capitalize',
                          }}
                        />
                        {leave.is_emergency && (
                          <Chip label="EMERGENCY" color="error" size="small"
                            sx={{ ml: 0.5, fontSize: '0.6rem', height: 18 }} />
                        )}
                      </TableCell>
                      <TableCell>{leave.start_date}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{leave.end_date}</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip label={leave.total_days} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Tooltip title={leave.reason}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                            {leave.reason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography variant="caption">
                          {format(new Date(leave.applied_at), 'dd MMM yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <Button
                            size="small" variant="contained" color="success"
                            startIcon={<CheckCircle fontSize="small" />}
                            onClick={() => openReview(leave, 'approve')}
                            sx={{ fontSize: '0.75rem', py: 0.5, minWidth: { xs: 'auto', sm: 100 } }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small" variant="outlined" color="error"
                            startIcon={<Cancel fontSize="small" />}
                            onClick={() => openReview(leave, 'reject')}
                            sx={{ fontSize: '0.75rem', py: 0.5, minWidth: { xs: 'auto', sm: 90 } }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                      <CheckCircle sx={{ fontSize: 48, color: '#2E7D32', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">
                        No pending leave requests. All caught up! ✅
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {action === 'approve' ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFF' }}>
              <Typography variant="body2"><b>Employee:</b> {selectedLeave.employee_name}</Typography>
              <Typography variant="body2"><b>Leave Type:</b> {selectedLeave.leave_type}</Typography>
              <Typography variant="body2"><b>Duration:</b> {selectedLeave.start_date} → {selectedLeave.end_date} ({selectedLeave.total_days} days)</Typography>
              <Typography variant="body2"><b>Reason:</b> {selectedLeave.reason}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={action === 'approve' ? 'Comments (optional)' : 'Reason for Rejection (required)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={action === 'approve' ? 'Any comments for the employee...' : 'Please explain why this leave is being rejected...'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            onClick={handleReview}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending || rejectMutation.isPending
              ? 'Processing...'
              : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
