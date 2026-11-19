/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a192f',
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#0a1f38',
          900: '#071322',
        },
        'primary-container': '#0b1e36',
        secondary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#0284c7',
          light: '#38bdf8',
          dark: '#0369a1',
        },
        danger: {
          DEFAULT: '#ba1a1a',
          50: '#fdecea',
          100: '#f9c6c4',
          500: '#ba1a1a',
          600: '#930000',
        },
        surface: {
          DEFAULT: '#f8fafc',
          dark: '#0f172a',
          card: '#ffffff',
          'card-dark': '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #050d1a 0%, #0a2540 50%, #1d4ed8 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 15, 34, 0.15)',
        'glass-lg': '0 20px 60px 0 rgba(0, 15, 34, 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'card-hover': '0 20px 40px -8px rgba(0, 15, 34, 0.15)',
      }
    },
  },
  plugins: [],
}
