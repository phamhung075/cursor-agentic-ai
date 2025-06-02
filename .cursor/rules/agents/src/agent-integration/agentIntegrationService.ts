import { AgentFactory, AgentType } from '../common';
import { ContextAutomation } from '../context-manager/contextAutomation';

/**
 * Service that integrates different agent types with rule and context systems
 */
export class AgentIntegrationService {
  private static instance: AgentIntegrationService;
  private agentFactory: AgentFactory;
  private contextAutomation: ContextAutomation;

  /**
   * Creates a new AgentIntegrationService
   */
  private constructor() {
    this.agentFactory = AgentFactory.getInstance();
    this.contextAutomation = ContextAutomation.getInstance();
  }

  /**
   * Gets the singleton instance of AgentIntegrationService
   * @returns The AgentIntegrationService instance
   */
  public static getInstance(): AgentIntegrationService {
    if (!AgentIntegrationService.instance) {
      AgentIntegrationService.instance = new AgentIntegrationService();
    }
    return AgentIntegrationService.instance;
  }

  /**
   * Initializes all required agents
   */
  public async initializeAgents(): Promise<void> {
    console.log('Initializing all agents...');

    // Initialize rule interpreter agent
    const ruleAgent = await this.agentFactory.getAgentByType(AgentType.RULE_INTERPRETER);
    if (ruleAgent) {
      console.log('Rule interpreter agent initialized');
    } else {
      console.error('Failed to initialize rule interpreter agent');
    }

    // Initialize context manager agent
    const contextAgent = await this.agentFactory.getAgentByType(AgentType.CONTEXT_MANAGER);
    if (contextAgent) {
      console.log('Context manager agent initialized');
    } else {
      console.error('Failed to initialize context manager agent');
    }

    // Initialize task manager agent
    const taskAgent = await this.agentFactory.getAgentByType(AgentType.TASK_MANAGER);
    if (taskAgent) {
      console.log('Task manager agent initialized');
    } else {
      console.error('Failed to initialize task manager agent');
    }

    console.log('All agents initialized');
  }

  /**
   * Validates a file against workspace rules and updates context
   * @param filePath Path to the file
   * @param fileContent Content of the file
   * @param taskId Optional task ID for context association
   * @returns Validation result
   */
  public async validateFileWithRules(
    filePath: string,
    fileContent: string,
    taskId?: string
  ): Promise<any> {
    console.log(`Validating file ${filePath} with rules...`);

    // Get rule interpreter agent
    const ruleAgent = await this.agentFactory.getAgentByType(AgentType.RULE_INTERPRETER);
    if (!ruleAgent) {
      throw new Error('Rule interpreter agent not available');
    }

    // Validate the file
    const validationResult = await ruleAgent.activate('validate-file', { filePath, fileContent });

    // Update context if task ID is provided
    if (taskId) {
      const contextFile = await this.contextAutomation.getContext(taskId);

      if (contextFile) {
        // Add file validation as an action
        await this.contextAutomation.addContextAction(
          taskId,
          'file-validation',
          `Validated file ${filePath}`,
          { validationResult }
        );

        // If file was modified, record it
        if (validationResult.modified) {
          await this.contextAutomation.addFileModification(
            taskId,
            filePath,
            'Modified by rule validation'
          );
        }
      }
    }

    return validationResult;
  }

  /**
   * Updates task status and context
   * @param taskId ID of the task
   * @param status New status for the task
   * @returns Result of the operation
   */
  public async updateTaskStatus(taskId: string, status: string): Promise<any> {
    console.log(`Updating task ${taskId} status to ${status}...`);

    // Get task manager agent
    const taskAgent = await this.agentFactory.getAgentByType(AgentType.TASK_MANAGER);
    if (!taskAgent) {
      throw new Error('Task manager agent not available');
    }

    // Update task status
    const result = await taskAgent.activate('update-status', { taskId, status });

    // Update context
    await this.contextAutomation.addContextAction(
      taskId,
      'status-update',
      `Updated task status to ${status}`,
      { previousStatus: result.previousStatus, newStatus: status }
    );

    // If task is completed, finalize the context
    if (status === 'done') {
      await this.contextAutomation.finalizeContext(taskId);
    }

    return result;
  }

  /**
   * Expands a task using TaskMaster and updates context
   * @param taskId ID of the task to expand
   * @param options Optional expansion options
   * @returns Result of the operation
   */
  public async expandTask(taskId: string, options?: any): Promise<any> {
    console.log(`Expanding task ${taskId}...`);

    // Get task manager agent
    const taskAgent = await this.agentFactory.getAgentByType(AgentType.TASK_MANAGER);
    if (!taskAgent) {
      throw new Error('Task manager agent not available');
    }

    // Expand the task
    const result = await taskAgent.activate('expand-task', { taskId, options });

    // Update context
    await this.contextAutomation.addContextAction(
      taskId,
      'task-expansion',
      `Expanded task into ${result.subtasks.length} subtasks`,
      { subtaskCount: result.subtasks.length }
    );

    return result;
  }

  /**
   * Creates a new context file for a task
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns The created context file
   */
  public async createTaskContext(taskId: string, taskTitle: string): Promise<any> {
    console.log(`Creating context for task ${taskId}: ${taskTitle}...`);

    // Initialize context
    const contextFile = await this.contextAutomation.initializeContext(taskId, taskTitle);

    // Add initial action
    await this.contextAutomation.addContextAction(
      taskId,
      'context-creation',
      'Created initial context file',
      {}
    );

    return contextFile;
  }

  /**
   * Shuts down all agents
   */
  public async shutdownAgents(): Promise<void> {
    console.log('Shutting down all agents...');
    await this.agentFactory.deactivateAll();
    console.log('All agents deactivated');
  }
}
