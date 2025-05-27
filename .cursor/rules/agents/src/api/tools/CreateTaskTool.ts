import { BaseTool } from './BaseTool';
import { IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskModel } from '../../core/database/TaskMapper';

/**
 * Create Task Tool
 * 
 * Tool for creating a new task in the system
 */
export class CreateTaskTool extends BaseTool {
  constructor(logger: Logger) {
    // Define the tool's metadata and schema
    const name = 'create_task';
    const description = 'Create a new task in the system with comprehensive metadata. Tasks can be nested in a hierarchy and have various properties to describe their nature, priority, and relationships.';
    const inputSchema: IToolSchema = {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Task title - should be concise but descriptive (max 100 chars)'
        },
        description: { 
          type: 'string', 
          description: 'Detailed task description explaining what needs to be done, acceptance criteria, and any relevant context'
        },
        type: { 
          type: 'string', 
          description: 'Task type categorizing the work (epic, feature, task, bug, subtask, etc.)',
          enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
        },
        level: { 
          type: 'number', 
          description: 'Task hierarchy level (1=Epic, 2=Feature, 3=Task, 4=Subtask, etc.)',
          minimum: 1,
          maximum: 5
        },
        status: { 
          type: 'string', 
          description: 'Current task status in the workflow',
          enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
        },
        priority: { 
          type: 'string', 
          description: 'Task priority level reflecting importance and urgency',
          enum: ['low', 'medium', 'high', 'critical']
        },
        complexity: { 
          type: 'string', 
          description: 'Estimated task complexity affecting effort required',
          enum: ['low', 'medium', 'high', 'very_complex']
        },
        parent: { 
          type: 'string', 
          description: 'Parent task ID if this is a subtask or part of a larger feature/epic (null for top-level tasks)'
        },
        tags: { 
          type: 'array', 
          description: 'List of tags for categorization and filtering',
          items: {
            type: 'string'
          },
          examples: [['backend', 'database', 'migration'], ['frontend', 'ui', 'component']]
        },
        estimatedHours: {
          type: 'number',
          description: 'Estimated time to complete the task in hours',
          minimum: 0
        },
        dueDate: {
          type: 'string',
          description: 'Due date for task completion in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)',
          format: 'date-time'
        }
      },
      required: ['title', 'type', 'level'],
      examples: [
        {
          title: "Implement user authentication",
          description: "Create the authentication system with login, registration, and password reset functionality",
          type: "feature",
          level: 2,
          status: "pending",
          priority: "high",
          complexity: "medium",
          tags: ["backend", "security", "user-management"]
        },
        {
          title: "Fix navigation menu overflow on mobile",
          description: "The navigation menu items overflow on mobile devices smaller than 375px width",
          type: "bug",
          level: 3,
          status: "in-progress",
          priority: "medium",
          complexity: "low",
          parent: "feat_001",
          tags: ["frontend", "responsive", "mobile"]
        }
      ]
    };

    // Call the parent constructor
    super(name, description, inputSchema, logger);
  }

  /**
   * Implementation of the create task functionality
   * @param params The parameters for creating a task
   * @returns The created task
   */
  protected async executeImpl(params: Record<string, any>): Promise<any> {
    try {
      // Get the task storage
      const taskStorage = await taskStorageFactory.getStorageService();

      // Create current timestamps
      const now = new Date();
      const nowIso = now.toISOString();

      // Create a task model from the parameters
      const task: Partial<TaskModel> = {
        title: params['title'],
        description: params['description'] || '',
        type: params['type'],
        level: params['level'],
        status: params['status'] || 'pending',
        priority: params['priority'] || 'medium',
        complexity: params['complexity'] || 'medium',
        parent: params['parent'] || null,
        tags: params['tags'] || [],
        dependencies: [],
        blockedBy: [],
        enables: [],
        children: [],
        progress: 0,
        aiGenerated: true,
        aiConfidence: 0.8,
        estimatedHours: params['estimatedHours'] || null,
        dueDate: params['dueDate'] || null,
        assignee: null,
        startedAt: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        metadata: {}
      };

      // Validate parent exists if specified
      if (task.parent) {
        const parent = await taskStorage.getTaskById(task.parent);
        if (!parent) {
          throw new Error(`Parent task with ID ${task.parent} not found`);
        }
      }

      // Create the task
      const createdTask = await taskStorage.createTask(task as Omit<TaskModel, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Return the created task
      return {
        id: createdTask.id,
        title: createdTask.title,
        type: createdTask.type,
        level: createdTask.level,
        status: createdTask.status,
        createdAt: createdTask.createdAt
      };
    } catch (error) {
      this.logger.error('CREATE-TASK', 'Failed to create task', {
        params,
        error
      });
      throw error;
    }
  }
}