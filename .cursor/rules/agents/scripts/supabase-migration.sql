-- Migration script for Supabase to set up the task tables

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  level INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  complexity TEXT NOT NULL DEFAULT 'medium',
  estimated_hours REAL,
  actual_hours REAL,
  progress INTEGER NOT NULL DEFAULT 0,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence REAL,
  parent_id TEXT REFERENCES tasks(id),
  dependencies JSONB,
  blocked_by JSONB,
  enables JSONB,
  tags JSONB,
  assignee TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  started_at TEXT,
  metadata JSONB,
  ai_analysis JSONB
);

-- Task relationships table
CREATE TABLE IF NOT EXISTS task_relationships (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Task timeline events
CREATE TABLE IF NOT EXISTS task_timeline_events (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB,
  timestamp TEXT NOT NULL,
  user_id TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_task_relationships_parent_id ON task_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_relationships_child_id ON task_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_task_timeline_events_task_id ON task_timeline_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_timeline_events_event_type ON task_timeline_events(event_type);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON tasks
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated users" ON task_relationships
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated users" ON task_timeline_events
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated'); 