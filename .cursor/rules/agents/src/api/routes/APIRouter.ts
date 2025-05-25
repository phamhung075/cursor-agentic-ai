import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { DecompositionController } from '../controllers/DecompositionController';
import { PriorityController } from '../controllers/PriorityController';
import { LearningController } from '../controllers/LearningController';
import { AutomationController } from '../controllers/AutomationController';
import { AnalyticsController } from '../controllers/AnalyticsController';

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

  return router;
} 