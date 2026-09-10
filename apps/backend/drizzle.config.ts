import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'path';

// Resolve relative to this file, not process.cwd(), so `db:migrate`/`db:generate`
// find the right .env regardless of the caller's working directory.
config({ path: join(__dirname, '.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});