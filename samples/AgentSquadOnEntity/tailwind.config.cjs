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
          // Bot colors used in chat panel
          requirements: {
            DEFAULT: '#2C1D26',
            light: '#F3F4F6',
            dark: '#1A1115',
            text: '#2C1D26',
            border: '#D1D5DB',
          },
          draft: {
            DEFAULT: '#10B981',
            light: '#D1FAE5',
            dark: '#047857',
            text: '#047857',
            border: '#6EE7B7',
          },
          review: {
            DEFAULT: '#F59E0B',
            light: '#FEF3C7',
            dark: '#D97706',
            text: '#D97706',
            border: '#FCD34D',
          },
          finalize: {
            DEFAULT: '#4A3640',
            light: '#F3F4F6',
            dark: '#2C1D26',
            text: '#2C1D26',
            border: '#D1D5DB',
          },
          error: {
            DEFAULT: '#EF4444',
            light: '#FEE2E2',
            dark: '#DC2626',
            text: '#DC2626',
            border: '#FCA5A5',
          }
        },
      },
    },
  },
  plugins: [],
}; 