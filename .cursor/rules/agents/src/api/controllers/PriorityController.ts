import { Request, Response } from 'express';
import { DynamicPriorityManager } from '../../core/tasks/DynamicPriorityManager';
import { APIResponse } from '../../types/APITypes';

export class PriorityController {
  private priorityManager: DynamicPriorityManager;

  constructor(priorityManager: DynamicPriorityManager) {
    this.priorityManager = priorityManager;
  }

  public async analyzePriorities(req: Request, res: Response): Promise<void> {
    try {
      const analysis = await this.priorityManager.analyzePriorities();
      
      const response: APIResponse = {
        success: true,
        data: analysis,
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
          code: 'PRIORITY_ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Priority analysis failed'
        }
      });
    }
  }

  public async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const { taskId, newPriority, reason } = req.body;
      
      const result = await this.priorityManager.updateTaskPriority(taskId, newPriority as any, reason);
      
      const response: APIResponse = {
        success: true,
        data: result,
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
          code: 'PRIORITY_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Priority update failed'
        }
      });
    }
  }
} 