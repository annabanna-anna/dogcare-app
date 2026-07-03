/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fffdf5',
        coral: '#f8593a',
        'green-vivid': '#18ba1d',
        'blue-task': '#2486ff',
        'purple-task': '#9333ea',
        'text-primary': '#1f1f1f',
        'text-secondary': '#5c5c5c',
        'text-muted': '#6b7280',
        'border-light': '#d1d1d1',
        'border-faint': '#e5e7eb',
        'nav-inactive': '#78766e',
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
