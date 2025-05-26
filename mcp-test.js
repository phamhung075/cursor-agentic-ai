#!/usr/bin/env node

/**
 * MCP CRUD Test Instructions
 * 
 * Your MCP server is running. Here are the JSON requests to test CRUD operations.
 */

console.log('🧪 MCP CRUD Test Suite');
console.log('📡 Your MCP server is running. Test it with these JSON requests:');
console.log('');

// Test 1: Create Task
console.log('1. 📝 CREATE TASK:');
console.log('Copy and paste this into your MCP server terminal:');
console.log('');
console.log(JSON.stringify({
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
}, null, 2));

console.log('');
console.log('2. 📖 GET TASK (replace TASK_ID with ID from create response):');
console.log(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'get_task',
    arguments: {
      taskId: 'TASK_ID_FROM_CREATE_RESPONSE'
    }
  }
}, null, 2));

console.log('');
console.log('3. 📝 UPDATE TASK (replace TASK_ID with ID from create response):');
console.log(JSON.stringify({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'update_task',
    arguments: {
      taskId: 'TASK_ID_FROM_CREATE_RESPONSE',
      status: 'in_progress',
      description: 'Updated description - Task is now in progress for MCP testing',
      tags: ['test', 'mcp', 'crud', 'updated']
    }
  }
}, null, 2));

console.log('');
console.log('4. 📋 LIST TASKS:');
console.log(JSON.stringify({
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
}, null, 2));

console.log('');
console.log('5. 🗑️ DELETE TASK (replace TASK_ID with ID from create response):');
console.log(JSON.stringify({
  jsonrpc: '2.0',
  id: 5,
  method: 'tools/call',
  params: {
    name: 'delete_task',
    arguments: {
      taskId: 'TASK_ID_FROM_CREATE_RESPONSE'
    }
  }
}, null, 2));

console.log('');
console.log('🔍 What to Look For in MCP Server Logs:');
console.log('- 📝 Task creation logs');
console.log('- 📝 Task update logs');
console.log('- 🗑️ Task deletion logs');
console.log('- 🚀 Operation start logs');
console.log('- ✅ Operation completion logs');
console.log('- 📋 Task activity logs');
console.log('');
console.log('💡 Instructions:');
console.log('1. Copy each JSON request above');
console.log('2. Paste into your MCP server terminal');
console.log('3. Press Enter to send');
console.log('4. Check server logs for detailed logging output'); 