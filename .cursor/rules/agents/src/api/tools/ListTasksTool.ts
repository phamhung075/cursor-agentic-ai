import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskQueryOptions } from '../../core/tasks/TaskStorageService';

/**
 * List Tasks Tool
 * 
 * Tool for listing tasks with filtering options
 */
export class ListTasksTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'list_tasks';
    const description = 'List tasks in the system with optional filtering by status, type, priority, and other attributes. Can paginate results and control sorting order.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          description: 'Filter tasks by status',
          enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled', 'all']
        },
        type: {
          type: 'string',
          description: 'Filter tasks by type',
          enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other', 'all']
        },
        priority: {
          type: 'string',
          description: 'Filter tasks by priority',
          enum: ['low', 'medium', 'high', 'critical', 'all']
        },
        level: {
          type: 'number',
          description: 'Filter tasks by hierarchy level (1=Epic, 2=Feature, 3=Task, 4=Subtask, etc.)',
          minimum: 1,
          maximum: 5
        },
        parent: {
          type: 'string',
          description: 'Filter tasks by parent ID to show only subtasks of a specific parent'
        },
        tags: {
          type: 'array',
          description: 'Filter tasks by tags (matches if task has ANY of the specified tags)',
          items: {
            type: 'string'
          }
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
          minimum: 1,
          default: 1
        },
        pageSize: {
          type: 'number',
          description: 'Number of tasks per page',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        sortBy: {
          type: 'string',
          description: 'Field to sort by',
          enum: ['createdAt', 'updatedAt', 'priority', 'status', 'title', 'dueDate']
        },
        sortDirection: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc']
        }
      },
      examples: [
        { status: "pending", priority: "high", sortBy: "dueDate", sortDirection: "asc" },
        { parent: "epic_123", pageSize: 50 },
        { tags: ["frontend", "ui"], type: "bug" }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the list tasks functionality
   * @param params The parameters for listing tasks
   * @returns The list of tasks
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Default values
      const page = params['page'] || 1;
      const pageSize = params['pageSize'] || 20;
      const sortBy = params['sortBy'] || 'createdAt';
      const sortDirection = params['sortDirection'] || 'desc';

      // Build query options
      const queryOptions: TaskQueryOptions = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: sortBy,
        orderDirection: sortDirection as 'asc' | 'desc'
      };
      
      // Add filters for each parameter if provided
      if (params['status'] && params['status'] !== 'all') {
        queryOptions.status = params['status'];
      }
      
      if (params['type'] && params['type'] !== 'all') {
        queryOptions.type = params['type'];
      }
      
      if (params['priority'] && params['priority'] !== 'all') {
        queryOptions.priority = params['priority'];
      }
      
      if (params['level']) {
        queryOptions.level = params['level'];
      }
      
      if (params['parent']) {
        queryOptions.parent = params['parent'];
      }
      
      if (params['tags'] && Array.isArray(params['tags']) && params['tags'].length > 0) {
        queryOptions.tags = params['tags'];
      }

      // Get tasks with filters
      const result = await taskStorage.getTasks(queryOptions);
      
      // Format the response
      return {
        tasks: result.tasks.map(task => ({
          id: task.id,
          title: task.title,
          type: task.type,
          level: task.level,
          status: task.status,
          priority: task.priority,
          parent: task.parent,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          tags: task.tags || [],
          dueDate: task.dueDate
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize)
      };
    } catch (error) {
      this.logger.error('LIST-TASKS', 'Failed to list tasks', {
        filters: params,
        error
      });
      throw error;
    }
  }
} 