/**
 * MCP Inspector v0.13.0 Compatible SSE Server
 * 
 * Implements Model Context Protocol over Server-Sent Events
 * Compatible with MCP Inspector v0.13.0 and follows JSON-RPC 2.0 protocol
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';
import net from 'net';
import taskStorageFactory from '../core/tasks/TaskStorageFactory';
import { StorageType } from '../core/tasks/TaskStorageFactory';
import { TaskModel } from '../core/database/TaskMapper';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Logging interface to avoid 'any' type
interface Logger {
	info: (component: string, message: string, metadata?: Record<string, unknown>) => void;
	error: (component: string, message: string, metadata?: Record<string, unknown>) => void;
	warn: (component: string, message: string, metadata?: Record<string, unknown>) => void;
	debug: (component: string, message: string, metadata?: Record<string, unknown>) => void;
}

// Simple logger implementation
const log: Logger = {
	info: (component: string, message: string, metadata?: Record<string, unknown>) => {
		console.log(`[INFO] ${component}: ${message}`, metadata ? JSON.stringify(metadata) : '');
	},
	error: (component: string, message: string, metadata?: Record<string, unknown>) => {
		console.error(`[ERROR] ${component}: ${message}`, metadata ? JSON.stringify(metadata) : '');
	},
	warn: (component: string, message: string, metadata?: Record<string, unknown>) => {
		console.warn(`[WARN] ${component}: ${message}`, metadata ? JSON.stringify(metadata) : '');
	},
	debug: (component: string, message: string, metadata?: Record<string, unknown>) => {
		console.debug(`[DEBUG] ${component}: ${message}`, metadata ? JSON.stringify(metadata) : '');
	}
};

// MCP Protocol types
interface JsonRpcRequest {
	jsonrpc: '2.0';
	id?: string | number;
	method: string;
	params?: Record<string, unknown>;
}

interface JsonRpcResponse {
	jsonrpc: '2.0';
	id?: string | number | undefined;
	result?: unknown;
	error?: {
		code: number;
		message: string;
		data?: unknown;
	};
}

interface MCPTool {
	name: string;
	description: string;
	inputSchema: {
		type: 'object';
		properties: Record<string, {
			type: string;
			description: string;
			required?: boolean;
			enum?: string[] | number[];
			minimum?: number;
			maximum?: number;
			format?: string;
			items?: {
				type: string;
				[key: string]: any;
			};
			examples?: any[];
			[key: string]: any;
		}>;
		required?: string[];
		examples?: any[];
	};
}

interface MCPResource {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
	schema?: {
		type: string;
		properties: Record<string, any>;
		[key: string]: any;
	};
}

interface MCPPrompt {
	name: string;
	description: string;
	arguments?: {
		name: string;
		description: string;
		required?: boolean;
		example?: string;
	}[];
	template?: string;
}

interface SessionData {
	id: string;
	response: express.Response;
	initialized: boolean;
	capabilities: Record<string, unknown>;
	createdAt: Date;
}

// Global event emitter for MCP events
export const mcpEvents = new EventEmitter();
mcpEvents.setMaxListeners(100);

class MCPSSEServer {
	private app: express.Express;
	private server: http.Server | null = null;
	private port: number = 3233;
	private sessions: Map<string, SessionData> = new Map();
	private intervalHandlers: NodeJS.Timeout[] = [];
	private isShuttingDown: boolean = false;
	private taskStorageInitialized: boolean = false;

	// MCP Protocol version
	private readonly protocolVersion = '2024-11-05';

	// Updated MCP tools to include task operations
	private readonly tools: MCPTool[] = [
		{
			name: 'create_task',
			description: 'Create a new task in the system with comprehensive metadata. Tasks can be nested in a hierarchy and have various properties to describe their nature, priority, and relationships.',
			inputSchema: {
				type: 'object',
				properties: {
					title: { 
						type: 'string', 
						description: 'Task title - should be concise but descriptive (max 100 chars)'
					},
					description: { 
						type: 'string', 
						description: 'Detailed task description explaining what needs to be done, acceptance criteria, and any relevant context'
					},
					type: { 
						type: 'string', 
						description: 'Task type categorizing the work (epic, feature, task, bug, subtask, etc.)',
						enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
					},
					level: { 
						type: 'number', 
						description: 'Task hierarchy level (1=Epic, 2=Feature, 3=Task, 4=Subtask, etc.)',
						minimum: 1,
						maximum: 5
					},
					status: { 
						type: 'string', 
						description: 'Current task status in the workflow',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
					},
					priority: { 
						type: 'string', 
						description: 'Task priority level reflecting importance and urgency',
						enum: ['low', 'medium', 'high', 'critical']
					},
					complexity: { 
						type: 'string', 
						description: 'Estimated task complexity affecting effort required',
						enum: ['low', 'medium', 'high', 'very_complex']
					},
					parent: { 
						type: 'string', 
						description: 'Parent task ID if this is a subtask or part of a larger feature/epic (null for top-level tasks)'
					},
					tags: { 
						type: 'array', 
						description: 'List of tags for categorization and filtering',
						items: {
							type: 'string'
						},
						examples: [['backend', 'database', 'migration'], ['frontend', 'ui', 'component']]
					},
					estimatedHours: {
						type: 'number',
						description: 'Estimated time to complete the task in hours',
						minimum: 0
					},
					dueDate: {
						type: 'string',
						description: 'Due date for task completion in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)',
						format: 'date-time'
					}
				},
				required: ['title', 'type', 'level'],
				examples: [
					{
						title: "Implement user authentication",
						description: "Create the authentication system with login, registration, and password reset functionality",
						type: "feature",
						level: 2,
						status: "pending",
						priority: "high",
						complexity: "medium",
						tags: ["backend", "security", "user-management"]
					},
					{
						title: "Fix navigation menu overflow on mobile",
						description: "The navigation menu items overflow on mobile devices smaller than 375px width",
						type: "bug",
						level: 3,
						status: "in-progress",
						priority: "medium",
						complexity: "low",
						parent: "feat_001",
						tags: ["frontend", "responsive", "mobile"]
					}
				]
			}
		},
		{
			name: 'get_tasks',
			description: 'Query and retrieve tasks with flexible filtering options. This tool allows you to search and filter tasks based on various criteria such as status, type, priority, etc. Results are paginated for efficient handling of large task sets.',
			inputSchema: {
				type: 'object',
				properties: {
					status: { 
						type: 'string', 
						description: 'Filter tasks by their current status',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
					},
					type: { 
						type: 'string', 
						description: 'Filter tasks by their type category',
						enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
					},
					priority: { 
						type: 'string', 
						description: 'Filter tasks by priority level',
						enum: ['low', 'medium', 'high', 'critical'] 
					},
					level: { 
						type: 'number', 
						description: 'Filter tasks by their hierarchy level',
						minimum: 1,
						maximum: 5
					},
					parent: { 
						type: 'string', 
						description: 'Filter tasks by their parent task ID to find all subtasks of a specific parent'
					},
					limit: { 
						type: 'number', 
						description: 'Maximum number of tasks to return (pagination)',
						default: 10,
						minimum: 1,
						maximum: 100
					},
					offset: { 
						type: 'number', 
						description: 'Number of tasks to skip (for pagination)',
						default: 0,
						minimum: 0
					},
					search: {
						type: 'string',
						description: 'Text search query to filter tasks by title or description content'
					},
					tags: {
						type: 'array',
						description: 'Filter tasks that have all of the specified tags',
						items: {
							type: 'string'
						}
					},
					sortBy: {
						type: 'string',
						description: 'Field to sort results by',
						enum: ['createdAt', 'updatedAt', 'priority', 'level', 'title', 'status']
					},
					sortOrder: {
						type: 'string',
						description: 'Sort direction (ascending or descending)',
						enum: ['asc', 'desc']
					}
				},
				examples: [
					{
						status: "pending",
						priority: "high",
						limit: 5
					},
					{
						type: "bug",
						tags: ["frontend", "ui"],
						sortBy: "priority",
						sortOrder: "desc"
					},
					{
						parent: "epic_001",
						status: "in-progress"
					}
				]
			}
		},
		{
			name: 'update_task',
			description: 'Update an existing task with new values. This tool allows you to modify various properties of a task while maintaining its relationships and history. Only the specified fields will be updated; unspecified fields will retain their current values.',
			inputSchema: {
				type: 'object',
				properties: {
					id: { 
						type: 'string', 
						description: 'Unique task ID of the task to update (required)',
						pattern: '^[a-zA-Z0-9_-]+$'
					},
					title: { 
						type: 'string', 
						description: 'New task title (max 100 chars)'
					},
					description: { 
						type: 'string', 
						description: 'New task description with details about what needs to be done'
					},
					status: { 
						type: 'string', 
						description: 'New task status to represent workflow progress',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled'] 
					},
					priority: { 
						type: 'string', 
						description: 'New task priority level',
						enum: ['low', 'medium', 'high', 'critical'] 
					},
					complexity: { 
						type: 'string', 
						description: 'New estimated task complexity',
						enum: ['low', 'medium', 'high', 'very_complex'] 
					},
					progress: { 
						type: 'number', 
						description: 'New task completion percentage (0-100)',
						minimum: 0,
						maximum: 100
					},
					tags: { 
						type: 'array', 
						description: 'New list of tags for categorization (replaces existing tags)',
						items: {
							type: 'string'
						}
					},
					parent: {
						type: 'string',
						description: 'New parent task ID to move this task under a different parent'
					},
					estimatedHours: {
						type: 'number',
						description: 'New estimated hours to complete the task',
						minimum: 0
					},
					actualHours: {
						type: 'number',
						description: 'Actual hours spent on the task',
						minimum: 0
					},
					dueDate: {
						type: 'string',
						description: 'New due date for task completion in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)',
						format: 'date-time'
					},
					assignee: {
						type: 'string',
						description: 'ID or name of person assigned to the task'
					}
				},
				required: ['id'],
				examples: [
					{
						id: "task_123",
						status: "in-progress",
						progress: 25
					},
					{
						id: "bug_456",
						priority: "high",
						assignee: "developer1",
						tags: ["critical", "customer-impacting"]
					},
					{
						id: "feat_789",
						title: "Improved user authentication flow",
						description: "Updated authentication flow with better error handling and user feedback",
						status: "completed",
						progress: 100,
						actualHours: 12
					}
				]
			}
		},
		{
			name: 'delete_task',
			description: 'Permanently remove a task from the system. This operation cannot be undone. When deleting a parent task, you can optionally cascade delete all of its subtasks or promote them to the parent level.',
			inputSchema: {
				type: 'object',
				properties: {
					id: { 
						type: 'string', 
						description: 'Unique ID of the task to delete',
						pattern: '^[a-zA-Z0-9_-]+$'
					},
					cascade: {
						type: 'boolean',
						description: 'If true and the task has subtasks, all subtasks will also be deleted. If false, subtasks will be kept and promoted to the parent level.',
						default: false
					},
					reason: {
						type: 'string',
						description: 'Optional reason for deleting the task (for audit purposes)'
					}
				},
				required: ['id'],
				examples: [
					{
						id: "task_123"
					},
					{
						id: "feat_456",
						cascade: true,
						reason: "Feature no longer needed in product roadmap"
					}
				]
			}
		},
		{
			name: 'get_task_tree',
			description: 'Retrieve a hierarchical tree representation of tasks starting from a specified root task. This builds a nested structure showing the complete task hierarchy with parent-child relationships maintained.',
			inputSchema: {
				type: 'object',
				properties: {
					rootId: { 
						type: 'string', 
						description: 'ID of the root task to start the tree from. For complete project tree, use a top-level epic ID.',
						pattern: '^[a-zA-Z0-9_-]+$'
					},
					depth: { 
						type: 'number', 
						description: 'Maximum depth of hierarchy to retrieve. Use -1 for unlimited depth.',
						default: -1,
						minimum: -1
					},
					includeCompleted: {
						type: 'boolean',
						description: 'If true, completed tasks will be included in the tree. If false, only pending and in-progress tasks are included.',
						default: true
					},
					format: {
						type: 'string',
						description: 'Format of the returned tree structure',
						enum: ['full', 'summary', 'minimal'],
						default: 'full'
					}
				},
				required: ['rootId'],
				examples: [
					{
						rootId: "epic_001",
						depth: 2
					},
					{
						rootId: "feat_123",
						includeCompleted: false,
						format: "summary"
					}
				]
			}
		},
		{
			name: 'get_system_status',
			description: 'Retrieve comprehensive information about the current system status including health metrics, storage information, uptime, and active sessions. This tool is useful for monitoring system health and troubleshooting issues.',
			inputSchema: {
				type: 'object',
				properties: {
					includeMetrics: {
						type: 'boolean',
						description: 'Include detailed performance metrics in the response',
						default: false
					},
					format: {
						type: 'string',
						description: 'Format of the response data',
						enum: ['simple', 'detailed'],
						default: 'simple'
					}
				},
				examples: [
					{},
					{ includeMetrics: true, format: 'detailed' }
				]
			}
		},
		{
			name: 'get_most_priority_task',
			description: 'Identify and retrieve the highest priority task in the system based on a combination of priority, status, and due date. This tool is useful for focusing on the most important work.',
			inputSchema: {
				type: 'object',
				properties: {
					status: { 
						type: 'string', 
						description: 'Optional filter by task status. If provided, only tasks with this status will be considered.',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
					},
					type: { 
						type: 'string', 
						description: 'Optional filter by task type. If provided, only tasks of this type will be considered.',
						enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
					},
					algorithm: {
						type: 'string',
						description: 'Algorithm to use for priority calculation',
						enum: ['simple', 'weighted', 'ml-enhanced'],
						default: 'weighted'
					},
					excludeTags: {
						type: 'array',
						description: 'List of tags to exclude from consideration',
						items: {
							type: 'string'
						}
					}
				},
				examples: [
					{},
					{ status: 'pending', type: 'bug' },
					{ algorithm: 'ml-enhanced', excludeTags: ['backlog', 'future'] }
				]
			}
		},
		{
			name: 'get_subtasks',
			description: 'Retrieve all subtasks of a specified parent task. This provides a flattened list of all direct child tasks with their complete details.',
			inputSchema: {
				type: 'object',
				properties: {
					parentId: { 
						type: 'string', 
						description: 'ID of the parent task to get subtasks for',
						pattern: '^[a-zA-Z0-9_-]+$'
					},
					includeCompleted: {
						type: 'boolean',
						description: 'Include completed subtasks in the results',
						default: true
					},
					recursive: {
						type: 'boolean',
						description: 'If true, also include subtasks of subtasks (all descendants)',
						default: false
					},
					sortBy: {
						type: 'string',
						description: 'Field to sort subtasks by',
						enum: ['priority', 'status', 'createdAt', 'title'],
						default: 'priority'
					},
					sortOrder: {
						type: 'string',
						description: 'Sort direction',
						enum: ['asc', 'desc'],
						default: 'desc'
					}
				},
				required: ['parentId'],
				examples: [
					{ parentId: "feat_123" },
					{ parentId: "epic_001", recursive: true, sortBy: "status" }
				]
			}
		},
		{
			name: 'delete_all_tasks',
			description: 'Delete all tasks in the system. This is a destructive operation that cannot be undone and should be used with extreme caution. Typically used for system cleanup or resetting during development.',
			inputSchema: {
				type: 'object',
				properties: {
					confirm: { 
						type: 'boolean', 
						description: 'Confirmation flag that must be set to true to perform this destructive operation',
					},
					backupBeforeDelete: {
						type: 'boolean',
						description: 'Create a backup of all tasks before deletion',
						default: true
					},
					type: {
						type: 'string',
						description: 'Optional filter to delete only tasks of a specific type',
						enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
					},
					status: {
						type: 'string',
						description: 'Optional filter to delete only tasks with a specific status',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
					},
					auditReason: {
						type: 'string',
						description: 'Reason for this mass deletion (for audit logs)'
					}
				},
				required: ['confirm'],
				examples: [
					{ confirm: true, backupBeforeDelete: true, auditReason: "Development environment reset" },
					{ confirm: true, status: "completed", auditReason: "Cleanup completed tasks" }
				]
			}
		},
		{
			name: 'delete_all_subtasks',
			description: 'Delete all subtasks of a specified parent task. This operation removes all direct child tasks while keeping the parent task intact. Useful for cleaning up or re-planning a feature or epic.',
			inputSchema: {
				type: 'object',
				properties: {
					parentId: { 
						type: 'string', 
						description: 'ID of the parent task whose subtasks should be deleted',
						pattern: '^[a-zA-Z0-9_-]+$'
					},
					confirm: { 
						type: 'boolean', 
						description: 'Confirmation flag that must be set to true to perform this destructive operation',
					},
					recursive: {
						type: 'boolean',
						description: 'If true, also delete subtasks of subtasks (all descendants)',
						default: false
					},
					backupBeforeDelete: {
						type: 'boolean',
						description: 'Create a backup of all subtasks before deletion',
						default: true
					},
					onlyStatus: {
						type: 'string',
						description: 'Only delete subtasks with this status',
						enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
					},
					auditReason: {
						type: 'string',
						description: 'Reason for this deletion (for audit logs)'
					}
				},
				required: ['parentId', 'confirm'],
				examples: [
					{ parentId: "feat_123", confirm: true },
					{ parentId: "epic_001", confirm: true, recursive: true, onlyStatus: "completed", auditReason: "Cleanup after milestone completion" }
				]
			}
		}
	];

	private readonly resources: MCPResource[] = [
		{
			uri: 'task://list',
			name: 'Task List',
			description: 'Comprehensive list of all tasks in the system with their properties, relationships, and metadata. This resource provides a current snapshot of the entire task database.',
			mimeType: 'application/json',
			schema: {
				type: 'object',
				properties: {
					tasks: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								title: { type: 'string' },
								description: { type: 'string' },
								type: { type: 'string' },
								level: { type: 'number' },
								status: { type: 'string' },
								priority: { type: 'string' },
								complexity: { type: 'string' },
								progress: { type: 'number' },
								parent: { type: 'string', nullable: true },
								children: { type: 'array', items: { type: 'string' } },
								tags: { type: 'array', items: { type: 'string' } },
								createdAt: { type: 'string', format: 'date-time' },
								updatedAt: { type: 'string', format: 'date-time' }
							}
						}
					},
					total: { type: 'number' },
					page: { type: 'number' },
					pageSize: { type: 'number' },
					totalPages: { type: 'number' }
				}
			}
		},
		{
			uri: 'task://statistics',
			name: 'Task Statistics',
			description: 'Aggregated statistics and metrics about tasks in the system, including counts by status, type, priority, and other dimensions. Useful for dashboards and reporting.',
			mimeType: 'application/json',
			schema: {
				type: 'object',
				properties: {
					totalTasks: { type: 'number' },
					byStatus: { type: 'object' },
					byPriority: { type: 'object' },
					byType: { type: 'object' },
					completionRate: { type: 'number' },
					averageCompletionTime: { type: 'number' },
					tasksByMonth: { type: 'object' },
					topTags: { type: 'array' }
				}
			}
		},
		{
			uri: 'config://settings',
			name: 'System Configuration',
			description: 'Current system configuration settings including server parameters, storage options, feature flags, and integration settings. Provides insight into how the system is configured.',
			mimeType: 'application/json',
			schema: {
				type: 'object',
				properties: {
					server: { type: 'object' },
					storage: { type: 'object' },
					features: { type: 'object' },
					limits: { type: 'object' },
					integration: { type: 'object' }
				}
			}
		},
		{
			uri: 'system://health',
			name: 'System Health',
			description: 'Real-time health status of the system including uptime, performance metrics, active connections, and any detected issues. Useful for monitoring and troubleshooting.',
			mimeType: 'application/json',
			schema: {
				type: 'object',
				properties: {
					status: { type: 'string', enum: ['healthy', 'degraded', 'critical'] },
					uptime: { type: 'number' },
					memoryUsage: { type: 'object' },
					cpuUsage: { type: 'object' },
					activeSessions: { type: 'number' },
					lastError: { type: 'string' },
					warningMessages: { type: 'array' }
				}
			}
		}
	];

	private readonly prompts: MCPPrompt[] = [
		{
			name: 'analyze_task',
			description: 'Analyze a task and provide comprehensive insights including progress assessment, potential issues, recommendations, and dependency analysis. This prompt helps in understanding task status and next steps.',
			arguments: [
				{ 
					name: 'task_id', 
					description: 'ID of the task to analyze', 
					required: true,
					example: 'task_123'
				},
				{ 
					name: 'focus', 
					description: 'Analysis focus area (e.g., "blockers", "dependencies", "resources", "timeline", "general")', 
					required: false,
					example: 'blockers'
				},
				{
					name: 'depth',
					description: 'Analysis depth (basic, standard, detailed)',
					required: false,
					example: 'detailed'
				}
			],
			template: `Please analyze the following task with a focus on {{focus}}:

Task ID: {{task.id}}
Title: {{task.title}}
Description: {{task.description}}
Type: {{task.type}}
Status: {{task.status}}
Priority: {{task.priority}}
Progress: {{task.progress}}%

Provide insights on:
1. Current progress assessment
2. Potential issues or blockers
3. Recommendations for next steps
4. Dependency analysis
5. Resource requirements
`
		},
		{
			name: 'task_breakdown',
			description: 'Break down a complex task into smaller, actionable subtasks. This prompt helps in decomposing large tasks into manageable pieces with clear relationships and dependencies.',
			arguments: [
				{ 
					name: 'task_id', 
					description: 'ID of the parent task to break down', 
					required: true,
					example: 'feat_456'
				},
				{
					name: 'min_subtasks',
					description: 'Minimum number of subtasks to generate',
					required: false,
					example: '3'
				},
				{
					name: 'max_subtasks',
					description: 'Maximum number of subtasks to generate',
					required: false,
					example: '7'
				},
				{
					name: 'breakdown_strategy',
					description: 'Strategy for breaking down the task (sequential, parallel, mixed)',
					required: false,
					example: 'mixed'
				}
			],
			template: `Please break down the following task into {{min_subtasks}}-{{max_subtasks}} smaller, actionable subtasks using a {{breakdown_strategy}} approach:

Task ID: {{task.id}}
Title: {{task.title}}
Description: {{task.description}}
Type: {{task.type}}

For each subtask, provide:
1. A clear, concise title
2. A brief but thorough description
3. Estimated complexity (low, medium, high)
4. Dependencies on other subtasks, if any
5. Suggested tags

The subtasks should collectively address all aspects of the parent task while being independently manageable.`
		},
		{
			name: 'generate_report',
			description: 'Generate a comprehensive report about the task management system, including task statistics, progress tracking, and insights. Useful for status updates, sprint reviews, and project tracking.',
			arguments: [
				{ 
					name: 'type', 
					description: 'Report type (e.g., "status", "progress", "summary", "detailed", "metrics")', 
					required: true,
					example: 'status'
				},
				{ 
					name: 'period', 
					description: 'Time period for the report (e.g., "daily", "weekly", "sprint", "monthly", "custom")', 
					required: false,
					example: 'weekly'
				},
				{
					name: 'format',
					description: 'Output format style (markdown, html, text, executive)',
					required: false,
					example: 'markdown'
				},
				{
					name: 'focus_areas',
					description: 'Specific areas to focus on in the report',
					required: false,
					example: 'blockers,progress,priorities'
				}
			],
			template: `Generate a comprehensive {{type}} report for the {{period}} period in {{format}} format focusing on {{focus_areas}}.

Include the following sections:
1. Executive Summary
2. Key Metrics and Statistics
   - Tasks created/completed
   - Progress by priority
   - Completion rate
3. Status Overview
   - By task type
   - By priority
4. Notable Achievements
5. Blockers and Issues
6. Upcoming Priorities
7. Resource Allocation
8. Recommendations

Data should be presented with appropriate formatting, and include both quantitative metrics and qualitative insights.`
		},
		{
			name: 'task_status_update',
			description: 'Create a structured update for a task status change, including impact analysis and next steps recommendations. This prompt helps in documenting task transitions with proper context.',
			arguments: [
				{ 
					name: 'task_id', 
					description: 'ID of the task being updated', 
					required: true,
					example: 'task_789'
				},
				{ 
					name: 'status', 
					description: 'New status for the task', 
					required: true,
					example: 'in-progress'
				},
				{
					name: 'reason',
					description: 'Reason for the status change',
					required: false,
					example: 'Development work started after prerequisites completed'
				},
				{
					name: 'include_impact_analysis',
					description: 'Whether to include impact analysis on related tasks',
					required: false,
					example: 'true'
				}
			],
			template: `I'm updating the status of task "{{task.title}}" ({{task_id}}) from "{{task.status}}" to "{{status}}" due to: {{reason}}.

Please provide:
1. A summary of what this status change means for the project
2. Actions that should be taken next
3. Potential impacts on related tasks or the overall project timeline
4. Any risks or considerations to be aware of
5. Recommendations for smooth progress

{{#if include_impact_analysis}}
Also include a detailed analysis of how this change impacts:
- Dependent tasks
- Project timeline
- Resource allocation
- Overall project risk
{{/if}}
`
		},
		{
			name: 'prioritization_analysis',
			description: 'Analyze and recommend prioritization for a set of tasks based on various factors including business value, dependencies, effort, and deadlines. This prompt helps in making data-driven prioritization decisions.',
			arguments: [
				{
					name: 'task_count',
					description: 'Number of top tasks to analyze and prioritize',
					required: false,
					example: '5'
				},
				{
					name: 'factors',
					description: 'Comma-separated list of factors to consider in prioritization',
					required: false,
					example: 'business_value,effort,dependencies,deadline'
				},
				{
					name: 'scope',
					description: 'Scope of tasks to consider (all, pending, in-progress)',
					required: false,
					example: 'pending'
				},
				{
					name: 'context',
					description: 'Additional context for prioritization decisions',
					required: false,
					example: 'Preparing for quarterly release with focus on user-facing features'
				}
			],
			template: `Please analyze and recommend prioritization for the top {{task_count}} {{scope}} tasks considering these factors: {{factors}}.

Context: {{context}}

For each task, evaluate:
1. Business value (impact on users, revenue, or strategic goals)
2. Required effort and available resources
3. Dependencies and blockers
4. Deadline proximity and urgency
5. Risk factors

Then provide:
1. A ranked list of tasks in recommended priority order
2. Justification for each ranking
3. Suggested modifications to priority levels if needed
4. Implementation recommendation (sequential vs parallel)
5. Resource allocation suggestions
`
		}
	];

	constructor(port?: number) {
		if (port) {
			this.port = port;
		}
		this.app = express();
		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware(): void {
		this.app.use(cors({
			origin: '*',
			methods: ['GET', 'POST', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true
		}));
		this.app.use(express.json());
		this.app.use(express.static('public'));
	}

	private setupRoutes(): void {
		// Health check endpoint
		this.app.get('/health', (req, res) => {
			res.json({
				status: 'ok',
				uptime: process.uptime(),
				sessionCount: this.sessions.size,
				protocolVersion: this.protocolVersion,
				mcpCompliant: true
			});
		});

		// Main SSE endpoint - MCP Inspector connects here first
		this.app.get('/sse', (req, res) => {
			this.handleSSEConnection(req, res);
		});

		// JSON-RPC message endpoint - receives MCP protocol messages
		this.app.post('/sse/messages', (req, res) => {
			this.handleJSONRPCMessage(req, res);
		});

		// Alternative message endpoint (some implementations use /message)
		this.app.post('/message', (req, res) => {
			this.handleJSONRPCMessage(req, res);
		});

		// Debug endpoint for testing
		this.app.post('/debug/trigger', (req, res) => {
			const event = req.body;
			this.broadcastToAllSessions(event);
			res.json({ success: true, sessionCount: this.sessions.size });
		});
	}

	private handleSSEConnection(req: express.Request, res: express.Response): void {
		// Generate unique session ID
		const sessionId = this.generateSessionId();

		log.info('MCP-SSE', `New SSE connection, session: ${sessionId}`);

		// Set SSE headers
		res.set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		});
		res.flushHeaders();

		// Send initial padding comment and retry directive
		// This is important for EventSource compatibility, especially with MCP Inspector
		res.write(":" + Array(2049).join(" ") + "\n"); // 2kB padding for IE
		res.write("retry: 10000\n\n");  // Set retry interval - CRUCIAL

		// Create session data
		const sessionData: SessionData = {
			id: sessionId,
			response: res,
			initialized: false,
			capabilities: {},
			createdAt: new Date()
		};

		// Store session
		this.sessions.set(sessionId, sessionData);

		// Send endpoint event immediately - THIS IS CRUCIAL FOR MCP INSPECTOR
		const endpointUrl = `/sse/messages?sessionId=${sessionId}`;
		this.sendEventToSession(sessionId, {
			event: 'endpoint',
			data: endpointUrl
		});

		log.info('MCP-SSE', `Sent endpoint event: ${endpointUrl}`, { sessionId });
		
		// Set up a ping interval to keep the connection alive
		const pingInterval = setInterval(() => {
			try {
				if (this.sessions.has(sessionId) && !res.writableEnded) {
					this.sendEventToSession(sessionId, {
						event: 'message',
						data: JSON.stringify({
							jsonrpc: '2.0',
							method: 'notifications/ping',
							params: { timestamp: new Date().toISOString() }
						})
					});
					log.debug('MCP-SSE', `Sent ping to session ${sessionId}`);
				} else {
					clearInterval(pingInterval);
				}
			} catch (error) {
				log.error('MCP-SSE', `Error sending ping to session ${sessionId}`, {
					error: error instanceof Error ? error.message : 'Unknown error'
				});
				clearInterval(pingInterval);
			}
		}, 30000); // Send ping every 30 seconds

		// Handle client disconnect
		req.on('close', () => {
			this.sessions.delete(sessionId);
			clearInterval(pingInterval);
			log.info('MCP-SSE', `Session disconnected: ${sessionId}`, {
				sessionCount: this.sessions.size
			});
		});

		req.on('error', (error: Error) => {
			log.error('MCP-SSE', `Session error: ${sessionId}`, { error: error.message });
			this.sessions.delete(sessionId);
			clearInterval(pingInterval);
		});
	}

	private handleJSONRPCMessage(req: express.Request, res: express.Response): void {
		const sessionId = req.query['sessionId'] as string;

		if (!sessionId) {
			res.status(400).json({ 
				jsonrpc: '2.0',
				error: {
					code: -32602,
					message: 'Missing sessionId parameter'
				}
			});
			return;
		}

		const session = this.sessions.get(sessionId);
		if (!session) {
			res.status(404).json({ 
				jsonrpc: '2.0',
				error: {
					code: -32601,
					message: 'Session not found'
				}
			});
			return;
		}

		const jsonRpcRequest: JsonRpcRequest = req.body;

		log.debug('MCP-SSE', `Received JSON-RPC: ${jsonRpcRequest.method}`, {
			sessionId,
			id: jsonRpcRequest.id,
			params: jsonRpcRequest.params
		});

		// Process the JSON-RPC request
		this.processJSONRPCRequest(sessionId, jsonRpcRequest)
			.then((response: JsonRpcResponse) => {
				// Send response back via SSE
				this.sendEventToSession(sessionId, {
					event: 'message',
					data: JSON.stringify(response)
				});

				// Acknowledge HTTP request
				res.json({ success: true });
			})
			.catch((error: Error) => {
				log.error('MCP-SSE', `Error processing JSON-RPC`, {
					sessionId,
					error: error.message
				});

				const errorResponse: JsonRpcResponse = {
					jsonrpc: '2.0',
					id: jsonRpcRequest.id,
					error: {
						code: -32603,
						message: 'Internal error',
						data: error.message
					}
				};

				this.sendEventToSession(sessionId, {
					event: 'message',
					data: JSON.stringify(errorResponse)
				});

				res.status(500).json({ success: false, error: 'Internal error' });
			});
	}

	private async processJSONRPCRequest(sessionId: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
		const session = this.sessions.get(sessionId);
		if (!session) {
			throw new Error('Session not found');
		}

		const baseResponse: JsonRpcResponse = {
			jsonrpc: '2.0',
			id: request.id
		};

		try {
			switch (request.method) {
				case 'initialize':
					return this.handleInitialize(session, request);

				case 'ping':
					return {
						...baseResponse,
						result: {}
					};
				
				case 'notifications/initialized':
					// This is a notification, no response needed with id
					log.info('MCP-SSE', `Session fully initialized: ${sessionId}`);
					// For notifications, either return empty object or null
					return {
						jsonrpc: '2.0'
					};

				case 'tools/list':
					return {
						...baseResponse,
						result: {
							tools: this.tools
						}
					};

				case 'tools/call':
					return await this.handleToolCall(request);

				case 'resources/list':
					return {
						...baseResponse,
						result: {
							resources: this.resources
						}
					};

				case 'resources/read':
					return await this.handleResourceRead(request);

				case 'prompts/list':
					return {
						...baseResponse,
						result: {
							prompts: this.prompts
						}
					};

				case 'prompts/get':
					return await this.handlePromptGet(request);

				default:
					log.warn('MCP-SSE', `Method not found: ${request.method}`, { sessionId });
					return {
						...baseResponse,
						error: {
							code: -32601,
							message: `Method not found: ${request.method}`
						}
					};
			}
		} catch (error) {
			log.error('MCP-SSE', `Error processing JSON-RPC request: ${request.method}`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined
			});
			
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			};
		}
	}

	private handleInitialize(session: SessionData, request: JsonRpcRequest): JsonRpcResponse {
		const params = request.params as { protocolVersion?: string; capabilities?: Record<string, unknown> } || {};

		// Store client capabilities
		session.capabilities = params.capabilities || {};
		session.initialized = true;

		log.info('MCP-SSE', `Session initialized: ${session.id}`, {
			protocolVersion: params.protocolVersion,
			capabilities: session.capabilities
		});

		// In MCP Inspector connections, we should be flexible with protocol versions
		// and focus on capabilities rather than rejecting based on version
		return {
			jsonrpc: '2.0',
			id: request.id,
			result: {
				protocolVersion: this.protocolVersion,
				capabilities: {
					tools: { listChanged: true },
					resources: { subscribe: true, listChanged: true },
					prompts: { listChanged: true }
				},
				serverInfo: {
					name: 'MCP SSE Server',
					version: '1.0.0'
				}
			}
		};
	}

	private async handleToolCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
		const params = request.params as { name?: string; arguments?: Record<string, unknown> } || {};
		const toolName = params.name;
		const toolArgs = params.arguments || {};

		log.info('MCP-SSE', `Tool call: ${toolName}`, { arguments: toolArgs });

		const baseResponse: JsonRpcResponse = {
			jsonrpc: '2.0',
			id: request.id
		};

		// Ensure task storage is initialized
		if (!this.taskStorageInitialized) {
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: 'Task storage service is not initialized'
				}
			};
		}

		// Get the storage service from the factory
		const taskStorage = taskStorageFactory.getStorageService();

		try {
			switch (toolName) {
				case 'create_task':
					// Extract task fields from arguments
					const title = toolArgs['title'] as string;
					const description = toolArgs['description'] as string || '';
					const type = toolArgs['type'] as string || 'task';
					const level = Number(toolArgs['level'] || 2);
					const status = toolArgs['status'] as string || 'pending';
					const priority = toolArgs['priority'] as string || 'medium';
					const complexity = toolArgs['complexity'] as string || 'medium';
					const parent = toolArgs['parent'] as string || null;
					const tags = toolArgs['tags'] as string[] || [];

					// Create the task
					const newTask = await taskStorage.createTask({
						title,
						description,
						type,
						level,
						status,
						priority,
						complexity,
						parent,
						tags,
						progress: 0,
						aiGenerated: true,
						aiConfidence: 0.85,
						children: [],
						dependencies: [],
						blockedBy: [],
						enables: []
					});

					// Add console log for task creation
					console.log('\n📝 TASK CREATED:');
					console.log(`🔹 ID: ${newTask.id}`);
					console.log(`🔹 Title: ${newTask.title}`);
					console.log(`🔹 Type: ${newTask.type}`);
					console.log(`🔹 Priority: ${newTask.priority}`);
					console.log(`🔹 Status: ${newTask.status}\n`);

					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: `Task created successfully:\n- Title: ${newTask.title}\n- Description: ${newTask.description}\n- Type: ${newTask.type}\n- Level: ${newTask.level}\n- Status: ${newTask.status}\n- Priority: ${newTask.priority}\n- ID: ${newTask.id}`
								}
							]
						}
					};

				case 'get_tasks':
					// Extract query options
					const queryOptions: Record<string, any> = {};
					
					if (toolArgs['status']) queryOptions['status'] = toolArgs['status'];
					if (toolArgs['type']) queryOptions['type'] = toolArgs['type'];
					if (toolArgs['priority']) queryOptions['priority'] = toolArgs['priority'];
					if (toolArgs['level']) queryOptions['level'] = Number(toolArgs['level']);
					if (toolArgs['parent']) queryOptions['parent'] = toolArgs['parent'];
					if (toolArgs['limit']) queryOptions['limit'] = Number(toolArgs['limit']);
					if (toolArgs['offset']) queryOptions['offset'] = Number(toolArgs['offset']);

					// Get tasks
					const tasksResult = await taskStorage.getTasks(queryOptions);
					
					// Add console log for tasks retrieval
					console.log('\n📋 TASKS RETRIEVED:');
					console.log(`🔹 Count: ${tasksResult.tasks.length} (Total: ${tasksResult.total})`);
					tasksResult.tasks.forEach(task => {
						console.log(`   - ${task.id}: ${task.title} [${task.status}] [${task.priority}]`);
					});
					console.log();
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: `Found ${tasksResult.tasks.length} tasks (total: ${tasksResult.total}):\n\n${JSON.stringify(tasksResult, null, 2)}`
								}
							]
						}
					};

				case 'get_task_by_id':
					const id = toolArgs['id'] as string;
					if (!id) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Task ID is required'
							}
						};
					}

					const task = await taskStorage.getTaskById(id);
					if (!task) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task with ID ${id} not found`
							}
						};
					}

					// Add console log for task retrieval
					console.log('\n🔍 TASK RETRIEVED:');
					console.log(`🔹 ID: ${task.id}`);
					console.log(`🔹 Title: ${task.title}`);
					console.log(`🔹 Status: ${task.status}`);
					console.log(`🔹 Priority: ${task.priority}`);
					console.log(`🔹 Progress: ${task.progress}%\n`);

					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: `Task details for ${id}:\n\n${JSON.stringify(task, null, 2)}`
								}
							]
						}
					};

				case 'update_task':
					const taskId = toolArgs['id'] as string;
					if (!taskId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Task ID is required'
							}
						};
					}

					// Check if task exists
					const existingTask = await taskStorage.getTaskById(taskId);
					if (!existingTask) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task with ID ${taskId} not found`
							}
						};
					}

					// Extract updates
					const updates: Record<string, any> = {};
					
					if (toolArgs['title']) updates['title'] = toolArgs['title'];
					if (toolArgs['description']) updates['description'] = toolArgs['description'];
					if (toolArgs['status']) updates['status'] = toolArgs['status'];
					if (toolArgs['priority']) updates['priority'] = toolArgs['priority'];
					if (toolArgs['complexity']) updates['complexity'] = toolArgs['complexity'];
					if (toolArgs['progress'] !== undefined) updates['progress'] = Number(toolArgs['progress']);
					if (toolArgs['tags']) updates['tags'] = toolArgs['tags'];
					
					// Handle completion
					if (updates['status'] === 'completed' && existingTask.status !== 'completed') {
						updates['completedAt'] = new Date().toISOString();
					}

					// Update the task
					const updatedTask = await taskStorage.updateTask(taskId, updates);

					// Add console log for task update
					console.log('\n🔄 TASK UPDATED:');
					console.log(`🔹 ID: ${taskId}`);
					console.log('🔹 Updates:');
					Object.entries(updates).forEach(([key, value]) => {
						console.log(`   - ${key}: ${value}`);
					});
					console.log(`🔹 Updated at: ${updatedTask.updatedAt}\n`);

					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: `Task ${taskId} updated successfully:\n\n${JSON.stringify(updates, null, 2)}\n\nUpdated at: ${updatedTask.updatedAt}`
								}
							]
						}
					};

				case 'delete_task':
					const deleteId = toolArgs['id'] as string;
					if (!deleteId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Task ID is required'
							}
						};
					}

					// Delete the task
					const deleted = await taskStorage.deleteTask(deleteId);
					
					if (!deleted) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task with ID ${deleteId} not found or could not be deleted`
							}
						};
					}

					// Add console log for task deletion
					console.log('\n🗑️ TASK DELETED:');
					console.log(`🔹 ID: ${deleteId}\n`);

					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: `Task ${deleteId} deleted successfully`
								}
							]
						}
					};

				case 'get_task_tree':
					const rootId = toolArgs['rootId'] as string;
					if (!rootId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Root task ID is required'
							}
						};
					}

					const depth = toolArgs['depth'] ? Number(toolArgs['depth']) : -1;
					
					// Get the task tree
					try {
						const taskTree = await taskStorage.getTaskTree(rootId, depth);
						
						// Add console log for task tree retrieval
						console.log('\n🌳 TASK TREE RETRIEVED:');
						console.log(`🔹 Root ID: ${rootId}`);
						console.log(`🔹 Depth: ${depth === -1 ? 'unlimited' : depth}`);
						console.log(`🔹 Nodes: ${countNodes(taskTree)}\n`);
						
						return {
							...baseResponse,
							result: {
								content: [
									{
										type: 'text',
										text: `Task tree for ${rootId}:\n\n${JSON.stringify(taskTree, null, 2)}`
									}
								]
							}
						};
					} catch (error) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Error retrieving task tree: ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						};
					}

				case 'get_system_status':
					const storageType = taskStorageFactory.getStorageType();
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: JSON.stringify({
										status: 'healthy',
										storageType,
										uptime: process.uptime(),
										sessions: this.sessions.size,
										memory: process.memoryUsage(),
										taskStorageInitialized: this.taskStorageInitialized,
										timestamp: new Date().toISOString()
									}, null, 2)
								}
							]
						}
					};

				case 'get_most_priority_task':
					const statusFilter = toolArgs['status'] as string || '';
					const typeFilter = toolArgs['type'] as string || '';
					
					const priorityTask = await taskStorage.getMostPriorityTask(statusFilter, typeFilter);
					
					if (!priorityTask) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'No priority task found'
							}
						};
					}
					
					// Add console log for priority task retrieval
					console.log('\n⭐ HIGHEST PRIORITY TASK:');
					console.log(`🔹 ID: ${priorityTask.id}`);
					console.log(`🔹 Title: ${priorityTask.title}`);
					console.log(`🔹 Priority: ${priorityTask.priority}`);
					console.log(`🔹 Status: ${priorityTask.status}\n`);
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: JSON.stringify(priorityTask, null, 2)
								}
							]
						}
					};

				case 'get_subtasks':
					const parentId = toolArgs['parentId'] as string;
					
					if (!parentId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Parent task ID is required'
							}
						};
					}
					
					const subtasks = await taskStorage.getSubtasks(parentId);
					
					// Add console log for subtasks retrieval
					console.log('\n📑 SUBTASKS RETRIEVED:');
					console.log(`🔹 Parent ID: ${parentId}`);
					console.log(`🔹 Count: ${subtasks.length}`);
					subtasks.forEach(task => {
						console.log(`   - ${task.id}: ${task.title} [${task.status}]`);
					});
					console.log();
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: JSON.stringify(subtasks, null, 2)
								}
							]
						}
					};

				case 'delete_all_tasks':
					const confirm = toolArgs['confirm'] as boolean;
					
					if (confirm !== true) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Confirmation flag must be true'
							}
						};
					}
					
					const allTasksDeleted = await taskStorage.deleteAllTasks();
					
					// Add console log for all tasks deletion
					console.log('\n🗑️ ALL TASKS DELETED:');
					console.log(`🔹 Success: ${allTasksDeleted ? 'Yes' : 'No'}\n`);
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: allTasksDeleted ? 'All tasks deleted successfully' : 'Failed to delete all tasks'
								}
							]
						}
					};

				case 'delete_all_subtasks':
					const parentIdForDelete = toolArgs['parentId'] as string;
					const confirmForDelete = toolArgs['confirm'] as boolean;
					
					if (!parentIdForDelete || confirmForDelete !== true) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Parent task ID and confirmation flag are required'
							}
						};
					}
					
					const allSubtasksDeleted = await taskStorage.deleteAllSubtasks(parentIdForDelete);
					
					return {
						...baseResponse,
						result: {
							content: [
								{
									type: 'text',
									text: allSubtasksDeleted ? 'All subtasks deleted successfully' : 'Failed to delete all subtasks'
								}
							]
						}
					};

				default:
					return {
						...baseResponse,
						error: {
							code: -32601,
							message: `Tool not found: ${toolName}`
						}
					};
			}
		} catch (error) {
			log.error('MCP-SSE', `Error processing tool call: ${toolName}`, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: `Internal error processing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			};
		}
	}

	private async handleResourceRead(request: JsonRpcRequest): Promise<JsonRpcResponse> {
		const params = request.params as { uri?: string } || {};
		const uri = params.uri;

		const baseResponse: JsonRpcResponse = {
			jsonrpc: '2.0',
			id: request.id
		};

		try {
			switch (uri) {
				case 'task://list':
					// Check if task storage is initialized
					if (!this.taskStorageInitialized) {
						return {
							...baseResponse,
							error: {
								code: -32603,
								message: 'Task storage service is not initialized'
							}
						};
					}

					// Get tasks from storage
					try {
						const taskStorage = taskStorageFactory.getStorageService();
						const result = await taskStorage.getTasks({ limit: 50 });
						
						return {
							...baseResponse,
							result: {
								contents: [
									{
										uri: uri,
										mimeType: 'application/json',
										text: JSON.stringify(result, null, 2)
									}
								]
							}
						};
					} catch (error) {
						return {
							...baseResponse,
							error: {
								code: -32603,
								message: `Error retrieving tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						};
					}

				case 'config://settings':
					const storageType = this.taskStorageInitialized 
						? taskStorageFactory.getStorageType() 
						: 'not initialized';
					
					const config = {
						server: {
							port: this.port,
							protocol: this.protocolVersion,
							features: ['tools', 'resources', 'prompts']
						},
						storage: {
							type: storageType,
							initialized: this.taskStorageInitialized
						},
						limits: {
							maxSessions: 100,
							timeoutMs: 30000
						}
					};

					return {
						...baseResponse,
						result: {
							contents: [
								{
									uri: uri,
									mimeType: 'application/json',
									text: JSON.stringify(config, null, 2)
								}
							]
						}
					};

				default:
					return {
						...baseResponse,
						error: {
							code: -32602,
							message: `Resource not found: ${uri}`
						}
					};
			}
		} catch (error) {
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: `Internal error handling resource: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			};
		}
	}

	private async handlePromptGet(request: JsonRpcRequest): Promise<JsonRpcResponse> {
		const params = request.params as { name?: string; arguments?: Record<string, unknown> } || {};
		const promptName = params.name;
		const promptArgs = params.arguments || {};

		const baseResponse: JsonRpcResponse = {
			jsonrpc: '2.0',
			id: request.id
		};

		// Check if task storage is initialized
		if (!this.taskStorageInitialized && ['analyze_task', 'task_breakdown', 'task_status_update'].includes(promptName || '')) {
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: 'Task storage service is not initialized'
				}
			};
		}

		try {
			switch (promptName) {
				case 'analyze_task': {
					const taskId = promptArgs['task_id'] as string;
					const focus = promptArgs['focus'] as string || 'general';
					
					if (!taskId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Missing required argument: task_id'
							}
						};
					}
					
					// Get task data
					const taskStorage = taskStorageFactory.getStorageService();
					const task = await taskStorage.getTaskById(taskId);
					
					if (!task) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task not found with ID: ${taskId}`
							}
						};
					}
					
					return {
						...baseResponse,
						result: {
							description: `Analyze task ${task.title} with focus on ${focus}`,
							messages: [
								{
									role: 'user',
									content: {
										type: 'text',
										text: `Please analyze the following task with a focus on ${focus}:\n\n` +
											`Task ID: ${task.id}\n` +
											`Title: ${task.title}\n` +
											`Description: ${task.description}\n` +
											`Type: ${task.type}\n` +
											`Status: ${task.status}\n` +
											`Priority: ${task.priority}\n` +
											`Progress: ${task.progress}%\n\n` +
											`Provide insights on progress, potential issues, and recommendations.`
									}
								}
							]
						}
					};
				}

				case 'task_breakdown': {
					const taskId = promptArgs['task_id'] as string;
					
					if (!taskId) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Missing required argument: task_id'
							}
						};
					}
					
					// Get task data
					const taskStorage = taskStorageFactory.getStorageService();
					const task = await taskStorage.getTaskById(taskId);
					
					if (!task) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task not found with ID: ${taskId}`
							}
						};
					}
					
					return {
						...baseResponse,
						result: {
							description: `Break down task ${task.title} into smaller subtasks`,
							messages: [
								{
									role: 'user',
									content: {
										type: 'text',
										text: `Please break down the following task into smaller, actionable subtasks:\n\n` +
											`Task ID: ${task.id}\n` +
											`Title: ${task.title}\n` +
											`Description: ${task.description}\n` +
											`Type: ${task.type}\n\n` +
											`For each subtask, provide:\n` +
											`1. A clear title\n` +
											`2. A brief description\n` +
											`3. Estimated complexity (low, medium, high)\n` +
											`4. Dependencies on other subtasks, if any`
									}
								}
							]
						}
					};
				}

				case 'generate_report':
					const reportType = promptArgs['type'] as string;
					const period = promptArgs['period'] as string || 'weekly';

					return {
						...baseResponse,
						result: {
							description: `Generate ${reportType} report for ${period} period`,
							messages: [
								{
									role: 'user',
									content: {
										type: 'text',
										text: `Generate a comprehensive ${reportType} report for the ${period} period. Include key metrics, trends, and actionable insights.`
									}
								}
							]
						}
					};

				case 'task_status_update': {
					const taskId = promptArgs['task_id'] as string;
					const status = promptArgs['status'] as string;
					
					if (!taskId || !status) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: 'Missing required arguments: task_id or status'
							}
						};
					}
					
					// Get task data
					const taskStorage = taskStorageFactory.getStorageService();
					const task = await taskStorage.getTaskById(taskId);
					
					if (!task) {
						return {
							...baseResponse,
							error: {
								code: -32602,
								message: `Task not found with ID: ${taskId}`
							}
						};
					}
					
					return {
						...baseResponse,
						result: {
							description: `Update status of task ${task.title} to ${status}`,
							messages: [
								{
									role: 'user',
									content: {
										type: 'text',
										text: `I'm updating the status of task "${task.title}" from "${task.status}" to "${status}".\n\n` +
											`Please provide:\n` +
											`1. A summary of what this status change means\n` +
											`2. Any actions that should be taken next\n` +
											`3. Potential impacts on related tasks or the overall project`
									}
								}
							]
						}
					};
				}

				default:
					return {
						...baseResponse,
						error: {
							code: -32601,
							message: `Prompt not found: ${promptName}`
						}
					};
			}
		} catch (error) {
			return {
				...baseResponse,
				error: {
					code: -32603,
					message: `Error processing prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			};
		}
	}

	private generateSessionId(): string {
		return randomBytes(16).toString('hex');
	}

	private sendEventToSession(sessionId: string, event: { event: string; data: string }): void {
		const session = this.sessions.get(sessionId);
		if (!session) {
			log.warn('MCP-SSE', `Cannot send event to unknown session: ${sessionId}`);
			return;
		}

		try {
			// Format SSE event with proper format - this is CRUCIAL for compatibility
			// The exact format is "event: {eventName}\ndata: {jsonData}\n\n"
			const formatted = `event: ${event.event}\ndata: ${event.data}\n\n`;
			session.response.write(formatted);
			log.debug('MCP-SSE', `Sent event to session ${sessionId}`, { event: event.event });
		} catch (error: unknown) {
			log.error('MCP-SSE', `Error sending event to session ${sessionId}`, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			this.sessions.delete(sessionId);
		}
	}

	private broadcastToAllSessions(event: Record<string, unknown>): void {
		if (this.sessions.size === 0) return;

		const sseEvent = {
			event: 'message',
			data: JSON.stringify({
				...event,
				timestamp: new Date().toISOString(),
				broadcastId: `broadcast-${Date.now()}`
			})
		};

		const deadSessions: string[] = [];

		this.sessions.forEach((session, sessionId) => {
			try {
				this.sendEventToSession(sessionId, sseEvent);
			} catch (error: unknown) {
				deadSessions.push(sessionId);
			}
		});

		// Clean up dead sessions
		deadSessions.forEach(sessionId => this.sessions.delete(sessionId));
	}

	private async isPortAvailable(port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const tester = net.createServer()
				.once('error', () => resolve(false))
				.once('listening', () => {
					tester.close(() => resolve(true));
				})
				.listen(port);
		});
	}

	private getLocalIPs(): string[] {
		const interfaces = networkInterfaces();
		const addresses: string[] = [];

		for (const name of Object.keys(interfaces)) {
			const ifaces = interfaces[name];
			if (ifaces) {
				for (const iface of ifaces) {
					if (iface.family === 'IPv4' && !iface.internal) {
						addresses.push(iface.address);
					}
				}
			}
		}

		return addresses;
	}

	public async start(): Promise<void> {
		if (this.isShuttingDown) {
			throw new Error('Cannot start server during shutdown');
		}

		const available = await this.isPortAvailable(this.port);
		if (!available) {
			const error = new Error(`Port ${this.port} is already in use!`);
			log.error('MCP-SSE', error.message, {
				port: this.port,
				suggestion: `Try: lsof -i :${this.port} | grep LISTEN; kill -9 <PID>`
			});
			throw error;
		}

		// Initialize the task storage service
		try {
			// Determine storage type from environment
			const storageType = process.env['STORAGE_TYPE'] === 'supabase' 
				? StorageType.SUPABASE 
				: StorageType.SQLITE;
			
			log.info('MCP-SSE', `Initializing task storage with ${storageType} backend`);
			
			// Only pass defined values to avoid TypeScript errors with exactOptionalPropertyTypes
			const initOptions: {
				storageType: StorageType;
				supabaseUrl?: string;
				supabaseKey?: string;
				sqliteDbPath?: string;
			} = {
				storageType
			};
			
			// Add optional parameters only if they're defined
			if (process.env['SUPABASE_URL']) {
				initOptions.supabaseUrl = process.env['SUPABASE_URL'];
			}
			
			if (process.env['SUPABASE_ANON_KEY']) {
				initOptions.supabaseKey = process.env['SUPABASE_ANON_KEY'];
			}
			
			// Ensure SQLite DB path is valid and exists
			const defaultDbPath = path.resolve(process.cwd(), '_store', 'tasks.db');
			initOptions.sqliteDbPath = process.env['SQLITE_DB_PATH'] || defaultDbPath;
			
			// Ensure the directory exists
			const dbDir = path.dirname(initOptions.sqliteDbPath);
			if (!fs.existsSync(dbDir)) {
				fs.mkdirSync(dbDir, { recursive: true });
			}
			
			log.info('MCP-SSE', `Using SQLite DB path: ${initOptions.sqliteDbPath}`);
			
			await taskStorageFactory.initialize(initOptions);
			
			this.taskStorageInitialized = true;
			log.info('MCP-SSE', 'Task storage initialized successfully');
		} catch (error) {
			log.error('MCP-SSE', 'Failed to initialize task storage', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			// Continue server startup even if storage fails
		}

		return new Promise((resolve) => {
			this.server = http.createServer(this.app);

			this.server.on('error', (err: Error) => {
				log.error('MCP-SSE', `Server error`, { error: err.message });
				this.stop().catch(stopErr => {
					log.error('MCP-SSE', 'Error during stop after server error', { error: stopErr });
				});
			});

			this.server.listen(this.port, () => {
				const localIPs = this.getLocalIPs();

				log.info('MCP-SSE', `🚀 MCP Inspector v0.13.0 Compatible SSE Server running on port ${this.port}`);
				log.info('MCP-SSE', `🔗 SSE Endpoint: http://localhost:${this.port}/sse`);
				log.info('MCP-SSE', `📨 Message Endpoint: http://localhost:${this.port}/sse/messages`);
				log.info('MCP-SSE', `🏥 Health Check: http://localhost:${this.port}/health`);

				if (localIPs.length > 0) {
					log.info('MCP-SSE', `🌐 Network access: ${localIPs.map(ip => `http://${ip}:${this.port}/sse`).join(', ')}`);
				}

				log.info('MCP-SSE', `📋 To connect with MCP Inspector:`);
				log.info('MCP-SSE', `   npx @modelcontextprotocol/inspector`);
				log.info('MCP-SSE', `   Then connect to: http://localhost:${this.port}/sse`);

				// Set up periodic cleanup of stale sessions
				const cleanupInterval = setInterval(() => {
					const now = new Date();
					const staleTimeout = 5 * 60 * 1000; // 5 minutes

					for (const [sessionId, session] of this.sessions.entries()) {
						if (now.getTime() - session.createdAt.getTime() > staleTimeout && !session.initialized) {
							log.warn('MCP-SSE', `Cleaning up stale session: ${sessionId}`);
							this.sessions.delete(sessionId);
						}
					}
				}, 60000); // Check every minute

				this.intervalHandlers.push(cleanupInterval);

				// Register cleanup handlers
				process.on('SIGINT', this.handleProcessTermination.bind(this));
				process.on('SIGTERM', this.handleProcessTermination.bind(this));
				process.on('SIGQUIT', this.handleProcessTermination.bind(this));

				resolve();
			});
		});
	}

	private handleProcessTermination(): void {
		log.info('MCP-SSE', 'Process termination signal received');
		this.stop().catch(err => {
			log.error('MCP-SSE', 'Error during stop after termination signal', { error: err });
			process.exit(1);
		});
	}

	public async stop(): Promise<void> {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;
		log.info('MCP-SSE', '🛑 Shutting down MCP SSE Server...');

		// Clear all intervals
		this.intervalHandlers.forEach(clearInterval);
		this.intervalHandlers = [];

		// Remove signal handlers
		process.removeListener('SIGINT', this.handleProcessTermination);
		process.removeListener('SIGTERM', this.handleProcessTermination);
		process.removeListener('SIGQUIT', this.handleProcessTermination);

		return new Promise((resolve, reject) => {
			// Notify all sessions we're shutting down
			for (const [sessionId, session] of this.sessions.entries()) {
				try {
					this.sendEventToSession(sessionId, {
						event: 'message',
						data: JSON.stringify({
							jsonrpc: '2.0',
							method: 'notifications/cancelled',
							params: { reason: 'Server shutting down' }
						})
					});
					session.response.end();
				} catch (error: unknown) {
					// Ignore errors during shutdown
				}
			}

			this.sessions.clear();

			if (this.server) {
				const forceShutdownTimeout = setTimeout(() => {
					log.warn('MCP-SSE', 'Force closing server after timeout');
					resolve();
				}, 3000);

				this.server.close((err?: Error) => {
					clearTimeout(forceShutdownTimeout);

					if (err) {
						log.error('MCP-SSE', 'Error closing server', { error: err.message });
						reject(err);
						return;
					}

					log.info('MCP-SSE', '✅ Server stopped gracefully');
					this.isShuttingDown = false;
					resolve();
				});
			} else {
				this.isShuttingDown = false;
				resolve();
			}
		});
	}
}

export default MCPSSEServer;

// Example usage and startup
if (require.main === module) {
	const server = new MCPSSEServer(3233);

	server.start()
		.then(() => {
			log.info('MCP-SSE', 'Server started successfully');
		})
		.catch((error: Error) => {
			log.error('MCP-SSE', 'Failed to start server', { error: error.message });
			process.exit(1);
		});
}

// Helper function to count nodes in a task tree (add this near the top of the file, after other imports)
function countNodes(taskTree: any): number {
	if (!taskTree) return 0;
	let count = 1; // Count the current node
	if (Array.isArray(taskTree.children)) {
		for (const child of taskTree.children) {
			count += countNodes(child);
		}
	}
	return count;
}