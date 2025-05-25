/**
 * Automation Engine Type Definitions
 * 
 * Comprehensive type definitions for the intelligent automation system
 * that orchestrates task workflows, rules, and event-driven processes.
 */

import { Task, TaskStatus, TaskPriority, TaskComplexity, TaskType } from './TaskTypes';

/**
 * Automation rule definition
 */
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Higher number = higher priority
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    category: string;
    tags: string[];
  };
  execution: {
    lastTriggered?: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
  };
}

/**
 * Automation trigger types
 */
export type AutomationTriggerType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_completed'
  | 'task_blocked'
  | 'task_overdue'
  | 'dependency_resolved'
  | 'priority_changed'
  | 'schedule_time'
  | 'learning_insight'
  | 'custom_event';

/**
 * Automation trigger configuration
 */
export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: {
    taskTypes?: TaskType[];
    statuses?: TaskStatus[];
    priorities?: TaskPriority[];
    complexities?: TaskComplexity[];
    tags?: string[];
    assignees?: string[];
    scheduleExpression?: string; // Cron-like expression
    customEventName?: string;
    debounceMs?: number; // Prevent rapid firing
  };
}

/**
 * Automation condition types
 */
export type AutomationConditionType =
  | 'task_property'
  | 'task_count'
  | 'time_condition'
  | 'dependency_state'
  | 'learning_metric'
  | 'custom_function';

/**
 * Automation condition
 */
export interface AutomationCondition {
  type: AutomationConditionType;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  field?: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Automation action types
 */
export type AutomationActionType =
  | 'update_task'
  | 'create_task'
  | 'delete_task'
  | 'assign_task'
  | 'change_priority'
  | 'decompose_task'
  | 'send_notification'
  | 'schedule_task'
  | 'run_learning_cycle'
  | 'execute_workflow'
  | 'custom_function';

/**
 * Automation action
 */
export interface AutomationAction {
  type: AutomationActionType;
  config: {
    taskId?: string;
    taskData?: Partial<Task>;
    assignee?: string;
    priority?: TaskPriority;
    notificationConfig?: NotificationConfig;
    scheduleConfig?: ScheduleConfig;
    workflowId?: string;
    customFunction?: string;
    parameters?: Record<string, any>;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
}

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  steps: WorkflowStep[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    category: string;
    tags: string[];
  };
  execution: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: string;
  };
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: WorkflowStepConfig;
  conditions?: AutomationCondition[];
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  timeout?: number; // Milliseconds
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

/**
 * Workflow step types
 */
export type WorkflowStepType =
  | 'task_operation'
  | 'condition_check'
  | 'parallel_execution'
  | 'wait_for_event'
  | 'send_notification'
  | 'run_analysis'
  | 'custom_function';

/**
 * Workflow step configuration
 */
export interface WorkflowStepConfig {
  action?: AutomationAction;
  parallelSteps?: string[]; // Step IDs to run in parallel
  waitForEvent?: {
    eventType: string;
    timeout: number;
  };
  analysisType?: 'learning_cycle' | 'priority_analysis' | 'decomposition_analysis';
  customFunction?: {
    name: string;
    parameters: Record<string, any>;
  };
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: string;
  currentStep: string;
  variables: Record<string, any>;
  taskContext?: Task;
  triggerEvent?: AutomationEvent;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

/**
 * Automation event
 */
export interface AutomationEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  data: Record<string, any>;
  taskId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'in_app';
  recipients: string[];
  subject?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template?: string;
  attachments?: string[];
}

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  type: 'immediate' | 'delayed' | 'recurring' | 'conditional';
  delay?: number; // Milliseconds
  cronExpression?: string;
  timezone?: string;
  conditions?: AutomationCondition[];
  maxExecutions?: number;
  endDate?: string;
}

/**
 * Automation execution result
 */
export interface AutomationExecutionResult {
  success: boolean;
  ruleId?: string;
  workflowId?: string;
  executionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  actionsExecuted: number;
  actionsSuccessful: number;
  actionsFailed: number;
  error?: string;
  logs: AutomationLog[];
  metadata: Record<string, any>;
}

/**
 * Automation log entry
 */
export interface AutomationLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stepId?: string;
  actionType?: string;
}

/**
 * Automation metrics
 */
export interface AutomationMetrics {
  totalRules: number;
  activeRules: number;
  totalWorkflows: number;
  activeWorkflows: number;
  executionsToday: number;
  successRate: number;
  averageExecutionTime: number;
  topTriggers: Array<{
    type: string;
    count: number;
  }>;
  topActions: Array<{
    type: string;
    count: number;
  }>;
  errorRate: number;
  performanceMetrics: {
    rulesPerSecond: number;
    workflowsPerSecond: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

/**
 * Automation configuration
 */
export interface AutomationConfig {
  enabled: boolean;
  maxConcurrentExecutions: number;
  defaultTimeout: number;
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number; // Days
    maxLogSize: number; // MB
  };
  performance: {
    enableMetrics: boolean;
    metricsInterval: number; // Seconds
    enableProfiling: boolean;
  };
  notifications: {
    enabled: boolean;
    defaultRecipients: string[];
    errorNotifications: boolean;
    successNotifications: boolean;
  };
}

/**
 * Smart scheduling configuration
 */
export interface SmartSchedulingConfig {
  enabled: boolean;
  learningEnabled: boolean;
  optimizationGoals: Array<'minimize_time' | 'maximize_efficiency' | 'balance_workload' | 'meet_deadlines'>;
  constraints: {
    workingHours: {
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
    };
    maxConcurrentTasks: number;
    resourceLimits: Record<string, number>;
  };
  algorithms: {
    priorityWeighting: Record<TaskPriority, number>;
    complexityWeighting: Record<TaskComplexity, number>;
    dependencyWeighting: number;
    deadlineWeighting: number;
  };
}

/**
 * Resource allocation
 */
export interface ResourceAllocation {
  taskId: string;
  resourceType: string;
  resourceId: string;
  allocation: number; // Percentage or absolute value
  startTime: string;
  endTime: string;
  status: 'allocated' | 'in_use' | 'completed' | 'cancelled';
}

/**
 * Automation insight
 */
export interface AutomationInsight {
  type: 'optimization' | 'pattern' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Automation rule template
 */
export interface AutomationRuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Omit<AutomationRule, 'id' | 'metadata' | 'execution'>;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    defaultValue?: any;
    required: boolean;
  }>;
  usageCount: number;
  rating: number;
}

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Omit<Workflow, 'id' | 'metadata' | 'execution'>;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    defaultValue?: any;
    required: boolean;
  }>;
  usageCount: number;
  rating: number;
} 