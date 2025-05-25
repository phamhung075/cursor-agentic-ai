import { EventEmitter } from 'events';
import { 
  Task, 
  TaskHierarchy, 
  TaskRelationship, 
  TaskStatus, 
  TaskPriority,
  TaskComplexity,
  TaskMetadata,
  HierarchyValidationResult,
  TaskOperationResult
} from '../../types/TaskTypes';

/**
 * Core Task Hierarchy Engine
 * 
 * Foundational engine for managing nested task hierarchies with parent-child relationships.
 * Provides intelligent task organization, validation, and relationship management.
 */
export class TaskHierarchyEngine extends EventEmitter {
  private taskRegistry: Map<string, Task> = new Map();
  private hierarchyIndex: Map<string, Set<string>> = new Map(); // parent -> children
  private reverseIndex: Map<string, string> = new Map(); // child -> parent
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private maxDepth: number = 10;
  private validationRules: Map<string, (task: Task) => boolean> = new Map();

  constructor(maxDepth: number = 10) {
    super();
    this.maxDepth = maxDepth;
    this.initializeValidationRules();
  }

  /**
   * Initialize default validation rules for task hierarchy
   */
  private initializeValidationRules(): void {
    this.validationRules.set('depth', (task: Task) => {
      return this.calculateTaskDepth(task.id) <= this.maxDepth;
    });

    this.validationRules.set('circular', (task: Task) => {
      return !this.hasCircularDependency(task.id);
    });

    this.validationRules.set('parent_exists', (task: Task) => {
      return !task.parent || this.taskRegistry.has(task.parent);
    });

    this.validationRules.set('unique_id', (task: Task) => {
      return !this.taskRegistry.has(task.id) || this.taskRegistry.get(task.id) === task;
    });
  }

  /**
   * Add a task to the hierarchy
   */
  public async addTask(task: Task): Promise<TaskOperationResult> {
    try {
      // Validate task before adding
      const validation = this.validateTask(task);
      if (!validation.isValid) {
        return {
          success: false,
          taskId: task.id,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          metadata: { validation }
        };
      }

      // Add to registry
      this.taskRegistry.set(task.id, { ...task });

      // Update hierarchy indices
      if (task.parent) {
        this.addToHierarchyIndex(task.parent, task.id);
        this.reverseIndex.set(task.id, task.parent);
      }

      // Update dependency graph
      if (task.dependencies && task.dependencies.length > 0) {
        this.dependencyGraph.set(task.id, new Set(task.dependencies));
      }

      // Emit event
      this.emit('taskAdded', { task, hierarchy: this.getTaskHierarchy(task.id) });

      return {
        success: true,
        taskId: task.id,
        metadata: { 
          depth: this.calculateTaskDepth(task.id),
          childrenCount: this.getDirectChildren(task.id).length
        }
      };
    } catch (error) {
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { error }
      };
    }
  }

  /**
   * Remove a task and handle hierarchy cleanup
   */
  public async removeTask(taskId: string, cascadeDelete: boolean = false): Promise<TaskOperationResult> {
    try {
      const task = this.taskRegistry.get(taskId);
      if (!task) {
        return {
          success: false,
          taskId,
          error: 'Task not found'
        };
      }

      const children = this.getDirectChildren(taskId);
      
      if (children.length > 0 && !cascadeDelete) {
        return {
          success: false,
          taskId,
          error: 'Cannot delete task with children. Use cascadeDelete=true to delete all children.'
        };
      }

      // Handle cascade deletion
      if (cascadeDelete) {
        for (const childId of children) {
          await this.removeTask(childId, true);
        }
      }

      // Remove from indices
      this.taskRegistry.delete(taskId);
      this.hierarchyIndex.delete(taskId);
      this.dependencyGraph.delete(taskId);
      
      // Remove from parent's children
      if (task.parent) {
        const parentChildren = this.hierarchyIndex.get(task.parent);
        if (parentChildren) {
          parentChildren.delete(taskId);
        }
      }
      
      this.reverseIndex.delete(taskId);

      // Clean up dependencies pointing to this task
      this.cleanupDependencies(taskId);

      this.emit('taskRemoved', { taskId, cascadeDelete });

      return {
        success: true,
        taskId,
        metadata: { cascadeDelete, removedChildren: children.length }
      };
    } catch (error) {
      return {
        success: false,
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update task and maintain hierarchy integrity
   */
  public async updateTask(taskId: string, updates: Partial<Task>): Promise<TaskOperationResult> {
    try {
      const existingTask = this.taskRegistry.get(taskId);
      if (!existingTask) {
        return {
          success: false,
          taskId,
          error: 'Task not found'
        };
      }

      const updatedTask = { ...existingTask, ...updates, id: taskId };
      
      // Validate updated task
      const validation = this.validateTask(updatedTask);
      if (!validation.isValid) {
        return {
          success: false,
          taskId,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          metadata: { validation }
        };
      }

      // Handle parent changes
      if (updates.parent !== undefined && updates.parent !== existingTask.parent) {
        await this.changeTaskParent(taskId, updates.parent);
      }

      // Update task in registry
      this.taskRegistry.set(taskId, updatedTask);

      this.emit('taskUpdated', { taskId, updates, task: updatedTask });

      return {
        success: true,
        taskId,
        metadata: { updatedFields: Object.keys(updates) }
      };
    } catch (error) {
      return {
        success: false,
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get complete task hierarchy for a given task
   */
  public getTaskHierarchy(taskId: string): TaskHierarchy | null {
    const task = this.taskRegistry.get(taskId);
    if (!task) return null;

    const children = this.getDirectChildren(taskId).map(childId => 
      this.getTaskHierarchy(childId)
    ).filter(Boolean) as TaskHierarchy[];

    return {
      task,
      children,
      depth: this.calculateTaskDepth(taskId),
      totalDescendants: this.getTotalDescendants(taskId),
      relationships: this.getTaskRelationships(taskId)
    };
  }

  /**
   * Get all tasks at a specific hierarchy level
   */
  public getTasksByLevel(level: number): Task[] {
    const tasks: Task[] = [];
    for (const task of this.taskRegistry.values()) {
      if (this.calculateTaskDepth(task.id) === level) {
        tasks.push(task);
      }
    }
    return tasks;
  }

  /**
   * Get root tasks (tasks without parents)
   */
  public getRootTasks(): Task[] {
    return Array.from(this.taskRegistry.values()).filter(task => !task.parent);
  }

  /**
   * Get direct children of a task
   */
  public getDirectChildren(taskId: string): string[] {
    const children = this.hierarchyIndex.get(taskId);
    return children ? Array.from(children) : [];
  }

  /**
   * Get all descendants of a task (recursive)
   */
  public getAllDescendants(taskId: string): string[] {
    const descendants: string[] = [];
    const children = this.getDirectChildren(taskId);
    
    for (const childId of children) {
      descendants.push(childId);
      descendants.push(...this.getAllDescendants(childId));
    }
    
    return descendants;
  }

  /**
   * Get task relationships (dependencies, blockers, etc.)
   */
  public getTaskRelationships(taskId: string): TaskRelationship {
    const task = this.taskRegistry.get(taskId);
    if (!task) {
      return {
        dependencies: [],
        dependents: [],
        blockers: [],
        blocked: [],
        parent: null,
        children: []
      };
    }

    return {
      dependencies: task.dependencies || [],
      dependents: this.getTaskDependents(taskId),
      blockers: task.blockedBy || [],
      blocked: task.enables || [],
      parent: task.parent || null,
      children: this.getDirectChildren(taskId)
    };
  }

  /**
   * Validate task against all validation rules
   */
  public validateTask(task: Task): HierarchyValidationResult {
    const errors: string[] = [];
    
    for (const [ruleName, rule] of this.validationRules) {
      try {
        if (!rule(task)) {
          errors.push(`Rule '${ruleName}' failed`);
        }
      } catch (error) {
        errors.push(`Rule '${ruleName}' error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(task)
    };
  }

  /**
   * Calculate the depth of a task in the hierarchy
   */
  private calculateTaskDepth(taskId: string): number {
    let depth = 0;
    let currentId = taskId;
    
    while (this.reverseIndex.has(currentId)) {
      depth++;
      currentId = this.reverseIndex.get(currentId)!;
      
      // Prevent infinite loops
      if (depth > this.maxDepth) {
        throw new Error(`Maximum depth exceeded for task ${taskId}`);
      }
    }
    
    return depth;
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(taskId: string, visited: Set<string> = new Set()): boolean {
    if (visited.has(taskId)) {
      return true;
    }
    
    visited.add(taskId);
    const dependencies = this.dependencyGraph.get(taskId);
    
    if (dependencies) {
      for (const depId of dependencies) {
        if (this.hasCircularDependency(depId, new Set(visited))) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Add task to hierarchy index
   */
  private addToHierarchyIndex(parentId: string, childId: string): void {
    if (!this.hierarchyIndex.has(parentId)) {
      this.hierarchyIndex.set(parentId, new Set());
    }
    this.hierarchyIndex.get(parentId)!.add(childId);
  }

  /**
   * Change task parent and update indices
   */
  private async changeTaskParent(taskId: string, newParentId: string | null): Promise<void> {
    const task = this.taskRegistry.get(taskId);
    if (!task) throw new Error('Task not found');

    const oldParentId = task.parent;

    // Remove from old parent
    if (oldParentId) {
      const oldParentChildren = this.hierarchyIndex.get(oldParentId);
      if (oldParentChildren) {
        oldParentChildren.delete(taskId);
      }
    }

    // Add to new parent
    if (newParentId) {
      this.addToHierarchyIndex(newParentId, taskId);
      this.reverseIndex.set(taskId, newParentId);
    } else {
      this.reverseIndex.delete(taskId);
    }
  }

  /**
   * Get total number of descendants
   */
  private getTotalDescendants(taskId: string): number {
    return this.getAllDescendants(taskId).length;
  }

  /**
   * Get tasks that depend on this task
   */
  private getTaskDependents(taskId: string): string[] {
    const dependents: string[] = [];
    
    for (const [id, dependencies] of this.dependencyGraph) {
      if (dependencies.has(taskId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  /**
   * Clean up dependencies pointing to a removed task
   */
  private cleanupDependencies(removedTaskId: string): void {
    for (const dependencies of this.dependencyGraph.values()) {
      dependencies.delete(removedTaskId);
    }
  }

  /**
   * Generate warnings for task validation
   */
  private generateWarnings(task: Task): string[] {
    const warnings: string[] = [];
    
    // Check for deep nesting
    const depth = this.calculateTaskDepth(task.id);
    if (depth > this.maxDepth * 0.8) {
      warnings.push(`Task is deeply nested (depth: ${depth})`);
    }
    
    // Check for too many dependencies
    if (task.dependencies && task.dependencies.length > 10) {
      warnings.push(`Task has many dependencies (${task.dependencies.length})`);
    }
    
    return warnings;
  }

  /**
   * Get hierarchy statistics
   */
  public getHierarchyStats() {
    const totalTasks = this.taskRegistry.size;
    const rootTasks = this.getRootTasks().length;
    const maxDepth = Math.max(...Array.from(this.taskRegistry.keys()).map(id => this.calculateTaskDepth(id)));
    
    const statusCounts = new Map<TaskStatus, number>();
    const priorityCounts = new Map<TaskPriority, number>();
    const complexityCounts = new Map<TaskComplexity, number>();
    
    for (const task of this.taskRegistry.values()) {
      statusCounts.set(task.status, (statusCounts.get(task.status) || 0) + 1);
      priorityCounts.set(task.priority, (priorityCounts.get(task.priority) || 0) + 1);
      complexityCounts.set(task.complexity, (complexityCounts.get(task.complexity) || 0) + 1);
    }
    
    return {
      totalTasks,
      rootTasks,
      maxDepth,
      statusDistribution: Object.fromEntries(statusCounts),
      priorityDistribution: Object.fromEntries(priorityCounts),
      complexityDistribution: Object.fromEntries(complexityCounts)
    };
  }
} 