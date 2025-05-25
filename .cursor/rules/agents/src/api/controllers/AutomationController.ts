import { Request, Response } from 'express';
import { AutomationEngine } from '../../core/automation/AutomationEngine';
import { APIResponse } from '../../types/APITypes';

export class AutomationController {
  private automationEngine: AutomationEngine;

  constructor(automationEngine: AutomationEngine) {
    this.automationEngine = automationEngine;
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.automationEngine.getMetrics();
      
      const response: APIResponse = {
        success: true,
        data: metrics,
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
          code: 'AUTOMATION_ERROR',
          message: error instanceof Error ? error.message : 'Automation metrics failed'
        }
      });
    }
  }

  public async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const insights = await this.automationEngine.getInsights();
      
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
          code: 'AUTOMATION_INSIGHTS_ERROR',
          message: error instanceof Error ? error.message : 'Automation insights failed'
        }
      });
    }
  }
} 