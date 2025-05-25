/**
 * API Type Definitions
 * 
 * Comprehensive type definitions for REST API endpoints
 * that expose intelligent task management functionality.
 */

import { Task, TaskOperationResult } from './TaskTypes';
import { AutomationRule, Workflow, AutomationEvent, AutomationExecutionResult, AutomationMetrics } from './AutomationTypes';

/**
 * Base API response structure
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIMetadata;
}

/**
 * API error structure
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * API metadata
 */
export interface APIMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  executionTime?: number;
  pagination?: PaginationInfo;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * API request with pagination
 */
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task API request types
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  complexity?: string;
  estimatedHours?: number;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  complexity?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskQueryRequest extends PaginatedRequest {
  status?: string[];
  priority?: string[];
  complexity?: string[];
  assignee?: string[];
  tags?: string[];
  parentId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  createdBefore?: string;
  createdAfter?: string;
}

/**
 * AI Decomposition API types
 */
export interface DecomposeTaskRequest {
  taskId: string;
  strategy?: 'complexity' | 'domain' | 'timeline' | 'dependency';
  maxDepth?: number;
  targetComplexity?: string;
}

export interface DecomposeTaskResponse {
  originalTask: Task;
  decomposedTasks: Task[];
  decompositionStrategy: string;
  confidence: number;
  reasoning: string[];
  metadata: {
    totalSubtasks: number;
    averageComplexity: string;
    estimatedTimeReduction: number;
  };
}

/**
 * Priority Management API types
 */
export interface UpdatePriorityRequest {
  taskId: string;
  newPriority: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface PriorityAnalysisRequest {
  taskIds?: string[];
  includeRecommendations?: boolean;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface PriorityAnalysisResponse {
  analysis: Array<{
    taskId: string;
    currentPriority: string;
    recommendedPriority: string;
    confidence: number;
    reasoning: string[];
    factors: Record<string, number>;
  }>;
  globalRecommendations: string[];
  metadata: {
    analysisTime: number;
    tasksAnalyzed: number;
    recommendationsGenerated: number;
  };
}

/**
 * Learning Service API types
 */
export interface LearningFeedbackRequest {
  taskId: string;
  feedbackType: 'estimation' | 'complexity' | 'decomposition' | 'general';
  rating: number; // 1-5
  comments?: string;
  metadata?: Record<string, any>;
}

export interface LearningInsightsRequest {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  categories?: string[];
  minConfidence?: number;
  limit?: number;
}

export interface LearningStatsResponse {
  totalLearningEvents: number;
  accuracyMetrics: {
    estimationAccuracy: number;
    complexityAccuracy: number;
    decompositionAccuracy: number;
  };
  improvementTrends: Array<{
    metric: string;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
  }>;
  recommendations: string[];
}

/**
 * Automation API types
 */
export interface CreateAutomationRuleRequest {
  name: string;
  description?: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  conditions?: Array<{
    type: string;
    operator: string;
    field?: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  priority?: number;
  enabled?: boolean;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    onSuccess?: string;
    onFailure?: string;
  }>;
  enabled?: boolean;
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  context?: Record<string, any>;
  variables?: Record<string, any>;
}

/**
 * Bulk operation types
 */
export interface BulkTaskUpdateRequest {
  taskIds: string[];
  updates: UpdateTaskRequest;
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkTaskResponse {
  successful: string[];
  failed: Array<{
    taskId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Analytics API types
 */
export interface AnalyticsRequest {
  timeframe: {
    start: string;
    end: string;
  };
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, any>;
}

export interface AnalyticsResponse {
  timeframe: {
    start: string;
    end: string;
  };
  metrics: Record<string, any>;
  trends: Array<{
    metric: string;
    data: Array<{
      timestamp: string;
      value: number;
    }>;
  }>;
  insights: string[];
}

/**
 * Health check types
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    lastCheck: string;
    details?: Record<string, any>;
  }>;
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
}

/**
 * WebSocket message types for API communication
 */
export interface APIWebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface TaskUpdateMessage extends APIWebSocketMessage {
  type: 'task_update';
  payload: {
    taskId: string;
    changes: Record<string, any>;
  };
}

export interface AutomationEventMessage extends APIWebSocketMessage {
  type: 'automation_event';
  payload: {
    eventType: string;
    data: any;
  };
}

/**
 * API configuration types
 */
export interface APIConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  auth: {
    enabled: boolean;
    jwtSecret?: string;
    tokenExpiry?: string;
  };
  validation: {
    strict: boolean;
    stripUnknown: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    requests: boolean;
    responses: boolean;
  };
  websocket: {
    enabled: boolean;
    path: string;
  };
}

/**
 * Request context
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

/**
 * API route handler type
 */
export type APIHandler<TRequest = any, TResponse = any> = (
  req: TRequest & { context: RequestContext },
  res: any
) => Promise<APIResponse<TResponse>>;

/**
 * Middleware types
 */
export interface ValidationMiddleware {
  body?: any; // JSON schema
  query?: any; // JSON schema
  params?: any; // JSON schema
}

export interface AuthMiddleware {
  required: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface RateLimitMiddleware {
  windowMs: number;
  max: number;
  message?: string;
} 