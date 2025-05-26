#!/usr/bin/env node

/**
 * MCP CRUD Test Client
 * 
 * Tests CRUD operations on the running MCP server
 */

const { spawn } = require('child_process');

class MCPTestClient {
  constructor() {
    this.testResults = [];
  }

  /**
   * Send request to MCP server
   */
  async sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      // Spawn the MCP server process to communicate with it
      const mcpClient = spawn('npm', ['start'], {
        env: { ...process.env, AAI_MODE: 'mcp' },
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
      };

      console.log('📤 Sending:', JSON.stringify(request, null, 2));

      let responseData = '';
      const timeout = setTimeout(() => {
        mcpClient.kill();
        reject(new Error('Request timeout'));
      }, 10000);

      mcpClient.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📥 Server output:', output);
        
        // Look for JSON response
        try {
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              const response = JSON.parse(line.trim());
              if (response.jsonrpc === '2.0' && response.id === request.id) {
                clearTimeout(timeout);
                mcpClient.kill();
                resolve(response);
                return;
              }
            }
          }
        } catch (e) {
          // Continue waiting
        }
      });

      mcpClient.stderr.on('data', (data) => {
        console.log('📥 Server stderr:', data.toString());
      });

      mcpClient.on('close', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`MCP process exited with code ${code}`));
        }
      });

      // Send the request
      mcpClient.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Test Create Task
   */
  async testCreateTask() {
    console.log('\n📝 Test 1: Creating a task...');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'create_task',
        arguments: {
          title: 'Test Task - MCP CRUD Verification',
          description: 'This is a test task to verify MCP server CRUD operations and logging',
          priority: 'medium',
          projectId: 'test-project',
          tags: ['test', 'mcp', 'crud'],
          estimatedHours: 2
        }
      });

      if (response.result && response.result.content) {
        const taskData = JSON.parse(response.result.content[0].text);
        const taskId = taskData.task.id;
        console.log(`✅ Task created successfully with ID: ${taskId}`);
        
        this.testResults.push({
          test: 'create_task',
          status: 'success',
          taskId: taskId
        });
        
        return taskId;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Failed to create task:', error.message);
      this.testResults.push({
        test: 'create_task',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test Update Task
   */
  async testUpdateTask(taskId) {
    console.log('\n📝 Test 2: Updating the task...');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'update_task',
        arguments: {
          taskId: taskId,
          status: 'in_progress',
          description: 'Updated description - Task is now in progress for MCP testing',
          tags: ['test', 'mcp', 'crud', 'updated']
        }
      });

      console.log('✅ Task updated successfully');
      this.testResults.push({
        test: 'update_task',
        status: 'success',
        taskId: taskId
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to update task:', error.message);
      this.testResults.push({
        test: 'update_task',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test Get Task
   */
  async testGetTask(taskId) {
    console.log('\n📖 Test 3: Reading the task...');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'get_task',
        arguments: {
          taskId: taskId
        }
      });

      console.log('✅ Task retrieved successfully');
      this.testResults.push({
        test: 'get_task',
        status: 'success',
        taskId: taskId
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get task:', error.message);
      this.testResults.push({
        test: 'get_task',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test List Tasks
   */
  async testListTasks() {
    console.log('\n📋 Test 4: Listing tasks...');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'list_tasks',
        arguments: {
          projectId: 'test-project',
          limit: 10
        }
      });

      console.log('✅ Tasks listed successfully');
      this.testResults.push({
        test: 'list_tasks',
        status: 'success'
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to list tasks:', error.message);
      this.testResults.push({
        test: 'list_tasks',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test Delete Task
   */
  async testDeleteTask(taskId) {
    console.log('\n🗑️ Test 5: Deleting the task...');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'delete_task',
        arguments: {
          taskId: taskId
        }
      });

      console.log('✅ Task deleted successfully');
      this.testResults.push({
        test: 'delete_task',
        status: 'success',
        taskId: taskId
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to delete task:', error.message);
      this.testResults.push({
        test: 'delete_task',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Run all CRUD tests
   */
  async runAllTests() {
    console.log('🧪 Starting MCP CRUD Tests...\n');
    console.log('📡 Testing against running MCP server...\n');
    
    try {
      // Run tests in sequence
      const taskId = await this.testCreateTask();
      await this.testGetTask(taskId);
      await this.testUpdateTask(taskId);
      await this.testListTasks();
      await this.testDeleteTask(taskId);
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('🚨 Test suite failed:', error.message);
      this.printTestResults();
    }
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      
      if (result.status === 'success') {
        passed++;
      } else {
        failed++;
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('🎉 All CRUD tests passed! MCP server is working correctly.');
      console.log('📋 Check the MCP server logs to see the logging output.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs for details.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MCPTestClient();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted by user');
    process.exit(0);
  });
  
  // Run the tests
  tester.runAllTests().catch((error) => {
    console.error('🚨 Test suite error:', error);
    process.exit(1);
  });
}

module.exports = MCPTestClient; 