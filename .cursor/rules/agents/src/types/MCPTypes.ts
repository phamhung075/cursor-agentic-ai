/**
 * MCP Types for AAI System Enhanced
 * 
 * Type definitions for Model Context Protocol integration
 * with the intelligent task management system.
 */

import { Task, TaskPriority, TaskStatus } from './TaskTypes';
import { AutomationRule, WorkflowExecutionContext } from './AutomationTypes';

// Note: Zod schemas will be defined when zod is available
// For now, we'll use TypeScript interfaces for validation

// ============================================================================
// MCP Tool Input Types
// ============================================================================

/**
 * Task Management Tools
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  parentId?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string; // ISO date string
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
}

export interface GetTaskInput {
  taskId: string;
}

export interface ListTasksInput {
  projectId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  limit?: number;
  offset?: number;
}

export interface DeleteTaskInput {
  taskId: string;
}

/**
 * AI Task Decomposition Tools
 */
export interface DecomposeTaskInput {
  taskId: string;
  maxDepth?: number;
  includeEstimates?: boolean;
  analysisType?: 'basic' | 'detailed' | 'comprehensive';
}

export interface AnalyzeComplexityInput {
  taskDescription: string;
  context?: string;
  includeRecommendations?: boolean;
}

/**
 * Priority Management Tools
 */
export interface CalculatePriorityInput {
  taskId: string;
  factors?: {
    urgency?: number;
    importance?: number;
    effort?: number;
    dependencies?: number;
  };
}

export interface UpdatePriorityInput {
  taskId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason?: string;
}

export interface GetPriorityInsightsInput {
  projectId?: string;
  timeframe?: 'day' | 'week' | 'month' | 'quarter';
}

/**
 * Automation Tools
 */
export interface CreateAutomationRuleInput {
  name: string;
  description?: string;
  projectId?: string;
  trigger: {
    type: 'task_created' | 'task_updated' | 'task_completed' | 'priority_changed' | 'schedule';
    conditions?: Record<string, any>;
  };
  actions: Array<{
    type: 'update_task' | 'create_task' | 'send_notification' | 'update_priority' | 'assign_user';
    parameters: Record<string, any>;
  }>;
  isActive?: boolean;
}

export interface ExecuteWorkflowInput {
  workflowId: string;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ListAutomationRulesInput {
  projectId?: string;
  isActive?: boolean;
  limit?: number;
}

/**
 * Learning and Analytics Tools
 */
export interface GetLearningInsightsInput {
  projectId?: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  includeRecommendations?: boolean;
}

export interface TrainModelInput {
  modelType: 'estimation' | 'priority' | 'decomposition';
  projectId?: string;
  dataRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface GetAnalyticsInput {
  projectId?: string;
  metrics?: Array<'task_completion_rate' | 'average_task_duration' | 'priority_accuracy' | 'automation_efficiency' | 'team_productivity'>;
  timeframe?: 'day' | 'week' | 'month' | 'quarter';
}

/**
 * System Management Tools
 */
export interface GetSystemStatusInput {
  includeMetrics?: boolean;
  includeHealth?: boolean;
}

export interface GetProjectContextInput {
  projectId: string;
  includeMemory?: boolean;
  includeSettings?: boolean;
}

// ============================================================================
// MCP Response Types
// ============================================================================

export interface MCPTaskResponse {
  task: Task;
  metadata?: {
    decomposition?: any;
    priority?: any;
    automation?: any;
  };
}

export interface MCPTaskListResponse {
  tasks: Task[];
  total: number;
  hasMore: boolean;
  metadata?: {
    filters: any;
    sorting: any;
  };
}

export interface MCPDecompositionResponse {
  taskId: string;
  subtasks: Task[];
  analysis: {
    complexity: number;
    estimatedHours: number;
    recommendations: string[];
    dependencies: string[];
  };
  metadata: {
    analysisType: string;
    confidence: number;
    timestamp: string;
  };
}

export interface MCPPriorityResponse {
  taskId: string;
  priority: TaskPriority;
  score: number;
  factors: {
    urgency: number;
    importance: number;
    effort: number;
    dependencies: number;
  };
  reasoning: string;
  recommendations: string[];
}

export interface MCPAutomationResponse {
  ruleId: string;
  rule: AutomationRule;
  execution?: WorkflowExecutionContext;
  status: 'created' | 'executed' | 'failed';
  message: string;
}

export interface MCPLearningResponse {
  insights: {
    patterns: any[];
    recommendations: string[];
    metrics: Record<string, number>;
  };
  model?: {
    type: string;
    accuracy: number;
    lastTrained: string;
  };
  metadata: {
    dataPoints: number;
    timeframe: string;
    confidence: number;
  };
}

export interface MCPAnalyticsResponse {
  metrics: Record<string, {
    value: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
  charts: {
    type: string;
    data: any[];
    labels: string[];
  }[];
  summary: {
    highlights: string[];
    concerns: string[];
    recommendations: string[];
  };
}

export interface MCPSystemResponse {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  version: string;
  capabilities: string[];
  metrics: {
    tasksProcessed: number;
    automationRules: number;
    activeProjects: number;
    memoryUsage: number;
  };
  health: {
    database: 'connected' | 'disconnected';
    ai: 'available' | 'unavailable';
    automation: 'running' | 'stopped';
  };
}

// ============================================================================
// MCP Error Types
// ============================================================================

export interface MCPError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export const MCPErrorCodes = {
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  DECOMPOSITION_FAILED: 'DECOMPOSITION_FAILED',
  PRIORITY_CALCULATION_FAILED: 'PRIORITY_CALCULATION_FAILED',
  AUTOMATION_EXECUTION_FAILED: 'AUTOMATION_EXECUTION_FAILED',
  LEARNING_MODEL_ERROR: 'LEARNING_MODEL_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// ============================================================================
// MCP Tool Definitions
// ============================================================================

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // Will be zod schema when available
  category: 'task_management' | 'ai_decomposition' | 'priority_management' | 'automation' | 'learning' | 'analytics' | 'system';
  examples?: Array<{
    description: string;
    input: any;
    output: any;
  }>;
}

// ============================================================================
// MCP Server Configuration
// ============================================================================

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  transport: {
    type: 'stdio' | 'http';
    port?: number;
    host?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

export interface MCPResourceDefinition {
  name: string;
  description: string;
  uri: string;
  mimeType?: string;
}

export interface MCPPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
} 