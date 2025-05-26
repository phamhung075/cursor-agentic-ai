#!/usr/bin/env node

/**
 * Direct MCP Test
 * 
 * Send direct JSON-RPC requests to test CRUD operations
 * Run this while your MCP server is running in another terminal
 */

console.log('🧪 MCP CRUD Test Suite');
console.log('📡 Make sure your MCP server is running with: AAI_MODE=mcp npm start');
console.log('');

// Test requests to send to your MCP server
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
          title: 'Test Task - MCP CRUD Verification',
          description: 'This is a test task to verify MCP server CRUD operations and logging',
          priority: 'medium',
          projectId: 'test-project',
          tags: ['test', 'mcp', 'crud'],
          estimatedHours: 2
        }
      }
    }
  },
  {
    name: 'Get Task',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_task',
        arguments: {
          taskId: 'TASK_ID_PLACEHOLDER'
        }
      }
    }
  },
  {
    name: 'Update Task',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'update_task',
        arguments: {
          taskId: 'TASK_ID_PLACEHOLDER',
          status: 'in_progress',
          description: 'Updated description - Task is now in progress for MCP testing',
          tags: ['test', 'mcp', 'crud', 'updated']
        }
      }
    }
  },
  {
    name: 'List Tasks',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_tasks',
        arguments: {
          projectId: 'test-project',
          limit: 10
        }
      }
    }
  },
  {
    name: 'Delete Task',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'delete_task',
        arguments: {
          taskId: 'TASK_ID_PLACEHOLDER'
        }
      }
    }
  }
];

console.log('📋 Test Requests to Send to Your MCP Server:');
console.log('=' .repeat(60));

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}:`);
  console.log('📤 Request:');
  console.log(JSON.stringify(test.request, null, 2));
  console.log('');
});

console.log('=' .repeat(60));
console.log('');
console.log('📝 Instructions:');
console.log('1. Copy each JSON request above');
console.log('2. Paste it into your MCP server terminal (where it\'s running)');
console.log('3. Press Enter to send the request');
console.log('4. Check the server logs for task creation/update/delete logging');
console.log('5. For Get/Update/Delete tasks, replace TASK_ID_PLACEHOLDER with the actual task ID from the Create response');
console.log('');
console.log('🔍 What to Look For:');
console.log('- Task creation logs with 📝 emoji');
console.log('- Task update logs with 📝 emoji');
console.log('- Task deletion logs with 🗑️ emoji');
console.log('- Operation start/end logs with 🚀/✅ emojis');
console.log('- Task activity logs with 📋 emoji');
console.log('');
console.log('💡 Example workflow:');
console.log('1. Send Create Task request → Get task ID from response');
console.log('2. Replace TASK_ID_PLACEHOLDER in other requests with actual ID');
console.log('3. Send Get Task, Update Task, List Tasks, Delete Task requests');
console.log('4. Observe logging output in MCP server terminal');

// Also create a simple curl command version
console.log('');
console.log('🌐 Alternative: If your MCP server supports HTTP, you can also test with curl:');
console.log('');
console.log('# Create Task');
console.log('echo \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_task","arguments":{"title":"Test Task","description":"Test description","priority":"medium","projectId":"test-project","tags":["test"],"estimatedHours":2}}}\' | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:3000/mcp');
console.log('');
console.log('📋 Check your MCP server logs to see the detailed logging for each operation!'); 