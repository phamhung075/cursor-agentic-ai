import { TaskModel } from '../database/TaskMapper';

// Result set with pagination info
export interface TaskQueryResult {
  tasks: TaskModel[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Query options for task filtering
export interface TaskQueryOptions {
  status?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  assignee?: string | string[];
  parent?: string | null;
  level?: number;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  withChildren?: boolean;
  includeCompleted?: boolean;
}

/**
 * TaskStorageService - Interface for task storage implementations
 * This interface ensures compatibility between different storage backends (SQLite, Supabase, etc.)
 */
export interface TaskStorageService {
  /**
   * Initialize the storage service
   */
  initialize(): Promise<void>;

  /**
   * Create a new task
   */
  createTask(task: Omit<TaskModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskModel>;

  /**
   * Update an existing task
   */
  updateTask(id: string, updates: Partial<TaskModel>): Promise<TaskModel>;

  /**
   * Delete a task and all its relationships
   */
  deleteTask(id: string): Promise<boolean>;

  /**
   * Get a task by ID
   */
  getTaskById(id: string, includeChildren?: boolean): Promise<TaskModel | null>;

  /**
   * Get tasks with optional filtering
   */
  getTasks(options?: TaskQueryOptions): Promise<TaskQueryResult>;

  /**
   * Get all children of a task (direct children only)
   */
  getTaskChildren(parentId: string): Promise<TaskModel[]>;

  /**
   * Get a hierarchical tree of tasks starting from a root task
   */
  getTaskTree(rootId: string, depth?: number): Promise<TaskModel>;

  /**
   * Import tasks from a JSON file
   */
  importTasksFromJson(filePath: string): Promise<number>;

  /**
   * Export tasks to a JSON file
   */
  exportTasksToJson(filePath: string, options?: {
    rootTaskId?: string;
    includeAll?: boolean;
  }): Promise<number>;
} 