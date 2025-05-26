#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the directory exists
const dbPath = path.resolve(process.cwd(), '_store', 'tasks.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create/open the database
console.log(`Opening database at ${dbPath}`);
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Run migrations
console.log('Running migrations...');
const migrationsPath = path.resolve(process.cwd(), 'drizzle');
if (!fs.existsSync(migrationsPath)) {
  console.error(`Migrations directory does not exist: ${migrationsPath}`);
  console.error('Please run: npx drizzle-kit generate');
  process.exit(1);
}

// Perform the migration
migrate(db, { migrationsFolder: migrationsPath });
console.log('Migrations completed successfully!');

// Close the database
sqlite.close();
console.log('Database closed.'); 