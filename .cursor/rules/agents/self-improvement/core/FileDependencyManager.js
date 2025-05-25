/**
 * 🔗 File Dependency Manager - Track file relationships and cascading updates
 * 
 * Monitors file changes and automatically updates memory for related files
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');

class FileDependencyManager {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.dependencyGraph = new Map(); // file -> Set of dependent files
    this.reverseDependencyGraph = new Map(); // file -> Set of files it depends on
    this.fileHashes = new Map(); // file -> hash for change detection
    this.watcher = null;
    this.isInitialized = false;
    this.analysisQueue = new Set(); // Files pending reanalysis
    this.debounceTimeouts = new Map(); // File -> timeout for debounced analysis
  }

  /**
   * Initialize file watching and dependency tracking
   */
  async initialize(projectRoot = process.cwd()) {
    if (this.isInitialized) return;

    this.projectRoot = projectRoot;
    await this.loadDependencyGraph();
    await this.initializeFileWatcher();
    
    this.isInitialized = true;
    console.log('🔗 FileDependencyManager initialized');
  }

  /**
   * Load existing dependency graph from memory
   */
  async loadDependencyGraph() {
    try {
      const memories = await this.memoryManager.searchMemories('file dependencies graph', 'dependencies', 1);
      if (memories.length > 0) {
        const data = JSON.parse(memories[0].content);
        this.dependencyGraph = new Map(data.dependencies);
        this.reverseDependencyGraph = new Map(data.reverseDependencies);
        this.fileHashes = new Map(data.fileHashes);
        console.log('📊 Loaded existing dependency graph with', this.dependencyGraph.size, 'files');
      }
    } catch (error) {
      console.log('💾 Starting with empty dependency graph');
    }
  }

  /**
   * Save dependency graph to memory - less frequent saves
   */
  async saveDependencyGraph() {
    // Only save if we have meaningful dependencies and changes
    if (this.dependencyGraph.size === 0) {
      return;
    }
    
    // Track save frequency - only save every 10 changes
    this.saveCounter = (this.saveCounter || 0) + 1;
    if (this.saveCounter % 10 !== 0) {
      return;
    }
    
    const data = {
      dependencies: Array.from(this.dependencyGraph.entries()),
      reverseDependencies: Array.from(this.reverseDependencyGraph.entries()),
      fileHashes: Array.from(this.fileHashes.entries()),
      lastUpdated: Date.now(),
      saveCount: this.saveCounter
    };

    try {
      // Store as agent memory (global dependency patterns) with reduced frequency
      await this.memoryManager.storeAgentMemory('dependencies', JSON.stringify(data), {
        type: 'dependency_graph',
        fileCount: this.dependencyGraph.size,
        saveId: Math.floor(this.saveCounter / 10)
      });
      
      console.log(`💾 Saved dependency graph (${this.dependencyGraph.size} files)`);
    } catch (error) {
      console.warn('⚠️ Error saving dependency graph:', error.message);
    }
  }

  /**
   * Initialize file watcher for automatic dependency tracking
   */
  async initializeFileWatcher() {
    // Only watch project-specific files, be very selective
    const watchPatterns = [
      '**/*.mdc',           // Project documentation files
      '**/*.md',            // Markdown files
      'src/**/*.js',        // Source JS files only
      'src/**/*.ts',        // Source TS files only
      'src/**/*.jsx',       // Source React files only
      'src/**/*.tsx',       // Source React TS files only
      '.cursor/rules/**/*.mdc', // Cursor rules files
      '.cursor/rules/agents/self-improvement/core/**/*.js',     // Only core agent files
      '.cursor/rules/agents/self-improvement/cli/**/*.js',      // Only CLI agent files
      '.cursor/rules/agents/self-improvement/config/**/*.json', // Only config files
      'scripts/**/*.js',    // Script files
      'package.json',       // Package config
      '*.json'              // Root config files only
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      cwd: this.projectRoot,
      ignored: [
        '**/node_modules/**',     // Ignore all node_modules
        '**/.git/**',             // Ignore git files
        '**/dist/**',             // Ignore build outputs
        '**/build/**',            // Ignore build outputs
        '**/.next/**',            // Ignore Next.js cache
        '**/coverage/**',         // Ignore test coverage
        '.cursor/rules/agents/_store/**',       // CRITICAL: Ignore ALL _store files to prevent recursion
        '**/.cursor/rules/agents/_store/**',    // CRITICAL: Additional protection against recursion
        '**/*memory*/**',         // Ignore any memory directories
        '**/*.log',               // Ignore log files
        '**/*.tmp',               // Ignore temp files
        '**/temp/**',             // Ignore temp directories
        '**/cache/**',            // Ignore cache directories
        '**/test_*.js'            // Ignore test files in root
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 4                    // Limit recursion depth even more
    });

    this.watcher.on('change', async (filePath) => {
      // Only process if it's a project file we care about
      if (this.shouldTrackFile(filePath)) {
        await this.handleFileChange(filePath);
      }
    });

    this.watcher.on('add', async (filePath) => {
      // Only process if it's a project file we care about
      if (this.shouldTrackFile(filePath)) {
        await this.analyzeFileDependencies(filePath);
      }
    });

    this.watcher.on('unlink', async (filePath) => {
      await this.removeFileFromGraph(filePath);
    });

    console.log('👀 File watcher initialized for selective dependency tracking (no _store recursion)');
  }

  /**
   * Check if we should track this file - CRITICAL recursion prevention
   */
  shouldTrackFile(filePath) {
    // CRITICAL: Never track any _store files to prevent recursion
    if (filePath.includes('_store') || 
        filePath.includes('memory') ||
        filePath.includes('node_modules') || 
        filePath.includes('.git') ||
        filePath.includes('dist') ||
        filePath.includes('build') ||
        filePath.includes('.next') ||
        filePath.includes('coverage') ||
        filePath.includes('.log') ||
        filePath.includes('.tmp') ||
        filePath.startsWith('test_')) {
      return false;
    }
    
    // Only track specific file types that matter for our project
    const relevantExtensions = ['.mdc', '.md', '.js', '.ts', '.jsx', '.tsx', '.json'];
    const extension = path.extname(filePath);
    
    return relevantExtensions.includes(extension);
  }

  /**
   * Handle file change event
   */
  async handleFileChange(filePath) {
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    try {
      // Check if file actually changed by comparing hash
      const newHash = await this.getFileHash(fullPath);
      const oldHash = this.fileHashes.get(filePath);
      
      if (newHash === oldHash) {
        return; // No actual change
      }

      this.fileHashes.set(filePath, newHash);
      
      // Add to analysis queue
      this.analysisQueue.add(filePath);
      
      // Debounce analysis to avoid excessive processing
      this.debounceAnalysis(filePath);
      
      console.log(`📝 File changed: ${filePath} - queued for dependency analysis`);
      
    } catch (error) {
      console.warn(`⚠️ Error handling file change for ${filePath}:`, error.message);
    }
  }

  /**
   * Debounce file analysis to avoid excessive processing during rapid changes
   */
  debounceAnalysis(filePath, delay = 2000) {
    // Clear existing timeout
    if (this.debounceTimeouts.has(filePath)) {
      clearTimeout(this.debounceTimeouts.get(filePath));
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.processFileChange(filePath);
      this.debounceTimeouts.delete(filePath);
    }, delay);

    this.debounceTimeouts.set(filePath, timeout);
  }

  /**
   * Process file change and update dependencies
   */
  async processFileChange(filePath) {
    try {
      // Re-analyze file dependencies
      await this.analyzeFileDependencies(filePath);
      
      // Get all files that depend on this changed file
      const dependentFiles = this.getDependentFiles(filePath);
      
      if (dependentFiles.size > 0) {
        console.log(`🔄 File ${filePath} affects ${dependentFiles.size} dependent files`);
        
        // Queue dependent files for reanalysis
        for (const depFile of dependentFiles) {
          this.analysisQueue.add(depFile);
          await this.invalidateFileMemory(depFile);
        }
        
        // Process dependent files with delay to avoid overwhelming
        await this.processDependentFiles(dependentFiles);
      }
      
      // Remove from analysis queue
      this.analysisQueue.delete(filePath);
      
      // Save updated dependency graph
      await this.saveDependencyGraph();
      
    } catch (error) {
      console.warn(`⚠️ Error processing file change for ${filePath}:`, error.message);
    }
  }

  /**
   * Analyze file dependencies by parsing imports, requires, and references
   */
  async analyzeFileDependencies(filePath) {
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const dependencies = this.extractDependencies(content, filePath);
      
      // Update dependency graph
      this.updateDependencyGraph(filePath, dependencies);
      
      // Store file hash for change detection
      const hash = await this.getFileHash(fullPath);
      this.fileHashes.set(filePath, hash);
      
      // Store dependency information in memory
      await this.storeDependencyMemory(filePath, dependencies);
      
    } catch (error) {
      console.warn(`⚠️ Error analyzing dependencies for ${filePath}:`, error.message);
    }
  }

  /**
   * Extract dependencies from file content - more selective approach
   */
  extractDependencies(content, filePath) {
    const dependencies = new Set();
    const fileDir = path.dirname(filePath);
    
    // Only track relative project imports, not external packages
    const importPatterns = [
      /import.*from\s+['"`](\.[^'"`]+)['"`]/g,      // Only relative imports starting with .
      /require\(['"`](\.[^'"`]+)['"`]\)/g,          // Only relative requires starting with .
      /import\(['"`](\.[^'"`]+)['"`]\)/g            // Only relative dynamic imports starting with .
    ];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        try {
          // Only track relative project files
          const resolvedPath = path.normalize(path.join(fileDir, importPath));
          // Only add if it's within our project and not external
          if (!resolvedPath.includes('node_modules') && !importPath.startsWith('http')) {
            dependencies.add(resolvedPath);
          }
        } catch (error) {
          // Ignore invalid paths
        }
      }
    }
    
    // Only track .mdc file references for our framework
    const mdcReferencePattern = /\[([^\]]+\.mdc)\]/g;
    let match;
    while ((match = mdcReferencePattern.exec(content)) !== null) {
      const mdcFile = match[1];
      if (!mdcFile.includes('node_modules')) {
        dependencies.add(mdcFile);
      }
    }
    
    return Array.from(dependencies);
  }

  /**
   * Update dependency graph with new dependencies
   */
  updateDependencyGraph(filePath, dependencies) {
    // Clear existing dependencies for this file
    const oldDeps = this.dependencyGraph.get(filePath) || new Set();
    for (const oldDep of oldDeps) {
      const reverseDeps = this.reverseDependencyGraph.get(oldDep) || new Set();
      reverseDeps.delete(filePath);
      if (reverseDeps.size === 0) {
        this.reverseDependencyGraph.delete(oldDep);
      } else {
        this.reverseDependencyGraph.set(oldDep, reverseDeps);
      }
    }
    
    // Add new dependencies
    this.dependencyGraph.set(filePath, new Set(dependencies));
    
    for (const dep of dependencies) {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep).add(filePath);
    }
  }

  /**
   * Get all files that depend on the given file
   */
  getDependentFiles(filePath) {
    return this.reverseDependencyGraph.get(filePath) || new Set();
  }

  /**
   * Get all files that the given file depends on
   */
  getFileDependencies(filePath) {
    return this.dependencyGraph.get(filePath) || new Set();
  }

  /**
   * Process dependent files for reanalysis
   */
  async processDependentFiles(dependentFiles) {
    let index = 0;
    for (const filePath of dependentFiles) {
      // Add delay between processing to avoid overwhelming the system
      setTimeout(async () => {
        try {
          console.log(`🔄 Reanalyzing dependent file: ${filePath}`);
          await this.reanalyzeFile(filePath);
        } catch (error) {
          console.warn(`⚠️ Error reanalyzing ${filePath}:`, error.message);
        }
      }, index * 500); // 500ms delay between each file
      
      index++;
    }
  }

  /**
   * Reanalyze a file and update its memory
   */
  async reanalyzeFile(filePath) {
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    try {
      // Check if file still exists
      await fs.access(fullPath);
      
      // Re-analyze dependencies
      await this.analyzeFileDependencies(filePath);
      
      // Trigger memory update for file analysis as agent memory (global pattern)
      await this.memoryManager.storeAgentMemory('analysis', JSON.stringify({
        fileName: path.basename(filePath),
        filePath: fullPath,
        reanalyzed: true,
        reason: 'dependency_change',
        timestamp: Date.now()
      }), {
        type: 'file_reanalysis',
        fileName: path.basename(filePath),
        trigger: 'dependency_change'
      });
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File no longer exists, remove from graph
        await this.removeFileFromGraph(filePath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Invalidate existing memory for a file
   */
  async invalidateFileMemory(filePath) {
    try {
      // Store invalidation record as agent memory (global pattern)
      await this.memoryManager.storeAgentMemory('analysis', JSON.stringify({
        fileName: path.basename(filePath),
        filePath,
        invalidated: true,
        reason: 'dependency_change',
        timestamp: Date.now()
      }), {
        type: 'file_invalidation',
        fileName: path.basename(filePath)
      });
    } catch (error) {
      console.warn(`⚠️ Error invalidating memory for ${filePath}:`, error.message);
    }
  }

  /**
   * Remove file from dependency graph
   */
  async removeFileFromGraph(filePath) {
    // Remove from dependency graph
    const dependencies = this.dependencyGraph.get(filePath) || new Set();
    for (const dep of dependencies) {
      const reverseDeps = this.reverseDependencyGraph.get(dep) || new Set();
      reverseDeps.delete(filePath);
      if (reverseDeps.size === 0) {
        this.reverseDependencyGraph.delete(dep);
      } else {
        this.reverseDependencyGraph.set(dep, reverseDeps);
      }
    }
    
    this.dependencyGraph.delete(filePath);
    
    // Remove from reverse dependency graph
    const dependents = this.reverseDependencyGraph.get(filePath) || new Set();
    for (const dependent of dependents) {
      const deps = this.dependencyGraph.get(dependent) || new Set();
      deps.delete(filePath);
      this.dependencyGraph.set(dependent, deps);
    }
    
    this.reverseDependencyGraph.delete(filePath);
    this.fileHashes.delete(filePath);
    
    await this.saveDependencyGraph();
    console.log(`🗑️ Removed ${filePath} from dependency graph`);
  }

  /**
   * Store dependency information in memory - less frequent storage
   */
  async storeDependencyMemory(filePath, dependencies) {
    // Only store if we have meaningful dependencies
    if (dependencies.length === 0) {
      return;
    }
    
    // Only store for project files we care about
    if (!this.shouldTrackFile(filePath)) {
      return;
    }
    
    // Batch storage - only store every 5th dependency update to reduce noise
    this.storageCounter = (this.storageCounter || 0) + 1;
    if (this.storageCounter % 5 !== 0) {
      return;
    }
    
    try {
      // Store as agent memory (global dependency patterns) with reduced frequency
      await this.memoryManager.storeAgentMemory('dependencies', JSON.stringify({
        filePath,
        dependencies: Array.from(dependencies),
        dependentCount: this.getDependentFiles(filePath).size,
        timestamp: Date.now(),
        batchId: Math.floor(this.storageCounter / 5)
      }), {
        type: 'file_dependencies',
        fileName: path.basename(filePath),
        dependencyCount: dependencies.length
      });
    } catch (error) {
      console.warn(`⚠️ Error storing dependency memory for ${filePath}:`, error.message);
    }
  }

  /**
   * Get file hash for change detection
   */
  async getFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get dependency statistics
   */
  getStats() {
    const totalFiles = this.dependencyGraph.size;
    const totalDependencies = Array.from(this.dependencyGraph.values())
      .reduce((sum, deps) => sum + deps.size, 0);
    const filesWithDependents = this.reverseDependencyGraph.size;
    const queueSize = this.analysisQueue.size;
    
    return {
      totalFiles,
      totalDependencies,
      filesWithDependents,
      averageDependencies: totalFiles > 0 ? (totalDependencies / totalFiles).toFixed(2) : 0,
      queueSize,
      isWatching: !!this.watcher
    };
  }

  /**
   * Get dependency graph for a specific file
   */
  getFileDependencyInfo(filePath) {
    const dependencies = Array.from(this.getFileDependencies(filePath));
    const dependents = Array.from(this.getDependentFiles(filePath));
    
    return {
      filePath,
      dependencies,
      dependents,
      dependencyCount: dependencies.length,
      dependentCount: dependents.length,
      hash: this.fileHashes.get(filePath)
    };
  }

  /**
   * Search for files by dependency pattern
   */
  searchByDependencyPattern(pattern) {
    const results = [];
    
    for (const [filePath, dependencies] of this.dependencyGraph.entries()) {
      const matchingDeps = Array.from(dependencies).filter(dep => 
        dep.includes(pattern) || dep.match(new RegExp(pattern, 'i'))
      );
      
      if (matchingDeps.length > 0) {
        results.push({
          filePath,
          matchingDependencies: matchingDeps,
          allDependencies: Array.from(dependencies)
        });
      }
    }
    
    return results;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    if (this.watcher) {
      await this.watcher.close();
      console.log('👋 File watcher closed');
    }
    
    // Clear debounce timeouts
    for (const timeout of this.debounceTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.debounceTimeouts.clear();
    
    // Save final state
    await this.saveDependencyGraph();
  }
}

module.exports = FileDependencyManager; 