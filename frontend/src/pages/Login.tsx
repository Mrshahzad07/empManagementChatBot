import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, alpha
} from '@mui/material';
import {
  Email as EmailIcon, Lock as LockIcon,
  Visibility, VisibilityOff, SmartToy as BotIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginThunk, fetchMeThunk } from '../store/authSlice';
import toast from 'react-hot-toast';

const AnimatedBox = motion.create(Box);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((s) => s.auth);
  const themeMode = useAppSelector((s) => s.ui.themeMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setIsSubmitting(true);
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      const meResult = await dispatch(fetchMeThunk());
      if (fetchMeThunk.fulfilled.match(meResult)) {
        toast.success('Welcome back! 👋');
        navigate('/dashboard');
      } else {
        setError('Failed to load user profile');
        setIsSubmitting(false);
      }
    } else {
      setError((result.payload as string) || 'Invalid credentials');
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: themeMode === 'dark'
          ? 'linear-gradient(135deg, #060D1A 0%, #0D1F3C 50%, #071220 100%)'
          : 'linear-gradient(135deg, #E8F0FF 0%, #C5D8FF 50%, #E0EAFF 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Animated Background Orbs */}
      {[...Array(5)].map((_, i) => (
        <AnimatedBox
          key={i}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            width: [300, 400, 200, 350, 250][i],
            height: [300, 400, 200, 350, 250][i],
            borderRadius: '50%',
            background: [
              'radial-gradient(circle, rgba(21,101,192,0.25), transparent 70%)',
              'radial-gradient(circle, rgba(255,111,0,0.15), transparent 70%)',
              'radial-gradient(circle, rgba(66,165,245,0.20), transparent 70%)',
              'radial-gradient(circle, rgba(21,101,192,0.18), transparent 70%)',
              'radial-gradient(circle, rgba(255,111,0,0.12), transparent 70%)',
            ][i],
            top: ['10%', '60%', '20%', '70%', '30%'][i],
            left: ['10%', '70%', '75%', '20%', '50%'][i],
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Left Panel — Branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
        }}
      >
        <AnimatedBox
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ textAlign: 'center', maxWidth: 480 }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
              boxShadow: '0 20px 60px rgba(21,101,192,0.4)',
            }}
          >
            <BotIcon sx={{ fontSize: 56, color: 'white' }} />
          </Box>

          <Typography variant="h2" fontWeight={800} sx={{
            color: themeMode === 'dark' ? 'white' : '#0D2137',
            mb: 2, lineHeight: 1.2,
          }}>
            AI Employee<br />Operating System
          </Typography>

          <Typography variant="h6" sx={{
            color: themeMode === 'dark' ? 'rgba(255,255,255,0.65)' : '#4A6382',
            mb: 5, fontWeight: 400, lineHeight: 1.7,
          }}>
            Your intelligent HR companion. Apply leaves, download payslips,<br />
            and access all HR services — just by chatting.
          </Typography>

          {/* Feature pills */}
          {[
            '💬 Natural Language — English, Hindi, Hinglish',
            '📄 Instant Salary Slips & Documents',
            '🌿 Smart Leave Management',
            '🔒 Enterprise-Grade Security',
          ].map((feature) => (
            <Box
              key={feature}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2, py: 0.75,
                m: 0.5,
                borderRadius: 20,
                background: themeMode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(21,101,192,0.08)',
                border: themeMode === 'dark'
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(21,101,192,0.15)',
              }}
            >
              <Typography variant="body2" sx={{
                color: themeMode === 'dark' ? 'rgba(255,255,255,0.8)' : '#1565C0',
                fontWeight: 500,
              }}>
                {feature}
              </Typography>
            </Box>
          ))}
        </AnimatedBox>
      </Box>

      {/* Right Panel — Login Form */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: { xs: 1, md: '0 0 480px' },
          p: 3,
        }}
      >
        <AnimatedBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          sx={{ width: '100%', maxWidth: 440 }}
        >
          <Card
            sx={{
              p: 1,
              background: themeMode === 'dark'
                ? 'rgba(15,28,46,0.85)'
                : 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(20px)',
              border: themeMode === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(21,101,192,0.12)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Mobile Logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
                }}>
                  <BotIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Typography fontWeight={700} sx={{ color: themeMode === 'dark' ? 'white' : '#0D2137' }}>
                  AI Employee OS
                </Typography>
              </Box>

              <Typography variant="h5" fontWeight={700} gutterBottom sx={{
                color: themeMode === 'dark' ? 'white' : '#0D2137',
              }}>
                Sign In to your account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your work email and password to continue
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="button" onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading || isSubmitting}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1976D2, #1565C0)',
                    },
                    fontSize: '1rem',
                  }}
                >
                  {(isLoading || isSubmitting) ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
              </form>

            </CardContent>
          </Card>
        </AnimatedBox>
      </Box>
    </Box>
  );
}
