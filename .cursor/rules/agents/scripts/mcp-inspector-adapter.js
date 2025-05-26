/**
 * MCP Inspector Adapter
 * 
 * This script acts as a bridge between our SSE server and MCP Inspector.
 * It handles transforming the messages to the exact format MCP Inspector expects.
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const { networkInterfaces } = require('os');
const net = require('net');

// Configuration
const ADAPTER_PORT = 6274; // MCP Inspector default port
const SSE_SERVER_URL = 'http://localhost:3233/sse';
const SSE_TOOLS_URL = 'http://localhost:3233/api/mcp/tools';

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Add support for direct pass-through requests from MCP Inspector
app.get('/', (req, res) => {
  // Check if this is a request from MCP Inspector with query params
  if (req.query.transportType === 'sse' && req.query.url) {
    console.log('Detected MCP Inspector direct connection request:', req.query);
    // Create special SSE connection for MCP Inspector
    handleMCPInspectorConnection(req, res);
    return;
  }
  
  // Regular HTML interface
  res.send(`
    <html>
      <head>
        <title>MCP Inspector Adapter</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .card { background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          code { background: #eee; padding: 2px 4px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>MCP Inspector Adapter Running</h1>
        <div class="card">
          <h2>Connection Information</h2>
          <p>The adapter is running and ready to connect to MCP Inspector.</p>
          <p>For direct MCP Inspector connection, use:</p>
          <p><code>http://localhost:${ADAPTER_PORT}?transportType=sse&url=http://localhost:3233/sse</code></p>
          <p>Or for manual testing:</p>
          <p><code>http://localhost:${ADAPTER_PORT}/sse</code></p>
        </div>
        <div class="card">
          <h2>Status</h2>
          <p>Adapter listening on port: <code>${ADAPTER_PORT}</code></p>
          <p>Connected to SSE server: <code>${SSE_SERVER_URL}</code></p>
          <p>Status: <code>${connected ? 'Connected' : 'Disconnected'}</code></p>
        </div>
        <div class="card">
          <h2>Resources</h2>
          <p><a href="http://127.0.0.1:6274/#resources" target="_blank">Open MCP Inspector</a></p>
          <p><a href="/public/mcp-sse-test.html" target="_blank">Open Test Client</a></p>
        </div>
      </body>
    </html>
  `);
});

// Also add a direct access for the MCP Inspector's expected URL pattern
app.get('/#resources', (req, res) => {
  res.redirect('/sse');
});

// Clients connected to our adapter
const clients = new Set();

// Server connection state
let connected = false;
let sseRequest = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Create a direct endpoint for MCP Inspector to connect with the exact URL it's looking for
function handleMCPInspectorConnection(req, res) {
  console.log('Setting up MCP Inspector connection');
  
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable proxy buffering
  });
  res.flushHeaders();
  
  // Send initial ping immediately
  res.write(`data: ${JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // If not connected to source, try connecting
  if (!connected) {
    connectToSSEServer();
  }
  
  // Register this client
  clients.add(res);
  console.log(`MCP Inspector client connected (Total: ${clients.size})`);
  
  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`MCP Inspector client disconnected (Total: ${clients.size})`);
  });
  
  // Send periodic pings specifically for this connection
  const pingInterval = setInterval(() => {
    try {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } else {
        clearInterval(pingInterval);
      }
    } catch (error) {
      clearInterval(pingInterval);
    }
  }, 15000); // Every 15 seconds
}

// Connect to the original SSE server
function connectToSSEServer() {
  console.log(`Connecting to SSE server at ${SSE_SERVER_URL}...`);
  
  // Reset connection state
  if (sseRequest) {
    try {
      sseRequest.destroy();
    } catch (error) {
      // Ignore
    }
    sseRequest = null;
  }
  
  // Parse the URL
  const url = new URL(SSE_SERVER_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  };
  
  // Choose http or https
  const requestLib = url.protocol === 'https:' ? https : http;
  
  // Make the request
  sseRequest = requestLib.request(options, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to connect to SSE server: ${response.statusCode}`);
      reconnect();
      return;
    }
    
    console.log('Connected to SSE server successfully');
    connected = true;
    reconnectAttempts = 0; // Reset reconnect attempts on success
    
    let buffer = '';
    
    response.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // Process complete SSE messages
      const messages = buffer.split('\n\n');
      buffer = messages.pop(); // Keep the last incomplete message in the buffer
      
      for (const message of messages) {
        if (message.trim() === '') continue;
        
        try {
          // Extract JSON data from SSE format
          const dataMatch = message.match(/^data: (.+)$/m);
          if (dataMatch && dataMatch[1]) {
            const data = JSON.parse(dataMatch[1]);
            
            // Transform and broadcast the message
            const transformedMessage = transformMessage(data);
            broadcastMessage(transformedMessage);
          }
        } catch (error) {
          console.error('Error processing SSE message:', error, message);
        }
      }
    });
    
    response.on('error', (error) => {
      console.error('Error from SSE server:', error);
      connected = false;
      reconnect();
    });
    
    response.on('close', () => {
      console.log('SSE server closed the connection');
      connected = false;
      reconnect();
    });
    
    response.on('end', () => {
      console.log('SSE server ended the connection');
      connected = false;
      reconnect();
    });
  });
  
  sseRequest.on('error', (error) => {
    console.error('Error connecting to SSE server:', error);
    connected = false;
    reconnect();
  });
  
  sseRequest.end();
}

// Reconnect to the SSE server after a delay
function reconnect() {
  if (sseRequest) {
    try {
      sseRequest.destroy();
    } catch (error) {
      // Ignore
    }
    sseRequest = null;
  }
  
  reconnectAttempts++;
  
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    console.error(`Exceeded maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}). Giving up.`);
    return;
  }
  
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000); // Exponential backoff, max 30s
  console.log(`Reconnecting to SSE server in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  setTimeout(connectToSSEServer, delay);
}

// Broadcast a message to all clients
function broadcastMessage(message) {
  const formattedEvent = `data: ${JSON.stringify(message)}\n\n`;
  
  // Use array to allow removal during iteration
  const deadClients = [];
  
  clients.forEach(client => {
    try {
      client.write(formattedEvent);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      deadClients.push(client);
    }
  });
  
  // Remove dead clients
  deadClients.forEach(client => clients.delete(client));
  
  if (deadClients.length > 0) {
    console.warn(`Removed ${deadClients.length} dead clients`);
  }
  
  if (clients.size > 0) {
    console.log(`Broadcast event type=${message.type} to ${clients.size} clients`);
  }
}

// Transform messages to match MCP Inspector's expected format
function transformMessage(message) {
  // Handle specific message types that need transformation
  switch (message.type) {
    case 'ping':
      return {
        type: 'ping',
        timestamp: message.timestamp || new Date().toISOString()
      };
      
    case 'pong':
      return {
        type: 'pong',
        timestamp: message.timestamp || new Date().toISOString()
      };
      
    case 'tool_call':
      return {
        type: 'tool_call',
        name: message.name,
        arguments: message.arguments,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
    case 'tool_response':
      return {
        type: 'tool_response',
        name: message.name,
        result: message.result,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
    default:
      // For other message types, ensure they have a timestamp
      return {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      };
  }
}

// SSE endpoint for MCP Inspector
app.get('/sse', (req, res) => {
  // Log any query parameters to help debug MCP Inspector connections
  if (Object.keys(req.query).length > 0) {
    console.log('SSE connection with query parameters:', req.query);
  }

  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable proxy buffering
  });
  res.flushHeaders();
  
  // If we're not connected to the original SSE server, send an error
  if (!connected) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'Not connected to SSE server',
      timestamp: new Date().toISOString()
    })}\n\n`);
  } else {
    // Send initial ping message
    res.write(`data: ${JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }
  
  // Register this client
  clients.add(res);
  console.log(`Client connected (Total: ${clients.size})`);
  
  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`Client disconnected (Total: ${clients.size})`);
  });
});

// Forward tool calls to the original SSE server
app.post('/api/mcp/tools', async (req, res) => {
  try {
    const response = await fetch(SSE_TOOLS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error forwarding tool call:', error);
    res.status(500).json({
      type: 'error',
      message: 'Error forwarding tool call',
      error: error.message
    });
  }
});

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

// Start the adapter server
async function startServer() {
  // Check if port is available
  const available = await isPortAvailable(ADAPTER_PORT);
  if (!available) {
    console.error(`Port ${ADAPTER_PORT} is already in use!`);
    console.error(`Try: lsof -i :${ADAPTER_PORT} | grep LISTEN; kill -9 <PID>`);
    process.exit(1);
  }
  
  // Connect to the original SSE server
  connectToSSEServer();
  
  // Start HTTP server
  const server = http.createServer(app);
  
  server.listen(ADAPTER_PORT, () => {
    const localIPs = getLocalIPs();
    
    console.log(`🚀 MCP Inspector Adapter running on port ${ADAPTER_PORT}`);
    console.log(`🔗 Local access: http://localhost:${ADAPTER_PORT}/`);
    console.log(`🔌 MCP Inspector URL: http://localhost:${ADAPTER_PORT}/sse`);
    
    if (localIPs.length > 0) {
      console.log(`🌐 Network access: ${localIPs.map(ip => `http://${ip}:${ADAPTER_PORT}/`).join(', ')}`);
    }
    
    console.log('⚡ Ready for MCP Inspector connections');
    
    // Send periodic pings to keep connections alive
    setInterval(() => {
      if (clients.size > 0 && connected) {
        broadcastMessage({
          type: 'pong',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000);
  });
  
  // Handle errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGINT', () => cleanup(server));
  process.on('SIGTERM', () => cleanup(server));
}

// Clean up resources
function cleanup(server) {
  console.log('🛑 Shutting down adapter...');
  
  // Close SSE connection
  if (sseRequest) {
    try {
      sseRequest.destroy();
    } catch (error) {
      // Ignore
    }
    sseRequest = null;
  }
  
  // Notify all clients
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify({
        type: 'shutdown',
        message: 'Adapter shutting down',
        timestamp: new Date().toISOString()
      })}\n\n`);
      client.end();
    } catch (error) {
      // Ignore errors during shutdown
    }
  });
  
  clients.clear();
  
  // Close server
  if (server) {
    server.close(() => {
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });
    
    // Force exit after timeout
    setTimeout(() => {
      console.log('⚠️ Force exit after timeout');
      process.exit(1);
    }, 3000);
  } else {
    process.exit(0);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 