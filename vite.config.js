import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import pokeleetStorage from './server/plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // POKELEET_DATA_DIR can come from the shell or a .env / .env.local file.
  const env = loadEnv(mode, process.cwd(), 'POKELEET_')
  return {
    plugins: [
      react(),
      pokeleetStorage({ dataDir: env.POKELEET_DATA_DIR || 'data' }),
    ],
  }
})
