import type { Config } from 'drizzle-kit';
import * as path from 'path';

export default {
  schema: './src/core/database/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: path.resolve(process.cwd(), 'data', 'tasks.db'),
  },
} satisfies Config; 