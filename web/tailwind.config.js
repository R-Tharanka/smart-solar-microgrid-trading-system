/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#07110f',
          900: '#0b1715',
          800: '#13231f',
        },
        energy: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      boxShadow: {
        panel: '0 18px 45px -28px rgba(15, 23, 42, 0.28)',
        energy: '0 0 36px rgba(16, 185, 129, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'energy-flow': {
          '0%': { strokeDashoffset: '42' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms ease-out both',
        'energy-flow': 'energy-flow 2.4s linear infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
