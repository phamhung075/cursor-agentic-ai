#!/usr/bin/env node

/**
 * 🔄 Memory Sync Script
 * 
 * Standalone script to sync memories between local storage and Pinecone
 */

// Load environment variables
require('dotenv').config();

const path = require('path');
const chalk = require('chalk');

// Import the self-improvement agent
const SelfImprovementAgent = require('../../self-improvement/index');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log(chalk.blue('🔄 Memory Sync Tool'));
  console.log('');

  // Check if API keys are configured
  if (!process.env.PINECONE_API_KEY) {
    console.log(chalk.red('❌ PINECONE_API_KEY not found in environment'));
    console.log(chalk.gray('💡 Please set up your .env file with Pinecone API key'));
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log(chalk.yellow('⚠️ OPENAI_API_KEY not found - using fallback embeddings'));
  }

  try {
    // Initialize agent
    const agent = new SelfImprovementAgent();
    await agent.initialize();

    switch (command) {
      case 'status':
        await showStatus(agent);
        break;
        
      case 'up':
      case 'upload':
        await syncUp(agent);
        break;
        
      case 'down':
      case 'download':
        await syncDown(agent);
        break;
        
      case 'both':
      case 'sync':
        await syncBoth(agent);
        break;
        
      case 'reset':
        await resetPinecone(agent);
        break;
        
      case 'fix-embeddings':
        console.log('🔧 Fixing embedding dimensions...');
        await agent.handleMemoryCommand('fix-embeddings');
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }

    await agent.shutdown();
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

async function showStatus(agent) {
  console.log(chalk.green('📊 Checking sync status...'));
  const result = await agent.handleMemoryCommand('sync-status');
  
  if (result.success) {
    const status = result.syncStatus;
    console.log(chalk.blue(`  📡 Pinecone: ${status.pineconeConnected ? '✅ Connected' : '❌ Disconnected'}`));
    console.log(chalk.blue(`  🤖 OpenAI: ${status.openaiConnected ? '✅ Connected' : '❌ Disconnected'}`));
    console.log(chalk.blue(`  💾 Local Memories: ${status.localMemories}`));
    console.log(chalk.blue(`  ☁️ Pinecone Memories: ${status.pineconeMemories}`));
    
    if (status.localMemories !== status.pineconeMemories) {
      console.log(chalk.yellow('⚠️ Memories are out of sync'));
      console.log(chalk.gray('💡 Run "npm run sync-memory both" to synchronize'));
    } else {
      console.log(chalk.green('✅ Memories are in sync'));
    }
  } else {
    console.log(chalk.red(`❌ ${result.message}`));
  }
}

async function syncUp(agent) {
  console.log(chalk.green('📤 Uploading local memories to Pinecone...'));
  const result = await agent.handleMemoryCommand('sync-up');
  
  if (result.success) {
    console.log(chalk.green(`✅ Upload complete: ${result.uploaded} uploaded, ${result.skipped} skipped`));
    if (result.errors > 0) {
      console.log(chalk.yellow(`⚠️ ${result.errors} errors occurred`));
    }
  } else {
    console.log(chalk.red(`❌ ${result.message}`));
  }
}

async function syncDown(agent) {
  console.log(chalk.green('📥 Downloading Pinecone memories to local...'));
  const result = await agent.handleMemoryCommand('sync-down');
  
  if (result.success) {
    console.log(chalk.green(`✅ Download complete: ${result.downloaded} downloaded, ${result.skipped} skipped`));
    if (result.errors > 0) {
      console.log(chalk.yellow(`⚠️ ${result.errors} errors occurred`));
    }
  } else {
    console.log(chalk.red(`❌ ${result.message}`));
  }
}

async function syncBoth(agent) {
  console.log(chalk.green('🔄 Performing bidirectional sync...'));
  const result = await agent.handleMemoryCommand('sync-both');
  
  if (result.success) {
    console.log(chalk.green('✅ Bidirectional sync complete!'));
    console.log(chalk.blue(`📤 Upload: ${result.upload.uploaded} uploaded, ${result.upload.skipped} skipped`));
    console.log(chalk.blue(`📥 Download: ${result.download.downloaded} downloaded, ${result.download.skipped} skipped`));
  } else {
    console.log(chalk.red(`❌ ${result.message}`));
  }
}

async function resetPinecone(agent) {
  console.log(chalk.red('⚠️ WARNING: This will delete ALL memories from Pinecone!'));
  console.log(chalk.gray('Press Ctrl+C to cancel, or wait 5 seconds to continue...'));
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await agent.handleMemoryCommand('reset-pinecone');
  
  if (result.success) {
    console.log(chalk.green('✅ Pinecone index reset successfully'));
    console.log(chalk.yellow('⚠️ All cloud memories have been deleted'));
  } else {
    console.log(chalk.red(`❌ ${result.message}`));
  }
}

function showHelp() {
  console.log(chalk.yellow('🔄 Memory Sync Tool - Usage:'));
  console.log('');
  console.log(chalk.blue('Commands:'));
  console.log(chalk.gray('  status          - Show sync status'));
  console.log(chalk.gray('  up/upload       - Upload local → Pinecone'));
  console.log(chalk.gray('  down/download   - Download Pinecone → local'));
  console.log(chalk.gray('  both/sync       - Bidirectional sync (recommended)'));
  console.log(chalk.gray('  reset           - Reset Pinecone index (DANGER)'));
  console.log(chalk.gray('  fix-embeddings   - Fix embedding dimensions'));
  console.log(chalk.gray('  help            - Show this help'));
  console.log('');
  console.log(chalk.green('Examples:'));
  console.log(chalk.gray('  node agents/_store/scripts/sync-memory.js status'));
  console.log(chalk.gray('  node agents/_store/scripts/sync-memory.js both'));
  console.log(chalk.gray('  npm run sync-memory both'));
  console.log('');
  console.log(chalk.yellow('Environment:'));
  console.log(chalk.gray('  PINECONE_API_KEY - Required for Pinecone access'));
  console.log(chalk.gray('  OPENAI_API_KEY   - Optional for better embeddings'));
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = { main }; 