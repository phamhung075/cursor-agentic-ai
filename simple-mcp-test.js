#!/usr/bin/env node

/**
 * Simple MCP CRUD Test
 * 
 * Tests the running MCP server by sending JSON-RPC requests via stdio
 */

const readline = require('readline');

// Create interface for reading from stdin and writing to stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let requestId = 1;

/**
 * Send MCP request and wait for response
 */
function sendMCPRequest(method, params) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method: method,
      params: params
    };

    console.log('\n📤 Sending request:', JSON.stringify(request, null, 2));
    
    // Send request to MCP server (assuming it's listening on stdio)
    process.stdout.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    const onData = (data) => {
      try {
        const response = JSON.parse(data.toString());
        clearTimeout(timeout);
        process.stdin.off('data', onData);
        console.log('📥 Received response:', JSON.stringify(response, null, 2));
        resolve(response);
      } catch (e) {
        // Continue waiting for valid JSON
      }
    };

    process.stdin.on('data', onData);
  });
}

/**
 * Test CRUD operations
 */
async function testCRUDOperations() {
  console.log('🧪 Starting MCP CRUD Tests...\n');
  
  try {
    // Test 1: Create Task
    console.log('📝 Test 1: Creating a task...');
    const createResponse = await sendMCPRequest('tools/call', {
      name: 'create_task',
      arguments: {
        title: 'Test Task - MCP CRUD Verification',
        description: 'This is a test task to verify MCP server CRUD operations',
        priority: 'medium',
        projectId: 'test-project',
        tags: ['test', 'mcp', 'crud'],
        estimatedHours: 2
      }
    });
    
    // Extract task ID
    const taskData = JSON.parse(createResponse.result.content[0].text);
    const taskId = taskData.task.id;
    console.log(`✅ Task created with ID: ${taskId}`);

    // Test 2: Get Task
    console.log('\n📖 Test 2: Reading the task...');
    await sendMCPRequest('tools/call', {
      name: 'get_task',
      arguments: {
        taskId: taskId
      }
    });
    console.log('✅ Task retrieved successfully');

    // Test 3: Update Task
    console.log('\n📝 Test 3: Updating the task...');
    await sendMCPRequest('tools/call', {
      name: 'update_task',
      arguments: {
        taskId: taskId,
        status: 'in_progress',
        description: 'Updated description - Task is now in progress',
        tags: ['test', 'mcp', 'crud', 'updated']
      }
    });
    console.log('✅ Task updated successfully');

    // Test 4: List Tasks
    console.log('\n📋 Test 4: Listing tasks...');
    await sendMCPRequest('tools/call', {
      name: 'list_tasks',
      arguments: {
        projectId: 'test-project',
        limit: 10
      }
    });
    console.log('✅ Tasks listed successfully');

    // Test 5: Delete Task
    console.log('\n🗑️ Test 5: Deleting the task...');
    await sendMCPRequest('tools/call', {
      name: 'delete_task',
      arguments: {
        taskId: taskId
      }
    });
    console.log('✅ Task deleted successfully');

    console.log('\n🎉 All CRUD tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

// Start tests
testCRUDOperations(); 