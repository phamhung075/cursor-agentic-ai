#!/usr/bin/env node

/**
 * 🗣️ Cursor Chat Monitor
 * 
 * Monitors Cursor chat messages and automatically creates tasks
 * when users send requests, updating .cursor/tasks.json in real-time
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const CursorChatProcessor = require('./cursor-chat-processor');

class CursorChatMonitor {
  constructor() {
    this.processor = new CursorChatProcessor();
    this.chatLogPath = '.cursor/chat-logs';
    this.userInputPath = path.join(this.chatLogPath, 'user-input.txt');
    this.lastProcessedTime = 0;
    this.isActive = false;
  }

  /**
   * Initialize the chat monitor
   */
  async initialize() {
    console.log('🗣️ Cursor Chat Monitor - Auto Task Creation');
    console.log('━'.repeat(60));
    console.log('🎯 Automatically creates tasks when you chat with Cursor');
    console.log('');

    // Initialize the chat processor
    await this.processor.initialize();

    // Setup monitoring
    await this.setupChatMonitoring();
    
    this.isActive = true;
    console.log('✅ Chat monitor active - ready for your requests!');
    console.log('💬 Just type your requests in Cursor chat');
    console.log('📋 Tasks will be created automatically in .cursor/tasks.json');
    console.log('');
  }

  /**
   * Setup chat monitoring
   */
  async setupChatMonitoring() {
    // Ensure chat logs directory exists
    if (!fs.existsSync(this.chatLogPath)) {
      fs.mkdirSync(this.chatLogPath, { recursive: true });
    }

    // Create user input file for easy testing
    if (!fs.existsSync(this.userInputPath)) {
      fs.writeFileSync(this.userInputPath, 
        '# Cursor Chat Monitor - User Input\n' +
        '# Add your requests here and they will be processed automatically\n' +
        '# Format: Just type your request on a new line\n' +
        '# Example: Create a login component with validation\n\n'
      );
    }

    // Setup file watchers
    this.setupFileWatchers();
    this.setupAPIEndpoint();
    this.setupDirectIntegration();
    
    console.log('👁️ Chat monitoring setup complete');
  }

  /**
   * Setup file watchers for different input methods
   */
  setupFileWatchers() {
    // Watch user input file
    const userInputWatcher = chokidar.watch(this.userInputPath, {
      persistent: true,
      ignoreInitial: true
    });

    userInputWatcher.on('change', async () => {
      await this.processUserInputFile();
    });

    // Watch for API commands
    const apiPath = path.join(this.chatLogPath, 'api-command.json');
    const apiWatcher = chokidar.watch(apiPath, {
      persistent: true,
      ignoreInitial: true
    });

    apiWatcher.on('change', async () => {
      await this.processAPICommand();
    });

    console.log('📁 File watchers active');
  }

  /**
   * Setup API endpoint for external integration
   */
  setupAPIEndpoint() {
    const apiPath = path.join(this.chatLogPath, 'api-command.json');
    
    // Create API template
    if (!fs.existsSync(apiPath)) {
      const apiTemplate = {
        command: "",
        timestamp: 0,
        processed: true,
        instructions: "Update this file with your command and set processed: false"
      };
      fs.writeFileSync(apiPath, JSON.stringify(apiTemplate, null, 2));
    }

    console.log('🔗 API endpoint ready');
  }

  /**
   * Setup direct integration with Cursor
   */
  setupDirectIntegration() {
    // Create a simple command interface
    const commandPath = path.join(this.chatLogPath, 'quick-command.txt');
    
    if (!fs.existsSync(commandPath)) {
      fs.writeFileSync(commandPath, 
        '# Quick Command Interface\n' +
        '# Type your command below and save the file\n' +
        '# Tasks will be created automatically\n\n' +
        'COMMAND: \n'
      );
    }

    // Watch quick command file
    const quickWatcher = chokidar.watch(commandPath, {
      persistent: true,
      ignoreInitial: true
    });

    quickWatcher.on('change', async () => {
      await this.processQuickCommand();
    });

    console.log('⚡ Quick command interface ready');
  }

  /**
   * Process user input file
   */
  async processUserInputFile() {
    try {
      const content = fs.readFileSync(this.userInputPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.trim() && 
            !line.startsWith('#') && 
            !line.startsWith('//') &&
            line.length > 10) {
          
          const timestamp = Date.now();
          if (timestamp > this.lastProcessedTime + 1000) { // Prevent duplicate processing
            this.lastProcessedTime = timestamp;
            
            console.log(`\n🗣️ Processing: "${line.trim()}"`);
            await this.processor.processCommand(line.trim());
            
            // Clear the processed command
            this.clearProcessedCommand(this.userInputPath, line);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error processing user input:', error.message);
    }
  }

  /**
   * Process API command
   */
  async processAPICommand() {
    try {
      const apiPath = path.join(this.chatLogPath, 'api-command.json');
      const data = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
      
      if (!data.processed && data.command && data.timestamp > this.lastProcessedTime) {
        this.lastProcessedTime = data.timestamp;
        
        console.log(`\n🔗 API Processing: "${data.command}"`);
        await this.processor.processCommand(data.command);
        
        // Mark as processed
        data.processed = true;
        fs.writeFileSync(apiPath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.warn('⚠️ Error processing API command:', error.message);
    }
  }

  /**
   * Process quick command
   */
  async processQuickCommand() {
    try {
      const commandPath = path.join(this.chatLogPath, 'quick-command.txt');
      const content = fs.readFileSync(commandPath, 'utf8');
      
      const commandMatch = content.match(/COMMAND:\s*(.+)/);
      if (commandMatch && commandMatch[1].trim()) {
        const command = commandMatch[1].trim();
        
        console.log(`\n⚡ Quick Processing: "${command}"`);
        await this.processor.processCommand(command);
        
        // Clear the command
        const clearedContent = content.replace(/COMMAND:\s*.+/, 'COMMAND: ');
        fs.writeFileSync(commandPath, clearedContent);
      }
    } catch (error) {
      console.warn('⚠️ Error processing quick command:', error.message);
    }
  }

  /**
   * Clear processed command from file
   */
  clearProcessedCommand(filePath, processedLine) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => line.trim() !== processedLine.trim());
      
      // Add a processed marker
      filteredLines.push(`# Processed: ${processedLine.trim()} at ${new Date().toLocaleTimeString()}`);
      
      fs.writeFileSync(filePath, filteredLines.join('\n'));
    } catch (error) {
      console.warn('⚠️ Error clearing processed command:', error.message);
    }
  }

  /**
   * Add command via API
   */
  static addCommand(command, context = {}) {
    const chatLogPath = '.cursor/chat-logs';
    const apiPath = path.join(chatLogPath, 'api-command.json');
    
    // Ensure directory exists
    if (!fs.existsSync(chatLogPath)) {
      fs.mkdirSync(chatLogPath, { recursive: true });
    }

    const commandData = {
      command: command,
      context: context,
      timestamp: Date.now(),
      processed: false
    };

    fs.writeFileSync(apiPath, JSON.stringify(commandData, null, 2));
    console.log(`✅ Command queued: "${command}"`);
  }

  /**
   * Show status
   */
  showStatus() {
    console.log('📊 CURSOR CHAT MONITOR STATUS');
    console.log('━'.repeat(40));
    console.log(`🔄 Active: ${this.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`📁 Chat Logs: ${fs.existsSync(this.chatLogPath) ? '✅ Ready' : '❌ Missing'}`);
    console.log(`📝 User Input: ${fs.existsSync(this.userInputPath) ? '✅ Ready' : '❌ Missing'}`);
    
    // Show recent tasks
    if (fs.existsSync('.cursor/tasks.json')) {
      const tasks = JSON.parse(fs.readFileSync('.cursor/tasks.json', 'utf8'));
      console.log(`📋 Tasks: ${tasks.tasks.length} total`);
    }
    
    console.log('\n🎯 HOW TO USE:');
    console.log('1. Type requests in .cursor/chat-logs/user-input.txt');
    console.log('2. Use API: CursorChatMonitor.addCommand("your request")');
    console.log('3. Quick commands in .cursor/chat-logs/quick-command.txt');
    console.log('4. Tasks auto-created in .cursor/tasks.json');
  }

  /**
   * Start monitoring
   */
  async start() {
    await this.initialize();
    
    // Keep process alive
    console.log('🔄 Monitoring active - press Ctrl+C to stop');
    setInterval(() => {
      // Just keep alive
    }, 10000);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const monitor = new CursorChatMonitor();

  switch (command) {
    case 'start':
      monitor.start();
      break;

    case 'status':
      monitor.showStatus();
      break;

    case 'add':
      const userCommand = args.slice(1).join(' ');
      if (userCommand) {
        CursorChatMonitor.addCommand(userCommand);
      } else {
        console.log('❌ Please provide a command to add');
      }
      break;

    case 'init':
      monitor.initialize();
      break;

    default:
      console.log('🗣️ Cursor Chat Monitor');
      console.log('Commands:');
      console.log('  start    - Start monitoring for chat commands');
      console.log('  status   - Show current status');
      console.log('  add      - Add a command to process');
      console.log('  init     - Initialize monitoring setup');
      console.log('');
      console.log('Example: node cursor-chat-monitor.js add "Create a user profile component"');
  }
}

module.exports = CursorChatMonitor; 