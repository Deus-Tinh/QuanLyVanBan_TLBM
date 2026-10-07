import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRouter from './router';
import { ThemeMode } from '@app-types/theme';
import '@styles/global.css';

const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export default function App() {
  // Giao diện thực tế đang kích hoạt: Mặc định Clean Light cho người dùng mở web lần đầu
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tlbm_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tlbm_theme', theme);
  }, [theme]);

  // Chuyển đổi nhanh 1-chạm giữa Sáng và Tối (dùng cho nút trên Header)
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Chọn trực tiếp 1 theme cụ thể
  const handleSelectTheme = (newTheme: ThemeMode) => {
    const validTheme: ThemeMode = newTheme === 'light' ? 'light' : 'dark';
    setTheme(validTheme);
  };

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: theme === 'dark' ? 'dark' : 'light',
        primary: {
          main: theme === 'dark' ? '#3b82f6' : '#2563eb',
        },
        background: {
          default: theme === 'dark' ? '#090d16' : '#ffffff',
          paper: theme === 'dark' ? '#121827' : '#ffffff',
        },
      },
      typography: {
        fontFamily: FONT_FAMILY,
        button: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: FONT_FAMILY,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              fontFamily: FONT_FAMILY,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontFamily: FONT_FAMILY,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontFamily: FONT_FAMILY,
            },
          },
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              fontFamily: FONT_FAMILY,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              fontFamily: FONT_FAMILY,
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              fontFamily: FONT_FAMILY,
            },
          },
        },
      },
    });
  }, [theme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppRouter
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
        onToggleTheme={handleToggleTheme}
        preferredLightTheme="light"
        preferredDarkTheme="dark"
      />
    </ThemeProvider>
  );
}



