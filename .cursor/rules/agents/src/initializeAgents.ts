import fs from 'fs';
import path from 'path';
import { AgentConfigManager, AgentType, DEFAULT_CONFIGURATIONS } from './common';

/**
 * Initializes the default agent configurations
 */
export async function initializeDefaultAgentConfigurations() {
  console.log('🚀 Initializing default agent configurations...');
  const configManager = AgentConfigManager.getInstance();

  // Create the config directory if it doesn't exist
  const configDir = '.cursor/rules/agents/config';
  if (!fs.existsSync(configDir)) {
    console.log(`Creating config directory: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Save default configurations for each agent type
  for (const agentType of Object.values(AgentType)) {
    const config = DEFAULT_CONFIGURATIONS[agentType];
    console.log(`Creating default configuration for ${agentType} agent`);
    await configManager.saveConfig(config);
  }

  console.log('✅ Default agent configurations initialized');
}

// Run the initialization if this script is called directly
if (require.main === module) {
  initializeDefaultAgentConfigurations().catch(console.error);
}
