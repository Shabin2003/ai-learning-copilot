/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0D0D0F',
          soft: '#1C1C21',
          muted: '#2E2E38',
        },
        chalk: {
          DEFAULT: '#F5F4F0',
          soft: '#EAE9E4',
          muted: '#C8C6BF',
        },
        sage: {
          light: '#A8C5A0',
          DEFAULT: '#6BAE60',
          dark: '#3D7A35',
        },
        amber: {
          light: '#FFD97D',
          DEFAULT: '#F5A623',
          dark: '#C27A0E',
        },
        coral: {
          light: '#FF9B8A',
          DEFAULT: '#E85D42',
          dark: '#B83A25',
        },
        azure: {
          light: '#A8CCF0',
          DEFAULT: '#4A90D9',
          dark: '#2563A8',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake': 'shake 0.4s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
        'progress': 'progress 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(107, 174, 96, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(107, 174, 96, 0.6)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
