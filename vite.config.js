import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Progress lives in localStorage, which is scoped to the origin. If Vite
  // falls back to another port (5174, 5175...) the app loads with an empty
  // save and the old one is stranded on the original port. Fail loudly on a
  // busy port instead so that can never happen silently.
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
})
