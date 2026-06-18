import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography,
  List, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Badge, Divider, Tooltip, Chip, alpha,
  useMediaQuery, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Chat, Description, Money,
  EventNote, Notifications, Analytics, People, Settings,
  Logout, DarkMode, LightMode, SmartToy, Gavel,
  ChevronLeft, NotificationsActive, AccountCircle,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleTheme, toggleSidebar, setSidebarOpen } from '../store/uiSlice';
import { logoutThunk } from '../store/authSlice';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import toast from 'react-hot-toast';

const SIDEBAR_WIDTH = 260;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['employee', 'hr'] },
  { label: 'AI Assistant', icon: <Chat />, path: '/chat', roles: ['employee'] },
  { label: 'My Leave', icon: <EventNote />, path: '/leave', roles: ['employee'] },
  { label: 'Salary Slips', icon: <Money />, path: '/salary', roles: ['employee'] },
  { label: 'Documents', icon: <Description />, path: '/documents', roles: ['employee'] },
  { label: 'Notifications', icon: <Notifications />, path: '/notifications', roles: ['employee', 'hr'] },
  // HR
  { label: 'Leave Approval', icon: <Gavel />, path: '/hr/leave-approval', roles: ['hr'] },
  { label: 'Salary Dispatcher', icon: <AccountBalanceWallet />, path: '/hr/salary-dispatcher', roles: ['hr'] },
  { label: 'Salary Payments', icon: <AccountBalanceWallet />, path: '/hr/salary-payments', roles: ['hr'] },
  { label: 'Document Generator', icon: <Description />, path: '/hr/document-generator', roles: ['hr'] },
];

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const { user } = useAppSelector((s) => s.auth);
  const { themeMode, sidebarOpen } = useAppSelector((s) => s.ui);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Auto-close sidebar on mobile, auto-open on desktop
  useEffect(() => {
    dispatch(setSidebarOpen(!isMobile));
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unread_count || 0;

  const filteredNav = NAV_ITEMS.filter((item) =>
    user?.role && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logoutThunk());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) dispatch(setSidebarOpen(false));
  };

  const isActive = (path: string) => location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const isDark = themeMode === 'dark';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar — temporary on mobile, persistent on desktop */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={() => dispatch(setSidebarOpen(false))}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: sidebarOpen && !isMobile ? SIDEBAR_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            background: isDark
              ? 'linear-gradient(180deg, #0A1628 0%, #0F1C2E 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FF 100%)',
            boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 24px rgba(13,33,55,0.06)',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '12px',
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(21,101,192,0.4)',
            }}>
              <SmartToy sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700}
                sx={{ color: isDark ? 'white' : '#0D2137', lineHeight: 1.2 }}>
                AI Employee OS
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#8898AA', fontSize: '0.68rem' }}>
                Enterprise HR Platform
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => dispatch(setSidebarOpen(false))}
            sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#8898AA' }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

        {/* Navigation */}
        <List sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto' }}>
          {filteredNav.map((item) => {
            const active = isActive(item.path);
            const isNotif = item.path === '/notifications';
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => handleNavClick(item.path)}
                sx={{ mb: 0.5 }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: active ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.45)' : '#8898AA'),
                }}>
                  {isNotif && unreadCount > 0 ? (
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'primary.main' : 'text.secondary',
                  }}
                />
                {active && (
                  <Box sx={{
                    width: 3, height: 20, borderRadius: 10,
                    background: 'linear-gradient(180deg, #1565C0, #42A5F5)',
                  }} />
                )}
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

        {/* User Profile Bottom */}
        <Box
          sx={{ p: 2, cursor: 'pointer', '&:hover': { background: alpha('#1565C0', 0.05) } }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              width: 38, height: 38, fontSize: '0.875rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={600}
                sx={{ color: isDark ? 'white' : '#0D2137', lineHeight: 1.2 }} noWrap>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#8898AA' }}>
                {user?.role?.toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.3s ease' }}>
        {/* Top Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: isDark ? 'rgba(8,15,26,0.8)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
            {(!sidebarOpen || isMobile) && (
              <IconButton onClick={() => dispatch(setSidebarOpen(true))} size="small">
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? 'white' : '#0D2137' }}>
                {filteredNav.find((n) => isActive(n.path))?.label || 'Dashboard'}
              </Typography>
            </Box>

            {/* Chip with employee info */}
            <Chip
              size="small"
              label={user?.employee_id}
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                background: alpha('#1565C0', 0.1),
                color: '#1565C0',
                border: `1px solid ${alpha('#1565C0', 0.2)}`,
                display: { xs: 'none', sm: 'flex' },
              }}
            />

            {/* Theme toggle */}
            <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={() => dispatch(toggleTheme())} size="small">
                {isDark ? <LightMode sx={{ color: '#FFC107' }} /> : <DarkMode sx={{ color: '#1565C0' }} />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={() => navigate('/notifications')}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <NotificationsActive sx={{ color: unreadCount > 0 ? '#FF6F00' : 'text.secondary' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar */}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{
                width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 }, width: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1, minWidth: 220,
            background: isDark ? '#0F1C2E' : 'white',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={700}>{user?.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/dashboard'); }}>
          <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); dispatch(toggleTheme()); }}>
          <ListItemIcon>{isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}</ListItemIcon>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
}
