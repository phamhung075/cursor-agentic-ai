#!/usr/bin/env node

/**
 * 🧠 Legacy Self-Improvement Agent - Original implementation
 * 
 * This is the original single-file implementation, kept for compatibility
 * Use the new modular agent at agents/self-improvement/ instead
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Legacy implementation content would be here
// For now, redirect to the new agent

console.log(chalk.yellow('⚠️ Legacy Self-Improvement Agent'));
console.log(chalk.blue('This is the original implementation.'));
console.log(chalk.green('Please use the new modular agent instead:'));
console.log(chalk.cyan('  npm run AAI:agent'));
console.log('');
console.log(chalk.gray('The new agent provides:'));
console.log(chalk.gray('  ✅ File dependency tracking'));
console.log(chalk.gray('  ✅ Memory system with Pinecone'));
console.log(chalk.gray('  ✅ Modular architecture'));
console.log(chalk.gray('  ✅ Enhanced CLI interface'));
console.log(chalk.gray('  ✅ Project management'));
console.log('');

// Try to start the new agent
try {
  const SelfImprovementAgent = require('../../self-improvement/index.js');
  const agent = new SelfImprovementAgent();
  console.log(chalk.green('🚀 Starting new Self-Improvement Agent...'));
  agent.start();
} catch (error) {
  console.error(chalk.red('❌ Could not start new agent:'), error.message);
  console.log(chalk.yellow('💡 Please run: npm run AAI:agent'));
} 