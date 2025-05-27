import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';

/**
 * Bulk Update Task Tool
 * 
 * Tool for updating multiple tasks at once with the same updates
 */
export class BulkUpdateTaskTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'bulk_update_tasks';
    const description = 'Update multiple tasks at once with the same set of updates. Useful for changing status, priority, or other properties across a set of tasks.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        taskIds: { 
          type: 'array',
          description: 'Array of task IDs to update',
          items: {
            type: 'string'
          } 
        },
        status: { 
          type: 'string', 
          description: 'New status for all tasks',
          enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
        },
        priority: { 
          type: 'string', 
          description: 'New priority for all tasks',
          enum: ['low', 'medium', 'high', 'critical']
        },
        complexity: { 
          type: 'string', 
          description: 'New complexity for all tasks',
          enum: ['low', 'medium', 'high', 'very_complex']
        },
        progress: { 
          type: 'number', 
          description: 'New progress percentage (0-100) for all tasks',
          minimum: 0,
          maximum: 100
        },
        tags: { 
          type: 'array', 
          description: 'New tags for all tasks',
          items: {
            type: 'string'
          }
        },
        assignee: { 
          type: 'string', 
          description: 'New assignee for all tasks'
        },
        continueOnError: {
          type: 'boolean',
          description: 'Whether to continue processing if updating one task fails'
        }
      },
      required: ['taskIds'],
      examples: [
        { 
          taskIds: ["task_123", "task_456", "task_789"],
          status: "completed",
          progress: 100
        },
        { 
          taskIds: ["task_234", "task_567"],
          priority: "high",
          assignee: "john.doe",
          continueOnError: true
        }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the bulk update functionality
   * @param params The parameters for bulk updating tasks
   * @returns The results of the update operations
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Get the task IDs and continue on error flag
      const taskIds = params['taskIds'] as string[];
      const continueOnError = params['continueOnError'] as boolean || false;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        throw new Error('Task IDs array is required and cannot be empty');
      }

      // Create update timestamp
      const now = new Date();
      const nowIso = now.toISOString();

      // Build the update object with only the fields that were provided
      const updates: Record<string, any> = {
        updatedAt: nowIso
      };

      // Add only the fields that were provided in the params
      if (params['status'] !== undefined) updates['status'] = params['status'];
      if (params['priority'] !== undefined) updates['priority'] = params['priority'];
      if (params['complexity'] !== undefined) updates['complexity'] = params['complexity'];
      if (params['progress'] !== undefined) updates['progress'] = params['progress'];
      if (params['tags'] !== undefined) updates['tags'] = params['tags'];
      if (params['assignee'] !== undefined) updates['assignee'] = params['assignee'];
      
      // Special handling for completedAt based on status
      if (params['status'] === 'completed') {
        updates['completedAt'] = nowIso;
      } else if (params['status'] !== undefined) {
        // Only clear completedAt if status is being changed to something other than completed
        updates['completedAt'] = null;
      }

      // Process each task
      const results = {
        successful: [] as string[],
        failed: [] as { taskId: string, error: string }[],
        summary: {
          total: taskIds.length,
          successful: 0,
          failed: 0
        }
      };

      for (const taskId of taskIds) {
        try {
          // Check if task exists
          const existingTask = await taskStorage.getTaskById(taskId);
          if (!existingTask) {
            throw new Error(`Task with ID ${taskId} not found`);
          }

          // Update the task
          await taskStorage.updateTask(taskId, updates);
          
          // Track success
          results.successful.push(taskId);
          results.summary.successful++;
        } catch (error) {
          // Track failure
          results.failed.push({
            taskId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          results.summary.failed++;
          
          // Stop processing if continueOnError is false
          if (!continueOnError) {
            break;
          }
        }
      }

      return results;
    } catch (error) {
      this.logger.error('BULK-UPDATE-TASKS', 'Failed to bulk update tasks', {
        taskIds: params['taskIds'],
        error
      });
      throw error;
    }
  }
} 