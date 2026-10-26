import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'data', 'coverage', 'recordings', 'infra/cdk.out', 'infra/node_modules']),
  {
    files: ['**/*.{js,jsx,ts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
  {
    // the web app (React)
    files: ['src/**/*.{js,jsx,ts}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: {
      // module-level constants must be declared before they are used (no TDZ at load time)
      'no-use-before-define': ['error', { functions: false, classes: true, variables: false }],
    },
  },
  {
    files: ['api/**/*.ts', 'infra/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // the PokéLeet Tracker browser extension (loaded as-is, no build step)
    files: ['extension/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },
])
