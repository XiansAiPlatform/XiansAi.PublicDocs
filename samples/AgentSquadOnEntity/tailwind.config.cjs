/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        'display': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.7', letterSpacing: '0.005em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        primary: {
          DEFAULT: '#2C1D26', // Dark color from theprep.ai logo
          light: '#4A3640', // Lighter variant
          dark: '#1A1115', // Darker variant
        },
        accent: {
          DEFAULT: '#10B981', // Success green
          light: '#D1FAE5',
          dark: '#047857',
        },
        // New color palette inspired by the image
        lavender: {
          50: '#FAF8FF',
          100: '#F3EFFF',
          200: '#E8DEFF',
          300: '#D4C1FF',
          400: '#B395F5',
          500: '#9B6EE8',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6B21A8',
          900: '#581C87',
        },
        purple: {
          50: '#F7F5F7',
          100: '#EDE8ED',
          200: '#D9CDD9',
          300: '#C2A8C2',
          400: '#A67FA6',
          500: '#8B5A8B',
          600: '#6B4169',
          700: '#4D2F4A',
          800: '#3D2539',
          900: '#2C1D26',
        },
        warm: {
          50: '#FEFDFB',
          100: '#FCF9F4',
          200: '#F8F1E8',
          300: '#F2E6D6',
          400: '#E8D4B8',
          500: '#DBC299',
          600: '#C9A876',
          700: '#B08F56',
          800: '#8B7145',
          900: '#6B5534',
        },
        cream: {
          50: '#FEFEFE',
          100: '#FDFDFC',
          200: '#FAFAF8',
          300: '#F6F6F3',
          400: '#F0F0EC',
          500: '#E8E8E3',
          600: '#D8D8D1',
          700: '#C5C5BC',
          800: '#A8A89D',
          900: '#8A8A7E',
        },
        // Semantic colors for findings
        blue: {
          50: '#F0F8FF',
          100: '#E0F1FF',
          200: '#B3DBFF',
          300: '#80C4FF',
          400: '#4DA8FF',
          500: '#1A8EFF',
          600: '#0078E6',
          700: '#0063CC',
          800: '#004C99',
          900: '#003666',
        },
        yellow: {
          50: '#FFFCF0',
          100: '#FFF7D9',
          200: '#FFECB3',
          300: '#FFE080',
          400: '#FFD54D',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FF9F00',
          800: '#E68900',
          900: '#CC7700',
        },
        red: {
          50: '#FFF5F5',
          100: '#FED7D7',
          200: '#FEB2B2',
          300: '#FC8181',
          400: '#F56565',
          500: '#E53E3E',
          600: '#C53030',
          700: '#9B2C2C',
          800: '#822727',
          900: '#63171B',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        bot: {
          // Bot colors used in chat panel - using new color palette
          requirements: {
            DEFAULT: '#2C1D26', // purple-900
            light: '#F7F5F7', // purple-50
            dark: '#3D2539', // purple-800
            text: '#2C1D26', // purple-900
            border: '#D9CDD9', // purple-200
          },
          draft: {
            DEFAULT: '#B08F56', // warm-700
            light: '#F8F1E8', // warm-200
            dark: '#8B7145', // warm-800
            text: '#6B5534', // warm-900
            border: '#DBC299', // warm-500
          },
          review: {
            DEFAULT: '#9B6EE8', // lavender-500
            light: '#E8DEFF', // lavender-200
            dark: '#7C3AED', // lavender-700
            text: '#581C87', // lavender-900
            border: '#D4C1FF', // lavender-300
          },
          finalize: {
            DEFAULT: '#C5C5BC', // cream-700
            light: '#FAFAF8', // cream-200
            dark: '#A8A89D', // cream-800
            text: '#8A8A7E', // cream-900
            border: '#E8E8E3', // cream-500
          },
          // Semantic finding colors
          error: {
            DEFAULT: '#E53E3E', // red-500
            light: '#FED7D7', // red-100
            dark: '#C53030', // red-600
            text: '#63171B', // red-900
            border: '#FC8181', // red-300
          },
          warning: {
            DEFAULT: '#FFC107', // yellow-500
            light: '#FFF7D9', // yellow-100
            dark: '#FFB300', // yellow-600
            text: '#CC7700', // yellow-900
            border: '#FFE080', // yellow-300
          },
          info: {
            DEFAULT: '#1A8EFF', // blue-500
            light: '#E0F1FF', // blue-100
            dark: '#0078E6', // blue-600
            text: '#003666', // blue-900
            border: '#80C4FF', // blue-300
          }
        },
      },
    },
  },
  plugins: [],
}; 