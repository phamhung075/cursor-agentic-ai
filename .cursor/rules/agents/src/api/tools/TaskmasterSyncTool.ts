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
    const description = 'Synchronize tasks between the server and Taskmaster. Can perform one-way sync from Taskmaster to server, from server to Taskmaster, or bidirectional sync.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        direction: { 
          type: 'string', 
          description: 'The direction of synchronization', 
          enum: ['from_taskmaster', 'to_taskmaster', 'bidirectional']
        },
        taskmasterFile: {
          type: 'string',
          description: 'Path to the Taskmaster tasks.json file. If not provided, will use the default path (tasks/tasks.json)'
        },
        force: {
          type: 'boolean',
          description: 'Whether to force overwriting existing tasks even if there are conflicts'
        },
        forceTaskmasterAsSource: {
          type: 'boolean',
          description: 'Whether to force Taskmaster as the source of truth'
        },
        syncTimeout: {
          type: 'number',
          description: 'The timeout for bidirectional sync'
        }
      },
      required: ['direction'],
      examples: [
        { direction: "from_taskmaster" },
        { direction: "to_taskmaster", taskmasterFile: "custom/path/tasks.json" },
        { direction: "bidirectional", force: true }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Execute the tool
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      const direction = params['direction'] || 'bidirectional';
      const taskmasterFile = params['taskmasterFile'];
      const forceTaskmasterAsSource = params['forceTaskmasterAsSource'] === true || false;

      const taskStorage = taskStorageFactory.getTaskStorage();

      // Perform the requested sync operation
      switch (direction) {
        case 'from_taskmaster':
          return await this.syncFromTaskmaster(taskmasterFile, taskStorage, forceTaskmasterAsSource);
          
        case 'to_taskmaster':
          return await this.syncToTaskmaster(taskmasterFile, taskStorage, forceTaskmasterAsSource);
          
        case 'bidirectional':
          return await this.bidirectionalSync({
            taskmasterFile,
            forceTaskmasterAsSource,
            syncTimeout: params['syncTimeout'] || 30000
          });
          
        default:
          throw new Error(`Invalid sync direction: ${direction}. Must be one of: from_taskmaster, to_taskmaster, bidirectional`);
      }
    } catch (error) {
      this.logger.error('TASKMASTER-SYNC', 'Failed to execute sync operation', { error });
      throw error;
    }
  }

  /**
   * Sync tasks from Taskmaster to the server
   */
  private async syncFromTaskmaster(
    taskmasterFilePath: string, 
    taskStorage: any, 
    force: boolean
  ): Promise<any> {
    try {
      // Read tasks from Taskmaster JSON file
      const taskmasterContent = await fs.readFile(taskmasterFilePath, 'utf-8');
      const taskmasterData = JSON.parse(taskmasterContent);
      const taskmasterTasks = taskmasterData.tasks || [];

      // Stats for the operation
      const stats = {
        totalTasks: taskmasterTasks.length,
        created: 0,
        updated: 0,
        unchanged: 0,
        errors: 0,
        skipped: 0
      };

      // Process all tasks from Taskmaster
      for (const tmTask of taskmasterTasks) {
        try {
          // Convert Taskmaster task to server task model
          const taskModel = this.convertTaskmasterTaskToModel(tmTask);
          
          // Check if task exists in server
          const existingTask = await taskStorage.getTaskById(taskModel.id);
          
          if (!existingTask) {
            // Create new task in server
            await taskStorage.createTask(taskModel as any);
            stats.created++;
          } else {
            // Check if task needs update
            if (this.hasChanges(existingTask, taskModel) || force) {
              // Update existing task
              await taskStorage.updateTask(taskModel.id, taskModel);
              stats.updated++;
            } else {
              stats.unchanged++;
            }
          }
          
          // Handle subtasks if present
          if (tmTask.subtasks && tmTask.subtasks.length > 0) {
            const subtaskStats = await this.processTaskmasterSubtasks(
              tmTask.subtasks, 
              taskStorage, 
              force
            );
            
            // Merge subtask stats with main stats
            stats.totalTasks += subtaskStats.totalTasks;
            stats.created += subtaskStats.created;
            stats.updated += subtaskStats.updated;
            stats.unchanged += subtaskStats.unchanged;
            stats.errors += subtaskStats.errors;
            stats.skipped += subtaskStats.skipped;
          }
        } catch (error) {
          this.logger.error('TASKMASTER-SYNC', `Error processing task ${tmTask.id}`, { error });
          stats.errors++;
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error('TASKMASTER-SYNC', 'Failed to sync from Taskmaster', { error });
      throw error;
    }
  }

  /**
   * Process subtasks from Taskmaster
   */
  private async processTaskmasterSubtasks(
    subtasks: any[], 
    taskStorage: any, 
    force: boolean
  ): Promise<any> {
    const stats = {
      totalTasks: subtasks.length,
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      skipped: 0
    };

    for (const subtask of subtasks) {
      try {
        // Convert subtask to server model
        const subtaskModel = this.convertTaskmasterTaskToModel(subtask);
        
        // Check if subtask exists
        const existingSubtask = await taskStorage.getTaskById(subtaskModel.id);
        
        if (!existingSubtask) {
          // Create new subtask
          await taskStorage.createTask(subtaskModel as any);
          stats.created++;
        } else {
          // Check if subtask needs update
          if (this.hasChanges(existingSubtask, subtaskModel) || force) {
            // Update existing subtask
            await taskStorage.updateTask(subtaskModel.id, subtaskModel);
            stats.updated++;
          } else {
            stats.unchanged++;
          }
        }
        
        // Handle nested subtasks if present
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          const nestedStats = await this.processTaskmasterSubtasks(
            subtask.subtasks, 
            taskStorage, 
            force
          );
          
          // Merge nested stats
          stats.totalTasks += nestedStats.totalTasks;
          stats.created += nestedStats.created;
          stats.updated += nestedStats.updated;
          stats.unchanged += nestedStats.unchanged;
          stats.errors += nestedStats.errors;
          stats.skipped += nestedStats.skipped;
        }
      } catch (error) {
        this.logger.error('TASKMASTER-SYNC', `Error processing subtask ${subtask.id}`, { error });
        stats.errors++;
      }
    }
    
    return stats;
  }

  /**
   * Sync tasks from the server to Taskmaster
   */
  private async syncToTaskmaster(
    taskmasterFilePath: string, 
    taskStorage: any, 
    force: boolean
  ): Promise<any> {
    try {
      // Get all tasks from server
      const serverTasks = await taskStorage.getTasks({ limit: 1000 });
      
      // Read existing Taskmaster file
      const taskmasterContent = await fs.readFile(taskmasterFilePath, 'utf-8');
      const taskmasterData = JSON.parse(taskmasterContent);
      
      // Map server tasks to Taskmaster format
      const taskmasterTasks = await this.convertServerTasksToTaskmaster(serverTasks.tasks);
      
      // Update Taskmaster data
      taskmasterData.tasks = taskmasterTasks;
      
      // Write updated Taskmaster file
      await fs.writeFile(taskmasterFilePath, JSON.stringify(taskmasterData, null, 2), 'utf-8');
      
      // Generate task files using Taskmaster CLI
      try {
        await execAsync('npx task-master generate');
      } catch (error) {
        this.logger.warn('TASKMASTER-SYNC', 'Failed to generate task files', { error });
      }
      
      return {
        success: true,
        tasksCount: taskmasterTasks.length
      };
    } catch (error) {
      this.logger.error('TASKMASTER-SYNC', 'Failed to sync to Taskmaster', { error });
      throw error;
    }
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
        const lockAgeMs = now.getTime() - lockTime.getTime();
        
        // If lock is older than the timeout, consider it stale
        if (lockAgeMs < syncTimeout) {
          return {
            success: false,
            error: 'Sync already in progress. Try again later.',
            syncedTasks: 0,
            syncedToTaskmaster: 0
          };
        }
        
        // Lock is stale, remove it
        await fs.unlink(lockFile);
      } catch (err) {
        // Lock file doesn't exist, which is good
      }
      
      // Create a new lock file
      await fs.writeFile(lockFile, new Date().toISOString());
      
      // Get tasks from Taskmaster
      const taskmasterTasks = await this.getTaskmasterTasks(taskmasterFile);
      
      // Get tasks from server
      const taskStorage = taskStorageFactory.getTaskStorage();
      const serverTasks = await taskStorage.getAllTasks();
      
      // Track sync statistics
      const stats = {
        tasksAddedToServer: 0,
        tasksUpdatedInServer: 0,
        tasksAddedToTaskmaster: 0,
        tasksUpdatedInTaskmaster: 0,
        conflicts: 0,
        conflictsResolvedToTaskmaster: 0,
        conflictsResolvedToServer: 0
      };
      
      // Create a map of server tasks by ID for quick lookup
      const serverTasksMap = new Map<string, TaskModel>();
      serverTasks.forEach(task => {
        serverTasksMap.set(task.id, task);
      });
      
      // Convert Taskmaster tasks to task models for comparison
      const tmTaskModels = taskmasterTasks.map(tmTask => {
        return this.convertTaskmasterTaskToModel(tmTask);
      });
      
      // Create a map of Taskmaster tasks by ID for quick lookup
      const tmTasksMap = new Map<string, any>();
      taskmasterTasks.forEach(task => {
        tmTasksMap.set(task.id.toString(), task);
      });
      
      // Process tasks from Taskmaster to server
      for (const tmTaskModel of tmTaskModels) {
        if (!tmTaskModel.id) continue;
        
        const serverTask = serverTasksMap.get(tmTaskModel.id);
        
        if (!serverTask) {
          // Task exists in Taskmaster but not in server - add it
          try {
            await taskStorage.createTask(tmTaskModel as TaskModel);
            stats.tasksAddedToServer++;
          } catch (err) {
            this.logger.error('Error adding task from Taskmaster to server', { error: err, taskId: tmTaskModel.id });
          }
        } else {
          // Task exists in both systems - check for conflicts
          const hasConflict = this.hasChanges(serverTask, tmTaskModel);
          
          if (hasConflict) {
            stats.conflicts++;
            
            // Determine which version to keep
            let useTaskmaster = forceTaskmasterAsSource || 
                               this.isTaskmasterVersionNewer(tmTasksMap.get(tmTaskModel.id), serverTask);
            
            if (useTaskmaster) {
              // Update server with Taskmaster version
              try {
                await taskStorage.updateTask(tmTaskModel.id, tmTaskModel);
                stats.tasksUpdatedInServer++;
                stats.conflictsResolvedToTaskmaster++;
              } catch (err) {
                this.logger.error('Error updating server task from Taskmaster', { error: err, taskId: tmTaskModel.id });
              }
            } else {
              stats.conflictsResolvedToServer++;
              // Server version will be used when updating Taskmaster later
            }
          }
        }
      }
      
      // Only push changes to Taskmaster if we're not forcing it as the source
      // In force mode, we only sync one way: Taskmaster -> Server
      if (!forceTaskmasterAsSource) {
        // Convert server tasks to Taskmaster format
        const updatedServerTasksInTmFormat = await this.convertServerTasksToTaskmaster(serverTasks);
        
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
            const hasConflict = this.hasChanges(serverTask!, this.convertTaskmasterTaskToModel(tmTask));
            
            if (hasConflict && !forceTaskmasterAsSource && 
                !this.isTaskmasterVersionNewer(tmTask, serverTask)) {
              // Update Taskmaster with server version
              // Replace the task in the taskmasterTasks array
              const index = taskmasterTasks.findIndex(t => t.id.toString() === serverTaskInTmFormat.id.toString());
              if (index !== -1) {
                taskmasterTasks[index] = serverTaskInTmFormat;
                stats.tasksUpdatedInTaskmaster++;
              }
            }
          }
        }
        
        // Write updated tasks to Taskmaster file
        await this.writeTaskmasterTasks(taskmasterTasks, taskmasterFile);
      }
      
      // Remove the lock file
      await fs.unlink(lockFile);
      
      // Return the result
      return {
        success: true,
        syncedFromTaskmaster: stats.tasksAddedToServer + stats.tasksUpdatedInServer,
        syncedToTaskmaster: stats.tasksAddedToTaskmaster + stats.tasksUpdatedInTaskmaster,
        conflicts: stats.conflicts,
        resolvedToTaskmaster: stats.conflictsResolvedToTaskmaster,
        resolvedToServer: stats.conflictsResolvedToServer,
        details: stats
      };
      
    } catch (err) {
      // Ensure lock file is removed even if there's an error
      try {
        await fs.unlink(lockFile);
      } catch (unlinkErr) {
        // Ignore error removing lock file
      }
      
      throw err;
    }
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
      'completed': 'completed',
      'deferred': 'deferred',
      'blocked': 'blocked',
      'review': 'review',
      'cancelled': 'cancelled',
      'on_hold': 'on_hold',
      'in_review': 'review',
      'approved': 'completed',
      'rejected': 'blocked',
      'backlog': 'pending'
    };
    
    // Enhanced comprehensive priority mapping
    const priorityMap: Record<string, string> = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'critical': 'critical',
      'urgent': 'high',
      'normal': 'medium',
      'trivial': 'low',
      'blocker': 'critical',
      'major': 'high',
      'minor': 'low'
    };
    
    // Create the task model
    return {
      id: tmTask.id.toString(),
      title: tmTask.title,
      description: tmTask.description || '',
      type: 'task',
      level: idParts.length, // Level based on ID depth
      status: statusMap[tmTask.status] || 'pending',
      priority: priorityMap[tmTask.priority] || 'medium',
      complexity: 'medium',
      parent: parent,
      tags: [],
      dependencies: dependencies,
      blockedBy: [],
      enables: [],
      children: [], // Will be populated by the storage service
      progress: tmTask.status === 'done' ? 100 : 0,
      aiGenerated: true,
      aiConfidence: 0.8,
      estimatedHours: null as unknown as number,
      dueDate: null as unknown as string,
      assignee: null,
      startedAt: tmTask.status === 'in-progress' ? nowIso : null,
      completedAt: tmTask.status === 'done' ? nowIso : null,
      createdAt: nowIso,
      updatedAt: nowIso,
      metadata: {
        details: tmTask.details || '',
        testStrategy: tmTask.testStrategy || '',
        source: 'taskmaster'
      }
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
        tasksByParent[task.parent].push(task);
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
        'blocked': 'blocked',
        'review': 'review',
        'cancelled': 'cancelled',
        'on_hold': 'on_hold'
      };
      
      // Enhanced priority mapping from server to Taskmaster
      const priorityMap: Record<string, string> = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
        'critical': 'high'
      };
      
      // Create Taskmaster task
      const tmTask: any = {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: statusMap[task.status || 'pending'] || 'pending',
        dependencies: task.dependencies || [],
        priority: priorityMap[task.priority || 'medium'] || 'medium'
      };
      
      // Add details and testStrategy if available in metadata
      if (task.metadata) {
        const metadata = typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata)
          : task.metadata || {};
          
        if (metadata && typeof metadata === 'object' && metadata.details) {
          tmTask.details = metadata.details;
        }
        
        if (metadata && typeof metadata === 'object' && metadata.testStrategy) {
          tmTask.testStrategy = metadata.testStrategy;
        }
      }
      
      // Add subtasks if available
      const subtasks = tasksByParent[task.id] || [];
      if (subtasks.length > 0) {
        tmTask.subtasks = subtasks.map(convertTask);
      }
      
      return tmTask;
    };
    
    // Convert all top-level tasks
    return topLevelTasks.map(convertTask);
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
  private hasChanges(existingTask: any, taskModel: Partial<TaskModel>): boolean {
    // Basic change detection - check key fields
    return (
      existingTask.title !== taskModel.title ||
      existingTask.description !== taskModel.description ||
      existingTask.status !== taskModel.status ||
      existingTask.priority !== taskModel.priority ||
      // Check dependencies (simple length check for basic detection)
      (existingTask.dependencies?.length || 0) !== (taskModel.dependencies?.length || 0)
    );
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
      
      // Return the tasks array
      return Array.isArray(tasksData) ? tasksData : [];
    } catch (err) {
      this.logger.error('TASKMASTER-SYNC', `Failed to read Taskmaster tasks from ${filePath}`, { error: err });
      // Return empty array if file doesn't exist or can't be parsed
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
    
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write the tasks to file
      await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('TASKMASTER-SYNC', `Failed to write Taskmaster tasks to ${filePath}`, { error: err });
      throw err;
    }
  }
} 