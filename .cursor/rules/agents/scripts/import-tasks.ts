#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import taskStorageFactory from '../src/core/tasks/TaskStorageFactory';
import { StorageType } from '../src/core/tasks/TaskStorageFactory';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function importTasks() {
  console.log('Importing tasks from nested_tasks.json...');

  try {
    // Source file path
    const sourceFile = path.resolve(process.cwd(), '_store', 'projects', '_core', 'tasks', 'nested_tasks.json');
    
    // Check if source file exists
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source file not found: ${sourceFile}`);
      process.exit(1);
    }

    // Get storage type from command line arguments or environment
    const storageType = process.argv[2] === 'supabase' ? StorageType.SUPABASE : StorageType.SQLITE;
    console.log(`Using ${storageType} storage backend`);

    // Initialize the task storage service
    const taskStorage = await taskStorageFactory.initialize({
      storageType
    });

    // Import tasks from JSON
    const importedCount = await taskStorage.importTasksFromJson(sourceFile);

    console.log(`Successfully imported ${importedCount} tasks from nested_tasks.json`);
    
    // Export tasks to verify the import (optional)
    const exportFile = path.resolve(process.cwd(), 'data', 'tasks_exported.json');
    const exportedCount = await taskStorage.exportTasksToJson(exportFile, { includeAll: true });
    
    console.log(`Exported ${exportedCount} tasks to ${exportFile} for verification.`);
  } catch (error) {
    console.error('Failed to import tasks:', error);
    process.exit(1);
  }
}

// Run the script
importTasks().catch(console.error); 