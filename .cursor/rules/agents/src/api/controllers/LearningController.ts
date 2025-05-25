import { Request, Response } from 'express';
import { LearningService } from '../../core/tasks/LearningService';
import { APIResponse } from '../../types/APITypes';

export class LearningController {
  private learningService: LearningService;

  constructor(learningService: LearningService) {
    this.learningService = learningService;
  }

  public async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const insights = this.learningService.getLearningInsights();
      
      const response: APIResponse = {
        success: true,
        data: insights,
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
          code: 'LEARNING_ERROR',
          message: error instanceof Error ? error.message : 'Learning insights failed'
        }
      });
    }
  }

  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.learningService.getLearningStatistics();
      
      const response: APIResponse = {
        success: true,
        data: stats,
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
          code: 'LEARNING_STATS_ERROR',
          message: error instanceof Error ? error.message : 'Learning stats failed'
        }
      });
    }
  }
} 