import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { DecompositionController } from '../controllers/DecompositionController';
import { PriorityController } from '../controllers/PriorityController';
import { LearningController } from '../controllers/LearningController';
import { AutomationController } from '../controllers/AutomationController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { log } from '../../utils';

/**
 * API Router Configuration
 */
interface APIRouterConfig {
  taskController: TaskController;
  decompositionController: DecompositionController;
  priorityController: PriorityController;
  learningController: LearningController;
  automationController: AutomationController;
  analyticsController: AnalyticsController;
}

/**
 * Create API Router
 * 
 * Creates and configures the main API router with all endpoints.
 */
export function createAPIRouter(config: APIRouterConfig): Router {
  const router = Router();

  // Task Management Routes
  router.get('/tasks', config.taskController.getTasks.bind(config.taskController));
  router.post('/tasks', config.taskController.createTask.bind(config.taskController));
  router.get('/tasks/:id', config.taskController.getTask.bind(config.taskController));
  router.put('/tasks/:id', config.taskController.updateTask.bind(config.taskController));
  router.delete('/tasks/:id', config.taskController.deleteTask.bind(config.taskController));
  router.post('/tasks/bulk', config.taskController.bulkUpdateTasks.bind(config.taskController));
  router.get('/tasks/:id/hierarchy', config.taskController.getTaskHierarchy.bind(config.taskController));

  // AI Decomposition Routes
  router.post('/decomposition/decompose', config.decompositionController.decomposeTask.bind(config.decompositionController));
  router.get('/decomposition/strategies', config.decompositionController.getStrategies.bind(config.decompositionController));

  // Priority Management Routes
  router.post('/priority/analyze', config.priorityController.analyzePriorities.bind(config.priorityController));
  router.put('/priority/update', config.priorityController.updatePriority.bind(config.priorityController));

  // Learning Service Routes
  router.get('/learning/insights', config.learningController.getInsights.bind(config.learningController));
  router.get('/learning/stats', config.learningController.getStats.bind(config.learningController));

  // Automation Engine Routes
  router.get('/automation/metrics', config.automationController.getMetrics.bind(config.automationController));
  router.get('/automation/insights', config.automationController.getInsights.bind(config.automationController));

  // Analytics Routes
  router.get('/analytics/dashboard', config.analyticsController.getDashboard.bind(config.analyticsController));

  // MCP Tools Bridge Endpoint
  router.post('/mcp/tools', async (req, res): Promise<void> => {
    const startTime = Date.now();
    const { tool, arguments: args } = req.body;
    const requestId = (req as any).context?.requestId || 'unknown';
    log.info('MCP', `MCP tool call: ${tool}`, { args, requestId });
    try {
      if (!tool) {
        log.warn('MCP', 'Tool name missing in MCP call', { requestId });
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tool name is required'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: '1.0.0'
          }
        });
        return;
      }

      let result: any;

      switch (tool) {
        case 'create_task':
          // Bridge to task creation
          req.body = args;
          await config.taskController.createTask(req, res);
          return;

        case 'get_task':
          // Bridge to get task
          req.params = { id: args.taskId };
          await config.taskController.getTask(req, res);
          return;

        case 'list_tasks':
          // Bridge to list tasks
          req.query = args;
          await config.taskController.getTasks(req, res);
          return;

        case 'update_task':
          // Bridge to update task
          req.params = { id: args.taskId };
          req.body = args.updates || args;
          await config.taskController.updateTask(req, res);
          return;

        case 'delete_task':
          // Bridge to delete task
          req.params = { id: args.taskId };
          await config.taskController.deleteTask(req, res);
          return;

        case 'decompose_task':
          // Bridge to task decomposition
          req.body = args;
          await config.decompositionController.decomposeTask(req, res);
          return;

        case 'analyze_complexity':
          // Mock complexity analysis
          result = {
            complexity: 'medium',
            estimatedHours: 8,
            factors: ['API integration', 'Database design', 'Testing'],
            recommendations: ['Break into smaller tasks', 'Consider using existing libraries']
          };
          break;

        case 'calculate_priority':
          // Bridge to priority analysis
          req.body = args;
          await config.priorityController.analyzePriorities(req, res);
          return;

        case 'get_system_status':
          // Return system status
          result = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            services: {
              taskManager: 'up',
              aiDecomposer: 'up',
              priorityManager: 'up',
              automationEngine: 'up'
            }
          };
          break;

        default:
          res.status(400).json({
            success: false,
            error: {
              code: 'UNKNOWN_TOOL',
              message: `Unknown tool: ${tool}`
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
              version: '1.0.0'
            }
          });
          return;
      }

      // Return result for tools that don't delegate to controllers
      const duration = Date.now() - startTime;
      log.info('MCP', `MCP tool result: ${tool}`, { result, requestId, duration });
      res.json({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: '1.0.0'
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('MCP', `MCP tool error: ${tool}`, { error: error instanceof Error ? error.message : error, requestId, duration });
      res.status(500).json({
        success: false,
        error: {
          code: 'MCP_TOOL_ERROR',
          message: error instanceof Error ? error.message : 'MCP tool execution failed'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: '1.0.0'
        }
      });
    }
  });

  return router;
} 