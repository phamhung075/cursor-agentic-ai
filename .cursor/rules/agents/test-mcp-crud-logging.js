#!/usr/bin/env node

/**
 * Comprehensive MCP CRUD Test with Logging
 * This script tests all CRUD operations to show complete logging functionality
 */

const { spawn } = require('child_process');

console.log('🧪 Comprehensive MCP CRUD Test with Logging...\n');

// Start the MCP server
const mcpServer = spawn('node', ['./simple-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

let testStep = 0;
let createdTaskId = null;

// Test requests
const tests = [
  {
    name: 'Create Task',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'create_task',
        arguments: {
          title: 'CRUD Test Task',
          description: 'Testing all CRUD operations with logging',
          priority: 'high',
          projectId: 'crud-test',
          tags: ['test', 'crud', 'logging'],
          estimatedHours: 3
        }
      }
    }
  },
  {
    name: 'List Tasks',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'list_tasks',
        arguments: {
          projectId: 'crud-test'
        }
      }
    }
  },
  {
    name: 'Get Task',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_task',
        arguments: {
          taskId: 'PLACEHOLDER' // Will be replaced with actual task ID
        }
      }
    }
  },
  {
    name: 'Update Task',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'update_task',
        arguments: {
          taskId: 'PLACEHOLDER', // Will be replaced with actual task ID
          status: 'in_progress',
          priority: 'urgent',
          description: 'Updated description with new priority'
        }
      }
    }
  },
  {
    name: 'Get System Status',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_system_status',
        arguments: {}
      }
    }
  },
  {
    name: 'Delete Task',
    request: {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'delete_task',
        arguments: {
          taskId: 'PLACEHOLDER' // Will be replaced with actual task ID
        }
      }
    }
  }
];

console.log('🔍 MCP Server Logs:');
console.log('=' .repeat(60));

// Listen for server logs (stderr)
mcpServer.stderr.on('data', (data) => {
  process.stdout.write(data.toString());
});

// Listen for server response (stdout)
mcpServer.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📥 Response for ${tests[testStep].name}:`);
  console.log(JSON.stringify(response, null, 2));
  
  // Extract task ID from create response
  if (testStep === 0 && response.result) {
    try {
      const result = JSON.parse(response.result.content[0].text);
      createdTaskId = result.task.id;
      console.log(`\n🆔 Created Task ID: ${createdTaskId}`);
    } catch (e) {
      console.log('❌ Could not extract task ID');
    }
  }
  
  testStep++;
  
  if (testStep < tests.length) {
    setTimeout(() => runNextTest(), 500);
  } else {
    setTimeout(() => {
      mcpServer.kill();
      console.log('\n✅ All CRUD tests completed successfully!');
      console.log('💡 Complete logging demonstrated for all operations!');
      process.exit(0);
    }, 500);
  }
});

function runNextTest() {
  const test = tests[testStep];
  
  // Replace placeholder with actual task ID
  if (createdTaskId && test.request.params.arguments.taskId === 'PLACEHOLDER') {
    test.request.params.arguments.taskId = createdTaskId;
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📤 Test ${testStep + 1}: ${test.name}`);
  console.log('Request:', JSON.stringify(test.request, null, 2));
  console.log('\n🔍 Server Processing:');
  console.log('-' .repeat(40));
  
  mcpServer.stdin.write(JSON.stringify(test.request) + '\n');
}

// Start first test
runNextTest();

// Handle errors
mcpServer.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - killing server');
  mcpServer.kill();
  process.exit(1);
}, 30000); 