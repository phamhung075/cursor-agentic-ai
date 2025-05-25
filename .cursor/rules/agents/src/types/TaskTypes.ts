/**
 * Task Management Type Definitions
 * 
 * Comprehensive type definitions for the AI-driven nested task management system.
 */

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'blocked' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent' 
  | 'critical';

export type TaskComplexity = 
  | 'trivial' 
  | 'simple' 
  | 'medium' 
  | 'complex' 
  | 'very_complex';

export type TaskType = 
  | 'epic' 
  | 'feature' 
  | 'story' 
  | 'task' 
  | 'subtask' 
  | 'bug' 
  | 'improvement' 
  | 'research';

/**
 * Core Task interface representing a single task in the hierarchy
 */
export interface Task {
  id: string;
  type: TaskType;
  level: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedHours: number | null;
  actualHours: number | null;
  progress: number; // 0-100
  aiGenerated: boolean;
  aiConfidence: number; // 0-1
  parent: string | null;
  children?: string[];
  dependencies?: string[];
  blockedBy?: string[];
  enables?: string[];
  tags: string[];
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  metadata?: TaskMetadata;
  aiAnalysis?: TaskAIAnalysis;
}

/**
 * Task metadata containing additional information
 */
export interface TaskMetadata {
  businessValue?: 'low' | 'medium' | 'high' | 'very-high';
  technicalRisk?: 'low' | 'medium' | 'high' | 'very-high';
  userImpact?: 'low' | 'medium' | 'high' | 'very-high';
  domain?: string;
  framework?: string;
  testingRequired?: boolean;
  documentationRequired?: boolean;
  [key: string]: any;
}

/**
 * AI analysis data for tasks
 */
export interface TaskAIAnalysis {
  complexityFactors: string[];
  riskFactors?: string[];
  recommendations?: string[];
  suggestedApproach?: string;
  testingStrategy?: string;
  estimatedEffort?: {
    min: number;
    max: number;
    confidence: number;
  };
  similarTasks?: string[];
  learningPoints?: string[];
}

/**
 * Task hierarchy representation with nested structure
 */
export interface TaskHierarchy {
  task: Task;
  children: TaskHierarchy[];
  depth: number;
  totalDescendants: number;
  relationships: TaskRelationship;
}

/**
 * Task relationship mapping
 */
export interface TaskRelationship {
  dependencies: string[];
  dependents: string[];
  blockers: string[];
  blocked: string[];
  parent: string | null;
  children: string[];
}

/**
 * Result of task validation
 */
export interface HierarchyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Result of task operations
 */
export interface TaskOperationResult {
  success: boolean;
  taskId: string;
  error?: string;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Task query filters
 */
export interface TaskQueryFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  complexity?: TaskComplexity[];
  type?: TaskType[];
  assignee?: string[];
  tags?: string[];
  dueDateRange?: {
    start: string;
    end: string;
  };
  createdDateRange?: {
    start: string;
    end: string;
  };
  hasParent?: boolean;
  hasChildren?: boolean;
  aiGenerated?: boolean;
  minProgress?: number;
  maxProgress?: number;
}

/**
 * Task sorting options
 */
export interface TaskSortOptions {
  field: keyof Task;
  direction: 'asc' | 'desc';
  secondary?: {
    field: keyof Task;
    direction: 'asc' | 'desc';
  };
}

/**
 * Task statistics
 */
export interface TaskStatistics {
  totalTasks: number;
  rootTasks: number;
  maxDepth: number;
  statusDistribution: Record<TaskStatus, number>;
  priorityDistribution: Record<TaskPriority, number>;
  complexityDistribution: Record<TaskComplexity, number>;
  averageProgress: number;
  completionRate: number;
  aiGeneratedPercentage: number;
}

/**
 * Task creation input
 */
export interface CreateTaskInput {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  complexity: TaskComplexity;
  parent?: string;
  dependencies?: string[];
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  metadata?: Partial<TaskMetadata>;
}

/**
 * Task update input
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  progress?: number;
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  parent?: string | null;
  metadata?: Partial<TaskMetadata>;
}

/**
 * Bulk task operation
 */
export interface BulkTaskOperation {
  operation: 'update' | 'delete' | 'move';
  taskIds: string[];
  data?: UpdateTaskInput | { newParent: string };
}

/**
 * Task dependency graph node
 */
export interface DependencyGraphNode {
  taskId: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  criticalPath: boolean;
}

/**
 * Task timeline event
 */
export interface TaskTimelineEvent {
  id: string;
  taskId: string;
  type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'completed' | 'deleted';
  timestamp: string;
  userId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

/**
 * Task template for AI generation
 */
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  defaultPriority: TaskPriority;
  defaultComplexity: TaskComplexity;
  estimatedHours: number;
  tags: string[];
  subtaskTemplates?: TaskTemplate[];
  metadata: TaskMetadata;
  aiPrompt?: string;
}

/**
 * AI task generation context
 */
export interface AITaskGenerationContext {
  projectContext: string;
  parentTask?: Task;
  requirements: string[];
  constraints: string[];
  preferences: {
    maxDepth?: number;
    preferredComplexity?: TaskComplexity;
    timeframe?: string;
  };
  existingTasks: Task[];
}

/**
 * Task automation rule
 */
export interface TaskAutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  actions: {
    type: string;
    parameters: Record<string, any>;
  }[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

/**
 * Task performance metrics
 */
export interface TaskPerformanceMetrics {
  taskId: string;
  estimationAccuracy: number; // 0-1
  completionTime: number; // hours
  blockedTime: number; // hours
  reworkTime: number; // hours
  qualityScore: number; // 0-1
  effortVariance: number; // percentage
  dependencyImpact: number; // 0-1
}

/**
 * Task recommendation
 */
export interface TaskRecommendation {
  type: 'priority_adjustment' | 'dependency_optimization' | 'resource_allocation' | 'timeline_adjustment';
  taskId: string;
  recommendation: string;
  reasoning: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
} 