/**
 * MCP Inspector v0.13.0 Compatible SSE Server
 * 
 * Implements Model Context Protocol over Server-Sent Events
 * Compatible with MCP Inspector v0.13.0 and follows JSON-RPC 2.0 protocol
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { networkInterfaces } from 'os';
import net from 'net';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { consoleLogger } from '../utils/ConsoleLogger';
import { MCPService } from './services/MCPService';
import { MCPController } from './controllers/MCPController';
import { createMCPRouter } from './routes/MCPRouter';
import { ToolManager } from './tools';
import { TaskmasterSyncService } from '../core/tasks/TaskmasterSyncService';
import { TaskManager } from '../core/tasks/TaskManager';
import { SynchronizationService } from '../core/tasks/SynchronizationService';
import taskStorageFactory from '../core/tasks/TaskStorageFactory';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketSession } from '../types/RealTimeTypes';

// Load environment variables
dotenv.config();

/**
 * MCP SSE Server
 * 
 * Main server class that initializes and manages the SSE server
 * implementing the Model Context Protocol
 */
class MCPSSEServer {
	private app: express.Application;
	private server: http.Server;
	private io: SocketIOServer;
	private port: number;
	private intervalHandlers: NodeJS.Timeout[] = [];
	private isShuttingDown: boolean = false;
	private mcpService: MCPService;
	private mcpController: MCPController;
	private toolManager: ToolManager;
	private taskmasterSyncService: TaskmasterSyncService | null = null;
	private taskManager: TaskManager;
	private synchronizationService: SynchronizationService;
	private sessions: Map<string, WebSocketSession> = new Map();

	constructor(port?: number) {
		this.port = port || 3233;
		this.app = express();
		this.taskManager = new TaskManager();
		this.synchronizationService = new SynchronizationService(this.taskManager);
		this.toolManager = new ToolManager(consoleLogger);
		this.mcpService = new MCPService(consoleLogger, this.toolManager);
		this.mcpController = new MCPController(this.mcpService);
		
		this.setupMiddleware();
		this.setupRoutes();
		this.setupEventListeners();
		
		this.server = http.createServer(this.app);
		this.io = new SocketIOServer(this.server, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			}
		});
		consoleLogger.info('MCP-SSE', `Server created on port: ${this.port}`);
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
		// Mount MCP router
		const mcpRouter = createMCPRouter({ mcpController: this.mcpController });
		this.app.use('/', mcpRouter);

		// Health check endpoint
		this.app.get('/health', (req: Request, res: Response) => {
			res.json({ status: 'ok' });
		});

		// SSE endpoint
		this.app.get('/events', (req: Request, res: Response) => {
			const sessionId = uuidv4();

			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');

			// Send initial connection message
			res.write(`data: ${JSON.stringify({ type: 'connection', id: sessionId })}\n\n`);

			// Store the session
			this.sessions.set(sessionId, {
				id: sessionId,
				response: res,
				lastActivity: Date.now(),
				subscriptions: []
			});

			// Handle client disconnect
			req.on('close', () => {
				consoleLogger.info('MCP-SSE', `Client disconnected: ${sessionId}`);
				this.sessions.delete(sessionId);
			});
		});

		// MCP endpoint
		this.app.post('/mcp', async (req: Request, res: Response) => {
			try {
				const result = await this.mcpService.processRequest(req.body);
				res.json(result);
			} catch (error) {
				consoleLogger.error('MCP-SSE', `Error processing MCP request: ${error}`, { error });
				res.status(500).json({ error: 'Internal server error' });
			}
		});
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

	/**
	 * Initialize and start the Taskmaster sync service
	 */
	private async initializeTaskmasterSync(): Promise<void> {
		try {
			// Create the Taskmaster sync service
			this.taskmasterSyncService = new TaskmasterSyncService({
				logger: consoleLogger,
				syncInterval: 60000, // Sync every minute
				taskmasterFile: path.join(process.cwd(), 'tasks', 'tasks.json'),
				forceTaskmasterAsSource: true,
				watchFile: true
			});
			
			// Register event listeners
			this.taskmasterSyncService.on('syncCompleted', (result) => {
				consoleLogger.info('MCP-SSE', 'Taskmaster sync completed', result);
			});
			
			this.taskmasterSyncService.on('syncError', (error) => {
				consoleLogger.error('MCP-SSE', 'Taskmaster sync error', { error });
			});
			
			// Start the service
			await this.taskmasterSyncService.start();
			
			consoleLogger.info('MCP-SSE', 'Taskmaster sync service initialized and started');
		} catch (error) {
			consoleLogger.error('MCP-SSE', 'Failed to initialize Taskmaster sync service', { error });
		}
	}

	public async start(): Promise<void> {
		if (this.isShuttingDown) {
			throw new Error('Cannot start server during shutdown');
		}

		const available = await this.isPortAvailable(this.port);
		if (!available) {
			const error = new Error(`Port ${this.port} is already in use!`);
			consoleLogger.error('MCP-SSE', error.message, {
				port: this.port,
				suggestion: `Try: lsof -i :${this.port} | grep LISTEN; kill -9 <PID>`
			});
			throw error;
		}

		return new Promise((resolve) => {
			this.server = http.createServer(this.app);

			this.server.on('error', (err: Error) => {
				consoleLogger.error('MCP-SSE', `Server error`, { error: err.message });
				this.stop().catch(stopErr => {
					consoleLogger.error('MCP-SSE', 'Error during stop after server error', { error: stopErr });
				});
			});

			this.server.listen(this.port, async () => {
				const localIPs = this.getLocalIPs();

				consoleLogger.info('MCP-SSE', `🚀 MCP Inspector v0.13.0 Compatible SSE Server running on port ${this.port}`);
				consoleLogger.info('MCP-SSE', `🔗 SSE Endpoint: http://localhost:${this.port}/sse`);
				consoleLogger.info('MCP-SSE', `📨 Message Endpoint: http://localhost:${this.port}/sse/messages`);
				consoleLogger.info('MCP-SSE', `🏥 Health Check: http://localhost:${this.port}/health`);

				if (localIPs.length > 0) {
					consoleLogger.info('MCP-SSE', `🌐 Network access: ${localIPs.map(ip => `http://${ip}:${this.port}/sse`).join(', ')}`);
				}

				consoleLogger.info('MCP-SSE', `📋 To connect with MCP Inspector:`);
				consoleLogger.info('MCP-SSE', `   npx @modelcontextprotocol/inspector`);
				consoleLogger.info('MCP-SSE', `   Then connect to: http://localhost:${this.port}/sse`);

				// Display configuration guide
				consoleLogger.info('MCP-SSE', `\n📚 === CONFIGURATION GUIDE === 📚`);
				consoleLogger.info('MCP-SSE', `🔧 How to configure the AI Agents Server:`);
				consoleLogger.info('MCP-SSE', `   1. Server configuration: Edit '.cursor/mcp.json' to set API keys and server options`);
				consoleLogger.info('MCP-SSE', `   2. Task storage: Data is saved to '.cursor/rules/agents/_store/tasks.db' by default`);
				consoleLogger.info('MCP-SSE', `   3. Rules directory: Cursor rules are stored in '.cursor/rules/'`);
				consoleLogger.info('MCP-SSE', `   4. Agent source code: Located in '.cursor/rules/agents/src/'`);
				consoleLogger.info('MCP-SSE', `   5. Custom tools: Located in '.cursor/rules/agents/src/api/tools/'`);

				// Load tools and display information
				this.loadAndDisplayTools().then(() => {
					consoleLogger.info('MCP-SSE', `\n📝 Type 'help' for more information\n`);
				});

				// Set up periodic cleanup of stale sessions
				const cleanupInterval = setInterval(() => {
					const now = new Date();
					const staleTimeout = 5 * 60 * 1000; // 5 minutes
					const sessions = this.mcpService.getAllSessions();

					for (const [sessionId, session] of sessions.entries()) {
						if (now.getTime() - session.createdAt.getTime() > staleTimeout && !session.initialized) {
							consoleLogger.warn('MCP-SSE', `Cleaning up stale session: ${sessionId}`);
							this.mcpService.deleteSession(sessionId);
						}
					}
				}, 60000); // Check every minute

				this.intervalHandlers.push(cleanupInterval);

				// Register cleanup handlers
				process.on('SIGINT', this.handleProcessTermination.bind(this));
				process.on('SIGTERM', this.handleProcessTermination.bind(this));
				process.on('SIGQUIT', this.handleProcessTermination.bind(this));

				// Initialize the task storage factory before starting Taskmaster sync
				try {
					// Initialize the task storage with default options
					await taskStorageFactory.initialize();
					consoleLogger.info('MCP-SSE', '💾 Task storage initialized successfully');
					
					// Initialize and start the Taskmaster sync service
					await this.initializeTaskmasterSync();
					
					resolve();
				} catch (error) {
					consoleLogger.error('MCP-SSE', 'Failed to initialize task storage', { error });
					resolve();
				}
			});
		});
	}

	/**
	 * Load all tools and display information about them
	 */
	private async loadAndDisplayTools(): Promise<void> {
		try {
			// Load all tools
			const toolsDir = path.join(__dirname, 'tools');
			const count = await this.toolManager.loadAllTools(toolsDir);
			
			consoleLogger.info('MCP-SSE', `\n🧰 === REGISTERED TOOLS === 🧰`);
			consoleLogger.info('MCP-SSE', `Loaded ${count} tools automatically from the tools directory`);
			consoleLogger.info('MCP-SSE', `Available tools:`);
			
			// List each tool with its name and description
			this.toolManager.getAllTools().forEach(tool => {
				consoleLogger.info('MCP-SSE', ` - ${tool.name}: ${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}`);
			});
		} catch (error) {
			consoleLogger.error('MCP-SSE', 'Failed to load tools', { error });
		}
	}

	private handleProcessTermination(): void {
		consoleLogger.info('MCP-SSE', 'Process termination signal received');
		this.stop().catch(err => {
			consoleLogger.error('MCP-SSE', 'Error during stop after termination signal', { error: err });
			process.exit(1);
		});
	}

	public async stop(): Promise<void> {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;
		consoleLogger.info('MCP-SSE', 'Shutting down server...');

		// Stop the Taskmaster sync service if it's running
		if (this.taskmasterSyncService) {
			try {
				this.taskmasterSyncService.stop();
				consoleLogger.info('MCP-SSE', 'Taskmaster sync service stopped');
			} catch (error) {
				consoleLogger.error('MCP-SSE', 'Error stopping Taskmaster sync service', { error });
			}
		}

		// Clear all intervals
		for (const handler of this.intervalHandlers) {
			clearInterval(handler);
		}
		this.intervalHandlers = [];

		// Remove process signal handlers
		process.removeListener('SIGINT', this.handleProcessTermination);
		process.removeListener('SIGTERM', this.handleProcessTermination);
		process.removeListener('SIGQUIT', this.handleProcessTermination);

		// Close the server
		if (this.server) {
			return new Promise((resolve, reject) => {
				this.server.close((err) => {
					if (err) {
						consoleLogger.error('MCP-SSE', 'Error closing server', { error: err });
						reject(err);
					} else {
						consoleLogger.info('MCP-SSE', 'Server closed successfully');
						this.isShuttingDown = false;
						resolve();
					}
				});
			});
		}
	}

	/**
	 * Set up event listeners
	 */
	private setupEventListeners(): void {
		// Listen for Taskmaster sync events
		this.taskmasterSyncService.on('syncCompleted', (result) => {
			if (result.syncedFromTaskmaster > 0) {
				consoleLogger.info('MCP-SSE', `Taskmaster sync completed: ${result.syncedFromTaskmaster} tasks synced from Taskmaster`);
				
				// Instead of trying to broadcast directly, trigger a task update event
				// that the SynchronizationService will handle
				this.taskManager.emit('tasksUpdated', {
					source: 'taskmaster',
					count: result.syncedFromTaskmaster,
					details: {
						syncedFromTaskmaster: result.syncedFromTaskmaster,
						syncedToTaskmaster: result.syncedToTaskmaster,
						conflicts: result.conflicts || 0
					}
				});
			}
		});

		this.taskmasterSyncService.on('syncError', (error) => {
			consoleLogger.error('MCP-SSE', 'Taskmaster sync error', { error });
		});
	}

	/**
	 * Setup Socket.IO for real-time communication
	 */
	private setupSocketIO(): void {
		this.io.on('connection', (socket) => {
			const sessionId = socket.id;
			consoleLogger.info('MCP-SSE', `Socket.IO client connected: ${sessionId}`);

			// Add subscription handlers
			socket.on('subscribe_tools', () => {
				socket.join('tools');
				consoleLogger.info('MCP-SSE', `Client ${sessionId} subscribed to tools`);
			});

			socket.on('subscribe_tasks', (data) => {
				socket.join('tasks');
				consoleLogger.info('MCP-SSE', `Client ${sessionId} subscribed to tasks`);
			});

			socket.on('subscribe_automation', (data) => {
				socket.join('automation');
				consoleLogger.info('MCP-SSE', `Client ${sessionId} subscribed to automation`);
			});

			// Handle client disconnect
			socket.on('disconnect', () => {
				consoleLogger.info('MCP-SSE', `Socket.IO client disconnected: ${sessionId}`);
			});
		});
	}
}

export default MCPSSEServer;

// Example usage and startup
if (require.main === module) {
	const server = new MCPSSEServer(3233);

	server.start()
		.then(() => {
			consoleLogger.info('MCP-SSE', 'Server started successfully');
		})
		.catch((error: Error) => {
			consoleLogger.error('MCP-SSE', 'Failed to start server', { error: error.message });
			process.exit(1);
		});
}