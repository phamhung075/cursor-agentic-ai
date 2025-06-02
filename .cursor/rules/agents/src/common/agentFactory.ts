import { AgentConfig, AgentType } from './types';
import { AgentConfigManager } from './agentConfigManager';
import { createDefaultConfig } from './defaultConfigurations';

/**
 * Abstract base class for all agents
 */
export abstract class Agent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Gets the agent's configuration
   * @returns Agent configuration
   */
  public getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Initializes the agent
   */
  public abstract initialize(): Promise<void>;

  /**
   * Activates the agent to perform its function
   * @param trigger The trigger that activated the agent
   * @param data Optional data associated with the trigger
   */
  public abstract activate(trigger: string, data?: any): Promise<any>;

  /**
   * Deactivates the agent
   */
  public abstract deactivate(): Promise<void>;
}

/**
 * Factory for creating and managing agent instances
 */
export class AgentFactory {
  private static instance: AgentFactory;
  private configManager: AgentConfigManager;
  private agents: Map<string, Agent> = new Map();

  /**
   * Creates a new AgentFactory
   * @param configManager The configuration manager to use
   */
  private constructor(configManager: AgentConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Gets the singleton instance of AgentFactory
   * @returns The AgentFactory instance
   */
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      const configManager = AgentConfigManager.getInstance();
      AgentFactory.instance = new AgentFactory(configManager);
    }
    return AgentFactory.instance;
  }

  /**
   * Gets or creates an agent by its ID
   * @param agentId ID of the agent
   * @returns The agent instance
   */
  public async getAgent(agentId: string): Promise<Agent | null> {
    // Return existing agent if available
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId) as Agent;
    }

    // Try to load configuration
    const config = this.configManager.getConfig(agentId);
    if (!config) {
      console.error(`No configuration found for agent: ${agentId}`);
      return null;
    }

    // Create and initialize the agent
    const agent = await this.createAgent(config);
    if (agent) {
      this.agents.set(agentId, agent);
      await agent.initialize();
    }

    return agent;
  }

  /**
   * Gets or creates an agent by type (using the default ID for that type)
   * @param agentType Type of agent
   * @returns The agent instance
   */
  public async getAgentByType(agentType: AgentType): Promise<Agent | null> {
    // Get all configs of this type
    const configs = this.configManager.getConfigsByType(agentType);

    // If no configs exist, create a default one
    if (configs.length === 0) {
      const defaultConfig = createDefaultConfig(agentType);
      this.configManager.saveConfig(defaultConfig);
      return this.getAgent(defaultConfig.id);
    }

    // Use the first config (could implement more sophisticated selection)
    return this.getAgent(configs[0].id);
  }

  /**
   * Creates a new agent instance from a configuration
   * @param config Configuration for the agent
   * @returns The new agent instance
   */
  private async createAgent(config: AgentConfig): Promise<Agent | null> {
    try {
      // Dynamic import based on agent type
      const agentModule = await this.importAgentModule(config.type);
      if (!agentModule) {
        return null;
      }

      // Create the agent instance
      return new agentModule.default(config);
    } catch (error) {
      console.error(`Error creating agent ${config.id}:`, error);
      return null;
    }
  }

  /**
   * Imports the module for a specific agent type
   * @param agentType Type of agent
   * @returns The imported module
   */
  private async importAgentModule(agentType: AgentType): Promise<any> {
    try {
      switch (agentType) {
        case AgentType.RULE_INTERPRETER:
          return import('../rule-interpreter/ruleAgent');
        case AgentType.CONTEXT_MANAGER:
          return import('../context-manager/contextAgent');
        case AgentType.TASK_MANAGER:
          return import('../task-manager/taskAgent');
        case AgentType.CODE_GENERATOR:
          return import('../code-generator/codeAgent');
        case AgentType.REVIEW:
          return import('../review/reviewAgent');
        default:
          console.error(`Unknown agent type: ${agentType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error importing module for agent type ${agentType}:`, error);
      return null;
    }
  }

  /**
   * Deactivates and removes an agent from the factory
   * @param agentId ID of the agent to remove
   */
  public async removeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    try {
      await agent.deactivate();
      this.agents.delete(agentId);
      return true;
    } catch (error) {
      console.error(`Error removing agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Activates an agent to respond to a trigger
   * @param agentId ID of the agent
   * @param trigger The trigger to respond to
   * @param data Optional data for the trigger
   * @returns Result of the activation
   */
  public async activateAgent(agentId: string, trigger: string, data?: any): Promise<any> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return agent.activate(trigger, data);
  }

  /**
   * Deactivates all agents
   */
  public async deactivateAll(): Promise<void> {
    const deactivationPromises = Array.from(this.agents.values()).map(agent => agent.deactivate());
    await Promise.all(deactivationPromises);
    this.agents.clear();
  }
}
