import { createTheme, alpha } from '@mui/material/styles';

const BRAND = {
  blue900: '#0D2137',
  blue800: '#0F3460',
  blue700: '#1565C0',
  blue600: '#1976D2',
  blue400: '#42A5F5',
  blue100: '#E3F2FD',
  blue50:  '#EBF5FF',
  accent:  '#FF6F00',
  accentLight: '#FFF3E0',
  success: '#2E7D32',
  error:   '#C62828',
  warning: '#F57F17',
  info:    '#0277BD',
};

const lightTokens = {
  bg:        '#F4F7FF',
  surface:   '#FFFFFF',
  surface2:  '#F0F4FF',
  border:    '#E0E7FF',
  text:      '#0D1421',
  textSub:   '#4A5568',
  textMuted: '#8898AA',
};

const darkTokens = {
  bg:        '#080F1A',
  surface:   '#0F1C2E',
  surface2:  '#162234',
  border:    '#1E3150',
  text:      '#E8EDF7',
  textSub:   '#8BA0BC',
  textMuted: '#4A6382',
};

export const getTheme = (mode: 'light' | 'dark') => {
  const tokens = mode === 'light' ? lightTokens : darkTokens;

  return createTheme({
    palette: {
      mode,
      primary: {
        main:        BRAND.blue700,
        light:       BRAND.blue400,
        dark:        BRAND.blue800,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main:        BRAND.accent,
        contrastText: '#FFFFFF',
      },
      background: {
        default: tokens.bg,
        paper:   tokens.surface,
      },
      text: {
        primary:   tokens.text,
        secondary: tokens.textSub,
        disabled:  tokens.textMuted,
      },
      divider: tokens.border,
      success: { main: BRAND.success },
      error:   { main: BRAND.error },
      warning: { main: BRAND.warning },
      info:    { main: BRAND.info },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.03em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontFamily: '"Inter", sans-serif', lineHeight: 1.7 },
      body2: { fontFamily: '"Inter", sans-serif', lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
      caption: { fontFamily: '"Inter", sans-serif' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      '0 1px 3px rgba(13,33,55,0.08)',
      '0 2px 8px rgba(13,33,55,0.10)',
      '0 4px 16px rgba(13,33,55,0.12)',
      '0 8px 24px rgba(13,33,55,0.12)',
      '0 12px 32px rgba(13,33,55,0.14)',
      '0 16px 40px rgba(13,33,55,0.16)',
      '0 20px 48px rgba(13,33,55,0.18)',
      ...Array(17).fill('none'),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          'html, body': {
            scrollBehavior: 'smooth',
            overflowX: 'hidden',
            WebkitTextSizeAdjust: '100%',
          },
          '::-webkit-scrollbar': { width: 6, height: 6 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#CBD5E0' : '#2D4A6A',
            borderRadius: 3,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          },
          contained: {
            boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(21,101,192,0.4)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${tokens.border}`,
            boxShadow: '0 2px 12px rgba(13,33,55,0.06)',
            background: tokens.surface,
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: '0 8px 28px rgba(13,33,55,0.12)',
            },
            // Responsive card padding
            '& .MuiCardContent-root': {
              '@media (max-width: 600px)': {
                padding: '12px',
                '&:last-child': { paddingBottom: '12px' },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              '&:hover fieldset': { borderColor: BRAND.blue600 },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: tokens.surface,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            '&.Mui-selected': {
              background: mode === 'light'
                ? `linear-gradient(135deg, ${BRAND.blue100}, ${alpha(BRAND.blue700, 0.08)})`
                : `linear-gradient(135deg, ${alpha(BRAND.blue700, 0.25)}, ${alpha(BRAND.blue700, 0.15)})`,
              color: BRAND.blue700,
              '& .MuiListItemIcon-root': { color: BRAND.blue700 },
              '&:hover': { background: mode === 'light' ? BRAND.blue100 : alpha(BRAND.blue700, 0.3) },
            },
            '&:hover': {
              background: mode === 'light' ? BRAND.blue50 : alpha(BRAND.blue700, 0.1),
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              background: mode === 'light' ? BRAND.blue50 : darkTokens.surface2,
              fontWeight: 700,
              color: tokens.textSub,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: `2px solid ${tokens.border}`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background 0.15s ease',
            '&:hover': {
              background: mode === 'light' ? BRAND.blue50 : alpha(BRAND.blue700, 0.05),
            },
            '&:last-child td': { borderBottom: 'none' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: '8px 6px',
              fontSize: '0.75rem',
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 100, height: 8 },
          bar: { borderRadius: 100 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  });
};
