#!/usr/bin/env node

/**
 * 🗣️ Cursor Chat Command Processor
 * 
 * Monitors user chat commands, analyzes them, and automatically:
 * - Creates AAI tasks from user requests
 * - Converts them to Cursor-compatible VS Code tasks
 * - Updates .cursor/tasks.json
 * - Makes Cursor follow tasks to complete user demands
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const AAITaskManager = require('./aai-task-manager');
const CursorAAIIntegration = require('./cursor-aai-integration');
const EnhancedTaskConverter = require('./enhanced-task-converter');
const EnhancedDependencyAnalyzer = require('./enhanced-dependency-analyzer');

class CursorChatProcessor {
  constructor() {
    this.taskManager = new AAITaskManager();
    this.aaiIntegration = new CursorAAIIntegration();
    this.taskConverter = new EnhancedTaskConverter();
    this.dependencyAnalyzer = new EnhancedDependencyAnalyzer();
    this.chatLogPath = '.cursor/chat-logs';
    this.tasksPath = '.cursor/tasks.json';
    this.version = '1.0.0';
    this.isActive = false;
    this.lastProcessedCommand = null;
    this.currentSession = null;
    
    // Enhanced dependency analysis triggers
    this.dependencyTriggers = [
      /^(delete|remove|rm)\s+(.+)$/i,
      /^(edit|modify|refactor)\s+(.+)$/i,
      /^(move|rename|relocate)\s+(.+)$/i,
      /^.*delete.*\.(js|ts|json|md|mdc)$/i,
      /^.*remove.*agents\/_store\/scripts\/.*$/i
    ];
    
    this.systemFiles = [
      /^agents\/_store\/scripts\//,
      /^agents\/_store\/projects\//,
      /^package\.json$/,
      /^\.cursor\//,
      /^agents\/_store\/intelligence\//
    ];
  }

  /**
   * Initialize the chat processor
   */
  async initialize() {
    console.log('🗣️ Cursor Chat Processor v' + this.version);
    console.log('━'.repeat(50));

    await this.taskManager.initialize();
    await this.aaiIntegration.initialize();
    await this.setupChatMonitoring();
    
    this.isActive = true;
    console.log('✅ Chat command processing active');
    console.log('🎯 Ready to process user chat commands!');
  }

  /**
   * Setup chat monitoring
   */
  async setupChatMonitoring() {
    // Ensure chat logs directory exists
    if (!fs.existsSync(this.chatLogPath)) {
      fs.mkdirSync(this.chatLogPath, { recursive: true });
    }

    // Create a simple command input file for testing
    const commandInputPath = path.join(this.chatLogPath, 'user-commands.txt');
    if (!fs.existsSync(commandInputPath)) {
      fs.writeFileSync(commandInputPath, '# User commands will be processed here\n# Format: COMMAND: your request here\n');
    }

    // Monitor for chat commands (simplified approach)
    this.startCommandMonitoring();
    
    console.log('👁️ Chat monitoring setup complete');
  }

  /**
   * Start monitoring for user commands
   */
  startCommandMonitoring() {
    const commandInputPath = path.join(this.chatLogPath, 'user-commands.txt');
    
    // Watch for changes to the command input file
    const watcher = chokidar.watch(commandInputPath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      await this.processNewCommands();
    });

    // Also provide a direct API for command processing
    this.setupCommandAPI();
    
    console.log('👁️ Command monitoring active');
  }

  /**
   * Setup command API for direct processing
   */
  setupCommandAPI() {
    // Create a simple API file for direct command input
    const apiPath = path.join(this.chatLogPath, 'process-command.json');
    
    const watcher = chokidar.watch(apiPath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      try {
        const commandData = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
        if (commandData.command && commandData.timestamp !== this.lastProcessedCommand) {
          this.lastProcessedCommand = commandData.timestamp;
          await this.processUserCommand(commandData.command, commandData.context || {});
        }
      } catch (error) {
        console.warn('⚠️ Error processing command API:', error.message);
      }
    });
  }

  /**
   * Process new commands from the input file
   */
  async processNewCommands() {
    try {
      const commandInputPath = path.join(this.chatLogPath, 'user-commands.txt');
      const content = fs.readFileSync(commandInputPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('COMMAND:')) {
          const command = line.replace('COMMAND:', '').trim();
          if (command && command !== this.lastProcessedCommand) {
            this.lastProcessedCommand = command;
            await this.processUserCommand(command);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error processing new commands:', error.message);
    }
  }

  /**
   * Process a user command
   */
  async processUserCommand(userCommand, context = {}) {
    console.log('\n🗣️ Processing user chat command...');
    console.log(`Command: "${userCommand}"`);

    try {
      // Check if command triggers enhanced dependency analysis
      if (this.isDependencyAnalysisTrigger(userCommand)) {
        console.log('🔍 Dependency analysis trigger detected');
        return await this.processWithDependencyAnalysis(userCommand, context);
      }

      // Step 1: Analyze command and create AAI tasks
      console.log('🔍 Analyzing command and creating tasks...');
      const taskAnalysis = await this.taskManager.analyzeAndCreateTasks(userCommand, context);
      
      // Step 2: Convert AAI tasks to Cursor tasks
      console.log('🔄 Converting to Cursor tasks...');
      const cursorTasks = await this.convertToVSCodeTasks(taskAnalysis.tasks, userCommand);
      
      // Step 3: Update .cursor/tasks.json
      console.log('📝 Updating .cursor/tasks.json...');
      await this.updateCursorTasks(cursorTasks, userCommand);
      
      // Step 4: Create execution plan
      console.log('📋 Creating execution plan...');
      const executionPlan = await this.createExecutionPlan(taskAnalysis, cursorTasks);
      
      // Step 5: Save session for tracking
      this.currentSession = {
        id: taskAnalysis.sessionId,
        userCommand: userCommand,
        aaiTasks: taskAnalysis.tasks,
        cursorTasks: cursorTasks,
        executionPlan: executionPlan,
        status: 'ready',
        created: new Date().toISOString()
      };
      
      await this.saveSession(this.currentSession);
      
      console.log('✅ Command processed successfully!');
      console.log(`📋 Created ${cursorTasks.length} Cursor tasks`);
      console.log('🎯 Cursor can now execute these tasks step by step');
      
      return this.currentSession;

    } catch (error) {
      console.error('❌ Error processing command:', error.message);
      return null;
    }
  }

  /**
   * Check if command triggers dependency analysis
   */
  isDependencyAnalysisTrigger(command) {
    return this.dependencyTriggers.some(trigger => trigger.test(command));
  }

  /**
   * Extract operation and target file from command
   */
  parseCommand(command) {
    for (const trigger of this.dependencyTriggers) {
      const match = command.match(trigger);
      if (match) {
        const operation = match[1] ? match[1].toLowerCase() : 'delete';
        const targetFile = match[2] || match[0];
        return { operation, targetFile: targetFile.trim() };
      }
    }
    return { operation: 'unknown', targetFile: command };
  }

  /**
   * Process command with enhanced dependency analysis
   */
  async processWithDependencyAnalysis(userCommand, context = {}) {
    console.log('🔍 Running enhanced dependency analysis...');
    
    try {
      // Extract operation details
      const { operation, targetFile } = this.parseCommand(userCommand);
      console.log(`Operation: ${operation}, Target: ${targetFile}`);
      
      // Run enhanced dependency analysis
      const analysisResults = await this.dependencyAnalyzer.analyzeOperation(targetFile, operation);
      
      // The analyzer automatically creates Cursor tasks, so we just need to track the session
      this.currentSession = {
        id: `session-${Date.now()}-enhanced-deps`,
        userCommand: userCommand,
        analysisType: 'enhanced-dependency',
        operation: operation,
        targetFile: targetFile,
        analysisResults: analysisResults,
        status: 'ready',
        created: new Date().toISOString()
      };
      
      await this.saveSession(this.currentSession);
      
      console.log('✅ Enhanced dependency analysis complete!');
      console.log(`📋 Created ${analysisResults.requiredTasks.length} dependency analysis tasks`);
      console.log('🎯 Tasks available in Cursor Command Palette');
      
      return {
        type: 'enhanced-dependency-analysis',
        operation,
        targetFile,
        tasksCreated: true,
        taskCount: analysisResults.requiredTasks.length,
        message: `Enhanced dependency analysis complete. ${analysisResults.requiredTasks.length} tasks created.`,
        session: this.currentSession
      };
      
    } catch (error) {
      console.error('❌ Enhanced dependency analysis failed:', error.message);
      
      // Fallback to normal processing
      console.log('🔄 Falling back to normal task processing...');
      return await this.processUserCommand(userCommand, context);
    }
  }

  /**
   * Convert AAI tasks to VS Code task format
   */
  async convertToVSCodeTasks(aaiTasks, userCommand) {
    return await this.taskConverter.convertToActionableTasks(aaiTasks, userCommand);
  }

  /**
   * Get appropriate command for task type
   */
  getTaskCommand(aaiTask) {
    const commands = {
      'file_operation': {
        command: 'echo',
        args: [`"📁 ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'development': {
        command: 'echo',
        args: [`"💻 ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'system': {
        command: 'echo',
        args: [`"⚙️ ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'documentation': {
        command: 'echo',
        args: [`"📚 ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'quality_assurance': {
        command: 'echo',
        args: [`"✅ ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'investigation': {
        command: 'echo',
        args: [`"🔍 ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'improvement': {
        command: 'echo',
        args: [`"⚡ ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'planning': {
        command: 'echo',
        args: [`"📋 ${aaiTask.title}: ${aaiTask.description}"`]
      },
      'validation': {
        command: 'echo',
        args: [`"🎯 ${aaiTask.title}: ${aaiTask.description}"`]
      }
    };

    return commands[aaiTask.type] || {
      command: 'echo',
      args: [`"🔧 ${aaiTask.title}: ${aaiTask.description}"`]
    };
  }

  /**
   * Get task group based on type
   */
  getTaskGroup(taskType) {
    const groups = {
      'file_operation': 'build',
      'development': 'build',
      'system': 'build',
      'documentation': 'build',
      'quality_assurance': 'test',
      'investigation': 'test',
      'improvement': 'build',
      'planning': 'build',
      'validation': 'test'
    };

    return groups[taskType] || 'build';
  }

  /**
   * Get task dependencies
   */
  getTaskDependencies(aaiTask, index) {
    // For now, make each task depend on the previous one (sequential execution)
    if (index === 0) return [];
    return [`${index}. Previous Task`];
  }

  /**
   * Update .cursor/tasks.json with new tasks
   */
  async updateCursorTasks(cursorTasks, userCommand) {
    let existingTasks = { version: "2.0.0", tasks: [] };
    
    // Load existing tasks if file exists
    if (fs.existsSync(this.tasksPath)) {
      try {
        existingTasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Error reading existing tasks, creating new file');
      }
    }

    // Add header comment for user command
    const commandHeader = {
      label: `🗣️ User Command: ${userCommand}`,
      type: "shell",
      command: "echo",
      args: [`"Processing: ${userCommand}"`],
      group: "build",
      presentation: {
        echo: true,
        reveal: "always",
        focus: true,
        panel: "new"
      },
      detail: `Generated from user command: "${userCommand}"`,
      metadata: {
        isCommandHeader: true,
        userCommand: userCommand,
        timestamp: new Date().toISOString()
      }
    };

    // Combine tasks: header + new tasks + existing non-command tasks
    const filteredExistingTasks = existingTasks.tasks.filter(task => 
      !task.metadata?.isCommandHeader && !task.metadata?.userCommand
    );

    existingTasks.tasks = [
      commandHeader,
      ...cursorTasks,
      ...filteredExistingTasks
    ];

    // Write updated tasks
    fs.writeFileSync(this.tasksPath, JSON.stringify(existingTasks, null, 2));
    
    console.log(`✅ Updated .cursor/tasks.json with ${cursorTasks.length + 1} tasks`);
  }

  /**
   * Create execution plan
   */
  async createExecutionPlan(taskAnalysis, cursorTasks) {
    return {
      sessionId: taskAnalysis.sessionId,
      totalTasks: cursorTasks.length,
      executionOrder: cursorTasks.map((task, index) => ({
        order: index + 1,
        label: task.label,
        aaiTaskId: task.metadata.aaiTaskId,
        estimatedTime: task.metadata.estimatedTime
      })),
      instructions: [
        "1. Open Command Palette (Ctrl/Cmd+Shift+P)",
        "2. Type 'Tasks: Run Task'",
        "3. Select the first task to start execution",
        "4. Follow tasks in order for best results"
      ]
    };
  }

  /**
   * Save session for tracking
   */
  async saveSession(session) {
    const sessionPath = path.join(this.chatLogPath, `session-${session.id}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    
    // Update latest session
    const latestPath = path.join(this.chatLogPath, 'latest-session.json');
    fs.writeFileSync(latestPath, JSON.stringify(session, null, 2));
  }

  /**
   * Process command directly (API method)
   */
  async processCommand(userCommand, context = {}) {
    if (!this.isActive) {
      await this.initialize();
    }
    
    return await this.processUserCommand(userCommand, context);
  }

  /**
   * Get current session status
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * CLI interface
   */
  static async handleCommand(command, args) {
    const processor = new CursorChatProcessor();

    switch (command) {
      case 'init':
        await processor.initialize();
        break;

      case 'process':
        const userCommand = args.join(' ');
        if (!userCommand) {
          console.log('❌ Please provide a command to process');
          return;
        }
        await processor.processCommand(userCommand);
        break;

      case 'status':
        const session = processor.getCurrentSession();
        if (session) {
          console.log('📊 Current Session:');
          console.log(`Command: "${session.userCommand}"`);
          console.log(`Tasks: ${session.cursorTasks.length}`);
          console.log(`Status: ${session.status}`);
        } else {
          console.log('📊 No active session');
        }
        break;

      case 'monitor':
        await processor.initialize();
        console.log('👁️ Monitoring for chat commands...');
        // Keep process alive
        setInterval(() => {}, 10000);
        break;

      default:
        console.log('❌ Unknown command. Available: init, process, status, monitor');
    }
  }
}

// CLI execution
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  
  if (!command) {
    console.log('🗣️ Cursor Chat Processor');
    console.log('Commands:');
    console.log('  init                    - Initialize chat processor');
    console.log('  process <command>       - Process a user command');
    console.log('  status                  - Show current session status');
    console.log('  monitor                 - Start monitoring for commands');
  } else {
    CursorChatProcessor.handleCommand(command, args);
  }
}

module.exports = CursorChatProcessor; 