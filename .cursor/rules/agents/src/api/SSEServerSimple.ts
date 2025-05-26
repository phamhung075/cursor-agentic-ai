/**
 * Simple MCP Server (TypeScript Version)
 * 
 * Simplified MCP-compatible server that works with @modelcontextprotocol/inspector
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { randomBytes } from 'crypto';

// Configuration
const PORT = 3233;

// Interface for client connections
interface ClientConnection {
	id: string;
	response: express.Response;
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Store active SSE connections
const clients = new Set<ClientConnection>();

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		sessionCount: clients.size,
		protocolVersion: '2024-11-05',
		mcpCompliant: true
	});
});

// Main SSE endpoint - MCP Inspector connects here
app.get('/sse', (req, res) => {
	console.log('New SSE connection');
	
	// Set SSE headers
	res.set({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	res.flushHeaders();
	
	// This padding is important for EventSource compatibility
	res.write(":" + Array(2049).join(" ") + "\n"); // 2kB padding
	res.write("retry: 10000\n\n");  // Set retry interval
	
	// Generate session ID
	const sessionId = randomBytes(16).toString('hex');
	
	// Send endpoint URL right away - THIS IS CRUCIAL
	const endpointUrl = `/sse/messages?sessionId=${sessionId}`;
	res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);
	
	console.log(`Sent endpoint: ${endpointUrl}`);
	
	// Add this client to active connections
	const client: ClientConnection = {
		id: sessionId,
		response: res
	};
	clients.add(client);
	
	// Set up ping interval
	const pingInterval = setInterval(() => {
		try {
			if (!res.writableEnded) {
				res.write(`event: message\ndata: ${JSON.stringify({
					jsonrpc: '2.0',
					method: 'notifications/ping',
					params: { timestamp: new Date().toISOString() }
				})}\n\n`);
			} else {
				clearInterval(pingInterval);
			}
		} catch (error) {
			console.error(`Error sending ping: ${error instanceof Error ? error.message : 'Unknown error'}`);
			clearInterval(pingInterval);
		}
	}, 30000);
	
	// Handle disconnection
	req.on('close', () => {
		clients.delete(client);
		clearInterval(pingInterval);
		console.log(`Connection closed. Active clients: ${clients.size}`);
	});
});

// Message endpoint - receives JSON-RPC messages
app.post('/sse/messages', (req, res) => {
	const sessionId = req.query['sessionId'] as string;
	
	if (!sessionId) {
		return res.status(400).json({ error: 'Missing sessionId' });
	}
	
	const client = Array.from(clients).find(c => c.id === sessionId);
	
	if (!client) {
		return res.status(404).json({ error: 'Session not found' });
	}
	
	console.log(`Received message for session ${sessionId}:`, req.body);
	
	// Process the message
	const jsonRpcRequest = req.body;
	const jsonRpcResponse = handleJsonRpcRequest(jsonRpcRequest);
	
	// Send response via SSE
	client.response.write(`event: message\ndata: ${JSON.stringify(jsonRpcResponse)}\n\n`);
	
	// Acknowledge receipt
	res.json({ success: true });
});

interface JsonRpcRequest {
	jsonrpc: string;
	id?: string | number;
	method: string;
	params?: Record<string, any>;
}

interface JsonRpcResponse {
	jsonrpc: string;
	id?: string | number | undefined;
	result?: any;
	error?: {
		code: number;
		message: string;
		data?: any;
	};
}

function handleJsonRpcRequest(request: JsonRpcRequest): JsonRpcResponse {
	console.log(`Processing RPC request: ${request.method}`);
	
	const baseResponse: JsonRpcResponse = {
		jsonrpc: '2.0',
		id: request.id
	};
	
	switch (request.method) {
		case 'initialize':
			return {
				...baseResponse,
				result: {
					protocolVersion: '2024-11-05',
					capabilities: {
						tools: { listChanged: true },
						resources: { subscribe: true, listChanged: true },
						prompts: { listChanged: true }
					},
					serverInfo: {
						name: 'Simple MCP Server (TypeScript)',
						version: '1.0.0'
					}
				}
			};
			
		case 'ping':
			return {
				...baseResponse,
				result: {}
			};
			
		case 'tools/list':
			return {
				...baseResponse,
				result: {
					tools: [
						{
							name: 'hello_world',
							description: 'Say hello to the world!',
							inputSchema: {
								type: 'object',
								properties: {
									name: { 
										type: 'string', 
										description: 'Your name' 
									}
								}
							}
						}
					]
				}
			};
			
		case 'tools/call':
			const toolName = request.params?.['name'] as string;
			const toolArgs = (request.params?.['arguments'] as Record<string, any>) || {};
			
			if (toolName === 'hello_world') {
				const name = toolArgs['name'] || 'World';
				return {
					...baseResponse,
					result: {
						content: [
							{
								type: 'text',
								text: `Hello, ${name}! Welcome to the MCP protocol.`
							}
						]
					}
				};
			}
			
			return {
				...baseResponse,
				error: {
					code: -32601,
					message: `Tool not found: ${toolName}`
				}
			};
			
		default:
			return {
				...baseResponse,
				error: {
					code: -32601,
					message: `Method not found: ${request.method}`
				}
			};
	}
}

// Start the server if this file is run directly
if (require.main === module) {
	const server = http.createServer(app);
	server.listen(PORT, () => {
		console.log(`
🚀 Simple MCP Server (TypeScript) running on port ${PORT}
🔗 SSE Endpoint: http://localhost:${PORT}/sse
📨 Message Endpoint: http://localhost:${PORT}/sse/messages
🏥 Health Check: http://localhost:${PORT}/health

📋 To connect with MCP Inspector:
   npx @modelcontextprotocol/inspector
   Then connect to: http://localhost:${PORT}/sse
    `);
	});

	// Handle graceful shutdown
	process.on('SIGINT', () => {
		console.log('Shutting down server...');
		server.close(() => {
			console.log('Server stopped');
			process.exit(0);
		});
	});
}

// Export for importing in other files
export default app;