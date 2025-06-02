import fs from 'fs';
import path from 'path';
import { AgentConfig, AgentType, PermissionLevel, AgentTrigger } from './types';

/**
 * Manages agent configurations in the Cursor AI Automation Framework
 */
export class AgentConfigManager {
  private configDir: string;
  private configs: Map<string, AgentConfig> = new Map();
  private static instance: AgentConfigManager;

  /**
   * Creates a new AgentConfigManager instance
   * @param configDir Directory to store configuration files
   */
  private constructor(configDir: string = '.cursor/rules/agents/config') {
    this.configDir = configDir;
    this.ensureConfigDirectory();
  }

  /**
   * Gets the singleton instance of AgentConfigManager
   * @param configDir Optional directory to store configuration files
   * @returns The AgentConfigManager instance
   */
  public static getInstance(configDir?: string): AgentConfigManager {
    if (!AgentConfigManager.instance) {
      AgentConfigManager.instance = new AgentConfigManager(configDir);
    }
    return AgentConfigManager.instance;
  }

  /**
   * Ensures the configuration directory exists
   */
  private ensureConfigDirectory(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Loads all agent configurations
   * @returns Map of agent IDs to configurations
   */
  public loadAllConfigs(): Map<string, AgentConfig> {
    try {
      const files = fs.readdirSync(this.configDir)
        .filter(file => file.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(this.configDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content) as AgentConfig;
        this.configs.set(config.id, config);
      }

      return this.configs;
    } catch (error) {
      console.error('Error loading agent configurations:', error);
      return this.configs;
    }
  }

  /**
   * Gets a specific agent configuration by ID
   * @param agentId ID of the agent
   * @returns Agent configuration or undefined if not found
   */
  public getConfig(agentId: string): AgentConfig | undefined {
    if (this.configs.size === 0) {
      this.loadAllConfigs();
    }
    return this.configs.get(agentId);
  }

  /**
   * Gets all configurations for a specific agent type
   * @param agentType Type of agent
   * @returns Array of agent configurations
   */
  public getConfigsByType(agentType: AgentType): AgentConfig[] {
    if (this.configs.size === 0) {
      this.loadAllConfigs();
    }
    return Array.from(this.configs.values())
      .filter(config => config.type === agentType);
  }

  /**
   * Saves an agent configuration
   * @param config Agent configuration to save
   */
  public saveConfig(config: AgentConfig): void {
    try {
      const filePath = path.join(this.configDir, `${config.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
      this.configs.set(config.id, config);
    } catch (error) {
      console.error(`Error saving configuration for agent ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an agent configuration
   * @param agentId ID of the agent
   * @returns True if deletion was successful
   */
  public deleteConfig(agentId: string): boolean {
    try {
      const filePath = path.join(this.configDir, `${agentId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.configs.delete(agentId);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting configuration for agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Creates a new agent configuration
   * @param id Agent ID
   * @param type Agent type
   * @param permissionLevel Permission level
   * @param capabilities Agent capabilities
   * @param triggers Activation triggers
   * @returns The created agent configuration
   */
  public createConfig(
    id: string,
    type: AgentType,
    permissionLevel: PermissionLevel,
    capabilities: string[] = [],
    triggers: AgentTrigger[] = []
  ): AgentConfig {
    const config: AgentConfig = {
      id,
      type,
      permissionLevel,
      capabilities,
      triggers
    };

    this.saveConfig(config);
    return config;
  }

  /**
   * Updates an existing agent configuration
   * @param id Agent ID
   * @param updates Partial updates to apply
   * @returns Updated agent configuration or undefined if not found
   */
  public updateConfig(
    id: string,
    updates: Partial<Omit<AgentConfig, 'id'>>
  ): AgentConfig | undefined {
    const config = this.getConfig(id);
    if (!config) {
      return undefined;
    }

    const updatedConfig: AgentConfig = {
      ...config,
      ...updates
    };

    this.saveConfig(updatedConfig);
    return updatedConfig;
  }

  /**
   * Validates an agent configuration
   * @param config Configuration to validate
   * @returns Validation result and errors
   */
  public validateConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.id) {
      errors.push('Agent ID is required');
    }

    if (!Object.values(AgentType).includes(config.type)) {
      errors.push(`Invalid agent type: ${config.type}`);
    }

    if (!Object.values(PermissionLevel).includes(config.permissionLevel)) {
      errors.push(`Invalid permission level: ${config.permissionLevel}`);
    }

    // Validate trigger formats
    if (config.triggers) {
      config.triggers.forEach((trigger, index) => {
        if (!['file-pattern', 'command', 'event', 'schedule'].includes(trigger.type)) {
          errors.push(`Invalid trigger type at index ${index}: ${trigger.type}`);
        }

        if (!trigger.pattern) {
          errors.push(`Missing trigger pattern at index ${index}`);
        }

        if (trigger.priority < 1 || trigger.priority > 10) {
          errors.push(`Invalid priority at index ${index}: ${trigger.priority} (must be 1-10)`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
