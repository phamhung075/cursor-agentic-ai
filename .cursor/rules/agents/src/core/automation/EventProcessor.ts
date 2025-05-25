import { EventEmitter } from 'events';
import { AutomationConfig, AutomationEvent } from '../../types/AutomationTypes';

/**
 * Event Processor
 * 
 * Processes and tracks automation events for metrics and analysis.
 */
export class EventProcessor extends EventEmitter {
  private config: AutomationConfig;
  private isRunning: boolean = false;
  private eventMetrics: Map<string, number> = new Map();

  constructor(config: AutomationConfig) {
    super();
    this.config = config;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('eventProcessorStarted', { timestamp: new Date().toISOString() });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('eventProcessorStopped', { timestamp: new Date().toISOString() });
  }

  public async updateConfig(config: AutomationConfig): Promise<void> {
    this.config = config;
  }

  public getMetrics(): any {
    return {
      topTriggers: Array.from(this.eventMetrics.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  public processEvent(event: AutomationEvent): void {
    if (!this.isRunning) return;
    
    this.eventMetrics.set(event.type, (this.eventMetrics.get(event.type) || 0) + 1);
    this.emit('eventProcessed', { event, timestamp: new Date().toISOString() });
  }
} 