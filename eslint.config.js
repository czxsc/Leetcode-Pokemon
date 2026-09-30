import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'data']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['server/**/*.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // the PokéLeet Tracker browser extension (loaded as-is, no build step)
    files: ['extension/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },
])
