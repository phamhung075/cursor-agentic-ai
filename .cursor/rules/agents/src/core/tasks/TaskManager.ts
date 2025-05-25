import { TaskHierarchyEngine } from './TaskHierarchyEngine';
import { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskQueryFilter, 
  TaskSortOptions,
  TaskStatistics,
  TaskOperationResult,
  BulkTaskOperation,
  TaskTimelineEvent,
  TaskRecommendation,
  TaskStatus,
  TaskPriority,
  TaskComplexity
} from '../../types/TaskTypes';
import { EventEmitter } from 'events';

/**
 * Task Manager Service
 * 
 * High-level task management service that provides comprehensive task operations,
 * AI-driven insights, and intelligent task organization capabilities.
 */
export class TaskManager extends EventEmitter {
  private hierarchyEngine: TaskHierarchyEngine;
  private timeline: TaskTimelineEvent[] = [];
  private autoIdCounter: number = 1;

  constructor(maxHierarchyDepth: number = 10) {
    super();
    this.hierarchyEngine = new TaskHierarchyEngine(maxHierarchyDepth);
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for hierarchy engine events
   */
  private setupEventHandlers(): void {
    this.hierarchyEngine.on('taskAdded', (event) => {
      this.addTimelineEvent({
        id: this.generateEventId(),
        taskId: event.task.id,
        type: 'created',
        timestamp: new Date().toISOString(),
        metadata: { hierarchy: event.hierarchy }
      });
      this.emit('taskCreated', event);
    });

    this.hierarchyEngine.on('taskUpdated', (event) => {
      this.addTimelineEvent({
        id: this.generateEventId(),
        taskId: event.taskId,
        type: 'updated',
        timestamp: new Date().toISOString(),
        metadata: { updates: event.updates }
      });
      this.emit('taskUpdated', event);
    });

    this.hierarchyEngine.on('taskRemoved', (event) => {
      this.addTimelineEvent({
        id: this.generateEventId(),
        taskId: event.taskId,
        type: 'deleted',
        timestamp: new Date().toISOString(),
        metadata: { cascadeDelete: event.cascadeDelete }
      });
      this.emit('taskDeleted', event);
    });
  }

  /**
   * Create a new task with intelligent defaults
   */
  public async createTask(input: CreateTaskInput): Promise<TaskOperationResult> {
    const now = new Date().toISOString();
    
    const task: Task = {
      id: this.generateTaskId(),
      type: input.type,
      level: input.parent ? this.calculateLevel(input.parent) + 1 : 1,
      title: input.title,
      description: input.description,
      status: 'pending',
      priority: input.priority,
      complexity: input.complexity,
      estimatedHours: input.estimatedHours || null,
      actualHours: null,
      progress: 0,
      aiGenerated: false,
      aiConfidence: 0,
      parent: input.parent || null,
      children: [],
      dependencies: input.dependencies || [],
      blockedBy: [],
      enables: [],
      tags: input.tags || [],
      assignee: input.assignee || null,
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      metadata: {
        businessValue: 'medium',
        technicalRisk: 'medium',
        userImpact: 'medium',
        domain: 'general',
        testingRequired: true,
        documentationRequired: true,
        ...input.metadata
      }
    };

    return await this.hierarchyEngine.addTask(task);
  }

  /**
   * Update an existing task
   */
  public async updateTask(taskId: string, updates: UpdateTaskInput): Promise<TaskOperationResult> {
    const updateData: Partial<Task> = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Handle status changes
    if (updates.status === 'completed' && updates.status !== this.getTask(taskId)?.status) {
      updateData.completedAt = new Date().toISOString();
      updateData.progress = 100;
    }

    return await this.hierarchyEngine.updateTask(taskId, updateData);
  }

  /**
   * Delete a task
   */
  public async deleteTask(taskId: string, cascadeDelete: boolean = false): Promise<TaskOperationResult> {
    return await this.hierarchyEngine.removeTask(taskId, cascadeDelete);
  }

  /**
   * Get a single task by ID
   */
  public getTask(taskId: string): Task | null {
    return this.hierarchyEngine['taskRegistry'].get(taskId) || null;
  }

  /**
   * Query tasks with filters and sorting
   */
  public queryTasks(filter?: TaskQueryFilter, sort?: TaskSortOptions): Task[] {
    let tasks = Array.from(this.hierarchyEngine['taskRegistry'].values());

    // Apply filters
    if (filter) {
      tasks = this.applyFilters(tasks, filter);
    }

    // Apply sorting
    if (sort) {
      tasks = this.applySorting(tasks, sort);
    }

    return tasks;
  }

  /**
   * Get task hierarchy for a specific task
   */
  public getTaskHierarchy(taskId: string) {
    return this.hierarchyEngine.getTaskHierarchy(taskId);
  }

  /**
   * Get all root tasks
   */
  public getRootTasks(): Task[] {
    return this.hierarchyEngine.getRootTasks();
  }

  /**
   * Get tasks by hierarchy level
   */
  public getTasksByLevel(level: number): Task[] {
    return this.hierarchyEngine.getTasksByLevel(level);
  }

  /**
   * Get task statistics
   */
  public getStatistics(): TaskStatistics {
    const stats = this.hierarchyEngine.getHierarchyStats();
    const tasks = Array.from(this.hierarchyEngine['taskRegistry'].values());
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const aiGeneratedTasks = tasks.filter(task => task.aiGenerated).length;

    return {
      ...stats,
      statusDistribution: stats.statusDistribution as Record<TaskStatus, number>,
      priorityDistribution: stats.priorityDistribution as Record<TaskPriority, number>,
      complexityDistribution: stats.complexityDistribution as Record<TaskComplexity, number>,
      averageProgress: tasks.length > 0 ? totalProgress / tasks.length : 0,
      completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
      aiGeneratedPercentage: tasks.length > 0 ? (aiGeneratedTasks / tasks.length) * 100 : 0
    };
  }

  /**
   * Perform bulk operations on multiple tasks
   */
  public async bulkOperation(operation: BulkTaskOperation): Promise<TaskOperationResult[]> {
    const results: TaskOperationResult[] = [];

    for (const taskId of operation.taskIds) {
      let result: TaskOperationResult;

      switch (operation.operation) {
        case 'update':
          result = await this.updateTask(taskId, operation.data as UpdateTaskInput);
          break;
        case 'delete':
          result = await this.deleteTask(taskId, true);
          break;
        case 'move':
          const moveData = operation.data as { newParent: string };
          result = await this.updateTask(taskId, { parent: moveData.newParent });
          break;
        default:
          result = {
            success: false,
            taskId,
            error: `Unknown operation: ${operation.operation}`
          };
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Get task timeline events
   */
  public getTimeline(taskId?: string, limit?: number): TaskTimelineEvent[] {
    let events = taskId 
      ? this.timeline.filter(event => event.taskId === taskId)
      : this.timeline;

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Generate AI-driven task recommendations
   */
  public generateRecommendations(taskId?: string): TaskRecommendation[] {
    const recommendations: TaskRecommendation[] = [];
    const tasks = taskId ? [this.getTask(taskId)].filter(Boolean) as Task[] : this.queryTasks();

    for (const task of tasks) {
      // Priority adjustment recommendations
      if (task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
        if (task.priority === 'low' || task.priority === 'medium') {
          recommendations.push({
            type: 'priority_adjustment',
            taskId: task.id,
            recommendation: 'Increase task priority due to approaching deadline',
            reasoning: `Task "${task.title}" has a due date within 7 days but low/medium priority`,
            confidence: 0.8,
            impact: 'medium',
            effort: 'low'
          });
        }
      }

      // Dependency optimization
      const relationships = this.hierarchyEngine.getTaskRelationships(task.id);
      if (relationships.dependencies.length > 5) {
        recommendations.push({
          type: 'dependency_optimization',
          taskId: task.id,
          recommendation: 'Consider breaking down task or reducing dependencies',
          reasoning: `Task has ${relationships.dependencies.length} dependencies which may cause delays`,
          confidence: 0.7,
          impact: 'high',
          effort: 'medium'
        });
      }

      // Timeline adjustment for blocked tasks
      if (task.status === 'blocked' && relationships.blockers.length > 0) {
        recommendations.push({
          type: 'timeline_adjustment',
          taskId: task.id,
          recommendation: 'Adjust timeline or find alternative approach',
          reasoning: `Task is blocked by ${relationships.blockers.length} other tasks`,
          confidence: 0.9,
          impact: 'high',
          effort: 'medium'
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Auto-assign priorities based on AI analysis
   */
  public async autoAssignPriorities(): Promise<TaskOperationResult[]> {
    const tasks = this.queryTasks();
    const results: TaskOperationResult[] = [];

    for (const task of tasks) {
      let newPriority: TaskPriority = task.priority;

      // Increase priority for tasks with approaching deadlines
      if (task.dueDate) {
        const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue <= 3 && task.priority !== 'urgent' && task.priority !== 'critical') {
          newPriority = 'urgent';
        } else if (daysUntilDue <= 7 && task.priority === 'low') {
          newPriority = 'medium';
        }
      }

      // Increase priority for tasks blocking many others
      const relationships = this.hierarchyEngine.getTaskRelationships(task.id);
      if (relationships.dependents.length >= 3 && task.priority === 'low') {
        newPriority = 'medium';
      } else if (relationships.dependents.length >= 5 && task.priority === 'medium') {
        newPriority = 'high';
      }

      // Update if priority changed
      if (newPriority !== task.priority) {
        const result = await this.updateTask(task.id, { priority: newPriority });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Apply filters to task list
   */
  private applyFilters(tasks: Task[], filter: TaskQueryFilter): Task[] {
    return tasks.filter(task => {
      if (filter.status && !filter.status.includes(task.status)) return false;
      if (filter.priority && !filter.priority.includes(task.priority)) return false;
      if (filter.complexity && !filter.complexity.includes(task.complexity)) return false;
      if (filter.type && !filter.type.includes(task.type)) return false;
      if (filter.assignee && (!task.assignee || !filter.assignee.includes(task.assignee))) return false;
      if (filter.tags && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      if (filter.hasParent !== undefined && (!!task.parent) !== filter.hasParent) return false;
      if (filter.hasChildren !== undefined) {
        const hasChildren = this.hierarchyEngine.getDirectChildren(task.id).length > 0;
        if (hasChildren !== filter.hasChildren) return false;
      }
      if (filter.aiGenerated !== undefined && task.aiGenerated !== filter.aiGenerated) return false;
      if (filter.minProgress !== undefined && task.progress < filter.minProgress) return false;
      if (filter.maxProgress !== undefined && task.progress > filter.maxProgress) return false;

      // Date range filters
      if (filter.dueDateRange && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const start = new Date(filter.dueDateRange.start);
        const end = new Date(filter.dueDateRange.end);
        if (dueDate < start || dueDate > end) return false;
      }

      if (filter.createdDateRange) {
        const createdDate = new Date(task.createdAt);
        const start = new Date(filter.createdDateRange.start);
        const end = new Date(filter.createdDateRange.end);
        if (createdDate < start || createdDate > end) return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to task list
   */
  private applySorting(tasks: Task[], sort: TaskSortOptions): Task[] {
    return tasks.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      let comparison = 0;
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) comparison = 0;
      else if (aValue == null) comparison = -1;
      else if (bValue == null) comparison = 1;
      else if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      if (sort.direction === 'desc') comparison *= -1;
      
      // Apply secondary sort if primary values are equal
      if (comparison === 0 && sort.secondary) {
        const aSecondary = a[sort.secondary.field];
        const bSecondary = b[sort.secondary.field];
        
        if (aSecondary == null && bSecondary == null) comparison = 0;
        else if (aSecondary == null) comparison = -1;
        else if (bSecondary == null) comparison = 1;
        else if (aSecondary < bSecondary) comparison = -1;
        else if (aSecondary > bSecondary) comparison = 1;
        
        if (sort.secondary.direction === 'desc') comparison *= -1;
      }
      
      return comparison;
    });
  }

  /**
   * Calculate task level based on parent
   */
  private calculateLevel(parentId: string): number {
    const parent = this.getTask(parentId);
    return parent ? parent.level : 0;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${this.autoIdCounter++}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add timeline event
   */
  private addTimelineEvent(event: TaskTimelineEvent): void {
    this.timeline.push(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.timeline.length > 1000) {
      this.timeline = this.timeline.slice(-1000);
    }
  }

  /**
   * Export tasks to JSON
   */
  public exportTasks(): string {
    const data = {
      tasks: Array.from(this.hierarchyEngine['taskRegistry'].values()),
      timeline: this.timeline,
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import tasks from JSON
   */
  public async importTasks(jsonData: string): Promise<TaskOperationResult[]> {
    try {
      const data = JSON.parse(jsonData);
      const results: TaskOperationResult[] = [];
      
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const taskData of data.tasks) {
          const result = await this.hierarchyEngine.addTask(taskData);
          results.push(result);
        }
      }
      
      if (data.timeline && Array.isArray(data.timeline)) {
        this.timeline.push(...data.timeline);
      }
      
      return results;
    } catch (error) {
      return [{
        success: false,
        taskId: 'import',
        error: error instanceof Error ? error.message : 'Import failed'
      }];
    }
  }
} 