import { v4 as uuidv4 } from 'uuid';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaskMapper, TaskModel } from '../database/TaskMapper';
import { TaskStorageService, TaskQueryResult, TaskQueryOptions } from './TaskStorageService';
import fs from 'fs';
import path from 'path';

/**
 * SupabaseTaskStorageService - Implementation of task storage using Supabase
 */
export class SupabaseTaskStorageService implements TaskStorageService {
  private supabase: SupabaseClient | null = null;
  private taskCache: Map<string, TaskModel> = new Map();
  private initialized = false;
  private supabaseUrl: string = '';
  private supabaseKey: string = '';

  /**
   * Initialize the storage service
   */
  public async initialize(options: {
    supabaseUrl?: string;
    supabaseKey?: string;
  } = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Set Supabase credentials
    this.supabaseUrl = options.supabaseUrl || process.env['SUPABASE_URL'] || '';
    this.supabaseKey = options.supabaseKey || process.env['SUPABASE_ANON_KEY'] || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase URL and key are required. Set them in options or environment variables.');
    }

    // Initialize Supabase client
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.initialized = true;
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

    // Insert main task
    const { data, error } = await this.supabase!
      .from('tasks')
      .insert({
        id: newTask.id,
        type: newTask.type,
        level: newTask.level,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        complexity: newTask.complexity,
        estimated_hours: newTask.estimatedHours,
        actual_hours: newTask.actualHours,
        progress: newTask.progress,
        ai_generated: newTask.aiGenerated,
        ai_confidence: newTask.aiConfidence,
        parent_id: newTask.parent,
        dependencies: newTask.dependencies,
        blocked_by: newTask.blockedBy,
        enables: newTask.enables,
        tags: newTask.tags,
        assignee: newTask.assignee,
        due_date: newTask.dueDate,
        created_at: newTask.createdAt,
        updated_at: newTask.updatedAt,
        completed_at: newTask.completedAt,
        started_at: newTask.startedAt,
        metadata: newTask.metadata,
        ai_analysis: newTask.aiAnalysis
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    // Create relationships for children
    if (newTask.children.length > 0) {
      const relationships = newTask.children.map((childId, index) => ({
        id: `${newTask.id}_${childId}`,
        parent_id: newTask.id,
        child_id: childId,
        order: index
      }));

      const { error: relError } = await this.supabase!
        .from('task_relationships')
        .insert(relationships);

      if (relError) {
        throw new Error(`Failed to create task relationships: ${relError.message}`);
      }
    }

    // Record timeline event
    await this.recordTimelineEvent(id, 'created', { task: newTask });

    // Update cache
    this.taskCache.set(id, newTask);

    return newTask;
  }

  /**
   * Update an existing task
   */
  public async updateTask(id: string, updates: Partial<TaskModel>): Promise<TaskModel> {
    await this.ensureInitialized();

    // Get current task
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

    // Convert to Supabase format
    const supabaseTask = {
      type: updatedTask.type,
      level: updatedTask.level,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      complexity: updatedTask.complexity,
      estimated_hours: updatedTask.estimatedHours,
      actual_hours: updatedTask.actualHours,
      progress: updatedTask.progress,
      ai_generated: updatedTask.aiGenerated,
      ai_confidence: updatedTask.aiConfidence,
      parent_id: updatedTask.parent,
      dependencies: updatedTask.dependencies,
      blocked_by: updatedTask.blockedBy,
      enables: updatedTask.enables,
      tags: updatedTask.tags,
      assignee: updatedTask.assignee,
      due_date: updatedTask.dueDate,
      updated_at: updatedTask.updatedAt,
      completed_at: updatedTask.completedAt,
      started_at: updatedTask.startedAt,
      metadata: updatedTask.metadata,
      ai_analysis: updatedTask.aiAnalysis
    };

    // Update task
    const { error } = await this.supabase!
      .from('tasks')
      .update(supabaseTask)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    // Handle children updates if needed
    if (updates.children && JSON.stringify(currentTask.children) !== JSON.stringify(updates.children)) {
      // Delete existing relationships
      const { error: deleteError } = await this.supabase!
        .from('task_relationships')
        .delete()
        .eq('parent_id', id);

      if (deleteError) {
        throw new Error(`Failed to delete task relationships: ${deleteError.message}`);
      }

      // Create new relationships
      if (updatedTask.children.length > 0) {
        const relationships = updatedTask.children.map((childId, index) => ({
          id: `${updatedTask.id}_${childId}`,
          parent_id: updatedTask.id,
          child_id: childId,
          order: index
        }));

        const { error: insertError } = await this.supabase!
          .from('task_relationships')
          .insert(relationships);

        if (insertError) {
          throw new Error(`Failed to create task relationships: ${insertError.message}`);
        }
      }
    }

    // Record timeline event
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

    // Delete child relationships
    const { error: childRelError } = await this.supabase!
      .from('task_relationships')
      .delete()
      .eq('parent_id', id);

    if (childRelError) {
      throw new Error(`Failed to delete child relationships: ${childRelError.message}`);
    }

    // Delete parent relationships
    const { error: parentRelError } = await this.supabase!
      .from('task_relationships')
      .delete()
      .eq('child_id', id);

    if (parentRelError) {
      throw new Error(`Failed to delete parent relationships: ${parentRelError.message}`);
    }

    // Delete timeline events
    const { error: timelineError } = await this.supabase!
      .from('task_timeline_events')
      .delete()
      .eq('task_id', id);

    if (timelineError) {
      throw new Error(`Failed to delete timeline events: ${timelineError.message}`);
    }

    // Record deletion event before deleting the task
    await this.recordTimelineEvent(id, 'deleted', { task });

    // Delete the task
    const { error } = await this.supabase!
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }

    // Remove from cache
    this.taskCache.delete(id);

    return true;
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

    // Fetch task from Supabase
    const { data, error } = await this.supabase!
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    let children: string[] = [];

    // Fetch children if requested
    if (includeChildren) {
      const { data: relationships, error: relError } = await this.supabase!
        .from('task_relationships')
        .select('child_id, order')
        .eq('parent_id', id)
        .order('order');

      if (!relError && relationships) {
        children = relationships.map((rel: { child_id: string }) => rel.child_id);
      }
    }

    // Convert to application model
    const taskModel = this.mapSupabaseToTaskModel(data, children);

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
      orderBy = 'created_at',
      orderDirection = 'desc',
      withChildren = true,
    } = options;

    // Start building query
    let query = this.supabase!.from('tasks').select('*', { count: 'exact' });

    // Apply filters
    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.type) {
      if (Array.isArray(options.type)) {
        query = query.in('type', options.type);
      } else {
        query = query.eq('type', options.type);
      }
    }

    if (options.priority) {
      if (Array.isArray(options.priority)) {
        query = query.in('priority', options.priority);
      } else {
        query = query.eq('priority', options.priority);
      }
    }

    if (options.assignee) {
      if (Array.isArray(options.assignee)) {
        query = query.in('assignee', options.assignee);
      } else {
        query = query.eq('assignee', options.assignee);
      }
    }

    if (options.parent === null) {
      query = query.is('parent_id', null);
    } else if (options.parent) {
      query = query.eq('parent_id', options.parent);
    }

    if (options.level !== undefined) {
      query = query.eq('level', options.level);
    }

    if (options.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    if (options.tags && options.tags.length > 0) {
      // For Supabase, we can use the contains operator for array values
      query = query.contains('tags', options.tags);
    }

    if (!options.includeCompleted) {
      query = query.is('completed_at', null);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    // Total count of results
    const total = count || 0;

    // Process results
    const tasks: TaskModel[] = [];

    for (const task of data || []) {
      let children: string[] = [];

      // Fetch children if requested
      if (withChildren) {
        const { data: relationships, error: relError } = await this.supabase!
          .from('task_relationships')
          .select('child_id, order')
          .eq('parent_id', task.id)
          .order('order');

        if (!relError && relationships) {
          children = relationships.map((rel: { child_id: string }) => rel.child_id);
        }
      }

      const taskModel = this.mapSupabaseToTaskModel(task, children);
      tasks.push(taskModel);

      // Update cache
      this.taskCache.set(task.id, taskModel);
    }

    return {
      tasks,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + tasks.length < total
    };
  }

  /**
   * Get all children of a task (direct children only)
   */
  public async getTaskChildren(parentId: string): Promise<TaskModel[]> {
    await this.ensureInitialized();

    // Get relationships
    const { data: relationships, error: relError } = await this.supabase!
      .from('task_relationships')
      .select('child_id, order')
      .eq('parent_id', parentId)
      .order('order');

    if (relError || !relationships || relationships.length === 0) {
      return [];
    }

    const childIds = relationships.map((rel: { child_id: string }) => rel.child_id);

    // Fetch child tasks
    const { data: childTasks, error } = await this.supabase!
      .from('tasks')
      .select('*')
      .in('id', childIds);

    if (error || !childTasks) {
      throw new Error(`Failed to fetch child tasks: ${error?.message || 'Unknown error'}`);
    }

    // Sort children according to relationship order
    const taskById = new Map(childTasks.map(task => [task.id, task]));
    const sortedChildren = childIds
      .map(id => {
        const task = taskById.get(id);
        if (!task) return null;
        
        const taskModel = this.mapSupabaseToTaskModel(task, []);
        
        // Update cache
        this.taskCache.set(task.id, taskModel);
        
        return taskModel;
      })
      .filter(Boolean) as TaskModel[];

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

    let importedCount = 0;
    
    // First pass: create all tasks
    for (const taskData of tasks) {
      const now = new Date().toISOString();
      
      const supabaseTask = {
        id: taskData.id,
        type: taskData.type,
        level: taskData.level,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        complexity: taskData.complexity,
        estimated_hours: taskData.estimatedHours,
        actual_hours: taskData.actualHours,
        progress: taskData.progress,
        ai_generated: taskData.aiGenerated,
        ai_confidence: taskData.aiConfidence,
        parent_id: taskData.parent,
        dependencies: taskData.dependencies || [],
        blocked_by: taskData.blockedBy || [],
        enables: taskData.enables || [],
        tags: taskData.tags || [],
        assignee: taskData.assignee,
        due_date: taskData.dueDate,
        created_at: taskData.createdAt || now,
        updated_at: taskData.updatedAt || now,
        completed_at: taskData.completedAt,
        started_at: taskData.startedAt,
        metadata: taskData.metadata,
        ai_analysis: taskData.aiAnalysis
      };
      
      const { error } = await this.supabase!
        .from('tasks')
        .insert(supabaseTask);
      
      if (error) {
        throw new Error(`Failed to import task ${taskData.id}: ${error.message}`);
      }
      
      importedCount++;
    }
    
    // Second pass: create relationships
    for (const taskData of tasks) {
      if (taskData.children && taskData.children.length > 0) {
        const relationships = taskData.children.map((childId: string, index: number) => ({
          id: `${taskData.id}_${childId}`,
          parent_id: taskData.id,
          child_id: childId,
          order: index
        }));
        
        const { error } = await this.supabase!
          .from('task_relationships')
          .insert(relationships);
        
        if (error) {
          throw new Error(`Failed to import relationships for task ${taskData.id}: ${error.message}`);
        }
      }
    }

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
        generatedBy: 'SupabaseTaskStorageService',
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
   * Map a Supabase task object to our TaskModel
   */
  private mapSupabaseToTaskModel(supabaseTask: Record<string, any>, children: string[]): TaskModel {
    return {
      id: supabaseTask.id,
      type: supabaseTask.type,
      level: supabaseTask.level,
      title: supabaseTask.title,
      description: supabaseTask.description || undefined,
      status: supabaseTask.status,
      priority: supabaseTask.priority,
      complexity: supabaseTask.complexity,
      estimatedHours: supabaseTask.estimated_hours || undefined,
      actualHours: supabaseTask.actual_hours || undefined,
      progress: supabaseTask.progress,
      aiGenerated: supabaseTask.ai_generated,
      aiConfidence: supabaseTask.ai_confidence || undefined,
      parent: supabaseTask.parent_id || null,
      children: children,
      dependencies: supabaseTask.dependencies || [],
      blockedBy: supabaseTask.blocked_by || [],
      enables: supabaseTask.enables || [],
      tags: supabaseTask.tags || [],
      assignee: supabaseTask.assignee || null,
      dueDate: supabaseTask.due_date || undefined,
      createdAt: supabaseTask.created_at,
      updatedAt: supabaseTask.updated_at,
      completedAt: supabaseTask.completed_at || null,
      startedAt: supabaseTask.started_at || null,
      metadata: supabaseTask.metadata || undefined,
      aiAnalysis: supabaseTask.ai_analysis || undefined
    };
  }

  /**
   * Record a task timeline event
   */
  private async recordTimelineEvent(
    taskId: string, 
    eventType: string, 
    details: Record<string, any>
  ): Promise<void> {
    await this.supabase!
      .from('task_timeline_events')
      .insert({
        id: uuidv4(),
        task_id: taskId,
        event_type: eventType,
        details,
        timestamp: new Date().toISOString(),
        user_id: null // Could come from auth context
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
}

// Export a singleton instance
export default new SupabaseTaskStorageService(); 