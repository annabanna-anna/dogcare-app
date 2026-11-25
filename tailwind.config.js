import { primitives as p } from './src/theme/primitives.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Semantic tokens — what the UI uses. Each points at a primitive step
      // in src/theme/primitives.js; change the mapping here, not in components.
      colors: {
        cream: p.ink[50],
        coral: p.ember[500],
        'coral-deep': p.ember[600],
        'coral-soft': p.ember[100],
        card: p.ink[100],
        'green-vivid': p.green[500],
        'blue-task': p.cobalt[600],
        cobalt: p.cobalt[600],
        'cobalt-soft': p.cobalt[100],
        'purple-task': p.purple[600],
        'text-primary': p.ink[950],
        'text-secondary': p.ink[600],
        'text-muted': p.gray[500],
        'border-light': p.ink[300],
        'border-faint': p.gray[200],
        'nav-inactive': p.ink[500],
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
