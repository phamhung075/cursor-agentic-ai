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
		}>;
		required?: string[];
	};
}

interface MCPResource {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
}

interface MCPPrompt {
	name: string;
	description: string;
	arguments?: {
		name: string;
		description: string;
		required?: boolean;
	}[];
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
			description: 'Create a new task in the system',
			inputSchema: {
				type: 'object',
				properties: {
					title: { type: 'string', description: 'Task title' },
					description: { type: 'string', description: 'Task description' },
					type: { type: 'string', description: 'Task type (epic, feature, task, etc.)' },
					level: { type: 'number', description: 'Task hierarchy level (1, 2, 3, etc.)' },
					status: { type: 'string', description: 'Task status (pending, in-progress, completed, etc.)' },
					priority: { type: 'string', description: 'Task priority (low, medium, high)' },
					complexity: { type: 'string', description: 'Task complexity (low, medium, high)' },
					parent: { type: 'string', description: 'Parent task ID (if any)' },
					tags: { type: 'array', description: 'List of tags' }
				},
				required: ['title', 'type', 'level']
			}
		},
		{
			name: 'get_tasks',
			description: 'Get tasks with optional filtering',
			inputSchema: {
				type: 'object',
				properties: {
					status: { type: 'string', description: 'Filter by status' },
					type: { type: 'string', description: 'Filter by type' },
					priority: { type: 'string', description: 'Filter by priority' },
					level: { type: 'number', description: 'Filter by hierarchy level' },
					parent: { type: 'string', description: 'Filter by parent ID' },
					limit: { type: 'number', description: 'Number of tasks to return' },
					offset: { type: 'number', description: 'Offset for pagination' }
				}
			}
		},
		{
			name: 'update_task',
			description: 'Update an existing task',
			inputSchema: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Task ID' },
					title: { type: 'string', description: 'Task title' },
					description: { type: 'string', description: 'Task description' },
					status: { type: 'string', description: 'Task status' },
					priority: { type: 'string', description: 'Task priority' },
					complexity: { type: 'string', description: 'Task complexity' },
					progress: { type: 'number', description: 'Task progress (0-100)' },
					tags: { type: 'array', description: 'List of tags' }
				},
				required: ['id']
			}
		},
		{
			name: 'delete_task',
			description: 'Delete a task',
			inputSchema: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Task ID' },
				},
				required: ['id']
			}
		},
		{
			name: 'get_task_tree',
			description: 'Get a hierarchical tree of tasks starting from a root task',
			inputSchema: {
				type: 'object',
				properties: {
					rootId: { type: 'string', description: 'Root task ID' },
					depth: { type: 'number', description: 'Tree depth to retrieve' }
				},
				required: ['rootId']
			}
		},
		{
			name: 'get_system_status',
			description: 'Get current system status and health information',
			inputSchema: {
				type: 'object',
				properties: {}
			}
		}
	];

	private readonly resources: MCPResource[] = [
		{
			uri: 'task://list',
			name: 'Task List',
			description: 'Current list of all tasks in the system',
			mimeType: 'application/json'
		},
		{
			uri: 'config://settings',
			name: 'System Configuration',
			description: 'Current system configuration and settings',
			mimeType: 'application/json'
		}
	];

	private readonly prompts: MCPPrompt[] = [
		{
			name: 'analyze_task',
			description: 'Analyze a task and provide insights',
			arguments: [
				{ name: 'task_id', description: 'ID of the task to analyze', required: true },
				{ name: 'focus', description: 'Analysis focus area', required: false }
			]
		},
		{
			name: 'generate_report',
			description: 'Generate a comprehensive report',
			arguments: [
				{ name: 'type', description: 'Report type', required: true },
				{ name: 'period', description: 'Time period for the report', required: false }
			]
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
			
			if (process.env['SQLITE_DB_PATH']) {
				initOptions.sqliteDbPath = process.env['SQLITE_DB_PATH'];
			}
			
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