/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nerve: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          red: 'var(--color-red)',
          'red-dark': 'var(--color-red-dark)',
          'red-glow': 'var(--color-red-glow)',
          green: 'var(--color-green)',
          'green-glow': 'var(--color-green-glow)',
          yellow: 'var(--color-yellow)',
          'yellow-glow': 'var(--color-yellow-glow)',
          orange: 'var(--color-orange)',
          blue: 'var(--color-blue)',
          gray: 'var(--color-gray)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          dim: 'var(--color-dim)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-orange': 'pulse-orange 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-green': 'pulse-green 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-in': 'glow-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'count-up': 'count-up 0.5s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(229,25,58,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(229,25,58,0)' },
        },
        'pulse-orange': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(249,115,22,0)' },
        },
        'pulse-green': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.3)' },
          '50%': { boxShadow: '0 0 0 6px rgba(34,197,94,0)' },
        },
        'glow-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
