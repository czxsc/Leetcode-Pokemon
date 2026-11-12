import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'
import { defineConfig, loadEnv } from 'vite'
import { pokeleetApi } from './api/src/local/plugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // POKELEET_* settings can come from the shell or a .env / .env.local file.
  const env = loadEnv(mode, process.cwd(), 'POKELEET_')
  return {
    // The online demo (npm run build:demo) lives under /<repo>/ on GitHub Pages.
    base: mode === 'demo' ? env.POKELEET_BASE || '/Leetcode-Pokemon/' : '/',
    plugins: [react(), pokeleetApi({ dataDir: env.POKELEET_DATA_DIR || 'data' })],
    // The dev server never needs infra/. On Windows, watching it also keeps
    // infra/cdk.out's folders open, so CDK can't rename its Lambda bundles (EPERM).
    server: { watch: { ignored: ['**/infra/**'] } },
    // infra/ is its own package with its own tests (cd infra && npm test)
    test: { exclude: [...configDefaults.exclude, 'infra/**'] },
  }
})
