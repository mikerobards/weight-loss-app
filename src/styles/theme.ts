'use client';

import { createTheme, PaletteMode } from '@mui/material/styles';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#0D9488' },
            secondary: { main: '#475569' },
            background: { default: '#F8FAFC', paper: '#FFFFFF' },
            divider: '#E2E8F0',
            warning: { main: '#F59E0B' },
          }
        : {
            primary: { main: '#2DD4BF' },
            secondary: { main: '#94A3B8' },
            background: { default: '#0F172A', paper: '#1E293B' },
            divider: '#334155',
            warning: { main: '#FBBF24' },
          }),
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: mode === 'light' ? '1px solid #E2E8F0' : '1px solid #334155',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
