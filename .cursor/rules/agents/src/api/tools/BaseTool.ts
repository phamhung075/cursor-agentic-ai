import { ITool, IToolSchema } from './ITool';
import { Logger } from '../../types/LogTypes';

/**
 * Abstract base class for all MCP tools
 * 
 * Provides common functionality and enforces the ITool interface
 */
export abstract class BaseTool implements ITool {
  name: string;
  description: string;
  inputSchema: IToolSchema;
  protected logger: Logger;

  constructor(name: string, description: string, inputSchema: IToolSchema, logger: Logger) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.logger = logger;
  }

  /**
   * Validate that the parameters match the input schema
   * @param params Parameters to validate
   * @returns Whether the parameters are valid
   */
  protected validateParams(params: Record<string, any>): boolean {
    // Basic validation - check required fields
    if (this.inputSchema.required) {
      for (const requiredField of this.inputSchema.required) {
        if (params[requiredField] === undefined) {
          this.logger.error('TOOL', `Missing required parameter: ${requiredField}`, {
            tool: this.name,
            params
          });
          return false;
        }
      }
    }

    // Type validation
    for (const [key, value] of Object.entries(params)) {
      const schema = this.inputSchema.properties[key];
      if (!schema) {
        this.logger.warn('TOOL', `Unknown parameter: ${key}`, {
          tool: this.name,
          params
        });
        continue;
      }

      // Very basic type checking
      if (schema.type === 'string' && typeof value !== 'string') {
        this.logger.error('TOOL', `Parameter ${key} should be a string`, {
          tool: this.name,
          params
        });
        return false;
      } else if (schema.type === 'number' && typeof value !== 'number') {
        this.logger.error('TOOL', `Parameter ${key} should be a number`, {
          tool: this.name,
          params
        });
        return false;
      } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
        this.logger.error('TOOL', `Parameter ${key} should be a boolean`, {
          tool: this.name,
          params
        });
        return false;
      } else if (schema.type === 'array' && !Array.isArray(value)) {
        this.logger.error('TOOL', `Parameter ${key} should be an array`, {
          tool: this.name,
          params
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Log the start of tool execution
   * @param params Parameters being used
   */
  protected logStart(params: Record<string, any>): void {
    this.logger.info('TOOL', `Starting execution of tool: ${this.name}`, {
      tool: this.name,
      params
    });
  }

  /**
   * Log the completion of tool execution
   * @param result The result of the execution
   * @param startTime The time the execution started
   */
  protected logComplete(result: any, startTime: number): void {
    const duration = Date.now() - startTime;
    this.logger.info('TOOL', `Completed execution of tool: ${this.name}`, {
      tool: this.name,
      duration,
      result
    });
  }

  /**
   * Log an error during tool execution
   * @param error The error that occurred
   * @param params The parameters that were used
   */
  protected logError(error: Error, params: Record<string, any>): void {
    this.logger.error('TOOL', `Error executing tool: ${this.name}`, {
      tool: this.name,
      error: error.message,
      stack: error.stack,
      params
    });
  }

  /**
   * Execute the tool with the given parameters
   * @param params The parameters to use
   * @returns The result of the tool execution
   */
  async execute(params: Record<string, any>): Promise<any> {
    const startTime = Date.now();
    
    // Validate parameters
    if (!this.validateParams(params)) {
      throw new Error(`Invalid parameters for tool: ${this.name}`);
    }

    this.logStart(params);

    try {
      // Call the implementation-specific execution
      const result = await this.executeImpl(params);
      this.logComplete(result, startTime);
      return result;
    } catch (error) {
      this.logError(error as Error, params);
      throw error;
    }
  }

  /**
   * Implementation-specific execution logic
   * Must be implemented by concrete tool classes
   * @param params The parameters to use
   */
  protected abstract executeImpl(params: Record<string, any>): Promise<any>;
} 