#!/usr/bin/env node

/**
 * MCP Test Requests Generator
 * Generates JSON requests to test CRUD operations on your live MCP server
 */

console.log('🧪 MCP CRUD Test Requests for Your Live Server\n');
console.log('📋 Copy and paste these JSON requests into your MCP server terminal:\n');

const requests = [
  {
    name: '1. CREATE TASK',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'create_task',
        arguments: {
          title: 'Live MCP Test Task',
          description: 'Testing CRUD operations on live MCP server',
          priority: 'high',
          projectId: 'live-test-project',
          tags: ['live', 'test', 'mcp'],
          estimatedHours: 2
        }
      }
    }
  },
  {
    name: '2. LIST TASKS',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'list_tasks',
        arguments: {
          projectId: 'live-test-project',
          limit: 10
        }
      }
    }
  },
  {
    name: '3. GET SYSTEM STATUS',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_system_status',
        arguments: {}
      }
    }
  },
  {
    name: '4. UPDATE TASK (use task ID from step 1)',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'update_task',
        arguments: {
          taskId: 'REPLACE_WITH_TASK_ID_FROM_STEP_1',
          status: 'in_progress',
          priority: 'urgent',
          description: 'Updated task description - now in progress!'
        }
      }
    }
  },
  {
    name: '5. GET SPECIFIC TASK (use task ID from step 1)',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_task',
        arguments: {
          taskId: 'REPLACE_WITH_TASK_ID_FROM_STEP_1'
        }
      }
    }
  },
  {
    name: '6. DELETE TASK (use task ID from step 1)',
    request: {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'delete_task',
        arguments: {
          taskId: 'REPLACE_WITH_TASK_ID_FROM_STEP_1'
        }
      }
    }
  }
];

requests.forEach((test, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${test.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(JSON.stringify(test.request, null, 2));
  
  if (index < requests.length - 1) {
    console.log('\n💡 After sending this request, check your MCP server logs!');
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('📝 INSTRUCTIONS:');
console.log(`${'='.repeat(60)}`);
console.log('1. Copy each JSON request above');
console.log('2. Paste it into your MCP server terminal (where it shows the cursor)');
console.log('3. Press Enter to send the request');
console.log('4. Watch the detailed logging output!');
console.log('5. For steps 4-6, replace "REPLACE_WITH_TASK_ID_FROM_STEP_1" with the actual task ID from step 1');
console.log('\n🎯 You should see detailed logs for each operation in your MCP server terminal!');
console.log('📋 Each request will trigger comprehensive logging showing the CRUD operations.'); 