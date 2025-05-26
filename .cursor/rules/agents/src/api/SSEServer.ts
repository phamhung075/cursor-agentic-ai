/**
 * Server-Sent Events (SSE) Server
 * 
 * Dedicated server for streaming real-time events via SSE protocol.
 * Runs on port 3233 with endpoint /sse
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { EventEmitter } from 'events';
import { log } from '../utils';

// Global event emitter for broadcasting events to all SSE clients
export const sseEvents = new EventEmitter();
sseEvents.setMaxListeners(100); // Allow many clients to connect

class SSEServer {
  private app: express.Express;
  private server: http.Server;
  private port: number = 3233;
  private clients: Set<express.Response> = new Set();
  private eventCount: number = 0;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        clientCount: this.clients.size,
        eventCount: this.eventCount
      });
    });

    // SSE endpoint
    this.app.get('/sse', (req, res) => {
      const clientId = req.query.clientId || `client-${Date.now()}`;
      
      // Set SSE headers
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable proxy buffering
      });
      res.flushHeaders();

      // Send initial connection message
      this.sendEvent(res, {
        type: 'connection',
        data: { 
          clientId,
          message: 'Connected to AAI SSE Stream',
          timestamp: new Date().toISOString()
        }
      });

      // Register this client
      this.clients.add(res);
      log.info('SSE', `Client connected: ${clientId}`, { clientCount: this.clients.size });

      // Handle client disconnect
      req.on('close', () => {
        this.clients.delete(res);
        log.info('SSE', `Client disconnected: ${clientId}`, { clientCount: this.clients.size });
      });
    });
  }

  /**
   * Send an event to a specific client
   */
  private sendEvent(res: express.Response, event: any): void {
    const formattedEvent = `data: ${JSON.stringify(event)}\n\n`;
    res.write(formattedEvent);
    this.eventCount++;
  }

  /**
   * Broadcast an event to all connected clients
   */
  public broadcast(event: any): void {
    if (this.clients.size === 0) return;

    const formattedEvent = `data: ${JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      broadcastId: `broadcast-${Date.now()}`
    })}\n\n`;

    this.clients.forEach(client => {
      client.write(formattedEvent);
    });

    this.eventCount += this.clients.size;
    log.debug('SSE', `Broadcast event to ${this.clients.size} clients`, { eventType: event.type });
  }

  /**
   * Start the SSE server
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        log.info('SSE', `SSE Server running at http://localhost:${this.port}/sse`);
        
        // Set up listener for broadcasting events
        sseEvents.on('broadcast', (event) => {
          this.broadcast(event);
        });
        
        // Send heartbeat to keep connections alive
        setInterval(() => {
          if (this.clients.size > 0) {
            this.broadcast({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            });
          }
        }, 30000); // Every 30 seconds
        
        resolve();
      });
    });
  }

  /**
   * Stop the SSE server
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Notify all clients we're shutting down
      this.clients.forEach(client => {
        this.sendEvent(client, {
          type: 'shutdown',
          data: { message: 'Server shutting down', timestamp: new Date().toISOString() }
        });
        client.end();
      });
      
      this.clients.clear();
      
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        log.info('SSE', 'SSE Server stopped');
        resolve();
      });
    });
  }
}

export default SSEServer; 