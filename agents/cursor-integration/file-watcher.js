#!/usr/bin/env node

/**
 * 👁️ AAI File Watcher for Cursor Integration
 * 
 * Monitors AAI files and updates Cursor summaries in real-time
 */

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

class AAIFileWatcher {
  constructor() {
    this.summariesPath = 'agents/_store/cursor-summaries';
    this.isWatching = false;
  }

  start() {
    if (this.isWatching) return;

    console.log('👁️ Starting AAI file watcher...');

    // Watch AAI directories
    const watcher = chokidar.watch([
      'agents/_store/memory/**/*.json',
      'agents/_store/analysis/**/*.json',
      'agents/_store/intelligence/**/*.json',
      'agents/_core/**/*.mdc',
      'agents/_core/**/*.json'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher
      .on('add', path => this.onFileChange('added', path))
      .on('change', path => this.onFileChange('changed', path))
      .on('unlink', path => this.onFileChange('removed', path));

    this.isWatching = true;
    console.log('✅ File watcher active');
  }

  onFileChange(event, filePath) {
    console.log(`📁 ${event}: ${filePath}`);
    
    // Update workspace context
    this.updateWorkspaceContext();
    
    // Update latest insights if it's a memory or analysis file
    if (filePath.includes('memory') || filePath.includes('analysis')) {
      this.updateLatestInsights();
    }
  }

  updateWorkspaceContext() {
    // Implementation would update workspace-context.json
    const contextPath = path.join(this.summariesPath, 'workspace-context.json');
    const context = {
      timestamp: new Date().toISOString(),
      lastUpdate: 'File watcher update',
      status: 'active'
    };
    
    if (!fs.existsSync(this.summariesPath)) {
      fs.mkdirSync(this.summariesPath, { recursive: true });
    }
    
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
  }

  updateLatestInsights() {
    // Implementation would update latest-insights.json
    const insightsPath = path.join(this.summariesPath, 'latest-insights.json');
    const insights = {
      timestamp: new Date().toISOString(),
      source: 'File watcher',
      recentChanges: true
    };
    
    fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2));
  }
}

// Start watcher if run directly
if (require.main === module) {
  const watcher = new AAIFileWatcher();
  watcher.start();
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    process.exit(0);
  });
}

module.exports = AAIFileWatcher;
