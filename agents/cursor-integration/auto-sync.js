#!/usr/bin/env node

/**
 * 🔄 Auto-Sync for Cursor Script Awareness
 * 
 * Automatically watches for script changes and updates Cursor awareness
 * Provides continuous integration between script_manager.js and Cursor
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class CursorAutoSync {
  constructor() {
    this.scriptsDir = 'agents/_store/scripts';
    this.testsDir = 'agents/_store/tests';
    this.outputDir = 'agents/_store/cursor-summaries';
    this.packageJsonPath = 'package.json';
    
    this.isRunning = false;
    this.lastUpdate = null;
    this.updateQueue = new Set();
    this.debounceTimer = null;
  }

  /**
   * Start auto-sync monitoring
   */
  async start() {
    console.log('🔄 Starting Cursor Auto-Sync...\n');

    try {
      // Initial sync
      await this.performFullSync();

      // Set up file watchers
      this.setupWatchers();

      // Set up periodic sync
      this.setupPeriodicSync();

      console.log('✅ Auto-sync started successfully!');
      console.log('📁 Watching:', this.scriptsDir, this.testsDir, this.packageJsonPath);
      console.log('📤 Output:', this.outputDir);
      console.log('⏱️ Periodic sync: every 5 minutes');
      console.log('\n🔍 Monitoring for changes...');

      this.isRunning = true;

      // Keep process alive
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());

    } catch (error) {
      console.error('❌ Failed to start auto-sync:', error.message);
      throw error;
    }
  }

  /**
   * Stop auto-sync monitoring
   */
  stop() {
    console.log('\n🛑 Stopping Cursor Auto-Sync...');
    this.isRunning = false;
    
    if (this.watcher) {
      this.watcher.close();
    }
    
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    console.log('✅ Auto-sync stopped');
    process.exit(0);
  }

  /**
   * Set up file watchers
   */
  setupWatchers() {
    const watchPaths = [
      this.scriptsDir + '/**/*.js',
      this.scriptsDir + '/**/*.py', 
      this.scriptsDir + '/**/*.sh',
      this.testsDir + '/**/*.js',
      this.packageJsonPath
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('changed', filePath))
      .on('unlink', (filePath) => this.handleFileChange('removed', filePath))
      .on('error', (error) => console.error('👀 Watcher error:', error));
  }

  /**
   * Handle file changes
   */
  handleFileChange(event, filePath) {
    console.log(`📝 File ${event}: ${filePath}`);
    
    this.updateQueue.add(filePath);
    
    // Debounce updates to avoid excessive syncing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.performIncrementalSync();
    }, 2000); // Wait 2 seconds after last change
  }

  /**
   * Set up periodic sync
   */
  setupPeriodicSync() {
    this.periodicTimer = setInterval(() => {
      if (this.isRunning) {
        console.log('⏰ Performing periodic sync...');
        this.performFullSync();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform full sync
   */
  async performFullSync() {
    try {
      console.log('🔄 Performing full sync...');
      
      // Run script awareness generation
      const { spawn } = require('child_process');
      
      const scriptAwareness = spawn('npm', ['run', 'cursor:script-awareness'], {
        stdio: 'pipe'
      });

      scriptAwareness.stdout.on('data', (data) => {
        // Suppress normal output during auto-sync
      });

      scriptAwareness.stderr.on('data', (data) => {
        console.error('⚠️ Script awareness error:', data.toString());
      });

      scriptAwareness.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Full sync completed');
          this.lastUpdate = new Date().toISOString();
          this.updateSyncStatus();
        } else {
          console.error('❌ Full sync failed with code:', code);
        }
      });

    } catch (error) {
      console.error('❌ Full sync error:', error.message);
    }
  }

  /**
   * Perform incremental sync for specific changes
   */
  async performIncrementalSync() {
    if (this.updateQueue.size === 0) return;

    console.log(`🔄 Incremental sync for ${this.updateQueue.size} changes...`);
    
    const changedFiles = Array.from(this.updateQueue);
    this.updateQueue.clear();

    try {
      // For now, perform full sync on any change
      // In the future, this could be optimized for specific file types
      await this.performFullSync();
      
      console.log('✅ Incremental sync completed');
      
    } catch (error) {
      console.error('❌ Incremental sync error:', error.message);
    }
  }

  /**
   * Update sync status file
   */
  updateSyncStatus() {
    const status = {
      lastSync: this.lastUpdate,
      isRunning: this.isRunning,
      watchedPaths: [this.scriptsDir, this.testsDir, this.packageJsonPath],
      outputPath: this.outputDir,
      totalSyncs: this.totalSyncs || 0,
      version: '1.0.0'
    };

    const statusPath = path.join(this.outputDir, 'sync-status.json');
    
    try {
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not update sync status:', error.message);
    }
  }

  /**
   * Show current status
   */
  showStatus() {
    console.log('📊 CURSOR AUTO-SYNC STATUS');
    console.log('━'.repeat(50));
    console.log(`🔄 Running: ${this.isRunning ? 'Yes' : 'No'}`);
    console.log(`⏰ Last update: ${this.lastUpdate || 'Never'}`);
    console.log(`📁 Watching: ${this.scriptsDir}, ${this.testsDir}`);
    console.log(`📤 Output: ${this.outputDir}`);
    console.log(`📋 Queued changes: ${this.updateQueue.size}`);
    
    // Check if output files exist
    const outputFiles = [
      'script-summary.json',
      'script-catalog.json', 
      'script-improvements.json',
      'script-workspace-symbols.json'
    ];
    
    console.log('\n📂 Generated Files:');
    outputFiles.forEach(file => {
      const filePath = path.join(this.outputDir, file);
      const exists = fs.existsSync(filePath);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${file}`);
    });
  }
}

// Export for use as module
module.exports = CursorAutoSync;

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'start';
  const autoSync = new CursorAutoSync();
  
  switch (command.toLowerCase()) {
    case 'start':
      autoSync.start().catch(error => {
        console.error('💥 Auto-sync failed:', error.message);
        process.exit(1);
      });
      break;
      
    case 'status':
      autoSync.showStatus();
      break;
      
    case 'sync':
      autoSync.performFullSync().then(() => {
        console.log('🎯 Manual sync completed!');
        process.exit(0);
      });
      break;
      
    default:
      console.log('🔄 Cursor Auto-Sync Commands:');
      console.log('');
      console.log('  start  - Start auto-sync monitoring');
      console.log('  status - Show current status');
      console.log('  sync   - Perform manual sync');
      console.log('');
      console.log('Usage: node auto-sync.js [command]');
  }
} 