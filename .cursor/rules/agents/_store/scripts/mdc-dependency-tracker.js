#!/usr/bin/env node

/**
 * 📋 MDC Dependency Tracker
 * 
 * Monitors .mdc files and automatically updates dependent files when changes occur.
 * Integrates with Cursor to provide real-time dependency management.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');

class MDCDependencyTracker {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.dependencyMap = new Map();
    this.watchedFiles = new Set();
    this.isWatching = false;
    this.dependencyFile = '.cursor/mdc-dependencies.json';
    this.updateQueue = new Set();
    this.processingQueue = false;
  }

  /**
   * Initialize the dependency tracker
   */
  async initialize() {
    console.log('🔄 Initializing MDC Dependency Tracker...');
    
    // Load existing dependencies
    await this.loadDependencies();
    
    // Scan for .mdc files and build dependency map
    await this.scanMDCFiles();
    
    // Save updated dependencies
    await this.saveDependencies();
    
    console.log('✅ MDC Dependency Tracker initialized');
  }

  /**
   * Start watching .mdc files for changes
   */
  startWatching() {
    if (this.isWatching) {
      console.log('👁️ MDC watcher already running');
      return;
    }

    console.log('👁️ Starting MDC file watcher...');

    const watcher = chokidar.watch([
      '.cursor/rules/agents/**/*.mdc',
      '.cursor/**/*.mdc',
      'src/**/*.mdc',
      '**/*.mdc'
    ], {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/backup/**',
        '**/backups/**'
      ],
      persistent: true,
      ignoreInitial: false
    });

    watcher
      .on('add', filePath => this.onFileChange('added', filePath))
      .on('change', filePath => this.onFileChange('changed', filePath))
      .on('unlink', filePath => this.onFileChange('removed', filePath));

    this.isWatching = true;
    console.log('✅ MDC file watcher active');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping MDC dependency tracker...');
      watcher.close();
      process.exit(0);
    });
  }

  /**
   * Handle file changes
   */
  async onFileChange(event, filePath) {
    console.log(`📁 ${event}: ${filePath}`);
    
    // Add to update queue
    this.updateQueue.add(filePath);
    
    // Process queue (debounced)
    if (!this.processingQueue) {
      this.processingQueue = true;
      setTimeout(() => this.processUpdateQueue(), 1000);
    }
  }

  /**
   * Process the update queue
   */
  async processUpdateQueue() {
    if (this.updateQueue.size === 0) {
      this.processingQueue = false;
      return;
    }

    console.log(`🔄 Processing ${this.updateQueue.size} file updates...`);

    for (const filePath of this.updateQueue) {
      await this.updateDependencies(filePath);
    }

    this.updateQueue.clear();
    this.processingQueue = false;
    
    console.log('✅ Dependency updates complete');
  }

  /**
   * Update dependencies for a changed file
   */
  async updateDependencies(changedFile) {
    const dependencies = this.dependencyMap.get(changedFile) || {};
    
    // Update dependent files
    if (dependencies.dependentFiles) {
      for (const depFile of dependencies.dependentFiles) {
        await this.updateDependentFile(changedFile, depFile);
      }
    }

    // Run update scripts
    if (dependencies.updateScripts) {
      for (const script of dependencies.updateScripts) {
        await this.runUpdateScript(script, changedFile);
      }
    }

    // Update Cursor summaries
    await this.updateCursorSummaries(changedFile);
  }

  /**
   * Scan for .mdc files and build dependency map
   */
  async scanMDCFiles() {
    console.log('🔍 Scanning for .mdc files...');
    
    const mdcFiles = await this.findMDCFiles();
    
    for (const mdcFile of mdcFiles) {
      await this.analyzeMDCFile(mdcFile);
    }
    
    console.log(`📋 Found ${mdcFiles.length} .mdc files`);
  }

  /**
   * Find all .mdc files in the workspace
   */
  async findMDCFiles() {
    const files = [];
    
    // Search in specific directories
    const searchDirs = [
      '.cursor/rules/agents',
      '.cursor',
      'src'
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const found = await this.findMDCFilesInDir(dir);
        files.push(...found);
      }
    }

    // Also search for .mdc files in the root directory
    const rootEntries = fs.readdirSync('.', { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && entry.name.endsWith('.mdc')) {
        files.push(entry.name);
      }
    }

    return files;
  }

  /**
   * Find .mdc files in a directory recursively
   */
  async findMDCFilesInDir(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
        const subFiles = await this.findMDCFilesInDir(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if directory should be ignored
   */
  shouldIgnoreDir(dirName) {
    const ignoreDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'backup',
      'backups',
      '.cursor-cache',
      'temp',
      'tmp'
    ];
    return ignoreDirs.includes(dirName);
  }

  /**
   * Analyze an .mdc file for dependencies
   */
  async analyzeMDCFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dependencies = this.extractDependencies(content, filePath);
      
      if (Object.keys(dependencies).length > 0) {
        this.dependencyMap.set(filePath, dependencies);
      }
    } catch (error) {
      console.log(`⚠️ Error analyzing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extract dependencies from .mdc file content
   */
  extractDependencies(content, filePath) {
    const dependencies = {
      dependentFiles: [],
      updateScripts: [],
      linkedFiles: [],
      ruleFiles: [],
      configFiles: []
    };

    // Extract file references - fix the regex pattern
    const fileReferences = content.match(/\[.*?\]\(([^)]+)\)/g) || [];
    for (const ref of fileReferences) {
      const match = ref.match(/\[.*?\]\(([^)]+)\)/);
      if (match && match[1]) {
        const refPath = match[1];
        // Skip external URLs
        if (refPath.startsWith('http://') || refPath.startsWith('https://') || refPath.startsWith('mailto:')) {
          continue;
        }
        
        const linkedFile = this.resolveFilePath(refPath, filePath);
        if (linkedFile && fs.existsSync(linkedFile)) {
          dependencies.linkedFiles.push(linkedFile);
        }
      }
    }

    // Extract dependency comments - fix the regex pattern
    const depComments = content.match(/<!--\s*DEPENDS:\s*([^>]+)\s*-->/g) || [];
    for (const comment of depComments) {
      const match = comment.match(/<!--\s*DEPENDS:\s*([^>]+)\s*-->/);
      if (match && match[1]) {
        const deps = match[1].split(',').map(d => d.trim());
        dependencies.dependentFiles.push(...deps);
      }
    }

    // Extract update script comments - fix the regex pattern
    const scriptComments = content.match(/<!--\s*UPDATE_SCRIPT:\s*([^>]+)\s*-->/g) || [];
    for (const comment of scriptComments) {
      const match = comment.match(/<!--\s*UPDATE_SCRIPT:\s*([^>]+)\s*-->/);
      if (match && match[1]) {
        dependencies.updateScripts.push(match[1].trim());
      }
    }

    // Auto-detect rule dependencies
    if (filePath.includes('/rules/')) {
      dependencies.updateScripts.push('npm run mdc:update-rules');
      dependencies.ruleFiles.push(filePath);
    }

    // Auto-detect config dependencies
    if (filePath.includes('/config/') || filePath.includes('settings')) {
      dependencies.updateScripts.push('npm run cursor:update-settings');
      dependencies.configFiles.push(filePath);
    }

    // Auto-detect .cursor settings files
    if (filePath.includes('.cursor/') && filePath.includes('settings')) {
      dependencies.updateScripts.push('npm run cursor:update-settings');
      dependencies.configFiles.push(filePath);
    }

    return dependencies;
  }

  /**
   * Resolve file path relative to the .mdc file
   */
  resolveFilePath(refPath, mdcFilePath) {
    // Skip external URLs and anchors
    if (refPath.startsWith('http://') || refPath.startsWith('https://') || 
        refPath.startsWith('mailto:') || refPath.startsWith('#')) {
      return null;
    }

    // Handle absolute paths
    if (path.isAbsolute(refPath)) {
      return refPath;
    }
    
    const mdcDir = path.dirname(mdcFilePath);
    let resolvedPath;

    // Try resolving relative to the .mdc file directory
    resolvedPath = path.resolve(mdcDir, refPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }

    // Try resolving relative to workspace root
    resolvedPath = path.resolve(this.workspaceRoot, refPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }

    // Try adding .mdc extension if not present
    if (!refPath.endsWith('.mdc') && !refPath.includes('.')) {
      const withExtension = refPath + '.mdc';
      
      // Try with extension relative to .mdc file directory
      resolvedPath = path.resolve(mdcDir, withExtension);
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }

      // Try with extension relative to workspace root
      resolvedPath = path.resolve(this.workspaceRoot, withExtension);
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
    }

    // Return the original resolved path even if it doesn't exist
    // This allows tracking of intended dependencies
    return path.resolve(mdcDir, refPath);
  }

  /**
   * Update a dependent file
   */
  async updateDependentFile(changedFile, dependentFile) {
    console.log(`🔄 Updating dependent file: ${dependentFile}`);
    
    try {
      // Check if dependent file exists
      if (!fs.existsSync(dependentFile)) {
        console.log(`⚠️ Dependent file not found: ${dependentFile}`);
        return;
      }

      // Add timestamp comment to dependent file
      const content = fs.readFileSync(dependentFile, 'utf8');
      const timestamp = new Date().toISOString();
      const updateComment = `<!-- Updated due to change in ${changedFile} at ${timestamp} -->\n`;
      
      // Add update comment at the top if it's an .mdc file
      if (dependentFile.endsWith('.mdc')) {
        const updatedContent = updateComment + content;
        fs.writeFileSync(dependentFile, updatedContent);
        console.log(`✅ Updated: ${dependentFile}`);
      }
    } catch (error) {
      console.log(`❌ Error updating ${dependentFile}: ${error.message}`);
    }
  }

  /**
   * Run an update script
   */
  async runUpdateScript(script, changedFile) {
    console.log(`⚡ Running update script: ${script}`);
    
    try {
      // Set environment variable for the changed file
      process.env.MDC_CHANGED_FILE = changedFile;
      
      execSync(script, { 
        stdio: 'inherit',
        cwd: this.workspaceRoot 
      });
      
      console.log(`✅ Script completed: ${script}`);
    } catch (error) {
      console.log(`❌ Script failed: ${script} - ${error.message}`);
    }
  }

  /**
   * Update Cursor summaries
   */
  async updateCursorSummaries(changedFile) {
    const summariesDir = '.cursor/rules/agents/_store/cursor-summaries';
    
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      changedFile: changedFile,
      dependencies: this.dependencyMap.get(changedFile) || {},
      action: 'mdc_dependency_update'
    };

    const summaryFile = path.join(summariesDir, 'mdc-dependency-updates.json');
    let summaries = [];
    
    if (fs.existsSync(summaryFile)) {
      try {
        summaries = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      } catch (error) {
        summaries = [];
      }
    }

    summaries.unshift(summary);
    summaries = summaries.slice(0, 100); // Keep last 100 updates

    fs.writeFileSync(summaryFile, JSON.stringify(summaries, null, 2));
  }

  /**
   * Load dependencies from file
   */
  async loadDependencies() {
    if (fs.existsSync(this.dependencyFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.dependencyFile, 'utf8'));
        this.dependencyMap = new Map(Object.entries(data));
        console.log(`📋 Loaded ${this.dependencyMap.size} dependency mappings`);
      } catch (error) {
        console.log(`⚠️ Error loading dependencies: ${error.message}`);
      }
    }
  }

  /**
   * Save dependencies to file
   */
  async saveDependencies() {
    const data = Object.fromEntries(this.dependencyMap);
    
    // Ensure .cursor directory exists
    const cursorDir = path.dirname(this.dependencyFile);
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }

    fs.writeFileSync(this.dependencyFile, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${this.dependencyMap.size} dependency mappings`);
  }

  /**
   * Show dependency status
   */
  showStatus() {
    console.log('📊 MDC DEPENDENCY TRACKER STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Workspace: ${this.workspaceRoot}`);
    console.log(`📋 Tracked files: ${this.dependencyMap.size}`);
    console.log(`👁️ Watching: ${this.isWatching ? 'Active' : 'Inactive'}`);
    console.log(`🔄 Update queue: ${this.updateQueue.size}`);
    console.log('');

    if (this.dependencyMap.size > 0) {
      console.log('📋 DEPENDENCY MAPPINGS:');
      for (const [file, deps] of this.dependencyMap) {
        console.log(`  📄 ${file}`);
        if (deps.dependentFiles && deps.dependentFiles.length > 0) {
          console.log(`    → Dependent files: ${deps.dependentFiles.length}`);
        }
        if (deps.updateScripts && deps.updateScripts.length > 0) {
          console.log(`    → Update scripts: ${deps.updateScripts.length}`);
        }
        if (deps.linkedFiles && deps.linkedFiles.length > 0) {
          console.log(`    → Linked files: ${deps.linkedFiles.length}`);
        }
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const tracker = new MDCDependencyTracker();

  switch (command.toLowerCase()) {
    case 'init':
      tracker.initialize();
      break;
      
    case 'watch':
      tracker.initialize().then(() => {
        tracker.startWatching();
      });
      break;
      
    case 'scan':
      tracker.scanMDCFiles().then(() => {
        tracker.saveDependencies();
      });
      break;
      
    case 'status':
      tracker.loadDependencies().then(() => {
        tracker.showStatus();
      });
      break;
      
    case 'help':
    default:
      console.log('📋 MDC Dependency Tracker');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('USAGE:');
      console.log('  node mdc-dependency-tracker.js [command]');
      console.log('');
      console.log('COMMANDS:');
      console.log('  init     Initialize dependency tracking');
      console.log('  watch    Start watching .mdc files for changes');
      console.log('  scan     Scan for .mdc files and update dependencies');
      console.log('  status   Show current dependency status');
      console.log('  help     Show this help message');
      console.log('');
      console.log('EXAMPLES:');
      console.log('  node mdc-dependency-tracker.js init');
      console.log('  node mdc-dependency-tracker.js watch');
      console.log('  npm run mdc:watch');
      break;
  }
}

module.exports = MDCDependencyTracker; 