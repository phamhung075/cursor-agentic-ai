/**
 * Test Server-Sent Events (SSE) Server for MCP Inspector compatibility
 * This script runs a standalone SSE server that is compatible with MCP Inspector
 * on port 3233 with endpoint /sse
 */

// This is a temporary JavaScript implementation for testing
// The full TypeScript implementation is in src/api/SSEServer.ts

const express = require('express');
const cors = require('cors');
const http = require('http');
const { networkInterfaces } = require('os');
const net = require('net');

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Server configuration
const PORT = 3233;
const clients = new Set();
let eventCount = 0;
let intervalHandlers = [];

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port);
  });
}

// Get local IP addresses
function getLocalIPs() {
  const interfaces = networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (ifaces) {
      for (const iface of ifaces) {
        // Skip internal and non-ipv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
  }
  
  return addresses;
}

// Send an event to a specific client
function sendEvent(res, event) {
  const formattedEvent = `data: ${JSON.stringify(event)}\n\n`;
  try {
    res.write(formattedEvent);
    eventCount++;
  } catch (err) {
    console.error('Error sending event to client', err);
    // Remove client if it's no longer writable
    clients.delete(res);
  }
}

// Broadcast an event to all connected clients
function broadcast(event) {
  if (clients.size === 0) return;

  const formattedEvent = `data: ${JSON.stringify({
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    broadcastId: `broadcast-${Date.now()}`
  })}\n\n`;

  // Use array to allow removal during iteration
  const deadClients = [];
  
  clients.forEach(client => {
    try {
      client.write(formattedEvent);
    } catch (err) {
      console.error('Error broadcasting to client', err);
      deadClients.push(client);
    }
  });
  
  // Remove dead clients
  deadClients.forEach(client => clients.delete(client));
  
  if (deadClients.length > 0) {
    console.warn(`Removed ${deadClients.length} dead clients`);
  }

  eventCount += clients.size;
  console.log(`Broadcast event to ${clients.size} clients`, { eventType: event.type });
}

// Handle MCP tool calls
function handleMCPToolCall(tool, args) {
  // Simple implementation for demo purposes
  console.log(`Handling tool call: ${tool}`, args);
  
  switch(tool) {
    case 'create_task':
      return { 
        id: `task-${Date.now()}`, 
        title: args.title || 'New Task',
        status: 'pending',
        created: new Date().toISOString()
      };
    
    case 'update_task':
      return { 
        id: args.id || `task-${Date.now()}`,
        updated: new Date().toISOString(),
        success: true
      };
      
    case 'get_task':
      return {
        id: args.id || 'unknown',
        title: 'Sample Task',
        description: 'This is a sample task',
        status: 'in-progress',
        priority: 'medium',
        created: new Date().toISOString()
      };
      
    case 'list_tasks':
      return {
        tasks: [
          { id: 'task-1', title: 'Sample Task 1', status: 'pending' },
          { id: 'task-2', title: 'Sample Task 2', status: 'in-progress' },
          { id: 'task-3', title: 'Sample Task 3', status: 'completed' }
        ],
        total: 3
      };
      
    case 'get_system_status':
      return {
        status: 'healthy',
        uptime: process.uptime(),
        clients: clients.size,
        events: eventCount,
        timestamp: new Date().toISOString()
      };
      
    default:
      return {
        error: 'Tool not implemented',
        tool
      };
  }
}

// Set up Express routes
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
  const clientId = req.query['clientId']?.toString() || `client-${Date.now()}`;
  
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable proxy buffering
  });
  res.flushHeaders();

  // Send initial connection message in MCP-compatible format
  sendEvent(res, {
    type: 'ping',
    timestamp: new Date().toISOString()
  });

  // Register this client
  clients.add(res);
  console.log(`Client connected: ${clientId}`, { clientCount: clients.size });

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`Client disconnected: ${clientId}`, { clientCount: clients.size });
  });
});

// Test endpoint to manually trigger events
app.post('/trigger', (req, res) => {
  const event = req.body;
  broadcast(event);
  res.json({ success: true, clientCount: clients.size });
});

// MCP tools endpoint (for MCP Inspector compatibility)
app.post('/api/mcp/tools', (req, res) => {
  const { tool, arguments: args } = req.body;
  
  console.log(`Tool call received: ${tool}`, args);
  
  // Process the tool call
  const result = handleMCPToolCall(tool, args);
  
  // Send the result
  res.json({
    type: 'tool_response',
    name: tool,
    result,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
  
  // Also broadcast the tool call as an event
  broadcast({
    type: 'tool_call',
    name: tool,
    arguments: args,
    timestamp: new Date().toISOString()
  });
  
  // And broadcast the response
  broadcast({
    type: 'tool_response',
    name: tool,
    result,
    timestamp: new Date().toISOString()
  });
});

// Start the server
async function startServer() {
  // Check if port is available
  const available = await isPortAvailable(PORT);
  if (!available) {
    console.error(`Port ${PORT} is already in use!`);
    console.error(`Try: lsof -i :${PORT} | grep LISTEN; kill -9 <PID>`);
    process.exit(1);
  }
  
  const server = http.createServer(app);
  
  server.on('error', (err) => {
    console.error('Server error', err);
    cleanup(server);
  });
  
  server.listen(PORT, () => {
    const localIPs = getLocalIPs();
    
    console.log(`🚀 MCP-compatible SSE Server running on port ${PORT}`);
    console.log(`🔗 Local access: http://localhost:${PORT}/sse`);
    console.log(`🛠️ MCP Tools: http://localhost:${PORT}/api/mcp/tools`);
    
    if (localIPs.length > 0) {
      console.log(`🌐 Network access: ${localIPs.map(ip => `http://${ip}:${PORT}/sse`).join(', ')}`);
    }
    
    // Send heartbeat to keep connections alive (MCP-compatible pong format)
    const heartbeatInterval = setInterval(() => {
      if (clients.size > 0) {
        broadcast({ 
          type: 'pong',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
    intervalHandlers.push(heartbeatInterval);
    
    // Send sample MCP-like events periodically (for testing)
    const sampleInterval = setInterval(() => {
      if (clients.size > 0) {
        // Send sample ping event occasionally
        if (Math.random() < 0.2) {
          broadcast({ 
            type: 'ping',
            timestamp: new Date().toISOString()
          });
          return;
        }
        
        // Use proper MCP event types
        const eventType = Math.random() < 0.5 ? 'tool_call' : 'tool_response';
        const toolName = ['create_task', 'update_task', 'get_task', 'list_tasks'][Math.floor(Math.random() * 4)];
        
        if (eventType === 'tool_call') {
          broadcast({ 
            type: eventType,
            name: toolName,
            arguments: {
              id: `task-${Math.floor(Math.random() * 1000)}`,
              status: ['pending', 'in-progress', 'completed'][Math.floor(Math.random() * 3)]
            },
            timestamp: new Date().toISOString()
          });
        } else {
          broadcast({ 
            type: eventType,
            name: toolName,
            result: {
              success: true,
              taskId: `task-${Math.floor(Math.random() * 1000)}`,
              status: ['pending', 'in-progress', 'completed'][Math.floor(Math.random() * 3)]
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }, 5000); // Every 5 seconds
    intervalHandlers.push(sampleInterval);
  });
  
  // Handle process termination
  process.on('SIGINT', () => cleanup(server));
  process.on('SIGTERM', () => cleanup(server));
  process.on('SIGQUIT', () => cleanup(server));
}

// Clean up resources
function cleanup(server) {
  console.log('🛑 Shutting down SSE Server...');
  
  // Clear all intervals
  intervalHandlers.forEach(clearInterval);
  intervalHandlers = [];
  
  // Notify all clients we're shutting down
  clients.forEach(client => {
    try {
      sendEvent(client, {
        type: 'shutdown',
        data: { message: 'Server shutting down', timestamp: new Date().toISOString() }
      });
      client.end();
    } catch (err) {
      // Ignore errors during shutdown
    }
  });
  
  clients.clear();
  
  if (server) {
    const forceShutdownTimeout = setTimeout(() => {
      console.warn('Force closing server after timeout');
      process.exit(0);
    }, 3000);
    
    server.close((err) => {
      clearTimeout(forceShutdownTimeout);
      
      if (err) {
        console.error('Error closing server', err);
        process.exit(1);
      }
      
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
}); 