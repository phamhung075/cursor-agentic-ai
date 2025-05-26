#!/usr/bin/env node

/**
 * Standalone MCP Server Entry Point
 * 
 * This file provides a standalone entry point for running the AAI System Enhanced
 * as an MCP server. It can be used by AI models to interact with the task management system.
 */

import { IntelligentTaskManagementSystem, SystemConfig } from '../index';
import { LogLevel } from '../utils/Logger';
import { MCPServerConfig } from '../types/MCPTypes';

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
    type: 'stdio' // Default to stdio for MCP compatibility
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
 * Simple MCP-like server implementation
 * 
 * This is a simplified implementation that provides MCP-like functionality
 * without requiring the full MCP SDK until it's properly installed.
 */
class SimpleMCPServer {
  private system: IntelligentTaskManagementSystem;
  private isRunning: boolean = false;

  constructor(system: IntelligentTaskManagementSystem) {
    this.system = system;
  }

  async start(): Promise<void> {
    console.error('🚀 Starting AAI System Enhanced MCP-like Server...');
    
    // Initialize and start the system
    await this.system.initialize(systemConfig);
    await this.system.start();
    
    this.isRunning = true;
    
    console.error('✅ AAI MCP-like Server is ready');
    console.error('📋 Available capabilities:');
    console.error('   - Task Management: ✅');
    console.error('   - AI Decomposition: ✅');
    console.error('   - Priority Management: ✅');
    console.error('   - Automation Engine: ✅');
    console.error('   - Learning Service: ✅');
    console.error('   - Real-time Sync: ✅');
    console.error('   - REST API: ✅');
    
    // Setup basic stdio interface for MCP-like communication
    this.setupStdioInterface();
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.system.stop();
      this.isRunning = false;
      console.error('🛑 AAI MCP-like Server stopped');
    }
  }

  private setupStdioInterface(): void {
    // Basic stdio interface for MCP-like communication
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        this.handleInput(chunk.toString().trim());
      }
    });

    // Send initial capabilities message
    this.sendMessage({
      type: 'capabilities',
      capabilities: {
        tools: [
          'task_management',
          'ai_decomposition', 
          'priority_management',
          'automation',
          'learning',
          'analytics'
        ],
        resources: [
          'tasks',
          'projects',
          'automation_rules'
        ],
        prompts: [
          'task_analysis',
          'priority_assessment'
        ]
      }
    });
  }

  private async handleInput(input: string): Promise<void> {
    try {
      const message = JSON.parse(input);
      
      switch (message.type) {
        case 'ping':
          this.sendMessage({ type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'status':
          const health = await this.system.getHealthStatus();
          const metrics = this.system.getMetrics();
          this.sendMessage({
            type: 'status_response',
            health,
            metrics,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'capabilities':
          this.sendMessage({
            type: 'capabilities_response',
            capabilities: {
              name: defaultConfig.name,
              version: defaultConfig.version,
              description: defaultConfig.description,
              tools: ['task_management', 'ai_decomposition', 'priority_management'],
              resources: ['tasks', 'projects'],
              prompts: ['task_analysis', 'priority_assessment']
            }
          });
          break;
          
        default:
          this.sendMessage({
            type: 'error',
            message: `Unknown message type: ${message.type}`,
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendMessage({
        type: 'error',
        message: `Failed to parse input: ${errorMessage}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private sendMessage(message: any): void {
    console.log(JSON.stringify(message));
  }
}

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    console.error('🚀 Starting AAI System Enhanced MCP Server...');

    // Initialize the main system
    const system = new IntelligentTaskManagementSystem(systemConfig);

    // Create simplified MCP server
    const mcpServer = new SimpleMCPServer(system);

    // Start the server
    await mcpServer.start();

    console.error('✅ AAI MCP Server is ready for connections');
    console.error('💡 Send JSON messages via stdin to interact with the system');
    console.error('📖 Example: {"type": "ping"} or {"type": "status"}');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n🛑 Shutting down MCP server...');
      await mcpServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('\n🛑 Shutting down MCP server...');
      await mcpServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as startMCPServer }; 