#!/usr/bin/env node

/**
 * 🎯 Smart Context Tracker
 * 
 * Tracks user behavior, project state, and system context to provide
 * intelligent, context-aware agent responses.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class SmartContextTracker {
  constructor() {
    this.contextFile = '.cursor/rules/agents/_store/intelligence/context/live-context.json';
    this.context = {
      session: {
        startTime: new Date().toISOString(),
        commands: [],
        files: [],
        patterns: []
      },
      project: {
        activeFiles: [],
        recentChanges: [],
        workingDirectory: process.cwd(),
        codebaseStructure: {}
      },
      user: {
        preferences: {},
        commonTasks: [],
        workingPatterns: [],
        efficiency: {}
      },
      system: {
        performance: {},
        health: {},
        suggestions: []
      }
    };
  }

  /**
   * Start context tracking
   */
  async startTracking() {
    console.log('🎯 Starting Smart Context Tracking...\n');

    try {
      // 1. Initialize context system
      await this.initializeContext();

      // 2. Setup file watching
      await this.setupFileWatching();

      // 3. Track command patterns
      await this.trackCommandPatterns();

      // 4. Monitor system health
      await this.monitorSystemHealth();

      // 5. Generate intelligent suggestions
      await this.generateSuggestions();

      console.log('✅ Smart context tracking active');

    } catch (error) {
      console.error('❌ Context tracking failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize context system
   */
  async initializeContext() {
    console.log('📊 Initializing context system...');

    // Load existing context if available
    if (fs.existsSync(this.contextFile)) {
      const existingContext = JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
      this.context.user = existingContext.user || this.context.user;
      this.context.project = existingContext.project || this.context.project;
    }

    // Analyze current project structure
    this.context.project.codebaseStructure = await this.analyzeCodebaseStructure();

    // Save initial context
    await this.saveContext();

    console.log('✅ Context system initialized');
  }

  /**
   * Setup file watching for project awareness
   */
  async setupFileWatching() {
    console.log('👁️ Setting up file watching...');

    const watcher = chokidar.watch([
      'src/**/*',
      '.cursor/rules/agents/**/*',
      'package.json',
      '.cursor/**/*'
    ], {
      ignored: [
        '**/node_modules/**',
        '.cursor/rules/agents/_store/memory/**',
        '.cursor/rules/agents/_store/archive/**'
      ],
      persistent: true
    });

    watcher.on('change', (filePath) => {
      this.trackFileChange(filePath, 'modified');
    });

    watcher.on('add', (filePath) => {
      this.trackFileChange(filePath, 'created');
    });

    watcher.on('unlink', (filePath) => {
      this.trackFileChange(filePath, 'deleted');
    });

    console.log('✅ File watching active');
  }

  /**
   * Track command patterns
   */
  async trackCommandPatterns() {
    console.log('⌨️ Tracking command patterns...');

    // Monitor package.json scripts usage
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = Object.keys(packageJson.scripts);

    this.context.project.availableCommands = scripts;
    this.context.user.commandHistory = this.context.user.commandHistory || [];

    console.log(`✅ Tracking ${scripts.length} available commands`);
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth() {
    console.log('🏥 Monitoring system health...');

    const health = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    this.context.system.health = health;

    // Check for performance issues
    if (health.memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      this.context.system.suggestions.push({
        type: 'performance',
        message: 'High memory usage detected - consider running memory cleanup',
        command: 'npm run AAI:memory-cleanup',
        priority: 'medium'
      });
    }

    console.log('✅ System health monitoring active');
  }

  /**
   * Generate intelligent suggestions
   */
  async generateSuggestions() {
    console.log('💡 Generating intelligent suggestions...');

    const suggestions = [];

    // Analyze command patterns
    const commandHistory = this.context.user.commandHistory || [];
    if (commandHistory.length > 0) {
      const lastCommands = commandHistory.slice(-5);
      const repeatedCommands = this.findRepeatedCommands(lastCommands);
      
      if (repeatedCommands.length > 0) {
        suggestions.push({
          type: 'automation',
          message: `You've used "${repeatedCommands[0]}" multiple times. Consider creating an alias or automation.`,
          priority: 'low'
        });
      }
    }

    // Analyze file patterns
    const recentFiles = this.context.project.recentChanges.slice(-10);
    if (recentFiles.length > 5) {
      const fileTypes = recentFiles.map(f => path.extname(f.path));
      const mostCommon = this.getMostCommon(fileTypes);
      
      suggestions.push({
        type: 'workflow',
        message: `You're working primarily with ${mostCommon} files. Consider setting up specialized tools for this file type.`,
        priority: 'low'
      });
    }

    this.context.system.suggestions = suggestions;

    console.log(`✅ Generated ${suggestions.length} intelligent suggestions`);
  }

  /**
   * Track file changes
   */
  trackFileChange(filePath, action) {
    const change = {
      path: filePath,
      action: action,
      timestamp: new Date().toISOString()
    };

    this.context.project.recentChanges.push(change);

    // Keep only last 50 changes
    if (this.context.project.recentChanges.length > 50) {
      this.context.project.recentChanges = this.context.project.recentChanges.slice(-50);
    }

    // Update active files
    if (action === 'modified' || action === 'created') {
      if (!this.context.project.activeFiles.includes(filePath)) {
        this.context.project.activeFiles.push(filePath);
      }
    } else if (action === 'deleted') {
      this.context.project.activeFiles = this.context.project.activeFiles.filter(f => f !== filePath);
    }

    // Save context periodically
    this.saveContext();
  }

  /**
   * Analyze codebase structure
   */
  async analyzeCodebaseStructure() {
    const structure = {
      directories: [],
      fileTypes: {},
      totalFiles: 0
    };

    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          structure.directories.push(itemPath);
          scanDirectory(itemPath);
        } else if (stats.isFile()) {
          const ext = path.extname(item);
          structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
          structure.totalFiles++;
        }
      }
    };

    scanDirectory('.');
    return structure;
  }

  /**
   * Helper methods
   */
  findRepeatedCommands(commands) {
    const counts = {};
    commands.forEach(cmd => {
      counts[cmd] = (counts[cmd] || 0) + 1;
    });
    return Object.keys(counts).filter(cmd => counts[cmd] > 2);
  }

  getMostCommon(array) {
    const counts = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Save context to file
   */
  async saveContext() {
    const dir = path.dirname(this.contextFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.contextFile, JSON.stringify(this.context, null, 2));
  }

  /**
   * Get current context
   */
  getContext() {
    return this.context;
  }

  /**
   * Add command to history
   */
  addCommand(command) {
    this.context.user.commandHistory = this.context.user.commandHistory || [];
    this.context.user.commandHistory.push({
      command: command,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 commands
    if (this.context.user.commandHistory.length > 100) {
      this.context.user.commandHistory = this.context.user.commandHistory.slice(-100);
    }

    this.saveContext();
  }
}

// Main execution
async function main() {
  const tracker = new SmartContextTracker();
  
  try {
    await tracker.startTracking();
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Context tracking stopped');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Context tracking failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SmartContextTracker; 