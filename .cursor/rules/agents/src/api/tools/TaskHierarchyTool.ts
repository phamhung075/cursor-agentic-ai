import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';

/**
 * Task Hierarchy Tool
 * 
 * Tool for retrieving a task and its children in a hierarchical structure
 */
export class TaskHierarchyTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'task_hierarchy';
    const description = 'Retrieve a task along with its child tasks (subtasks) in a hierarchical structure. This allows visualizing the parent-child relationships of tasks.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'The unique identifier of the parent task whose hierarchy to retrieve' 
        },
        depth: {
          type: 'number',
          description: 'How many levels of hierarchy to retrieve (default: 1, which retrieves only direct children)',
          minimum: 1,
          maximum: 10
        },
        includeDetails: {
          type: 'boolean',
          description: 'Whether to include full details of tasks or just basic information'
        }
      },
      required: ['id'],
      examples: [
        { id: "task_123" },
        { id: "epic_001", depth: 3, includeDetails: true }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the task hierarchy functionality
   * @param params The parameters for retrieving a task hierarchy
   * @returns The task and its children
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Get the task ID and options
      const taskId = params['id'] as string;
      const depth = params['depth'] as number | undefined || 1;
      const includeDetails = params['includeDetails'] as boolean | undefined;

      // Check if task exists
      const task = await taskStorage.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Get the children
      let children;
      if (depth > 1) {
        // Use the getTaskTree method which recursively gets the hierarchy
        const taskTree = await taskStorage.getTaskTree(taskId, depth);
        // The taskTree includes the parent, so we extract just the children
        children = taskTree.children.map(childId => 
          taskStorage.getTaskById(childId)
        );
        children = await Promise.all(children);
      } else {
        // Just get the direct children
        children = await taskStorage.getTaskChildren(taskId);
      }

      // Filter out children that might be null (deleted or missing)
      children = children.filter(child => child !== null);

      // Prepare the response based on includeDetails flag
      if (includeDetails) {
        return {
          task,
          children
        };
      } else {
        // Return basic information only
        return {
          task: this.simplifyTask(task),
          children: children.map(child => this.simplifyTask(child))
        };
      }
    } catch (error) {
      this.logger.error('TASK-HIERARCHY', 'Failed to get task hierarchy', {
        id: params['id'],
        depth: params['depth'],
        error
      });
      throw error;
    }
  }

  /**
   * Helper method to simplify a task to just basic information
   */
  private simplifyTask(task: any): any {
    return {
      id: task.id,
      title: task.title,
      type: task.type,
      level: task.level,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      children: task.children ? task.children.length : 0
    };
  }
} 