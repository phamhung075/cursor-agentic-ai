import { EventEmitter } from 'events';
import { TaskManager } from './TaskManager';
import { AITaskDecomposer } from './AITaskDecomposer';
import { 
  Task, 
  CreateTaskInput, 
  AITaskGenerationContext,
  TaskOperationResult,
  TaskRecommendation
} from '../../types/TaskTypes';

/**
 * AI Task Service
 * 
 * High-level service that combines TaskManager with AITaskDecomposer
 * to provide intelligent task management with AI-driven decomposition.
 */
export class AITaskService extends EventEmitter {
  private taskManager: TaskManager;
  private decomposer: AITaskDecomposer;

  constructor(maxHierarchyDepth: number = 10) {
    super();
    this.taskManager = new TaskManager(maxHierarchyDepth);
    this.decomposer = new AITaskDecomposer();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for cross-component communication
   */
  private setupEventHandlers(): void {
    // Forward TaskManager events
    this.taskManager.on('taskCreated', (event) => this.emit('taskCreated', event));
    this.taskManager.on('taskUpdated', (event) => this.emit('taskUpdated', event));
    this.taskManager.on('taskDeleted', (event) => this.emit('taskDeleted', event));

    // Handle decomposition events
    this.decomposer.on('taskDecomposed', async (event) => {
      this.emit('taskDecomposed', event);
      
      // Automatically create subtasks if decomposition was successful
      if (event.subtasks && event.subtasks.length > 0) {
        await this.createSubtasksFromDecomposition(event.subtasks);
      }
    });
  }

  /**
   * Create a task with optional AI decomposition
   */
  public async createTaskWithDecomposition(
    input: CreateTaskInput,
    context: AITaskGenerationContext,
    autoDecompose: boolean = true
  ): Promise<TaskOperationResult & { subtasks?: TaskOperationResult[] }> {
    // Create the main task first
    const taskResult = await this.taskManager.createTask(input);
    
    if (!taskResult.success) {
      return taskResult;
    }

    const task = this.taskManager.getTask(taskResult.taskId);
    if (!task) {
      return {
        success: false,
        taskId: taskResult.taskId,
        error: 'Task was created but could not be retrieved'
      };
    }

    // Attempt AI decomposition if enabled
    let subtaskResults: TaskOperationResult[] = [];
    if (autoDecompose) {
      const decompositionResult = await this.decomposer.decomposeTask(task, context);
      
      if (decompositionResult.success && decompositionResult.subtasks.length > 0) {
        subtaskResults = await this.createSubtasksFromDecomposition(decompositionResult.subtasks);
      }
    }

    return {
      ...taskResult,
      subtasks: subtaskResults
    };
  }

  /**
   * Decompose an existing task into subtasks
   */
  public async decomposeExistingTask(
    taskId: string,
    context: AITaskGenerationContext,
    options?: any
  ): Promise<TaskOperationResult & { subtasks?: TaskOperationResult[] }> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      return {
        success: false,
        taskId,
        error: 'Task not found'
      };
    }

    const decompositionResult = await this.decomposer.decomposeTask(task, context, options);
    
    if (!decompositionResult.success) {
      return {
        success: false,
        taskId,
        error: decompositionResult.error || 'Decomposition failed'
      };
    }

    let subtaskResults: TaskOperationResult[] = [];
    if (decompositionResult.subtasks.length > 0) {
      subtaskResults = await this.createSubtasksFromDecomposition(decompositionResult.subtasks);
    }

    return {
      success: true,
      taskId,
      subtasks: subtaskResults,
      metadata: {
        decompositionAnalysis: decompositionResult.analysis,
        reasoning: decompositionResult.reasoning
      }
    };
  }

  /**
   * Get AI-driven task recommendations
   */
  public async getAIRecommendations(taskId?: string): Promise<TaskRecommendation[]> {
    const managerRecommendations = this.taskManager.generateRecommendations(taskId);
    
    // Add AI-specific recommendations
    const aiRecommendations: TaskRecommendation[] = [];
    
    const tasks = taskId ? [this.taskManager.getTask(taskId)].filter(Boolean) as Task[] : this.taskManager.queryTasks();
    
    for (const task of tasks) {
      // Recommend decomposition for complex tasks without children
      const children = this.taskManager.getTaskHierarchy(task.id)?.children || [];
      if (children.length === 0 && task.complexity === 'complex' || task.complexity === 'very_complex') {
        aiRecommendations.push({
          type: 'priority_adjustment',
          taskId: task.id,
          recommendation: 'Consider decomposing this complex task into smaller subtasks',
          reasoning: `Task "${task.title}" has ${task.complexity} complexity but no subtasks`,
          confidence: 0.8,
          impact: 'high',
          effort: 'medium'
        });
      }

      // Recommend AI analysis for tasks with vague descriptions
      if (task.description.split(' ').length < 10) {
        aiRecommendations.push({
          type: 'resource_allocation',
          taskId: task.id,
          recommendation: 'Task description could benefit from AI-assisted expansion',
          reasoning: 'Short task descriptions may lack important details',
          confidence: 0.6,
          impact: 'medium',
          effort: 'low'
        });
      }
    }

    return [...managerRecommendations, ...aiRecommendations];
  }

  /**
   * Auto-decompose all eligible tasks
   */
  public async autoDecomposeEligibleTasks(context: AITaskGenerationContext): Promise<TaskOperationResult[]> {
    const results: TaskOperationResult[] = [];
    const tasks = this.taskManager.queryTasks();
    
    for (const task of tasks) {
      // Check if task is eligible for decomposition
      if (this.isEligibleForDecomposition(task)) {
        const result = await this.decomposeExistingTask(task.id, context);
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Generate project context for AI decomposition
   */
  public generateProjectContext(projectDescription: string, existingTasks?: Task[]): AITaskGenerationContext {
    const tasks = existingTasks || this.taskManager.queryTasks();
    
    return {
      projectContext: projectDescription,
      requirements: this.extractRequirementsFromTasks(tasks),
      constraints: this.extractConstraintsFromTasks(tasks),
      preferences: {
        maxDepth: 4,
        preferredComplexity: 'medium',
        timeframe: '2-4 weeks'
      },
      existingTasks: tasks
    };
  }

  /**
   * Batch process tasks with AI analysis
   */
  public async batchProcessWithAI(
    taskIds: string[],
    context: AITaskGenerationContext,
    operations: ('decompose' | 'analyze' | 'optimize')[]
  ): Promise<Map<string, TaskOperationResult>> {
    const results = new Map<string, TaskOperationResult>();
    
    for (const taskId of taskIds) {
      const task = this.taskManager.getTask(taskId);
      if (!task) {
        results.set(taskId, {
          success: false,
          taskId,
          error: 'Task not found'
        });
        continue;
      }

      let result: TaskOperationResult = { success: true, taskId };

      for (const operation of operations) {
        switch (operation) {
          case 'decompose':
            if (this.isEligibleForDecomposition(task)) {
              result = await this.decomposeExistingTask(taskId, context);
            }
            break;
          case 'analyze':
            // Perform AI analysis and update task metadata
            result = await this.analyzeAndUpdateTask(taskId, context);
            break;
          case 'optimize':
            // Optimize task properties based on AI recommendations
            result = await this.optimizeTask(taskId);
            break;
        }

        if (!result.success) break;
      }

      results.set(taskId, result);
    }

    return results;
  }

  // Delegate methods to TaskManager
  public async createTask(input: CreateTaskInput): Promise<TaskOperationResult> {
    return this.taskManager.createTask(input);
  }

  public async updateTask(taskId: string, updates: any): Promise<TaskOperationResult> {
    return this.taskManager.updateTask(taskId, updates);
  }

  public async deleteTask(taskId: string, cascadeDelete?: boolean): Promise<TaskOperationResult> {
    return this.taskManager.deleteTask(taskId, cascadeDelete);
  }

  public getTask(taskId: string): Task | null {
    return this.taskManager.getTask(taskId);
  }

  public queryTasks(filter?: any, sort?: any): Task[] {
    return this.taskManager.queryTasks(filter, sort);
  }

  public getTaskHierarchy(taskId: string) {
    return this.taskManager.getTaskHierarchy(taskId);
  }

  public getRootTasks(): Task[] {
    return this.taskManager.getRootTasks();
  }

  public getStatistics() {
    return this.taskManager.getStatistics();
  }

  public exportTasks(): string {
    return this.taskManager.exportTasks();
  }

  public async importTasks(jsonData: string): Promise<TaskOperationResult[]> {
    return this.taskManager.importTasks(jsonData);
  }

  /**
   * Private helper methods
   */
  private async createSubtasksFromDecomposition(subtaskInputs: CreateTaskInput[]): Promise<TaskOperationResult[]> {
    const results: TaskOperationResult[] = [];
    
    for (const subtaskInput of subtaskInputs) {
      const result = await this.taskManager.createTask(subtaskInput);
      results.push(result);
    }
    
    return results;
  }

  private isEligibleForDecomposition(task: Task): boolean {
    // Check if task has no children and meets complexity/effort thresholds
    const hierarchy = this.taskManager.getTaskHierarchy(task.id);
    const hasChildren = hierarchy?.children && hierarchy.children.length > 0;
    
    if (hasChildren) return false;
    
    const isComplexEnough = task.complexity === 'complex' || task.complexity === 'very_complex';
    const hasEnoughEffort = (task.estimatedHours || 0) >= 8;
    
    return isComplexEnough || hasEnoughEffort;
  }

  private extractRequirementsFromTasks(tasks: Task[]): string[] {
    const requirements: string[] = [];
    
    for (const task of tasks) {
      if (task.description.toLowerCase().includes('must') || 
          task.description.toLowerCase().includes('required') ||
          task.description.toLowerCase().includes('need')) {
        requirements.push(task.description);
      }
    }
    
    return requirements.slice(0, 10); // Limit to top 10
  }

  private extractConstraintsFromTasks(tasks: Task[]): string[] {
    const constraints: string[] = [];
    
    for (const task of tasks) {
      if (task.dueDate) {
        constraints.push(`Deadline: ${task.dueDate}`);
      }
      if (task.dependencies && task.dependencies.length > 0) {
        constraints.push(`Dependencies: ${task.dependencies.join(', ')}`);
      }
    }
    
    return constraints.slice(0, 10); // Limit to top 10
  }

  private async analyzeAndUpdateTask(taskId: string, context: AITaskGenerationContext): Promise<TaskOperationResult> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      return { success: false, taskId, error: 'Task not found' };
    }

    // Perform AI analysis (simplified version)
    const aiAnalysis = {
      complexityFactors: ['description_length', 'technical_terms'],
      recommendations: ['Consider breaking down into smaller tasks'],
      suggestedApproach: 'Incremental development',
      estimatedEffort: {
        min: (task.estimatedHours || 8) * 0.8,
        max: (task.estimatedHours || 8) * 1.2,
        confidence: 0.7
      }
    };

    return this.taskManager.updateTask(taskId, {
      aiAnalysis,
      metadata: {
        ...task.metadata,
        aiAnalyzed: true,
        lastAIAnalysis: new Date().toISOString()
      }
    });
  }

  private async optimizeTask(taskId: string): Promise<TaskOperationResult> {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      return { success: false, taskId, error: 'Task not found' };
    }

    // Simple optimization logic
    const updates: any = {};
    
    // Optimize priority based on dependencies
    const hierarchy = this.taskManager.getTaskHierarchy(taskId);
    if (hierarchy?.relationships.dependents.length && hierarchy.relationships.dependents.length >= 3) {
      if (task.priority === 'low' || task.priority === 'medium') {
        updates.priority = 'high';
      }
    }

    // Optimize complexity based on estimated hours
    if (task.estimatedHours && task.estimatedHours < 4 && task.complexity === 'complex') {
      updates.complexity = 'medium';
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, taskId, metadata: { message: 'No optimizations needed' } };
    }

    return this.taskManager.updateTask(taskId, updates);
  }
} 