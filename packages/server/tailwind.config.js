/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.vue",
    "./resources/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#a855f7',
          indigo: '#6366f1',
          cyan: '#22d3ee',
        },
        dark: {
          1: '#0f0f1a',
          2: '#1a1b26',
          3: '#24283b',
          4: '#3b4261',
        },
        surface: {
          1: 'rgb(var(--surface-1-rgb) / <alpha-value>)',
          2: 'rgb(var(--surface-2-rgb) / <alpha-value>)',
          3: 'rgb(var(--surface-3-rgb) / <alpha-value>)',
          4: 'rgb(var(--surface-4-rgb) / <alpha-value>)',
        },
      },
      textColor: {
        skin: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      borderColor: {
        skin: 'var(--border)',
      },
      backgroundColor: {
        glass: 'var(--glass-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 4s linear infinite',
        'terminal-glow': 'terminalGlow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'code-scroll': 'codeScroll 20s linear infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        terminalGlow: {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.1), 0 0 20px rgba(168, 85, 247, 0.05)' },
          '100%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.2), 0 0 40px rgba(168, 85, 247, 0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        codeScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};
