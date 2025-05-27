/**
 * Interface for MCP Tool Definition
 * 
 * Defines the structure of a tool in the Model Context Protocol
 */

export interface IToolSchema {
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
}

export interface ITool {
  /**
   * Unique name of the tool, used to identify it when calling
   */
  name: string;
  
  /**
   * Detailed description of what the tool does and when to use it
   */
  description: string;
  
  /**
   * JSON Schema defining the input parameters for the tool
   */
  inputSchema: IToolSchema;
  
  /**
   * Method to execute the tool with provided parameters
   * @param params The parameters passed to the tool
   * @returns The result of the tool execution
   */
  execute(params: Record<string, any>): Promise<any>;
} 