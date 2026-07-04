/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fafaf7',
        coral: '#ff4514',
        'coral-deep': '#d93a10',
        'coral-soft': '#ffe4da',
        peach: '#ffd7c6',
        lavender: '#c9c6f2',
        lemon: '#f4ec6a',
        mint: '#c9f0d5',
        card: '#f4f4ef',
        'green-vivid': '#18ba1d',
        'blue-task': '#2486ff',
        'purple-task': '#9333ea',
        'text-primary': '#141414',
        'text-secondary': '#5c5c5c',
        'text-muted': '#6b7280',
        'border-light': '#d1d1d1',
        'border-faint': '#e5e7eb',
        'nav-inactive': '#78766e',
      },
      keyframes: {
        'tail-wag': {
          '0%, 100%': { transform: 'rotate(-16deg)' },
          '50%': { transform: 'rotate(24deg)' },
        },
        'chase-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'tail-wag': 'tail-wag 0.45s ease-in-out infinite',
        'chase-spin': 'chase-spin 1.1s cubic-bezier(0.6, 0.1, 0.4, 0.9) infinite',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      fontFamily: {
        teachers: ['Teachers', 'sans-serif'],
        gabarito: ['Gabarito', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
