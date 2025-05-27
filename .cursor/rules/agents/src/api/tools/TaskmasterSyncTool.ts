import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskModel } from '../../core/database/TaskMapper';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

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
   * Implementation of the taskmaster sync functionality
   * @param params The parameters for syncing tasks
   * @returns The result of the sync operation
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get parameters
      const direction = params['direction'] as 'from_taskmaster' | 'to_taskmaster' | 'bidirectional';
      const taskmasterFile = params['taskmasterFile'] as string || 'tasks/tasks.json';
      const force = params['force'] as boolean || false;

      // Validate Taskmaster file exists
      const taskmasterFilePath = path.isAbsolute(taskmasterFile) 
        ? taskmasterFile 
        : path.join(process.cwd(), taskmasterFile);
      
      try {
        await fs.access(taskmasterFilePath);
      } catch (error) {
        throw new Error(`Taskmaster file not found at: ${taskmasterFilePath}`);
      }

      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Execute the appropriate sync operation based on direction
      let result;
      switch (direction) {
        case 'from_taskmaster':
          result = await this.syncFromTaskmaster(taskmasterFilePath, taskStorage, force);
          break;
        case 'to_taskmaster':
          result = await this.syncToTaskmaster(taskmasterFilePath, taskStorage, force);
          break;
        case 'bidirectional':
          result = await this.bidirectionalSync(taskmasterFilePath, taskStorage, force);
          break;
        default:
          throw new Error(`Invalid direction: ${direction}`);
      }

      return {
        success: true,
        direction,
        result
      };
    } catch (error) {
      this.logger.error('TASKMASTER-SYNC', 'Failed to sync with Taskmaster', {
        direction: params['direction'],
        taskmasterFile: params['taskmasterFile'],
        force: params['force'],
        error
      });
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
   * Perform bidirectional sync between server and Taskmaster
   */
  private async bidirectionalSync(
    taskmasterFilePath: string, 
    taskStorage: any, 
    force: boolean
  ): Promise<any> {
    try {
      // First sync from Taskmaster to server
      const fromTaskmasterResult = await this.syncFromTaskmaster(
        taskmasterFilePath, 
        taskStorage, 
        force
      );
      
      // Then sync from server to Taskmaster
      const toTaskmasterResult = await this.syncToTaskmaster(
        taskmasterFilePath, 
        taskStorage, 
        force
      );
      
      return {
        fromTaskmaster: fromTaskmasterResult,
        toTaskmaster: toTaskmasterResult
      };
    } catch (error) {
      this.logger.error('TASKMASTER-SYNC', 'Failed to perform bidirectional sync', { error });
      throw error;
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
    
    // Map status
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'in-progress': 'in_progress',
      'done': 'completed',
      'deferred': 'deferred',
      'blocked': 'blocked',
      'review': 'review'
    };
    
    // Map priority
    const priorityMap: Record<string, string> = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'critical': 'critical'
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
      // Map status
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'in_progress': 'in-progress',
        'completed': 'done',
        'deferred': 'deferred',
        'blocked': 'blocked',
        'review': 'review'
      };
      
      // Map priority
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
        status: statusMap[task.status] || 'pending',
        dependencies: task.dependencies || [],
        priority: priorityMap[task.priority] || 'medium'
      };
      
      // Add details and testStrategy if available in metadata
      if (task.metadata) {
        const metadata = typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata)
          : task.metadata || {};
          
        if (metadata && metadata.details) {
          tmTask.details = metadata.details;
        }
        
        if (metadata && metadata.testStrategy) {
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
   * Check if a task has changes compared to another
   */
  private hasChanges(existingTask: TaskModel, newTask: Partial<TaskModel>): boolean {
    // Check basic properties
    if (existingTask.title !== newTask.title) return true;
    if (existingTask.description !== newTask.description) return true;
    if (existingTask.status !== newTask.status) return true;
    if (existingTask.priority !== newTask.priority) return true;
    
    // Check metadata
    const existingMetadata = typeof existingTask.metadata === 'string'
      ? JSON.parse(existingTask.metadata)
      : existingTask.metadata || {};
      
    const newMetadata = typeof newTask.metadata === 'string'
      ? JSON.parse(newTask.metadata as string)
      : newTask.metadata || {};
      
    if (existingMetadata.details !== newMetadata.details) return true;
    if (existingMetadata.testStrategy !== newMetadata.testStrategy) return true;
    
    return false;
  }
} 