import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Task table definition
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // epic, feature, task, subtask, etc.
  level: integer('level').notNull(), // 1, 2, 3 for hierarchy depth
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // pending, in-progress, completed, etc.
  priority: text('priority').notNull().default('medium'),
  complexity: text('complexity').notNull().default('medium'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  progress: integer('progress').notNull().default(0), // 0-100
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).notNull().default(false),
  aiConfidence: real('ai_confidence'),
  parentId: text('parent_id').references(() => tasks.id), // Recursive reference to parent task
  dependencies: text('dependencies'), // Stored as JSON string
  blockedBy: text('blocked_by'), // Stored as JSON string
  enables: text('enables'), // Stored as JSON string
  tags: text('tags'), // Stored as JSON string
  assignee: text('assignee'),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
  startedAt: text('started_at'),
  metadata: text('metadata'), // Stored as JSON string
  aiAnalysis: text('ai_analysis'), // Stored as JSON string
});

// Task relationships table for managing children
export const taskRelationships = sqliteTable('task_relationships', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull().references(() => tasks.id),
  childId: text('child_id').notNull().references(() => tasks.id),
  order: integer('order').notNull().default(0), // For maintaining child order
});

// Task timeline events
export const taskTimelineEvents = sqliteTable('task_timeline_events', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  eventType: text('event_type').notNull(), // created, updated, status_changed, etc.
  details: text('details'), // JSON string with event details
  timestamp: text('timestamp').notNull(),
  userId: text('user_id'), // Who triggered the event
});

// Types for TypeScript support
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskRelationship = typeof taskRelationships.$inferSelect;
export type NewTaskRelationship = typeof taskRelationships.$inferInsert;

export type TaskTimelineEvent = typeof taskTimelineEvents.$inferSelect;
export type NewTaskTimelineEvent = typeof taskTimelineEvents.$inferInsert; 