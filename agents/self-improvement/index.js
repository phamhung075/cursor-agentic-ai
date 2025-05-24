#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

/**
 * 🧠 Self-Improvement Agent v2.0 - Main Entry Point
 * 
 * Orchestrates all modules for a clean, organized self-improvement system
 * Now with Pinecone memory and separated file storage
 */

const path = require('path');
const FileAnalyzer = require('./core/analyzer');
const PatternDetector = require('./core/detector');
const ContextManager = require('./core/context');
const MemoryManager = require('./core/memory');
const FileManager = require('./core/fileManager');
const CLIInterface = require('./cli/interface');
const FileDependencyManager = require('./core/FileDependencyManager');
const readline = require('readline');
const chalk = require('chalk');

// Load configuration
const config = require('./config/default.json');

class SelfImprovementAgent {
  constructor() {
    this.config = require('./config/default.json');
    this.analyzer = new FileAnalyzer(this.config);
    this.memoryManager = new MemoryManager(this.config);
    this.fileManager = new FileManager();
    this.fileDependencyManager = new FileDependencyManager(this.memoryManager);
    this.contextManager = new ContextManager();
    this.detector = new PatternDetector(this.config);
    this.cli = new CLIInterface(this, this.config);
    this.rl = null;
    this.isInitialized = false;
  }

  /**
   * Start the agent (with optional non-interactive mode)
   */
  async start(options = {}) {
    const { interactive = true, testMode = false } = options;
    
    try {
      await this.initialize();
      
      if (testMode) {
        console.log('✅ Agent started successfully in test mode');
        console.log('🔍 All systems operational');
        
        // Quick system check
        const status = await this.getStatus();
        console.log(`🤖 Agent: ${status.agent.name} v${status.agent.version}`);
        console.log(`🧠 Memory: ${status.agent.memoryEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`📁 File Store: ${status.agent.fileStoreEnabled ? 'Enabled' : 'Disabled'}`);
        
        if (this.fileDependencyManager && this.fileDependencyManager.isInitialized) {
          const stats = this.fileDependencyManager.getStats();
          console.log(`🔗 Dependencies: ${stats.totalFiles} files tracked`);
        }
        
        console.log('✅ Test mode completed successfully');
        
        // Clean shutdown in test mode to ensure process exits
        await this.shutdown();
        
        return { success: true, message: 'Agent test completed' };
      }
      
      if (!interactive) {
        console.log('✅ Agent initialized in non-interactive mode');
        return { success: true, message: 'Agent ready for programmatic use' };
      }
      
      // Interactive mode
      console.log('🧠 Interactive Self-Improvement Agent v2.0');
      console.log('💡 I will analyze files as you work with them.');
      console.log('📋 Available Commands:');
      console.log('  analyze            - Analyze specific .mdc file');
      console.log('  improve            - Get improvement suggestions');
      console.log('  context            - Set current work context');
      console.log('  smart-detect       - Analyze based on current context');
      console.log('  memory             - Memory management commands');
      console.log('  projects           - Project management commands');
      console.log('  dependencies       - File dependency tracking commands');
      console.log('  migrate            - Migrate files to agent store');
      console.log('  help               - Show help information');
      console.log('  exit               - Stop the agent');
      console.log('');
      
      // Start CLI interface
      await this.cli.start();
      
    } catch (error) {
      console.error('❌ Failed to start agent:', error.message);
      throw error;
    }
  }

  /**
   * Initialize all agent components
   */
  async initialize() {
    try {
      // Initialize file manager
      if (this.config.agent.fileStoreEnabled) {
        await this.fileManager.initialize();
        console.log('📁 FileManager initialized');
      }

      // Initialize memory manager  
      if (this.config.agent.memoryEnabled) {
        await this.memoryManager.initialize();
      }

      // Initialize file dependency manager
      if (this.config.agent.memoryEnabled && this.config.agent.dependencyTrackingEnabled !== false) {
        await this.fileDependencyManager.initialize();
        console.log('🔗 FileDependencyManager initialized');
      }

    } catch (error) {
      console.warn('⚠️ Initialization warning:', error.message);
    }
  }

  /**
   * Set current project for file operations
   */
  setProject(projectName) {
    this.currentProject = this.fileManager.setProject(projectName);
    console.log(`📁 Current project set to: ${this.currentProject}`);
    return this.currentProject;
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Analyze a specific file
   */
  async analyzeSpecificFile(filename) {
    try {
      // Find the file
      const filePath = await this.analyzer.findFile(filename);
      
      if (!filePath) {
        return {
          success: false,
          message: `File not found: ${filename}. Try a partial name or check spelling.`
        };
      }

      // Analyze the file
      const improvements = await this.analyzer.analyzeFile(filePath);
      
      // Store analysis in memory for learning
      if (this.config.agent.memoryEnabled && improvements.length > 0) {
        await this.memoryManager.storeMemory('analysis', JSON.stringify({
          fileName: filename,
          filePath,
          improvements,
          context: this.contextManager.getCurrentContext()
        }), {
          type: 'file_analysis',
          fileName: filename,
          context: this.contextManager.getCurrentContext(),
          projectType: this.currentProject
        });
      }
      
      return {
        success: true,
        filePath,
        improvements,
        stats: await this.analyzer.getFileStats(filePath)
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error analyzing file: ${error.message}`
      };
    }
  }

  /**
   * Get improvement suggestions for a file with memory-enhanced learning
   */
  async getImprovementSuggestions(filename) {
    try {
      const analysisResult = await this.analyzeSpecificFile(filename);
      
      if (!analysisResult.success) {
        return analysisResult;
      }

      // Generate detailed improvement suggestions
      let suggestions = this.generateDetailedSuggestions(analysisResult.improvements);
      
      // Enhance suggestions with memory if available
      if (this.config.agent.memoryEnabled) {
        suggestions = await this.enhanceWithMemory(suggestions, filename);
      }
      
      return {
        success: true,
        suggestions,
        filePath: analysisResult.filePath
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error generating suggestions: ${error.message}`
      };
    }
  }

  /**
   * Enhance suggestions with memory-based learning
   */
  async enhanceWithMemory(suggestions, filename) {
    try {
      for (const suggestion of suggestions) {
        // Get past feedback for similar improvements
        const pastFeedback = await this.memoryManager.getPastFeedback(suggestion.category);
        
        if (pastFeedback.length > 0) {
          const approvalRate = this.calculateApprovalRate(pastFeedback);
          suggestion.memoryInsights = {
            pastFeedbackCount: pastFeedback.length,
            approvalRate,
            confidence: approvalRate > 0.7 ? 'HIGH' : approvalRate > 0.4 ? 'MEDIUM' : 'LOW'
          };
        }

        // Get relevant patterns
        const relevantMemories = await this.memoryManager.getRelevantMemories(
          `${suggestion.category} ${suggestion.issue}`,
          this.currentProject,
          3
        );
        
        if (relevantMemories.length > 0) {
          suggestion.similarCases = relevantMemories.map(memory => ({
            score: memory.score,
            context: memory.metadata.context,
            projectType: memory.metadata.projectType
          }));
        }
      }
    } catch (error) {
      console.warn('⚠️ Memory enhancement error:', error.message);
    }
    
    return suggestions;
  }

  /**
   * Calculate approval rate from past feedback
   */
  calculateApprovalRate(pastFeedback) {
    if (pastFeedback.length === 0) return 0;
    
    const weights = this.config.learning.feedbackWeight;
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const feedback of pastFeedback) {
      try {
        const data = JSON.parse(feedback.content);
        const weight = weights[data.userResponse] || 0;
        totalWeight += Math.abs(weight);
        weightedScore += weight;
      } catch {
        // Skip invalid feedback
      }
    }
    
    return totalWeight > 0 ? Math.max(0, weightedScore / totalWeight) : 0;
  }

  /**
   * Store user feedback for learning
   */
  async storeUserFeedback(improvement, userResponse, context = {}) {
    if (!this.config.agent.memoryEnabled) return;
    
    try {
      await this.memoryManager.storeUserFeedback(improvement, userResponse, {
        ...context,
        projectType: this.currentProject,
        context: this.contextManager.getCurrentContext()
      });
      
      console.log(`🧠 Stored user feedback: ${userResponse} for ${improvement.category}`);
    } catch (error) {
      console.warn('⚠️ Error storing feedback:', error.message);
    }
  }

  /**
   * Set current work context
   */
  setContext(context) {
    this.contextManager.setContext(context);
    
    // Store context in memory for learning
    if (this.config.agent.memoryEnabled && this.currentProject) {
      this.memoryManager.storeProjectContext(this.currentProject, context);
    }
  }

  /**
   * Smart detection based on current context with memory enhancement
   */
  async smartDetectIssues(context) {
    try {
      // Find files relevant to the context
      const relevantFiles = await this.contextManager.findContextRelevantFiles(this.analyzer);
      
      if (relevantFiles.length === 0) {
        return {
          success: false,
          message: `No files found relevant to context: ${context}`
        };
      }

      // Get memory insights for this context
      let memoryInsights = [];
      if (this.config.agent.memoryEnabled) {
        memoryInsights = await this.memoryManager.getRelevantMemories(context, this.currentProject, 5);
      }

      // Analyze relevant files
      const analysisResults = [];
      let totalIssues = 0;

      for (const fileInfo of relevantFiles.slice(0, 5)) { // Limit to top 5 files
        const improvements = await this.analyzer.analyzeFile(fileInfo.path);
        
        if (improvements.length > 0) {
          analysisResults.push({
            path: fileInfo.path,
            relevanceScore: fileInfo.relevanceScore,
            issues: improvements
          });
          totalIssues += improvements.length;
        }
      }

      return {
        success: true,
        relevantFiles: analysisResults,
        totalIssues,
        context,
        memoryInsights: memoryInsights.length > 0 ? memoryInsights : null
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error in smart detection: ${error.message}`
      };
    }
  }

  /**
   * File management commands
   */
  async handleFileCommand(subcommand, args = []) {
    if (!this.config.agent.fileStoreEnabled) {
      return { success: false, message: 'File store is disabled' };
    }

    try {
      switch (subcommand) {
        case 'projects':
          const projects = await this.fileManager.listProjects();
          return { success: true, projects };
          
        case 'stats':
          const projectName = args[0] || this.currentProject;
          if (!projectName) {
            return { success: false, message: 'No project specified' };
          }
          const stats = await this.fileManager.getProjectStats(projectName);
          return { success: true, stats };
          
        case 'migrate':
          const targetProject = args[0];
          if (!targetProject) {
            return { success: false, message: 'Project name required for migration' };
          }
          const migrationResult = await this.fileManager.migrateExistingFiles(targetProject);
          return { success: true, ...migrationResult };
          
        case 'overview':
          const overview = await this.fileManager.getStoreOverview();
          return { success: true, overview };
          
        default:
          return { 
            success: false, 
            message: `Unknown file command: ${subcommand}. Use: projects, stats, migrate, overview` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Memory management commands
   */
  async handleMemoryCommand(subcommand, args = []) {
    if (!this.config.agent.memoryEnabled) {
      return { success: false, message: 'Memory is disabled' };
    }

    try {
      switch (subcommand) {
        case 'stats':
          const stats = await this.memoryManager.getStats();
          return { success: true, stats };
          
        case 'search':
          const query = args.join(' ');
          if (!query) {
            return { success: false, message: 'Search query required' };
          }
          const results = await this.memoryManager.searchMemories(query);
          return { success: true, results };
          
        case 'cleanup':
          const days = parseInt(args[0]) || 30;
          const deletedCount = await this.memoryManager.clearOldMemories(days);
          return { success: true, deletedCount, days };

        case 'sync-status':
          const syncStatus = await this.memoryManager.getSyncStatus();
          return { success: true, syncStatus };

        case 'sync-up':
          const uploadResult = await this.memoryManager.syncLocalToPinecone();
          return { success: true, operation: 'upload', ...uploadResult };

        case 'sync-down':
          const downloadResult = await this.memoryManager.syncPineconeToLocal();
          return { success: true, operation: 'download', ...downloadResult };

        case 'sync-both':
          const bidirectionalResult = await this.memoryManager.bidirectionalSync();
          return { success: true, operation: 'bidirectional', ...bidirectionalResult };

        case 'reset-pinecone':
          await this.memoryManager.resetPineconeIndex();
          return { success: true, message: 'Pinecone index reset successfully' };

        case 'fix-embeddings':
          const fixResult = await this.memoryManager.fixEmbeddingDimensions();
          return { success: true, operation: 'fix-embeddings', ...fixResult };
          
        default:
          return { 
            success: false, 
            message: `Unknown memory command: ${subcommand}. Use: stats, search, cleanup, sync-status, sync-up, sync-down, sync-both, reset-pinecone, fix-embeddings` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate detailed improvement suggestions
   */
  generateDetailedSuggestions(improvements) {
    return improvements.map(improvement => {
      const suggestion = {
        ...improvement,
        difficulty: this.estimateDifficulty(improvement),
        impact: this.estimateImpact(improvement),
        timeEstimate: this.estimateTime(improvement)
      };

      // Add specific action steps
      suggestion.actionSteps = this.generateActionSteps(improvement);
      
      return suggestion;
    });
  }

  /**
   * Estimate difficulty of implementing an improvement
   */
  estimateDifficulty(improvement) {
    if (improvement.category === 'Security') return 'High';
    if (improvement.category === 'Syntax') return 'Low';
    if (improvement.category === 'Technology') return 'Medium';
    if (improvement.category === 'Best Practice') return 'Low';
    return 'Medium';
  }

  /**
   * Estimate impact of an improvement
   */
  estimateImpact(improvement) {
    if (improvement.priority === 'HIGH') return 'High';
    if (improvement.priority === 'MEDIUM') return 'Medium';
    return 'Low';
  }

  /**
   * Estimate time needed for improvement
   */
  estimateTime(improvement) {
    const difficulty = this.estimateDifficulty(improvement);
    
    switch (difficulty) {
      case 'Low': return '5-15 minutes';
      case 'Medium': return '30-60 minutes';
      case 'High': return '2-4 hours';
      default: return '30 minutes';
    }
  }

  /**
   * Generate specific action steps
   */
  generateActionSteps(improvement) {
    const steps = ['Review the current implementation'];
    
    if (improvement.line) {
      steps.push(`Navigate to line ${improvement.line}`);
    }
    
    steps.push('Apply the suggested change');
    steps.push('Test the modification');
    
    if (improvement.category === 'Security') {
      steps.push('Run security validation');
    }
    
    return steps;
  }

  /**
   * Get agent status and analytics
   */
  async getStatus() {
    const status = {
      agent: this.config.agent,
      currentProject: this.currentProject,
      context: this.contextManager.getContextAnalytics(),
      patterns: {
        securityRules: this.config.patterns.security.length,
        obsoletePatterns: Object.keys(this.config.patterns.obsolete.technology).length,
        bestPractices: this.config.patterns.bestPractices.length
      }
    };

    // Add memory stats if enabled
    if (this.config.agent.memoryEnabled) {
      status.memory = await this.memoryManager.getStats();
    }

    // Add file store stats if enabled
    if (this.config.agent.fileStoreEnabled) {
      try {
        status.fileStore = await this.fileManager.getStoreOverview();
      } catch (error) {
        status.fileStore = { error: error.message };
      }
    }

    return status;
  }

  /**
   * Stop the agent
   */
  stop() {
    this.cli.stop();
  }

  /**
   * Handle dependency tracking commands
   */
  async handleDependencyCommand(subcommand, args = []) {
    if (!this.config.agent.memoryEnabled || !this.fileDependencyManager) {
      return { success: false, message: 'Dependency tracking is disabled' };
    }

    try {
      switch (subcommand) {
        case 'stats':
          const stats = this.fileDependencyManager.getStats();
          return { success: true, stats };
          
        case 'analyze':
          const filePath = args[0];
          if (!filePath) {
            return { success: false, message: 'File path required' };
          }
          await this.fileDependencyManager.analyzeFileDependencies(filePath);
          const info = this.fileDependencyManager.getFileDependencyInfo(filePath);
          return { success: true, info };
          
        case 'info':
          const targetFile = args[0];
          if (!targetFile) {
            return { success: false, message: 'File path required' };
          }
          const fileInfo = this.fileDependencyManager.getFileDependencyInfo(targetFile);
          return { success: true, info: fileInfo };
          
        case 'search':
          const pattern = args[0];
          if (!pattern) {
            return { success: false, message: 'Search pattern required' };
          }
          const results = this.fileDependencyManager.searchByDependencyPattern(pattern);
          return { success: true, results };
          
        case 'graph':
          // Return simplified dependency graph
          const graph = {
            totalFiles: this.fileDependencyManager.dependencyGraph.size,
            dependencies: Array.from(this.fileDependencyManager.dependencyGraph.entries()).slice(0, 10)
          };
          return { success: true, graph };
          
        case 'reanalyze':
          const reanalyzeFile = args[0];
          if (!reanalyzeFile) {
            return { success: false, message: 'File path required' };
          }
          await this.fileDependencyManager.processFileChange(reanalyzeFile);
          return { success: true, message: `Reanalyzed ${reanalyzeFile} and its dependencies` };
          
        default:
          return { 
            success: false, 
            message: `Unknown dependency command: ${subcommand}. Use: stats, analyze, info, search, graph, reanalyze` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Graceful shutdown - close all connections and watchers
   */
  async shutdown() {
    console.log('👋 Shutting down Self-Improvement Agent...');
    
    try {
      // Stop file dependency manager
      if (this.fileDependencyManager && this.fileDependencyManager.isInitialized) {
        await this.fileDependencyManager.shutdown();
      }
      
      // Close CLI interface
      if (this.cli) {
        this.cli.stop();
      }
      
      // Close readline interface
      if (this.rl) {
        this.rl.close();
      }
      
      console.log('✅ Agent shutdown complete');
    } catch (error) {
      console.warn('⚠️ Warning during shutdown:', error.message);
    }
  }
}

// Run agent if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const agent = new SelfImprovementAgent();
  
  // Parse command line arguments
  const options = {
    interactive: true,
    testMode: false
  };
  
  if (args.includes('--test') || args.includes('-t')) {
    options.testMode = true;
    options.interactive = false;
  }
  
  if (args.includes('--no-interactive') || args.includes('-n')) {
    options.interactive = false;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🧠 Self-Improvement Agent v2.0');
    console.log('');
    console.log('Usage: node index.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --test, -t           Run in test mode (quick system check)');
    console.log('  --no-interactive, -n Run in non-interactive mode');
    console.log('  --help, -h           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node index.js                # Interactive mode (default)');
    console.log('  node index.js --test         # Test mode (quick check)');
    console.log('  node index.js --no-interactive # Non-interactive mode');
    process.exit(0);
  }
  
  agent.start(options).catch(error => {
    console.error('💥 Agent failed to start:', error.message);
    process.exit(1);
  }).then(result => {
    // If in test mode, exit cleanly after completion
    if (options.testMode && result && result.success) {
      console.log('🎯 Test mode finished - exiting');
      process.exit(0);
    }
  });
}

module.exports = SelfImprovementAgent; 