import { Request, Response } from 'express';
import { AITaskDecomposer } from '../../core/tasks/AITaskDecomposer';
import { APIResponse } from '../../types/APITypes';

/**
 * Decomposition Controller
 * 
 * Handles AI task decomposition endpoints.
 */
export class DecompositionController {
  private taskDecomposer: AITaskDecomposer;

  constructor(taskDecomposer: AITaskDecomposer) {
    this.taskDecomposer = taskDecomposer;
  }

  public async decomposeTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId, strategy, maxDepth, targetComplexity } = req.body;
      
      const result = await this.taskDecomposer.decomposeTask(taskId, {
        strategy: strategy || 'complexity',
        maxDepth: maxDepth || 3,
        targetComplexity: targetComplexity || 'simple'
      });
      
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
          code: 'DECOMPOSITION_ERROR',
          message: error instanceof Error ? error.message : 'Decomposition failed'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context?.requestId || 'unknown',
          version: '1.0.0'
        }
      });
    }
  }

  public async getStrategies(req: Request, res: Response): Promise<void> {
    const strategies = ['complexity', 'domain', 'timeline', 'dependency'];
    
    const response: APIResponse = {
      success: true,
      data: { strategies },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).context?.requestId || 'unknown',
        version: '1.0.0'
      }
    };
    
    res.json(response);
  }
} 