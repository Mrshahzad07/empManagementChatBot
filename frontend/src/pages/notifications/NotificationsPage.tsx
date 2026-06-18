import React from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton, Switch,
  List, ListItem, ListItemText, ListItemIcon, Chip, Divider, alpha, Skeleton
} from '@mui/material';
import {
  Notifications, NotificationsActive, NotificationsOff, Circle, Check, DoneAll
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { Notification } from '../../types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const NOTIF_COLORS: Record<string, string> = {
  leave_applied: '#1565C0', leave_approved: '#2E7D32',
  leave_rejected: '#C62828', salary_generated: '#E65100',
  announcement: '#6A1B9A', general: '#607D8B',
};

export default function NotificationsPage() {
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const unreadCount = notifications?.filter((n: Notification) => !n.is_read).length || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Stay updated with your leave, salary, and company updates
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined" startIcon={<DoneAll />}
            onClick={() => markAllReadMutation.mutate()}
            size="small"
          >
            Mark All Read ({unreadCount})
          </Button>
        )}
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Box key={i} sx={{ p: 2 }}>
                <Skeleton height={60} />
              </Box>
            ))
          ) : notifications?.length > 0 ? (
            <List disablePadding>
              {notifications.map((notif: Notification, i: number) => {
                const color = NOTIF_COLORS[notif.notification_type] || '#1565C0';
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ListItem
                      sx={{
                        py: 2, px: 3,
                        background: !notif.is_read
                          ? (isDark ? alpha(color, 0.06) : alpha(color, 0.04))
                          : 'transparent',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        '&:hover': { background: isDark ? alpha('#fff', 0.03) : '#F8FAFF' },
                        cursor: notif.is_read ? 'default' : 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                    >
                      {/* Unread indicator */}
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {!notif.is_read ? (
                          <Circle sx={{ fontSize: 10, color }} />
                        ) : (
                          <Box sx={{ width: 10 }} />
                        )}
                      </ListItemIcon>

                      <ListItemText
                        disableTypography
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                            <Typography
                              variant="body2"
                              fontWeight={notif.is_read ? 400 : 700}
                            >
                              {notif.title}
                            </Typography>
                            <Chip
                              label={notif.notification_type.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                background: alpha(color, 0.1), color,
                                fontWeight: 600, fontSize: '0.65rem', height: 18,
                                textTransform: 'capitalize',
                              }}
                            />
                            {notif.priority === 'high' && (
                              <Chip label="HIGH" color="error" size="small"
                                sx={{ fontSize: '0.6rem', height: 18 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {notif.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {format(new Date(notif.created_at), 'dd MMM yyyy, HH:mm')}
                              {notif.read_at && ` · Read ${format(new Date(notif.read_at), 'HH:mm')}`}
                            </Typography>
                          </Box>
                        }
                      />

                      {!notif.is_read && (
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                          sx={{ color: '#2E7D32', opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          <Check fontSize="small" />
                        </IconButton>
                      )}
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsOff sx={{ fontSize: 56, opacity: 0.2, mb: 1 }} />
              <Typography color="text.secondary">No notifications yet</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
