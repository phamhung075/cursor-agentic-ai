import { 
  LearningDataPoint, 
  LearningPrediction, 
  EstimationLearningModel as EstimationModelData,
  TaskType,
  TaskComplexity
} from '../../types/TaskTypes';

/**
 * Estimation Learning Model
 * 
 * Uses statistical learning to improve task time estimation based on historical data.
 * Implements exponential smoothing and weighted factor analysis.
 */
export class EstimationLearningModel {
  private modelData: EstimationModelData;
  private dataPoints: LearningDataPoint[] = [];
  private factorAverages: Map<string, Map<any, number>> = new Map();
  private learningRate: number;
  private minDataPoints: number;

  constructor(config?: {
    learningRate?: number;
    minDataPoints?: number;
  }) {
    this.learningRate = config?.learningRate || 0.1;
    this.minDataPoints = config?.minDataPoints || 10;
    
    this.modelData = {
      id: 'estimation_model_v1',
      name: 'Task Estimation Learning Model',
      version: '1.0.0',
      type: 'estimation',
      accuracy: 0.5,
      confidence: 0.5,
      dataPoints: 0,
      lastTrained: new Date().toISOString(),
      isActive: false,
      meanAbsoluteError: 0,
      meanAbsolutePercentageError: 0,
      estimationBias: 0,
      factorWeights: {
        complexity: 0.3,
        taskType: 0.25,
        assignee: 0.2,
        domain: 0.15,
        historical: 0.1
      }
    };

    this.initializeFactorAverages();
  }

  /**
   * Train the model with new data points
   */
  public train(dataPoints: LearningDataPoint[]): void {
    // Add new data points
    this.dataPoints.push(...dataPoints);
    
    // Keep only recent data points to prevent memory issues
    if (this.dataPoints.length > 5000) {
      this.dataPoints = this.dataPoints.slice(-5000);
    }

    if (this.dataPoints.length >= this.minDataPoints) {
      this.updateFactorAverages();
      this.calculateAccuracyMetrics();
      this.adjustFactorWeights();
      this.modelData.isActive = true;
      this.modelData.lastTrained = new Date().toISOString();
      this.modelData.dataPoints = this.dataPoints.length;
    }
  }

  /**
   * Predict task estimation
   */
  public predict(features: {
    taskType: TaskType;
    complexity: TaskComplexity;
    domain: string;
    assignee?: string;
    dependencies?: number;
    tags?: string[];
  }): LearningPrediction {
    if (!this.modelData.isActive) {
      return this.getDefaultPrediction(features);
    }

    const baseEstimate = this.calculateBaseEstimate(features);
    const adjustedEstimate = this.applyFactorAdjustments(baseEstimate, features);
    const confidence = this.calculatePredictionConfidence(features);

    const reasoning = this.generateReasoning(features, baseEstimate, adjustedEstimate);

    return {
      type: 'estimation',
      prediction: Math.max(0.5, adjustedEstimate), // Minimum 0.5 hours
      confidence,
      reasoning,
      modelUsed: this.modelData.id,
      features,
      alternatives: this.generateAlternatives(features, adjustedEstimate)
    };
  }

  /**
   * Update model with feedback
   */
  public updateWithFeedback(
    prediction: LearningPrediction,
    actualHours: number,
    weight: number = 1.0
  ): void {
    const error = Math.abs(actualHours - (prediction.prediction as number));
    const percentageError = Math.abs((actualHours - (prediction.prediction as number)) / actualHours) * 100;

    // Create feedback data point
    const feedbackPoint: LearningDataPoint = {
      id: `feedback_${Date.now()}`,
      timestamp: new Date().toISOString(),
      features: prediction.features,
      target: actualHours,
      weight,
      source: 'feedback'
    };

    this.dataPoints.push(feedbackPoint);

    // Update model metrics incrementally
    this.updateMetricsIncremental(error, percentageError, actualHours - (prediction.prediction as number));
    
    // Adjust factor weights based on prediction accuracy
    this.adjustWeightsBasedOnFeedback(prediction, actualHours);
  }

  /**
   * Get model information
   */
  public getModelInfo(): EstimationModelData {
    return { ...this.modelData };
  }

  /**
   * Get feature importance
   */
  public getFeatureImportance(): Record<string, number> {
    return { ...this.modelData.factorWeights };
  }

  /**
   * Reset model
   */
  public reset(): void {
    this.dataPoints = [];
    this.factorAverages.clear();
    this.initializeFactorAverages();
    this.modelData.isActive = false;
    this.modelData.accuracy = 0.5;
    this.modelData.confidence = 0.5;
    this.modelData.dataPoints = 0;
    this.modelData.meanAbsoluteError = 0;
    this.modelData.meanAbsolutePercentageError = 0;
    this.modelData.estimationBias = 0;
  }

  /**
   * Initialize factor averages
   */
  private initializeFactorAverages(): void {
    // Initialize with default estimates
    const complexityAverages = new Map<TaskComplexity, number>();
    complexityAverages.set('trivial', 2);
    complexityAverages.set('simple', 4);
    complexityAverages.set('medium', 8);
    complexityAverages.set('complex', 16);
    complexityAverages.set('very_complex', 32);
    this.factorAverages.set('complexity', complexityAverages);

    const taskTypeAverages = new Map<TaskType, number>();
    taskTypeAverages.set('epic', 80);
    taskTypeAverages.set('feature', 24);
    taskTypeAverages.set('story', 8);
    taskTypeAverages.set('task', 4);
    taskTypeAverages.set('subtask', 2);
    taskTypeAverages.set('bug', 3);
    taskTypeAverages.set('improvement', 6);
    taskTypeAverages.set('research', 12);
    this.factorAverages.set('taskType', taskTypeAverages);

    this.factorAverages.set('domain', new Map());
    this.factorAverages.set('assignee', new Map());
  }

  /**
   * Update factor averages from data
   */
  private updateFactorAverages(): void {
    const factorGroups: Record<string, Map<any, number[]>> = {
      complexity: new Map(),
      taskType: new Map(),
      domain: new Map(),
      assignee: new Map()
    };

    // Group data points by factor values
    for (const point of this.dataPoints) {
      const target = point.target as number;
      
      if (point.features['complexity']) {
        const complexityGroup = factorGroups.complexity;
        if (complexityGroup) {
          this.addToGroup(complexityGroup, point.features['complexity'], target);
        }
      }
      if (point.features['taskType']) {
        const taskTypeGroup = factorGroups.taskType;
        if (taskTypeGroup) {
          this.addToGroup(taskTypeGroup, point.features['taskType'], target);
        }
      }
      if (point.features['domain']) {
        const domainGroup = factorGroups.domain;
        if (domainGroup) {
          this.addToGroup(domainGroup, point.features['domain'], target);
        }
      }
      if (point.features['assignee']) {
        const assigneeGroup = factorGroups.assignee;
        if (assigneeGroup) {
          this.addToGroup(assigneeGroup, point.features['assignee'], target);
        }
      }
    }

    // Calculate averages for each factor
    for (const [factorName, groups] of Object.entries(factorGroups)) {
      const averages = new Map();
      for (const [value, targets] of groups) {
        const average = targets.reduce((sum, val) => sum + val, 0) / targets.length;
        averages.set(value, average);
      }
      this.factorAverages.set(factorName, averages);
    }
  }

  /**
   * Add value to factor group
   */
  private addToGroup(group: Map<any, number[]>, key: any, value: number): void {
    if (!group.has(key)) {
      group.set(key, []);
    }
    group.get(key)!.push(value);
  }

  /**
   * Calculate base estimate
   */
  private calculateBaseEstimate(features: any): number {
    const complexityAvg = this.factorAverages.get('complexity')?.get(features.complexity) || 8;
    const taskTypeAvg = this.factorAverages.get('taskType')?.get(features.taskType) || 8;
    
    // Weighted average of complexity and task type
    return (complexityAvg * 0.6) + (taskTypeAvg * 0.4);
  }

  /**
   * Apply factor adjustments
   */
  private applyFactorAdjustments(baseEstimate: number, features: any): number {
    let estimate = baseEstimate;

    // Domain adjustment
    const domainAvg = this.factorAverages.get('domain')?.get(features.domain);
    if (domainAvg) {
      const domainFactor = domainAvg / baseEstimate;
      estimate *= (1 + (domainFactor - 1) * this.modelData.factorWeights.domain);
    }

    // Assignee adjustment
    const assigneeAvg = this.factorAverages.get('assignee')?.get(features.assignee);
    if (assigneeAvg) {
      const assigneeFactor = assigneeAvg / baseEstimate;
      estimate *= (1 + (assigneeFactor - 1) * this.modelData.factorWeights.assignee);
    }

    // Dependencies adjustment
    if (features.dependencies && features.dependencies > 0) {
      const dependencyFactor = 1 + (features.dependencies * 0.1);
      estimate *= dependencyFactor;
    }

    return estimate;
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(features: any): number {
    let confidence = 0.5;

    // Higher confidence with more data
    if (this.dataPoints.length >= 100) confidence += 0.2;
    else if (this.dataPoints.length >= 50) confidence += 0.1;

    // Higher confidence for known factors
    if (this.factorAverages.get('complexity')?.has(features.complexity)) confidence += 0.1;
    if (this.factorAverages.get('taskType')?.has(features.taskType)) confidence += 0.1;
    if (this.factorAverages.get('domain')?.has(features.domain)) confidence += 0.1;
    if (features.assignee && this.factorAverages.get('assignee')?.has(features.assignee)) confidence += 0.1;

    // Lower confidence for outlier combinations
    if (this.isOutlierCombination(features)) confidence -= 0.2;

    return Math.min(Math.max(confidence, 0.1), 0.95);
  }

  /**
   * Check if feature combination is an outlier
   */
  private isOutlierCombination(features: any): boolean {
    // Simple heuristic: very complex subtasks or trivial epics are outliers
    if (features.taskType === 'subtask' && features.complexity === 'very_complex') return true;
    if (features.taskType === 'epic' && features.complexity === 'trivial') return true;
    return false;
  }

  /**
   * Generate reasoning for prediction
   */
  private generateReasoning(features: any, baseEstimate: number, finalEstimate: number): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Base estimate from ${features.complexity} ${features.taskType}: ${baseEstimate.toFixed(1)}h`);

    if (Math.abs(finalEstimate - baseEstimate) > 0.5) {
      reasoning.push(`Adjusted to ${finalEstimate.toFixed(1)}h based on historical patterns`);
    }

    if (features.dependencies && features.dependencies > 0) {
      reasoning.push(`Increased due to ${features.dependencies} dependencies`);
    }

    if (this.factorAverages.get('domain')?.has(features.domain)) {
      reasoning.push(`Domain-specific adjustment applied for ${features.domain}`);
    }

    if (features.assignee && this.factorAverages.get('assignee')?.has(features.assignee)) {
      reasoning.push(`Assignee-specific adjustment applied`);
    }

    return reasoning;
  }

  /**
   * Generate alternative predictions
   */
  private generateAlternatives(features: any, mainPrediction: number): Array<{
    prediction: any;
    confidence: number;
    reasoning: string;
  }> {
    const alternatives = [];

    // Conservative estimate (20% higher)
    alternatives.push({
      prediction: mainPrediction * 1.2,
      confidence: 0.7,
      reasoning: 'Conservative estimate with 20% buffer'
    });

    // Optimistic estimate (20% lower)
    alternatives.push({
      prediction: mainPrediction * 0.8,
      confidence: 0.6,
      reasoning: 'Optimistic estimate assuming ideal conditions'
    });

    return alternatives;
  }

  /**
   * Get default prediction when model is not trained
   */
  private getDefaultPrediction(features: any): LearningPrediction {
    const defaultEstimate = this.calculateBaseEstimate(features);
    
    return {
      type: 'estimation',
      prediction: defaultEstimate,
      confidence: 0.3,
      reasoning: ['Default estimate based on task type and complexity (model not trained)'],
      modelUsed: this.modelData.id,
      features
    };
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(): void {
    if (this.dataPoints.length === 0) return;

    const predictions = this.dataPoints.map(point => {
      // Ensure features have required properties for prediction
      const features: any = {
        taskType: point.features['taskType'] as TaskType,
        complexity: point.features['complexity'] as TaskComplexity,
        domain: point.features['domain'] as string
      };
      
      // Add optional properties only if they exist
      if (point.features['assignee']) {
        features.assignee = point.features['assignee'] as string;
      }
      if (point.features['dependencies']) {
        features.dependencies = point.features['dependencies'] as number;
      }
      if (point.features['tags']) {
        features.tags = point.features['tags'] as string[];
      }
      
      const pred = this.predict(features);
      return {
        predicted: pred.prediction as number,
        actual: point.target as number
      };
    });

    const errors = predictions.map(p => Math.abs(p.actual - p.predicted));
    const percentageErrors = predictions.map(p => 
      Math.abs((p.actual - p.predicted) / p.actual) * 100
    );
    const biases = predictions.map(p => p.predicted - p.actual);

    this.modelData.meanAbsoluteError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    this.modelData.meanAbsolutePercentageError = percentageErrors.reduce((sum, e) => sum + e, 0) / percentageErrors.length;
    this.modelData.estimationBias = biases.reduce((sum, b) => sum + b, 0) / biases.length;
    
    // Calculate accuracy as inverse of MAPE (capped at 95%)
    this.modelData.accuracy = Math.min(0.95, Math.max(0.1, 1 - (this.modelData.meanAbsolutePercentageError / 100)));
    this.modelData.confidence = this.modelData.accuracy * 0.9; // Slightly lower than accuracy
  }

  /**
   * Adjust factor weights based on performance
   */
  private adjustFactorWeights(): void {
    // Simple weight adjustment based on model performance
    if (this.modelData.meanAbsolutePercentageError < 20) {
      // Good performance, increase confidence in historical data
      this.modelData.factorWeights.historical = Math.min(0.2, this.modelData.factorWeights.historical + 0.01);
    } else if (this.modelData.meanAbsolutePercentageError > 40) {
      // Poor performance, rely more on basic factors
      this.modelData.factorWeights.complexity = Math.min(0.4, this.modelData.factorWeights.complexity + 0.01);
      this.modelData.factorWeights.taskType = Math.min(0.3, this.modelData.factorWeights.taskType + 0.01);
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.modelData.factorWeights).reduce((sum, w) => sum + w, 0);
    for (const key of Object.keys(this.modelData.factorWeights)) {
      this.modelData.factorWeights[key as keyof typeof this.modelData.factorWeights] /= totalWeight;
    }
  }

  /**
   * Update metrics incrementally
   */
  private updateMetricsIncremental(error: number, percentageError: number, bias: number): void {
    const alpha = this.learningRate;
    
    this.modelData.meanAbsoluteError = (1 - alpha) * this.modelData.meanAbsoluteError + alpha * error;
    this.modelData.meanAbsolutePercentageError = (1 - alpha) * this.modelData.meanAbsolutePercentageError + alpha * percentageError;
    this.modelData.estimationBias = (1 - alpha) * this.modelData.estimationBias + alpha * bias;
    
    // Update accuracy and confidence
    this.modelData.accuracy = Math.min(0.95, Math.max(0.1, 1 - (this.modelData.meanAbsolutePercentageError / 100)));
    this.modelData.confidence = this.modelData.accuracy * 0.9;
  }

  /**
   * Adjust weights based on feedback
   */
  private adjustWeightsBasedOnFeedback(prediction: LearningPrediction, actualHours: number): void {
    const error = Math.abs(actualHours - (prediction.prediction as number));
    const relativeError = error / actualHours;

    // If error is high, reduce confidence in the factors that contributed most
    if (relativeError > 0.3) {
      const features = prediction.features;
      
      // Reduce weight of factors that were heavily used in this prediction
      if (features['complexity']) {
        this.modelData.factorWeights.complexity *= 0.99;
      }
      if (features['domain'] && this.factorAverages.get('domain')?.has(features['domain'])) {
        this.modelData.factorWeights.domain *= 0.99;
      }
    }
  }
} 