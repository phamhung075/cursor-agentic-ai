#!/usr/bin/env node

/**
 * 🚀 Cursor + AAI Startup Script
 * 
 * Automatically sets up and starts Cursor integration with AAI agent
 * Run this when you first open the project in Cursor
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class CursorAAIStarter {
  constructor() {
    this.projectRoot = process.cwd();
    this.setupComplete = false;
  }

  /**
   * Main startup sequence
   */
  async start() {
    console.log('🚀 Starting Cursor + AAI Integration...\n');

    try {
      // 1. Check if setup is needed
      await this.checkSetup();

      // 2. Setup Cursor integration if needed
      if (!this.setupComplete) {
        await this.setupCursorIntegration();
      }

      // 3. Generate script awareness
      await this.generateScriptAwareness();

      // 4. Show startup options
      this.showStartupOptions();

    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check if setup has been completed
   */
  async checkSetup() {
    const cursorSettings = '.cursor/settings.json';
    const summariesDir = '.cursor/rules/agents/_store/cursor-summaries';

    if (fs.existsSync(cursorSettings) && fs.existsSync(summariesDir)) {
      console.log('✅ Cursor integration already set up');
      this.setupComplete = true;
    } else {
      console.log('🔧 First-time setup needed');
      this.setupComplete = false;
    }
  }

  /**
   * Setup Cursor integration
   */
  async setupCursorIntegration() {
    console.log('🔧 Setting up Cursor integration...');

    return new Promise((resolve, reject) => {
      const setup = spawn('npm', ['run', 'cursor:setup'], {
        stdio: 'inherit'
      });

      setup.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Cursor integration setup complete');
          resolve();
        } else {
          reject(new Error(`Setup failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Generate script awareness
   */
  async generateScriptAwareness() {
    console.log('📋 Generating script awareness for Cursor...');

    return new Promise((resolve, reject) => {
      const awareness = spawn('npm', ['run', 'cursor:script-awareness'], {
        stdio: 'pipe'
      });

      awareness.stdout.on('data', (data) => {
        // Show only important output
        const output = data.toString();
        if (output.includes('Generated:') || output.includes('✅')) {
          process.stdout.write(output);
        }
      });

      awareness.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Script awareness generated');
          resolve();
        } else {
          reject(new Error(`Script awareness failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Show startup options to user
   */
  showStartupOptions() {
    console.log('\n🎉 Cursor + AAI Integration Ready!');
    console.log('━'.repeat(50));
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('');
    console.log('1️⃣ Start AAI Agent:');
    console.log('   npm run AAI:start');
    console.log('');
    console.log('2️⃣ Enable Auto-Sync (recommended):');
    console.log('   npm run cursor:auto-sync');
    console.log('');
    console.log('3️⃣ Test Integration:');
    console.log('   • Press Ctrl/Cmd+P in Cursor');
    console.log('   • Type "script-summary" to see all scripts');
    console.log('   • Type any script name to find it instantly');
    console.log('');
    console.log('📖 HELPFUL COMMANDS:');
    console.log('   npm run AAI:scripts-help     # See all available scripts');
    console.log('   npm run cursor:auto-sync-status  # Check integration status');
    console.log('   npm run AAI:analyze          # Analyze current code');
    console.log('');
    console.log('📂 KEY FILES IN CURSOR:');
    console.log('   • .cursor/rules/agents/_store/cursor-summaries/script-summary.json');
    console.log('   • .cursor/rules/agents/_store/cursor-summaries/script-improvements.json');
    console.log('   • QUICK-START-GUIDE.md');
    console.log('');
    console.log('🎯 Quick Test: Press Ctrl/Cmd+P → type "script" → see all scripts!');
    console.log('');

    // Ask if user wants to start AAI now
    this.promptStartAAI();
  }

  /**
   * Prompt user to start AAI
   */
  promptStartAAI() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('🤖 Start AAI agent now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🚀 Starting AAI agent...');
        
        // Start AAI agent
        const aai = spawn('npm', ['run', 'AAI:start'], {
          stdio: 'inherit'
        });

        aai.on('close', (code) => {
          console.log('\n👋 AAI agent stopped');
        });

      } else {
        console.log('\n👍 You can start AAI later with: npm run AAI:start');
        console.log('📖 See QUICK-START-GUIDE.md for complete instructions');
      }
      
      rl.close();
    });
  }

  /**
   * Show help information
   */
  static showHelp() {
    console.log('🚀 Cursor + AAI Startup Script');
    console.log('');
    console.log('Usage: node start-cursor-aai.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  start    - Setup and start Cursor + AAI integration (default)');
    console.log('  help     - Show this help message');
    console.log('  status   - Check current integration status');
    console.log('');
    console.log('Examples:');
    console.log('  node start-cursor-aai.js        # Full setup and start');
    console.log('  npm run start-cursor-aai        # Same as above');
    console.log('');
  }

  /**
   * Show current status
   */
  static async showStatus() {
    console.log('📊 CURSOR + AAI INTEGRATION STATUS');
    console.log('━'.repeat(50));

    // Check files
    const files = {
      '.cursor/settings.json': 'Cursor settings',
      '.cursor/rules/agents/_store/cursor-summaries/script-summary.json': 'Script summary',
      '.cursor/rules/agents/_store/cursor-summaries/script-improvements.json': 'Improvements',
      'package.json': 'NPM scripts'
    };

    console.log('\n📂 Files:');
    Object.entries(files).forEach(([file, description]) => {
      const exists = fs.existsSync(file);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${description} (${file})`);
    });

    // Check if AAI is running
    console.log('\n🤖 AAI Status:');
    console.log('   Run "npm run AAI:start" to start the agent');
    console.log('   Run "npm run cursor:auto-sync-status" for sync status');

    console.log('\n🎯 Ready to use:');
    console.log('   • Press Ctrl/Cmd+P in Cursor → type script names');
    console.log('   • Open script-summary.json for overview');
    console.log('   • Use npm run AAI:* commands');
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'start';
  
  switch (command.toLowerCase()) {
    case 'start':
      const starter = new CursorAAIStarter();
      starter.start();
      break;
      
    case 'help':
      CursorAAIStarter.showHelp();
      break;
      
    case 'status':
      CursorAAIStarter.showStatus();
      break;
      
    default:
      console.log('❌ Unknown command:', command);
      CursorAAIStarter.showHelp();
  }
}

module.exports = CursorAAIStarter; 