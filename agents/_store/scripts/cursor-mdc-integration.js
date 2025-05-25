#!/usr/bin/env node

/**
 * 🎯 Cursor MDC Integration
 * 
 * Integrates MDC dependency tracking with Cursor IDE for real-time updates
 */

const fs = require('fs');
const path = require('path');
const MDCDependencyTracker = require('./mdc-dependency-tracker');

class CursorMDCIntegration {
  constructor() {
    this.tracker = new MDCDependencyTracker();
    this.cursorSettingsPath = '.cursor/settings.json';
    this.cursorTasksPath = '.cursor/tasks.json';
  }

  /**
   * Setup Cursor integration for MDC dependencies
   */
  async setupIntegration() {
    console.log('🎯 Setting up Cursor MDC Integration...');

    // Initialize dependency tracker
    await this.tracker.initialize();

    // Update Cursor settings
    await this.updateCursorSettings();

    // Create Cursor tasks
    await this.createCursorTasks();

    // Create file watcher integration
    await this.createFileWatcherIntegration();

    console.log('✅ Cursor MDC Integration setup complete!');
  }

  /**
   * Update Cursor settings for MDC integration
   */
  async updateCursorSettings() {
    console.log('⚙️ Updating Cursor settings for MDC integration...');

    let settings = {};
    
    if (fs.existsSync(this.cursorSettingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(this.cursorSettingsPath, 'utf8'));
      } catch (error) {
        console.log('⚠️ Error reading Cursor settings, creating new ones');
      }
    }

    // Add MDC-specific settings
    settings['files.associations'] = {
      ...settings['files.associations'],
      '**/*.mdc': 'markdown'
    };

    // Add MDC file watching
    settings['files.watcherExclude'] = {
      ...settings['files.watcherExclude'],
      '**/.cursor/mdc-dependencies.json': false,
      '**/agents/_store/cursor-summaries/mdc-dependency-updates.json': false
    };

    // Add MDC to search include
    settings['search.include'] = {
      ...settings['search.include'],
      '**/*.mdc': true
    };

    // Add Cursor AI context for MDC files
    settings['cursor.ai.contextFiles'] = [
      ...(settings['cursor.ai.contextFiles'] || []),
      '**/*.mdc',
      '.cursor/mdc-dependencies.json',
      'agents/_store/cursor-summaries/mdc-dependency-updates.json'
    ];

    // Add MDC dependency tracking settings
    settings['mdc.dependencyTracking'] = {
      enabled: true,
      autoUpdate: true,
      watchPatterns: ['**/*.mdc'],
      updateScripts: {
        rules: 'npm run mdc:update-rules',
        config: 'npm run cursor:update-settings',
        docs: 'npm run mdc:update-docs'
      }
    };

    // Ensure .cursor directory exists
    const cursorDir = path.dirname(this.cursorSettingsPath);
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }

    fs.writeFileSync(this.cursorSettingsPath, JSON.stringify(settings, null, 2));
    console.log('✅ Cursor settings updated');
  }

  /**
   * Create Cursor tasks for MDC operations
   */
  async createCursorTasks() {
    console.log('📋 Creating Cursor tasks for MDC operations...');

    let tasks = {
      version: "2.0.0",
      tasks: []
    };

    if (fs.existsSync(this.cursorTasksPath)) {
      try {
        tasks = JSON.parse(fs.readFileSync(this.cursorTasksPath, 'utf8'));
      } catch (error) {
        console.log('⚠️ Error reading Cursor tasks, creating new ones');
      }
    }

    // Add MDC-specific tasks
    const mdcTasks = [
      {
        label: "MDC: Initialize Dependency Tracking",
        type: "shell",
        command: "node",
        args: ["agents/_store/scripts/mdc-dependency-tracker.js", "init"],
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared"
        },
        problemMatcher: []
      },
      {
        label: "MDC: Start Dependency Watcher",
        type: "shell",
        command: "node",
        args: ["agents/_store/scripts/mdc-dependency-tracker.js", "watch"],
        group: "build",
        isBackground: true,
        presentation: {
          echo: true,
          reveal: "silent",
          focus: false,
          panel: "shared"
        }
      },
      {
        label: "MDC: Scan Dependencies",
        type: "shell",
        command: "node",
        args: ["agents/_store/scripts/mdc-dependency-tracker.js", "scan"],
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared"
        }
      },
      {
        label: "MDC: Show Dependency Status",
        type: "shell",
        command: "node",
        args: ["agents/_store/scripts/mdc-dependency-tracker.js", "status"],
        group: "test",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared"
        }
      },
      {
        label: "MDC: Update Rules",
        type: "shell",
        command: "npm",
        args: ["run", "mdc:update-rules"],
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared"
        }
      }
    ];

    // Remove existing MDC tasks and add new ones
    tasks.tasks = tasks.tasks.filter(task => !task.label.startsWith('MDC:'));
    tasks.tasks.push(...mdcTasks);

    fs.writeFileSync(this.cursorTasksPath, JSON.stringify(tasks, null, 2));
    console.log('✅ Cursor tasks created');
  }

  /**
   * Create file watcher integration script
   */
  async createFileWatcherIntegration() {
    console.log('👁️ Creating file watcher integration...');

    const watcherScript = `#!/usr/bin/env node

/**
 * 👁️ Cursor MDC File Watcher
 * 
 * Integrates with Cursor to watch .mdc files and trigger dependency updates
 */

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CursorMDCWatcher {
  constructor() {
    this.isWatching = false;
    this.updateQueue = new Set();
    this.processingQueue = false;
  }

  start() {
    if (this.isWatching) {
      console.log('👁️ MDC watcher already running');
      return;
    }

    console.log('👁️ Starting Cursor MDC file watcher...');

    const watcher = chokidar.watch(['**/*.mdc'], {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/backup/**',
        '**/backups/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('change', filePath => this.onFileChange('changed', filePath))
      .on('add', filePath => this.onFileChange('added', filePath))
      .on('unlink', filePath => this.onFileChange('removed', filePath));

    this.isWatching = true;
    console.log('✅ Cursor MDC file watcher active');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\\\\n👋 Stopping Cursor MDC watcher...');
      watcher.close();
      process.exit(0);
    });
  }

  async onFileChange(event, filePath) {
    console.log(\\\`📁 \\\${event}: \\\${filePath}\\\`);
    
    // Add to update queue
    this.updateQueue.add(filePath);
    
    // Process queue (debounced)
    if (!this.processingQueue) {
      this.processingQueue = true;
      setTimeout(() => this.processUpdateQueue(), 2000);
    }
  }

  async processUpdateQueue() {
    if (this.updateQueue.size === 0) {
      this.processingQueue = false;
      return;
    }

    console.log(\\\`🔄 Processing \\\${this.updateQueue.size} MDC file updates...\\\`);

    try {
      // Run dependency tracker scan
      execSync('node agents/_store/scripts/mdc-dependency-tracker.js scan', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Update Cursor summaries
      this.updateCursorSummaries();

    } catch (error) {
      console.log(\\\`❌ Error processing updates: \\\${error.message}\\\`);
    }

    this.updateQueue.clear();
    this.processingQueue = false;
    
    console.log('✅ MDC dependency updates complete');
  }

  updateCursorSummaries() {
    const summariesDir = 'agents/_store/cursor-summaries';
    
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      action: 'mdc_files_updated',
      updatedFiles: Array.from(this.updateQueue),
      message: 'MDC files have been updated, dependencies refreshed'
    };

    const summaryFile = path.join(summariesDir, 'latest-insights.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  }
}

// Start watcher if run directly
if (require.main === module) {
  const watcher = new CursorMDCWatcher();
  watcher.start();
}

module.exports = CursorMDCWatcher;
`;

    const watcherPath = 'agents/_store/scripts/cursor-mdc-watcher.js';
    fs.writeFileSync(watcherPath, watcherScript);
    console.log(`✅ File watcher integration created: ${watcherPath}`);
  }

  /**
   * Show integration status
   */
  showStatus() {
    console.log('📊 CURSOR MDC INTEGRATION STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const files = {
      [this.cursorSettingsPath]: 'Cursor settings',
      [this.cursorTasksPath]: 'Cursor tasks',
      'agents/_store/scripts/mdc-dependency-tracker.js': 'Dependency tracker',
      'agents/_store/scripts/cursor-mdc-watcher.js': 'File watcher',
      '.cursor/mdc-dependencies.json': 'Dependency mappings'
    };

    console.log('📂 Integration Files:');
    Object.entries(files).forEach(([file, description]) => {
      const exists = fs.existsSync(file);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${description}`);
      console.log(`      ${file}`);
    });

    console.log('\n🎯 Integration Status: ' + 
      (Object.keys(files).every(f => fs.existsSync(f)) ? '✅ FULLY ACTIVE' : '⚠️ PARTIAL'));
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'setup';
  const integration = new CursorMDCIntegration();

  switch (command.toLowerCase()) {
    case 'setup':
      integration.setupIntegration();
      break;
      
    case 'status':
      integration.showStatus();
      break;
      
    default:
      console.log('🎯 Cursor MDC Integration');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('USAGE:');
      console.log('  node cursor-mdc-integration.js [command]');
      console.log('');
      console.log('COMMANDS:');
      console.log('  setup    Setup Cursor MDC integration');
      console.log('  status   Show integration status');
      break;
  }
}

module.exports = CursorMDCIntegration; 