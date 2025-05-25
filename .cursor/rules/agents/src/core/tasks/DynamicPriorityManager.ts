import { EventEmitter } from 'events';
import { 
  Task, 
  TaskPriority, 
  TaskComplexity,
  TaskStatus,
  TaskMetadata,
  TaskOperationResult
} from '../../types/TaskTypes';

/**
 * Dynamic Priority Manager
 * 
 * Intelligent priority assignment and adjustment system that considers multiple factors
 * including dependencies, deadlines, business value, and real-time conditions.
 */
export class DynamicPriorityManager extends EventEmitter {
  private priorityWeights: PriorityWeights;
  private adaptiveThresholds: AdaptiveThresholds;
  private priorityHistory: Map<string, PriorityHistoryEntry[]> = new Map();
  private lastCalculationTime: Map<string, number> = new Map();
  private globalPriorityContext: GlobalPriorityContext;

  constructor(config?: PriorityManagerConfig) {
    super();
    this.priorityWeights = { ...this.getDefaultWeights(), ...config?.weights };
    this.adaptiveThresholds = { ...this.getDefaultThresholds(), ...config?.thresholds };
    this.globalPriorityContext = {
      totalTasks: 0,
      urgentTasksCount: 0,
      averageComplexity: 'medium',
      systemLoad: 'normal',
      deadlinesPressure: 'normal'
    };
  }

  /**
   * Calculate dynamic priority for a task
   */
  public calculateDynamicPriority(
    task: Task,
    allTasks: Task[],
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>
  ): PriorityCalculationResult {
    const factors = this.analyzePriorityFactors(task, allTasks, dependencies, dependents);
    const score = this.computePriorityScore(factors);
    const suggestedPriority = this.mapScoreToPriority(score);
    const confidence = this.calculateConfidence(factors);

    const result: PriorityCalculationResult = {
      taskId: task.id,
      currentPriority: task.priority,
      suggestedPriority,
      priorityScore: score,
      confidence,
      factors,
      reasoning: this.generateReasoning(factors, suggestedPriority),
      shouldUpdate: this.shouldUpdatePriority(task.priority, suggestedPriority, confidence),
      lastCalculated: new Date().toISOString()
    };

    // Record calculation in history
    this.recordPriorityCalculation(task.id, result);
    this.lastCalculationTime.set(task.id, Date.now());

    return result;
  }

  /**
   * Batch calculate priorities for multiple tasks
   */
  public batchCalculatePriorities(
    tasks: Task[],
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>
  ): Map<string, PriorityCalculationResult> {
    const results = new Map<string, PriorityCalculationResult>();
    
    // Update global context
    this.updateGlobalContext(tasks);

    // Calculate priorities for all tasks
    for (const task of tasks) {
      const result = this.calculateDynamicPriority(task, tasks, dependencies, dependents);
      results.set(task.id, result);
    }

    // Apply global adjustments
    this.applyGlobalAdjustments(results, tasks);

    return results;
  }

  /**
   * Get priority adjustment recommendations
   */
  public getPriorityRecommendations(
    tasks: Task[],
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>
  ): PriorityRecommendation[] {
    const recommendations: PriorityRecommendation[] = [];
    const calculations = this.batchCalculatePriorities(tasks, dependencies, dependents);

    for (const [taskId, calculation] of calculations) {
      if (calculation.shouldUpdate && calculation.confidence >= 0.7) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          recommendations.push({
            taskId,
            currentPriority: calculation.currentPriority,
            recommendedPriority: calculation.suggestedPriority,
            reasoning: calculation.reasoning,
            confidence: calculation.confidence,
            impact: this.assessImpact(calculation),
            urgency: this.assessUrgency(task, calculation.factors),
            effort: 'low', // Priority changes are typically low effort
            factors: calculation.factors
          });
        }
      }
    }

    // Sort by confidence and impact
    return recommendations.sort((a, b) => {
      const aScore = a.confidence * this.getImpactWeight(a.impact);
      const bScore = b.confidence * this.getImpactWeight(b.impact);
      return bScore - aScore;
    });
  }

  /**
   * Apply priority adjustments automatically
   */
  public async applyAutomaticAdjustments(
    tasks: Task[],
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>,
    updateCallback: (taskId: string, newPriority: TaskPriority) => Promise<TaskOperationResult>
  ): Promise<PriorityAdjustmentResult[]> {
    const recommendations = this.getPriorityRecommendations(tasks, dependencies, dependents);
    const results: PriorityAdjustmentResult[] = [];

    for (const recommendation of recommendations) {
      // Only auto-apply high-confidence, low-risk adjustments
      if (recommendation.confidence >= 0.8 && recommendation.impact !== 'high') {
        try {
          const updateResult = await updateCallback(recommendation.taskId, recommendation.recommendedPriority);
          
          const resultData: PriorityAdjustmentResult = {
            taskId: recommendation.taskId,
            success: updateResult.success,
            oldPriority: recommendation.currentPriority,
            newPriority: recommendation.recommendedPriority,
            reasoning: recommendation.reasoning,
            confidence: recommendation.confidence
          };
          
          if (updateResult.error) {
            resultData.error = updateResult.error;
          }
          
          results.push(resultData);

          if (updateResult.success) {
            this.emit('priorityAdjusted', {
              taskId: recommendation.taskId,
              oldPriority: recommendation.currentPriority,
              newPriority: recommendation.recommendedPriority,
              automatic: true
            });
          }
        } catch (error) {
          results.push({
            taskId: recommendation.taskId,
            success: false,
            oldPriority: recommendation.currentPriority,
            newPriority: recommendation.recommendedPriority,
            reasoning: recommendation.reasoning,
            confidence: recommendation.confidence,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Analyze priority factors for a task
   */
  private analyzePriorityFactors(
    task: Task,
    allTasks: Task[],
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>
  ): PriorityFactors {
    return {
      deadline: this.analyzeDeadlineFactor(task),
      dependencies: this.analyzeDependencyFactor(task, dependencies, dependents, allTasks),
      businessValue: this.analyzeBusinessValueFactor(task),
      complexity: this.analyzeComplexityFactor(task),
      blockers: this.analyzeBlockersFactor(task, allTasks),
      progress: this.analyzeProgressFactor(task),
      assignee: this.analyzeAssigneeFactor(task),
      age: this.analyzeAgeFactor(task),
      riskLevel: this.analyzeRiskFactor(task),
      userImpact: this.analyzeUserImpactFactor(task)
    };
  }

  /**
   * Analyze deadline factor
   */
  private analyzeDeadlineFactor(task: Task): PriorityFactor {
    if (!task.dueDate) {
      return { score: 0.3, weight: 0.1, details: 'No deadline set' };
    }

    const now = Date.now();
    const dueDate = new Date(task.dueDate).getTime();
    const timeUntilDue = dueDate - now;
    const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24);

    let score = 0.5;
    let details = '';

    if (daysUntilDue < 0) {
      score = 1.0;
      details = `Overdue by ${Math.abs(daysUntilDue).toFixed(1)} days`;
    } else if (daysUntilDue <= 1) {
      score = 0.95;
      details = 'Due within 1 day';
    } else if (daysUntilDue <= 3) {
      score = 0.85;
      details = 'Due within 3 days';
    } else if (daysUntilDue <= 7) {
      score = 0.7;
      details = 'Due within 1 week';
    } else if (daysUntilDue <= 14) {
      score = 0.5;
      details = 'Due within 2 weeks';
    } else {
      score = 0.3;
      details = `Due in ${daysUntilDue.toFixed(1)} days`;
    }

    return {
      score,
      weight: 0.25,
      details,
      metadata: { daysUntilDue: daysUntilDue.toFixed(1) }
    };
  }

  /**
   * Analyze dependency factor
   */
  private analyzeDependencyFactor(
    task: Task,
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>,
    allTasks: Task[]
  ): PriorityFactor {
    const taskDependents = dependents.get(task.id) || [];
    const taskDependencies = dependencies.get(task.id) || [];
    
    let score = 0.5;
    let details = '';
    
    // Higher score if many tasks depend on this one
    if (taskDependents.length >= 5) {
      score = 0.9;
      details = `Blocks ${taskDependents.length} tasks`;
    } else if (taskDependents.length >= 3) {
      score = 0.8;
      details = `Blocks ${taskDependents.length} tasks`;
    } else if (taskDependents.length >= 1) {
      score = 0.7;
      details = `Blocks ${taskDependents.length} task(s)`;
    }

    // Adjust based on dependency status
    const blockedDependencies = taskDependencies.filter(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'completed';
    });

    if (blockedDependencies.length > 0) {
      score *= 0.7; // Reduce priority if blocked by dependencies
      details += `, blocked by ${blockedDependencies.length} dependencies`;
    }

    return {
      score,
      weight: 0.2,
      details,
      metadata: {
        dependentsCount: taskDependents.length,
        dependenciesCount: taskDependencies.length,
        blockedDependencies: blockedDependencies.length
      }
    };
  }

  /**
   * Analyze business value factor
   */
  private analyzeBusinessValueFactor(task: Task): PriorityFactor {
    const businessValue = task.metadata?.businessValue || 'medium';
    
    const valueScores: Record<string, number> = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'very-high': 1.0
    };

    const score = valueScores[businessValue] || 0.5;

    return {
      score,
      weight: 0.2,
      details: `Business value: ${businessValue}`,
      metadata: { businessValue }
    };
  }

  /**
   * Analyze complexity factor
   */
  private analyzeComplexityFactor(task: Task): PriorityFactor {
    // Higher complexity might need earlier attention for planning
    const complexityScores: Record<TaskComplexity, number> = {
      'trivial': 0.1,
      'simple': 0.3,
      'medium': 0.5,
      'complex': 0.7,
      'very_complex': 0.9
    };

    const score = complexityScores[task.complexity];

    return {
      score,
      weight: 0.1,
      details: `Complexity: ${task.complexity}`,
      metadata: { complexity: task.complexity }
    };
  }

  /**
   * Analyze blockers factor
   */
  private analyzeBlockersFactor(task: Task, allTasks: Task[]): PriorityFactor {
    const blockers = task.blockedBy || [];
    
    if (blockers.length === 0) {
      return {
        score: 0.8,
        weight: 0.15,
        details: 'No blockers',
        metadata: { blockersCount: 0 }
      };
    }

    const activeBlockers = blockers.filter(blockerId => {
      const blocker = allTasks.find(t => t.id === blockerId);
      return blocker && blocker.status !== 'completed';
    });

    let score = 0.2;
    if (activeBlockers.length === 0) {
      score = 0.8; // All blockers resolved
    } else if (activeBlockers.length <= 2) {
      score = 0.4; // Few blockers
    }

    return {
      score,
      weight: 0.15,
      details: `${activeBlockers.length} active blockers`,
      metadata: { 
        blockersCount: blockers.length,
        activeBlockers: activeBlockers.length
      }
    };
  }

  /**
   * Analyze progress factor
   */
  private analyzeProgressFactor(task: Task): PriorityFactor {
    const progress = task.progress;
    let score = 0.5;
    let details = '';

    if (progress >= 80) {
      score = 0.9;
      details = 'Near completion - high priority to finish';
    } else if (progress >= 50) {
      score = 0.7;
      details = 'In progress - maintain momentum';
    } else if (progress > 0) {
      score = 0.6;
      details = 'Started - continue progress';
    } else {
      score = 0.4;
      details = 'Not started';
    }

    return {
      score,
      weight: 0.1,
      details,
      metadata: { progress }
    };
  }

  /**
   * Additional analysis methods
   */
  private analyzeAssigneeFactor(task: Task): PriorityFactor {
    const hasAssignee = !!task.assignee;
    return {
      score: hasAssignee ? 0.7 : 0.3,
      weight: 0.05,
      details: hasAssignee ? 'Assigned' : 'Unassigned',
      metadata: { hasAssignee }
    };
  }

  private analyzeAgeFactor(task: Task): PriorityFactor {
    const ageInDays = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    let score = 0.5;
    
    if (ageInDays > 30) {
      score = 0.8; // Old tasks need attention
    } else if (ageInDays > 14) {
      score = 0.6;
    }

    return {
      score,
      weight: 0.05,
      details: `${ageInDays.toFixed(1)} days old`,
      metadata: { ageInDays }
    };
  }

  private analyzeRiskFactor(task: Task): PriorityFactor {
    const riskLevel = task.metadata?.technicalRisk || 'medium';
    const riskScores: Record<string, number> = {
      'low': 0.3,
      'medium': 0.5,
      'high': 0.8,
      'very-high': 0.9
    };

    return {
      score: riskScores[riskLevel] || 0.5,
      weight: 0.1,
      details: `Technical risk: ${riskLevel}`,
      metadata: { riskLevel }
    };
  }

  private analyzeUserImpactFactor(task: Task): PriorityFactor {
    const userImpact = task.metadata?.userImpact || 'medium';
    const impactScores: Record<string, number> = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'very-high': 1.0
    };

    return {
      score: impactScores[userImpact] || 0.5,
      weight: 0.15,
      details: `User impact: ${userImpact}`,
      metadata: { userImpact }
    };
  }

  /**
   * Compute overall priority score
   */
  private computePriorityScore(factors: PriorityFactors): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [factorName, factor] of Object.entries(factors)) {
      const weight = this.priorityWeights[factorName as keyof PriorityWeights] || factor.weight;
      totalScore += factor.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Map score to priority level
   */
  private mapScoreToPriority(score: number): TaskPriority {
    if (score >= this.adaptiveThresholds.critical) return 'critical';
    if (score >= this.adaptiveThresholds.urgent) return 'urgent';
    if (score >= this.adaptiveThresholds.high) return 'high';
    if (score >= this.adaptiveThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence in priority assessment
   */
  private calculateConfidence(factors: PriorityFactors): number {
    let confidence = 0.5;
    
    // Higher confidence if we have deadline information
    if (factors.deadline.score > 0.5) confidence += 0.2;
    
    // Higher confidence if we have business value info
    if (factors.businessValue.score !== 0.5) confidence += 0.1;
    
    // Higher confidence if task has clear dependencies
    if (factors.dependencies.metadata?.['dependentsCount'] > 0) confidence += 0.15;
    
    // Lower confidence if task is very new
    if (factors.age.metadata?.['ageInDays'] < 1) confidence -= 0.1;

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(factors: PriorityFactors, suggestedPriority: TaskPriority): string {
    const reasons: string[] = [];
    
    if (factors.deadline.score >= 0.8) {
      reasons.push(factors.deadline.details);
    }
    
    if (factors.dependencies.metadata?.['dependentsCount'] >= 3) {
      const metadata = factors.dependencies.metadata;
      if (metadata && typeof metadata['dependentsCount'] === 'number') {
        reasons.push(`blocks ${metadata['dependentsCount']} other tasks`);
      }
    }
    
    if (factors.businessValue.score >= 0.8) {
      reasons.push('high business value');
    }
    
    if (factors.progress.score >= 0.8) {
      reasons.push('near completion');
    }

    if (reasons.length === 0) {
      reasons.push('based on overall factor analysis');
    }

    return `Suggested ${suggestedPriority} priority: ${reasons.join(', ')}`;
  }

  /**
   * Determine if priority should be updated
   */
  private shouldUpdatePriority(
    currentPriority: TaskPriority,
    suggestedPriority: TaskPriority,
    confidence: number
  ): boolean {
    if (confidence < 0.6) return false;
    
    const priorityOrder = ['low', 'medium', 'high', 'urgent', 'critical'];
    const currentIndex = priorityOrder.indexOf(currentPriority);
    const suggestedIndex = priorityOrder.indexOf(suggestedPriority);
    
    // Only suggest changes if there's a significant difference
    return Math.abs(currentIndex - suggestedIndex) >= 1;
  }

  /**
   * Helper methods for configuration and context
   */
  private getDefaultWeights(): PriorityWeights {
    return {
      deadline: 0.25,
      dependencies: 0.2,
      businessValue: 0.2,
      complexity: 0.1,
      blockers: 0.15,
      progress: 0.1,
      assignee: 0.05,
      age: 0.05,
      riskLevel: 0.1,
      userImpact: 0.15
    };
  }

  private getDefaultThresholds(): AdaptiveThresholds {
    return {
      critical: 0.9,
      urgent: 0.75,
      high: 0.6,
      medium: 0.4,
      low: 0.0
    };
  }

  private updateGlobalContext(tasks: Task[]): void {
    this.globalPriorityContext.totalTasks = tasks.length;
    this.globalPriorityContext.urgentTasksCount = tasks.filter(
      t => t.priority === 'urgent' || t.priority === 'critical'
    ).length;
    
    // Calculate average complexity
    const complexityScores = tasks.map(t => {
      const scores = { trivial: 1, simple: 2, medium: 3, complex: 4, very_complex: 5 };
      return scores[t.complexity];
    });
    const avgComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
    
    if (avgComplexity >= 4) this.globalPriorityContext.averageComplexity = 'complex';
    else if (avgComplexity >= 3) this.globalPriorityContext.averageComplexity = 'medium';
    else this.globalPriorityContext.averageComplexity = 'simple';
  }

  private applyGlobalAdjustments(
    results: Map<string, PriorityCalculationResult>,
    tasks: Task[]
  ): void {
    // If too many urgent tasks, be more conservative
    const urgentRatio = this.globalPriorityContext.urgentTasksCount / this.globalPriorityContext.totalTasks;
    
    if (urgentRatio > 0.3) {
      for (const result of results.values()) {
        if (result.suggestedPriority === 'urgent' && result.confidence < 0.8) {
          result.suggestedPriority = 'high';
          result.reasoning += ' (adjusted due to high urgent task ratio)';
        }
      }
    }
  }

  private recordPriorityCalculation(taskId: string, result: PriorityCalculationResult): void {
    if (!this.priorityHistory.has(taskId)) {
      this.priorityHistory.set(taskId, []);
    }
    
    const history = this.priorityHistory.get(taskId)!;
    history.push({
      timestamp: new Date().toISOString(),
      priority: result.suggestedPriority,
      score: result.priorityScore,
      confidence: result.confidence,
      factors: result.factors
    });
    
    // Keep only last 10 entries
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  private assessImpact(calculation: PriorityCalculationResult): 'low' | 'medium' | 'high' {
    const priorityOrder = ['low', 'medium', 'high', 'urgent', 'critical'];
    const currentIndex = priorityOrder.indexOf(calculation.currentPriority);
    const suggestedIndex = priorityOrder.indexOf(calculation.suggestedPriority);
    const difference = Math.abs(currentIndex - suggestedIndex);
    
    if (difference >= 3) return 'high';
    if (difference >= 2) return 'medium';
    return 'low';
  }

  private assessUrgency(task: Task, factors: PriorityFactors): 'low' | 'medium' | 'high' {
    if (factors.deadline.score >= 0.9) return 'high';
    if (factors.deadline.score >= 0.7 || factors.dependencies.metadata?.['dependentsCount'] >= 5) return 'medium';
    return 'low';
  }

  private getImpactWeight(impact: 'low' | 'medium' | 'high'): number {
    const weights = { low: 1, medium: 1.5, high: 2 };
    return weights[impact];
  }
}

// Supporting interfaces and types
interface PriorityWeights {
  deadline: number;
  dependencies: number;
  businessValue: number;
  complexity: number;
  blockers: number;
  progress: number;
  assignee: number;
  age: number;
  riskLevel: number;
  userImpact: number;
}

interface AdaptiveThresholds {
  critical: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

interface PriorityManagerConfig {
  weights?: Partial<PriorityWeights>;
  thresholds?: Partial<AdaptiveThresholds>;
}

interface PriorityFactor {
  score: number; // 0-1
  weight: number; // 0-1
  details: string;
  metadata?: Record<string, any>;
}

interface PriorityFactors {
  deadline: PriorityFactor;
  dependencies: PriorityFactor;
  businessValue: PriorityFactor;
  complexity: PriorityFactor;
  blockers: PriorityFactor;
  progress: PriorityFactor;
  assignee: PriorityFactor;
  age: PriorityFactor;
  riskLevel: PriorityFactor;
  userImpact: PriorityFactor;
}

interface PriorityCalculationResult {
  taskId: string;
  currentPriority: TaskPriority;
  suggestedPriority: TaskPriority;
  priorityScore: number;
  confidence: number;
  factors: PriorityFactors;
  reasoning: string;
  shouldUpdate: boolean;
  lastCalculated: string;
}

interface PriorityRecommendation {
  taskId: string;
  currentPriority: TaskPriority;
  recommendedPriority: TaskPriority;
  reasoning: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  factors: PriorityFactors;
}

interface PriorityAdjustmentResult {
  taskId: string;
  success: boolean;
  oldPriority: TaskPriority;
  newPriority: TaskPriority;
  reasoning: string;
  confidence: number;
  error?: string;
}

interface PriorityHistoryEntry {
  timestamp: string;
  priority: TaskPriority;
  score: number;
  confidence: number;
  factors: PriorityFactors;
}

interface GlobalPriorityContext {
  totalTasks: number;
  urgentTasksCount: number;
  averageComplexity: TaskComplexity;
  systemLoad: 'low' | 'normal' | 'high';
  deadlinesPressure: 'low' | 'normal' | 'high';
} 