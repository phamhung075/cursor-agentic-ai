import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskModel } from '../../core/database/TaskMapper';
import { Logger } from '../../types/LogTypes';

// MCP Protocol types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | undefined;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
      enum?: string[] | number[];
      minimum?: number;
      maximum?: number;
      format?: string;
      items?: {
        type: string;
        [key: string]: any;
      };
      examples?: any[];
      [key: string]: any;
    }>;
    required?: string[];
    examples?: any[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  schema?: {
    type: string;
    properties: Record<string, any>;
    [key: string]: any;
  };
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
    example?: string;
  }[];
  template?: string;
}

export interface SessionData {
  id: string;
  response: any; // Will be express.Response
  initialized: boolean;
  capabilities: Record<string, unknown>;
  createdAt: Date;
}

// Global event emitter for MCP events
export const mcpEvents = new EventEmitter();
mcpEvents.setMaxListeners(100);

/**
 * MCP Service Class
 * Provides business logic for MCP operations including tools, resources, and prompts
 */
export class MCPService {
  private logger: Logger;
  private sessions: Map<string, SessionData> = new Map();
  private taskStorageInitialized: boolean = false;

  // MCP Protocol version
  private readonly protocolVersion = '2024-11-05';

  // MCP tools definition
  private readonly tools: MCPTool[] = [
    {
      name: 'create_task',
      description: 'Create a new task in the system with comprehensive metadata. Tasks can be nested in a hierarchy and have various properties to describe their nature, priority, and relationships.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { 
            type: 'string', 
            description: 'Task title - should be concise but descriptive (max 100 chars)'
          },
          description: { 
            type: 'string', 
            description: 'Detailed task description explaining what needs to be done, acceptance criteria, and any relevant context'
          },
          type: { 
            type: 'string', 
            description: 'Task type categorizing the work (epic, feature, task, bug, subtask, etc.)',
            enum: ['epic', 'feature', 'task', 'bug', 'subtask', 'documentation', 'testing', 'implementation', 'design', 'research', 'other']
          },
          level: { 
            type: 'number', 
            description: 'Task hierarchy level (1=Epic, 2=Feature, 3=Task, 4=Subtask, etc.)',
            minimum: 1,
            maximum: 5
          },
          status: { 
            type: 'string', 
            description: 'Current task status in the workflow',
            enum: ['pending', 'in-progress', 'reviewing', 'blocked', 'completed', 'cancelled']
          },
          priority: { 
            type: 'string', 
            description: 'Task priority level reflecting importance and urgency',
            enum: ['low', 'medium', 'high', 'critical']
          },
          complexity: { 
            type: 'string', 
            description: 'Estimated task complexity affecting effort required',
            enum: ['low', 'medium', 'high', 'very_complex']
          },
          parent: { 
            type: 'string', 
            description: 'Parent task ID if this is a subtask or part of a larger feature/epic (null for top-level tasks)'
          },
          tags: { 
            type: 'array', 
            description: 'List of tags for categorization and filtering',
            items: {
              type: 'string'
            },
            examples: [['backend', 'database', 'migration'], ['frontend', 'ui', 'component']]
          },
          estimatedHours: {
            type: 'number',
            description: 'Estimated time to complete the task in hours',
            minimum: 0
          },
          dueDate: {
            type: 'string',
            description: 'Due date for task completion in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)',
            format: 'date-time'
          }
        },
        required: ['title', 'type', 'level'],
        examples: [
          {
            title: "Implement user authentication",
            description: "Create the authentication system with login, registration, and password reset functionality",
            type: "feature",
            level: 2,
            status: "pending",
            priority: "high",
            complexity: "medium",
            tags: ["backend", "security", "user-management"]
          },
          {
            title: "Fix navigation menu overflow on mobile",
            description: "The navigation menu items overflow on mobile devices smaller than 375px width",
            type: "bug",
            level: 3,
            status: "in-progress",
            priority: "medium",
            complexity: "low",
            parent: "feat_001",
            tags: ["frontend", "responsive", "mobile"]
          }
        ]
      }
    },
    // Additional tools would be defined here
  ];

  // MCP resources definition
  private readonly resources: MCPResource[] = [
    {
      uri: 'task://list',
      name: 'Task List',
      description: 'Comprehensive list of all tasks in the system with their properties, relationships, and metadata. This resource provides a current snapshot of the entire task database.',
      mimeType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                level: { type: 'number' },
                status: { type: 'string' },
                priority: { type: 'string' },
                complexity: { type: 'string' },
                progress: { type: 'number' },
                parent: { type: 'string', nullable: true },
                children: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          total: { type: 'number' },
          page: { type: 'number' },
          pageSize: { type: 'number' },
          totalPages: { type: 'number' }
        }
      }
    },
    // Additional resources would be defined here
  ];

  // MCP prompts definition
  private readonly prompts: MCPPrompt[] = [
    {
      name: 'analyze_task',
      description: 'Analyze a task and provide comprehensive insights including progress assessment, potential issues, recommendations, and dependency analysis. This prompt helps in understanding task status and next steps.',
      arguments: [
        { 
          name: 'task_id', 
          description: 'ID of the task to analyze', 
          required: true,
          example: 'task_123'
        },
        { 
          name: 'focus', 
          description: 'Analysis focus area (e.g., "blockers", "dependencies", "resources", "timeline", "general")', 
          required: false,
          example: 'blockers'
        },
        {
          name: 'depth',
          description: 'Analysis depth (basic, standard, detailed)',
          required: false,
          example: 'detailed'
        }
      ],
      template: `Please analyze the following task with a focus on {{focus}}:

Task ID: {{task.id}}
Title: {{task.title}}
Description: {{task.description}}
Type: {{task.type}}
Status: {{task.status}}
Priority: {{task.priority}}
Progress: {{task.progress}}%

Provide insights on:
1. Current progress assessment
2. Potential issues or blockers
3. Recommendations for next steps
4. Dependency analysis
5. Resource requirements
`
    },
    // Additional prompts would be defined here
  ];

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeTaskStorage();
  }

  /**
   * Initialize task storage
   */
  private async initializeTaskStorage(): Promise<void> {
    try {
      await taskStorageFactory.initialize({
        storageType: taskStorageFactory.getStorageType()
      });
      this.taskStorageInitialized = true;
      this.logger.info('MCPService', 'Task storage initialized successfully');
    } catch (error) {
      this.logger.error('MCPService', 'Failed to initialize task storage', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate a unique session ID
   */
  public generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Store session data
   */
  public storeSession(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, data);
  }

  /**
   * Get session data
   */
  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete session data
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): Map<string, SessionData> {
    return this.sessions;
  }

  /**
   * Get protocol version
   */
  public getProtocolVersion(): string {
    return this.protocolVersion;
  }

  /**
   * Get MCP tools
   */
  public getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Get MCP resources
   */
  public getResources(): MCPResource[] {
    return this.resources;
  }

  /**
   * Get MCP prompts
   */
  public getPrompts(): MCPPrompt[] {
    return this.prompts;
  }

  /**
   * Handle initialize request
   */
  public async handleInitialize(sessionId: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const params = request.params as { protocolVersion?: string; capabilities?: Record<string, unknown> } || {};

    // Store client capabilities
    session.capabilities = params.capabilities || {};
    session.initialized = true;

    this.logger.info('MCPService', `Session initialized: ${sessionId}`, {
      protocolVersion: params.protocolVersion,
      capabilities: session.capabilities
    });

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: this.protocolVersion,
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
          prompts: { listChanged: true }
        },
        serverInfo: {
          name: 'MCP SSE Server',
          version: '1.0.0'
        }
      }
    };
  }

  /**
   * Handle tool call request
   */
  public async handleToolCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } || {};
    const toolName = params.name;
    const toolArgs = params.arguments || {};

    this.logger.info('MCPService', `Tool call: ${toolName}`, { arguments: toolArgs });

    const baseResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    // Ensure task storage is initialized
    if (!this.taskStorageInitialized) {
      return {
        ...baseResponse,
        error: {
          code: -32603,
          message: 'Task storage service is not initialized'
        }
      };
    }

    // Get the storage service from the factory
    const taskStorage = taskStorageFactory.getStorageService();

    try {
      switch (toolName) {
        case 'create_task':
          // Extract task fields from arguments
          const title = toolArgs['title'] as string;
          const description = toolArgs['description'] as string || '';
          const type = toolArgs['type'] as string || 'task';
          const level = Number(toolArgs['level'] || 2);
          const status = toolArgs['status'] as string || 'pending';
          const priority = toolArgs['priority'] as string || 'medium';
          const complexity = toolArgs['complexity'] as string || 'medium';
          const parent = toolArgs['parent'] as string || null;
          const tags = toolArgs['tags'] as string[] || [];

          // Create the task
          const newTask = await taskStorage.createTask({
            title,
            description,
            type,
            level,
            status,
            priority,
            complexity,
            parent,
            tags,
            progress: 0,
            aiGenerated: true,
            aiConfidence: 0.85,
            children: [],
            dependencies: [],
            blockedBy: [],
            enables: []
          });

          // Add console log for task creation
          console.log('\n📝 TASK CREATED:');
          console.log(`🔹 ID: ${newTask.id}`);
          console.log(`🔹 Title: ${newTask.title}`);
          console.log(`🔹 Type: ${newTask.type}`);
          console.log(`🔹 Priority: ${newTask.priority}`);
          console.log(`🔹 Status: ${newTask.status}\n`);

          return {
            ...baseResponse,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Task created successfully:\n- Title: ${newTask.title}\n- Description: ${newTask.description}\n- Type: ${newTask.type}\n- Level: ${newTask.level}\n- Status: ${newTask.status}\n- Priority: ${newTask.priority}\n- ID: ${newTask.id}`
                }
              ]
            }
          };

        // Additional tool handlers would be implemented here
          
        default:
          return {
            ...baseResponse,
            error: {
              code: -32601,
              message: `Tool not found: ${toolName}`
            }
          };
      }
    } catch (error) {
      this.logger.error('MCPService', `Error processing tool call: ${toolName}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        ...baseResponse,
        error: {
          code: -32603,
          message: `Internal error processing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Handle resource read request
   */
  public async handleResourceRead(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as { uri?: string } || {};
    const uri = params.uri;

    const baseResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    try {
      switch (uri) {
        case 'task://list':
          // Check if task storage is initialized
          if (!this.taskStorageInitialized) {
            return {
              ...baseResponse,
              error: {
                code: -32603,
                message: 'Task storage service is not initialized'
              }
            };
          }

          // Get tasks from storage
          try {
            const taskStorage = taskStorageFactory.getStorageService();
            const result = await taskStorage.getTasks({ limit: 50 });
            
            return {
              ...baseResponse,
              result: {
                contents: [
                  {
                    uri: uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(result, null, 2)
                  }
                ]
              }
            };
          } catch (error) {
            return {
              ...baseResponse,
              error: {
                code: -32603,
                message: `Error retrieving tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            };
          }

        // Additional resource handlers would be implemented here
          
        default:
          return {
            ...baseResponse,
            error: {
              code: -32602,
              message: `Resource not found: ${uri}`
            }
          };
      }
    } catch (error) {
      return {
        ...baseResponse,
        error: {
          code: -32603,
          message: `Internal error handling resource: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Handle prompt get request
   */
  public async handlePromptGet(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } || {};
    const promptName = params.name;
    const promptArgs = params.arguments || {};

    const baseResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    // Implementation would go here

    return baseResponse;
  }

  /**
   * Broadcast event to all sessions
   */
  public broadcastToAllSessions(event: Record<string, unknown>): void {
    mcpEvents.emit('broadcast', event);
  }
} 