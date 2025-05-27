import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';

/**
 * Delete Task Tool
 * 
 * Tool for deleting a task by ID
 */
export class DeleteTaskTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'delete_task';
    const description = 'Permanently delete a task by its ID. This operation cannot be undone and removes all task data from the system.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'The unique identifier of the task to delete' 
        },
        cascade: {
          type: 'boolean',
          description: 'Whether to also delete all child tasks (subtasks) of this task'
        }
      },
      required: ['id'],
      examples: [
        { id: "task_123" },
        { id: "epic_001", cascade: true }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the delete task functionality
   * @param params The parameters for deleting a task
   * @returns The result of the delete operation
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Get the task ID and cascade flag
      const taskId = params['id'] as string;
      const cascade = params['cascade'] as boolean | undefined;

      // Check if task exists
      const existingTask = await taskStorage.getTaskById(taskId);
      if (!existingTask) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // If task has children and cascade is not true, prevent deletion
      if (existingTask.children.length > 0 && !cascade) {
        throw new Error(`Task ${taskId} has ${existingTask.children.length} children. Set cascade=true to delete them as well.`);
      }

      // If cascade is true, delete all children first
      if (cascade && existingTask.children.length > 0) {
        await taskStorage.deleteAllSubtasks(taskId);
      }

      // Delete the task
      const result = await taskStorage.deleteTask(taskId);
      
      // Return the result
      return {
        id: taskId,
        deleted: result,
        childrenDeleted: cascade ? existingTask.children.length : 0
      };
    } catch (error) {
      this.logger.error('DELETE-TASK', 'Failed to delete task', {
        id: params['id'],
        cascade: params['cascade'],
        error
      });
      throw error;
    }
  }
} 