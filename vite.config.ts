import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two pages: the app, and the living design system at /design-system/
      // (src/design-system), which renders the app's real components.
      input: {
        main: resolve(__dirname, 'index.html'),
        designSystem: resolve(__dirname, 'design-system/index.html'),
      },
    },
  },
})
