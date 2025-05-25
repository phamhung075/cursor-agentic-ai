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
  private isInitialized: boolean = false;

  constructor(config?: SystemConfig) {
    // System will be initialized with provided configuration
  }

  /**
   * Initialize the entire system
   */
  public async initialize(config?: SystemConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('System is already initialized');
    }

    console.log('🚀 Initializing Intelligent Task Management System...');

    try {
      // Initialize core components
      await this.initializeCore(config);
      
      // Initialize AI components
      await this.initializeAI(config);
      
      // Initialize automation
      await this.initializeAutomation(config);
      
      // Initialize real-time features
      await this.initializeRealTime(config);
      
      // Initialize API server
      await this.initializeAPI(config);

      this.isInitialized = true;
      console.log('✅ Intelligent Task Management System initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize system:', error);
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

    console.log('🎯 Starting Intelligent Task Management System...');
    
    // Start API server
    if (this.apiServer) {
      await this.apiServer.start();
    }

    // Start real-time services
    if (this.realTimeSync) {
      await this.realTimeSync.start();
    }

    // Start automation engine
    if (this.automationEngine) {
      await this.automationEngine.start();
    }

    console.log('🌟 Intelligent Task Management System is now running!');
  }

  /**
   * Stop the system
   */
  public async stop(): Promise<void> {
    console.log('🛑 Stopping Intelligent Task Management System...');
    
    // Stop all services gracefully
    if (this.apiServer) {
      await this.apiServer.stop();
    }
    
    if (this.realTimeSync) {
      await this.realTimeSync.stop();
    }
    
    if (this.automationEngine) {
      await this.automationEngine.stop();
    }

    console.log('✅ Intelligent Task Management System stopped successfully');
  }

  /**
   * Get system health status
   */
  public async getHealthStatus(): Promise<SystemHealthStatus> {
    return {
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
  }

  /**
   * Get system metrics
   */
  public getMetrics(): SystemMetrics {
    return {
      tasksManaged: this.taskManager?.getTaskCount() || 0,
      aiDecompositions: this.aiDecomposer?.getDecompositionCount() || 0,
      automationRules: this.automationEngine?.getRuleCount() || 0,
      activeConnections: this.realTimeSync?.getConnectionCount() || 0,
      apiRequests: this.apiServer?.getRequestCount() || 0,
      learningAccuracy: this.learningService?.getAccuracy() || 0
    };
  }

  // Private initialization methods
  private async initializeCore(config?: SystemConfig): Promise<void> {
    const { TaskManager, AITaskDecomposer, DynamicPriorityManager } = await import('./core/tasks');
    
    this.taskManager = new TaskManager();
    this.aiDecomposer = new AITaskDecomposer();
    this.priorityManager = new DynamicPriorityManager();
  }

  private async initializeAI(config?: SystemConfig): Promise<void> {
    const { LearningService } = await import('./core/tasks/LearningService');
    
    this.learningService = new LearningService(this.taskManager);
  }

  private async initializeAutomation(config?: SystemConfig): Promise<void> {
    const { AutomationEngine } = await import('./core/automation');
    
    this.automationEngine = new AutomationEngine(
      this.taskManager,
      this.learningService,
      this.priorityManager,
      this.aiDecomposer
    );
  }

  private async initializeRealTime(config?: SystemConfig): Promise<void> {
    const { SynchronizationService } = await import('./core/realtime');
    
    this.realTimeSync = new SynchronizationService(
      this.taskManager
    );
  }

  private async initializeAPI(config?: SystemConfig): Promise<void> {
    const { APIServer } = await import('./api');
    
    this.apiServer = new APIServer({
      port: config?.api?.port || 3000,
      host: config?.api?.host || 'localhost'
    });
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
  const system = new IntelligentTaskManagementSystem(config);
  await system.initialize(config);
  return system;
}

/**
 * Quick start function for development
 */
export async function quickStart(config?: SystemConfig): Promise<IntelligentTaskManagementSystem> {
  const system = await createIntelligentTaskManagementSystem(config);
  await system.start();
  return system;
}

// Default export
export default IntelligentTaskManagementSystem; 