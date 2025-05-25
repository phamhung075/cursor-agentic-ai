import { Request, Response } from 'express';
import { TaskManager } from '../../core/tasks/TaskManager';
import { LearningService } from '../../core/tasks/LearningService';
import { AutomationEngine } from '../../core/automation/AutomationEngine';
import { APIResponse } from '../../types/APITypes';

export class AnalyticsController {
  private taskManager: TaskManager;
  private learningService: LearningService;
  private automationEngine: AutomationEngine;

  constructor(
    taskManager: TaskManager,
    learningService: LearningService,
    automationEngine: AutomationEngine
  ) {
    this.taskManager = taskManager;
    this.learningService = learningService;
    this.automationEngine = automationEngine;
  }

  public async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tasks = this.taskManager.queryTasks();
      const learningStats = this.learningService.getLearningStatistics();
      const automationMetrics = this.automationEngine.getMetrics();
      
      const dashboard = {
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          pending: tasks.filter(t => t.status === 'pending').length
        },
        learning: learningStats,
        automation: automationMetrics
      };
      
      const response: APIResponse = {
        success: true,
        data: dashboard,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context?.requestId || 'unknown',
          version: '1.0.0'
        }
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Analytics dashboard failed'
        }
      });
    }
  }
} 