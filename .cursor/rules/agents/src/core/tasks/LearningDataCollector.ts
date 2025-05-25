import { EventEmitter } from 'events';
import { 
  Task, 
  TaskCompletionData, 
  LearningDataPoint, 
  LearningFeedback,
  TaskType,
  TaskComplexity
} from '../../types/TaskTypes';

/**
 * Learning Data Collector
 * 
 * Collects and manages historical task data for machine learning models.
 * Tracks task completion metrics, estimation accuracy, and user feedback.
 */
export class LearningDataCollector extends EventEmitter {
  private completionData: Map<string, TaskCompletionData> = new Map();
  private learningDataPoints: Map<string, LearningDataPoint[]> = new Map();
  private feedbackData: Map<string, LearningFeedback[]> = new Map();
  private maxDataPoints: number;
  private maxAge: number; // days

  constructor(config?: {
    maxDataPoints?: number;
    maxAge?: number;
  }) {
    super();
    this.maxDataPoints = config?.maxDataPoints || 10000;
    this.maxAge = config?.maxAge || 365; // 1 year default
  }

  /**
   * Record task completion data
   */
  public recordTaskCompletion(
    task: Task,
    estimatedHours: number,
    actualHours: number,
    estimatedComplexity: TaskComplexity,
    userSatisfaction?: number
  ): void {
    const completionData: TaskCompletionData = {
      taskId: task.id,
      estimatedHours,
      actualHours,
      estimatedComplexity,
      actualComplexity: task.complexity,
      completionDate: new Date().toISOString(),
      assignee: task.assignee,
      domain: task.metadata?.domain || 'general',
      taskType: task.type,
      metadata: {
        priority: task.priority,
        tags: task.tags,
        progress: task.progress,
        dependencies: task.dependencies?.length || 0,
        children: task.children?.length || 0,
        ...task.metadata
      }
    };

    // Add optional properties if they exist
    if (userSatisfaction !== undefined) {
      completionData.userSatisfaction = userSatisfaction;
    }
    
    const decompositionSuccess = this.assessDecompositionSuccess(task);
    if (decompositionSuccess !== undefined) {
      completionData.decompositionSuccess = decompositionSuccess;
    }

    this.completionData.set(task.id, completionData);
    this.generateLearningDataPoints(completionData);
    
    this.emit('taskCompleted', completionData);
    this.cleanupOldData();
  }

  /**
   * Record learning feedback
   */
  public recordFeedback(feedback: LearningFeedback): void {
    if (!this.feedbackData.has(feedback.predictionId)) {
      this.feedbackData.set(feedback.predictionId, []);
    }
    
    const feedbackList = this.feedbackData.get(feedback.predictionId)!;
    feedbackList.push(feedback);
    
    this.emit('feedbackReceived', feedback);
  }

  /**
   * Get completion data for learning
   */
  public getCompletionData(filters?: {
    taskType?: TaskType;
    complexity?: TaskComplexity;
    assignee?: string;
    domain?: string;
    dateRange?: { start: string; end: string };
    minSatisfaction?: number;
  }): TaskCompletionData[] {
    let data = Array.from(this.completionData.values());

    if (filters) {
      data = data.filter(item => {
        if (filters.taskType && item.taskType !== filters.taskType) return false;
        if (filters.complexity && item.actualComplexity !== filters.complexity) return false;
        if (filters.assignee && item.assignee !== filters.assignee) return false;
        if (filters.domain && item.domain !== filters.domain) return false;
        if (filters.minSatisfaction && (!item.userSatisfaction || item.userSatisfaction < filters.minSatisfaction)) return false;
        
        if (filters.dateRange) {
          const completionDate = new Date(item.completionDate);
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          if (completionDate < start || completionDate > end) return false;
        }
        
        return true;
      });
    }

    return data;
  }

  /**
   * Get learning data points for specific model type
   */
  public getLearningDataPoints(modelType: string): LearningDataPoint[] {
    return this.learningDataPoints.get(modelType) || [];
  }

  /**
   * Get feedback data for a prediction
   */
  public getFeedbackData(predictionId: string): LearningFeedback[] {
    return this.feedbackData.get(predictionId) || [];
  }

  /**
   * Get estimation accuracy metrics
   */
  public getEstimationAccuracy(): {
    meanAbsoluteError: number;
    meanAbsolutePercentageError: number;
    estimationBias: number;
    dataPoints: number;
  } {
    const data = Array.from(this.completionData.values())
      .filter(item => item.estimatedHours > 0 && item.actualHours > 0);

    if (data.length === 0) {
      return {
        meanAbsoluteError: 0,
        meanAbsolutePercentageError: 0,
        estimationBias: 0,
        dataPoints: 0
      };
    }

    const errors = data.map(item => Math.abs(item.actualHours - item.estimatedHours));
    const percentageErrors = data.map(item => 
      Math.abs((item.actualHours - item.estimatedHours) / item.actualHours) * 100
    );
    const biases = data.map(item => item.estimatedHours - item.actualHours);

    return {
      meanAbsoluteError: errors.reduce((sum, error) => sum + error, 0) / errors.length,
      meanAbsolutePercentageError: percentageErrors.reduce((sum, error) => sum + error, 0) / percentageErrors.length,
      estimationBias: biases.reduce((sum, bias) => sum + bias, 0) / biases.length,
      dataPoints: data.length
    };
  }

  /**
   * Get complexity assessment accuracy
   */
  public getComplexityAccuracy(): {
    accuracy: number;
    confusionMatrix: Record<TaskComplexity, Record<TaskComplexity, number>>;
    dataPoints: number;
  } {
    const data = Array.from(this.completionData.values());
    
    if (data.length === 0) {
      return {
        accuracy: 0,
        confusionMatrix: {} as any,
        dataPoints: 0
      };
    }

    // Initialize confusion matrix
    const complexities: TaskComplexity[] = ['trivial', 'simple', 'medium', 'complex', 'very_complex'];
    const confusionMatrix: Record<TaskComplexity, Record<TaskComplexity, number>> = {} as any;
    
    for (const estimated of complexities) {
      confusionMatrix[estimated] = {} as any;
      for (const actual of complexities) {
        confusionMatrix[estimated][actual] = 0;
      }
    }

    let correctPredictions = 0;
    
    for (const item of data) {
      confusionMatrix[item.estimatedComplexity][item.actualComplexity]++;
      if (item.estimatedComplexity === item.actualComplexity) {
        correctPredictions++;
      }
    }

    return {
      accuracy: correctPredictions / data.length,
      confusionMatrix,
      dataPoints: data.length
    };
  }

  /**
   * Get decomposition success metrics
   */
  public getDecompositionMetrics(): {
    successRate: number;
    averageSubtasks: number;
    dataPoints: number;
    successByType: Record<TaskType, number>;
  } {
    const data = Array.from(this.completionData.values())
      .filter(item => item.decompositionSuccess !== undefined);

    if (data.length === 0) {
      return {
        successRate: 0,
        averageSubtasks: 0,
        dataPoints: 0,
        successByType: {} as any
      };
    }

    const successfulDecompositions = data.filter(item => item.decompositionSuccess).length;
    const totalSubtasks = data.reduce((sum, item) => sum + (item.metadata['children'] || 0), 0);
    
    // Calculate success rate by task type
    const successByType: Record<TaskType, number> = {} as any;
    const taskTypes: TaskType[] = ['epic', 'feature', 'story', 'task', 'subtask', 'bug', 'improvement', 'research'];
    
    for (const type of taskTypes) {
      const typeData = data.filter(item => item.taskType === type);
      const typeSuccesses = typeData.filter(item => item.decompositionSuccess).length;
      successByType[type] = typeData.length > 0 ? typeSuccesses / typeData.length : 0;
    }

    return {
      successRate: successfulDecompositions / data.length,
      averageSubtasks: totalSubtasks / data.length,
      dataPoints: data.length,
      successByType
    };
  }

  /**
   * Get data statistics
   */
  public getDataStatistics(): {
    totalCompletions: number;
    totalFeedback: number;
    totalLearningPoints: number;
    dataAge: { oldest: string; newest: string };
    coverage: {
      taskTypes: Record<TaskType, number>;
      complexities: Record<TaskComplexity, number>;
      domains: Record<string, number>;
    };
  } {
    const completions = Array.from(this.completionData.values());
    const allFeedback = Array.from(this.feedbackData.values()).flat();
    const allLearningPoints = Array.from(this.learningDataPoints.values()).flat();

    // Calculate coverage
    const taskTypes: Record<TaskType, number> = {} as any;
    const complexities: Record<TaskComplexity, number> = {} as any;
    const domains: Record<string, number> = {};

    for (const completion of completions) {
      taskTypes[completion.taskType] = (taskTypes[completion.taskType] || 0) + 1;
      complexities[completion.actualComplexity] = (complexities[completion.actualComplexity] || 0) + 1;
      domains[completion.domain] = (domains[completion.domain] || 0) + 1;
    }

    // Find oldest and newest data
    const dates = completions.map(c => new Date(c.completionDate));
    const oldest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : '';
    const newest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : '';

    return {
      totalCompletions: completions.length,
      totalFeedback: allFeedback.length,
      totalLearningPoints: allLearningPoints.length,
      dataAge: { oldest, newest },
      coverage: {
        taskTypes,
        complexities,
        domains
      }
    };
  }

  /**
   * Export learning data for persistence
   */
  public exportData(): {
    completionData: TaskCompletionData[];
    learningDataPoints: Record<string, LearningDataPoint[]>;
    feedbackData: Record<string, LearningFeedback[]>;
    metadata: {
      exportDate: string;
      version: string;
      dataPoints: number;
    };
  } {
    return {
      completionData: Array.from(this.completionData.values()),
      learningDataPoints: Object.fromEntries(this.learningDataPoints),
      feedbackData: Object.fromEntries(this.feedbackData),
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        dataPoints: this.completionData.size
      }
    };
  }

  /**
   * Import learning data from persistence
   */
  public importData(data: {
    completionData: TaskCompletionData[];
    learningDataPoints: Record<string, LearningDataPoint[]>;
    feedbackData: Record<string, LearningFeedback[]>;
  }): void {
    // Import completion data
    for (const completion of data.completionData) {
      this.completionData.set(completion.taskId, completion);
    }

    // Import learning data points
    for (const [modelType, points] of Object.entries(data.learningDataPoints)) {
      this.learningDataPoints.set(modelType, points);
    }

    // Import feedback data
    for (const [predictionId, feedback] of Object.entries(data.feedbackData)) {
      this.feedbackData.set(predictionId, feedback);
    }

    this.emit('dataImported', {
      completions: data.completionData.length,
      learningPoints: Object.values(data.learningDataPoints).flat().length,
      feedback: Object.values(data.feedbackData).flat().length
    });
  }

  /**
   * Clear all learning data
   */
  public clearData(): void {
    this.completionData.clear();
    this.learningDataPoints.clear();
    this.feedbackData.clear();
    this.emit('dataCleared');
  }

  /**
   * Generate learning data points from completion data
   */
  private generateLearningDataPoints(completion: TaskCompletionData): void {
    const timestamp = new Date().toISOString();

    // Generate estimation learning data point
    const estimationPoint: LearningDataPoint = {
      id: `est_${completion.taskId}_${Date.now()}`,
      timestamp,
      features: {
        taskType: completion.taskType,
        complexity: completion.estimatedComplexity,
        domain: completion.domain,
        assignee: completion.assignee,
        dependencies: completion.metadata['dependencies'],
        children: completion.metadata['children'],
        tags: completion.metadata['tags'],
        priority: completion.metadata['priority']
      },
      target: completion.actualHours,
      weight: 1.0,
      source: 'completion'
    };

    this.addLearningDataPoint('estimation', estimationPoint);

    // Generate complexity learning data point
    const complexityPoint: LearningDataPoint = {
      id: `comp_${completion.taskId}_${Date.now()}`,
      timestamp,
      features: {
        taskType: completion.taskType,
        domain: completion.domain,
        descriptionLength: completion.metadata['description']?.length || 0,
        dependencies: completion.metadata['dependencies'],
        tags: completion.metadata['tags']
      },
      target: completion.actualComplexity,
      weight: 1.0,
      source: 'completion'
    };

    this.addLearningDataPoint('complexity', complexityPoint);

    // Generate decomposition learning data point if applicable
    if (completion.decompositionSuccess !== undefined) {
      const decompositionPoint: LearningDataPoint = {
        id: `decomp_${completion.taskId}_${Date.now()}`,
        timestamp,
        features: {
          taskType: completion.taskType,
          complexity: completion.actualComplexity,
          domain: completion.domain,
          subtaskCount: completion.metadata['children']
        },
        target: completion.decompositionSuccess,
        weight: 1.0,
        source: 'completion'
      };

      this.addLearningDataPoint('decomposition', decompositionPoint);
    }
  }

  /**
   * Add learning data point to specific model type
   */
  private addLearningDataPoint(modelType: string, dataPoint: LearningDataPoint): void {
    if (!this.learningDataPoints.has(modelType)) {
      this.learningDataPoints.set(modelType, []);
    }

    const points = this.learningDataPoints.get(modelType)!;
    points.push(dataPoint);

    // Limit data points per model
    if (points.length > this.maxDataPoints) {
      points.splice(0, points.length - this.maxDataPoints);
    }
  }

  /**
   * Assess decomposition success based on task metrics
   */
  private assessDecompositionSuccess(task: Task): boolean | undefined {
    if (!task.children || task.children.length === 0) {
      return undefined; // No decomposition to assess
    }

    // Simple heuristic: decomposition is successful if task was completed
    // and had reasonable progress. In a real system, this could be more sophisticated.
    return task.status === 'completed' && task.progress >= 90;
  }

  /**
   * Clean up old data based on age and size limits
   */
  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxAge);

    // Clean completion data
    for (const [taskId, completion] of this.completionData) {
      if (new Date(completion.completionDate) < cutoffDate) {
        this.completionData.delete(taskId);
      }
    }

    // Clean learning data points
    for (const [modelType, points] of this.learningDataPoints) {
      const filteredPoints = points.filter(point => new Date(point.timestamp) >= cutoffDate);
      this.learningDataPoints.set(modelType, filteredPoints);
    }

    // Clean feedback data (keep feedback for existing predictions only)
    const validPredictionIds = new Set(
      Array.from(this.learningDataPoints.values())
        .flat()
        .map(point => point.id)
    );

    for (const [predictionId, feedback] of this.feedbackData) {
      if (!validPredictionIds.has(predictionId)) {
        this.feedbackData.delete(predictionId);
      }
    }
  }
} 