/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c3d3ff',
          300: '#96aeff',
          400: '#6281ff',
          500: '#3d56f5',
          600: '#2a3de8',
          700: '#2030d0',
          800: '#1e28a8',
          900: '#1e2585',
          950: '#141655',
        },
        neon: {
          cyan:    '#00f5ff',
          purple:  '#a855f7',
          green:   '#22c55e',
          amber:   '#f59e0b',
          pink:    '#ec4899',
          red:     '#ef4444',
        },
        surface: {
          DEFAULT: '#0d0f1a',
          1: '#111322',
          2: '#161828',
          3: '#1c1f30',
          4: '#222438',
          border: '#2a2d40',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':          'glow 2s ease-in-out infinite alternate',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'fade-in':       'fadeIn 0.25s ease-out',
        'scale-in':      'scaleIn 0.2s ease-out',
        'shimmer':       'shimmer 2s linear infinite',
        'float':         'float 6s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(61,86,245,0.4), 0 0 10px rgba(61,86,245,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(61,86,245,0.8), 0 0 40px rgba(61,86,245,0.4)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(61,86,245,0.5)',
        'glow-cyan':  '0 0 20px rgba(0,245,255,0.5)',
        'glow-purple':'0 0 20px rgba(168,85,247,0.5)',
        'glow-green': '0 0 20px rgba(34,197,94,0.5)',
        'inner-glow': 'inset 0 0 20px rgba(61,86,245,0.1)',
        'card':       '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
      },
      borderColor: {
        DEFAULT: '#2a2d40',
      },
    },
  },
  plugins: [],
};
