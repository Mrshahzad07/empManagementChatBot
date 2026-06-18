import React from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  LinearProgress, Chip, List, ListItem, ListItemText,
  ListItemIcon, Divider, Avatar, IconButton, alpha, Skeleton
} from '@mui/material';
import {
  EventNote, Money, Description, Notifications,
  TrendingUp, CheckCircle, Cancel, AccessTime,
  ArrowForward, Download, Chat as ChatIcon, Warning,
  Celebration, Business, Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { leaveApi, salaryApi, notificationsApi, adminApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { format } from 'date-fns';

import HRDashboard from './HRDashboard';

const AnimatedCard = motion.create(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' }
  }),
};

const LEAVE_COLORS: Record<string, string> = {
  annual: '#1565C0', sick: '#C62828', casual: '#2E7D32',
  emergency: '#E65100', marriage: '#6A1B9A', unpaid: '#37474F',
};

const STATUS_CONFIG: Record<string, { color: any; icon: React.ReactNode; bg: string }> = {
  pending: { color: 'warning', icon: <AccessTime fontSize="small" />, bg: '#FFF8E1' },
  approved: { color: 'success', icon: <CheckCircle fontSize="small" />, bg: '#E8F5E9' },
  rejected: { color: 'error', icon: <Cancel fontSize="small" />, bg: '#FFEBEE' },
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => leaveApi.getBalance().then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  const { data: leaveHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['leave-history-recent'],
    queryFn: () => leaveApi.getHistory({ limit: 3 }).then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  const { data: salaryData, isLoading: salaryLoading } = useQuery({
    queryKey: ['salary-summary'],
    queryFn: () => salaryApi.getSummary().then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  const { data: notifications, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(false).then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => adminApi.getAnnouncements().then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  const { data: salarySlips } = useQuery({
    queryKey: ['salary-slips-recent'],
    queryFn: () => salaryApi.getSlips({ limit: 3 }).then((r) => r.data),
    enabled: user?.role === 'employee'
  });

  if (user?.role === 'hr') {
    return <HRDashboard />;
  }

  const today = new Date();

  return (
    <Box>
      {/* Welcome Header */}
      <AnimatedCard
        custom={0} variants={cardVariants} initial="hidden" animate="visible"
        sx={{
          mb: 3, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 60%, #0A2472 100%)',
          border: 'none',
        }}
      >
        {/* Decorative circles */}
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{
            position: 'absolute',
            width: [200, 160, 100][i - 1], height: [200, 160, 100][i - 1],
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            top: [-40, -20, 10][i - 1], right: [40, 150, 240][i - 1],
          }} />
        ))}
        <CardContent sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                {format(today, 'EEEE, dd MMMM yyyy')}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' } }}>
                Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'},
                {' '}{user?.first_name}! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                {user?.designation} • {user?.department?.name}
              </Typography>
            </Box>
            <Avatar sx={{
              width: { xs: 44, sm: 56 }, height: { xs: 44, sm: 56 }, fontSize: { xs: '1rem', sm: '1.4rem' }, fontWeight: 800,
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: { xs: 'none', sm: 'flex' },
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </Box>

          <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => navigate('/chat')}
              sx={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': { background: 'rgba(255,255,255,0.25)' },
                boxShadow: 'none',
              }}
            >
              Ask AI Assistant
            </Button>
          </Box>
        </CardContent>
      </AnimatedCard>

      <Grid container spacing={3}>
        {/* Leave Balance Widget */}
        <Grid item xs={12} md={4}>
          <AnimatedCard custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: alpha('#1565C0', 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EventNote sx={{ color: '#1565C0', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Leave Balance</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/leave')} endIcon={<ArrowForward fontSize="small" />}>
                  View All
                </Button>
              </Box>

              {balanceLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)
              ) : (
                <>
                  {/* Summary stats */}
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                      { label: 'Total', value: balanceData?.total_allocated || 0, color: '#1565C0' },
                      { label: 'Used', value: balanceData?.total_used || 0, color: '#C62828' },
                      { label: 'Pending', value: balanceData?.total_pending || 0, color: '#E65100' },
                      { label: 'Remaining', value: balanceData?.total_remaining || 0, color: '#2E7D32' },
                    ].map((stat) => (
                      <Grid item xs={6} key={stat.label}>
                        <Box sx={{
                          p: 1.5, borderRadius: 2,
                          background: alpha(stat.color, 0.06),
                          border: `1px solid ${alpha(stat.color, 0.12)}`,
                          textAlign: 'center',
                        }}>
                          <Typography variant="h5" fontWeight={800} sx={{ color: stat.color }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Per-type breakdown */}
                  {balanceData?.balances?.slice(0, 4).map((b: any) => (
                    <Box key={b.leave_type} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                          {b.leave_type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {b.used}/{b.allocated}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={b.allocated > 0 ? (b.used / b.allocated) * 100 : 0}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            background: LEAVE_COLORS[b.leave_type] || '#1565C0',
                          },
                          background: alpha(LEAVE_COLORS[b.leave_type] || '#1565C0', 0.12),
                        }}
                      />
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Salary Widget */}
        <Grid item xs={12} md={4}>
          <AnimatedCard custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: alpha('#2E7D32', 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Money sx={{ color: '#2E7D32', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Salary</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/salary')} endIcon={<ArrowForward fontSize="small" />}>
                  View All
                </Button>
              </Box>

              {salaryLoading ? (
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              ) : salaryData?.latest_salary ? (
                <>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(46,125,50,0.08), rgba(46,125,50,0.04))',
                    border: `1px solid ${alpha('#2E7D32', 0.15)}`,
                    mb: 2,
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      LATEST — {salaryData.latest_salary.month_name} {salaryData.latest_salary.year}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#2E7D32', mt: 0.5 }}>
                      ₹{salaryData.latest_salary.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Net Take Home</Typography>
                  </Box>

                  {/* Recent slips */}
                  {salarySlips?.slice(0, 3).map((slip: any) => (
                    <Box key={slip.id} sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      py: 1, borderBottom: `1px solid ${alpha('#000', isDark ? 0.1 : 0.05)}`,
                    }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {slip.month_name} {slip.year}
                        </Typography>
                        <Chip label={slip.payment_status} size="small" color="success"
                          sx={{ fontSize: '0.65rem', height: 18 }} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{slip.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Money sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography>No salary data found</Typography>
                </Box>
              )}
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Notifications Widget */}
        <Grid item xs={12} md={4}>
          <AnimatedCard custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: alpha('#FF6F00', 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Notifications sx={{ color: '#FF6F00', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Notifications</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/notifications')} endIcon={<ArrowForward fontSize="small" />}>
                  View All
                </Button>
              </Box>

              {notifLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)
              ) : notifications?.length > 0 ? (
                <List dense disablePadding>
                  {notifications.slice(0, 4).map((n: any, i: number) => (
                    <React.Fragment key={n.id}>
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                          {!n.is_read && (
                            <Box sx={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: '#FF6F00', mt: 0.5,
                            }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={n.is_read ? 400 : 700}>
                              {n.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {n.message.slice(0, 60)}...
                            </Typography>
                          }
                        />
                      </ListItem>
                      {i < Math.min(notifications.length, 4) - 1 && (
                        <Divider sx={{ opacity: 0.4 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography>All caught up!</Typography>
                </Box>
              )}
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Leave History Widget */}
        <Grid item xs={12} md={6}>
          <AnimatedCard custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Recent Leave Requests</Typography>
                <Button size="small" onClick={() => navigate('/leave')} endIcon={<ArrowForward fontSize="small" />}>
                  View All
                </Button>
              </Box>

              {historyLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={64} sx={{ mb: 1 }} />)
              ) : leaveHistory?.length > 0 ? (
                leaveHistory.map((lr: any) => {
                  const statusConf = STATUS_CONFIG[lr.status] || STATUS_CONFIG.pending;
                  return (
                    <Box key={lr.id} sx={{
                      p: 2, mb: 1.5, borderRadius: 2,
                      background: isDark ? alpha('#fff', 0.03) : '#F8FAFF',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={lr.leave_type}
                            size="small"
                            sx={{
                              background: alpha(LEAVE_COLORS[lr.leave_type] || '#1565C0', 0.12),
                              color: LEAVE_COLORS[lr.leave_type] || '#1565C0',
                              fontWeight: 700, fontSize: '0.7rem',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {lr.total_days} day{lr.total_days !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {lr.start_date} → {lr.end_date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {lr.reason.slice(0, 40)}{lr.reason.length > 40 ? '...' : ''}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusConf.icon as any}
                        label={lr.status.charAt(0).toUpperCase() + lr.status.slice(1)}
                        color={statusConf.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <EventNote sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography>No leave requests found</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => navigate('/chat')}>
                    Apply via AI Chat
                  </Button>
                </Box>
              )}
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Announcements Widget */}
        <Grid item xs={12} md={6}>
          <AnimatedCard custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: alpha('#9C27B0', 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Business sx={{ color: '#9C27B0', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Company Announcements</Typography>
              </Box>

              {announcements?.length > 0 ? (
                announcements.slice(0, 3).map((ann: any) => (
                  <Box key={ann.id} sx={{
                    p: 2, mb: 1.5, borderRadius: 2,
                    background: ann.is_pinned
                      ? (isDark ? alpha('#1565C0', 0.12) : '#EBF5FF')
                      : (isDark ? alpha('#fff', 0.03) : '#F8FAFF'),
                    border: `1px solid ${ann.is_pinned
                      ? alpha('#1565C0', 0.25)
                      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {ann.is_pinned && <Star sx={{ color: '#FF6F00', fontSize: 16 }} />}
                      <Typography variant="body2" fontWeight={700}>{ann.title}</Typography>
                      <Chip
                        label={ann.priority}
                        size="small"
                        color={ann.priority === 'high' || ann.priority === 'urgent' ? 'error' : 'default'}
                        sx={{ fontSize: '0.65rem', height: 18, ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {ann.content.slice(0, 100)}{ann.content.length > 100 ? '...' : ''}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Celebration sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography>No announcements</Typography>
                </Box>
              )}
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* AI Assistant Quick Card */}
        <Grid item xs={12}>
          <AnimatedCard
            custom={6} variants={cardVariants} initial="hidden" animate="visible"
            sx={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(21,101,192,0.15), rgba(13,71,161,0.08))'
                : 'linear-gradient(135deg, #EBF5FF, #DDEEFF)',
              border: `1px solid ${alpha('#1565C0', isDark ? 0.2 : 0.15)}`,
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'all 0.2s ease',
            }}
            onClick={() => navigate('/chat')}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                <Box sx={{
                  width: { xs: 44, sm: 56 }, height: { xs: 44, sm: 56 }, borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(21,101,192,0.35)',
                  flexShrink: 0,
                }}>
                  <ChatIcon sx={{ color: 'white', fontSize: { xs: 22, sm: 28 } }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1565C0', mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                    AI Assistant — Chat with your HR
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
                    "Need leave tomorrow" · "March salary slip" · "How many leaves left?" · "Download Form 16"
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/chat')}
                sx={{
                  background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Open Chat
              </Button>
            </CardContent>
          </AnimatedCard>
        </Grid>
      </Grid>
    </Box>
  );
}
