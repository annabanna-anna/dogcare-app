/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fcfcfc',
        coral: '#ff4514',
        'coral-deep': '#d93a10',
        'coral-soft': '#ffe4da',
        peach: '#ffd7c6',
        lavender: '#c9c6f2',
        lemon: '#f4ec6a',
        mint: '#c9f0d5',
        card: '#f4f4ef',
        'green-vivid': '#18ba1d',
        'blue-task': '#2344dd',
        cobalt: '#2344dd',
        'cobalt-soft': '#dee3fa',
        'purple-task': '#9333ea',
        'text-primary': '#141414',
        'text-secondary': '#5c5c5c',
        'text-muted': '#6b7280',
        'border-light': '#d1d1d1',
        'border-faint': '#e5e7eb',
        'nav-inactive': '#78766e',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
