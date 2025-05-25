#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DB_PATH = join(__dirname, '..', '_store', 'data', 'aai-enhanced.db');
const DATA_DIR = join(__dirname, '..', '_store', 'data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🗄️ Starting database migration...');

// Projects table
const createProjectsTable = `
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    git_url TEXT,
    branch TEXT DEFAULT 'main',
    language TEXT,
    framework TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    context_data JSON,
    settings JSON
);
`;

// Contexts table
const createContextsTable = `
CREATE TABLE IF NOT EXISTS contexts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    cursor_position JSON NOT NULL,
    selected_text TEXT,
    open_files JSON NOT NULL,
    recent_files JSON NOT NULL,
    workspace_state JSON NOT NULL,
    patterns JSON,
    relationships JSON,
    ai_insights JSON,
    confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;

// Memories table
const createMemoriesTable = `
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('context', 'code', 'conversation', 'pattern')),
    project_id TEXT NOT NULL,
    embedding_id TEXT,
    file_path TEXT,
    language TEXT,
    framework TEXT,
    tags JSON NOT NULL DEFAULT '[]',
    importance REAL DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    user_feedback JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;

// Automations table
const createAutomationsTable = `
CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    pattern_data JSON NOT NULL,
    template_data JSON NOT NULL,
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_executed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;

// Analytics events table
const createAnalyticsEventsTable = `
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    user_id TEXT,
    project_id TEXT,
    data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
`;

// File relationships table
const createFileRelationshipsTable = `
CREATE TABLE IF NOT EXISTS file_relationships (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    target_file TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('import', 'export', 'reference', 'semantic')),
    strength REAL DEFAULT 0.5,
    confidence REAL DEFAULT 0.5,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, source_file, target_file, relationship_type)
);
`;

// Performance metrics table
const createPerformanceMetricsTable = `
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    operation_name TEXT NOT NULL,
    duration REAL NOT NULL,
    memory_delta INTEGER DEFAULT 0,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// User sessions table
const createUserSessionsTable = `
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    session_data JSON NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
`;

// Learning patterns table
const createLearningPatternsTable = `
CREATE TABLE IF NOT EXISTS learning_patterns (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    pattern_type TEXT NOT NULL,
    pattern_data JSON NOT NULL,
    frequency INTEGER DEFAULT 1,
    confidence REAL DEFAULT 0.5,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;

// Create indexes for better performance
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);',
  'CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON projects(last_accessed);',
  'CREATE INDEX IF NOT EXISTS idx_contexts_project_id ON contexts(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_contexts_file_path ON contexts(file_path);',
  'CREATE INDEX IF NOT EXISTS idx_contexts_created_at ON contexts(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_memories_project_id ON memories(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);',
  'CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);',
  'CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed);',
  'CREATE INDEX IF NOT EXISTS idx_automations_project_id ON automations(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_file_relationships_project_id ON file_relationships(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_file_relationships_source_file ON file_relationships(source_file);',
  'CREATE INDEX IF NOT EXISTS idx_file_relationships_target_file ON file_relationships(target_file);',
  'CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation_name ON performance_metrics(operation_name);',
  'CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_user_sessions_project_id ON user_sessions(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);',
  'CREATE INDEX IF NOT EXISTS idx_learning_patterns_project_id ON learning_patterns(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_learning_patterns_pattern_type ON learning_patterns(pattern_type);',
  'CREATE INDEX IF NOT EXISTS idx_learning_patterns_confidence ON learning_patterns(confidence);'
];

try {
  // Create tables
  console.log('📋 Creating projects table...');
  db.exec(createProjectsTable);
  
  console.log('📋 Creating contexts table...');
  db.exec(createContextsTable);
  
  console.log('📋 Creating memories table...');
  db.exec(createMemoriesTable);
  
  console.log('📋 Creating automations table...');
  db.exec(createAutomationsTable);
  
  console.log('📋 Creating analytics_events table...');
  db.exec(createAnalyticsEventsTable);
  
  console.log('📋 Creating file_relationships table...');
  db.exec(createFileRelationshipsTable);
  
  console.log('📋 Creating performance_metrics table...');
  db.exec(createPerformanceMetricsTable);
  
  console.log('📋 Creating user_sessions table...');
  db.exec(createUserSessionsTable);
  
  console.log('📋 Creating learning_patterns table...');
  db.exec(createLearningPatternsTable);
  
  // Create indexes
  console.log('🔍 Creating indexes...');
  for (const indexSql of createIndexes) {
    db.exec(indexSql);
  }
  
  // Insert default project if none exists
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  
  if (projectCount.count === 0) {
    console.log('📝 Creating default project...');
    const insertDefaultProject = db.prepare(`
      INSERT INTO projects (id, name, path, branch, settings)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const defaultSettings = {
      autoSave: true,
      contextRetention: 30,
      aiAssistance: true,
      automationLevel: 'medium',
      memorySettings: {
        maxEntries: 10000,
        retentionDays: 90,
        vectorDimensions: 1536,
        similarityThreshold: 0.7
      }
    };
    
    insertDefaultProject.run(
      'default-project',
      'Default AAI Project',
      process.cwd(),
      'main',
      JSON.stringify(defaultSettings)
    );
  }
  
  console.log('✅ Database migration completed successfully!');
  console.log(`📍 Database location: ${DB_PATH}`);
  
  // Display table information
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n📊 Created tables:');
  tables.forEach((table: any) => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    console.log(`  - ${table.name}: ${count.count} records`);
  });
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n🎉 Migration completed successfully!'); 