import { spawn } from 'child_process';

/**
 * Task Master integration class for interacting with Task Master via MCP tools
 */
export class TaskMaster {
  /**
   * Executes an MCP tool for Task Master
   * @param tool MCP tool name
   * @param params Parameters for the tool
   * @returns Promise resolving to the tool result
   */
  private static async executeMcpTool(tool: string, params: Record<string, any> = {}): Promise<any> {
    // In a real implementation, this would use the MCP interface directly
    // For demonstration, we'll use a placeholder implementation that logs the call
    console.log(`[TaskMaster] Executing MCP tool: ${tool}`);
    console.log(`[TaskMaster] Parameters: ${JSON.stringify(params, null, 2)}`);

    // For some tools, we'll simulate CLI command execution
    if (this.hasCLIEquivalent(tool)) {
      const cliCommand = this.mcpToolToCLI(tool, params);
      console.log(`[TaskMaster] CLI equivalent: ${cliCommand}`);

      // Execute the CLI command and return its output
      try {
        const result = await this.executeCliCommand(cliCommand);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }

    // Mock implementation for demonstration
    return { success: true, message: `Executed ${tool} with params: ${JSON.stringify(params)}` };
  }

  /**
   * Checks if an MCP tool has a CLI equivalent
   * @param tool MCP tool name
   * @returns Whether the tool has a CLI equivalent
   */
  private static hasCLIEquivalent(tool: string): boolean {
    const toolsWithCliEquivalent = [
      'get_tasks',
      'next_task',
      'get_task',
      'set_task_status',
      'generate'
    ];

    return toolsWithCliEquivalent.includes(tool);
  }

  /**
   * Converts an MCP tool call to its CLI equivalent
   * @param tool MCP tool name
   * @param params Parameters for the tool
   * @returns CLI command string
   */
  private static mcpToolToCLI(tool: string, params: Record<string, any>): string {
    const cliMappings: Record<string, string> = {
      'get_tasks': 'list',
      'next_task': 'next',
      'get_task': 'show',
      'set_task_status': 'set-status',
      'add_task': 'add-task',
      'add_subtask': 'add-subtask',
      'update_task': 'update-task',
      'update_subtask': 'update-subtask',
      'expand_task': 'expand',
      'clear_subtasks': 'clear-subtasks',
      'generate': 'generate',
      'validate_dependencies': 'validate-dependencies',
      'fix_dependencies': 'fix-dependencies'
    };

    const cliCommand = cliMappings[tool] || tool.replace(/_/g, '-');
    let fullCommand = `task-master ${cliCommand}`;

    // Add parameters based on the tool
    switch (tool) {
      case 'get_tasks':
        if (params.status) fullCommand += ` -s ${params.status}`;
        if (params.withSubtasks) fullCommand += ' --with-subtasks';
        break;

      case 'get_task':
        if (params.id) fullCommand += ` ${params.id}`;
        break;

      case 'set_task_status':
        if (params.id) fullCommand += ` -i ${params.id}`;
        if (params.status) fullCommand += ` -s ${params.status}`;
        break;

      case 'expand_task':
        if (params.id) fullCommand += ` -i ${params.id}`;
        if (params.num) fullCommand += ` -n ${params.num}`;
        if (params.research) fullCommand += ' -r';
        if (params.force) fullCommand += ' --force';
        if (params.prompt) fullCommand += ` -p "${params.prompt}"`;
        break;

      default:
        // Generic parameter handling
        Object.entries(params).forEach(([key, value]) => {
          if (typeof value === 'boolean' && value) {
            fullCommand += ` --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          } else if (typeof value !== 'boolean') {
            fullCommand += ` --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}=${value}`;
          }
        });
    }

    return fullCommand;
  }

  /**
   * Executes a CLI command and returns its output
   * @param command Command to execute
   * @returns Promise resolving to the command output
   */
  private static executeCliCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would execute the command
      // For demonstration, we'll just resolve with a mock response
      setTimeout(() => {
        resolve(`Mock output for command: ${command}`);
      }, 100);
    });
  }

  /**
   * Gets all tasks in the project
   * @param status Optional status to filter by
   * @param withSubtasks Whether to include subtasks
   * @returns Promise resolving to the list of tasks
   */
  public static async getTasks(status?: string, withSubtasks: boolean = false): Promise<any> {
    return this.executeMcpTool('get_tasks', { status, withSubtasks });
  }

  /**
   * Gets the next task to work on
   * @returns Promise resolving to the next task
   */
  public static async getNextTask(): Promise<any> {
    return this.executeMcpTool('next_task');
  }

  /**
   * Gets a specific task by ID
   * @param id ID of the task
   * @returns Promise resolving to the task details
   */
  public static async getTask(id: string): Promise<any> {
    return this.executeMcpTool('get_task', { id });
  }

  /**
   * Sets the status of a task
   * @param id ID of the task
   * @param status New status
   * @returns Promise resolving to the result
   */
  public static async setTaskStatus(id: string, status: string): Promise<any> {
    return this.executeMcpTool('set_task_status', { id, status });
  }

  /**
   * Adds a new task
   * @param prompt Description of the task
   * @param dependencies Optional dependencies
   * @param priority Optional priority
   * @param research Whether to use research for task creation
   * @returns Promise resolving to the result
   */
  public static async addTask(prompt: string, dependencies?: string, priority?: string, research: boolean = false): Promise<any> {
    return this.executeMcpTool('add_task', { prompt, dependencies, priority, research });
  }

  /**
   * Adds a subtask to a parent task
   * @param parent ID of the parent task
   * @param title Title of the subtask
   * @param description Optional description
   * @param details Optional implementation details
   * @param dependencies Optional dependencies
   * @param status Optional status
   * @returns Promise resolving to the result
   */
  public static async addSubtask(parent: string, title: string, description?: string, details?: string, dependencies?: string, status?: string): Promise<any> {
    return this.executeMcpTool('add_subtask', { id: parent, title, description, details, dependencies, status });
  }

  /**
   * Updates a specific task
   * @param id ID of the task
   * @param prompt Update prompt
   * @param research Whether to use research for the update
   * @returns Promise resolving to the result
   */
  public static async updateTask(id: string, prompt: string, research: boolean = false): Promise<any> {
    return this.executeMcpTool('update_task', { id, prompt, research });
  }

  /**
   * Updates a subtask with additional details
   * @param id ID of the subtask
   * @param prompt Update prompt
   * @param research Whether to use research for the update
   * @returns Promise resolving to the result
   */
  public static async updateSubtask(id: string, prompt: string, research: boolean = false): Promise<any> {
    return this.executeMcpTool('update_subtask', { id, prompt, research });
  }

  /**
   * Updates multiple future tasks based on implementation changes
   * @param from Starting task ID
   * @param prompt Update prompt
   * @param research Whether to use research for the update
   * @returns Promise resolving to the result
   */
  public static async updateTasks(from: string, prompt: string, research: boolean = false): Promise<any> {
    return this.executeMcpTool('update', { from, prompt, research });
  }

  /**
   * Expands a task into subtasks
   * @param id ID of the task
   * @param num Optional number of subtasks
   * @param research Whether to use research for expansion
   * @param prompt Optional additional context
   * @param force Whether to clear existing subtasks
   * @returns Promise resolving to the result
   */
  public static async expandTask(id: string, num?: number, research: boolean = false, prompt?: string, force: boolean = false): Promise<any> {
    return this.executeMcpTool('expand_task', { id, num, research, prompt, force });
  }

  /**
   * Expands all eligible tasks
   * @param num Optional number of subtasks per task
   * @param research Whether to use research for expansion
   * @param prompt Optional additional context
   * @param force Whether to clear existing subtasks
   * @returns Promise resolving to the result
   */
  public static async expandAllTasks(num?: number, research: boolean = false, prompt?: string, force: boolean = false): Promise<any> {
    return this.executeMcpTool('expand_all', { num, research, prompt, force });
  }

  /**
   * Clears all subtasks from a task
   * @param id ID of the task
   * @returns Promise resolving to the result
   */
  public static async clearSubtasks(id: string): Promise<any> {
    return this.executeMcpTool('clear_subtasks', { id });
  }

  /**
   * Adds a dependency between tasks
   * @param id ID of the dependent task
   * @param dependsOn ID of the prerequisite task
   * @returns Promise resolving to the result
   */
  public static async addDependency(id: string, dependsOn: string): Promise<any> {
    return this.executeMcpTool('add_dependency', { id, dependsOn });
  }

  /**
   * Removes a dependency between tasks
   * @param id ID of the dependent task
   * @param dependsOn ID of the prerequisite task
   * @returns Promise resolving to the result
   */
  public static async removeDependency(id: string, dependsOn: string): Promise<any> {
    return this.executeMcpTool('remove_dependency', { id, dependsOn });
  }

  /**
   * Validates dependencies for integrity
   * @returns Promise resolving to the validation result
   */
  public static async validateDependencies(): Promise<any> {
    return this.executeMcpTool('validate_dependencies');
  }

  /**
   * Automatically fixes dependency issues
   * @returns Promise resolving to the fix result
   */
  public static async fixDependencies(): Promise<any> {
    return this.executeMcpTool('fix_dependencies');
  }

  /**
   * Analyzes project complexity
   * @param threshold Optional complexity threshold
   * @param research Whether to use research for analysis
   * @returns Promise resolving to the analysis result
   */
  public static async analyzeComplexity(threshold?: number, research: boolean = false): Promise<any> {
    return this.executeMcpTool('analyze_project_complexity', { threshold, research });
  }

  /**
   * Gets the complexity report
   * @returns Promise resolving to the complexity report
   */
  public static async getComplexityReport(): Promise<any> {
    return this.executeMcpTool('complexity_report');
  }

  /**
   * Generates task files based on tasks.json
   * @returns Promise resolving to the generation result
   */
  public static async generateTaskFiles(): Promise<any> {
    return this.executeMcpTool('generate');
  }

  /**
   * Parses a PRD to generate initial tasks
   * @param input Path to the PRD file
   * @param output Optional output path
   * @param numTasks Optional number of tasks to generate
   * @param force Whether to overwrite existing tasks.json
   * @returns Promise resolving to the parse result
   */
  public static async parsePRD(input: string, output?: string, numTasks?: number, force: boolean = false): Promise<any> {
    return this.executeMcpTool('parse_prd', { input, output, numTasks, force });
  }
}