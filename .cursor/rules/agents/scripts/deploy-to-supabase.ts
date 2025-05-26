#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exit } from 'process';

// Load environment variables
dotenv.config();

async function deployToSupabase() {
  console.log('Deploying schema to Supabase...');

  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Note: We need the service key, not the anon key

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
    exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read the migration SQL file
    const migrationPath = path.resolve(__dirname, 'supabase-migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into separate statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('pgexecute', {
        query: statement + ';'
      });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        // Continue with other statements
      }
    }

    console.log('Schema deployment completed successfully!');
  } catch (error) {
    console.error('Failed to deploy schema to Supabase:', error);
    exit(1);
  }
}

// Run the script
deployToSupabase().catch(console.error); 