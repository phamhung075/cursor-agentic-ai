import type { Config } from 'drizzle-kit';
import * as path from 'path';

export default {
  schema: './src/core/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: path.resolve(process.cwd(), '_store', 'tasks.db'),
  },
} satisfies Config; 