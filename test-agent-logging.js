#!/usr/bin/env node

/**
 * 🧪 Test Script for AI Agent Logging
 * 
 * Demonstrates the comprehensive logging capabilities of the AI agent
 */

const SelfImprovementAgent = require('./.cursor/rules/agents/self-improvement/index.js');

async function testAgentLogging() {
  console.log('🧪 Testing AI Agent Logging System');
  console.log('━'.repeat(50));
  
  const agent = new SelfImprovementAgent();
  
  try {
    // Start agent in test mode
    console.log('🚀 Starting agent...');
    await agent.start({ testMode: false, interactive: false });
    
    // Test various operations to generate logs
    console.log('\n📊 Testing file analysis...');
    await agent.analyzeSpecificFile('nonexistent.mdc');
    
    console.log('\n🧠 Testing memory commands...');
    await agent.handleAgentMemoryCommand('stats');
    await agent.handleProjectMemoryCommand('list-projects');
    
    console.log('\n📁 Testing git commands...');
    await agent.handleGitProjectCommand('list');
    await agent.handleGitProjectCommand('stats');
    
    console.log('\n📋 Testing logs commands...');
    await agent.handleLogsCommand('status');
    await agent.handleLogsCommand('level');
    
    // Show final metrics
    console.log('\n📈 Final Metrics:');
    const metrics = agent.logger.getMetrics();
    console.log(`   Operations: ${metrics.operations}`);
    console.log(`   Analyses: ${metrics.analysisCount}`);
    console.log(`   Memory Ops: ${metrics.memoryOperations}`);
    console.log(`   Git Ops: ${metrics.gitOperations}`);
    console.log(`   Errors: ${metrics.errors}`);
    console.log(`   Warnings: ${metrics.warnings}`);
    console.log(`   Uptime: ${metrics.uptimeFormatted}`);
    
    // Generate session summary
    console.log('\n📊 Generating session summary...');
    await agent.handleLogsCommand('summary');
    
    // Shutdown gracefully
    console.log('\n🛑 Shutting down agent...');
    await agent.shutdown();
    
    console.log('\n✅ Logging test completed successfully!');
    console.log(`📁 Check logs in: .cursor/rules/agents/_store/logs/`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (agent.logger) {
      agent.logger.error('Test script failed', { error: error.message });
    }
  }
}

// Run the test
if (require.main === module) {
  testAgentLogging().catch(console.error);
}

module.exports = testAgentLogging; 