/**
 * Simple MCP Test Client
 * 
 * This script tests the MCP SSE Server by:
 * 1. Establishing an SSE connection
 * 2. Sending an initialize request
 * 3. Retrieving tools, resources, and prompts
 */

const fetch = require('node-fetch');
const EventSourcePolyfill = require('eventsource');

const SSE_URL = 'http://localhost:3233/sse';
let sessionId = null;
let messageEndpoint = null;

// Function to send requests to MCP server
async function sendRequest(endpoint, body) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending request:', error);
    return null;
  }
}

// Connect to SSE endpoint
console.log(`Connecting to SSE endpoint: ${SSE_URL}`);
const es = new EventSourcePolyfill(SSE_URL);

es.addEventListener('open', () => {
  console.log('✅ SSE connection established');
});

es.addEventListener('error', (error) => {
  console.error('❌ SSE connection error:', error);
  es.close();
  process.exit(1);
});

// Handle endpoint event to get the message endpoint with session ID
es.addEventListener('endpoint', async (event) => {
  const endpoint = event.data;
  messageEndpoint = `http://localhost:3233${endpoint}`;
  sessionId = new URL(messageEndpoint).searchParams.get('sessionId');
  
  console.log(`🔑 Session ID: ${sessionId}`);
  console.log(`📨 Message endpoint: ${messageEndpoint}`);
  
  // Now initialize the session
  const initializeResponse = await sendRequest(messageEndpoint, {
    jsonrpc: '2.0',
    id: 'init-1',
    method: 'initialize',
    params: {
      protocol_version: '2024-11-05',
      client: {
        name: 'MCP Test Client',
        version: '1.0.0'
      }
    }
  });
  
  console.log('\n📝 Initialize Response:');
  console.log(JSON.stringify(initializeResponse, null, 2));
  
  if (initializeResponse?.result) {
    // Get tools
    const toolsResponse = await sendRequest(messageEndpoint, {
      jsonrpc: '2.0',
      id: 'tools-1',
      method: 'mcp/tools.list',
      params: {}
    });
    
    console.log('\n🔧 Tools:');
    console.log(JSON.stringify(toolsResponse, null, 2));
    
    // Get resources
    const resourcesResponse = await sendRequest(messageEndpoint, {
      jsonrpc: '2.0',
      id: 'resources-1',
      method: 'mcp/resources.list',
      params: {}
    });
    
    console.log('\n📚 Resources:');
    console.log(JSON.stringify(resourcesResponse, null, 2));
    
    // Get prompts
    const promptsResponse = await sendRequest(messageEndpoint, {
      jsonrpc: '2.0',
      id: 'prompts-1',
      method: 'mcp/prompts.list',
      params: {}
    });
    
    console.log('\n💬 Prompts:');
    console.log(JSON.stringify(promptsResponse, null, 2));
    
    // Call a tool (create_task)
    const createTaskResponse = await sendRequest(messageEndpoint, {
      jsonrpc: '2.0',
      id: 'task-1',
      method: 'mcp/tools.call',
      params: {
        name: 'create_task',
        arguments: {
          title: 'Test Task Created via MCP',
          description: 'This is a test task created through the MCP protocol',
          type: 'task',
          level: 3,
          status: 'pending',
          priority: 'medium',
          complexity: 'low',
          tags: ['test', 'mcp', 'automation']
        }
      }
    });
    
    console.log('\n✅ Create Task Response:');
    console.log(JSON.stringify(createTaskResponse, null, 2));
  }
  
  // Close the connection and exit
  setTimeout(() => {
    console.log('\n👋 Test completed, closing connection');
    es.close();
    process.exit(0);
  }, 1000);
});

// Handle generic messages
es.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('📩 Received message:', data);
  } catch (error) {
    console.log('📩 Received message:', event.data);
  }
}); 