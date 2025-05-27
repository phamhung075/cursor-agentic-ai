#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
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

// Create a basic task
const initTask = async () => {
  try {
    // Check if tasks table exists
    let tableExists = false;
    try {
      const result = await db.select().from({ t: { name: 'sqlite_master' } })
        .where(({ t }) => t.type.eq('table').and(t.name.eq('tasks')))
        .all();
      tableExists = result.length > 0;
    } catch (err) {
      console.error('Error checking if table exists:', err);
      return;
    }

    if (!tableExists) {
      console.log('Tasks table does not exist. Run the migrations first.');
      return;
    }

    // Create a test task
    const testTask = {
      id: 'test-task',
      type: 'task',
      level: 1,
      title: 'Test Task',
      description: 'This is a test task',
      status: 'pending',
      priority: 'medium',
      complexity: 'medium',
      progress: 0,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependencies: '[]', // JSON string
      tags: '[]', // JSON string
    };

    // Insert the task
    console.log('Inserting test task...');
    const query = `
      INSERT INTO tasks (
        id, type, level, title, description, status, priority, complexity,
        progress, ai_generated, created_at, updated_at, dependencies, tags
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;
    
    db.run(query, [
      testTask.id,
      testTask.type,
      testTask.level,
      testTask.title,
      testTask.description,
      testTask.status,
      testTask.priority,
      testTask.complexity,
      testTask.progress,
      testTask.aiGenerated ? 1 : 0,
      testTask.createdAt,
      testTask.updatedAt,
      testTask.dependencies,
      testTask.tags
    ]);
    
    console.log('Test task inserted successfully');
    
    // Verify the task was inserted
    const tasks = await db.select().from({ t: { name: 'tasks' } }).all();
    console.log('Current tasks in database:', tasks);
    
  } catch (error) {
    console.error('Error initializing task:', error);
  }
};

// Run the initialization
initTask()
  .then(() => {
    console.log('Initialization complete');
    sqlite.close();
    console.log('Database closed');
  })
  .catch((error) => {
    console.error('Initialization failed:', error);
    sqlite.close();
  }); 