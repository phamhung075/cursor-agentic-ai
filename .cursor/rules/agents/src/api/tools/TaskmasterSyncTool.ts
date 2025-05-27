import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskModel } from '../../core/database/TaskMapper';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Taskmaster Sync Tool
 * 
 * Tool for synchronizing tasks between the server and Taskmaster
 */
export class TaskmasterSyncTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'sync_taskmaster';
    const description = 'Synchronize tasks between the server and Taskmaster';
    const schema: IToolSchema = {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['from_taskmaster', 'to_taskmaster', 'bidirectional'],
          description: 'Direction of synchronization',
          default: 'bidirectional'
        },
        taskmasterFile: {
          type: 'string',
          description: 'Path to the taskmaster file (default: tasks/tasks.json)',
        },
        forceTaskmasterAsSource: {
          type: 'boolean',
          description: 'Force Taskmaster as the source of truth in conflicts',
          default: false
        },
        syncTimeout: {
          type: 'number',
          description: 'Timeout for sync lock (in ms)',
          default: 30000
        }
      },
      required: []
    };

    super(name, description, schema, logger);
  }

  /**
   * Execute the tool
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      const direction = params['direction'] || 'bidirectional';
      const taskmasterFile = params['taskmasterFile'];
      const forceTaskmasterAsSource = params['forceTaskmasterAsSource'] === true || false;
      const syncTimeout = params['syncTimeout'] || 30000;

      // Initialize the task storage service
      const taskStorage = await taskStorageFactory.getStorageService();

      // Perform the requested sync operation
      switch (direction) {
        case 'from_taskmaster':
          return await this.syncFromTaskmaster({ taskmasterFile, taskStorage, forceTaskmasterAsSource });
          
        case 'to_taskmaster':
          return await this.syncToTaskmaster({ taskmasterFile, taskStorage, forceTaskmasterAsSource });
          
        case 'bidirectional':
        default:
          return await this.bidirectionalSync({ 
            taskmasterFile, 
            forceTaskmasterAsSource,
            syncTimeout
          });
      }
    } catch (error) {
      this.logger.error('TaskmasterSyncTool', `Error executing sync: ${error}`, { error });
      throw error;
    }
  }

  /**
   * Sync from Taskmaster to server
   */
  private async syncFromTaskmaster(params: { 
    taskmasterFile?: string;
    taskStorage: any;
    forceTaskmasterAsSource?: boolean;
  }): Promise<any> {
    const { taskmasterFile, taskStorage, forceTaskmasterAsSource = false } = params;
    
    try {
      // Get tasks from Taskmaster
      const taskmasterTasks = await this.getTaskmasterTasks(taskmasterFile);
      
      if (!taskmasterTasks || taskmasterTasks.length === 0) {
        return {
          success: false,
          message: 'No tasks found in Taskmaster',
          stats: { tasksProcessed: 0 }
        };
      }
      
      // Convert tasks to server model format
      const serverTasks: Partial<TaskModel>[] = [];
      
      for (const tmTask of taskmasterTasks) {
        const serverTask = this.convertTaskmasterTaskToModel(tmTask);
        serverTasks.push(serverTask);
      }
      
      // Get all existing tasks from server to check for updates/deletes
      const existingTasks = await taskStorage.getAllTasks();
      const existingTaskMap = new Map<string, TaskModel>();
      
      for (const task of existingTasks) {
        existingTaskMap.set(task.id, task);
      }
      
      // Process each task from Taskmaster
      const stats = {
        tasksAdded: 0,
        tasksUpdated: 0,
        tasksUnchanged: 0,
        tasksProcessed: taskmasterTasks.length
      };
      
      for (const serverTask of serverTasks) {
        const existingTask = existingTaskMap.get(serverTask.id!);
        
        if (!existingTask) {
          // Task doesn't exist in server - create it
          await taskStorage.createTask(serverTask);
          stats.tasksAdded++;
        } else {
          // Task exists - check for changes
          if (this.hasChanges(existingTask, serverTask) || forceTaskmasterAsSource) {
            // Update the task
            await taskStorage.updateTask(serverTask.id!, serverTask);
            stats.tasksUpdated++;
          } else {
            stats.tasksUnchanged++;
          }
        }
      }
      
      return {
        success: true,
        message: `Synchronized ${stats.tasksProcessed} tasks from Taskmaster to server`,
        stats
      };
    } catch (error) {
      this.logger.error('TaskmasterSyncTool', `Error syncing from Taskmaster: ${error}`, { error });
      return {
        success: false,
        message: `Error syncing from Taskmaster: ${error}`,
        error
      };
    }
  }

  /**
   * Sync from server to Taskmaster
   */
  private async syncToTaskmaster(params: { 
    taskmasterFile?: string;
    taskStorage: any;
    forceTaskmasterAsSource?: boolean;
  }): Promise<any> {
    const { taskmasterFile, taskStorage, forceTaskmasterAsSource = false } = params;
    
    try {
      // Get all tasks from server
      const serverTasks = await taskStorage.getAllTasks();
      
      if (!serverTasks || serverTasks.length === 0) {
        return {
          success: false,
          message: 'No tasks found in server',
          stats: { tasksProcessed: 0 }
        };
      }
      
      // Convert server tasks to Taskmaster format
      const taskmasterTasks = await this.convertServerTasksToTaskmaster(serverTasks);
      
      // Write tasks to Taskmaster file
      const targetFile = taskmasterFile 
        ? (path.isAbsolute(taskmasterFile) ? taskmasterFile : path.join(process.cwd(), taskmasterFile))
        : path.join(process.cwd(), 'tasks', 'tasks.json');
      
      // Create directory if it doesn't exist
      const targetDir = path.dirname(targetFile);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Write tasks to file
      await fs.writeFile(targetFile, JSON.stringify(taskmasterTasks, null, 2), 'utf-8');
      
      return {
        success: true,
        message: `Synchronized ${serverTasks.length} tasks from server to Taskmaster`,
        stats: {
          tasksProcessed: serverTasks.length,
          tasksWritten: taskmasterTasks.length,
          targetFile
        }
      };
    } catch (error) {
      this.logger.error('TaskmasterSyncTool', `Error syncing to Taskmaster: ${error}`, { error });
      return {
        success: false,
        message: `Error syncing to Taskmaster: ${error}`,
        error
      };
    }
  }

  /**
   * Check if the Taskmaster version of a task is newer than the server version
   * @param tmTask Taskmaster task
   * @param serverTask Server task
   * @returns true if Taskmaster version is newer
   */
  private isTaskmasterVersionNewer(tmTask: any, serverTask: any): boolean {
    // If the Taskmaster task has an updatedAt field, use it for comparison
    if (tmTask.updatedAt) {
      const tmUpdatedAt = new Date(tmTask.updatedAt);
      const serverUpdatedAt = new Date(serverTask.updatedAt || 0);
      return tmUpdatedAt > serverUpdatedAt;
    }
    
    // If no updatedAt field, assume Taskmaster is the source of truth
    return true;
  }

  /**
   * Determine if a server task has changes compared to the task model
   */
  private hasChanges(existingTask: TaskModel, newTask: Partial<TaskModel>): boolean {
    // Check important fields for changes
    if (existingTask.title !== newTask.title) return true;
    if (existingTask.description !== newTask.description) return true;
    if (existingTask.status !== newTask.status) return true;
    if (existingTask.priority !== newTask.priority) return true;
    
    // Check dependencies
    const existingDeps = new Set(existingTask.dependencies || []);
    const newDeps = new Set(newTask.dependencies || []);
    
    if (existingDeps.size !== newDeps.size) return true;
    
    for (const dep of newDeps) {
      if (!existingDeps.has(dep)) return true;
    }
    
    return false;
  }

  /**
   * Validates that task references (parent and dependencies) exist in the database
   * This helps prevent foreign key constraint failures
   * @param task The task to validate
   * @param existingIds Set of task IDs that already exist in the database
   * @returns Object containing validation result and any issues found
   */
  private validateTaskReferences(task: Partial<TaskModel>, existingIds: Set<string>): { 
    isValid: boolean;
    missingParent?: string | undefined;
    missingDependencies?: string[] | undefined;
  } {
    const result: { 
      isValid: boolean;
      missingParent?: string;
      missingDependencies?: string[];
    } = {
      isValid: true
    };
    
    // Check if parent exists
    if (task.parent && !existingIds.has(task.parent)) {
      result.isValid = false;
      result.missingParent = task.parent;
    }
    
    // Check if dependencies exist
    if (task.dependencies && task.dependencies.length > 0) {
      const missing: string[] = [];
      for (const dep of task.dependencies) {
        if (!existingIds.has(dep)) {
          missing.push(dep);
          result.isValid = false;
        }
      }
      if (missing.length > 0) {
        result.missingDependencies = missing;
      }
    }
    
    return result;
  }

  /**
   * Bidirectional sync between Taskmaster and the server
   */
  private async bidirectionalSync(
    params: { 
      taskmasterFile?: string;
      forceTaskmasterAsSource?: boolean;
      syncTimeout?: number;
    }
  ): Promise<any> {
    const { taskmasterFile, forceTaskmasterAsSource = false, syncTimeout = 30000 } = params;
    
    // Create a sync lock file to prevent concurrent syncs
    const lockFile = path.join(os.tmpdir(), 'taskmaster-sync.lock');
    
    try {
      // Check if sync is already running
      try {
        await fs.access(lockFile);
        // If we can access the lock file, check if it's stale
        const lockStat = await fs.stat(lockFile);
        const lockTime = new Date(lockStat.mtime);
        const now = new Date();
        
        // If the lock file is older than the timeout, consider it stale
        if ((now.getTime() - lockTime.getTime()) < syncTimeout) {
          return {
            success: false,
            message: 'Sync is already in progress',
            lockFile,
            lockTime: lockTime.toISOString()
          };
        }
        
        // Lock is stale, continue with sync
        this.logger.warn('TaskmasterSyncTool', `Stale lock file found, overwriting`, { lockFile, lockTime });
      } catch (e) {
        // Lock file doesn't exist, which is fine
      }
      
      // Create lock file
      await fs.writeFile(lockFile, new Date().toISOString(), 'utf-8');
      
      // Initialize the task storage service
      const taskStorage = await taskStorageFactory.getStorageService();
      
      // Get all tasks from server - using getTasks() instead of getAllTasks()
      const { tasks: serverTasks } = await taskStorage.getTasks();
      const serverTasksMap = new Map<string, TaskModel>();
      
      for (const task of serverTasks) {
        serverTasksMap.set(task.id, task);
      }
      
      // Get tasks from Taskmaster
      const taskmasterTasks = await this.getTaskmasterTasks(taskmasterFile);
      const tmTasksMap = new Map<string, any>();
      
      for (const task of taskmasterTasks) {
        tmTasksMap.set(task.id.toString(), task);
      }
      
      // Process each task
      const stats = {
        tasksAddedToServer: 0,
        tasksUpdatedInServer: 0,
        tasksAddedToTaskmaster: 0,
        tasksUpdatedInTaskmaster: 0,
        conflictsResolved: 0,
        tasksUnchanged: 0,
        tasksTotal: Math.max(serverTasks.length, taskmasterTasks.length),
        tasksFailed: 0,
        tasksSkippedDueToMissingReferences: 0
      };
      
      // First, convert all Taskmaster tasks to server model format and organize by level
      const tasksByLevel = new Map<number, Partial<TaskModel>[]>();
      const taskUpdatesByLevel = new Map<number, { taskId: string, data: Partial<TaskModel> }[]>();
      const failedTasks: { task: Partial<TaskModel>, error: any }[] = [];
      const skippedTasks: { task: Partial<TaskModel>, reason: string }[] = [];
      
      for (const tmTask of taskmasterTasks) {
        const serverTask = serverTasksMap.get(tmTask.id.toString());
        const serverVersion = this.convertTaskmasterTaskToModel(tmTask);
        const level = serverVersion.level || 1; // Default to level 1 if not set
        
        if (!serverTask) {
          // Task exists in Taskmaster but not in server - add it
          // Group by level for ordered processing
          if (!tasksByLevel.has(level)) {
            tasksByLevel.set(level, []);
          }
          tasksByLevel.get(level)?.push(serverVersion);
        } else {
          // Task exists in both - check for changes and conflicts
          const hasConflict = this.hasChanges(serverTask, serverVersion);
          
          if (hasConflict) {
            // Determine which version to keep
            if (forceTaskmasterAsSource || this.isTaskmasterVersionNewer(tmTask, serverTask)) {
              // Keep Taskmaster version - group updates by level
              if (!taskUpdatesByLevel.has(level)) {
                taskUpdatesByLevel.set(level, []);
              }
              taskUpdatesByLevel.get(level)?.push({
                taskId: tmTask.id.toString(),
                data: serverVersion
              });
              stats.conflictsResolved++;
            }
          } else {
            // No conflict
            stats.tasksUnchanged++;
          }
        }
      }
      
      // Process creates by level to ensure parent tasks exist before children
      const updatedServerTasks: TaskModel[] = [];
      const existingIds = new Set<string>(serverTasks.map(t => t.id)); // Start with existing server task IDs
      const levels = Array.from(tasksByLevel.keys()).sort((a, b) => a - b);
      
      for (const level of levels) {
        const tasksToCreate = tasksByLevel.get(level) || [];
        
        for (const task of tasksToCreate) {
          // Validate task references before attempting to create
          const validation = this.validateTaskReferences(task, existingIds);
          
          if (!validation.isValid) {
            // Skip tasks with missing references
            const reason = [];
            if (validation.missingParent) {
              reason.push(`Parent task ${validation.missingParent} not found`);
            }
            if (validation.missingDependencies && validation.missingDependencies.length > 0) {
              reason.push(`Dependencies not found: ${validation.missingDependencies.join(', ')}`);
            }
            
            this.logger.warn('TaskmasterSyncTool', `Skipping task ${task.id} due to missing references`, { 
              task, 
              validation 
            });
            
            skippedTasks.push({ 
              task, 
              reason: reason.join('; ') 
            });
            
            stats.tasksSkippedDueToMissingReferences++;
            continue;
          }
          
          try {
            // @ts-ignore - We know the structure is compatible even if TypeScript doesn't
            await taskStorage.createTask(task);
            const createdTask = await taskStorage.getTaskById(task.id!);
            if (createdTask) {
              updatedServerTasks.push(createdTask);
              existingIds.add(task.id!); // Add to existing IDs for subsequent validation
              stats.tasksAddedToServer++;
            }
          } catch (error) {
            // Log and collect failed tasks
            this.logger.error('TaskmasterSyncTool', `Failed to create task ${task.id}: ${error}`, { task, error });
            failedTasks.push({ task, error });
            stats.tasksFailed++;
          }
        }
      }
      
      // Process updates by level
      for (const level of Array.from(taskUpdatesByLevel.keys()).sort((a, b) => a - b)) {
        const updates = taskUpdatesByLevel.get(level) || [];
        
        for (const { taskId, data } of updates) {
          try {
            await taskStorage.updateTask(taskId, data);
            const updatedTask = await taskStorage.getTaskById(taskId);
            if (updatedTask) {
              updatedServerTasks.push(updatedTask);
              stats.tasksUpdatedInServer++;
            }
          } catch (error) {
            this.logger.error('TaskmasterSyncTool', `Failed to update task ${taskId}: ${error}`, { taskId, data, error });
            stats.tasksFailed++;
          }
        }
      }
      
      // Add existing server tasks to the updated list
      for (const serverTask of serverTasks) {
        if (!updatedServerTasks.some(t => t.id === serverTask.id)) {
          updatedServerTasks.push(serverTask);
        }
      }
      
      // Now, convert updated server tasks to Taskmaster format
      const updatedServerTasksInTmFormat = await this.convertServerTasksToTaskmaster(updatedServerTasks);
      
      // Process server tasks to Taskmaster
      for (const serverTaskInTmFormat of updatedServerTasksInTmFormat) {
        const tmTask = tmTasksMap.get(serverTaskInTmFormat.id);
        
        if (!tmTask) {
          // Task exists in server but not in Taskmaster - add it
          taskmasterTasks.push(serverTaskInTmFormat);
          stats.tasksAddedToTaskmaster++;
        } else {
          // Task exists in both - check if server version was chosen for conflict
          const serverTask = serverTasksMap.get(serverTaskInTmFormat.id);
          if (serverTask && tmTask) {
            const hasConflict = this.hasChanges(serverTask, this.convertTaskmasterTaskToModel(tmTask));
            
            if (hasConflict && !forceTaskmasterAsSource && !this.isTaskmasterVersionNewer(tmTask, serverTask)) {
              // Keep server version
              const taskIndex = taskmasterTasks.findIndex(t => t.id === tmTask.id);
              if (taskIndex !== -1) {
                taskmasterTasks[taskIndex] = serverTaskInTmFormat;
                stats.tasksUpdatedInTaskmaster++;
              }
            }
          }
        }
      }
      
      // Write updated tasks to Taskmaster file
      await this.writeTaskmasterTasks(taskmasterTasks, taskmasterFile);
      
      // Release lock
      await fs.unlink(lockFile);
      
      return {
        success: stats.tasksFailed === 0,
        message: stats.tasksFailed > 0 
          ? `Bidirectional sync completed with ${stats.tasksFailed} failed tasks` 
          : `Bidirectional sync completed successfully`,
        stats,
        failedTasks: failedTasks.length > 0 ? failedTasks.map(f => ({ id: f.task.id, error: f.error.message })) : undefined,
        skippedTasks: skippedTasks.length > 0 ? skippedTasks : undefined
      };
    } catch (error) {
      this.logger.error('TaskmasterSyncTool', `Error in bidirectional sync: ${error}`, { error });
      
      // Try to release lock
      try {
        await fs.unlink(lockFile);
      } catch (e) {
        // Ignore errors when releasing lock
      }
      
      return {
        success: false,
        message: `Error in bidirectional sync: ${error}`,
        error
      };
    }
  }

  /**
   * Get tasks from Taskmaster tasks.json file
   * @param taskmasterFile Optional file path (defaults to tasks/tasks.json)
   * @returns Array of Taskmaster tasks
   */
  private async getTaskmasterTasks(taskmasterFile?: string): Promise<any[]> {
    // Default to tasks/tasks.json if no file provided
    const filePath = taskmasterFile 
      ? (path.isAbsolute(taskmasterFile) ? taskmasterFile : path.join(process.cwd(), taskmasterFile))
      : path.join(process.cwd(), 'tasks', 'tasks.json');
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read and parse the file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const tasksData = JSON.parse(fileContent);
      
      // Return the tasks array or empty array if not found
      // Handle both formats: direct array or { tasks: [...] }
      if (Array.isArray(tasksData)) {
        return tasksData;
      } else if (tasksData && Array.isArray(tasksData.tasks)) {
        return tasksData.tasks;
      } else {
        this.logger.warn('TaskmasterSyncTool', `Invalid tasks format in ${filePath}`, { tasksData });
        return [];
      }
    } catch (error) {
      // If file doesn't exist or can't be read, return empty array
      this.logger.error('TaskmasterSyncTool', `Error reading tasks file: ${error}`, { error, filePath });
      return [];
    }
  }

  /**
   * Write tasks to Taskmaster tasks.json file
   * @param tasks Tasks to write
   * @param taskmasterFile Optional file path (defaults to tasks/tasks.json)
   */
  private async writeTaskmasterTasks(tasks: any[], taskmasterFile?: string): Promise<void> {
    // Default to tasks/tasks.json if no file provided
    const filePath = taskmasterFile 
      ? (path.isAbsolute(taskmasterFile) ? taskmasterFile : path.join(process.cwd(), taskmasterFile))
      : path.join(process.cwd(), 'tasks', 'tasks.json');
    
    // Create directory if it doesn't exist
    const targetDir = path.dirname(filePath);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Write tasks to file in the { tasks: [...] } format
    const tasksObject = { tasks };
    await fs.writeFile(filePath, JSON.stringify(tasksObject, null, 2), 'utf-8');
  }

  /**
   * Convert a Taskmaster task to server task model
   */
  private convertTaskmasterTaskToModel(tmTask: any): Partial<TaskModel> {
    // Create a timestamp for the task
    const now = new Date();
    const nowIso = now.toISOString();
    
    // Extract IDs from dependencies
    const dependencies = Array.isArray(tmTask.dependencies) 
      ? tmTask.dependencies.map((dep: any) => dep.toString()) 
      : [];
    
    // Determine parent from ID format (e.g., "1.2" has parent "1")
    const idParts = tmTask.id.toString().split('.');
    const parent = idParts.length > 1 
      ? idParts.slice(0, -1).join('.') 
      : null;
    
    // Enhanced comprehensive status mapping
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'in-progress': 'in_progress',
      'done': 'completed',
      'deferred': 'deferred',
      'cancelled': 'cancelled',
      'review': 'review',
      'blocked': 'blocked',
      'todo': 'pending',
      'completed': 'completed',
      'in_progress': 'in_progress'
    };

    // Enhanced priority mapping
    const priorityMap: Record<string, string> = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'critical': 'critical',
      'urgent': 'high',
      'normal': 'medium',
      'minor': 'low'
    };
    
    // Convert status and priority
    const status = statusMap[tmTask.status] || 'pending';
    const priority = priorityMap[tmTask.priority] || 'medium';
    
    // Create the task model with required fields
    return {
      id: tmTask.id.toString(),
      title: tmTask.title,
      description: tmTask.details || tmTask.description || '',
      status,
      priority,
      complexity: tmTask.complexity || 'medium',
      type: tmTask.type || 'task', // Default type if not specified
      parent,
      dependencies,
      createdAt: tmTask.createdAt || nowIso,
      updatedAt: tmTask.updatedAt || nowIso,
      tags: tmTask.tags || [],
      level: idParts.length // Add the level field based on ID depth
    };
  }

  /**
   * Convert server tasks to Taskmaster format
   */
  private async convertServerTasksToTaskmaster(serverTasks: TaskModel[]): Promise<any[]> {
    // Group tasks by parent
    const tasksByParent: Record<string, TaskModel[]> = {};
    const topLevelTasks: TaskModel[] = [];
    
    for (const task of serverTasks) {
      if (task.parent) {
        if (!tasksByParent[task.parent]) {
          tasksByParent[task.parent] = [];
        }
        // Safe to access since we just initialized it if it didn't exist
        tasksByParent[task.parent]?.push(task);
      } else {
        topLevelTasks.push(task);
      }
    }
    
    // Convert tasks recursively
    const convertTask = (task: TaskModel): any => {
      // Enhanced status mapping from server to Taskmaster
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'in_progress': 'in-progress',
        'completed': 'done',
        'deferred': 'deferred',
        'cancelled': 'cancelled',
        'review': 'review',
        'blocked': 'blocked'
      };

      // Enhanced priority mapping
      const priorityMap: Record<string, string> = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
        'critical': 'critical'
      };
      
      // Convert status and priority
      const status = statusMap[task.status] || 'pending';
      const priority = priorityMap[task.priority] || 'medium';
      
      // Get subtasks for this task
      const subtasks = tasksByParent[task.id];
      
      // Create the Taskmaster task
      const tmTask: any = {
        id: task.id,
        title: task.title,
        status,
        priority,
        details: task.description || '',
        dependencies: task.dependencies || [],
        updatedAt: task.updatedAt || new Date().toISOString()
      };
      
      // Add subtasks if they exist
      if (subtasks && subtasks.length > 0) {
        tmTask.subtasks = subtasks.map(convertTask);
      }
      
      return tmTask;
    };
    
    // Convert all top-level tasks
    return topLevelTasks.map(convertTask);
  }
} 