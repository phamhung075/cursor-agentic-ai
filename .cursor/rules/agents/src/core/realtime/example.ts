/**
 * Real-Time Synchronization Example
 * 
 * Example of how to set up and use the real-time synchronization
 * system with WebSocket support and live updates.
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { TaskManager } from '../tasks/TaskManager';
import { LearningService } from '../tasks/LearningService';
import { AutomationEngine } from '../automation/AutomationEngine';
import { WebSocketManager } from './WebSocketManager';
import { SynchronizationService } from './SynchronizationService';
import { RealTimeConfig } from '../../types/RealTimeTypes';

/**
 * Example real-time system setup
 */
async function startRealTimeSystem() {
  try {
    // Create HTTP server for WebSocket
    const httpServer = createServer();
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Real-time configuration
    const config: RealTimeConfig = {
      enabled: true,
      websocket: {
        path: '/socket.io',
        cors: {
          origin: "*",
          credentials: false
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        maxConnections: 1000
      },
      events: {
        maxRetries: 3,
        retryDelay: 1000,
        batchSize: 10,
        flushInterval: 100
      },
      presence: {
        enabled: true,
        heartbeatInterval: 30000,
        timeoutThreshold: 60000
      },
      conflicts: {
        detectionEnabled: true,
        autoResolve: true,
        resolutionTimeout: 30000
      },
      dashboard: {
        updateInterval: 5000,
        metricsRetention: 3600000, // 1 hour
        maxEvents: 1000
      }
    };

    // Initialize core services
    const taskManager = new TaskManager();
    const learningService = new LearningService(taskManager);
    const automationEngine = new AutomationEngine(
      taskManager,
      learningService,
      null as any, // DynamicPriorityManager
      null as any  // AITaskDecomposer
    );

    // Initialize real-time components
    const webSocketManager = new WebSocketManager(io, config);
    const syncService = new SynchronizationService(
      config,
      taskManager,
      learningService,
      automationEngine,
      webSocketManager
    );

    // Start the synchronization service
    await syncService.start();

    // Start HTTP server
    const port = process.env['REALTIME_PORT'] || 3001;
    httpServer.listen(port, () => {
      console.log(`🚀 Real-time system started on port ${port}`);
      console.log(`📊 Dashboard updates every ${config.dashboard.updateInterval}ms`);
      console.log(`🔄 Synchronization enabled with conflict detection`);
    });

    // Example: Simulate some real-time events
    setTimeout(async () => {
      console.log('📝 Simulating task creation...');
      
      const result = await taskManager.createTask({
        title: 'Real-time Test Task',
        description: 'Testing real-time synchronization',
        type: 'feature',
        priority: 'medium',
        complexity: 'simple',
        estimatedHours: 2
      });

      if (result.success) {
        console.log(`✅ Created task: ${result.taskId}`);
      } else {
        console.log(`❌ Failed to create task: ${result.error}`);
      }
    }, 5000);

    // Example: Get live dashboard data
    setInterval(async () => {
      const dashboardData = await syncService.getLiveDashboardData();
      console.log(`📊 Dashboard: ${dashboardData.metrics.activeTasks} active tasks, ${dashboardData.metrics.activeUsers} users online`);
    }, 30000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down real-time system...');
      await syncService.stop();
      httpServer.close();
      process.exit(0);
    });

    return {
      syncService,
      webSocketManager,
      taskManager,
      learningService,
      automationEngine
    };

  } catch (error) {
    console.error('❌ Error starting real-time system:', error);
    throw error;
  }
}

/**
 * Example client-side WebSocket connection
 */
function exampleClientConnection() {
  // This would be used in a frontend application
  const clientCode = `
    import io from 'socket.io-client';

    // Connect to real-time server
    const socket = io('http://localhost:3001');

    // Handle connection
    socket.on('connected', (data) => {
      console.log('Connected to AAI Real-time System:', data);
      
      // Authenticate
      socket.emit('authenticate', {
        userId: 'user123',
        username: 'John Doe',
        token: 'your-auth-token'
      });
    });

    // Handle authentication
    socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
      
      // Subscribe to task updates
      socket.emit('subscribe', {
        channel: 'tasks',
        filters: { priority: 'high' }
      });
      
      // Subscribe to dashboard updates
      socket.emit('subscribe', {
        channel: 'dashboard'
      });
    });

    // Handle real-time events
    socket.on('realtime_event', (message) => {
      console.log('Real-time event:', message);
      
      switch (message.type) {
        case 'task_created':
          console.log('New task created:', message.payload.task);
          break;
        case 'task_updated':
          console.log('Task updated:', message.payload.task);
          break;
        case 'dashboard_update':
          console.log('Dashboard update:', message.payload);
          break;
        case 'automation_executed':
          console.log('Automation executed:', message.payload);
          break;
      }
    });

    // Handle presence updates
    socket.on('user_joined', (data) => {
      console.log('User joined:', data.user);
    });

    socket.on('user_left', (data) => {
      console.log('User left:', data);
    });

    // Send presence updates
    setInterval(() => {
      socket.emit('presence_update', {
        status: 'online',
        currentTask: 'task123'
      });
    }, 30000);
  `;

  console.log('📱 Example client-side code:');
  console.log(clientCode);
}

// Export for use
export {
  startRealTimeSystem,
  exampleClientConnection
};

// Run example if this file is executed directly
if (require.main === module) {
  startRealTimeSystem()
    .then(() => {
      console.log('✅ Real-time system example started successfully');
      exampleClientConnection();
    })
    .catch((error) => {
      console.error('❌ Failed to start real-time system example:', error);
      process.exit(1);
    });
} 