#!/usr/bin/env node

/**
 * 🧪 Test New System - Verify file management and memory integration
 */

const SelfImprovementAgent = require('../../self-improvement/index.js');
const chalk = require('chalk');

async function testNewSystem() {
  console.log(chalk.blue('🧪 Testing Self-Improvement Agent v2.0 with Pinecone Memory'));
  console.log('=' .repeat(70));

  try {
    // Initialize agent
    const agent = new SelfImprovementAgent();
    await agent.initialize();
    
    console.log(chalk.green('✅ Agent initialized successfully'));

    // Test 1: File Manager
    console.log(chalk.cyan('\n📁 Testing File Manager...'));
    try {
      agent.setProject('test-project');
      console.log(chalk.green('✅ Project set successfully'));
      
      const projects = await agent.handleFileCommand('projects');
      console.log(chalk.green(`✅ File manager working - ${projects.projects.length} projects found`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️ File manager test: ${error.message}`));
    }

    // Test 2: Memory Manager
    console.log(chalk.cyan('\n🧠 Testing Memory Manager...'));
    try {
      const memoryStats = await agent.handleMemoryCommand('stats');
      if (memoryStats.success) {
        console.log(chalk.green('✅ Memory manager working'));
        console.log(chalk.gray(`  Pinecone: ${memoryStats.stats.pineconeConnected ? 'Connected' : 'Local only'}`));
        console.log(chalk.gray(`  OpenAI: ${memoryStats.stats.openaiConnected ? 'Connected' : 'Local only'}`));
        console.log(chalk.gray(`  Local memories: ${memoryStats.stats.localMemories}`));
      } else {
        console.log(chalk.yellow(`⚠️ Memory manager: ${memoryStats.message}`));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Memory manager test: ${error.message}`));
    }

    // Test 3: Agent Status
    console.log(chalk.cyan('\n📊 Testing Agent Status...'));
    try {
      const status = await agent.getStatus();
      console.log(chalk.green('✅ Status retrieval working'));
      console.log(chalk.gray(`  Agent: ${status.agent.name} v${status.agent.version}`));
      console.log(chalk.gray(`  Current project: ${status.currentProject || 'None'}`));
      console.log(chalk.gray(`  Memory enabled: ${status.agent.memoryEnabled}`));
      console.log(chalk.gray(`  File store enabled: ${status.agent.fileStoreEnabled}`));
    } catch (error) {
      console.log(chalk.red(`❌ Status test failed: ${error.message}`));
    }

    // Test 4: Directory Structure
    console.log(chalk.cyan('\n📂 Testing Directory Structure...'));
    const fs = require('fs').promises;
    const path = require('path');
    
    const expectedDirs = [
      '.cursor/rules/agents/_store',
      '.cursor/rules/agents/_store/projects',
      '.cursor/rules/agents/_store/memory',
      '.cursor/rules/agents/_store/memory/embeddings',
      '.cursor/rules/agents/_store/memory/contexts',
      '.cursor/rules/agents/_store/memory/learning',
      '.cursor/rules/agents/_store/templates',
      '.cursor/rules/agents/_store/logs'
    ];

    for (const dir of expectedDirs) {
      try {
        await fs.access(dir);
        console.log(chalk.green(`✅ ${dir}`));
      } catch {
        console.log(chalk.red(`❌ Missing: ${dir}`));
      }
    }

    // Test 5: Configuration
    console.log(chalk.cyan('\n⚙️ Testing Configuration...'));
    const config = require('../../self-improvement/config/default.json');
    console.log(chalk.green('✅ Configuration loaded'));
    console.log(chalk.gray(`  Memory enabled: ${config.agent.memoryEnabled}`));
    console.log(chalk.gray(`  File store enabled: ${config.agent.fileStoreEnabled}`));
    console.log(chalk.gray(`  Security patterns: ${config.patterns.security.length}`));
    console.log(chalk.gray(`  CLI commands: ${Object.keys(config.cli.commands).length}`));

    console.log(chalk.green('\n🎉 All tests completed!'));
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('  1. Set environment variables (PINECONE_API_KEY, OPENAI_API_KEY)'));
    console.log(chalk.gray('  2. Start agent: npm run AAI:agent'));
    console.log(chalk.gray('  3. Test commands: status, memory stats, projects list'));
    console.log(chalk.gray('  4. Migrate existing files: migrate <project-name>'));

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    console.error(error.stack);
  }
}

// Run tests
testNewSystem().catch(console.error); 