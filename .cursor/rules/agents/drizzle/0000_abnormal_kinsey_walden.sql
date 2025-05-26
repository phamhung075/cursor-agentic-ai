CREATE TABLE `task_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`child_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`child_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`event_type` text NOT NULL,
	`details` text,
	`timestamp` text NOT NULL,
	`user_id` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`level` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`complexity` text DEFAULT 'medium' NOT NULL,
	`estimated_hours` real,
	`actual_hours` real,
	`progress` integer DEFAULT 0 NOT NULL,
	`ai_generated` integer DEFAULT false NOT NULL,
	`ai_confidence` real,
	`parent_id` text,
	`dependencies` text,
	`blocked_by` text,
	`enables` text,
	`tags` text,
	`assignee` text,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`started_at` text,
	`metadata` text,
	`ai_analysis` text,
	FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
