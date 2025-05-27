#!/usr/bin/env tsx

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
const db = new Database(dbPath);

// Check database structure
try {
  console.log('Checking database structure...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in database:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'tasks')) {
    const columns = db.prepare("PRAGMA table_info(tasks)").all();
    console.log('Columns in tasks table:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });
    
    // Insert a test task
    try {
      console.log('Inserting test task...');
      const stmt = db.prepare(`
        INSERT INTO tasks (
          id, type, level, title, description, status, priority, complexity,
          progress, ai_generated, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
      const result = stmt.run(
        'test-task-1',
        'task',
        1,
        'Test Task',
        'This is a test task',
        'pending',
        'medium',
        'medium',
        0,
        0, // false
        new Date().toISOString(),
        new Date().toISOString()
      );
      
      console.log('Test task inserted successfully:', result);
      
      // Verify the task was inserted
      const tasks = db.prepare("SELECT * FROM tasks").all();
      console.log('Current tasks in database:', tasks.length);
      tasks.forEach(task => {
        console.log(`- ${task.id}: ${task.title} (${task.status})`);
      });
    } catch (error) {
      console.error('Error inserting test task:', error);
    }
  } else {
    console.log('Tasks table does not exist. Run the migrations first.');
  }
} catch (error) {
  console.error('Error checking database structure:', error);
}

// Close the database
db.close();
console.log('Database closed'); 