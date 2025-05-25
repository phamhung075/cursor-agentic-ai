import { EventEmitter } from 'events';
import { TaskManager } from './TaskManager';
import { AdaptiveLearningEngine } from './AdaptiveLearningEngine';
import { 
  Task, 
  LearningConfig, 
  LearningPrediction, 
  LearningInsight,
  AdaptiveLearningResult,
  LearningFeedback,
  TaskComplexity,
  TaskType,
  TaskOperationResult
} from '../../types/TaskTypes';

/**
 * Learning Service
 * 
 * High-level service that integrates Adaptive Learning Engine with Task Manager
 * to provide intelligent learning-based recommendations and automatic improvements.
 */
export class LearningService extends EventEmitter {
  private taskManager: TaskManager;
  private learningEngine: AdaptiveLearningEngine;
  private autoLearningEnabled: boolean = true;
  private learningInterval: NodeJS.Timeout | null = null;

  constructor(
    taskManager: TaskManager,
    learningConfig?: Partial<LearningConfig>
  ) {
    super();
    this.taskManager = taskManager;
    this.learningEngine = new AdaptiveLearningEngine(learningConfig);
    
    this.setupEventHandlers();
    this.startAutoLearning();
  }

  /**
   * Get intelligent estimation for a task
   */
  public async getIntelligentEstimation(taskId: string): Promise<LearningPrediction> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const features = this.extractTaskFeatures(task);
    return this.learningEngine.predictEstimation(features);
  }

  /**
   * Get intelligent complexity assessment
   */
  public async getIntelligentComplexity(taskId: string): Promise<LearningPrediction> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const features = {
      title: task.title,
      description: task.description,
      taskType: task.type,
      domain: task.metadata?.domain || 'general',
      dependencies: task.dependencies?.length || 0,
      tags: task.tags
    };

    return this.learningEngine.predictComplexity(features);
  }

  /**
   * Get intelligent decomposition recommendations
   */
  public async getIntelligentDecomposition(taskId: string): Promise<LearningPrediction> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return this.learningEngine.getDecompositionRecommendations(task);
  }

  /**
   * Apply learning-based improvements to a task
   */
  public async applyLearningImprovements(taskId: string): Promise<{
    success: boolean;
    improvements: Array<{
      type: 'estimation' | 'complexity' | 'priority';
      oldValue: any;
      newValue: any;
      confidence: number;
      reasoning: string[];
    }>;
    error?: string;
  }> {
    try {
      const task = this.taskManager.getTask(taskId);
      if (!task) {
        return {
          success: false,
          improvements: [],
          error: `Task not found: ${taskId}`
        };
      }

      const improvements: any[] = [];

      // Get estimation improvement
      const estimationPrediction = await this.getIntelligentEstimation(taskId);
      if (estimationPrediction.confidence > 0.7) {
        const currentEstimate = task.estimatedHours || 0;
        const newEstimate = estimationPrediction.prediction as number;
        
        if (Math.abs(newEstimate - currentEstimate) > 1) {
          await this.taskManager.updateTask(taskId, {
            estimatedHours: newEstimate
          });

          improvements.push({
            type: 'estimation',
            oldValue: currentEstimate,
            newValue: newEstimate,
            confidence: estimationPrediction.confidence,
            reasoning: estimationPrediction.reasoning
          });
        }
      }

      // Get complexity improvement
      const complexityPrediction = await this.getIntelligentComplexity(taskId);
      if (complexityPrediction.confidence > 0.7) {
        const currentComplexity = task.complexity;
        const newComplexity = complexityPrediction.prediction as TaskComplexity;
        
        if (newComplexity !== currentComplexity) {
          await this.taskManager.updateTask(taskId, {
            complexity: newComplexity
          });

          improvements.push({
            type: 'complexity',
            oldValue: currentComplexity,
            newValue: newComplexity,
            confidence: complexityPrediction.confidence,
            reasoning: complexityPrediction.reasoning
          });
        }
      }

      this.emit('learningImprovementsApplied', {
        taskId,
        improvements,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        improvements
      };

    } catch (error) {
      return {
        success: false,
        improvements: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record task completion for learning
   */
  public async recordTaskCompletion(
    taskId: string,
    actualHours: number,
    userSatisfaction?: number
  ): Promise<void> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const estimatedHours = task.estimatedHours || 0;
    const estimatedComplexity = task.complexity;

    this.learningEngine.recordTaskCompletion(
      task,
      estimatedHours,
      actualHours,
      estimatedComplexity,
      userSatisfaction
    );

    this.emit('taskCompletionRecorded', {
      taskId,
      estimatedHours,
      actualHours,
      accuracy: Math.abs(actualHours - estimatedHours) / actualHours,
      userSatisfaction
    });
  }

  /**
   * Provide learning feedback
   */
  public provideFeedback(feedback: LearningFeedback): void {
    this.learningEngine.provideFeedback(feedback);
    this.emit('learningFeedbackProvided', feedback);
  }

  /**
   * Get learning insights for the project
   */
  public getLearningInsights(): LearningInsight[] {
    return this.learningEngine.getLearningInsights();
  }

  /**
   * Run learning cycle manually
   */
  public async runLearningCycle(): Promise<AdaptiveLearningResult> {
    const result = await this.learningEngine.runLearningCycle();
    this.emit('learningCycleCompleted', result);
    return result;
  }

  /**
   * Get learning statistics
   */
  public getLearningStatistics(): any {
    return this.learningEngine.getLearningStatistics();
  }

  /**
   * Bulk apply learning improvements to multiple tasks
   */
  public async bulkApplyLearningImprovements(taskIds: string[]): Promise<{
    success: boolean;
    results: Array<{
      taskId: string;
      success: boolean;
      improvements: any[];
      error?: string;
    }>;
    totalImprovements: number;
  }> {
    const results: any[] = [];
    let totalImprovements = 0;

    for (const taskId of taskIds) {
      const result = await this.applyLearningImprovements(taskId);
      results.push({
        taskId,
        success: result.success,
        improvements: result.improvements,
        error: result.error
      });

      if (result.success) {
        totalImprovements += result.improvements.length;
      }
    }

    this.emit('bulkLearningImprovementsCompleted', {
      taskIds,
      totalImprovements,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      results,
      totalImprovements
    };
  }

  /**
   * Get learning-based task recommendations
   */
  public async getTaskRecommendations(limit: number = 10): Promise<Array<{
    taskId: string;
    recommendationType: 'estimation_update' | 'complexity_update' | 'decomposition';
    confidence: number;
    reasoning: string[];
    impact: 'low' | 'medium' | 'high';
  }>> {
    const allTasks = this.taskManager.queryTasks();
    const recommendations: any[] = [];

    for (const task of allTasks.slice(0, limit * 2)) {
      // Check for estimation improvements
      const estimationPrediction = this.learningEngine.predictEstimation(
        this.extractTaskFeatures(task)
      );

      if (estimationPrediction.confidence > 0.7) {
        const currentEstimate = task.estimatedHours || 0;
        const newEstimate = estimationPrediction.prediction as number;
        
        if (Math.abs(newEstimate - currentEstimate) > 2) {
          recommendations.push({
            taskId: task.id,
            recommendationType: 'estimation_update',
            confidence: estimationPrediction.confidence,
            reasoning: estimationPrediction.reasoning,
            impact: Math.abs(newEstimate - currentEstimate) > 8 ? 'high' : 'medium'
          });
        }
      }

      // Check for complexity improvements
      const complexityFeatures = {
        title: task.title,
        description: task.description,
        taskType: task.type,
        domain: task.metadata?.domain || 'general',
        dependencies: task.dependencies?.length || 0,
        tags: task.tags
      };

      const complexityPrediction = this.learningEngine.predictComplexity(complexityFeatures);
      
      if (complexityPrediction.confidence > 0.7) {
        const currentComplexity = task.complexity;
        const newComplexity = complexityPrediction.prediction as TaskComplexity;
        
        if (newComplexity !== currentComplexity) {
          recommendations.push({
            taskId: task.id,
            recommendationType: 'complexity_update',
            confidence: complexityPrediction.confidence,
            reasoning: complexityPrediction.reasoning,
            impact: this.getComplexityChangeImpact(currentComplexity, newComplexity)
          });
        }
      }
    }

    // Sort by confidence and impact
    recommendations.sort((a, b) => {
      const impactWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const scoreA = a.confidence + ((impactWeight[a.impact] || 1) * 0.1);
      const scoreB = b.confidence + ((impactWeight[b.impact] || 1) * 0.1);
      return scoreB - scoreA;
    });

    return recommendations.slice(0, limit);
  }

  /**
   * Enable/disable auto learning
   */
  public setAutoLearningEnabled(enabled: boolean): void {
    this.autoLearningEnabled = enabled;
    
    if (enabled && !this.learningInterval) {
      this.startAutoLearning();
    } else if (!enabled && this.learningInterval) {
      this.stopAutoLearning();
    }

    this.emit('autoLearningStateChanged', { enabled });
  }

  /**
   * Export learning data
   */
  public exportLearningData(): any {
    return this.learningEngine.exportLearningData();
  }

  /**
   * Import learning data
   */
  public importLearningData(data: any): void {
    this.learningEngine.importLearningData(data);
    this.emit('learningDataImported');
  }

  /**
   * Reset all learning data
   */
  public resetLearning(): void {
    this.learningEngine.resetLearning();
    this.emit('learningReset');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopAutoLearning();
    this.learningEngine.destroy();
    this.removeAllListeners();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen to task manager events
    this.taskManager.on('taskCompleted', async (data) => {
      if (this.autoLearningEnabled && data.task) {
        // Auto-record completion if actual hours are available
        if (data.task.actualHours && data.task.estimatedHours) {
          await this.recordTaskCompletion(
            data.task.id,
            data.task.actualHours
          );
        }
      }
    });

    this.taskManager.on('taskUpdated', (data) => {
      if (this.autoLearningEnabled) {
        this.emit('taskUpdatedForLearning', data);
      }
    });

    // Listen to learning engine events
    this.learningEngine.on('learningCycleCompleted', (result) => {
      this.emit('learningCycleCompleted', result);
    });

    this.learningEngine.on('taskCompletionRecorded', (data) => {
      this.emit('learningDataUpdated', data);
    });
  }

  /**
   * Start auto learning
   */
  private startAutoLearning(): void {
    if (this.learningInterval) return;

    // Run learning cycle every 2 hours
    this.learningInterval = setInterval(async () => {
      if (this.autoLearningEnabled) {
        await this.runLearningCycle();
      }
    }, 2 * 60 * 60 * 1000);
  }

  /**
   * Stop auto learning
   */
  private stopAutoLearning(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
  }

  /**
   * Extract task features for learning
   */
  private extractTaskFeatures(task: Task): {
    taskType: TaskType;
    complexity: TaskComplexity;
    domain: string;
    assignee?: string;
    dependencies?: number;
    tags?: string[];
  } {
    const features: {
      taskType: TaskType;
      complexity: TaskComplexity;
      domain: string;
      assignee?: string;
      dependencies?: number;
      tags?: string[];
    } = {
      taskType: task.type,
      complexity: task.complexity,
      domain: task.metadata?.domain || 'general',
      dependencies: task.dependencies?.length || 0,
      tags: task.tags
    };

    // Only add assignee if it's not null
    if (task.assignee) {
      features.assignee = task.assignee;
    }

    return features;
  }

  /**
   * Get complexity change impact
   */
  private getComplexityChangeImpact(
    oldComplexity: TaskComplexity,
    newComplexity: TaskComplexity
  ): 'low' | 'medium' | 'high' {
    const complexityLevels: Record<TaskComplexity, number> = {
      'trivial': 1,
      'simple': 2,
      'medium': 3,
      'complex': 4,
      'very_complex': 5
    };

    const oldLevel = complexityLevels[oldComplexity];
    const newLevel = complexityLevels[newComplexity];
    const diff = Math.abs(newLevel - oldLevel);

    if (diff >= 3) return 'high';
    if (diff >= 2) return 'medium';
    return 'low';
  }
} 