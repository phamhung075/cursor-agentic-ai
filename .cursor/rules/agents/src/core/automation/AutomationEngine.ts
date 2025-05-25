import { EventEmitter } from 'events';
import { TaskManager } from '../tasks/TaskManager';
import { LearningService } from '../tasks/LearningService';
import { DynamicPriorityManager } from '../tasks/DynamicPriorityManager';
import { AITaskDecomposer } from '../tasks/AITaskDecomposer';
import { RuleEngine } from './RuleEngine';
import { WorkflowManager } from './WorkflowManager';
import { EventProcessor } from './EventProcessor';
import { SchedulingService } from './SchedulingService';
import { NotificationService } from './NotificationService';
import { 
  AutomationConfig,
  AutomationRule,
  Workflow,
  AutomationEvent,
  AutomationExecutionResult,
  AutomationMetrics,
  AutomationInsight,
  SmartSchedulingConfig
} from '../../types/AutomationTypes';
import { Task, TaskOperationResult } from '../../types/TaskTypes';

/**
 * Automation Engine
 * 
 * Core orchestration engine that provides intelligent automation capabilities
 * for task management, workflow execution, and system optimization.
 */
export class AutomationEngine extends EventEmitter {
  private taskManager: TaskManager;
  private learningService: LearningService;
  private priorityManager: DynamicPriorityManager;
  private taskDecomposer: AITaskDecomposer;
  
  private ruleEngine: RuleEngine;
  private workflowManager: WorkflowManager;
  private eventProcessor: EventProcessor;
  private schedulingService: SchedulingService;
  private notificationService: NotificationService;
  
  private config: AutomationConfig;
  private isEnabled: boolean = true;
  private metricsInterval: NodeJS.Timeout | null = null;
  private executionQueue: Map<string, Promise<AutomationExecutionResult>> = new Map();

  constructor(
    taskManager: TaskManager,
    learningService: LearningService,
    priorityManager: DynamicPriorityManager,
    taskDecomposer: AITaskDecomposer,
    config?: Partial<AutomationConfig>
  ) {
    super();
    
    this.taskManager = taskManager;
    this.learningService = learningService;
    this.priorityManager = priorityManager;
    this.taskDecomposer = taskDecomposer;
    
    this.config = this.mergeWithDefaults(config);
    
    // Initialize automation components
    this.ruleEngine = new RuleEngine(this.config);
    this.workflowManager = new WorkflowManager(this.config);
    this.eventProcessor = new EventProcessor(this.config);
    this.schedulingService = new SchedulingService(this.config);
    this.notificationService = new NotificationService(this.config);
    
    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  /**
   * Start the automation engine
   */
  public async start(): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Automation engine is disabled');
    }

    // Start all components
    await this.ruleEngine.start();
    await this.workflowManager.start();
    await this.eventProcessor.start();
    await this.schedulingService.start();
    await this.notificationService.start();

    // Load default automation rules
    await this.loadDefaultRules();
    
    // Load default workflows
    await this.loadDefaultWorkflows();

    this.emit('automationEngineStarted', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Stop the automation engine
   */
  public async stop(): Promise<void> {
    this.isEnabled = false;
    
    // Stop all components
    await this.ruleEngine.stop();
    await this.workflowManager.stop();
    await this.eventProcessor.stop();
    await this.schedulingService.stop();
    await this.notificationService.stop();
    
    // Clear execution queue
    this.executionQueue.clear();
    
    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.emit('automationEngineStopped', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Process automation event
   */
  public async processEvent(event: AutomationEvent): Promise<AutomationExecutionResult[]> {
    if (!this.isEnabled) {
      return [];
    }

    const results: AutomationExecutionResult[] = [];
    
    try {
      // Process event through rule engine
      const ruleResults = await this.ruleEngine.processEvent(event);
      results.push(...ruleResults);
      
      // Process event through workflow manager
      const workflowResults = await this.workflowManager.processEvent(event);
      results.push(...workflowResults);
      
      // Update metrics
      this.updateEventMetrics(event, results);
      
      this.emit('eventProcessed', {
        event,
        results,
        timestamp: new Date().toISOString()
      });
      
      return results;
      
    } catch (error) {
      const errorResult: AutomationExecutionResult = {
        success: false,
        executionId: this.generateExecutionId(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        actionsExecuted: 0,
        actionsSuccessful: 0,
        actionsFailed: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed to process event: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context: { event }
        }],
        metadata: { eventType: event.type }
      };
      
      results.push(errorResult);
      this.emit('eventProcessingError', { event, error, timestamp: new Date().toISOString() });
      
      return results;
    }
  }

  /**
   * Add automation rule
   */
  public async addRule(rule: AutomationRule): Promise<void> {
    await this.ruleEngine.addRule(rule);
    this.emit('ruleAdded', { rule, timestamp: new Date().toISOString() });
  }

  /**
   * Remove automation rule
   */
  public async removeRule(ruleId: string): Promise<void> {
    await this.ruleEngine.removeRule(ruleId);
    this.emit('ruleRemoved', { ruleId, timestamp: new Date().toISOString() });
  }

  /**
   * Add workflow
   */
  public async addWorkflow(workflow: Workflow): Promise<void> {
    await this.workflowManager.addWorkflow(workflow);
    this.emit('workflowAdded', { workflow, timestamp: new Date().toISOString() });
  }

  /**
   * Remove workflow
   */
  public async removeWorkflow(workflowId: string): Promise<void> {
    await this.workflowManager.removeWorkflow(workflowId);
    this.emit('workflowRemoved', { workflowId, timestamp: new Date().toISOString() });
  }

  /**
   * Execute workflow manually
   */
  public async executeWorkflow(
    workflowId: string, 
    context?: Record<string, any>
  ): Promise<AutomationExecutionResult> {
    return await this.workflowManager.executeWorkflow(workflowId, context);
  }

  /**
   * Get automation metrics
   */
  public getMetrics(): AutomationMetrics {
    const ruleMetrics = this.ruleEngine.getMetrics();
    const workflowMetrics = this.workflowManager.getMetrics();
    const eventMetrics = this.eventProcessor.getMetrics();
    
    return {
      totalRules: ruleMetrics.totalRules,
      activeRules: ruleMetrics.activeRules,
      totalWorkflows: workflowMetrics.totalWorkflows,
      activeWorkflows: workflowMetrics.activeWorkflows,
      executionsToday: ruleMetrics.executionsToday + workflowMetrics.executionsToday,
      successRate: this.calculateOverallSuccessRate(ruleMetrics, workflowMetrics),
      averageExecutionTime: this.calculateAverageExecutionTime(ruleMetrics, workflowMetrics),
      topTriggers: eventMetrics.topTriggers,
      topActions: this.combineTopActions(ruleMetrics, workflowMetrics),
      errorRate: this.calculateOverallErrorRate(ruleMetrics, workflowMetrics),
      performanceMetrics: {
        rulesPerSecond: ruleMetrics.performanceMetrics.rulesPerSecond,
        workflowsPerSecond: workflowMetrics.performanceMetrics.workflowsPerSecond,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
      }
    };
  }

  /**
   * Get automation insights
   */
  public async getInsights(): Promise<AutomationInsight[]> {
    const insights: AutomationInsight[] = [];
    
    // Get insights from rule engine
    const ruleInsights = await this.ruleEngine.getInsights();
    insights.push(...ruleInsights);
    
    // Get insights from workflow manager
    const workflowInsights = await this.workflowManager.getInsights();
    insights.push(...workflowInsights);
    
    // Get insights from learning service
    const learningInsights = this.learningService.getLearningInsights();
    insights.push(...learningInsights.map(insight => ({
      type: 'recommendation' as const,
      title: `Learning Insight: ${insight.title}`,
      description: insight.description,
      confidence: insight.confidence,
      impact: insight.impact,
      actionable: insight.actionable,
      recommendations: insight.recommendations || [],
      data: insight.data,
      timestamp: insight.timestamp
    })));
    
    // Generate automation-specific insights
    const automationInsights = await this.generateAutomationInsights();
    insights.push(...automationInsights);
    
    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Optimize automation performance
   */
  public async optimizePerformance(): Promise<{
    optimizationsApplied: number;
    performanceImprovement: number;
    recommendations: string[];
  }> {
    let optimizationsApplied = 0;
    const recommendations: string[] = [];
    
    // Optimize rule engine
    const ruleOptimization = await this.ruleEngine.optimize();
    optimizationsApplied += ruleOptimization.optimizationsApplied;
    recommendations.push(...ruleOptimization.recommendations);
    
    // Optimize workflow manager
    const workflowOptimization = await this.workflowManager.optimize();
    optimizationsApplied += workflowOptimization.optimizationsApplied;
    recommendations.push(...workflowOptimization.recommendations);
    
    // Optimize scheduling service
    const schedulingOptimization = await this.schedulingService.optimize();
    optimizationsApplied += schedulingOptimization.optimizationsApplied;
    recommendations.push(...schedulingOptimization.recommendations);
    
    const performanceImprovement = (optimizationsApplied / 10) * 100; // Rough estimate
    
    this.emit('performanceOptimized', {
      optimizationsApplied,
      performanceImprovement,
      recommendations,
      timestamp: new Date().toISOString()
    });
    
    return {
      optimizationsApplied,
      performanceImprovement,
      recommendations
    };
  }

  /**
   * Enable smart scheduling
   */
  public async enableSmartScheduling(config: SmartSchedulingConfig): Promise<void> {
    await this.schedulingService.enableSmartScheduling(config);
    this.emit('smartSchedulingEnabled', { config, timestamp: new Date().toISOString() });
  }

  /**
   * Get automation configuration
   */
  public getConfig(): AutomationConfig {
    return { ...this.config };
  }

  /**
   * Update automation configuration
   */
  public async updateConfig(updates: Partial<AutomationConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Update component configurations
    await this.ruleEngine.updateConfig(this.config);
    await this.workflowManager.updateConfig(this.config);
    await this.eventProcessor.updateConfig(this.config);
    await this.schedulingService.updateConfig(this.config);
    await this.notificationService.updateConfig(this.config);
    
    this.emit('configUpdated', { config: this.config, timestamp: new Date().toISOString() });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen to task manager events
    this.taskManager.on('taskCreated', (data) => {
      this.processEvent({
        id: this.generateEventId(),
        type: 'task_created',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        data,
        taskId: data.task?.id
      });
    });

    this.taskManager.on('taskUpdated', (data) => {
      this.processEvent({
        id: this.generateEventId(),
        type: 'task_updated',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        data,
        taskId: data.taskId
      });
    });

    this.taskManager.on('taskCompleted', (data) => {
      this.processEvent({
        id: this.generateEventId(),
        type: 'task_completed',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        data,
        taskId: data.task?.id
      });
    });

    // Listen to learning service events
    this.learningService.on('learningInsightGenerated', (data) => {
      this.processEvent({
        id: this.generateEventId(),
        type: 'learning_insight',
        timestamp: new Date().toISOString(),
        source: 'learning_service',
        data
      });
    });

    // Listen to priority manager events
    this.priorityManager.on('priorityChanged', (data) => {
      this.processEvent({
        id: this.generateEventId(),
        type: 'priority_changed',
        timestamp: new Date().toISOString(),
        source: 'priority_manager',
        data,
        taskId: data.taskId
      });
    });
  }

  /**
   * Load default automation rules
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: AutomationRule[] = [
      {
        id: 'auto_decompose_complex_tasks',
        name: 'Auto-decompose Complex Tasks',
        description: 'Automatically decompose tasks marked as very complex',
        enabled: true,
        priority: 100,
        trigger: {
          type: 'task_created',
          config: {
            complexities: ['very_complex']
          }
        },
        conditions: [],
        actions: [{
          type: 'decompose_task',
          config: {}
        }],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: 'task_management',
          tags: ['decomposition', 'complexity']
        },
        execution: {
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
          averageExecutionTime: 0
        }
      },
      {
        id: 'auto_priority_urgent_overdue',
        name: 'Auto-prioritize Overdue Tasks',
        description: 'Automatically set overdue tasks to urgent priority',
        enabled: true,
        priority: 90,
        trigger: {
          type: 'task_overdue',
          config: {}
        },
        conditions: [],
        actions: [{
          type: 'change_priority',
          config: {
            priority: 'urgent'
          }
        }],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: 'priority_management',
          tags: ['priority', 'overdue']
        },
        execution: {
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
          averageExecutionTime: 0
        }
      }
    ];

    for (const rule of defaultRules) {
      await this.addRule(rule);
    }
  }

  /**
   * Load default workflows
   */
  private async loadDefaultWorkflows(): Promise<void> {
    const defaultWorkflows: Workflow[] = [
      {
        id: 'task_completion_workflow',
        name: 'Task Completion Workflow',
        description: 'Standard workflow for task completion processing',
        version: '1.0.0',
        enabled: true,
        steps: [
          {
            id: 'update_progress',
            name: 'Update Progress',
            type: 'task_operation',
            config: {
              action: {
                type: 'update_task',
                config: {
                  taskData: { progress: 100 }
                }
              }
            }
          },
          {
            id: 'record_completion',
            name: 'Record Completion',
            type: 'run_analysis',
            config: {
              analysisType: 'learning_cycle'
            }
          },
          {
            id: 'send_notification',
            name: 'Send Completion Notification',
            type: 'send_notification',
            config: {
              action: {
                type: 'send_notification',
                config: {
                  notificationConfig: {
                    type: 'in_app',
                    recipients: [],
                    message: 'Task completed successfully',
                    priority: 'medium'
                  }
                }
              }
            }
          }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: 'task_lifecycle',
          tags: ['completion', 'notification']
        },
        execution: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0
        }
      }
    ];

    for (const workflow of defaultWorkflows) {
      await this.addWorkflow(workflow);
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.performance.enableMetrics) return;

    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics();
      this.emit('metricsCollected', { metrics, timestamp: new Date().toISOString() });
    }, this.config.performance.metricsInterval * 1000);
  }

  /**
   * Generate automation insights
   */
  private async generateAutomationInsights(): Promise<AutomationInsight[]> {
    const insights: AutomationInsight[] = [];
    const metrics = this.getMetrics();

    // Performance insights
    if (metrics.averageExecutionTime > 5000) {
      insights.push({
        type: 'optimization',
        title: 'High Execution Time Detected',
        description: `Average automation execution time is ${metrics.averageExecutionTime}ms, which may impact performance`,
        confidence: 0.8,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Review and optimize slow automation rules',
          'Consider breaking down complex workflows',
          'Enable performance profiling'
        ],
        data: { averageExecutionTime: metrics.averageExecutionTime },
        timestamp: new Date().toISOString()
      });
    }

    // Error rate insights
    if (metrics.errorRate > 0.1) {
      insights.push({
        type: 'anomaly',
        title: 'High Automation Error Rate',
        description: `Automation error rate is ${(metrics.errorRate * 100).toFixed(1)}%, indicating potential issues`,
        confidence: 0.9,
        impact: 'high',
        actionable: true,
        recommendations: [
          'Review failed automation logs',
          'Check automation rule conditions',
          'Validate workflow configurations'
        ],
        data: { errorRate: metrics.errorRate },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config?: Partial<AutomationConfig>): AutomationConfig {
    const defaults: AutomationConfig = {
      enabled: true,
      maxConcurrentExecutions: 10,
      defaultTimeout: 30000,
      retryConfig: {
        maxRetries: 3,
        retryDelayMs: 1000,
        backoffMultiplier: 2
      },
      logging: {
        level: 'info',
        retention: 30,
        maxLogSize: 100
      },
      performance: {
        enableMetrics: true,
        metricsInterval: 60,
        enableProfiling: false
      },
      notifications: {
        enabled: true,
        defaultRecipients: [],
        errorNotifications: true,
        successNotifications: false
      }
    };

    return { ...defaults, ...config };
  }

  /**
   * Helper methods for metrics calculation
   */
  private calculateOverallSuccessRate(ruleMetrics: any, workflowMetrics: any): number {
    const totalExecutions = ruleMetrics.executionsToday + workflowMetrics.executionsToday;
    if (totalExecutions === 0) return 1;
    
    const totalSuccesses = ruleMetrics.successfulExecutions + workflowMetrics.successfulExecutions;
    return totalSuccesses / totalExecutions;
  }

  private calculateAverageExecutionTime(ruleMetrics: any, workflowMetrics: any): number {
    return (ruleMetrics.averageExecutionTime + workflowMetrics.averageExecutionTime) / 2;
  }

  private calculateOverallErrorRate(ruleMetrics: any, workflowMetrics: any): number {
    const totalExecutions = ruleMetrics.executionsToday + workflowMetrics.executionsToday;
    if (totalExecutions === 0) return 0;
    
    const totalErrors = ruleMetrics.failedExecutions + workflowMetrics.failedExecutions;
    return totalErrors / totalExecutions;
  }

  private combineTopActions(ruleMetrics: any, workflowMetrics: any): Array<{ type: string; count: number }> {
    const combined = new Map<string, number>();
    
    for (const action of ruleMetrics.topActions || []) {
      combined.set(action.type, (combined.get(action.type) || 0) + action.count);
    }
    
    for (const action of workflowMetrics.topActions || []) {
      combined.set(action.type, (combined.get(action.type) || 0) + action.count);
    }
    
    return Array.from(combined.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private updateEventMetrics(event: AutomationEvent, results: AutomationExecutionResult[]): void {
    // Implementation for updating event metrics
    this.emit('eventMetricsUpdated', { event, results, timestamp: new Date().toISOString() });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 