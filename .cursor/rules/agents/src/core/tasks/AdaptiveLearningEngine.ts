import { EventEmitter } from 'events';
import { LearningDataCollector } from './LearningDataCollector';
import { EstimationLearningModel } from './EstimationLearningModel';
import { 
  Task, 
  LearningConfig, 
  LearningPrediction, 
  LearningInsight,
  AdaptiveLearningResult,
  LearningFeedback,
  TaskComplexity,
  TaskType
} from '../../types/TaskTypes';

/**
 * Adaptive Learning Engine
 * 
 * Core learning system that coordinates multiple learning models to improve
 * task estimation, complexity assessment, and decomposition over time.
 */
export class AdaptiveLearningEngine extends EventEmitter {
  private dataCollector: LearningDataCollector;
  private estimationModel: EstimationLearningModel;
  private config: LearningConfig;
  private isEnabled: boolean = true;
  private learningCycle: NodeJS.Timeout | null = null;

  constructor(config?: Partial<LearningConfig>) {
    super();
    
    this.config = this.mergeWithDefaults(config);
    this.dataCollector = new LearningDataCollector({
      maxDataPoints: this.config.dataRetention.maxDataPoints,
      maxAge: this.config.dataRetention.maxAge
    });
    
    this.estimationModel = new EstimationLearningModel({
      learningRate: this.config.models.estimation.learningRate,
      minDataPoints: this.config.models.estimation.minDataPoints
    });

    this.setupEventHandlers();
    
    if (this.config.enabled) {
      this.startLearningCycle();
    }
  }

  /**
   * Record task completion for learning
   */
  public recordTaskCompletion(
    task: Task,
    estimatedHours: number,
    actualHours: number,
    estimatedComplexity: TaskComplexity,
    userSatisfaction?: number
  ): void {
    if (!this.isEnabled) return;

    this.dataCollector.recordTaskCompletion(
      task,
      estimatedHours,
      actualHours,
      estimatedComplexity,
      userSatisfaction
    );

    this.emit('taskCompletionRecorded', {
      taskId: task.id,
      estimatedHours,
      actualHours,
      accuracy: Math.abs(actualHours - estimatedHours) / actualHours
    });
  }

  /**
   * Get estimation prediction for a task
   */
  public predictEstimation(features: {
    taskType: TaskType;
    complexity: TaskComplexity;
    domain: string;
    assignee?: string;
    dependencies?: number;
    tags?: string[];
  }): LearningPrediction {
    if (!this.config.models.estimation.enabled) {
      return this.getDefaultEstimation(features);
    }

    return this.estimationModel.predict(features);
  }

  /**
   * Predict task complexity based on features
   */
  public predictComplexity(features: {
    title: string;
    description: string;
    taskType: TaskType;
    domain: string;
    dependencies?: number;
    tags?: string[];
  }): LearningPrediction {
    if (!this.config.models.complexity.enabled) {
      return this.getDefaultComplexity(features);
    }

    // Simple rule-based complexity prediction for now
    const complexityScore = this.calculateComplexityScore(features);
    const complexity = this.mapScoreToComplexity(complexityScore);
    
    return {
      type: 'complexity',
      prediction: complexity,
      confidence: 0.7,
      reasoning: this.generateComplexityReasoning(features, complexityScore),
      modelUsed: 'complexity_model_v1',
      features
    };
  }

  /**
   * Get decomposition recommendations
   */
  public getDecompositionRecommendations(task: Task): LearningPrediction {
    if (!this.config.models.decomposition.enabled) {
      return this.getDefaultDecomposition(task);
    }

    const recommendations = this.generateDecompositionRecommendations(task);
    
    return {
      type: 'decomposition',
      prediction: recommendations,
      confidence: 0.8,
      reasoning: [`Based on similar ${task.type} tasks in ${task.metadata?.domain || 'general'} domain`],
      modelUsed: 'decomposition_model_v1',
      features: {
        taskType: task.type,
        complexity: task.complexity,
        domain: task.metadata?.domain || 'general',
        title: task.title,
        description: task.description
      }
    };
  }

  /**
   * Provide learning feedback
   */
  public provideFeedback(feedback: LearningFeedback): void {
    this.dataCollector.recordFeedback(feedback);
    
    // Update models based on feedback
    if (feedback.feedbackType === 'completion' && feedback.actualOutcome) {
      this.updateModelsWithFeedback(feedback);
    }

    this.emit('feedbackReceived', feedback);
  }

  /**
   * Get learning insights and recommendations
   */
  public getLearningInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    // Estimation accuracy insights
    const estimationAccuracy = this.dataCollector.getEstimationAccuracy();
    if (estimationAccuracy.dataPoints > 10) {
      insights.push({
        type: 'improvement',
        title: 'Estimation Accuracy Trend',
        description: `Current estimation accuracy: ${(100 - estimationAccuracy.meanAbsolutePercentageError).toFixed(1)}%`,
        confidence: 0.9,
        impact: estimationAccuracy.meanAbsolutePercentageError > 30 ? 'high' : 'medium',
        actionable: true,
        recommendations: this.generateEstimationRecommendations(estimationAccuracy),
        data: estimationAccuracy,
        timestamp: new Date().toISOString()
      });
    }

    // Complexity assessment insights
    const complexityAccuracy = this.dataCollector.getComplexityAccuracy();
    if (complexityAccuracy.dataPoints > 10) {
      insights.push({
        type: 'pattern',
        title: 'Complexity Assessment Pattern',
        description: `Complexity prediction accuracy: ${(complexityAccuracy.accuracy * 100).toFixed(1)}%`,
        confidence: 0.8,
        impact: complexityAccuracy.accuracy < 0.7 ? 'high' : 'low',
        actionable: true,
        recommendations: this.generateComplexityRecommendations(complexityAccuracy),
        data: complexityAccuracy,
        timestamp: new Date().toISOString()
      });
    }

    // Data coverage insights
    const dataStats = this.dataCollector.getDataStatistics();
    insights.push({
      type: 'recommendation',
      title: 'Learning Data Coverage',
      description: `Learning from ${dataStats.totalCompletions} completed tasks`,
      confidence: 0.9,
      impact: 'medium',
      actionable: true,
      recommendations: this.generateDataCoverageRecommendations(dataStats),
      data: dataStats,
      timestamp: new Date().toISOString()
    });

    return insights;
  }

  /**
   * Run adaptive learning cycle
   */
  public async runLearningCycle(): Promise<AdaptiveLearningResult> {
    const startTime = Date.now();
    const modelsAffected: string[] = [];
    let modelUpdated = false;
    let accuracyImprovement = 0;

    try {
      // Train estimation model
      if (this.config.models.estimation.enabled) {
        const estimationData = this.dataCollector.getLearningDataPoints('estimation');
        if (estimationData.length >= this.config.models.estimation.minDataPoints) {
          const oldAccuracy = this.estimationModel.getModelInfo().accuracy;
          this.estimationModel.train(estimationData);
          const newAccuracy = this.estimationModel.getModelInfo().accuracy;
          
          accuracyImprovement += newAccuracy - oldAccuracy;
          modelsAffected.push('estimation');
          modelUpdated = true;
        }
      }

      // Generate insights and recommendations
      const insights = this.getLearningInsights();
      const recommendations = this.generateLearningRecommendations();

      const result: AdaptiveLearningResult = {
        success: true,
        modelUpdated,
        accuracyImprovement,
        newDataPoints: this.dataCollector.getDataStatistics().totalCompletions,
        insights,
        recommendations,
        metadata: {
          processingTime: Date.now() - startTime,
          modelsAffected,
          confidenceChange: accuracyImprovement
        }
      };

      this.emit('learningCycleCompleted', result);
      return result;

    } catch (error) {
      const result: AdaptiveLearningResult = {
        success: false,
        modelUpdated: false,
        accuracyImprovement: 0,
        newDataPoints: 0,
        insights: [],
        recommendations: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          modelsAffected: [],
          confidenceChange: 0
        }
      };

      this.emit('learningCycleError', result);
      return result;
    }
  }

  /**
   * Get learning statistics
   */
  public getLearningStatistics(): {
    estimationModel: any;
    dataStatistics: any;
    learningConfig: LearningConfig;
    isEnabled: boolean;
  } {
    return {
      estimationModel: this.estimationModel.getModelInfo(),
      dataStatistics: this.dataCollector.getDataStatistics(),
      learningConfig: this.config,
      isEnabled: this.isEnabled
    };
  }

  /**
   * Enable/disable learning
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled && !this.learningCycle) {
      this.startLearningCycle();
    } else if (!enabled && this.learningCycle) {
      this.stopLearningCycle();
    }

    this.emit('learningStateChanged', { enabled });
  }

  /**
   * Export learning data
   */
  public exportLearningData(): any {
    return {
      dataCollector: this.dataCollector.exportData(),
      estimationModel: this.estimationModel.getModelInfo(),
      config: this.config,
      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Import learning data
   */
  public importLearningData(data: any): void {
    if (data.dataCollector) {
      this.dataCollector.importData(data.dataCollector);
    }
    
    this.emit('learningDataImported', {
      timestamp: new Date().toISOString(),
      dataPoints: data.dataCollector?.completionData?.length || 0
    });
  }

  /**
   * Reset all learning data
   */
  public resetLearning(): void {
    this.dataCollector.clearData();
    this.estimationModel.reset();
    this.emit('learningReset');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopLearningCycle();
    this.removeAllListeners();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.dataCollector.on('taskCompleted', (data) => {
      this.emit('learningDataUpdated', data);
    });

    this.dataCollector.on('feedbackReceived', (feedback) => {
      this.emit('learningFeedbackReceived', feedback);
    });
  }

  /**
   * Start learning cycle
   */
  private startLearningCycle(): void {
    if (this.learningCycle) return;

    // Run learning cycle every hour by default
    this.learningCycle = setInterval(async () => {
      await this.runLearningCycle();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop learning cycle
   */
  private stopLearningCycle(): void {
    if (this.learningCycle) {
      clearInterval(this.learningCycle);
      this.learningCycle = null;
    }
  }

  /**
   * Merge config with defaults
   */
  private mergeWithDefaults(config?: Partial<LearningConfig>): LearningConfig {
    const defaults: LearningConfig = {
      enabled: true,
      models: {
        estimation: {
          enabled: true,
          learningRate: 0.1,
          minDataPoints: 10,
          maxDataPoints: 5000,
          retrainThreshold: 0.1
        },
        complexity: {
          enabled: true,
          learningRate: 0.1,
          minDataPoints: 20,
          featureWeights: {
            descriptionLength: 0.3,
            keywords: 0.25,
            taskType: 0.2,
            domain: 0.15,
            dependencies: 0.1
          }
        },
        decomposition: {
          enabled: true,
          patternMatchThreshold: 0.7,
          maxPatterns: 100,
          successThreshold: 0.8
        }
      },
      dataRetention: {
        maxAge: 365,
        maxDataPoints: 10000,
        compressionEnabled: false
      },
      adaptation: {
        adaptationRate: 0.1,
        confidenceThreshold: 0.7,
        feedbackWeight: 1.0
      }
    };

    return { ...defaults, ...config } as LearningConfig;
  }

  /**
   * Calculate complexity score from features
   */
  private calculateComplexityScore(features: any): number {
    let score = 0.5; // Base score

    // Description length factor
    const descLength = features.description?.length || 0;
    if (descLength > 500) score += 0.3;
    else if (descLength > 200) score += 0.2;
    else if (descLength > 100) score += 0.1;

    // Task type factor
    const typeScores: Record<TaskType, number> = {
      'epic': 0.4,
      'feature': 0.3,
      'story': 0.1,
      'task': 0.0,
      'subtask': -0.1,
      'bug': 0.1,
      'improvement': 0.2,
      'research': 0.3
    };
    score += typeScores[features.taskType as TaskType] || 0;

    // Dependencies factor
    if (features.dependencies && features.dependencies > 0) {
      score += Math.min(0.2, features.dependencies * 0.05);
    }

    // Keywords factor
    const complexKeywords = ['algorithm', 'integration', 'architecture', 'optimization', 'machine learning', 'ai'];
    const title = features.title?.toLowerCase() || '';
    const description = features.description?.toLowerCase() || '';
    
    for (const keyword of complexKeywords) {
      if (title.includes(keyword) || description.includes(keyword)) {
        score += 0.1;
      }
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Map complexity score to complexity level
   */
  private mapScoreToComplexity(score: number): TaskComplexity {
    if (score >= 0.8) return 'very_complex';
    if (score >= 0.6) return 'complex';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'simple';
    return 'trivial';
  }

  /**
   * Generate complexity reasoning
   */
  private generateComplexityReasoning(features: any, score: number): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Complexity score: ${score.toFixed(2)}`);
    
    if (features.description?.length > 200) {
      reasoning.push('Detailed description suggests higher complexity');
    }
    
    if (features.dependencies && features.dependencies > 0) {
      reasoning.push(`${features.dependencies} dependencies increase complexity`);
    }
    
    const complexKeywords = ['algorithm', 'integration', 'architecture'];
    const hasComplexKeywords = complexKeywords.some(keyword => 
      features.title?.toLowerCase().includes(keyword) || 
      features.description?.toLowerCase().includes(keyword)
    );
    
    if (hasComplexKeywords) {
      reasoning.push('Technical keywords indicate higher complexity');
    }

    return reasoning;
  }

  /**
   * Generate decomposition recommendations
   */
  private generateDecompositionRecommendations(task: Task): any {
    const recommendations = {
      suggestedSubtasks: [] as any[],
      strategy: 'sequential',
      estimatedSubtasks: 3
    };

    // Simple rule-based decomposition
    if (task.type === 'epic') {
      recommendations.suggestedSubtasks = [
        { type: 'feature', title: 'Core Implementation', complexity: 'medium' },
        { type: 'feature', title: 'User Interface', complexity: 'simple' },
        { type: 'task', title: 'Testing & Validation', complexity: 'simple' }
      ];
      recommendations.estimatedSubtasks = 5;
    } else if (task.type === 'feature') {
      recommendations.suggestedSubtasks = [
        { type: 'task', title: 'Design & Planning', complexity: 'simple' },
        { type: 'task', title: 'Implementation', complexity: 'medium' },
        { type: 'task', title: 'Testing', complexity: 'simple' }
      ];
      recommendations.estimatedSubtasks = 3;
    }

    return recommendations;
  }

  /**
   * Get default estimation when model is not available
   */
  private getDefaultEstimation(features: any): LearningPrediction {
    const complexityHours: Record<TaskComplexity, number> = {
      'trivial': 1,
      'simple': 4,
      'medium': 8,
      'complex': 16,
      'very_complex': 32
    };

    const estimate = complexityHours[features.complexity as TaskComplexity] || 8;

    return {
      type: 'estimation',
      prediction: estimate,
      confidence: 0.5,
      reasoning: ['Default estimate based on complexity level'],
      modelUsed: 'default_estimation',
      features
    };
  }

  /**
   * Get default complexity prediction
   */
  private getDefaultComplexity(features: any): LearningPrediction {
    const score = this.calculateComplexityScore(features);
    const complexity = this.mapScoreToComplexity(score);

    return {
      type: 'complexity',
      prediction: complexity,
      confidence: 0.6,
      reasoning: this.generateComplexityReasoning(features, score),
      modelUsed: 'default_complexity',
      features
    };
  }

  /**
   * Get default decomposition
   */
  private getDefaultDecomposition(task: Task): LearningPrediction {
    const recommendations = this.generateDecompositionRecommendations(task);

    return {
      type: 'decomposition',
      prediction: recommendations,
      confidence: 0.5,
      reasoning: ['Default decomposition based on task type'],
      modelUsed: 'default_decomposition',
      features: { taskType: task.type, complexity: task.complexity }
    };
  }

  /**
   * Update models with feedback
   */
  private updateModelsWithFeedback(feedback: LearningFeedback): void {
    // This would update specific models based on the feedback type
    // For now, we'll just emit an event
    this.emit('modelFeedbackProcessed', feedback);
  }

  /**
   * Generate estimation recommendations
   */
  private generateEstimationRecommendations(accuracy: any): string[] {
    const recommendations: string[] = [];

    if (accuracy.meanAbsolutePercentageError > 30) {
      recommendations.push('Consider breaking down large tasks into smaller, more estimable pieces');
      recommendations.push('Review estimation process with team to identify common biases');
    }

    if (accuracy.estimationBias > 2) {
      recommendations.push('Tasks are consistently underestimated - add buffer time');
    } else if (accuracy.estimationBias < -2) {
      recommendations.push('Tasks are consistently overestimated - review estimation criteria');
    }

    return recommendations;
  }

  /**
   * Generate complexity recommendations
   */
  private generateComplexityRecommendations(accuracy: any): string[] {
    const recommendations: string[] = [];

    if (accuracy.accuracy < 0.7) {
      recommendations.push('Improve complexity assessment by considering more factors');
      recommendations.push('Review completed tasks to understand complexity patterns');
    }

    return recommendations;
  }

  /**
   * Generate data coverage recommendations
   */
  private generateDataCoverageRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.totalCompletions < 50) {
      recommendations.push('Complete more tasks to improve learning accuracy');
    }

    const domainCount = Object.keys(stats.coverage.domains).length;
    if (domainCount < 3) {
      recommendations.push('Diversify task domains to improve learning coverage');
    }

    return recommendations;
  }

  /**
   * Generate learning recommendations
   */
  private generateLearningRecommendations(): LearningPrediction[] {
    const recommendations: LearningPrediction[] = [];

    // Add estimation improvement recommendations
    const estimationInfo = this.estimationModel.getModelInfo();
    if (estimationInfo.isActive && estimationInfo.accuracy < 0.8) {
      recommendations.push({
        type: 'estimation',
        prediction: 'improve_estimation_accuracy',
        confidence: 0.8,
        reasoning: ['Estimation accuracy can be improved with more data and feedback'],
        modelUsed: 'learning_engine',
        features: { currentAccuracy: estimationInfo.accuracy }
      });
    }

    return recommendations;
  }
} 