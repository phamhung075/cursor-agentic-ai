import { EventEmitter } from 'events';
import { AutomationConfig, NotificationConfig } from '../../types/AutomationTypes';

/**
 * Notification Service
 * 
 * Handles automated notifications and alerts for the automation system.
 */
export class NotificationService extends EventEmitter {
  private config: AutomationConfig;
  private isRunning: boolean = false;

  constructor(config: AutomationConfig) {
    super();
    this.config = config;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('notificationServiceStarted', { timestamp: new Date().toISOString() });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('notificationServiceStopped', { timestamp: new Date().toISOString() });
  }

  public async updateConfig(config: AutomationConfig): Promise<void> {
    this.config = config;
  }

  public async sendNotification(notificationConfig: NotificationConfig): Promise<void> {
    if (!this.isRunning || !this.config.notifications.enabled) {
      return;
    }

    this.emit('notificationSent', { 
      notificationConfig, 
      timestamp: new Date().toISOString() 
    });
  }
} 