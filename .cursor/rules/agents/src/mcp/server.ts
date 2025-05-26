#!/usr/bin/env node

/**
 * Full MCP Server Implementation with CRUD Operations and Logging
 * 
 * This file provides a complete MCP server implementation with detailed logging
 * for all CRUD operations (Create, Read, Update, Delete).
 */

import { IntelligentTaskManagementSystem, SystemConfig } from '../index';
import { LogLevel } from '../utils/Logger';
import { MCPServerConfig } from '../types/MCPTypes';
import { Task, TaskStatus, TaskPriority } from '../types/TaskTypes';

/**
 * Default MCP server configuration
 */
const defaultConfig: MCPServerConfig = {
  name: 'aai-system-enhanced-mcp',
  version: '2.0.0',
  description: 'AAI System Enhanced MCP Server - Intelligent task management for AI models',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  },
  transport: {
    type: 'stdio'
  },
  logging: {
    level: 'info',
    enabled: true
  }
};

/**
 * System configuration for the AAI system
 */
const systemConfig: SystemConfig = {
  api: {
    port: 3000,
    host: 'localhost'
  },
  logging: {
    level: LogLevel.INFO,
    enableConsole: true,
    enableFile: false,
    enableStructured: true
  },
  ai: {
    enabled: true
  },
  automation: {
    enabled: true
  },
  realTime: {
    enabled: true
  }
};

/**
 * Full MCP Server with CRUD Operations and Logging
 */
class FullMCPServer {
  private system: IntelligentTaskManagementSystem;
  private isRunning: boolean = false;

  constructor(system: IntelligentTaskManagementSystem) {
    this.system = system;
  }

  async start(): Promise<void> {
    console.error('🚀 Starting AAI System Enhanced MCP Server...');
    console.error('📡 Starting in MCP Server mode...');
    
    // Initialize and start the system
    await this.system.initialize(systemConfig);
    await this.system.start();
    
    this.isRunning = true;
    
    console.error('✅ AAI MCP Server started successfully');
    console.error('📋 Available tools: 9');
    console.error('📚 Available resources: 2');
    console.error('💡 Available prompts: 2');
    
    // Setup stdio interface for MCP communication
    this.setupStdioInterface();
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.system.stop();
      this.isRunning = false;
      console.error('🛑 AAI MCP Server stopped');
    }
  }

  private setupStdioInterface(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        this.handleInput(chunk.toString().trim());
      }
    });
  }

  private async handleInput(input: string): Promise<void> {
    try {
      const request = JSON.parse(input);
      
      if (request.jsonrpc === '2.0' && request.method === 'tools/call') {
        await this.handleToolCall(request);
      } else {
        this.sendResponse({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendResponse({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${errorMessage}`
        }
      });
    }
  }

  private async handleToolCall(request: any): Promise<void> {
    const { name, arguments: args } = request.params;
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          🚀 Starting operation: ${name}`);
    console.error(`    Context: { operationId: 'MCP_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}' }`);
    
    try {
      let result: any;
      
      switch (name) {
        case 'create_task':
          result = await this.createTask(args);
          break;
        case 'get_task':
          result = await this.getTask(args);
          break;
        case 'update_task':
          result = await this.updateTask(args);
          break;
        case 'list_tasks':
          result = await this.listTasks(args);
          break;
        case 'delete_task':
          result = await this.deleteTask(args);
          break;
        case 'decompose_task':
          result = await this.decomposeTask(args);
          break;
        case 'analyze_complexity':
          result = await this.analyzeComplexity(args);
          break;
        case 'calculate_priority':
          result = await this.calculatePriority(args);
          break;
        case 'get_system_status':
          result = await this.getSystemStatus(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Completed operation: ${name}`);
      console.error(`    Context: { success: true, result: 'operation completed successfully' }`);
      
      this.sendResponse({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toLocaleTimeString()}] ERROR MCP          ❌ Operation failed: ${name}`);
      console.error(`    Error: ${errorMessage}`);
      
      this.sendResponse({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: errorMessage
        }
      });
    }
  }

  private async createTask(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📝 Creating task: ${args.title}`);
    console.error(`    Context: { title: '${args.title}', priority: '${args.priority}', projectId: '${args.projectId}' }`);
    
    const taskData = {
      title: args.title,
      description: args.description || '',
      status: 'pending' as TaskStatus,
      priority: args.priority || 'medium' as TaskPriority,
      projectId: args.projectId || 'default',
      tags: args.tags || [],
      estimatedHours: args.estimatedHours || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const task = await this.system.getTaskManager().createTask(taskData);
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Task created successfully with ID: ${task.id}`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Task activity logged: task_created`);
    console.error(`    Context: { taskId: '${task.id}', operation: 'create', timestamp: '${new Date().toISOString()}' }`);
    
    return {
      success: true,
      task: task,
      message: 'Task created successfully'
    };
  }

  private async getTask(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📖 Retrieving task: ${args.taskId}`);
    console.error(`    Context: { taskId: '${args.taskId}', operation: 'read' }`);
    
    const task = await this.system.getTaskManager().getTask(args.taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${args.taskId}`);
    }
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Task retrieved successfully: ${task.title}`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Task activity logged: task_read`);
    console.error(`    Context: { taskId: '${task.id}', title: '${task.title}', status: '${task.status}' }`);
    
    return {
      success: true,
      task: task,
      message: 'Task retrieved successfully'
    };
  }

  private async updateTask(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📝 Updating task: ${args.taskId}`);
    console.error(`    Context: { taskId: '${args.taskId}', operation: 'update' }`);
    
    const updates = { ...args };
    delete updates.taskId;
    
    const task = await this.system.getTaskManager().updateTask(args.taskId, updates);
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Task updated successfully: ${task.title}`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📝 Task changes applied: ${Object.keys(updates).join(', ')}`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Task activity logged: task_updated`);
    console.error(`    Context: { taskId: '${task.id}', updatedFields: [${Object.keys(updates).map(k => `'${k}'`).join(', ')}] }`);
    
    return {
      success: true,
      task: task,
      message: 'Task updated successfully'
    };
  }

  private async listTasks(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Listing tasks for project: ${args.projectId || 'all'}`);
    console.error(`    Context: { projectId: '${args.projectId || 'all'}', limit: ${args.limit || 10} }`);
    
    const tasks = await this.system.getTaskManager().getTasks({
      projectId: args.projectId,
      limit: args.limit || 10,
      offset: args.offset || 0
    });
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Found ${tasks.length} tasks`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Task activity logged: tasks_listed`);
    console.error(`    Context: { count: ${tasks.length}, projectId: '${args.projectId || 'all'}' }`);
    
    return {
      success: true,
      tasks: tasks,
      count: tasks.length,
      message: 'Tasks retrieved successfully'
    };
  }

  private async deleteTask(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          🗑️ Deleting task: ${args.taskId}`);
    console.error(`    Context: { taskId: '${args.taskId}', operation: 'delete' }`);
    
    const success = await this.system.getTaskManager().deleteTask(args.taskId);
    
    if (!success) {
      throw new Error(`Failed to delete task: ${args.taskId}`);
    }
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Task deleted successfully: ${args.taskId}`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          🗑️ Task removed from system`);
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📋 Task activity logged: task_deleted`);
    console.error(`    Context: { taskId: '${args.taskId}', operation: 'delete', timestamp: '${new Date().toISOString()}' }`);
    
    return {
      success: true,
      taskId: args.taskId,
      message: 'Task deleted successfully'
    };
  }

  private async decomposeTask(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          🧠 Decomposing task: ${args.description}`);
    
    const subtasks = await this.system.getAIDecomposer().decomposeTask({
      description: args.description,
      complexity: args.complexity || 'medium',
      context: args.context || {}
    });
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Task decomposed into ${subtasks.length} subtasks`);
    
    return {
      success: true,
      subtasks: subtasks,
      message: 'Task decomposed successfully'
    };
  }

  private async analyzeComplexity(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          🔍 Analyzing complexity for: ${args.description}`);
    
    const analysis = await this.system.getAIDecomposer().analyzeComplexity(args.description);
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Complexity analysis completed: ${analysis.level}`);
    
    return {
      success: true,
      analysis: analysis,
      message: 'Complexity analysis completed'
    };
  }

  private async calculatePriority(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ⚡ Calculating priority for task`);
    
    const priority = await this.system.getPriorityManager().calculatePriority({
      urgency: args.urgency || 5,
      importance: args.importance || 5,
      effort: args.effort || 5,
      dependencies: args.dependencies || [],
      deadline: args.deadline ? new Date(args.deadline) : undefined
    });
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ Priority calculated: ${priority.level}`);
    
    return {
      success: true,
      priority: priority,
      message: 'Priority calculated successfully'
    };
  }

  private async getSystemStatus(args: any): Promise<any> {
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          📊 Getting system status`);
    
    const health = await this.system.getHealthStatus();
    const metrics = this.system.getMetrics();
    
    console.error(`[${new Date().toLocaleTimeString()}] INFO  MCP          ✅ System status retrieved`);
    
    return {
      success: true,
      health: health,
      metrics: metrics,
      timestamp: new Date().toISOString(),
      message: 'System status retrieved successfully'
    };
  }

  private sendResponse(response: any): void {
    console.log(JSON.stringify(response));
  }
}

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    const system = new IntelligentTaskManagementSystem();
    const server = new FullMCPServer(system);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n🛑 Shutting down MCP server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.error('\n🛑 Shutting down MCP server...');
      await server.stop();
      process.exit(0);
    });
    
    // Start the server
    await server.start();
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { FullMCPServer, defaultConfig, systemConfig }; 