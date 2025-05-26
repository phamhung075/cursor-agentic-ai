/**
 * Test SSE Server Script
 * 
 * This script starts a standalone SSE server on port 3233
 * for testing server-sent events functionality.
 * 
 * Usage: node scripts/test-sse-server.js
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const { EventEmitter } = require('events');

// Global event emitter for broadcasting events
const sseEvents = new EventEmitter();
sseEvents.setMaxListeners(100);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Client connections
const clients = new Set();
let eventCount = 0;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    clientCount: clients.size,
    eventCount
  });
});

// SSE endpoint
app.get('/sse', (req, res) => {
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
  sendEvent(res, {
    type: 'connection',
    data: { 
      clientId,
      message: 'Connected to AAI SSE Stream',
      timestamp: new Date().toISOString()
    }
  });

  // Register this client
  clients.add(res);
  console.log(`[SSE] Client connected: ${clientId} (Total: ${clients.size})`);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`[SSE] Client disconnected: ${clientId} (Total: ${clients.size})`);
  });
});

// Send an event to a specific client
function sendEvent(res, event) {
  const formattedEvent = `data: ${JSON.stringify(event)}\n\n`;
  res.write(formattedEvent);
  eventCount++;
}

// Broadcast an event to all connected clients
function broadcast(event) {
  if (clients.size === 0) return;

  const formattedEvent = `data: ${JSON.stringify({
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    broadcastId: `broadcast-${Date.now()}`
  })}\n\n`;

  clients.forEach(client => {
    client.write(formattedEvent);
  });

  eventCount += clients.size;
  console.log(`[SSE] Broadcast event to ${clients.size} clients: ${event.type || 'unknown'}`);
}

// Test endpoint to manually trigger events
app.post('/trigger', (req, res) => {
  const event = req.body;
  broadcast(event);
  res.json({ success: true, clientCount: clients.size });
});

// Start server
const PORT = 3233;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`SSE Server running at http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Trigger events: POST http://localhost:${PORT}/trigger`);
  
  // Send sample events periodically
  setInterval(() => {
    if (clients.size > 0) {
      broadcast({ 
        type: 'task_update', 
        data: {
          taskId: `task-${Math.floor(Math.random() * 1000)}`,
          status: ['pending', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 100)
        }
      });
    }
  }, 5000); // Every 5 seconds
  
  // Send heartbeat to keep connections alive
  setInterval(() => {
    if (clients.size > 0) {
      broadcast({ type: 'heartbeat' });
    }
  }, 30000); // Every 30 seconds
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down SSE server...');
  
  // Notify all clients we're shutting down
  clients.forEach(client => {
    sendEvent(client, {
      type: 'shutdown',
      data: { message: 'Server shutting down', timestamp: new Date().toISOString() }
    });
    client.end();
  });
  
  clients.clear();
  
  server.close(() => {
    console.log('SSE Server stopped');
    process.exit(0);
  });
}); 