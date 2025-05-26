/**
 * Intelligent Task Management System
 * 
 * Main entry point for the comprehensive AI-driven task management platform
 * with nested hierarchies, intelligent decomposition, adaptive learning,
 * automation, real-time collaboration, and production-ready deployment.
 * 
 * @version 1.0.0
 * @author AI Task Management Team
 */

// Core Task Management
export * from './core/tasks';

// AI and Learning
export { LearningService } from './core/tasks/LearningService';
export { AdaptiveLearningEngine } from './core/tasks/AdaptiveLearningEngine';

// Automation Engine
export { AutomationEngine, RuleEngine, WorkflowManager, EventProcessor, SchedulingService } from './core/automation';

// Real-time Collaboration
export * from './core/realtime';

// Testing Framework
export { TestRunner, MockServiceRegistry, TestDataRegistry, AssertionRegistry, TestLogger, PerformanceTracker, CoverageCollector } from './core/testing';

// Deployment and Integration
export { IntegrationTestRunner, LoadTestRunner, DeploymentManager } from './core/deployment';

// API System
export { APIServer, createAPIRouter, TaskController, DecompositionController, PriorityController, LearningController, AutomationController, AnalyticsController } from './api';

// All Types
export * from './types';

// Utilities (including Logger)
export * from './utils';

// Import logging utilities
import { Logger, LogLevel, globalLogger, log } from './utils/Logger';

/**
 * Main System Class
 * 
 * Provides a unified interface to initialize and manage the entire
 * intelligent task management system.
 */
export class IntelligentTaskManagementSystem {
  private taskManager: any;
  private aiDecomposer: any;
  private priorityManager: any;
  private learningService: any;
  private automationEngine: any;
  private realTimeSync: any;
  private apiServer: any;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(config?: SystemConfig) {
    // Initialize logger first
    this.logger = Logger.getInstance(config?.logging);
    this.logger.info('SYSTEM', '🎯 Intelligent Task Management System created', { config });
  }

  /**
   * Initialize the entire system
   */
  public async initialize(config?: SystemConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('System is already initialized');
    }

    const operationId = this.logger.startOperation('SYSTEM', 'initialize', { config });
    const startTime = Date.now();

    try {
      this.logger.info('SYSTEM', '🚀 Initializing Intelligent Task Management System...');

      // Initialize core components
      await this.initializeCore(config);
      this.logger.info('SYSTEM', '✅ Core components initialized');
      
      // Initialize AI components
      await this.initializeAI(config);
      this.logger.info('SYSTEM', '✅ AI components initialized');
      
      // Initialize automation
      await this.initializeAutomation(config);
      this.logger.info('SYSTEM', '✅ Automation engine initialized');
      
      // Initialize real-time features
      await this.initializeRealTime(config);
      this.logger.info('SYSTEM', '✅ Real-time features initialized');
      
      // Initialize API server
      await this.initializeAPI(config);
      this.logger.info('SYSTEM', '✅ API server initialized');

      this.isInitialized = true;
      const duration = Date.now() - startTime;
      
      this.logger.endOperation('SYSTEM', operationId, 'initialize', duration, true);
      this.logger.logSystemEvent('system_initialized', { 
        duration, 
        components: ['core', 'ai', 'automation', 'realtime', 'api'] 
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('SYSTEM', operationId, 'initialize', duration, false, error);
      this.logger.error('SYSTEM', '❌ Failed to initialize system', { error });
      throw error;
    }
  }

  /**
   * Start the system
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before starting');
    }

    const operationId = this.logger.startOperation('SYSTEM', 'start');
    const startTime = Date.now();

    try {
      this.logger.info('SYSTEM', '🎯 Starting Intelligent Task Management System...');
      
      // Start API server
      if (this.apiServer) {
        await this.apiServer.start();
        this.logger.info('SYSTEM', '✅ API server started');
      }

      // Start real-time services
      if (this.realTimeSync) {
        await this.realTimeSync.start();
        this.logger.info('SYSTEM', '✅ Real-time services started');
      }

      // Start automation engine
      if (this.automationEngine) {
        await this.automationEngine.start();
        this.logger.info('SYSTEM', '✅ Automation engine started');
      }

      const duration = Date.now() - startTime;
      this.logger.endOperation('SYSTEM', operationId, 'start', duration, true);
      this.logger.logSystemEvent('system_started', { duration });
      this.logger.info('SYSTEM', '🌟 Intelligent Task Management System is now running!');

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('SYSTEM', operationId, 'start', duration, false, error);
      this.logger.error('SYSTEM', '❌ Failed to start system', { error });
      throw error;
    }
  }

  /**
   * Stop the system
   */
  public async stop(): Promise<void> {
    const operationId = this.logger.startOperation('SYSTEM', 'stop');
    const startTime = Date.now();

    try {
      this.logger.info('SYSTEM', '🛑 Stopping Intelligent Task Management System...');
      
      // Stop all services gracefully
      if (this.apiServer) {
        await this.apiServer.stop();
        this.logger.info('SYSTEM', '✅ API server stopped');
      }
      
      if (this.realTimeSync) {
        await this.realTimeSync.stop();
        this.logger.info('SYSTEM', '✅ Real-time services stopped');
      }
      
      if (this.automationEngine) {
        await this.automationEngine.stop();
        this.logger.info('SYSTEM', '✅ Automation engine stopped');
      }

      const duration = Date.now() - startTime;
      this.logger.endOperation('SYSTEM', operationId, 'stop', duration, true);
      this.logger.logSystemEvent('system_stopped', { duration });
      this.logger.info('SYSTEM', '✅ Intelligent Task Management System stopped successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('SYSTEM', operationId, 'stop', duration, false, error);
      this.logger.error('SYSTEM', '❌ Failed to stop system gracefully', { error });
      throw error;
    }
  }

  /**
   * Get system health status
   */
  public async getHealthStatus(): Promise<SystemHealthStatus> {
    this.logger.debug('SYSTEM', '🔍 Checking system health status');
    
    const healthStatus: SystemHealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        taskManager: this.taskManager ? 'healthy' : 'not_initialized',
        aiDecomposer: this.aiDecomposer ? 'healthy' : 'not_initialized',
        priorityManager: this.priorityManager ? 'healthy' : 'not_initialized',
        learningService: this.learningService ? 'healthy' : 'not_initialized',
        automationEngine: this.automationEngine ? 'healthy' : 'not_initialized',
        realTimeSync: this.realTimeSync ? 'healthy' : 'not_initialized',
        apiServer: this.apiServer ? 'healthy' : 'not_initialized'
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    this.logger.logPerformance('SYSTEM', 'uptime', process.uptime(), 'seconds');
    this.logger.logPerformance('SYSTEM', 'memory_usage', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');

    return healthStatus;
  }

  /**
   * Get system metrics
   */
  public getMetrics(): SystemMetrics {
    this.logger.debug('SYSTEM', '📊 Collecting system metrics');
    
    const metrics: SystemMetrics = {
      tasksManaged: this.taskManager?.getTaskCount() || 0,
      aiDecompositions: this.aiDecomposer?.getDecompositionCount() || 0,
      automationRules: this.automationEngine?.getRuleCount() || 0,
      activeConnections: this.realTimeSync?.getConnectionCount() || 0,
      apiRequests: this.apiServer?.getRequestCount() || 0,
      learningAccuracy: this.learningService?.getAccuracy() || 0
    };

    // Log key metrics
    Object.entries(metrics).forEach(([key, value]) => {
      this.logger.logPerformance('SYSTEM', key, value as number, 'count');
    });

    return metrics;
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count: number = 100): any[] {
    return this.logger.getRecentLogs(count);
  }

  /**
   * Get logs by component
   */
  public getLogsByComponent(component: string, count: number = 100): any[] {
    return this.logger.getLogsByComponent(component, count);
  }

  /**
   * Update logging configuration
   */
  public updateLoggingConfig(config: any): void {
    this.logger.updateConfig(config);
    this.logger.info('SYSTEM', '⚙️ Logging configuration updated', { config });
  }

  /**
   * Get core components (for MCP server access)
   */
  public getTaskManager(): any {
    return this.taskManager;
  }

  public getAIDecomposer(): any {
    return this.aiDecomposer;
  }

  public getPriorityManager(): any {
    return this.priorityManager;
  }

  public getLearningService(): any {
    return this.learningService;
  }

  public getAutomationEngine(): any {
    return this.automationEngine;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  // Private initialization methods
  private async initializeCore(config?: SystemConfig): Promise<void> {
    const operationId = this.logger.startOperation('CORE', 'initialize');
    const startTime = Date.now();

    try {
      const { TaskManager, AITaskDecomposer, DynamicPriorityManager } = await import('./core/tasks');
      
      this.taskManager = new TaskManager();
      this.aiDecomposer = new AITaskDecomposer();
      this.priorityManager = new DynamicPriorityManager();

      const duration = Date.now() - startTime;
      this.logger.endOperation('CORE', operationId, 'initialize', duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('CORE', operationId, 'initialize', duration, false, error);
      throw error;
    }
  }

  private async initializeAI(config?: SystemConfig): Promise<void> {
    const operationId = this.logger.startOperation('AI', 'initialize');
    const startTime = Date.now();

    try {
      const { LearningService } = await import('./core/tasks/LearningService');
      
      this.learningService = new LearningService(this.taskManager);

      const duration = Date.now() - startTime;
      this.logger.endOperation('AI', operationId, 'initialize', duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('AI', operationId, 'initialize', duration, false, error);
      throw error;
    }
  }

  private async initializeAutomation(config?: SystemConfig): Promise<void> {
    const operationId = this.logger.startOperation('AUTOMATION', 'initialize');
    const startTime = Date.now();

    try {
      const { AutomationEngine } = await import('./core/automation');
      
      this.automationEngine = new AutomationEngine(
        this.taskManager,
        this.learningService,
        this.priorityManager,
        this.aiDecomposer,
        {} // Empty config object for the 5th parameter
      );

      const duration = Date.now() - startTime;
      this.logger.endOperation('AUTOMATION', operationId, 'initialize', duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('AUTOMATION', operationId, 'initialize', duration, false, error);
      throw error;
    }
  }

  private async initializeRealTime(config?: SystemConfig): Promise<void> {
    const operationId = this.logger.startOperation('REALTIME', 'initialize');
    const startTime = Date.now();

    try {
      const { SynchronizationService, WebSocketManager } = await import('./core/realtime');
      const { Server: SocketIOServer } = await import('socket.io');
      const { createServer } = await import('http');
      
      // Create HTTP server for WebSocket
      const httpServer = createServer();
      const io = new SocketIOServer(httpServer, {
        cors: { origin: '*', credentials: false }
      });
      
      // Create RealTime configuration
      const realTimeConfig = {
        enabled: true,
        websocket: {
          port: 3001,
          path: '/ws',
          cors: { origin: '*', credentials: false },
          pingTimeout: 60000,
          pingInterval: 25000,
          maxConnections: 1000
        },
        events: {
          maxRetries: 3,
          retryDelay: 1000,
          batchSize: 100,
          flushInterval: 5000
        },
        presence: {
          enabled: true,
          heartbeatInterval: 30000,
          timeoutThreshold: 60000
        },
        conflicts: {
          detectionEnabled: true,
          autoResolve: true,
          resolutionTimeout: 30000
        },
        dashboard: {
          updateInterval: 5000,
          metricsRetention: 86400000,
          maxEvents: 1000
        }
      };
      
      // Create WebSocket manager
      const webSocketManager = new WebSocketManager(io, realTimeConfig);
      
      this.realTimeSync = new SynchronizationService(
        realTimeConfig,
        this.taskManager,
        this.learningService,
        this.automationEngine,
        webSocketManager
      );

      const duration = Date.now() - startTime;
      this.logger.endOperation('REALTIME', operationId, 'initialize', duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('REALTIME', operationId, 'initialize', duration, false, error);
      throw error;
    }
  }

  private async initializeAPI(config?: SystemConfig): Promise<void> {
    const operationId = this.logger.startOperation('API', 'initialize');
    const startTime = Date.now();

    try {
      const { APIServer } = await import('./api');
      
      this.apiServer = new APIServer(
        {
          port: config?.api?.port || 3000,
          host: config?.api?.host || 'localhost',
          cors: { origin: '*', credentials: false },
          rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
          auth: { enabled: false },
          validation: { strict: false, stripUnknown: true },
          logging: { 
            level: 'info',
            requests: true,
            responses: false
          },
          websocket: { enabled: true, path: '/ws' }
        },
        this.taskManager,
        this.learningService,
        this.priorityManager,
        this.aiDecomposer,
        this.automationEngine
      );

      const duration = Date.now() - startTime;
      this.logger.endOperation('API', operationId, 'initialize', duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.endOperation('API', operationId, 'initialize', duration, false, error);
      throw error;
    }
  }
}

/**
 * Configuration interfaces
 */
export interface SystemConfig {
  api?: {
    port?: number;
    host?: string;
  };
  database?: {
    url?: string;
  };
  ai?: {
    enabled?: boolean;
  };
  automation?: {
    enabled?: boolean;
  };
  realTime?: {
    enabled?: boolean;
  };
  logging?: {
    level?: LogLevel;
    enableConsole?: boolean;
    enableFile?: boolean;
    filePath?: string;
    enableStructured?: boolean;
    includeStackTrace?: boolean;
  };
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: Record<string, string>;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

export interface SystemMetrics {
  tasksManaged: number;
  aiDecompositions: number;
  automationRules: number;
  activeConnections: number;
  apiRequests: number;
  learningAccuracy: number;
}

/**
 * Convenience function to create and initialize the system
 */
export async function createIntelligentTaskManagementSystem(config?: SystemConfig): Promise<IntelligentTaskManagementSystem> {
  log.system('system_creation_requested', { config });
  
  const system = new IntelligentTaskManagementSystem(config);
  await system.initialize(config);
  
  log.system('system_created_successfully');
  return system;
}

/**
 * Quick start function for development
 */
export async function quickStart(config?: SystemConfig): Promise<IntelligentTaskManagementSystem> {
  log.system('quick_start_requested', { config });
  
  const system = await createIntelligentTaskManagementSystem(config);
  await system.start();
  
  log.system('quick_start_completed');
  return system;
}

// Default export
export default IntelligentTaskManagementSystem;

/**
 * Main execution block - runs when this file is executed directly
 */
async function main() {
  try {
    // Check for mode from environment variable or command line argument
    const mode = process.env['AAI_MODE'] || process.argv[2] || 'api';
    
    console.log(`🚀 Starting AAI System Enhanced in ${mode.toUpperCase()} mode...`);

    // Default system configuration
    const systemConfig: SystemConfig = {
      api: {
        port: parseInt(process.env['PORT'] || '3000'),
        host: process.env['HOST'] || 'localhost'
      },
      logging: {
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: false,
        enableStructured: true
      },
      ai: { enabled: true },
      automation: { enabled: true },
      realTime: { enabled: true }
    };

    if (mode === 'mcp') {
      // MCP Server mode
      console.log('📡 Starting in MCP Server mode...');
      
      try {
        // Try to use the full MCP server implementation
        const { AAIMCPServer } = await import('./mcp/MCPServer');
        const MCPTypes = await import('./types/MCPTypes');
        
        // Create system instance
        const system = new IntelligentTaskManagementSystem(systemConfig);
        await system.initialize(systemConfig);
        
        // MCP server configuration
        const mcpConfig = {
          name: 'aai-system-enhanced-mcp',
          version: '2.0.0',
          description: 'AAI System Enhanced MCP Server',
          capabilities: {
            tools: true,
            resources: true,
            prompts: true
          },
          transport: {
            type: 'stdio' as const
          },
          logging: {
            level: 'info' as const,
            enabled: true
          }
        };
        
        // Create and start MCP server
        const mcpServer = new AAIMCPServer(
          mcpConfig,
          system.getTaskManager(),
          system.getAIDecomposer(),
          system.getPriorityManager(),
          system.getLearningService(),
          system.getAutomationEngine(),
          system.getLogger()
        );
        
        await mcpServer.start();
        console.log('✅ AAI MCP Server started successfully');
        
      } catch (mcpError) {
        // Fallback to simplified MCP server
        console.log('⚠️ Full MCP server unavailable, using simplified version...');
        const { startMCPServer } = await import('./mcp/server');
        await startMCPServer();
      }
      
    } else {
      // Default API mode
      console.log('🌐 Starting in API Server mode...');
      
      const system = await quickStart(systemConfig);
      
      console.log('✅ AAI System Enhanced started successfully');
      console.log(`📡 API Server: http://${systemConfig.api?.host}:${systemConfig.api?.port}`);
      console.log('📊 Health Status: /api/health');
      console.log('📈 Metrics: /api/metrics');
      console.log('📋 Tasks API: /api/tasks');
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down AAI System Enhanced...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down AAI System Enhanced...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start AAI System Enhanced:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 