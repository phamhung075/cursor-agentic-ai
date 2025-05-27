import fs from 'fs';
import path from 'path';
import { BaseTool } from './BaseTool';
import { ITool } from './ITool';
import { Logger } from '../../types/LogTypes';
import { 
  CreateTaskTool, 
  GetTaskTool, 
  ListTasksTool,
  UpdateTaskTool,
  DeleteTaskTool,
  BulkUpdateTaskTool,
  TaskHierarchyTool,
  DecomposeTaskTool,
  TaskmasterSyncTool
} from './index';

/**
 * Tool Manager
 * 
 * Manages all registered tools for the server
 */
export class ToolManager {
  private tools: Map<string, ITool> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a tool with the manager
   * @param tool The tool to register
   * @returns The tool that was registered
   */
  public registerTool(tool: ITool): ITool {
    if (this.tools.has(tool.name)) {
      this.logger.warn('TOOL-MANAGER', `Tool ${tool.name} already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
    return tool;
  }

  /**
   * Register a tool with the manager
   * @param tool The tool to register
   * @returns The tool that was registered
   */
  public async registerToolClass(ToolClass: any): Promise<ITool> {
    try {
      const tool = new ToolClass(this.logger);
      return this.registerTool(tool);
    } catch (error) {
      this.logger.error('TOOL-MANAGER', `Failed to register tool class`, { error });
      throw error;
    }
  }

  /**
   * Get a tool by name
   * @param name The name of the tool to get
   * @returns The tool, or undefined if not found
   */
  public getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns An array of all registered tools
   */
  public getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name
   * @param name The name of the tool to execute
   * @param params The parameters to pass to the tool
   * @returns The result of the tool execution
   */
  public async executeTool(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool.execute(params);
  }

  /**
   * Safely try to load a module, handling both ESM and CommonJS formats
   * @param toolPath Path to the tool file
   * @returns The loaded module
   */
  private async safeImportModule(toolPath: string): Promise<any> {
    try {
      // First try ESM dynamic import
      return await import(toolPath);
    } catch (esmError) {
      try {
        // If ESM fails, try CommonJS require
        // @ts-ignore - Using require dynamically
        return require(toolPath);
      } catch (cjsError) {
        // Convert the .ts extension to .js for compiled files
        const jsPath = toolPath.replace(/\.ts$/, '.js');
        try {
          // Try ESM with .js extension
          return await import(jsPath);
        } catch (jsEsmError) {
          try {
            // Try CommonJS with .js extension
            // @ts-ignore - Using require dynamically
            return require(jsPath);
          } catch (jsCjsError) {
            // If all attempts fail, throw the original error
            throw esmError;
          }
        }
      }
    }
  }

  /**
   * Extract tool classes from a module
   * @param module The loaded module
   * @returns Array of tool classes found in the module
   */
  private extractToolClasses(module: any): any[] {
    const toolClasses: any[] = [];
    
    // Handle CommonJS default export
    if (module.default && typeof module.default === 'function' && 
        module.default.prototype instanceof BaseTool) {
      toolClasses.push(module.default);
    }
    
    // Handle ESM named exports and CommonJS exports
    Object.values(module).forEach(item => {
      if (typeof item === 'function' && item.prototype instanceof BaseTool) {
        toolClasses.push(item);
      }
    });
    
    return toolClasses;
  }

  /**
   * Load all tools from the tools directory
   * @param toolsDir Optional path to the tools directory. If not provided, uses the current directory.
   * @returns The number of tools loaded
   */
  public async loadAllTools(toolsDir?: string): Promise<number> {
    try {
      // Register our built-in tools manually
      this.registerToolClass(CreateTaskTool);
      this.registerToolClass(GetTaskTool);
      this.registerToolClass(ListTasksTool);
      this.registerToolClass(UpdateTaskTool);
      this.registerToolClass(DeleteTaskTool);
      this.registerToolClass(BulkUpdateTaskTool);
      this.registerToolClass(TaskHierarchyTool);
      this.registerToolClass(DecomposeTaskTool);
      this.registerToolClass(TaskmasterSyncTool);

      // If we have a tools directory, try to load additional tools from there
      if (toolsDir && fs.existsSync(toolsDir)) {
        // Read all TypeScript files in the directory
        const files = fs.readdirSync(toolsDir)
          .filter(file => file.endsWith('.ts') && 
                          !file.endsWith('.d.ts') && // Skip declaration files
                          !file.startsWith('ITool') && 
                          !file.startsWith('BaseTool') && 
                          !file.startsWith('ToolManager') && 
                          !file.startsWith('index'));

        this.logger.info('TOOL-MANAGER', `Found ${files.length} potential tool files`);

        // Try to load each file that might contain a tool
        for (const file of files) {
          try {
            // Skip the ones we've already registered manually
            if (['CreateTaskTool.ts', 'GetTaskTool.ts', 'ListTasksTool.ts', 
                 'UpdateTaskTool.ts', 'DeleteTaskTool.ts', 'BulkUpdateTaskTool.ts', 
                 'TaskHierarchyTool.ts', 'DecomposeTaskTool.ts', 'TaskmasterSyncTool.ts'].includes(file)) {
              this.logger.debug('TOOL-MANAGER', `Skipping ${file} as it's already registered manually`);
              continue;
            }

            const toolPath = path.join(toolsDir, file);
            
            // Use our enhanced module loading function
            const module = await this.safeImportModule(toolPath);
            
            // Extract and register tool classes
            const toolClasses = this.extractToolClasses(module);
            
            if (toolClasses.length > 0) {
              for (const ToolClass of toolClasses) {
                await this.registerToolClass(ToolClass);
              }
              this.logger.info('TOOL-MANAGER', `Registered ${toolClasses.length} tools from ${file}`);
            } else {
              this.logger.warn('TOOL-MANAGER', `No tool classes found in ${file}`);
            }
          } catch (error) {
            this.logger.error('TOOL-MANAGER', `Failed to load tool from ${file}`, { error });
          }
        }
      }

      return this.tools.size;
    } catch (error) {
      this.logger.error('TOOL-MANAGER', 'Failed to load tools', { error });
      throw error;
    }
  }
} 