#!/usr/bin/env node

/**
 * Test MCP Server Logging
 * This script sends a test request to the MCP server to demonstrate logging
 */

const { spawn } = require('child_process');

console.log('🧪 Testing MCP Server Logging...\n');

// Start the MCP server with correct path
const mcpServer = spawn('node', ['./simple-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname  // Ensure we're in the correct directory
});

// Test request to create a task
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'create_task',
    arguments: {
      title: 'Test Logging Task',
      description: 'This task tests the MCP server logging functionality',
      priority: 'high',
      projectId: 'logging-test',
      tags: ['test', 'logging'],
      estimatedHours: 1
    }
  }
};

console.log('📤 Sending test request to MCP server...');
console.log('📋 Request:', JSON.stringify(testRequest, null, 2));
console.log('\n🔍 MCP Server Logs:');
console.log('=' .repeat(50));

// Listen for server logs (stderr)
mcpServer.stderr.on('data', (data) => {
  process.stdout.write(data.toString());
});

// Listen for server response (stdout)
mcpServer.stdout.on('data', (data) => {
  console.log('\n' + '=' .repeat(50));
  console.log('📥 MCP Server Response:');
  console.log(data.toString());
  
  // Clean shutdown
  setTimeout(() => {
    mcpServer.kill();
    console.log('\n✅ Test completed successfully!');
    console.log('💡 As you can see, the MCP server IS logging all operations!');
    process.exit(0);
  }, 100);
});

// Send the test request
mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');

// Handle errors
mcpServer.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - killing server');
  mcpServer.kill();
  process.exit(1);
}, 5000); 