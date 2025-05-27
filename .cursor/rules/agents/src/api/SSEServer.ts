/**
 * MCP Inspector v0.13.0 Compatible SSE Server
 * 
 * Implements Model Context Protocol over Server-Sent Events
 * Compatible with MCP Inspector v0.13.0 and follows JSON-RPC 2.0 protocol
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { networkInterfaces } from 'os';
import net from 'net';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { consoleLogger } from '../types/LogTypes';
import { MCPService } from './services/MCPService';
import { MCPController } from './controllers/MCPController';
import { createMCPRouter } from './routes/MCPRouter';
import { ToolManager } from './tools';
import { TaskmasterSyncService } from '../core/tasks/TaskmasterSyncService';
import { TaskManager } from '../core/tasks/TaskManager';
import { SynchronizationService } from '../core/tasks/SynchronizationService';

// Load environment variables
dotenv.config();

/**
 * MCP SSE Server
 * 
 * Main server class that initializes and manages the SSE server
 * implementing the Model Context Protocol
 */
class MCPSSEServer {
	private app: express.Express;
	private server: http.Server | null = null;
	private port: number = 3233;
	private intervalHandlers: NodeJS.Timeout[] = [];
	private isShuttingDown: boolean = false;
	private mcpService: MCPService;
	private mcpController: MCPController;
	private toolManager: ToolManager;
	private taskmasterSyncService: TaskmasterSyncService;
	private taskManager: TaskManager;
	private synchronizationService: SynchronizationService;

	constructor(port?: number) {
		this.port = port || 3233;
		this.app = express();
		this.taskManager = new TaskManager();
		this.synchronizationService = new SynchronizationService(this.taskManager);
		this.toolManager = new ToolManager(consoleLogger);
		this.mcpService = new MCPService(consoleLogger, this.toolManager);
		this.mcpController = new MCPController(this.mcpService);
		this.taskmasterSyncService = new TaskmasterSyncService({
			logger: consoleLogger,
			syncInterval: 30000 // Sync every 30 seconds
		});
		
		this.setupMiddleware();
		this.setupRoutes();
		this.setupEventListeners();
		
		this.server = http.createServer(this.app);
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

			this.server.listen(this.port, () => {
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

				// Start the Taskmaster sync service
				this.taskmasterSyncService.start().then(() => {
					consoleLogger.info('MCP-SSE', '🔄 Taskmaster sync service started successfully');
				}).catch(error => {
					consoleLogger.error('MCP-SSE', 'Failed to start Taskmaster sync service', { error });
				});

				resolve();
			});
		});
	}

	/**
	 * Load all tools and display information about them
	 */
	private async loadAndDisplayTools(): Promise<void> {
		try {
			// Load all tools
			const toolsDir = path.join(__dirname, '..', 'tools');
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
		consoleLogger.info('MCP-SSE', '🛑 Shutting down MCP SSE Server...');

		// Clear all intervals
		this.intervalHandlers.forEach(clearInterval);
		this.intervalHandlers = [];

		// Remove signal handlers
		process.removeListener('SIGINT', this.handleProcessTermination);
		process.removeListener('SIGTERM', this.handleProcessTermination);
		process.removeListener('SIGQUIT', this.handleProcessTermination);

		// Stop the Taskmaster sync service
		this.taskmasterSyncService.stop();
		consoleLogger.info('MCP-SSE', '🔄 Taskmaster sync service stopped');

		return new Promise((resolve, reject) => {
			// Notify all sessions we're shutting down
			const sessions = this.mcpService.getAllSessions();
			for (const [sessionId, session] of sessions.entries()) {
				try {
					// Use the controller to send the message
					session.response.write(`event: message\ndata: ${JSON.stringify({
							jsonrpc: '2.0',
							method: 'notifications/cancelled',
							params: { reason: 'Server shutting down' }
					})}\n\n`);
					session.response.end();
				} catch (error: unknown) {
					// Ignore errors during shutdown
				}
			}

			// Clear all sessions
			sessions.clear();

			if (this.server) {
				const forceShutdownTimeout = setTimeout(() => {
					consoleLogger.warn('MCP-SSE', 'Force closing server after timeout');
					resolve();
				}, 3000);

				this.server.close((err?: Error) => {
					clearTimeout(forceShutdownTimeout);

					if (err) {
						consoleLogger.error('MCP-SSE', 'Error closing server', { error: err.message });
						reject(err);
						return;
					}

					consoleLogger.info('MCP-SSE', '✅ Server stopped gracefully');
					this.isShuttingDown = false;
					resolve();
				});
			} else {
				this.isShuttingDown = false;
				resolve();
			}
		});
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