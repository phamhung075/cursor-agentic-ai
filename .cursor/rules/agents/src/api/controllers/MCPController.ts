import { Request, Response } from 'express';
import { MCPService, JsonRpcRequest, JsonRpcResponse } from '../services/MCPService';

/**
 * MCP Controller
 * 
 * Handles MCP protocol operations and manages SSE connections
 */
export class MCPController {
  private mcpService: MCPService;

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
  }

  /**
   * Get the current number of active sessions
   */
  public getSessionCount(): number {
    return this.mcpService.getAllSessions().size;
  }

  /**
   * Handle SSE connection
   */
  public async handleSSEConnection(req: Request, res: Response): Promise<void> {
    // Generate unique session ID
    const sessionId = this.mcpService.generateSessionId();

    console.log(`[INFO] MCP-SSE: New SSE connection, session: ${sessionId}`);

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
    const sessionData = {
      id: sessionId,
      response: res,
      initialized: false,
      capabilities: {},
      createdAt: new Date()
    };

    // Store session
    this.mcpService.storeSession(sessionId, sessionData);

    // Send endpoint event immediately - THIS IS CRUCIAL FOR MCP INSPECTOR
    const endpointUrl = `/sse/messages?sessionId=${sessionId}`;
    this.sendEventToSession(sessionId, {
      event: 'endpoint',
      data: endpointUrl
    });

    console.log(`[INFO] MCP-SSE: Sent endpoint event: ${endpointUrl}`, { sessionId });
    
    // Set up a ping interval to keep the connection alive
    const pingInterval = setInterval(() => {
      try {
        const session = this.mcpService.getSession(sessionId);
        if (session && !res.writableEnded) {
          this.sendEventToSession(sessionId, {
            event: 'message',
            data: JSON.stringify({
              jsonrpc: '2.0',
              method: 'notifications/ping',
              params: { timestamp: new Date().toISOString() }
            })
          });
          console.log(`[DEBUG] MCP-SSE: Sent ping to session ${sessionId}`);
        } else {
          clearInterval(pingInterval);
        }
      } catch (error) {
        console.error(`[ERROR] MCP-SSE: Error sending ping to session ${sessionId}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        clearInterval(pingInterval);
      }
    }, 30000); // Send ping every 30 seconds

    // Handle client disconnect
    req.on('close', () => {
      this.mcpService.deleteSession(sessionId);
      clearInterval(pingInterval);
      console.log(`[INFO] MCP-SSE: Session disconnected: ${sessionId}`, {
        sessionCount: this.mcpService.getAllSessions().size
      });
    });

    req.on('error', (error: Error) => {
      console.error(`[ERROR] MCP-SSE: Session error: ${sessionId}`, { error: error.message });
      this.mcpService.deleteSession(sessionId);
      clearInterval(pingInterval);
    });
  }

  /**
   * Handle JSON-RPC message
   */
  public async handleJSONRPCMessage(req: Request, res: Response): Promise<void> {
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

    const session = this.mcpService.getSession(sessionId);
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

    console.log(`[DEBUG] MCP-SSE: Received JSON-RPC: ${jsonRpcRequest.method}`, {
      sessionId,
      id: jsonRpcRequest.id,
      params: jsonRpcRequest.params
    });

    // Process the JSON-RPC request
    try {
      const response: JsonRpcResponse = await this.processJSONRPCRequest(sessionId, jsonRpcRequest);
      
      // Send response back via SSE
      this.sendEventToSession(sessionId, {
        event: 'message',
        data: JSON.stringify(response)
      });

      // Acknowledge HTTP request
      res.json({ success: true });
    } catch (error) {
      console.error(`[ERROR] MCP-SSE: Error processing JSON-RPC`, {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: jsonRpcRequest.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      this.sendEventToSession(sessionId, {
        event: 'message',
        data: JSON.stringify(errorResponse)
      });

      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  /**
   * Process JSON-RPC request
   */
  private async processJSONRPCRequest(sessionId: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const session = this.mcpService.getSession(sessionId);
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
          return await this.mcpService.handleInitialize(sessionId, request);

        case 'ping':
          return {
            ...baseResponse,
            result: {}
          };
        
        case 'notifications/initialized':
          // This is a notification, no response needed with id
          console.log(`[INFO] MCP-SSE: Session fully initialized: ${sessionId}`);
          // For notifications, either return empty object or null
          return {
            jsonrpc: '2.0'
          };

        case 'tools/list':
          return {
            ...baseResponse,
            result: {
              tools: this.mcpService.getTools()
            }
          };

        case 'tools/call':
          return await this.mcpService.handleToolCall(request);

        case 'resources/list':
          return {
            ...baseResponse,
            result: {
              resources: this.mcpService.getResources()
            }
          };

        case 'resources/read':
          return await this.mcpService.handleResourceRead(request);

        case 'prompts/list':
          return {
            ...baseResponse,
            result: {
              prompts: this.mcpService.getPrompts()
            }
          };

        case 'prompts/get':
          return await this.mcpService.handlePromptGet(request);

        default:
          console.warn(`[WARN] MCP-SSE: Method not found: ${request.method}`, { sessionId });
          return {
            ...baseResponse,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      console.error(`[ERROR] MCP-SSE: Error processing JSON-RPC request: ${request.method}`, {
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

  /**
   * Handle debug trigger
   */
  public async handleDebugTrigger(req: Request, res: Response): Promise<void> {
    const event = req.body;
    this.mcpService.broadcastToAllSessions(event);
    res.json({ success: true, sessionCount: this.mcpService.getAllSessions().size });
  }

  /**
   * Send event to a specific session
   */
  private sendEventToSession(sessionId: string, event: { event: string; data: string }): void {
    const session = this.mcpService.getSession(sessionId);
    if (!session) {
      console.warn(`[WARN] MCP-SSE: Cannot send event to unknown session: ${sessionId}`);
      return;
    }

    try {
      // Format SSE event with proper format - this is CRUCIAL for compatibility
      // The exact format is "event: {eventName}\ndata: {jsonData}\n\n"
      const formatted = `event: ${event.event}\ndata: ${event.data}\n\n`;
      session.response.write(formatted);
      console.log(`[DEBUG] MCP-SSE: Sent event to session ${sessionId}`, { event: event.event });
    } catch (error: unknown) {
      console.error(`[ERROR] MCP-SSE: Error sending event to session ${sessionId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.mcpService.deleteSession(sessionId);
    }
  }
} 