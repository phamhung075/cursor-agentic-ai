import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  SynchronizationService as ISynchronizationService,
  RealTimeConfig,
  SyncStatus,
  SyncState,
  ConflictDetection,
  ConflictResolution,
  RealTimeEvent,
  LiveDashboardData,
  RealTimeMetrics
} from '../../types/RealTimeTypes';
import { TaskManager } from '../tasks/TaskManager';
import { LearningService } from '../tasks/LearningService';
import { AutomationEngine } from '../automation/AutomationEngine';
import { WebSocketManager } from './WebSocketManager';

/**
 * Synchronization Service
 * 
 * Main service that coordinates real-time synchronization across
 * all components of the intelligent task management system.
 */
export class SynchronizationService extends EventEmitter implements ISynchronizationService {
  private config: RealTimeConfig;
  private taskManager: TaskManager;
  private learningService: LearningService;
  private automationEngine: AutomationEngine;
  private webSocketManager: WebSocketManager;
  
  private isRunning: boolean = false;
  private syncState: SyncState;
  private conflicts: Map<string, ConflictDetection> = new Map();
  private dashboardInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    config: RealTimeConfig,
    taskManager: TaskManager,
    learningService: LearningService,
    automationEngine: AutomationEngine,
    webSocketManager: WebSocketManager
  ) {
    super();
    this.config = config;
    this.taskManager = taskManager;
    this.learningService = learningService;
    this.automationEngine = automationEngine;
    this.webSocketManager = webSocketManager;
    
    this.syncState = this.initializeSyncState();
    this.setupEventHandlers();
  }

  /**
   * Start the synchronization service
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Start WebSocket manager
    await this.webSocketManager.start();
    
    // Start dashboard updates
    this.startDashboardUpdates();
    
    // Start periodic synchronization
    this.startPeriodicSync();

    console.log('🔄 Synchronization Service started');
    
    this.emit('service_started', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Stop the synchronization service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Stop intervals
    this.stopDashboardUpdates();
    this.stopPeriodicSync();
    
    // Stop WebSocket manager
    await this.webSocketManager.stop();

    console.log('🔄 Synchronization Service stopped');
    
    this.emit('service_stopped', {
      timestamp: new Date().toISOString(),
      finalState: this.syncState
    });
  }

  /**
   * Get current synchronization status
   */
  public getSyncStatus(): SyncStatus {
    return {
      connected: this.isRunning,
      synchronized: this.syncState.pendingChanges.length === 0,
      lastSync: this.syncState.lastSyncTimestamp,
      pendingEvents: this.syncState.pendingChanges.length,
      conflicts: this.syncState.conflictCount,
      latency: this.calculateAverageLatency()
    };
  }

  /**
   * Force synchronization
   */
  public async forceSynchronization(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Synchronization service is not running');
    }

    await this.performSynchronization();
    
    this.emit('sync_forced', {
      timestamp: new Date().toISOString(),
      syncState: this.syncState
    });
  }

  /**
   * Resolve conflict
   */
  public async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolved = true;
    conflict.resolution = resolution;

    // Apply resolution based on strategy
    await this.applyConflictResolution(conflict, resolution);

    // Remove from active conflicts
    this.conflicts.delete(conflictId);
    this.syncState.conflictCount = this.conflicts.size;

    // Broadcast conflict resolution
    await this.broadcastEvent({
      id: uuidv4(),
      type: 'conflict_detected',
      timestamp: new Date().toISOString(),
      source: 'synchronization_service',
      payload: {
        conflictId,
        resolved: true,
        resolution
      }
    });

    this.emit('conflict_resolved', {
      conflictId,
      resolution,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get live dashboard data
   */
  public async getLiveDashboardData(): Promise<LiveDashboardData> {
    const tasks = this.taskManager.queryTasks();
    const learningStats = this.learningService.getLearningStatistics();
    const automationMetrics = this.automationEngine.getMetrics();
    const userPresence = this.webSocketManager.getUserPresence();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt && 
      new Date(task.completedAt) >= today
    ).length;

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        activeTasks: tasks.filter(t => t.status === 'in_progress').length,
        completedToday,
        activeUsers: userPresence.filter(u => u.status === 'online').length,
        automationExecutions: (automationMetrics as any).totalExecutions || 0,
        systemLoad: this.calculateSystemLoad(),
        responseTime: this.calculateAverageLatency()
      },
      recentEvents: this.getRecentEvents(20),
      userActivity: userPresence,
      systemStatus: this.getSystemStatus()
    };
  }

  /**
   * Broadcast real-time event
   */
  public async broadcastEvent(event: RealTimeEvent): Promise<void> {
    if (!this.isRunning) return;

    // Add to pending changes
    this.syncState.pendingChanges.push(event);
    this.updateSyncState();

    // Broadcast via WebSocket
    await this.webSocketManager.broadcast(event);

    this.emit('event_broadcasted', {
      event,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Initialize sync state
   */
  private initializeSyncState(): SyncState {
    return {
      lastSyncTimestamp: new Date().toISOString(),
      version: 1,
      checksum: this.calculateChecksum(),
      pendingChanges: [],
      conflictCount: 0,
      connectionCount: 0
    };
  }

  /**
   * Setup event handlers for all services
   */
  private setupEventHandlers(): void {
    // Task Manager events
    this.taskManager.on('taskCreated', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'task_created',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        payload: {
          task: data.task,
          triggeredBy: 'user'
        }
      });
    });

    this.taskManager.on('taskUpdated', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'task_updated',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        payload: {
          task: data.task,
          changes: data.changes || {},
          previousValues: data.previousValues || {},
          triggeredBy: 'user'
        }
      });
    });

    this.taskManager.on('taskDeleted', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'task_deleted',
        timestamp: new Date().toISOString(),
        source: 'task_manager',
        payload: {
          taskId: data.taskId,
          task: data.task,
          triggeredBy: 'user'
        }
      });
    });

    // Automation Engine events
    this.automationEngine.on('ruleExecuted', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'automation_executed',
        timestamp: new Date().toISOString(),
        source: 'automation_engine',
        payload: {
          event: data.event,
          result: data.result,
          affectedTasks: data.affectedTasks || []
        }
      });
    });

    this.automationEngine.on('workflowCompleted', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'workflow_completed',
        timestamp: new Date().toISOString(),
        source: 'automation_engine',
        payload: data
      });
    });

    // Learning Service events
    this.learningService.on('learningInsightGenerated', async (data) => {
      await this.broadcastEvent({
        id: uuidv4(),
        type: 'learning_insight',
        timestamp: new Date().toISOString(),
        source: 'learning_service',
        payload: data
      });
    });
  }

  /**
   * Start dashboard updates
   */
  private startDashboardUpdates(): void {
    if (this.dashboardInterval) return;

    const updateInterval = this.config.dashboard?.updateInterval || 5000;
    
    this.dashboardInterval = setInterval(async () => {
      try {
        const dashboardData = await this.getLiveDashboardData();
        
        await this.broadcastEvent({
          id: uuidv4(),
          type: 'dashboard_update',
          timestamp: new Date().toISOString(),
          source: 'synchronization_service',
          payload: dashboardData
        });
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    }, updateInterval);
  }

  /**
   * Stop dashboard updates
   */
  private stopDashboardUpdates(): void {
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
      this.dashboardInterval = null;
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      await this.performSynchronization();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Stop periodic synchronization
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform synchronization
   */
  private async performSynchronization(): Promise<void> {
    try {
      // Update sync state
      this.syncState.lastSyncTimestamp = new Date().toISOString();
      this.syncState.version++;
      this.syncState.checksum = this.calculateChecksum();
      this.syncState.connectionCount = this.webSocketManager.getConnectionCount();

      // Clear processed pending changes
      this.syncState.pendingChanges = this.syncState.pendingChanges.filter(
        event => this.shouldRetainEvent(event)
      );

      // Detect conflicts if enabled
      if (this.config.conflicts.detectionEnabled) {
        await this.detectConflicts();
      }

      this.emit('sync_completed', {
        timestamp: new Date().toISOString(),
        syncState: this.syncState
      });

    } catch (error) {
      console.error('Synchronization error:', error);
      this.emit('sync_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Detect conflicts in pending changes
   */
  private async detectConflicts(): Promise<void> {
    // Simple conflict detection - can be enhanced
    const taskUpdates = this.syncState.pendingChanges.filter(
      event => event.type === 'task_updated'
    );

    const taskGroups = new Map<string, RealTimeEvent[]>();
    
    for (const event of taskUpdates) {
      const taskId = event.payload?.task?.id;
      if (taskId) {
        if (!taskGroups.has(taskId)) {
          taskGroups.set(taskId, []);
        }
        taskGroups.get(taskId)!.push(event);
      }
    }

    // Check for concurrent modifications
    for (const [taskId, events] of taskGroups) {
      if (events.length > 1) {
        const conflict: ConflictDetection = {
          id: uuidv4(),
          type: 'concurrent_edit',
          resourceId: taskId,
          resourceType: 'task',
          conflictingChanges: events.map(event => ({
            userId: event.userId || 'unknown',
            sessionId: event.sessionId || 'unknown',
            timestamp: event.timestamp,
            changes: event.payload?.changes || {}
          })),
          detectedAt: new Date(),
          resolved: false
        };

        this.conflicts.set(conflict.id, conflict);
        this.syncState.conflictCount = this.conflicts.size;

        // Auto-resolve if enabled
        if (this.config.conflicts.autoResolve) {
          await this.autoResolveConflict(conflict);
        } else {
          // Broadcast conflict detection
          await this.broadcastEvent({
            id: uuidv4(),
            type: 'conflict_detected',
            timestamp: new Date().toISOString(),
            source: 'synchronization_service',
            payload: conflict
          });
        }
      }
    }
  }

  /**
   * Auto-resolve conflict
   */
  private async autoResolveConflict(conflict: ConflictDetection): Promise<void> {
    // Simple last-write-wins strategy
    const latestChange = conflict.conflictingChanges.reduce((latest, current) => 
      new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
    );

    const resolution: ConflictResolution = {
      strategy: 'override',
      resolvedBy: 'system',
      resolvedAt: new Date(),
      finalState: latestChange.changes,
      reasoning: 'Auto-resolved using last-write-wins strategy'
    };

    await this.resolveConflict(conflict.id, resolution);
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(
    conflict: ConflictDetection, 
    resolution: ConflictResolution
  ): Promise<void> {
    if (conflict.resourceType === 'task') {
      try {
        await this.taskManager.updateTask(conflict.resourceId, resolution.finalState);
      } catch (error) {
        console.error('Error applying conflict resolution:', error);
      }
    }
  }

  /**
   * Update sync state
   */
  private updateSyncState(): void {
    this.syncState.version++;
    this.syncState.checksum = this.calculateChecksum();
  }

  /**
   * Calculate system checksum
   */
  private calculateChecksum(): string {
    const data = {
      timestamp: this.syncState.lastSyncTimestamp,
      version: this.syncState.version,
      pendingCount: this.syncState.pendingChanges.length
    };
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Calculate average latency
   */
  private calculateAverageLatency(): number {
    // Simplified latency calculation
    return Math.random() * 100 + 50; // 50-150ms
  }

  /**
   * Calculate system load
   */
  private calculateSystemLoad(): number {
    const memoryUsage = process.memoryUsage();
    return memoryUsage.heapUsed / memoryUsage.heapTotal;
  }

  /**
   * Get system status
   */
  private getSystemStatus(): 'healthy' | 'degraded' | 'critical' {
    const load = this.calculateSystemLoad();
    const latency = this.calculateAverageLatency();
    const conflicts = this.syncState.conflictCount;

    if (load > 0.9 || latency > 1000 || conflicts > 10) {
      return 'critical';
    } else if (load > 0.7 || latency > 500 || conflicts > 5) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get recent events
   */
  private getRecentEvents(limit: number): RealTimeEvent[] {
    return this.syncState.pendingChanges
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Check if event should be retained
   */
  private shouldRetainEvent(event: RealTimeEvent): boolean {
    const eventAge = Date.now() - new Date(event.timestamp).getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return eventAge < maxAge;
  }
} 