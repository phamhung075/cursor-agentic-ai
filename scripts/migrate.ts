#!/usr/bin/env tsx

import databaseService from '../src/core/database/DatabaseService';

async function migrate() {
  console.log('Running database migrations...');

  try {
    // Initialize the database
    await databaseService.initialize();

    // Run migrations
    await databaseService.runMigrations();

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    databaseService.close();
  }
}

// Run the script
migrate().catch(console.error); 