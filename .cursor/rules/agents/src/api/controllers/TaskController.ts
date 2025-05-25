import { Request, Response } from 'express';
import { TaskManager } from '../../core/tasks/TaskManager';
import { 
  APIResponse, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskQueryRequest,
  BulkTaskUpdateRequest,
  BulkTaskResponse 
} from '../../types/APITypes';
import { Task, TaskOperationResult } from '../../types/TaskTypes';

/**
 * Task Controller
 * 
 * Handles all task-related API endpoints including CRUD operations,
 * bulk operations, and task queries.
 */
export class TaskController {
  private taskManager: TaskManager;

  constructor(taskManager: TaskManager) {
    this.taskManager = taskManager;
  }

  /**
   * Get all tasks with filtering and pagination
   */
  public async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as TaskQueryRequest;
      
      // Build filter criteria
      const filters: any = {};
      
      if (query.status) filters.status = Array.isArray(query.status) ? query.status : [query.status];
      if (query.priority) filters.priority = Array.isArray(query.priority) ? query.priority : [query.priority];
      if (query.complexity) filters.complexity = Array.isArray(query.complexity) ? query.complexity : [query.complexity];
      if (query.assignee) filters.assignee = Array.isArray(query.assignee) ? query.assignee : [query.assignee];
      if (query.tags) filters.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
      if (query.parentId) filters.parentId = query.parentId;
      
      // Date filters
      if (query.dueBefore) filters.dueBefore = new Date(query.dueBefore);
      if (query.dueAfter) filters.dueAfter = new Date(query.dueAfter);
      if (query.createdBefore) filters.createdBefore = new Date(query.createdBefore);
      if (query.createdAfter) filters.createdAfter = new Date(query.createdAfter);
      
      // Get tasks
      const tasks = this.taskManager.queryTasks(filters);
      
      // Apply search filter if provided
      let filteredTasks = tasks;
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredTasks = tasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm) ||
          task.description?.toLowerCase().includes(searchTerm) ||
          task.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply sorting
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      
      filteredTasks.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Apply pagination
      const page = parseInt(query.page?.toString() || '1');
      const limit = parseInt(query.limit?.toString() || '50');
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
      const total = filteredTasks.length;
      const totalPages = Math.ceil(total / limit);
      
      const response: APIResponse<Task[]> = {
        success: true,
        data: paginatedTasks,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0',
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to get tasks');
    }
  }

  /**
   * Get task by ID
   */
  public async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task with ID ${id} not found`
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const response: APIResponse<Task> = {
        success: true,
        data: task,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to get task');
    }
  }

  /**
   * Create new task
   */
  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData = req.body as CreateTaskRequest;
      
      // Validate required fields
      if (!taskData.title || !taskData.type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title and type are required fields'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const result = await this.taskManager.createTask({
        title: taskData.title,
        description: taskData.description,
        type: taskData.type as any,
        priority: taskData.priority as any,
        complexity: taskData.complexity as any,
        estimatedHours: taskData.estimatedHours,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        assignee: taskData.assignee,
        tags: taskData.tags,
        parentId: taskData.parentId,
        metadata: taskData.metadata
      });
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TASK_CREATION_FAILED',
            message: result.error || 'Failed to create task'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const response: APIResponse<Task> = {
        success: true,
        data: result.task!,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to create task');
    }
  }

  /**
   * Update task
   */
  public async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateTaskRequest;
      
      const result = await this.taskManager.updateTask(id, {
        title: updates.title,
        description: updates.description,
        status: updates.status as any,
        priority: updates.priority as any,
        complexity: updates.complexity as any,
        estimatedHours: updates.estimatedHours,
        actualHours: updates.actualHours,
        progress: updates.progress,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        assignee: updates.assignee,
        tags: updates.tags,
        metadata: updates.metadata
      });
      
      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: statusCode === 404 ? 'TASK_NOT_FOUND' : 'TASK_UPDATE_FAILED',
            message: result.error || 'Failed to update task'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const response: APIResponse<Task> = {
        success: true,
        data: result.task!,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update task');
    }
  }

  /**
   * Delete task
   */
  public async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await this.taskManager.deleteTask(id);
      
      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: statusCode === 404 ? 'TASK_NOT_FOUND' : 'TASK_DELETE_FAILED',
            message: result.error || 'Failed to delete task'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const response: APIResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to delete task');
    }
  }

  /**
   * Bulk update tasks
   */
  public async bulkUpdateTasks(req: Request, res: Response): Promise<void> {
    try {
      const { taskIds, updates, options } = req.body as BulkTaskUpdateRequest;
      
      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'taskIds array is required and cannot be empty'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const results: BulkTaskResponse = {
        successful: [],
        failed: [],
        summary: {
          total: taskIds.length,
          successful: 0,
          failed: 0
        }
      };
      
      for (const taskId of taskIds) {
        try {
          const result = await this.taskManager.updateTask(taskId, {
            title: updates.title,
            description: updates.description,
            status: updates.status as any,
            priority: updates.priority as any,
            complexity: updates.complexity as any,
            estimatedHours: updates.estimatedHours,
            actualHours: updates.actualHours,
            progress: updates.progress,
            dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
            assignee: updates.assignee,
            tags: updates.tags,
            metadata: updates.metadata
          });
          
          if (result.success) {
            results.successful.push(taskId);
            results.summary.successful++;
          } else {
            results.failed.push({
              taskId,
              error: result.error || 'Unknown error'
            });
            results.summary.failed++;
          }
        } catch (error) {
          results.failed.push({
            taskId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          results.summary.failed++;
          
          if (!options?.continueOnError) {
            break;
          }
        }
      }
      
      const response: APIResponse<BulkTaskResponse> = {
        success: results.summary.failed === 0,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to bulk update tasks');
    }
  }

  /**
   * Get task hierarchy (children)
   */
  public async getTaskHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task with ID ${id} not found`
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).context.requestId,
            version: '1.0.0'
          }
        });
        return;
      }
      
      const children = this.taskManager.getTaskChildren(id);
      
      const response: APIResponse<{ task: Task; children: Task[] }> = {
        success: true,
        data: { task, children },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context.requestId,
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to get task hierarchy');
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(res: Response, error: any, message: string): void {
    console.error(`TaskController Error: ${message}`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: 'unknown',
        version: '1.0.0'
      }
    });
  }
} 