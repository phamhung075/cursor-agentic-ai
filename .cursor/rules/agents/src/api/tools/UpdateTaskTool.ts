import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';

/**
 * Update Task Tool
 * 
 * Tool for updating an existing task by ID
 */
export class UpdateTaskTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'update_task';
    const description = 'Update an existing task by ID with new values for its properties. Can modify title, description, status, priority, and other task attributes.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'The unique identifier of the task to update' 
        },
        title: { 
          type: 'string', 
          description: 'New title for the task' 
        },
        description: { 
          type: 'string', 
          description: 'New description for the task' 
        },
        status: { 
          type: 'string', 
          description: 'New status for the task',
          enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
        },
        priority: { 
          type: 'string', 
          description: 'New priority for the task',
          enum: ['low', 'medium', 'high', 'critical']
        },
        complexity: { 
          type: 'string', 
          description: 'New complexity for the task',
          enum: ['low', 'medium', 'high', 'very_complex']
        },
        progress: { 
          type: 'number', 
          description: 'New progress percentage (0-100)',
          minimum: 0,
          maximum: 100
        },
        estimatedHours: { 
          type: 'number', 
          description: 'New estimated hours to complete',
          minimum: 0
        },
        actualHours: { 
          type: 'number', 
          description: 'New actual hours spent',
          minimum: 0
        },
        tags: { 
          type: 'array', 
          description: 'New tags for the task',
          items: {
            type: 'string'
          }
        },
        dueDate: { 
          type: 'string', 
          description: 'New due date in ISO format',
          format: 'date-time'
        },
        assignee: { 
          type: 'string', 
          description: 'New assignee for the task'
        }
      },
      required: ['id'],
      examples: [
        { 
          id: "task_123", 
          status: "in-progress", 
          progress: 25 
        },
        { 
          id: "task_456", 
          title: "Refactored API Endpoint", 
          description: "Updated with better error handling", 
          priority: "high" 
        }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the update task functionality
   * @param params The parameters for updating a task
   * @returns The updated task
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Get the task ID
      const taskId = params['id'] as string;

      // Check if task exists
      const existingTask = await taskStorage.getTaskById(taskId);
      if (!existingTask) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Create update timestamp
      const now = new Date();
      const nowIso = now.toISOString();

      // Build the update object with only the fields that were provided
      const updates: Record<string, any> = {
        updatedAt: nowIso
      };

      // Add only the fields that were provided in the params
      if (params['title'] !== undefined) updates['title'] = params['title'];
      if (params['description'] !== undefined) updates['description'] = params['description'];
      if (params['status'] !== undefined) {
        updates['status'] = params['status'];
        
        // If status is being set to completed, set completedAt
        if (params['status'] === 'completed' && existingTask.status !== 'completed') {
          updates['completedAt'] = nowIso;
        }
        // If status is being changed from completed, clear completedAt
        else if (params['status'] !== 'completed' && existingTask.status === 'completed') {
          updates['completedAt'] = null;
        }
      }
      if (params['priority'] !== undefined) updates['priority'] = params['priority'];
      if (params['complexity'] !== undefined) updates['complexity'] = params['complexity'];
      if (params['progress'] !== undefined) updates['progress'] = params['progress'];
      if (params['estimatedHours'] !== undefined) updates['estimatedHours'] = params['estimatedHours'];
      if (params['actualHours'] !== undefined) updates['actualHours'] = params['actualHours'];
      if (params['tags'] !== undefined) updates['tags'] = params['tags'];
      if (params['dueDate'] !== undefined) updates['dueDate'] = params['dueDate'];
      if (params['assignee'] !== undefined) {
        updates['assignee'] = params['assignee'];
        
        // If assignee is being set and task wasn't started, mark as started
        if (params['assignee'] && !existingTask.startedAt) {
          updates['startedAt'] = nowIso;
        }
      }

      // Update the task
      const updatedTask = await taskStorage.updateTask(taskId, updates);
      
      // Return a simplified response
      return {
        id: updatedTask.id,
        title: updatedTask.title,
        status: updatedTask.status,
        priority: updatedTask.priority,
        progress: updatedTask.progress,
        updatedAt: updatedTask.updatedAt
      };
    } catch (error) {
      this.logger.error('UPDATE-TASK', 'Failed to update task', {
        id: params['id'],
        error
      });
      throw error;
    }
  }
} 