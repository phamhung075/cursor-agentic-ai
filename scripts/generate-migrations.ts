#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

async function generateMigrations() {
  console.log('Generating database migrations...');

  try {
    // Ensure drizzle directory exists
    const drizzleDir = path.resolve(process.cwd(), 'drizzle');
    if (!fs.existsSync(drizzleDir)) {
      fs.mkdirSync(drizzleDir, { recursive: true });
    }

    // Run drizzle-kit to generate migrations
    const { stdout, stderr } = await execAsync('npx drizzle-kit generate:sqlite');
    
    if (stderr) {
      console.error('Error during migration generation:', stderr);
    }
    
    console.log(stdout);
    console.log('Migrations generated successfully!');
  } catch (error) {
    console.error('Failed to generate migrations:', error);
    process.exit(1);
  }
}

// Run the script
generateMigrations().catch(console.error); 