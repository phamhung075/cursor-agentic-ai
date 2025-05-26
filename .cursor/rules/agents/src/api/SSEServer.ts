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

	constructor(port?: number) {
		if (port) {
			this.port = port;
		}
		
		// Initialize components
		this.app = express();
		this.mcpService = new MCPService(consoleLogger);
		this.mcpController = new MCPController(this.mcpService);
		
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

				resolve();
			});
		});
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