/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        // Semantic brand & status colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          glow: 'var(--color-primary-glow)',
          subtle: 'var(--color-primary-subtle)',
          border: 'var(--color-primary-border)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          subtle: 'var(--color-success-subtle)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          subtle: 'var(--color-warning-subtle)',
          border: 'var(--color-warning-border)',
          text: 'var(--color-warning-text)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          subtle: 'var(--color-danger-subtle)',
          border: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          subtle: 'var(--color-info-subtle)',
          border: 'var(--color-info-border)',
        },
        purple: {
          DEFAULT: 'var(--color-purple)',
          subtle: 'var(--color-purple-subtle)',
          border: 'var(--color-purple-border)',
        },
        pink: {
          DEFAULT: 'var(--color-pink)',
          subtle: 'var(--color-pink-subtle)',
          border: 'var(--color-pink-border)',
        },

        // Surface / Background tokens
        app: 'var(--bg-app)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          hover: 'var(--bg-surface-hover)',
        },
        sidebar: 'var(--bg-sidebar)',
        header: 'var(--bg-header)',
        backdrop: 'var(--bg-backdrop)',

        // Typography tokens (supports both text-main and text-text-main)
        text: {
          main: 'var(--text-main)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        main: 'var(--text-main)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',

        // Border tokens
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          focus: 'var(--border-focus)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--border-subtle)',
        subtle: 'var(--border-subtle)',
        focus: 'var(--border-focus)',
      },
      spacing: {
        18: '4.5rem',
      },
      backgroundImage: {
        'fb-blue': 'linear-gradient(135deg, #1877f2 0%, #0d5bbd 100%)',
        'fb-cyan': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        'fb-coral': 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
        'fb-amber': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'fb-violet': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        'fb-pink': 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        'shortcut-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'shortcut-amber': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
        'shortcut-slate': 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
        'shortcut-purple': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'auth-backdrop':
          'radial-gradient(at 10% 15%, var(--color-primary-subtle) 0px, transparent 55%), radial-gradient(at 90% 85%, var(--color-pink-subtle) 0px, transparent 55%), radial-gradient(at 50% 50%, var(--color-warning-subtle) 0px, transparent 65%), linear-gradient(145deg, var(--bg-app) 0%, var(--bg-surface-elevated) 100%)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glass: 'var(--shadow-glass)',
        glow: '0 0 14px var(--color-primary-glow)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInFromBottom: {
          from: { transform: 'translateY(1rem)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out both',
        'slide-in-bottom': 'slideInFromBottom 200ms ease-out both',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
