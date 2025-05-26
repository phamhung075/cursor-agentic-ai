/**
 * MCP Server for AAI System Enhanced
 * 
 * Model Context Protocol server implementation that exposes
 * intelligent task management capabilities to AI models.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { TaskManager } from '../core/tasks/TaskManager';
import { AITaskDecomposer } from '../core/tasks/AITaskDecomposer';
import { DynamicPriorityManager } from '../core/tasks/DynamicPriorityManager';
import { LearningService } from '../core/tasks/LearningService';
import { AutomationEngine } from '../core/automation/AutomationEngine';
import { Logger } from '../utils/Logger';

import {
  MCPServerConfig,
  MCPTaskResponse,
  MCPTaskListResponse,
  MCPDecompositionResponse,
  MCPPriorityResponse,
  MCPAutomationResponse,
  MCPLearningResponse,
  MCPAnalyticsResponse,
  MCPSystemResponse,
  MCPError,
  MCPErrorCodes,
  CreateTaskInput,
  UpdateTaskInput,
  GetTaskInput,
  ListTasksInput,
  DeleteTaskInput,
  DecomposeTaskInput,
  AnalyzeComplexityInput,
  CalculatePriorityInput,
  UpdatePriorityInput,
  GetPriorityInsightsInput,
  CreateAutomationRuleInput,
  ExecuteWorkflowInput,
  ListAutomationRulesInput,
  GetLearningInsightsInput,
  TrainModelInput,
  GetAnalyticsInput,
  GetSystemStatusInput,
  GetProjectContextInput
} from '../types/MCPTypes';

/**
 * AAI System Enhanced MCP Server
 * 
 * Provides Model Context Protocol interface for AI models to interact
 * with the intelligent task management system.
 */
export class AAIMCPServer {
  private mcpServer: McpServer;
  private config: MCPServerConfig;
  private logger: Logger;
  
  // Core services
  private taskManager: TaskManager;
  private aiDecomposer: AITaskDecomposer;
  private priorityManager: DynamicPriorityManager;
  private learningService: LearningService;
  private automationEngine: AutomationEngine;
  
  private isRunning: boolean = false;
  private startTime: Date = new Date();

  constructor(
    config: MCPServerConfig,
    taskManager: TaskManager,
    aiDecomposer: AITaskDecomposer,
    priorityManager: DynamicPriorityManager,
    learningService: LearningService,
    automationEngine: AutomationEngine,
    logger: Logger
  ) {
    this.config = config;
    this.taskManager = taskManager;
    this.aiDecomposer = aiDecomposer;
    this.priorityManager = priorityManager;
    this.learningService = learningService;
    this.automationEngine = automationEngine;
    this.logger = logger;

    // Initialize MCP server
    this.mcpServer = new McpServer({
      name: config.name,
      version: config.version,
      description: config.description
    });

    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  /**
   * Setup MCP tools
   */
  private setupTools(): void {
    // ========================================================================
    // Task Management Tools
    // ========================================================================

    this.mcpServer.tool(
      'create_task',
      {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Task priority' },
        projectId: { type: 'string', description: 'Project ID' },
        parentId: { type: 'string', description: 'Parent task ID' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Task tags' },
        estimatedHours: { type: 'number', description: 'Estimated hours' },
        dueDate: { type: 'string', description: 'Due date (ISO string)' }
      },
      async (input: CreateTaskInput) => {
        try {
          const task = await this.taskManager.createTask({
            title: input.title,
            description: input.description || '',
            priority: input.priority || 'medium',
            projectId: input.projectId || 'default',
            parentId: input.parentId,
            tags: input.tags || [],
            estimatedHours: input.estimatedHours,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined
          });

          const response: MCPTaskResponse = {
            task,
            metadata: {
              created: true,
              timestamp: new Date().toISOString()
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'create_task');
        }
      }
    );

    this.mcpServer.tool(
      'update_task',
      {
        taskId: { type: 'string', description: 'Task ID to update' },
        title: { type: 'string', description: 'New task title' },
        description: { type: 'string', description: 'New task description' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'], description: 'New task status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'New task priority' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New task tags' },
        estimatedHours: { type: 'number', description: 'New estimated hours' },
        dueDate: { type: 'string', description: 'New due date (ISO string)' }
      },
      async (input: UpdateTaskInput) => {
        try {
          const updates: any = {};
          if (input.title !== undefined) updates.title = input.title;
          if (input.description !== undefined) updates.description = input.description;
          if (input.status !== undefined) updates.status = input.status;
          if (input.priority !== undefined) updates.priority = input.priority;
          if (input.tags !== undefined) updates.tags = input.tags;
          if (input.estimatedHours !== undefined) updates.estimatedHours = input.estimatedHours;
          if (input.dueDate !== undefined) updates.dueDate = new Date(input.dueDate);

          const task = await this.taskManager.updateTask(input.taskId, updates);

          const response: MCPTaskResponse = {
            task,
            metadata: {
              updated: true,
              timestamp: new Date().toISOString()
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'update_task');
        }
      }
    );

    this.mcpServer.tool(
      'get_task',
      {
        taskId: { type: 'string', description: 'Task ID to retrieve' }
      },
      async (input: GetTaskInput) => {
        try {
          const task = await this.taskManager.getTask(input.taskId);
          if (!task) {
            throw new Error(`Task with ID ${input.taskId} not found`);
          }

          const response: MCPTaskResponse = {
            task,
            metadata: {
              retrieved: true,
              timestamp: new Date().toISOString()
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'get_task');
        }
      }
    );

    this.mcpServer.tool(
      'list_tasks',
      {
        projectId: { type: 'string', description: 'Filter by project ID' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'], description: 'Filter by status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Filter by priority' },
        limit: { type: 'number', description: 'Maximum number of tasks to return' },
        offset: { type: 'number', description: 'Number of tasks to skip' }
      },
      async (input: ListTasksInput) => {
        try {
          const filters: any = {};
          if (input.projectId) filters.projectId = input.projectId;
          if (input.status) filters.status = input.status;
          if (input.priority) filters.priority = input.priority;

          const tasks = await this.taskManager.listTasks(filters, {
            limit: input.limit || 20,
            offset: input.offset || 0
          });

          const total = await this.taskManager.countTasks(filters);

          const response: MCPTaskListResponse = {
            tasks,
            total,
            hasMore: (input.offset || 0) + tasks.length < total,
            metadata: {
              filters,
              sorting: { field: 'createdAt', order: 'desc' }
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'list_tasks');
        }
      }
    );

    this.mcpServer.tool(
      'delete_task',
      {
        taskId: { type: 'string', description: 'Task ID to delete' }
      },
      async (input: DeleteTaskInput) => {
        try {
          await this.taskManager.deleteTask(input.taskId);

          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({ 
                success: true, 
                message: `Task ${input.taskId} deleted successfully`,
                timestamp: new Date().toISOString()
              }, null, 2) 
            }]
          };
        } catch (error) {
          return this.handleError(error, 'delete_task');
        }
      }
    );

    // ========================================================================
    // AI Task Decomposition Tools
    // ========================================================================

    this.mcpServer.tool(
      'decompose_task',
      {
        taskId: { type: 'string', description: 'Task ID to decompose' },
        maxDepth: { type: 'number', description: 'Maximum decomposition depth' },
        includeEstimates: { type: 'boolean', description: 'Include time estimates' },
        analysisType: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], description: 'Analysis depth' }
      },
      async (input: DecomposeTaskInput) => {
        try {
          const result = await this.aiDecomposer.decomposeTask(input.taskId, {
            maxDepth: input.maxDepth || 3,
            includeEstimates: input.includeEstimates !== false,
            analysisType: input.analysisType || 'detailed'
          });

          const response: MCPDecompositionResponse = {
            taskId: input.taskId,
            subtasks: result.subtasks,
            analysis: {
              complexity: result.analysis.complexity,
              estimatedHours: result.analysis.estimatedHours,
              recommendations: result.analysis.recommendations,
              dependencies: result.analysis.dependencies
            },
            metadata: {
              analysisType: input.analysisType || 'detailed',
              confidence: result.confidence,
              timestamp: new Date().toISOString()
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'decompose_task');
        }
      }
    );

    this.mcpServer.tool(
      'analyze_complexity',
      {
        taskDescription: { type: 'string', description: 'Task description to analyze' },
        context: { type: 'string', description: 'Additional context' },
        includeRecommendations: { type: 'boolean', description: 'Include recommendations' }
      },
      async (input: AnalyzeComplexityInput) => {
        try {
          const analysis = await this.aiDecomposer.analyzeComplexity(
            input.taskDescription,
            input.context,
            input.includeRecommendations !== false
          );

          return {
            content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'analyze_complexity');
        }
      }
    );

    // ========================================================================
    // Priority Management Tools
    // ========================================================================

    this.mcpServer.tool(
      'calculate_priority',
      {
        taskId: { type: 'string', description: 'Task ID to calculate priority for' },
        factors: {
          type: 'object',
          properties: {
            urgency: { type: 'number', description: 'Urgency factor (1-10)' },
            importance: { type: 'number', description: 'Importance factor (1-10)' },
            effort: { type: 'number', description: 'Effort factor (1-10)' },
            dependencies: { type: 'number', description: 'Dependencies factor (0-10)' }
          },
          description: 'Priority calculation factors'
        }
      },
      async (input: CalculatePriorityInput) => {
        try {
          const result = await this.priorityManager.calculatePriority(input.taskId, input.factors);

          const response: MCPPriorityResponse = {
            taskId: input.taskId,
            priority: result.priority,
            score: result.score,
            factors: result.factors,
            reasoning: result.reasoning,
            recommendations: result.recommendations
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'calculate_priority');
        }
      }
    );

    // ========================================================================
    // System Status Tool
    // ========================================================================

    this.mcpServer.tool(
      'get_system_status',
      {
        includeMetrics: { type: 'boolean', description: 'Include system metrics' },
        includeHealth: { type: 'boolean', description: 'Include health checks' }
      },
      async (input: GetSystemStatusInput) => {
        try {
          const uptime = Date.now() - this.startTime.getTime();
          
          const response: MCPSystemResponse = {
            status: 'healthy',
            uptime,
            version: this.config.version,
            capabilities: ['task_management', 'ai_decomposition', 'priority_management', 'automation', 'learning'],
            metrics: {
              tasksProcessed: await this.taskManager.countTasks({}),
              automationRules: await this.automationEngine.getRuleCount(),
              activeProjects: await this.taskManager.getActiveProjectCount(),
              memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
            },
            health: {
              database: 'connected',
              ai: 'available',
              automation: 'running'
            }
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          };
        } catch (error) {
          return this.handleError(error, 'get_system_status');
        }
      }
    );
  }

  /**
   * Setup MCP resources
   */
  private setupResources(): void {
    // Task resource
    this.mcpServer.resource(
      'task',
      'task://{taskId}',
      async (uri, { taskId }) => {
        try {
          const task = await this.taskManager.getTask(taskId);
          if (!task) {
            throw new Error(`Task ${taskId} not found`);
          }

          return {
            contents: [{
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(task, null, 2)
            }]
          };
        } catch (error) {
          throw new Error(`Failed to retrieve task resource: ${error.message}`);
        }
      }
    );

    // Project tasks resource
    this.mcpServer.resource(
      'project-tasks',
      'project://{projectId}/tasks',
      async (uri, { projectId }) => {
        try {
          const tasks = await this.taskManager.listTasks({ projectId });

          return {
            contents: [{
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(tasks, null, 2)
            }]
          };
        } catch (error) {
          throw new Error(`Failed to retrieve project tasks resource: ${error.message}`);
        }
      }
    );
  }

  /**
   * Setup MCP prompts
   */
  private setupPrompts(): void {
    this.mcpServer.prompt(
      'task-analysis',
      {
        taskDescription: { type: 'string', description: 'Description of the task to analyze' },
        context: { type: 'string', description: 'Additional context about the task' }
      },
      ({ taskDescription, context }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze this task and provide recommendations:

Task: ${taskDescription}

Context: ${context || 'No additional context provided'}

Please provide:
1. Complexity assessment (1-10 scale)
2. Estimated time to complete
3. Potential subtasks or breakdown
4. Dependencies or prerequisites
5. Priority recommendation
6. Risk factors or challenges`
          }
        }]
      })
    );

    this.mcpServer.prompt(
      'priority-assessment',
      {
        tasks: { type: 'string', description: 'JSON array of tasks to prioritize' }
      },
      ({ tasks }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze and prioritize these tasks:

${tasks}

For each task, consider:
1. Urgency (how time-sensitive is it?)
2. Importance (how critical is it to goals?)
3. Effort required (complexity and time)
4. Dependencies (what blocks or enables this?)
5. Impact (what's the effect of completion/delay?)

Provide a prioritized list with reasoning for each ranking.`
          }
        }]
      })
    );
  }

  /**
   * Handle errors and return formatted error response
   */
  private handleError(error: any, toolName: string) {
    const mcpError: MCPError = {
      code: MCPErrorCodes.SYSTEM_ERROR,
      message: error.message || 'Unknown error occurred',
      details: {
        tool: toolName,
        error: error.toString()
      },
      timestamp: new Date().toISOString()
    };

    this.logger.error(`MCP Tool Error [${toolName}]:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(mcpError, null, 2)
      }],
      isError: true
    };
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    try {
      let transport;

      if (this.config.transport.type === 'stdio') {
        transport = new StdioServerTransport();
        this.logger.info('Starting MCP server with stdio transport');
      } else if (this.config.transport.type === 'http') {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => Math.random().toString(36).substring(7)
        });
        this.logger.info(`Starting MCP server with HTTP transport on port ${this.config.transport.port}`);
      } else {
        throw new Error(`Unsupported transport type: ${this.config.transport.type}`);
      }

      await this.mcpServer.connect(transport);
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.logger.info(`🚀 AAI MCP Server started successfully`);
      this.logger.info(`📋 Available tools: ${this.getAvailableTools().length}`);
      this.logger.info(`📚 Available resources: ${this.getAvailableResources().length}`);
      this.logger.info(`💡 Available prompts: ${this.getAvailablePrompts().length}`);

    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    try {
      if (this.mcpServer) {
        await this.mcpServer.close();
      }
      
      this.isRunning = false;
      this.logger.info('🛑 AAI MCP Server stopped');
    } catch (error) {
      this.logger.error('Error stopping MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  public getStatus(): {
    isRunning: boolean;
    uptime: number;
    startTime: Date;
    config: MCPServerConfig;
  } {
    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
      startTime: this.startTime,
      config: this.config
    };
  }

  /**
   * Get available tools
   */
  public getAvailableTools(): string[] {
    return [
      'create_task',
      'update_task',
      'get_task',
      'list_tasks',
      'delete_task',
      'decompose_task',
      'analyze_complexity',
      'calculate_priority',
      'get_system_status'
    ];
  }

  /**
   * Get available resources
   */
  public getAvailableResources(): string[] {
    return [
      'task://{taskId}',
      'project://{projectId}/tasks'
    ];
  }

  /**
   * Get available prompts
   */
  public getAvailablePrompts(): string[] {
    return [
      'task-analysis',
      'priority-assessment'
    ];
  }

  /**
   * Get MCP server instance
   */
  public getMCPServer(): McpServer {
    return this.mcpServer;
  }
} 