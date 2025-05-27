/**
 * Real-Time Synchronization Type Definitions
 * 
 * Comprehensive type definitions for real-time event broadcasting,
 * WebSocket management, and live synchronization features.
 */

import { Task, TaskOperationResult } from './TaskTypes';
import { AutomationEvent, AutomationExecutionResult } from './AutomationTypes';

/**
 * Real-time event types
 */
export type RealTimeEventType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_deleted'
  | 'task_completed'
  | 'priority_changed'
  | 'automation_executed'
  | 'workflow_completed'
  | 'learning_insight'
  | 'user_joined'
  | 'user_left'
  | 'system_status'
  | 'dashboard_update'
  | 'conflict_detected'
  | 'sync_required';

/**
 * Base real-time event structure
 */
export interface RealTimeEvent {
  id: string;
  type: RealTimeEventType;
  timestamp: string;
  source: string;
  userId?: string;
  sessionId?: string;
  payload: any;
  metadata?: RealTimeEventMetadata;
}

/**
 * Real-time event metadata
 */
export interface RealTimeEventMetadata {
  version: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent: boolean;
  broadcast: boolean;
  targetUsers?: string[];
  targetSessions?: string[];
  retryCount?: number;
  expiresAt?: string;
}

/**
 * SSE Session interface
 */
export interface WebSocketSession {
  id: string;
  response: any; // Express response object
  lastActivity: number;
  subscriptions: string[];
}

/**
 * Task-related real-time events
 */
export interface TaskCreatedEvent extends RealTimeEvent {
  type: 'task_created';
  payload: {
    task: Task;
    parentId?: string;
    triggeredBy: 'user' | 'automation' | 'ai';
  };
}

export interface TaskUpdatedEvent extends RealTimeEvent {
  type: 'task_updated';
  payload: {
    task: Task;
    changes: Record<string, any>;
    previousValues: Record<string, any>;
    triggeredBy: 'user' | 'automation' | 'ai';
  };
}

export interface TaskDeletedEvent extends RealTimeEvent {
  type: 'task_deleted';
  payload: {
    taskId: string;
    task: Task;
    triggeredBy: 'user' | 'automation';
  };
}

/**
 * Automation-related real-time events
 */
export interface AutomationExecutedEvent extends RealTimeEvent {
  type: 'automation_executed';
  payload: {
    event: AutomationEvent;
    result: AutomationExecutionResult;
    affectedTasks: string[];
  };
}

/**
 * User presence and collaboration
 */
export interface UserPresence {
  userId: string;
  sessionId: string;
  username?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentTask?: string;
  lastActivity: string;
  metadata?: Record<string, any>;
}

export interface UserJoinedEvent extends RealTimeEvent {
  type: 'user_joined';
  payload: {
    user: UserPresence;
    projectId?: string;
  };
}

export interface UserLeftEvent extends RealTimeEvent {
  type: 'user_left';
  payload: {
    userId: string;
    sessionId: string;
    duration: number;
  };
}

/**
 * WebSocket connection management
 */
export interface WebSocketConnection {
  id: string;
  socket: any; // Socket.IO socket instance
  userId?: string;
  sessionId: string;
  projectId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  messageId: string;
  acknowledgment?: boolean;
}

/**
 * Subscription management
 */
export interface Subscription {
  id: string;
  connectionId: string;
  channel: string;
  filters?: Record<string, any> | undefined;
  createdAt: Date;
  lastActivity: Date;
}

export type SubscriptionChannel = 
  | 'tasks'
  | 'automation'
  | 'learning'
  | 'analytics'
  | 'users'
  | 'system'
  | 'dashboard'
  | `task:${string}`
  | `user:${string}`
  | `project:${string}`;

/**
 * Conflict resolution
 */
export interface ConflictDetection {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'dependency_conflict';
  resourceId: string;
  resourceType: 'task' | 'automation' | 'workflow';
  conflictingChanges: Array<{
    userId: string;
    sessionId: string;
    timestamp: string;
    changes: Record<string, any>;
  }>;
  detectedAt: Date;
  resolved: boolean;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'merge' | 'override' | 'manual' | 'reject';
  resolvedBy: string;
  resolvedAt: Date;
  finalState: any;
  reasoning: string;
}

/**
 * Synchronization state
 */
export interface SyncState {
  lastSyncTimestamp: string;
  version: number;
  checksum: string;
  pendingChanges: RealTimeEvent[];
  conflictCount: number;
  connectionCount: number;
}

export interface SyncStatus {
  connected: boolean;
  synchronized: boolean;
  lastSync: string;
  pendingEvents: number;
  conflicts: number;
  latency: number;
}

/**
 * Live dashboard data
 */
export interface LiveDashboardData {
  timestamp: string;
  metrics: {
    activeTasks: number;
    completedToday: number;
    activeUsers: number;
    automationExecutions: number;
    systemLoad: number;
    responseTime: number;
  };
  recentEvents: RealTimeEvent[];
  userActivity: UserPresence[];
  systemStatus: 'healthy' | 'degraded' | 'critical';
}

/**
 * Real-time configuration
 */
export interface RealTimeConfig {
  enabled: boolean;
  websocket: {
    port?: number;
    path: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
    pingTimeout: number;
    pingInterval: number;
    maxConnections: number;
  };
  events: {
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
    flushInterval: number;
  };
  presence: {
    enabled: boolean;
    heartbeatInterval: number;
    timeoutThreshold: number;
  };
  conflicts: {
    detectionEnabled: boolean;
    autoResolve: boolean;
    resolutionTimeout: number;
  };
  dashboard: {
    updateInterval: number;
    metricsRetention: number;
    maxEvents: number;
  };
}

/**
 * Event broadcasting
 */
export interface BroadcastOptions {
  channel?: SubscriptionChannel;
  targetUsers?: string[];
  targetSessions?: string[];
  excludeUser?: string;
  excludeSession?: string;
  persistent?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface EventBroadcaster {
  broadcast(event: RealTimeEvent, options?: BroadcastOptions): Promise<void>;
  subscribe(connectionId: string, channel: SubscriptionChannel, filters?: Record<string, any>): Promise<void>;
  unsubscribe(connectionId: string, channel: SubscriptionChannel): Promise<void>;
  getSubscriptions(connectionId: string): Subscription[];
}

/**
 * Real-time service interfaces
 */
export interface RealTimeEventManager {
  emitEvent(event: RealTimeEvent): Promise<void>;
  on(eventType: RealTimeEventType, handler: (event: RealTimeEvent) => void): void;
  off(eventType: RealTimeEventType, handler: (event: RealTimeEvent) => void): void;
  getEventHistory(filters?: Record<string, any>): RealTimeEvent[];
}

export interface SynchronizationService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getSyncStatus(): SyncStatus;
  forceSynchronization(): Promise<void>;
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
}

/**
 * Performance monitoring
 */
export interface RealTimeMetrics {
  connectionsCount: number;
  eventsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkBandwidth: number;
  lastUpdated: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'high_latency' | 'connection_limit' | 'memory_usage' | 'error_rate';
  severity: 'warning' | 'critical';
  message: string;
  metrics: Record<string, number>;
  timestamp: string;
  acknowledged: boolean;
} 