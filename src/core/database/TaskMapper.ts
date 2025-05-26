import { Task, TaskRelationship, NewTask, NewTaskRelationship } from './schema';

/**
 * Task model that matches the nested_tasks.json structure
 */
export interface TaskModel {
  id: string;
  type: string;
  level: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  complexity: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  aiGenerated: boolean;
  aiConfidence?: number;
  parent: string | null;
  children: string[];
  dependencies: string[];
  blockedBy: string[];
  enables: string[];
  tags: string[];
  assignee?: string | null;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  startedAt?: string | null;
  metadata?: Record<string, any>;
  aiAnalysis?: Record<string, any>;
}

/**
 * TaskMapper - Utility to convert between Drizzle models and application models
 */
export class TaskMapper {
  /**
   * Convert a database Task to an application TaskModel
   */
  public static toTaskModel(
    task: Task, 
    children: string[] = [], 
    relationships: TaskRelationship[] = []
  ): TaskModel {
    return {
      id: task.id,
      type: task.type,
      level: task.level,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      complexity: task.complexity,
      estimatedHours: task.estimatedHours || undefined,
      actualHours: task.actualHours || undefined,
      progress: task.progress,
      aiGenerated: task.aiGenerated,
      aiConfidence: task.aiConfidence || undefined,
      parent: task.parentId || null,
      children: children,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      blockedBy: task.blockedBy ? JSON.parse(task.blockedBy) : [],
      enables: task.enables ? JSON.parse(task.enables) : [],
      tags: task.tags ? JSON.parse(task.tags) : [],
      assignee: task.assignee || null,
      dueDate: task.dueDate || undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt || null,
      startedAt: task.startedAt || null,
      metadata: task.metadata ? JSON.parse(task.metadata) : undefined,
      aiAnalysis: task.aiAnalysis ? JSON.parse(task.aiAnalysis) : undefined
    };
  }

  /**
   * Convert an application TaskModel to a database Task
   */
  public static toDatabaseTask(model: TaskModel): NewTask {
    return {
      id: model.id,
      type: model.type,
      level: model.level,
      title: model.title,
      description: model.description || null,
      status: model.status,
      priority: model.priority,
      complexity: model.complexity,
      estimatedHours: model.estimatedHours || null,
      actualHours: model.actualHours || null,
      progress: model.progress,
      aiGenerated: model.aiGenerated,
      aiConfidence: model.aiConfidence || null,
      parentId: model.parent || null,
      dependencies: model.dependencies?.length ? JSON.stringify(model.dependencies) : null,
      blockedBy: model.blockedBy?.length ? JSON.stringify(model.blockedBy) : null,
      enables: model.enables?.length ? JSON.stringify(model.enables) : null,
      tags: model.tags?.length ? JSON.stringify(model.tags) : null,
      assignee: model.assignee || null,
      dueDate: model.dueDate || null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      completedAt: model.completedAt || null,
      startedAt: model.startedAt || null,
      metadata: model.metadata ? JSON.stringify(model.metadata) : null,
      aiAnalysis: model.aiAnalysis ? JSON.stringify(model.aiAnalysis) : null
    };
  }

  /**
   * Create task relationship records for a task and its children
   */
  public static createTaskRelationships(taskId: string, childIds: string[]): NewTaskRelationship[] {
    return childIds.map((childId, index) => ({
      id: `${taskId}_${childId}`,
      parentId: taskId,
      childId: childId,
      order: index
    }));
  }

  /**
   * Parse JSON safely with a fallback value
   */
  private static safeParseJson<T>(json: string | null | undefined, fallback: T): T {
    if (!json) return fallback;
    try {
      return JSON.parse(json) as T;
    } catch (e) {
      return fallback;
    }
  }
} 