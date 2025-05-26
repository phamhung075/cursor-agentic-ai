import { v4 as uuidv4 } from 'uuid';
import { eq, and, asc, desc, like, inArray, isNull, SQL, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import databaseService from '../database/DatabaseService';
import { tasks, taskRelationships, taskTimelineEvents } from '../database/schema';
import { TaskMapper, TaskModel } from '../database/TaskMapper';
import { TaskStorageService, TaskQueryResult, TaskQueryOptions } from './TaskStorageService';
import fs from 'fs';
import path from 'path';

/**
 * DrizzleTaskStorageService - Implementation of task storage using Drizzle ORM
 */
export class DrizzleTaskStorageService implements TaskStorageService {
  private db: ReturnType<typeof drizzle> | null = null;
  private taskCache: Map<string, TaskModel> = new Map();
  private initialized = false;

  /**
   * Initialize the storage service
   */
  public async initialize(options: { dbPath?: string; runMigrations?: boolean } = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize the database
    await databaseService.initialize({
      dbPath: options.dbPath,
      runMigrations: options.runMigrations ?? true
    });
    
    // Now get the database instance
    this.db = databaseService.getDb();
    this.initialized = true;
  }

  /**
   * Get the database instance safely
   */
  private getDb(): ReturnType<typeof drizzle> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Create a new task
   */
  public async createTask(task: Omit<TaskModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskModel> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const id = uuidv4();

    const newTask: TaskModel = {
      id,
      createdAt: now,
      updatedAt: now,
      ...task,
      children: task.children || []
    };

    // Convert to database model
    const dbTask = TaskMapper.toDatabaseTask(newTask);

    // Insert into database
    await this.getDb().insert(tasks).values(dbTask);

    // Create parent-child relationships if any
    if (newTask.children.length > 0) {
      const relationships = TaskMapper.createTaskRelationships(id, newTask.children);
      await this.getDb().insert(taskRelationships).values(relationships);
    }

    // Record the creation event
    await this.recordTimelineEvent(id, 'created', { task: newTask });

    // Add to cache
    this.taskCache.set(id, newTask);

    return newTask;
  }

  /**
   * Update an existing task
   */
  public async updateTask(id: string, updates: Partial<TaskModel>): Promise<TaskModel> {
    await this.ensureInitialized();

    // Get the current task
    const currentTask = await this.getTaskById(id);
    if (!currentTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const updatedTask: TaskModel = {
      ...currentTask,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: now
    };

    // Convert to database model
    const dbTask = TaskMapper.toDatabaseTask(updatedTask);

    // Update in database
    await this.db.update(tasks).set(dbTask).where(eq(tasks.id, id));

    // Handle children updates if needed
    if (updates.children && JSON.stringify(currentTask.children) !== JSON.stringify(updates.children)) {
      // Delete existing relationships
      await this.db.delete(taskRelationships).where(eq(taskRelationships.parentId, id));

      // Create new relationships
      if (updatedTask.children.length > 0) {
        const relationships = TaskMapper.createTaskRelationships(id, updatedTask.children);
        await this.db.insert(taskRelationships).values(relationships);
      }
    }

    // Record the update event
    await this.recordTimelineEvent(id, 'updated', { 
      changes: this.getChanges(currentTask, updatedTask) 
    });

    // Update cache
    this.taskCache.set(id, updatedTask);

    return updatedTask;
  }

  /**
   * Delete a task and all its relationships
   */
  public async deleteTask(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const task = await this.getTaskById(id);
    if (!task) {
      return false;
    }

    // Start a transaction
    return await this.db.transaction(async (tx) => {
      // Delete child relationships
      await tx.delete(taskRelationships).where(eq(taskRelationships.parentId, id));

      // Delete parent relationships
      await tx.delete(taskRelationships).where(eq(taskRelationships.childId, id));

      // Delete timeline events
      await tx.delete(taskTimelineEvents).where(eq(taskTimelineEvents.taskId, id));

      // Delete the task
      await tx.delete(tasks).where(eq(tasks.id, id));

      // Record deletion event (outside the transaction as the task is already deleted)
      await this.recordTimelineEvent(id, 'deleted', { task });

      // Remove from cache
      this.taskCache.delete(id);

      return true;
    });
  }

  /**
   * Get a task by ID
   */
  public async getTaskById(id: string, includeChildren: boolean = true): Promise<TaskModel | null> {
    await this.ensureInitialized();

    // Check cache first
    if (this.taskCache.has(id)) {
      const cachedTask = this.taskCache.get(id)!;
      
      // If we need children and they're not already included in the cached task,
      // we'll need to fetch the task again
      if (!includeChildren || cachedTask.children.length > 0) {
        return cachedTask;
      }
    }

    // Fetch task from database
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const task = result[0];
    let children: string[] = [];

    // Fetch children if requested
    if (includeChildren) {
      const relationships = await this.db
        .select()
        .from(taskRelationships)
        .where(eq(taskRelationships.parentId, id))
        .orderBy(asc(taskRelationships.order));

      children = relationships.map(rel => rel.childId);
    }

    // Convert to application model
    const taskModel = TaskMapper.toTaskModel(task, children);

    // Update cache
    this.taskCache.set(id, taskModel);

    return taskModel;
  }

  /**
   * Get tasks with optional filtering
   */
  public async getTasks(options: TaskQueryOptions = {}): Promise<TaskQueryResult> {
    await this.ensureInitialized();

    const {
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      withChildren = true,
    } = options;

    // Build where clause
    const whereConditions: SQL[] = [];

    if (options.status) {
      if (Array.isArray(options.status)) {
        whereConditions.push(inArray(tasks.status, options.status));
      } else {
        whereConditions.push(eq(tasks.status, options.status));
      }
    }

    if (options.type) {
      if (Array.isArray(options.type)) {
        whereConditions.push(inArray(tasks.type, options.type));
      } else {
        whereConditions.push(eq(tasks.type, options.type));
      }
    }

    if (options.priority) {
      if (Array.isArray(options.priority)) {
        whereConditions.push(inArray(tasks.priority, options.priority));
      } else {
        whereConditions.push(eq(tasks.priority, options.priority));
      }
    }

    if (options.assignee) {
      if (Array.isArray(options.assignee)) {
        whereConditions.push(inArray(tasks.assignee, options.assignee));
      } else {
        whereConditions.push(eq(tasks.assignee, options.assignee));
      }
    }

    if (options.parent === null) {
      whereConditions.push(isNull(tasks.parentId));
    } else if (options.parent) {
      whereConditions.push(eq(tasks.parentId, options.parent));
    }

    if (options.level !== undefined) {
      whereConditions.push(eq(tasks.level, options.level));
    }

    if (options.search) {
      whereConditions.push(
        like(tasks.title, `%${options.search}%`)
      );
    }

    if (options.tags && options.tags.length > 0) {
      // This is a simplistic approach - ideally we'd query JSON arrays properly
      const tagConditions = options.tags.map(tag => 
        like(tasks.tags, `%${tag}%`)
      );
      // We join them with OR
      // Note: This is not ideal for JSON arrays but works for simple cases
    }

    if (!options.includeCompleted) {
      whereConditions.push(isNull(tasks.completedAt));
    }

    // Create the query with where conditions
    let query = this.db.select().from(tasks);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Count total matching tasks (before pagination)
    const countQuery = this.db.select({ count: tasks.id }).from(tasks);
    if (whereConditions.length > 0) {
      countQuery.where(and(...whereConditions));
    }
    const countResult = await countQuery;
    const total = countResult.length;

    // Apply sorting
    const direction = orderDirection === 'asc' ? asc : desc;
    let orderByColumn;
    
    // This is a simplified approach - in real code you'd need to handle all possible columns
    switch(orderBy) {
      case 'title':
        orderByColumn = tasks.title;
        break;
      case 'updatedAt':
        orderByColumn = tasks.updatedAt;
        break;
      case 'priority':
        orderByColumn = tasks.priority;
        break;
      case 'status':
        orderByColumn = tasks.status;
        break;
      case 'createdAt':
      default:
        orderByColumn = tasks.createdAt;
        break;
    }
    
    query = query.orderBy(direction(orderByColumn));

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Execute query
    const results = await query;

    // Fetch children if requested
    let tasksWithChildren: TaskModel[] = [];
    
    if (withChildren && results.length > 0) {
      const taskIds = results.map(t => t.id);
      
      // Fetch all relationships for these tasks in one query
      const relationships = await this.db
        .select()
        .from(taskRelationships)
        .where(inArray(taskRelationships.parentId, taskIds))
        .orderBy(asc(taskRelationships.order));
      
      // Group relationships by parent ID
      const relationshipsByParent = new Map<string, string[]>();
      relationships.forEach(rel => {
        if (!relationshipsByParent.has(rel.parentId)) {
          relationshipsByParent.set(rel.parentId, []);
        }
        relationshipsByParent.get(rel.parentId)!.push(rel.childId);
      });
      
      // Map tasks with their children
      tasksWithChildren = results.map(task => {
        const children = relationshipsByParent.get(task.id) || [];
        const taskModel = TaskMapper.toTaskModel(task, children);
        
        // Update cache
        this.taskCache.set(task.id, taskModel);
        
        return taskModel;
      });
    } else {
      // Convert to application models without children
      tasksWithChildren = results.map(task => {
        const taskModel = TaskMapper.toTaskModel(task, []);
        
        // Update cache
        this.taskCache.set(task.id, taskModel);
        
        return taskModel;
      });
    }

    return {
      tasks: tasksWithChildren,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + tasksWithChildren.length < total
    };
  }

  /**
   * Get all children of a task (direct children only)
   */
  public async getTaskChildren(parentId: string): Promise<TaskModel[]> {
    await this.ensureInitialized();

    // Get relationships
    const relationships = await this.db
      .select()
      .from(taskRelationships)
      .where(eq(taskRelationships.parentId, parentId))
      .orderBy(asc(taskRelationships.order));

    if (relationships.length === 0) {
      return [];
    }

    const childIds = relationships.map(rel => rel.childId);
    
    // Fetch all children in one query
    const childTasks = await this.db
      .select()
      .from(tasks)
      .where(inArray(tasks.id, childIds));
    
    // Sort children according to the original order
    const sortedChildren = childIds.map(id => {
      const task = childTasks.find(t => t.id === id);
      if (!task) return null;
      
      const taskModel = TaskMapper.toTaskModel(task, []);
      
      // Update cache
      this.taskCache.set(task.id, taskModel);
      
      return taskModel;
    }).filter(Boolean) as TaskModel[];

    return sortedChildren;
  }

  /**
   * Get a hierarchical tree of tasks starting from a root task
   */
  public async getTaskTree(rootId: string, depth: number = -1): Promise<TaskModel> {
    await this.ensureInitialized();

    const rootTask = await this.getTaskById(rootId, false);
    if (!rootTask) {
      throw new Error(`Root task with ID ${rootId} not found`);
    }

    // Get the immediate children
    const children = await this.getTaskChildren(rootId);
    rootTask.children = children.map(child => child.id);

    // If we've reached the maximum depth or there are no children, return
    if (depth === 0 || children.length === 0) {
      return rootTask;
    }

    // Recursively get children's trees (with reduced depth)
    const nextDepth = depth > 0 ? depth - 1 : -1;
    
    // We don't need to await here as we'll collect and await all promises later
    const childPromises = children.map(child => 
      this.getTaskTree(child.id, nextDepth)
    );

    // Wait for all child trees to be resolved
    await Promise.all(childPromises);

    return rootTask;
  }

  /**
   * Import tasks from a JSON file
   */
  public async importTasksFromJson(filePath: string): Promise<number> {
    await this.ensureInitialized();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    const tasks = [...(data.epics || []), ...(data.tasks || []), ...(data.subtasks || [])];
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('No tasks found in the JSON file');
    }

    // Start a transaction to import all tasks
    let importedCount = 0;
    
    await this.db.transaction(async (tx) => {
      // First pass: create all tasks
      for (const taskData of tasks) {
        const now = new Date().toISOString();
        
        const task: TaskModel = {
          id: taskData.id,
          type: taskData.type,
          level: taskData.level,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          complexity: taskData.complexity,
          estimatedHours: taskData.estimatedHours,
          actualHours: taskData.actualHours,
          progress: taskData.progress,
          aiGenerated: taskData.aiGenerated,
          aiConfidence: taskData.aiConfidence,
          parent: taskData.parent,
          children: taskData.children || [],
          dependencies: taskData.dependencies || [],
          blockedBy: taskData.blockedBy || [],
          enables: taskData.enables || [],
          tags: taskData.tags || [],
          assignee: taskData.assignee,
          dueDate: taskData.dueDate,
          createdAt: taskData.createdAt || now,
          updatedAt: taskData.updatedAt || now,
          completedAt: taskData.completedAt,
          startedAt: taskData.startedAt,
          metadata: taskData.metadata,
          aiAnalysis: taskData.aiAnalysis
        };
        
        // Convert to database model
        const dbTask = TaskMapper.toDatabaseTask(task);
        
        // Insert task
        await tx.insert(tasks).values(dbTask);
        importedCount++;
      }
      
      // Second pass: create relationships
      for (const taskData of tasks) {
        if (taskData.children && taskData.children.length > 0) {
          const relationships = TaskMapper.createTaskRelationships(
            taskData.id, 
            taskData.children
          );
          
          // Insert relationships
          await tx.insert(taskRelationships).values(relationships);
        }
      }
    });

    // Clear cache after bulk import
    this.taskCache.clear();
    
    return importedCount;
  }

  /**
   * Export tasks to a JSON file
   */
  public async exportTasksToJson(filePath: string, options: {
    rootTaskId?: string;
    includeAll?: boolean;
  } = {}): Promise<number> {
    await this.ensureInitialized();

    let tasks: TaskModel[] = [];

    if (options.rootTaskId) {
      // Export a specific task tree
      const rootTask = await this.getTaskTree(options.rootTaskId);
      
      // Collect all tasks in the tree (BFS traversal)
      const queue: TaskModel[] = [rootTask];
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        
        visited.add(current.id);
        tasks.push(current);
        
        // Add children to the queue
        for (const childId of current.children) {
          const child = await this.getTaskById(childId);
          if (child && !visited.has(childId)) {
            queue.push(child);
          }
        }
      }
    } else if (options.includeAll) {
      // Export all tasks
      const result = await this.getTasks({ limit: 10000 });
      tasks = result.tasks;
    } else {
      // Export top-level tasks (epics)
      const result = await this.getTasks({ 
        parent: null,
        limit: 10000
      });
      tasks = result.tasks;
      
      // Get all tasks in these epic trees
      for (const epic of tasks) {
        const epicTree = await this.getTaskTree(epic.id);
        
        // Collect all tasks in the tree (BFS traversal)
        const queue: TaskModel[] = [epicTree];
        const visited = new Set<string>();
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current.id)) continue;
          
          visited.add(current.id);
          
          // Add children to the queue
          for (const childId of current.children) {
            const child = await this.getTaskById(childId);
            if (child && !visited.has(childId)) {
              queue.push(child);
              tasks.push(child);
            }
          }
        }
      }
    }

    // Group tasks by type
    const epics = tasks.filter(t => t.type === 'epic');
    const regularTasks = tasks.filter(t => t.type === 'feature' || t.type === 'task');
    const subtasks = tasks.filter(t => t.type === 'subtask' || t.level === 3);

    // Create the output structure
    const output = {
      metadata: {
        version: '1.1.0',
        generatedBy: 'DrizzleTaskStorageService',
        timestamp: new Date().toISOString(),
        totalTasks: tasks.length
      },
      epics,
      tasks: regularTasks,
      subtasks
    };

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf8');
    
    return tasks.length;
  }

  /**
   * Record a task timeline event
   */
  private async recordTimelineEvent(
    taskId: string, 
    eventType: string, 
    details: Record<string, any>
  ): Promise<void> {
    await this.db.insert(taskTimelineEvents).values({
      id: uuidv4(),
      taskId,
      eventType,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      userId: null // Could come from auth context
    });
  }

  /**
   * Calculate changes between two task versions
   */
  private getChanges(oldTask: TaskModel, newTask: TaskModel): Record<string, any> {
    const changes: Record<string, any> = {};
    
    // Compare all fields
    for (const key in newTask) {
      if (key === 'updatedAt') continue;
      
      const oldValue = (oldTask as any)[key];
      const newValue = (newTask as any)[key];
      
      // Special handling for arrays and objects
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = {
            from: oldValue,
            to: newValue
          };
        }
      } else if (
        typeof oldValue === 'object' && 
        oldValue !== null && 
        typeof newValue === 'object' && 
        newValue !== null
      ) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = {
            from: oldValue,
            to: newValue
          };
        }
      } else if (oldValue !== newValue) {
        changes[key] = {
          from: oldValue,
          to: newValue
        };
      }
    }
    
    return changes;
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the highest priority task
   */
  public async getMostPriorityTask(status?: string, type?: string): Promise<TaskModel | null> {
    await this.ensureInitialized();

    // Build where conditions
    const whereConditions: SQL[] = [];
    
    // Add status filter if provided
    if (status) {
      whereConditions.push(eq(tasks.status, status));
    }
    
    // Add type filter if provided
    if (type) {
      whereConditions.push(eq(tasks.type, type));
    }
    
    // Create the query
    let query = this.getDb().select().from(tasks);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Sort by priority (assuming 'high' > 'medium' > 'low')
    // Note: This is a simplistic approach - ideally we'd have a numeric priority value
    const results = await query;
    
    if (results.length === 0) {
      return null;
    }
    
    // Score tasks by priority
    const priorityScores: { [key: string]: number } = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    // Sort tasks by priority score
    const sortedTasks = [...results].sort((a, b) => {
      const aPriority = a.priority || 'medium';
      const bPriority = b.priority || 'medium';
      
      const aScore = priorityScores[aPriority] || 0;
      const bScore = priorityScores[bPriority] || 0;
      
      return bScore - aScore; // Descending order
    });
    
    // Get the highest priority task
    const highestPriorityTask = sortedTasks[0];
    
    // Convert to task model
    const taskModel = TaskMapper.toTaskModel(highestPriorityTask, []);
    
    // Update cache
    this.taskCache.set(taskModel.id, taskModel);
    
    return taskModel;
  }

  /**
   * Get all subtasks of a task
   */
  public async getSubtasks(parentId: string): Promise<TaskModel[]> {
    await this.ensureInitialized();
    
    // First, check if the parent task exists
    const parentTask = await this.getTaskById(parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Find all direct subtasks using the task_relationships table
    const relationships = await this.getDb()
      .select()
      .from(taskRelationships)
      .where(eq(taskRelationships.parentId, parentId));
    
    if (relationships.length === 0) {
      return [];
    }
    
    const childIds = relationships.map(rel => rel.childId);
    
    // Get all subtask details
    const subtaskDetails = await this.getDb()
      .select()
      .from(tasks)
      .where(inArray(tasks.id, childIds));
    
    // Also find all nested subtasks recursively
    const allSubtasks: TaskModel[] = [];
    
    // Map each direct child to a TaskModel
    for (const subtask of subtaskDetails) {
      const subtaskModel = TaskMapper.toTaskModel(subtask, []);
      
      // Add to cache
      this.taskCache.set(subtaskModel.id, subtaskModel);
      
      // Add to result list
      allSubtasks.push(subtaskModel);
      
      // Recursively get nested subtasks
      const nestedSubtasks = await this.getSubtasks(subtaskModel.id);
      allSubtasks.push(...nestedSubtasks);
    }
    
    return allSubtasks;
  }

  /**
   * Delete all tasks
   */
  public async deleteAllTasks(): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // Execute in transaction to ensure atomicity
      await this.getDb().transaction(async (tx) => {
        // First delete all relationships
        await tx.delete(taskRelationships);
        
        // Then delete all timeline events
        await tx.delete(taskTimelineEvents);
        
        // Finally delete all tasks
        await tx.delete(tasks);
      });
      
      // Clear the cache
      this.taskCache.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to delete all tasks:', error);
      return false;
    }
  }

  /**
   * Delete all subtasks of a task
   */
  public async deleteAllSubtasks(parentId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // First, get all subtasks
      const subtasks = await this.getSubtasks(parentId);
      
      if (subtasks.length === 0) {
        return true; // No subtasks to delete
      }
      
      const subtaskIds = subtasks.map(task => task.id);
      
      // Execute in transaction to ensure atomicity
      await this.getDb().transaction(async (tx) => {
        // Delete relationships for these subtasks
        await tx.delete(taskRelationships)
          .where(
            or(
              inArray(taskRelationships.parentId, subtaskIds),
              inArray(taskRelationships.childId, subtaskIds)
            )
          );
        
        // Delete timeline events for these subtasks
        await tx.delete(taskTimelineEvents)
          .where(inArray(taskTimelineEvents.taskId, subtaskIds));
        
        // Delete the subtasks
        await tx.delete(tasks)
          .where(inArray(tasks.id, subtaskIds));
      });
      
      // Remove from cache
      subtaskIds.forEach(id => this.taskCache.delete(id));
      
      return true;
    } catch (error) {
      console.error(`Failed to delete subtasks of ${parentId}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export default new DrizzleTaskStorageService(); 