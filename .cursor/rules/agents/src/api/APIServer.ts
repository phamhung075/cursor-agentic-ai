import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { createServer, Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { APIConfig, APIResponse, APIError, RequestContext } from '../types/APITypes';
import { TaskManager } from '../core/tasks/TaskManager';
import { LearningService } from '../core/tasks/LearningService';
import { DynamicPriorityManager } from '../core/tasks/DynamicPriorityManager';
import { AITaskDecomposer } from '../core/tasks/AITaskDecomposer';
import { AutomationEngine } from '../core/automation/AutomationEngine';

import { TaskController } from './controllers/TaskController';
import { DecompositionController } from './controllers/DecompositionController';
import { PriorityController } from './controllers/PriorityController';
import { LearningController } from './controllers/LearningController';
import { AutomationController } from './controllers/AutomationController';
import { AnalyticsController } from './controllers/AnalyticsController';

import { createAPIRouter } from './routes/APIRouter';
import { errorHandler } from './middleware/ErrorHandler';
import { requestLogger } from './middleware/RequestLogger';
import { authMiddleware } from './middleware/AuthMiddleware';
import { validationMiddleware } from './middleware/ValidationMiddleware';

/**
 * API Server
 * 
 * Main Express.js server that provides REST API endpoints
 * for the intelligent task management system.
 */
export class APIServer {
  private app: Express;
  private server: Server;
  private io: SocketIOServer;
  private config: APIConfig;
  
  // Core services
  private taskManager: TaskManager;
  private learningService: LearningService;
  private priorityManager: DynamicPriorityManager;
  private taskDecomposer: AITaskDecomposer;
  private automationEngine: AutomationEngine;
  
  // Controllers
  private taskController: TaskController;
  private decompositionController: DecompositionController;
  private priorityController: PriorityController;
  private learningController: LearningController;
  private automationController: AutomationController;
  private analyticsController: AnalyticsController;

  private isRunning: boolean = false;
  private startTime: Date = new Date();

  constructor(
    config: APIConfig,
    taskManager: TaskManager,
    learningService: LearningService,
    priorityManager: DynamicPriorityManager,
    taskDecomposer: AITaskDecomposer,
    automationEngine: AutomationEngine
  ) {
    this.config = config;
    this.taskManager = taskManager;
    this.learningService = learningService;
    this.priorityManager = priorityManager;
    this.taskDecomposer = taskDecomposer;
    this.automationEngine = automationEngine;

    this.app = express();
    this.server = createServer(this.app);
    
    // Initialize controllers
    this.initializeControllers();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup WebSocket if enabled
    if (this.config.websocket.enabled) {
      this.setupWebSocket();
    }
    
    // Setup error handling
    this.setupErrorHandling();
  }

  /**
   * Start the API server
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.config.port, this.config.host, () => {
          this.isRunning = true;
          this.startTime = new Date();
          
          console.log(`🚀 API Server started on ${this.config.host}:${this.config.port}`);
          console.log(`📚 API Documentation available at http://${this.config.host}:${this.config.port}/api/docs`);
          
          if (this.config.websocket.enabled) {
            console.log(`🔌 WebSocket server enabled at ${this.config.websocket.path}`);
          }
          
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('🛑 API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server status
   */
  public getStatus(): {
    isRunning: boolean;
    uptime: number;
    startTime: Date;
    config: APIConfig;
  } {
    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
      startTime: this.startTime,
      config: this.config
    };
  }

  /**
   * Get Express app instance
   */
  public getApp(): Express {
    return this.app;
  }

  /**
   * Get Socket.IO server instance
   */
  public getSocketServer(): SocketIOServer | undefined {
    return this.io;
  }

  /**
   * Initialize controllers
   */
  private initializeControllers(): void {
    this.taskController = new TaskController(this.taskManager);
    this.decompositionController = new DecompositionController(this.taskDecomposer);
    this.priorityController = new PriorityController(this.priorityManager);
    this.learningController = new LearningController(this.learningService);
    this.automationController = new AutomationController(this.automationEngine);
    this.analyticsController = new AnalyticsController(
      this.taskManager,
      this.learningService,
      this.automationEngine
    );
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      }
    });
    this.app.use('/api', limiter);
    
    // Request context middleware
    this.app.use(this.createRequestContext.bind(this));
    
    // Request logging
    if (this.config.logging.requests) {
      this.app.use(requestLogger);
    }
    
    // Authentication middleware (if enabled)
    if (this.config.auth.enabled) {
      this.app.use('/api', authMiddleware(this.config.auth));
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.healthCheck.bind(this));
    
    // API documentation
    this.app.get('/api/docs', this.apiDocs.bind(this));
    
    // Main API routes
    const apiRouter = createAPIRouter({
      taskController: this.taskController,
      decompositionController: this.decompositionController,
      priorityController: this.priorityController,
      learningController: this.learningController,
      automationController: this.automationController,
      analyticsController: this.analyticsController
    });
    
    this.app.use('/api', apiRouter);
    
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).context?.requestId || 'unknown',
          version: '1.0.0'
        }
      });
    });
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocket(): void {
    this.io = new SocketIOServer(this.server, {
      path: this.config.websocket.path,
      cors: {
        origin: this.config.cors.origin,
        credentials: this.config.cors.credentials
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket client connected: ${socket.id}`);
      
      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to AAI Task Management System',
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
      });
      
      // Handle subscription to task updates
      socket.on('subscribe_tasks', (data) => {
        socket.join('task_updates');
        socket.emit('subscribed', { channel: 'task_updates' });
      });
      
      // Handle subscription to automation events
      socket.on('subscribe_automation', (data) => {
        socket.join('automation_events');
        socket.emit('subscribed', { channel: 'automation_events' });
      });
    });

    // Listen to task manager events
    this.taskManager.on('taskCreated', (data) => {
      this.io.to('task_updates').emit('task_created', {
        type: 'task_created',
        payload: { task: data.task },
        timestamp: new Date().toISOString()
      });
    });

    this.taskManager.on('taskUpdated', (data) => {
      this.io.to('task_updates').emit('task_updated', {
        type: 'task_updated',
        payload: { task: data.task, changes: data.changes },
        timestamp: new Date().toISOString()
      });
    });

    // Listen to automation engine events
    this.automationEngine.on('ruleExecuted', (data) => {
      this.io.to('automation_events').emit('automation_executed', {
        type: 'automation_executed',
        payload: { event: data.event, result: data.result },
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Create request context middleware
   */
  private createRequestContext(req: Request, res: Response, next: NextFunction): void {
    const context: RequestContext = {
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };
    
    // Add user info if authenticated
    if ((req as any).user) {
      context.userId = (req as any).user.id;
      context.userRole = (req as any).user.role;
    }
    
    (req as any).context = context;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', context.requestId);
    
    next();
  }

  /**
   * Health check endpoint
   */
  private async healthCheck(req: Request, res: Response): Promise<void> {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime,
      services: {
        taskManager: {
          status: 'up' as const,
          lastCheck: new Date().toISOString()
        },
        learningService: {
          status: 'up' as const,
          lastCheck: new Date().toISOString()
        },
        automationEngine: {
          status: 'up' as const,
          lastCheck: new Date().toISOString()
        }
      },
      metrics: {
        memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        cpuUsage: process.cpuUsage().user / 1000000, // seconds
        activeConnections: this.io ? this.io.sockets.sockets.size : 0,
        requestsPerMinute: 0 // Would need to implement request counting
      }
    };
    
    res.json(health);
  }

  /**
   * API documentation endpoint
   */
  private apiDocs(req: Request, res: Response): void {
    const docs = {
      title: 'AAI Task Management API',
      version: '1.0.0',
      description: 'Intelligent task management system with AI-driven features',
      baseUrl: `http://${this.config.host}:${this.config.port}/api`,
      endpoints: {
        tasks: {
          'GET /tasks': 'List all tasks with filtering and pagination',
          'POST /tasks': 'Create a new task',
          'GET /tasks/:id': 'Get task by ID',
          'PUT /tasks/:id': 'Update task',
          'DELETE /tasks/:id': 'Delete task',
          'POST /tasks/bulk': 'Bulk update tasks'
        },
        decomposition: {
          'POST /decomposition/decompose': 'Decompose a task using AI',
          'GET /decomposition/strategies': 'Get available decomposition strategies'
        },
        priority: {
          'POST /priority/analyze': 'Analyze task priorities',
          'PUT /priority/update': 'Update task priority',
          'GET /priority/recommendations': 'Get priority recommendations'
        },
        learning: {
          'POST /learning/feedback': 'Provide learning feedback',
          'GET /learning/insights': 'Get learning insights',
          'GET /learning/stats': 'Get learning statistics'
        },
        automation: {
          'GET /automation/rules': 'List automation rules',
          'POST /automation/rules': 'Create automation rule',
          'GET /automation/workflows': 'List workflows',
          'POST /automation/workflows': 'Create workflow',
          'POST /automation/execute': 'Execute workflow'
        },
        analytics: {
          'GET /analytics/dashboard': 'Get analytics dashboard data',
          'POST /analytics/query': 'Custom analytics query'
        }
      },
      websocket: this.config.websocket.enabled ? {
        url: `ws://${this.config.host}:${this.config.port}${this.config.websocket.path}`,
        events: {
          'task_created': 'Task created event',
          'task_updated': 'Task updated event',
          'automation_executed': 'Automation rule executed'
        }
      } : null
    };
    
    res.json(docs);
  }
} 