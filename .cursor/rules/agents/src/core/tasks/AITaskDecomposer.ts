import { EventEmitter } from 'events';
import { 
  Task, 
  CreateTaskInput, 
  TaskType, 
  TaskComplexity, 
  TaskPriority,
  TaskMetadata,
  AITaskGenerationContext,
  TaskTemplate,
  TaskOperationResult
} from '../../types/TaskTypes';

/**
 * AI Task Decomposition Engine
 * 
 * Intelligent system for automatically breaking down complex tasks into manageable sub-tasks
 * using natural language processing, complexity assessment, and pattern recognition.
 */
export class AITaskDecomposer extends EventEmitter {
  private decompositionRules: Map<string, DecompositionRule> = new Map();
  private taskPatterns: Map<string, TaskPattern> = new Map();
  private complexityThresholds: ComplexityThresholds;
  private templates: Map<string, TaskTemplate> = new Map();

  constructor() {
    super();
    this.complexityThresholds = {
      trivial: { maxSubtasks: 1, maxDepth: 1, maxHours: 2 },
      simple: { maxSubtasks: 3, maxDepth: 2, maxHours: 8 },
      medium: { maxSubtasks: 5, maxDepth: 3, maxHours: 20 },
      complex: { maxSubtasks: 8, maxDepth: 4, maxHours: 40 },
      very_complex: { maxSubtasks: 12, maxDepth: 5, maxHours: 80 }
    };
    this.initializeDecompositionRules();
    this.initializeTaskPatterns();
    this.initializeTaskTemplates();
  }

  /**
   * Decompose a task into sub-tasks using AI analysis
   */
  public async decomposeTask(
    task: Task, 
    context: AITaskGenerationContext,
    options: DecompositionOptions = {}
  ): Promise<DecompositionResult> {
    try {
      // Analyze task complexity and determine if decomposition is needed
      const analysis = await this.analyzeTaskComplexity(task, context);
      
      if (!this.shouldDecompose(task, analysis, options)) {
        return {
          success: true,
          originalTask: task,
          subtasks: [],
          analysis,
          reasoning: 'Task complexity does not warrant decomposition'
        };
      }

      // Generate sub-tasks based on analysis
      const subtasks = await this.generateSubtasks(task, analysis, context, options);
      
      // Validate and optimize the decomposition
      const optimizedSubtasks = await this.optimizeDecomposition(subtasks, task, context);
      
      // Emit decomposition event
      this.emit('taskDecomposed', {
        originalTask: task,
        subtasks: optimizedSubtasks,
        analysis
      });

      return {
        success: true,
        originalTask: task,
        subtasks: optimizedSubtasks,
        analysis,
        reasoning: `Task decomposed into ${optimizedSubtasks.length} sub-tasks based on complexity analysis`
      };

    } catch (error) {
      return {
        success: false,
        originalTask: task,
        subtasks: [],
        error: error instanceof Error ? error.message : 'Unknown decomposition error'
      };
    }
  }

  /**
   * Analyze task complexity using multiple factors
   */
  private async analyzeTaskComplexity(
    task: Task, 
    context: AITaskGenerationContext
  ): Promise<TaskComplexityAnalysis> {
    const factors: ComplexityFactor[] = [];
    
    // Analyze description length and complexity
    const descriptionAnalysis = this.analyzeDescription(task.description);
    factors.push({
      type: 'description_complexity',
      score: descriptionAnalysis.complexityScore,
      weight: 0.3,
      details: descriptionAnalysis
    });

    // Analyze task type patterns
    const typeAnalysis = this.analyzeTaskType(task.type, task.description);
    factors.push({
      type: 'task_type_complexity',
      score: typeAnalysis.complexityScore,
      weight: 0.2,
      details: typeAnalysis
    });

    // Analyze estimated effort
    const effortAnalysis = this.analyzeEstimatedEffort(task.estimatedHours);
    factors.push({
      type: 'effort_complexity',
      score: effortAnalysis.complexityScore,
      weight: 0.25,
      details: effortAnalysis
    });

    // Analyze domain complexity
    const domainAnalysis = this.analyzeDomain(task.metadata?.domain || 'general');
    factors.push({
      type: 'domain_complexity',
      score: domainAnalysis.complexityScore,
      weight: 0.15,
      details: domainAnalysis
    });

    // Analyze context and dependencies
    const contextAnalysis = this.analyzeContext(context, task);
    factors.push({
      type: 'context_complexity',
      score: contextAnalysis.complexityScore,
      weight: 0.1,
      details: contextAnalysis
    });

    // Calculate overall complexity score
    const overallScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    // Determine suggested decomposition approach
    const decompositionApproach = this.determineDecompositionApproach(factors, task);

    return {
      overallComplexityScore: overallScore,
      suggestedComplexity: this.mapScoreToComplexity(overallScore),
      factors,
      decompositionApproach,
      recommendedSubtaskCount: this.calculateRecommendedSubtaskCount(overallScore, task),
      estimatedDecompositionDepth: this.calculateDecompositionDepth(overallScore)
    };
  }

  /**
   * Generate sub-tasks based on complexity analysis
   */
  private async generateSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext,
    options: DecompositionOptions
  ): Promise<CreateTaskInput[]> {
    const subtasks: CreateTaskInput[] = [];
    const approach = analysis.decompositionApproach;

    switch (approach.strategy) {
      case 'sequential':
        subtasks.push(...await this.generateSequentialSubtasks(task, analysis, context));
        break;
      case 'parallel':
        subtasks.push(...await this.generateParallelSubtasks(task, analysis, context));
        break;
      case 'hierarchical':
        subtasks.push(...await this.generateHierarchicalSubtasks(task, analysis, context));
        break;
      case 'template_based':
        subtasks.push(...await this.generateTemplateBasedSubtasks(task, analysis, context));
        break;
      default:
        subtasks.push(...await this.generateGenericSubtasks(task, analysis, context));
    }

    // Apply options and constraints
    return this.applyDecompositionConstraints(subtasks, options, task);
  }

  /**
   * Generate sequential sub-tasks (one after another)
   */
  private async generateSequentialSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    const subtasks: CreateTaskInput[] = [];
    const phases = this.identifyTaskPhases(task.description, task.type);

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      if (!phase) continue; // Skip if phase is undefined
      
      const subtask: CreateTaskInput = {
        title: `${phase.name}`,
        description: phase.description,
        type: this.determineSubtaskType(phase.type, task.type),
        priority: this.calculateSubtaskPriority(task.priority, i, phases.length),
        complexity: this.calculateSubtaskComplexity(phase.complexity, task.complexity),
        parent: task.id,
        estimatedHours: Math.ceil((task.estimatedHours || 8) * phase.effortRatio),
        tags: [...(task.tags || []), phase.category],
        metadata: {
          ...task.metadata,
          phase: phase.name,
          sequenceOrder: i + 1,
          generatedBy: 'ai_decomposer',
          decompositionStrategy: 'sequential'
        }
      };

      // Add dependency to previous subtask
      if (i > 0) {
        subtask.dependencies = [`${task.id}_phase_${i}`];
      }

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Generate parallel sub-tasks (can be done simultaneously)
   */
  private async generateParallelSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    const subtasks: CreateTaskInput[] = [];
    const components = this.identifyTaskComponents(task.description, task.type);

    for (const component of components) {
      const subtask: CreateTaskInput = {
        title: `${component.name}`,
        description: component.description,
        type: this.determineSubtaskType(component.type, task.type),
        priority: task.priority,
        complexity: this.calculateSubtaskComplexity(component.complexity, task.complexity),
        parent: task.id,
        estimatedHours: Math.ceil((task.estimatedHours || 8) * component.effortRatio),
        tags: [...(task.tags || []), component.category],
        metadata: {
          ...task.metadata,
          component: component.name,
          generatedBy: 'ai_decomposer',
          decompositionStrategy: 'parallel'
        }
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Generate hierarchical sub-tasks (nested structure)
   */
  private async generateHierarchicalSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    const subtasks: CreateTaskInput[] = [];
    const hierarchy = this.buildTaskHierarchy(task.description, task.type, analysis);

    for (const level of hierarchy.levels) {
      for (const item of level.items) {
        const subtask: CreateTaskInput = {
          title: item.title,
          description: item.description,
          type: this.determineSubtaskType(item.type, task.type),
          priority: this.calculateSubtaskPriority(task.priority, item.level, hierarchy.maxLevel),
          complexity: item.complexity,
          parent: item.parentId || task.id,
          estimatedHours: item.estimatedHours,
          tags: [...(task.tags || []), ...item.tags],
          metadata: {
            ...task.metadata,
            hierarchyLevel: item.level,
            generatedBy: 'ai_decomposer',
            decompositionStrategy: 'hierarchical'
          }
        };

        subtasks.push(subtask);
      }
    }

    return subtasks;
  }

  /**
   * Generate template-based sub-tasks
   */
  private async generateTemplateBasedSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    const template = this.findBestTemplate(task, analysis);
    if (!template) {
      return this.generateGenericSubtasks(task, analysis, context);
    }

    const subtasks: CreateTaskInput[] = [];

    if (template.subtaskTemplates) {
      for (const subTemplate of template.subtaskTemplates) {
        const subtask: CreateTaskInput = {
          title: this.customizeTemplateTitle(subTemplate.name, task),
          description: this.customizeTemplateDescription(subTemplate.description, task),
          type: subTemplate.type,
          priority: subTemplate.defaultPriority,
          complexity: subTemplate.defaultComplexity,
          parent: task.id,
          estimatedHours: subTemplate.estimatedHours,
          tags: [...(task.tags || []), ...subTemplate.tags],
          metadata: {
            ...task.metadata,
            ...subTemplate.metadata,
            generatedBy: 'ai_decomposer',
            decompositionStrategy: 'template_based',
            templateId: template.id
          }
        };

        subtasks.push(subtask);
      }
    }

    return subtasks;
  }

  /**
   * Generate generic sub-tasks as fallback
   */
  private async generateGenericSubtasks(
    task: Task,
    analysis: TaskComplexityAnalysis,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    const subtasks: CreateTaskInput[] = [];
    const subtaskCount = Math.min(analysis.recommendedSubtaskCount, 6);
    const baseEffort = (task.estimatedHours || 8) / subtaskCount;

    const genericPhases = [
      { name: 'Analysis & Planning', ratio: 0.2, type: 'research' },
      { name: 'Design & Architecture', ratio: 0.25, type: 'design' },
      { name: 'Implementation', ratio: 0.4, type: 'implementation' },
      { name: 'Testing & Validation', ratio: 0.15, type: 'testing' }
    ];

    for (let i = 0; i < Math.min(subtaskCount, genericPhases.length); i++) {
      const phase = genericPhases[i];
      if (!phase) continue; // Skip if phase is undefined
      
      const subtask: CreateTaskInput = {
        title: `${task.title} - ${phase.name}`,
        description: `${phase.name} phase for: ${task.description}`,
        type: this.mapPhaseTypeToTaskType(phase.type),
        priority: task.priority,
        complexity: this.reduceComplexity(task.complexity),
        parent: task.id,
        estimatedHours: Math.ceil(baseEffort * phase.ratio),
        tags: [...(task.tags || []), phase.type],
        metadata: {
          ...task.metadata,
          phase: phase.name,
          generatedBy: 'ai_decomposer',
          decompositionStrategy: 'generic'
        }
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Initialize decomposition rules
   */
  private initializeDecompositionRules(): void {
    // Epic decomposition rules
    this.decompositionRules.set('epic', {
      minComplexity: 'complex',
      maxSubtasks: 8,
      preferredStrategy: 'hierarchical',
      patterns: ['feature_breakdown', 'user_story_mapping']
    });

    // Feature decomposition rules
    this.decompositionRules.set('feature', {
      minComplexity: 'medium',
      maxSubtasks: 6,
      preferredStrategy: 'sequential',
      patterns: ['development_lifecycle', 'component_breakdown']
    });

    // Task decomposition rules
    this.decompositionRules.set('task', {
      minComplexity: 'medium',
      maxSubtasks: 4,
      preferredStrategy: 'parallel',
      patterns: ['work_breakdown', 'skill_separation']
    });
  }

  /**
   * Initialize task patterns for recognition
   */
  private initializeTaskPatterns(): void {
    // Development patterns
    this.taskPatterns.set('api_development', {
      keywords: ['api', 'endpoint', 'rest', 'graphql', 'service'],
      complexity: 'medium',
      suggestedSubtasks: ['design', 'implementation', 'testing', 'documentation'],
      estimatedHours: 16
    });

    this.taskPatterns.set('ui_component', {
      keywords: ['component', 'ui', 'interface', 'frontend', 'react', 'vue'],
      complexity: 'simple',
      suggestedSubtasks: ['design', 'implementation', 'styling', 'testing'],
      estimatedHours: 12
    });

    this.taskPatterns.set('database_schema', {
      keywords: ['database', 'schema', 'migration', 'model', 'table'],
      complexity: 'medium',
      suggestedSubtasks: ['design', 'migration', 'validation', 'testing'],
      estimatedHours: 10
    });

    this.taskPatterns.set('ai_algorithm', {
      keywords: ['ai', 'algorithm', 'machine learning', 'neural', 'model'],
      complexity: 'complex',
      suggestedSubtasks: ['research', 'design', 'implementation', 'training', 'validation'],
      estimatedHours: 32
    });
  }

  /**
   * Initialize task templates
   */
  private initializeTaskTemplates(): void {
    // API Development Template
    this.templates.set('api_development', {
      id: 'api_development',
      name: 'API Development',
      description: 'Standard template for API development tasks',
      type: 'feature',
      defaultPriority: 'medium',
      defaultComplexity: 'medium',
      estimatedHours: 16,
      tags: ['api', 'backend'],
      subtaskTemplates: [
        {
          id: 'api_design',
          name: 'API Design',
          description: 'Design API endpoints and data structures',
          type: 'task',
          defaultPriority: 'high',
          defaultComplexity: 'simple',
          estimatedHours: 4,
          tags: ['design', 'api'],
          metadata: { phase: 'design' }
        },
        {
          id: 'api_implementation',
          name: 'API Implementation',
          description: 'Implement API endpoints and business logic',
          type: 'task',
          defaultPriority: 'high',
          defaultComplexity: 'medium',
          estimatedHours: 8,
          tags: ['implementation', 'api'],
          metadata: { phase: 'implementation' }
        },
        {
          id: 'api_testing',
          name: 'API Testing',
          description: 'Create and run API tests',
          type: 'task',
          defaultPriority: 'medium',
          defaultComplexity: 'simple',
          estimatedHours: 4,
          tags: ['testing', 'api'],
          metadata: { phase: 'testing' }
        }
      ],
      metadata: { domain: 'backend', framework: 'node.js' }
    });
  }

  /**
   * Helper methods for analysis and generation
   */
  private analyzeDescription(description: string): DescriptionAnalysis {
    const words = description.split(/\s+/).length;
    const sentences = description.split(/[.!?]+/).length;
    const complexity = this.calculateDescriptionComplexity(description);
    
    return {
      wordCount: words,
      sentenceCount: sentences,
      complexityScore: complexity,
      keyPhrases: this.extractKeyPhrases(description),
      actionWords: this.extractActionWords(description)
    };
  }

  private calculateDescriptionComplexity(description: string): number {
    let score = 0;
    
    // Length factor
    score += Math.min(description.length / 500, 1) * 0.3;
    
    // Technical terms
    const technicalTerms = ['algorithm', 'implementation', 'integration', 'optimization', 'architecture'];
    const technicalCount = technicalTerms.filter(term => 
      description.toLowerCase().includes(term)
    ).length;
    score += (technicalCount / technicalTerms.length) * 0.4;
    
    // Action complexity
    const complexActions = ['design', 'implement', 'integrate', 'optimize', 'analyze'];
    const actionCount = complexActions.filter(action => 
      description.toLowerCase().includes(action)
    ).length;
    score += (actionCount / complexActions.length) * 0.3;
    
    return Math.min(score, 1);
  }

  private shouldDecompose(
    task: Task, 
    analysis: TaskComplexityAnalysis, 
    options: DecompositionOptions
  ): boolean {
    // Check minimum complexity threshold
    if (analysis.overallComplexityScore < 0.6) return false;
    
    // Check estimated hours threshold
    if ((task.estimatedHours || 0) < 8) return false;
    
    // Check if task type supports decomposition
    const rule = this.decompositionRules.get(task.type);
    if (rule && this.compareComplexity(task.complexity, rule.minComplexity) < 0) {
      return false;
    }
    
    // Check options
    if (options.forceDecompose) return true;
    if (options.preventDecompose) return false;
    
    return true;
  }

  private mapScoreToComplexity(score: number): TaskComplexity {
    if (score < 0.2) return 'trivial';
    if (score < 0.4) return 'simple';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'complex';
    return 'very_complex';
  }

  private compareComplexity(a: TaskComplexity, b: TaskComplexity): number {
    const order = ['trivial', 'simple', 'medium', 'complex', 'very_complex'];
    return order.indexOf(a) - order.indexOf(b);
  }

  // Additional helper methods would be implemented here...
  private extractKeyPhrases(description: string): string[] {
    // Simple keyword extraction - in a real implementation, this would use NLP
    const words = description.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return words.filter(word => word.length > 3 && !stopWords.has(word)).slice(0, 10);
  }

  private extractActionWords(description: string): string[] {
    const actionWords = ['create', 'build', 'implement', 'design', 'develop', 'test', 'analyze', 'optimize'];
    return actionWords.filter(action => description.toLowerCase().includes(action));
  }

  // Placeholder methods that would be fully implemented
  private analyzeTaskType(type: TaskType, description: string): any {
    return { complexityScore: 0.5 };
  }

  private analyzeEstimatedEffort(hours: number | null): any {
    const score = hours ? Math.min(hours / 40, 1) : 0.5;
    return { complexityScore: score };
  }

  private analyzeDomain(domain: string): any {
    const complexDomains = ['ai', 'machine-learning', 'algorithms', 'architecture'];
    const score = complexDomains.includes(domain.toLowerCase()) ? 0.8 : 0.4;
    return { complexityScore: score };
  }

  private analyzeContext(context: AITaskGenerationContext, task: Task): any {
    return { complexityScore: 0.3 };
  }

  private determineDecompositionApproach(factors: ComplexityFactor[], task: Task): DecompositionApproach {
    return {
      strategy: 'sequential',
      reasoning: 'Default sequential approach for medium complexity tasks'
    };
  }

  private calculateRecommendedSubtaskCount(score: number, task: Task): number {
    const base = Math.ceil(score * 6);
    const hours = task.estimatedHours || 8;
    const hoursBased = Math.ceil(hours / 8);
    return Math.min(Math.max(base, hoursBased), 8);
  }

  private calculateDecompositionDepth(score: number): number {
    return Math.min(Math.ceil(score * 3), 3);
  }

  private identifyTaskPhases(description: string, type: TaskType): TaskPhase[] {
    return [
      { name: 'Planning', description: 'Plan and analyze requirements', type: 'analysis', complexity: 'simple', effortRatio: 0.2, category: 'planning' },
      { name: 'Implementation', description: 'Implement the solution', type: 'implementation', complexity: 'medium', effortRatio: 0.6, category: 'development' },
      { name: 'Testing', description: 'Test and validate', type: 'testing', complexity: 'simple', effortRatio: 0.2, category: 'validation' }
    ];
  }

  private identifyTaskComponents(description: string, type: TaskType): TaskComponent[] {
    return [
      { name: 'Core Logic', description: 'Main functionality', type: 'implementation', complexity: 'medium', effortRatio: 0.5, category: 'core' },
      { name: 'Interface', description: 'User interface', type: 'implementation', complexity: 'simple', effortRatio: 0.3, category: 'ui' },
      { name: 'Integration', description: 'System integration', type: 'implementation', complexity: 'simple', effortRatio: 0.2, category: 'integration' }
    ];
  }

  private buildTaskHierarchy(description: string, type: TaskType, analysis: TaskComplexityAnalysis): TaskHierarchyStructure {
    return {
      levels: [
        {
          level: 1,
          items: [
            {
              title: 'Main Implementation',
              description: 'Primary implementation task',
              type: 'implementation',
              complexity: 'medium',
              level: 1,
              estimatedHours: 8,
              tags: ['main'],
              parentId: null
            }
          ]
        }
      ],
      maxLevel: 1
    };
  }

  private findBestTemplate(task: Task, analysis: TaskComplexityAnalysis): TaskTemplate | null {
    for (const [key, pattern] of this.taskPatterns) {
      if (pattern.keywords.some(keyword => 
        task.description.toLowerCase().includes(keyword) || 
        task.title.toLowerCase().includes(keyword)
      )) {
        return this.templates.get(key) || null;
      }
    }
    return null;
  }

  private customizeTemplateTitle(templateTitle: string, task: Task): string {
    return `${task.title} - ${templateTitle}`;
  }

  private customizeTemplateDescription(templateDesc: string, task: Task): string {
    return `${templateDesc} for: ${task.description}`;
  }

  private determineSubtaskType(suggestedType: string, parentType: TaskType): TaskType {
    const typeMap: Record<string, TaskType> = {
      'analysis': 'research',
      'design': 'task',
      'implementation': 'task',
      'testing': 'task',
      'research': 'research'
    };
    return typeMap[suggestedType] || 'task';
  }

  private calculateSubtaskPriority(parentPriority: TaskPriority, index: number, total: number): TaskPriority {
    if (index === 0) return parentPriority; // First task keeps parent priority
    if (index === total - 1) return 'medium'; // Last task is medium
    return 'medium';
  }

  private calculateSubtaskComplexity(suggestedComplexity: TaskComplexity, parentComplexity: TaskComplexity): TaskComplexity {
    const complexityOrder = ['trivial', 'simple', 'medium', 'complex', 'very_complex'];
    const parentIndex = complexityOrder.indexOf(parentComplexity);
    const suggestedIndex = complexityOrder.indexOf(suggestedComplexity);
    
    // Subtasks should generally be less complex than parent
    const maxIndex = Math.max(0, parentIndex - 1);
    const targetIndex = Math.min(suggestedIndex, maxIndex);
    
    return complexityOrder[targetIndex] as TaskComplexity;
  }

  private mapPhaseTypeToTaskType(phaseType: string): TaskType {
    const mapping: Record<string, TaskType> = {
      'research': 'research',
      'design': 'task',
      'implementation': 'task',
      'testing': 'task'
    };
    return mapping[phaseType] || 'task';
  }

  private reduceComplexity(complexity: TaskComplexity): TaskComplexity {
    const order = ['trivial', 'simple', 'medium', 'complex', 'very_complex'];
    const index = order.indexOf(complexity);
    return order[Math.max(0, index - 1)] as TaskComplexity;
  }

  private async optimizeDecomposition(
    subtasks: CreateTaskInput[],
    originalTask: Task,
    context: AITaskGenerationContext
  ): Promise<CreateTaskInput[]> {
    // Remove duplicates, optimize effort distribution, etc.
    return subtasks;
  }

  private applyDecompositionConstraints(
    subtasks: CreateTaskInput[],
    options: DecompositionOptions,
    originalTask: Task
  ): CreateTaskInput[] {
    let result = [...subtasks];
    
    if (options.maxSubtasks) {
      result = result.slice(0, options.maxSubtasks);
    }
    
    if (options.minSubtasks && result.length < options.minSubtasks) {
      // Add generic subtasks to meet minimum
      while (result.length < options.minSubtasks) {
        result.push({
          title: `${originalTask.title} - Additional Task ${result.length + 1}`,
          description: `Additional subtask for ${originalTask.description}`,
          type: 'task',
          priority: originalTask.priority,
          complexity: this.reduceComplexity(originalTask.complexity),
          parent: originalTask.id,
          estimatedHours: 4,
          tags: [...(originalTask.tags || []), 'generated'],
          metadata: {
            ...originalTask.metadata,
            generatedBy: 'ai_decomposer',
            decompositionStrategy: 'constraint_fill'
          }
        });
      }
    }
    
    return result;
  }
}

// Supporting interfaces and types
interface DecompositionRule {
  minComplexity: TaskComplexity;
  maxSubtasks: number;
  preferredStrategy: 'sequential' | 'parallel' | 'hierarchical' | 'template_based';
  patterns: string[];
}

interface TaskPattern {
  keywords: string[];
  complexity: TaskComplexity;
  suggestedSubtasks: string[];
  estimatedHours: number;
}

interface ComplexityThresholds {
  [key: string]: {
    maxSubtasks: number;
    maxDepth: number;
    maxHours: number;
  };
}

interface ComplexityFactor {
  type: string;
  score: number;
  weight: number;
  details: any;
}

interface TaskComplexityAnalysis {
  overallComplexityScore: number;
  suggestedComplexity: TaskComplexity;
  factors: ComplexityFactor[];
  decompositionApproach: DecompositionApproach;
  recommendedSubtaskCount: number;
  estimatedDecompositionDepth: number;
}

interface DecompositionApproach {
  strategy: 'sequential' | 'parallel' | 'hierarchical' | 'template_based' | 'generic';
  reasoning: string;
}

interface DecompositionOptions {
  maxSubtasks?: number;
  minSubtasks?: number;
  maxDepth?: number;
  forceDecompose?: boolean;
  preventDecompose?: boolean;
  preferredStrategy?: string;
}

interface DecompositionResult {
  success: boolean;
  originalTask: Task;
  subtasks: CreateTaskInput[];
  analysis?: TaskComplexityAnalysis;
  reasoning?: string;
  error?: string;
}

interface DescriptionAnalysis {
  wordCount: number;
  sentenceCount: number;
  complexityScore: number;
  keyPhrases: string[];
  actionWords: string[];
}

interface TaskPhase {
  name: string;
  description: string;
  type: string;
  complexity: TaskComplexity;
  effortRatio: number;
  category: string;
}

interface TaskComponent {
  name: string;
  description: string;
  type: string;
  complexity: TaskComplexity;
  effortRatio: number;
  category: string;
}

interface TaskHierarchyStructure {
  levels: {
    level: number;
    items: {
      title: string;
      description: string;
      type: string;
      complexity: TaskComplexity;
      level: number;
      estimatedHours: number;
      tags: string[];
      parentId: string | null;
    }[];
  }[];
  maxLevel: number;
} 