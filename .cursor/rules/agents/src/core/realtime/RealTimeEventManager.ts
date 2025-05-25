import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  RealTimeEvent,
  RealTimeEventType,
  RealTimeEventManager as IRealTimeEventManager,
  BroadcastOptions,
  RealTimeConfig,
  RealTimeMetrics,
  PerformanceAlert
} from '../../types/RealTimeTypes';

/**
 * Real-Time Event Manager
 * 
 * Central coordinator for all real-time events in the system.
 * Handles event emission, broadcasting, and performance monitoring.
 */
export class RealTimeEventManager extends EventEmitter implements IRealTimeEventManager {
  private eventHistory: RealTimeEvent[] = [];
  private config: RealTimeConfig;
  private metrics: RealTimeMetrics;
  private isRunning: boolean = false;
  private metricsInterval: NodeJS.Timeout | null = null;
  private eventQueue: RealTimeEvent[] = [];
  private processingQueue: boolean = false;

  constructor(config: RealTimeConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.setupEventProcessing();
  }

  /**
   * Start the event manager
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startMetricsCollection();
    this.startEventProcessing();

    super.emit('manager_started', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Stop the event manager
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.stopMetricsCollection();
    await this.flushEventQueue();

    super.emit('manager_stopped', {
      timestamp: new Date().toISOString(),
      finalMetrics: this.metrics
    });
  }

  /**
   * Emit a real-time event
   */
  public async emitEvent(event: RealTimeEvent): Promise<void> {
    if (!this.isRunning) {
      throw new Error('RealTimeEventManager is not running');
    }

    // Ensure event has required fields
    if (!event.id) {
      event.id = uuidv4();
    }
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Add to event queue for processing
    this.eventQueue.push(event);
    this.updateMetrics('event_queued');

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processEventQueue();
    }
  }

  /**
   * Register event handler
   */
  public override on(eventType: RealTimeEventType, handler: (event: RealTimeEvent) => void): this {
    return super.on(eventType, handler);
  }

  /**
   * Unregister event handler
   */
  public override off(eventType: RealTimeEventType, handler: (event: RealTimeEvent) => void): this {
    return super.off(eventType, handler);
  }

  /**
   * Get event history with optional filtering
   */
  public getEventHistory(filters?: Record<string, any>): RealTimeEvent[] {
    let filteredEvents = [...this.eventHistory];

    if (filters) {
      if (filters['type']) {
        filteredEvents = filteredEvents.filter(event => event.type === filters['type']);
      }
      if (filters['userId']) {
        filteredEvents = filteredEvents.filter(event => event.userId === filters['userId']);
      }
      if (filters['source']) {
        filteredEvents = filteredEvents.filter(event => event.source === filters['source']);
      }
      if (filters['since']) {
        const sinceDate = new Date(filters['since']);
        filteredEvents = filteredEvents.filter(event => new Date(event.timestamp) >= sinceDate);
      }
      if (filters['limit']) {
        filteredEvents = filteredEvents.slice(-filters['limit']);
      }
    }

    return filteredEvents;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): RealTimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  public getPerformanceAlerts(): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const now = new Date().toISOString();

    // Check for high latency
    if (this.metrics.averageLatency > 1000) {
      alerts.push({
        id: uuidv4(),
        type: 'high_latency',
        severity: this.metrics.averageLatency > 2000 ? 'critical' : 'warning',
        message: `High average latency detected: ${this.metrics.averageLatency}ms`,
        metrics: { latency: this.metrics.averageLatency },
        timestamp: now,
        acknowledged: false
      });
    }

    // Check for high error rate
    if (this.metrics.errorRate > 0.05) {
      alerts.push({
        id: uuidv4(),
        type: 'error_rate',
        severity: this.metrics.errorRate > 0.1 ? 'critical' : 'warning',
        message: `High error rate detected: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        metrics: { errorRate: this.metrics.errorRate },
        timestamp: now,
        acknowledged: false
      });
    }

    // Check for high memory usage
    if (this.metrics.memoryUsage > 0.8) {
      alerts.push({
        id: uuidv4(),
        type: 'memory_usage',
        severity: this.metrics.memoryUsage > 0.9 ? 'critical' : 'warning',
        message: `High memory usage detected: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`,
        metrics: { memoryUsage: this.metrics.memoryUsage },
        timestamp: now,
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Clear event history
   */
  public clearEventHistory(): void {
    this.eventHistory = [];
    super.emit('history_cleared', {
      timestamp: new Date().toISOString(),
      clearedBy: 'system'
    });
  }

  /**
   * Force flush event queue
   */
  public async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of eventsToProcess) {
      await this.processEvent(event);
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): RealTimeMetrics {
    return {
      connectionsCount: 0,
      eventsPerSecond: 0,
      averageLatency: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkBandwidth: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Setup event processing
   */
  private setupEventProcessing(): void {
    // Set max listeners to prevent memory leaks
    this.setMaxListeners(100);

    // Handle internal events
    this.on('event_processed' as RealTimeEventType, (data) => {
      this.updateMetrics('event_processed', data);
    });

    this.on('event_error' as RealTimeEventType, (data) => {
      this.updateMetrics('event_error', data);
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Start event processing
   */
  private startEventProcessing(): void {
    // Process events in batches
    setInterval(() => {
      if (!this.processingQueue && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, this.config.events.flushInterval || 100);
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) return;

    this.processingQueue = true;
    const batchSize = this.config.events.batchSize || 10;
    const batch = this.eventQueue.splice(0, batchSize);

    try {
      await Promise.all(batch.map(event => this.processEvent(event)));
    } catch (error) {
      console.error('Error processing event batch:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: RealTimeEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Add to history
      this.addToHistory(event);

      // Emit to listeners
      super.emit(event.type, event);
      super.emit('*', event); // Wildcard listener

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      super.emit('event_processed', {
        event,
        processingTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;

      super.emit('event_error', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(event: RealTimeEvent): void {
    this.eventHistory.push(event);

    // Maintain history size limit
    const maxHistory = this.config.dashboard?.maxEvents || 1000;
    if (this.eventHistory.length > maxHistory) {
      this.eventHistory = this.eventHistory.slice(-maxHistory);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(type: string, data?: any): void {
    const now = new Date().toISOString();

    switch (type) {
      case 'event_queued':
        // Metrics updated in collectMetrics
        break;
      case 'event_processed':
        if (data?.processingTime) {
          // Update average latency
          this.metrics.averageLatency = 
            (this.metrics.averageLatency * 0.9) + (data.processingTime * 0.1);
        }
        break;
      case 'event_error':
        // Error rate updated in collectMetrics
        break;
    }

    this.metrics.lastUpdated = now;
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Update metrics
    this.metrics.memoryUsage = memoryUsage.heapUsed / memoryUsage.heapTotal;
    this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    this.metrics.eventsPerSecond = this.calculateEventsPerSecond();
    this.metrics.errorRate = this.calculateErrorRate();
    this.metrics.lastUpdated = new Date().toISOString();

    // Emit metrics update
    super.emit('metrics_updated', this.metrics);
  }

  /**
   * Calculate events per second
   */
  private calculateEventsPerSecond(): number {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentEvents = this.eventHistory.filter(
      event => new Date(event.timestamp) >= oneMinuteAgo
    );
    return recentEvents.length / 60;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentEvents = this.eventHistory.filter(
      event => new Date(event.timestamp) >= oneMinuteAgo
    );
    
    if (recentEvents.length === 0) return 0;

    const errorEvents = recentEvents.filter(
      event => event.type === 'system_status' && event.payload?.status === 'error'
    );
    
    return errorEvents.length / recentEvents.length;
  }
} 