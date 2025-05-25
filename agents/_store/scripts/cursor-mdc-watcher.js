#!/usr/bin/env node

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
      console.log('\\n👋 Stopping Cursor MDC watcher...');
      watcher.close();
      process.exit(0);
    });
  }

  async onFileChange(event, filePath) {
    console.log(\`📁 \${event}: \${filePath}\`);
    
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

    console.log(\`🔄 Processing \${this.updateQueue.size} MDC file updates...\`);

    try {
      // Run dependency tracker scan
      execSync('node agents/_store/scripts/mdc-dependency-tracker.js scan', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Update Cursor summaries
      this.updateCursorSummaries();

    } catch (error) {
      console.log(\`❌ Error processing updates: \${error.message}\`);
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
