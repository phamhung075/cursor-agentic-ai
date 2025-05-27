import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import path from 'path';
import taskStorageFactory from '../../core/tasks/TaskStorageFactory';
import { TaskModel } from '../../core/database/TaskMapper';
import { Logger } from '../../types/LogTypes';
import { ToolManager, ITool } from '../tools';

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
  private toolManager: ToolManager;

  // MCP Protocol version
  private readonly protocolVersion = '2024-11-05';

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
      name: 'create_task',
      description: 'Create a new task',
      arguments: [
        {
          name: 'title',
          description: 'Task title',
          required: true,
          example: 'Implement user authentication'
        },
        {
          name: 'description',
          description: 'Task description',
          required: false,
          example: 'Set up JWT auth with refresh tokens'
        }
      ],
      template: 'Create a new task titled "{{title}}" with description "{{description}}".'
    },
    {
      name: 'decompose_task',
      description: 'Break down a complex task into subtasks',
      arguments: [
        {
          name: 'task_id',
          description: 'ID of the task to decompose',
          required: true,
          example: 'task_12345'
        },
        {
          name: 'strategy',
          description: 'Decomposition strategy to use',
          required: false,
          example: 'complexity'
        }
      ],
      template: 'Break down task {{task_id}} using the {{strategy}} strategy.'
    }
  ];

  constructor(logger: Logger, toolManager?: ToolManager) {
    this.logger = logger;
    
    // Use the provided toolManager or create a new one
    this.toolManager = toolManager || new ToolManager(logger);
    
    // Initialize tools
    this.initializeTools();
    
    // Initialize task storage
    this.initializeTaskStorage().catch(error => {
      this.logger.error('MCP-SERVICE', 'Failed to initialize task storage', { error });
    });
  }

  /**
   * Initialize and load all tools
   */
  private async initializeTools(): Promise<void> {
    try {
      // Load tools from the tools directory
      const toolsDir = path.join(__dirname, '..', 'tools');
      await this.toolManager.loadAllTools(toolsDir);
      this.logger.info('MCP-SERVICE', `Loaded ${this.toolManager.getAllTools().length} tools`);
    } catch (error) {
      this.logger.error('MCP-SERVICE', 'Failed to initialize tools', { error });
    }
  }

  private async initializeTaskStorage(): Promise<void> {
    if (!this.taskStorageInitialized) {
      try {
        await taskStorageFactory.initialize();
        this.taskStorageInitialized = true;
        this.logger.info('MCP-SERVICE', 'Task storage initialized');
      } catch (error) {
        this.logger.error('MCP-SERVICE', 'Failed to initialize task storage', { error });
        throw error;
      }
    }
  }

  public generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  public storeSession(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, data);
    this.logger.debug('MCP-SERVICE', `Session ${sessionId} stored`);
  }

  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  public deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.debug('MCP-SERVICE', `Session ${sessionId} deleted`);
    }
    return deleted;
  }

  public getAllSessions(): Map<string, SessionData> {
    return this.sessions;
  }

  public getProtocolVersion(): string {
    return this.protocolVersion;
  }

  /**
   * Get all tools as MCPTool format
   */
  public getTools(): MCPTool[] {
    return this.toolManager.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  public getResources(): MCPResource[] {
    return this.resources;
  }

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
    const toolName = params.name || '';
    const toolArgs = params.arguments || {};

    this.logger.info('MCP-SERVICE', `Tool call: ${toolName}`, { toolArgs });

    const baseResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    // Ensure task storage is initialized
    if (!this.taskStorageInitialized) {
      try {
        await this.initializeTaskStorage();
      } catch (error) {
        return {
          ...baseResponse,
          error: {
            code: -32603,
            message: 'Task storage service is not initialized'
          }
        };
      }
    }

    try {
      // Find the tool with the given name
      const tool = this.toolManager.getTool(toolName);
      
      if (!tool) {
        return {
          ...baseResponse,
          error: {
            code: -32601,
            message: `Tool not found: ${toolName}`
          }
        };
      }
      
      // Execute the tool
      const result = await this.toolManager.executeTool(toolName, toolArgs);

      // Log the result (if it's a task-related operation)
      if (result && result.id && result.title) {
        console.log(`\n📝 TASK ${toolName === 'create_task' ? 'CREATED' : 'UPDATED'}:`);
        console.log(`🔹 ID: ${result.id}`);
        console.log(`🔹 Title: ${result.title}`);
        if (result.type) console.log(`🔹 Type: ${result.type}`);
        if (result.status) console.log(`🔹 Status: ${result.status}`);
        if (result.priority) console.log(`🔹 Priority: ${result.priority}`);
        console.log('');
      }

      // Format the response
      let formattedResult;
      
      if (result && typeof result === 'object') {
        // Format object results as text
        if (toolName === 'create_task' || toolName === 'get_task' || toolName === 'update_task') {
          formattedResult = {
            content: [
              {
                type: 'text',
                text: `Task ${toolName === 'create_task' ? 'created' : toolName === 'update_task' ? 'updated' : 'retrieved'} successfully:\n` +
                      Object.entries(result)
                        .filter(([key]) => key !== 'children' && key !== 'tags')
                        .map(([key, value]) => `- ${key}: ${value}`)
                        .join('\n') +
                      (result.tags ? `\n- tags: ${JSON.stringify(result.tags)}` : '') +
                      (result.children ? `\n- children: ${result.children.length} subtask(s)` : '')
              }
            ]
          };
        } else if (toolName === 'list_tasks') {
          formattedResult = {
            content: [
              {
                type: 'text',
                text: `Found ${result.total} tasks (page ${result.page} of ${result.totalPages || 1}):\n\n` +
                      (result.tasks || []).map((task: any, index: number) => 
                        `${index + 1}. ${task.title} (${task.id})\n` +
                        `   Status: ${task.status}, Priority: ${task.priority}, Type: ${task.type}`
                      ).join('\n\n')
              }
            ]
          };
        } else {
          // Generic object formatter
          formattedResult = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
      } else if (typeof result === 'string') {
        // Text results
        formattedResult = {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        };
      } else {
        // Other types
        formattedResult = {
          result
        };
      }

      return {
        ...baseResponse,
        result: formattedResult
      };
    } catch (error) {
      this.logger.error('MCP-SERVICE', `Error processing tool call: ${toolName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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