#!/usr/bin/env node

/**
 * 🔍 Core File Monitor
 * 
 * Continuous monitoring system for the _core directory
 * Watches for file changes and updates the database automatically
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const CoreFileManager = require('./core_file_manager.js');

class CoreFileMonitor {
  constructor() {
    this.manager = new CoreFileManager();
    this.watcher = null;
    this.isWatching = false;
    this.updateQueue = [];
    this.processing = false;
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring() {
    console.log('🔍 STARTING CORE FILE MONITORING');
    console.log('━'.repeat(60));
    
    try {
      // Initialize the file manager
      await this.manager.initialize();
      
      // Setup file watcher
      await this.setupWatcher();
      
      // Setup periodic updates
      this.setupPeriodicUpdates();
      
      console.log('✅ Core file monitoring started successfully!');
      console.log('📊 Monitoring:', this.manager.coreDir);
      console.log('🔄 Updates will be processed automatically');
      
      // Keep process alive
      process.on('SIGINT', () => this.stopMonitoring());
      process.on('SIGTERM', () => this.stopMonitoring());
      
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Setup file system watcher
   */
  async setupWatcher() {
    const watchPath = this.manager.coreDir;
    
    this.watcher = chokidar.watch(watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 10
    });

    this.watcher
      .on('add', (filePath) => this.onFileAdded(filePath))
      .on('change', (filePath) => this.onFileChanged(filePath))
      .on('unlink', (filePath) => this.onFileDeleted(filePath))
      .on('addDir', (dirPath) => this.onDirectoryAdded(dirPath))
      .on('unlinkDir', (dirPath) => this.onDirectoryDeleted(dirPath))
      .on('error', (error) => this.onWatcherError(error))
      .on('ready', () => {
        this.isWatching = true;
        console.log('👁️ File watcher is ready and monitoring changes');
      });
  }

  /**
   * Handle file added
   */
  async onFileAdded(filePath) {
    const relativePath = path.relative(this.manager.coreDir, filePath);
    console.log(`📝 File added: ${relativePath}`);
    
    await this.queueUpdate('add', filePath, relativePath);
  }

  /**
   * Handle file changed
   */
  async onFileChanged(filePath) {
    const relativePath = path.relative(this.manager.coreDir, filePath);
    console.log(`✏️ File changed: ${relativePath}`);
    
    await this.queueUpdate('change', filePath, relativePath);
  }

  /**
   * Handle file deleted
   */
  async onFileDeleted(filePath) {
    const relativePath = path.relative(this.manager.coreDir, filePath);
    console.log(`🗑️ File deleted: ${relativePath}`);
    
    await this.queueUpdate('delete', filePath, relativePath);
  }

  /**
   * Handle directory added
   */
  async onDirectoryAdded(dirPath) {
    const relativePath = path.relative(this.manager.coreDir, dirPath);
    console.log(`📁 Directory added: ${relativePath}`);
  }

  /**
   * Handle directory deleted
   */
  async onDirectoryDeleted(dirPath) {
    const relativePath = path.relative(this.manager.coreDir, dirPath);
    console.log(`📁 Directory deleted: ${relativePath}`);
  }

  /**
   * Handle watcher errors
   */
  onWatcherError(error) {
    console.error('❌ File watcher error:', error.message);
  }

  /**
   * Queue update for processing
   */
  async queueUpdate(operation, filePath, relativePath) {
    this.updateQueue.push({
      operation,
      filePath,
      relativePath,
      timestamp: new Date().toISOString()
    });

    // Process queue if not already processing
    if (!this.processing) {
      await this.processUpdateQueue();
    }
  }

  /**
   * Process queued updates
   */
  async processUpdateQueue() {
    if (this.processing || this.updateQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        await this.processUpdate(update);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ Error processing updates:', error.message);
    } finally {
      this.processing = false;
      
      // Save database after processing
      await this.manager.saveDatabase();
    }
  }

  /**
   * Process individual update
   */
  async processUpdate(update) {
    const { operation, filePath, relativePath } = update;
    
    try {
      switch (operation) {
        case 'add':
        case 'change':
          if (this.manager.isRelevantFile(path.basename(filePath))) {
            await this.manager.processFile(filePath, relativePath);
            console.log(`  ✅ Updated database for: ${relativePath}`);
          }
          break;
          
        case 'delete':
          const fileId = this.manager.generateFileId(relativePath);
          if (this.manager.database.files[fileId]) {
            this.manager.database.files[fileId].status = 'deleted';
            this.manager.database.files[fileId].deleted_at = new Date().toISOString();
            console.log(`  🗑️ Marked as deleted: ${relativePath}`);
          }
          break;
      }
      
      // Log the operation
      await this.manager.logAccess(relativePath, operation);
      
    } catch (error) {
      console.warn(`  ⚠️ Failed to process ${operation} for ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Setup periodic updates
   */
  setupPeriodicUpdates() {
    // Full scan every hour
    setInterval(async () => {
      console.log('\n🔄 Performing periodic full scan...');
      try {
        await this.manager.fullScan();
        await this.manager.saveDatabase();
        console.log('✅ Periodic scan completed');
      } catch (error) {
        console.error('❌ Periodic scan failed:', error.message);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Link validation every 30 minutes
    setInterval(async () => {
      console.log('\n🔗 Validating links...');
      try {
        await this.manager.validateLinks();
        await this.manager.saveDatabase();
        console.log('✅ Link validation completed');
      } catch (error) {
        console.error('❌ Link validation failed:', error.message);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Generate report every 6 hours
    setInterval(async () => {
      console.log('\n📊 Generating periodic report...');
      try {
        await this.manager.generateReport();
        console.log('✅ Report generated');
      } catch (error) {
        console.error('❌ Report generation failed:', error.message);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    console.log('\n🛑 Stopping core file monitoring...');
    
    if (this.watcher) {
      await this.watcher.close();
      this.isWatching = false;
    }
    
    // Process any remaining updates
    if (this.updateQueue.length > 0) {
      console.log('🔄 Processing remaining updates...');
      await this.processUpdateQueue();
    }
    
    // Save final state
    await this.manager.saveDatabase();
    
    console.log('✅ Core file monitoring stopped successfully');
    process.exit(0);
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      monitoring: this.isWatching,
      queue_length: this.updateQueue.length,
      processing: this.processing,
      database_files: Object.keys(this.manager.database.files).length,
      last_updated: this.manager.database.last_updated
    };
  }

  /**
   * Manual trigger for operations
   */
  async triggerScan() {
    console.log('🔄 Manual scan triggered...');
    await this.manager.fullScan();
    await this.manager.saveDatabase();
    console.log('✅ Manual scan completed');
  }

  async triggerLinkValidation() {
    console.log('🔗 Manual link validation triggered...');
    await this.manager.validateLinks();
    await this.manager.saveDatabase();
    console.log('✅ Link validation completed');
  }

  async triggerReport() {
    console.log('📊 Manual report generation triggered...');
    const report = await this.manager.generateReport();
    console.log('✅ Report generated');
    return report;
  }
}

// Export for use as module
module.exports = CoreFileMonitor;

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'start';
  const monitor = new CoreFileMonitor();
  
  switch (command) {
    case 'start':
      monitor.startMonitoring().then(() => {
        console.log('\n🎯 Monitoring started! Press Ctrl+C to stop.');
      }).catch(error => {
        console.error('💥 Failed to start monitoring:', error.message);
        process.exit(1);
      });
      break;
      
    case 'status':
      console.log('📊 Monitor Status:', monitor.getStatus());
      break;
      
    case 'scan':
      monitor.triggerScan().then(() => {
        console.log('\n🎯 Manual scan completed!');
      });
      break;
      
    case 'validate':
      monitor.triggerLinkValidation().then(() => {
        console.log('\n🎯 Link validation completed!');
      });
      break;
      
    case 'report':
      monitor.triggerReport().then(() => {
        console.log('\n🎯 Report generated!');
      });
      break;
      
    default:
      console.log('Usage: node core_file_monitor.js [start|status|scan|validate|report]');
  }
} 