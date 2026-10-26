import { defineConfig } from 'drizzle-kit'

// Generates SQL migrations from the schema: npm run db:generate
export default defineConfig({
  dialect: 'postgresql',
  schema: './api/src/stores/postgres/schema.ts',
  out: './api/drizzle',
})
