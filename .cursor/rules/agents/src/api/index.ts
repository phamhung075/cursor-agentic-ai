/**
 * API Module
 * 
 * Main entry point for the REST API system that provides
 * comprehensive endpoints for intelligent task management.
 */

export { APIServer } from './APIServer';
export { createAPIRouter } from './routes/APIRouter';

// Controllers
export { TaskController } from './controllers/TaskController';
export { DecompositionController } from './controllers/DecompositionController';
export { PriorityController } from './controllers/PriorityController';
export { LearningController } from './controllers/LearningController';
export { AutomationController } from './controllers/AutomationController';
export { AnalyticsController } from './controllers/AnalyticsController';

// Middleware
export { errorHandler } from './middleware/ErrorHandler';
export { requestLogger } from './middleware/RequestLogger';
export { authMiddleware } from './middleware/AuthMiddleware';
export { validationMiddleware } from './middleware/ValidationMiddleware';

// Re-export API types
export * from '../types/APITypes'; 