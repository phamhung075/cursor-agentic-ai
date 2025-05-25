/**
 * API Server Example
 * 
 * Example of how to set up and start the API server
 * with all the intelligent task management components.
 */

import { APIServer } from './APIServer';
import { TaskManager } from '../core/tasks/TaskManager';
import { LearningService } from '../core/tasks/LearningService';
import { DynamicPriorityManager } from '../core/tasks/DynamicPriorityManager';
import { AITaskDecomposer } from '../core/tasks/AITaskDecomposer';
import { AutomationEngine } from '../core/automation/AutomationEngine';
import { APIConfig } from '../types/APITypes';

/**
 * Example API server setup
 */
async function startAPIServer() {
  try {
    // Initialize core services
    const taskManager = new TaskManager();
    const learningService = new LearningService(taskManager);
    const priorityManager = new DynamicPriorityManager(taskManager);
    const taskDecomposer = new AITaskDecomposer();
    const automationEngine = new AutomationEngine(
      taskManager,
      learningService,
      priorityManager,
      taskDecomposer
    );

    // API configuration
    const apiConfig: APIConfig = {
      port: 3000,
      host: 'localhost',
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },
      auth: {
        enabled: false, // Disable auth for development
        jwtSecret: 'your-secret-key',
        tokenExpiry: '24h'
      },
      validation: {
        strict: true,
        stripUnknown: true
      },
      logging: {
        level: 'info',
        requests: true,
        responses: false
      },
      websocket: {
        enabled: true,
        path: '/socket.io'
      }
    };

    // Create and start API server
    const apiServer = new APIServer(
      apiConfig,
      taskManager,
      learningService,
      priorityManager,
      taskDecomposer,
      automationEngine
    );

    // Start the automation engine
    await automationEngine.start();

    // Start the API server
    await apiServer.start();

    console.log('🎉 AAI Task Management API is ready!');
    console.log(`📖 API Documentation: http://${apiConfig.host}:${apiConfig.port}/api/docs`);
    console.log(`🔍 Health Check: http://${apiConfig.host}:${apiConfig.port}/health`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await automationEngine.stop();
      await apiServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    process.exit(1);
  }
}

// Example API usage
async function exampleAPIUsage() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('📝 Example API Usage:');
  console.log(`
  # Create a new task
  curl -X POST ${baseUrl}/tasks \\
    -H "Content-Type: application/json" \\
    -d '{
      "title": "Implement user authentication",
      "description": "Add JWT-based authentication to the API",
      "type": "feature",
      "priority": "high",
      "complexity": "medium",
      "estimatedHours": 8,
      "tags": ["auth", "security", "api"]
    }'

  # Get all tasks
  curl ${baseUrl}/tasks

  # Get task by ID
  curl ${baseUrl}/tasks/task_123

  # Update task
  curl -X PUT ${baseUrl}/tasks/task_123 \\
    -H "Content-Type: application/json" \\
    -d '{
      "status": "in_progress",
      "progress": 25
    }'

  # Decompose a complex task
  curl -X POST ${baseUrl}/decomposition/decompose \\
    -H "Content-Type: application/json" \\
    -d '{
      "taskId": "task_123",
      "strategy": "complexity",
      "maxDepth": 3
    }'

  # Get analytics dashboard
  curl ${baseUrl}/analytics/dashboard

  # Get automation metrics
  curl ${baseUrl}/automation/metrics

  # Get learning insights
  curl ${baseUrl}/learning/insights
  `);
}

// Run the example if this file is executed directly
if (require.main === module) {
  startAPIServer();
  exampleAPIUsage();
} 