import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';

/**
 * Get Task Tool
 * 
 * Tool for retrieving a task by ID
 */
export class GetTaskTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'get_task';
    const description = 'Retrieve a task by its ID, including all details and metadata. Can be used to fetch any task, subtask, or parent-child relationships.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'The unique identifier of the task to retrieve' 
        },
        includeChildren: {
          type: 'boolean',
          description: 'Whether to include child tasks in the response'
        }
      },
      required: ['id'],
      examples: [
        { id: "task_123" },
        { id: "feat_001", includeChildren: true }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the get task functionality
   * @param params The parameters for getting a task
   * @returns The requested task
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Get the task ID and includeChildren flag
      const taskId = params['id'] as string;
      const includeChildren = params['includeChildren'] as boolean | undefined;

      // Get the task
      const task = await taskStorage.getTaskById(taskId, includeChildren);

      // Check if task exists
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Prepare the response - already in correct format from TaskModel
      const response = {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        level: task.level,
        status: task.status,
        priority: task.priority,
        complexity: task.complexity,
        parent: task.parent,
        tags: task.tags || [],
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        progress: task.progress,
        aiGenerated: task.aiGenerated,
        aiConfidence: task.aiConfidence,
        children: task.children
      };
      
      return response;
    } catch (error) {
      this.logger.error('GET-TASK', 'Failed to get task', {
        id: params['id'],
        error
      });
      throw error;
    }
  }
} 