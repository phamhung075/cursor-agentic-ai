import { EventEmitter } from 'events';
import { TaskManager } from './TaskManager';
import { DynamicPriorityManager } from './DynamicPriorityManager';
import { 
  Task, 
  TaskPriority,
  TaskOperationResult
} from '../../types/TaskTypes';

/**
 * Priority Service
 * 
 * High-level service that integrates Dynamic Priority Manager with Task Manager
 * to provide intelligent priority management and automatic adjustments.
 */
export class PriorityService extends EventEmitter {
  private taskManager: TaskManager;
  private priorityManager: DynamicPriorityManager;
  private autoAdjustmentEnabled: boolean = false;
  private adjustmentInterval: NodeJS.Timeout | null = null;

  constructor(taskManager: TaskManager, config?: any) {
    super();
    this.taskManager = taskManager;
    this.priorityManager = new DynamicPriorityManager(config);
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Forward priority manager events
    this.priorityManager.on('priorityAdjusted', (event) => {
      this.emit('priorityAdjusted', event);
    });

    // Listen to task manager events for automatic priority updates
    this.taskManager.on('taskCreated', async (event) => {
      if (this.autoAdjustmentEnabled) {
        await this.updateTaskPriority(event.task.id);
      }
    });

    this.taskManager.on('taskUpdated', async (event) => {
      if (this.autoAdjustmentEnabled && this.shouldRecalculatePriority(event)) {
        await this.updateTaskPriority(event.taskId);
      }
    });
  }

  /**
   * Enable automatic priority adjustments
   */
  public enableAutoAdjustment(intervalMinutes: number = 60): void {
    this.autoAdjustmentEnabled = true;
    
    if (this.adjustmentInterval) {
      clearInterval(this.adjustmentInterval);
    }

    // Run automatic adjustments periodically
    this.adjustmentInterval = setInterval(async () => {
      await this.runAutomaticAdjustments();
    }, intervalMinutes * 60 * 1000);

    this.emit('autoAdjustmentEnabled', { intervalMinutes });
  }

  /**
   * Disable automatic priority adjustments
   */
  public disableAutoAdjustment(): void {
    this.autoAdjustmentEnabled = false;
    
    if (this.adjustmentInterval) {
      clearInterval(this.adjustmentInterval);
      this.adjustmentInterval = null;
    }

    this.emit('autoAdjustmentDisabled');
  }

  /**
   * Get priority recommendations for all tasks
   */
  public async getPriorityRecommendations(): Promise<any[]> {
    const tasks = this.taskManager.queryTasks();
    const { dependencies, dependents } = this.buildDependencyMaps(tasks);
    
    return this.priorityManager.getPriorityRecommendations(tasks, dependencies, dependents);
  }

  /**
   * Get priority recommendations for a specific task
   */
  public async getTaskPriorityRecommendation(taskId: string): Promise<any | null> {
    const task = this.taskManager.getTask(taskId);
    if (!task) return null;

    const tasks = this.taskManager.queryTasks();
    const { dependencies, dependents } = this.buildDependencyMaps(tasks);
    
    const calculation = this.priorityManager.calculateDynamicPriority(
      task, 
      tasks, 
      dependencies, 
      dependents
    );

    return {
      taskId,
      currentPriority: calculation.currentPriority,
      recommendedPriority: calculation.suggestedPriority,
      reasoning: calculation.reasoning,
      confidence: calculation.confidence,
      shouldUpdate: calculation.shouldUpdate,
      factors: calculation.factors
    };
  }

  /**
   * Apply priority recommendation for a specific task
   */
  public async applyPriorityRecommendation(taskId: string): Promise<TaskOperationResult> {
    const recommendation = await this.getTaskPriorityRecommendation(taskId);
    
    if (!recommendation || !recommendation.shouldUpdate) {
      return {
        success: false,
        taskId,
        error: 'No priority update recommended for this task'
      };
    }

    const result = await this.taskManager.updateTask(taskId, {
      priority: recommendation.recommendedPriority
    });

    if (result.success) {
      this.emit('priorityUpdated', {
        taskId,
        oldPriority: recommendation.currentPriority,
        newPriority: recommendation.recommendedPriority,
        reasoning: recommendation.reasoning,
        confidence: recommendation.confidence
      });
    }

    return result;
  }

  /**
   * Run automatic priority adjustments for all eligible tasks
   */
  public async runAutomaticAdjustments(): Promise<any[]> {
    const tasks = this.taskManager.queryTasks();
    const { dependencies, dependents } = this.buildDependencyMaps(tasks);
    
    const updateCallback = async (taskId: string, newPriority: TaskPriority): Promise<TaskOperationResult> => {
      return this.taskManager.updateTask(taskId, { priority: newPriority });
    };

    const results = await this.priorityManager.applyAutomaticAdjustments(
      tasks,
      dependencies,
      dependents,
      updateCallback
    );

    this.emit('automaticAdjustmentsCompleted', {
      totalAdjustments: results.length,
      successfulAdjustments: results.filter(r => r.success).length,
      results
    });

    return results;
  }

  /**
   * Update priority for a specific task
   */
  public async updateTaskPriority(taskId: string): Promise<TaskOperationResult> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      return {
        success: false,
        taskId,
        error: 'Task not found'
      };
    }

    const tasks = this.taskManager.queryTasks();
    const { dependencies, dependents } = this.buildDependencyMaps(tasks);
    
    const calculation = this.priorityManager.calculateDynamicPriority(
      task,
      tasks,
      dependencies,
      dependents
    );

    if (calculation.shouldUpdate && calculation.confidence >= 0.7) {
      return this.taskManager.updateTask(taskId, {
        priority: calculation.suggestedPriority
      });
    }

    return {
      success: true,
      taskId,
      metadata: {
        message: 'No priority update needed',
        calculation
      }
    };
  }

  /**
   * Get priority statistics and insights
   */
  public getPriorityInsights(): any {
    const tasks = this.taskManager.queryTasks();
    const { dependencies, dependents } = this.buildDependencyMaps(tasks);
    
    const calculations = this.priorityManager.batchCalculatePriorities(
      tasks,
      dependencies,
      dependents
    );

    const insights = {
      totalTasks: tasks.length,
      tasksNeedingAdjustment: 0,
      averageConfidence: 0,
      priorityDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        critical: 0
      },
      recommendedDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        critical: 0
      },
      topRecommendations: [] as any[]
    };

    let totalConfidence = 0;
    const recommendations: any[] = [];

    for (const calculation of calculations.values()) {
      // Count current priority distribution
      insights.priorityDistribution[calculation.currentPriority]++;
      
      // Count recommended priority distribution
      insights.recommendedDistribution[calculation.suggestedPriority]++;
      
      // Track confidence
      totalConfidence += calculation.confidence;
      
      // Count tasks needing adjustment
      if (calculation.shouldUpdate) {
        insights.tasksNeedingAdjustment++;
        
        recommendations.push({
          taskId: calculation.taskId,
          currentPriority: calculation.currentPriority,
          suggestedPriority: calculation.suggestedPriority,
          confidence: calculation.confidence,
          reasoning: calculation.reasoning
        });
      }
    }

    insights.averageConfidence = tasks.length > 0 ? totalConfidence / tasks.length : 0;
    insights.topRecommendations = recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return insights;
  }

  /**
   * Build dependency maps from tasks
   */
  private buildDependencyMaps(tasks: Task[]): {
    dependencies: Map<string, string[]>;
    dependents: Map<string, string[]>;
  } {
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();

    // Initialize maps
    for (const task of tasks) {
      dependencies.set(task.id, task.dependencies || []);
      dependents.set(task.id, []);
    }

    // Build dependents map
    for (const task of tasks) {
      const taskDependencies = task.dependencies || [];
      for (const depId of taskDependencies) {
        const depDependents = dependents.get(depId) || [];
        depDependents.push(task.id);
        dependents.set(depId, depDependents);
      }
    }

    return { dependencies, dependents };
  }

  /**
   * Check if priority should be recalculated based on task update
   */
  private shouldRecalculatePriority(event: any): boolean {
    const significantFields = [
      'status',
      'progress', 
      'dueDate',
      'dependencies',
      'blockedBy',
      'metadata'
    ];

    if (!event.updates) return false;

    return significantFields.some(field => 
      Object.prototype.hasOwnProperty.call(event.updates, field)
    );
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disableAutoAdjustment();
    this.removeAllListeners();
  }
} 