#!/usr/bin/env node

/**
 * 🎯 Demo Agent - Quick demonstration of Agent AI capabilities
 * 
 * Shows basic file analysis and improvement suggestions
 */

const SelfImprovementAgent = require('../../self-improvement/index.js');
const chalk = require('chalk');

async function runDemo() {
  console.log(chalk.blue('🎯 Agent AI Demo - File Analysis Capabilities'));
  console.log('=' .repeat(60));
  
  const agent = new SelfImprovementAgent();
  
  try {
    // Initialize the agent
    await agent.initialize();
    console.log(chalk.green('✅ Agent initialized successfully\n'));
    
    // Demo 1: Agent Status
    console.log(chalk.cyan('📊 Demo 1: Agent Status'));
    const status = await agent.getStatus();
    console.log(chalk.blue(`🤖 Agent: ${status.agent.name} v${status.agent.version}`));
    console.log(chalk.gray(`Memory enabled: ${status.agent.memoryEnabled}`));
    console.log(chalk.gray(`File store enabled: ${status.agent.fileStoreEnabled}\n`));
    
    // Demo 2: Memory Statistics (if enabled)
    if (status.memory) {
      console.log(chalk.cyan('🧠 Demo 2: Memory System'));
      console.log(chalk.blue('Memory Statistics:'));
      console.log(chalk.gray(`  Local memories: ${status.memory.localMemories}`));
      console.log(chalk.gray(`  Cache size: ${status.memory.cacheSize}`));
      console.log(chalk.gray(`  Pinecone connected: ${status.memory.pineconeConnected}\n`));
    }
    
    console.log(chalk.green('🎉 Demo completed successfully!'));
    console.log(chalk.yellow('💡 Run "npm run AAI:agent" to start the interactive agent'));
    
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
  } finally {
    if (agent.shutdown) {
      await agent.shutdown();
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = runDemo; 