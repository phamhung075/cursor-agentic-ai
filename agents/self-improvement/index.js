#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

/**
 * 🧠 Self-Improvement Agent v2.0 - Main Entry Point
 * 
 * Orchestrates all modules for a clean, organized self-improvement system
 * Now with dual memory (agent + project) and git project management
 */

const path = require('path');
const FileAnalyzer = require('./core/analyzer');
const PatternDetector = require('./core/detector');
const ContextManager = require('./core/context');
const MemoryManager = require('./core/memory');
const FileManager = require('./core/fileManager');
const GitProjectManager = require('./core/gitProjectManager');
const CLIInterface = require('./cli/interface');
const FileDependencyManager = require('./core/FileDependencyManager');
const readline = require('readline');
const chalk = require('chalk');

// Load configuration
const config = require('./config/default.json');

class SelfImprovementAgent {
  constructor() {
    this.config = require('./config/default.json');
    this.detector = new PatternDetector(this.config);
    this.analyzer = new FileAnalyzer(this.detector);
    this.memoryManager = new MemoryManager(this.config);
    this.fileManager = new FileManager();
    this.gitProjectManager = new GitProjectManager(this.config, this.memoryManager);
    this.fileDependencyManager = new FileDependencyManager(this.memoryManager);
    this.contextManager = new ContextManager();
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
        console.log(`🧠 Agent Memory: ${status.memory.agent ? status.memory.agent.localMemories : 0} entries`);
        console.log(`📁 Project Memory: ${status.memory.project ? status.memory.project.localMemories : 0} entries`);
        console.log(`🔗 Git Projects: ${status.gitProjects ? status.gitProjects.totalProjects : 0}`);
        
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
      console.log('💡 I can analyze files and manage git projects with dual memory.');
      console.log('📋 Available Commands:');
      console.log('  analyze            - Analyze specific .mdc file');
      console.log('  improve            - Get improvement suggestions');
      console.log('  context            - Set current work context');
      console.log('  smart-detect       - Analyze based on current context');
      console.log('  agent-memory       - Agent memory management commands');
      console.log('  project-memory     - Project memory management commands');
      console.log('  git-projects       - Git project management commands');
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

      // Initialize memory manager (dual memory system)
      if (this.config.agent.memoryEnabled) {
        await this.memoryManager.initialize();
      }

      // Initialize git project manager
      await this.gitProjectManager.initialize();

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
   * Set current project for file operations (legacy support)
   */
  setProject(projectName) {
    this.currentProject = this.fileManager.setProject(projectName);
    console.log(`📁 Current project set to: ${this.currentProject}`);
    return this.currentProject;
  }

  /**
   * Get current project (legacy support)
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Get current git project
   */
  getCurrentGitProject() {
    return this.gitProjectManager.getCurrentProject();
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
      
      // Store analysis in agent memory for learning (global improvement patterns)
      if (this.config.agent.memoryEnabled && improvements.length > 0) {
        await this.memoryManager.storeAgentMemory('learning', JSON.stringify({
          fileName: filename,
          filePath,
          improvements,
          analysisDate: Date.now()
        }), {
          type: 'file_analysis',
          fileName: filename,
          improvementCount: improvements.length
        });
      }

      // Store project-specific context if we have a current project
      const currentGitProject = this.gitProjectManager.getCurrentProject();
      if (currentGitProject && this.config.agent.memoryEnabled) {
        await this.memoryManager.storeProjectMemory('context', JSON.stringify({
          fileName: filename,
          filePath,
          analysisResult: {
            totalIssues: improvements.length,
            categories: [...new Set(improvements.map(i => i.category))]
          },
          context: this.contextManager.getCurrentContext()
        }), {
          type: 'file_analysis_context',
          fileName: filename
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
      
      // Enhance suggestions with agent memory if available
      if (this.config.agent.memoryEnabled) {
        suggestions = await this.enhanceWithAgentMemory(suggestions, filename);
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
   * Enhance suggestions with agent memory-based learning
   */
  async enhanceWithAgentMemory(suggestions, filename) {
    try {
      for (const suggestion of suggestions) {
        // Get agent learning patterns for similar improvements
        const agentLearning = await this.memoryManager.searchAgentMemories(
          `${suggestion.category} ${suggestion.issue}`,
          'learning',
          3
        );
        
        if (agentLearning.length > 0) {
          suggestion.agentInsights = {
            similarCases: agentLearning.length,
            confidence: this.calculateConfidenceFromAgentMemory(agentLearning),
            patterns: agentLearning.map(memory => ({
              score: memory.score,
              context: memory.metadata.context
            }))
          };
        }

        // Get project-specific patterns if we have a current project
        const currentGitProject = this.gitProjectManager.getCurrentProject();
        if (currentGitProject) {
          const projectMemories = await this.memoryManager.searchProjectMemories(
            `${suggestion.category} ${suggestion.issue}`,
            null,
            3
          );
          
          if (projectMemories.length > 0) {
            suggestion.projectInsights = {
              projectName: currentGitProject.name,
              similarCases: projectMemories.length,
              projectPatterns: projectMemories.map(memory => ({
                score: memory.score,
                context: memory.metadata.context
              }))
            };
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Memory enhancement error:', error.message);
    }
    
    return suggestions;
  }

  /**
   * Calculate confidence from agent memory patterns
   */
  calculateConfidenceFromAgentMemory(agentLearning) {
    if (agentLearning.length === 0) return 0;
    
    const avgScore = agentLearning.reduce((sum, memory) => sum + memory.score, 0) / agentLearning.length;
    
    // Higher confidence with more similar patterns and higher scores
    return Math.min(1.0, avgScore * (1 + agentLearning.length * 0.1));
  }

  /**
   * Store agent learning (global patterns)
   */
  async storeAgentLearning(pattern, context = {}) {
    if (!this.config.agent.memoryEnabled) return;
    
    try {
      await this.memoryManager.storeAgentLearning(pattern, context);
      console.log(`🧠 Stored agent learning pattern`);
    } catch (error) {
      console.warn('⚠️ Error storing agent learning:', error.message);
    }
  }

  /**
   * Store project decision (project-specific)
   */
  async storeProjectDecision(decision, context = {}) {
    if (!this.config.agent.memoryEnabled) return;
    
    const currentGitProject = this.gitProjectManager.getCurrentProject();
    if (!currentGitProject) {
      console.warn('⚠️ No current git project for storing decision');
      return;
    }
    
    try {
      await this.memoryManager.storeProjectDecision(decision, context);
      console.log(`📁 Stored project decision for: ${currentGitProject.name}`);
    } catch (error) {
      console.warn('⚠️ Error storing project decision:', error.message);
    }
  }

  /**
   * Set current work context
   */
  setContext(context) {
    this.contextManager.setContext(context);
    
    // Store context in agent memory for learning (global patterns)
    if (this.config.agent.memoryEnabled) {
      this.memoryManager.storeAgentMemory('patterns', JSON.stringify({
        context,
        timestamp: Date.now()
      }), {
        type: 'context_pattern'
      });
    }

    // Store project context if we have a current project
    const currentGitProject = this.gitProjectManager.getCurrentProject();
    if (currentGitProject && this.config.agent.memoryEnabled) {
      this.memoryManager.storeProjectMemory('context', JSON.stringify({
        context,
        projectName: currentGitProject.name,
        timestamp: Date.now()
      }), {
        type: 'project_context'
      });
    }
  }

  /**
   * Smart detection based on current context with dual memory enhancement
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

      // Get agent insights for this context
      let agentInsights = [];
      let projectInsights = [];
      
      if (this.config.agent.memoryEnabled) {
        agentInsights = await this.memoryManager.searchAgentMemories(context, null, 5);
        
        // Get project insights if we have a current project
        const currentGitProject = this.gitProjectManager.getCurrentProject();
        if (currentGitProject) {
          projectInsights = await this.memoryManager.searchProjectMemories(context, null, 5);
        }
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
        agentInsights: agentInsights.length > 0 ? agentInsights : null,
        projectInsights: projectInsights.length > 0 ? projectInsights : null,
        currentProject: this.gitProjectManager.getCurrentProject()?.name
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error in smart detection: ${error.message}`
      };
    }
  }

  /**
   * Handle git project commands
   */
  async handleGitProjectCommand(subcommand, args = []) {
    try {
      switch (subcommand) {
        case 'add':
          const [name, gitUrl] = args;
          if (!name || !gitUrl) {
            return { success: false, message: 'Usage: git-projects add <name> <git-url> [--branch <branch>]' };
          }
          
          const options = {};
          const branchIndex = args.indexOf('--branch');
          if (branchIndex !== -1 && args[branchIndex + 1]) {
            options.branch = args[branchIndex + 1];
          }
          
          const project = await this.gitProjectManager.addProject(name, gitUrl, options);
          return { success: true, project };
          
        case 'remove':
          const projectToRemove = args[0];
          if (!projectToRemove) {
            return { success: false, message: 'Usage: git-projects remove <name> [--force] [--clean-memory]' };
          }
          
          const removeOptions = {
            force: args.includes('--force'),
            cleanMemory: args.includes('--clean-memory')
          };
          
          const removeResult = await this.gitProjectManager.removeProject(projectToRemove, removeOptions);
          return { success: true, ...removeResult };
          
        case 'switch':
          const projectToSwitch = args[0];
          if (!projectToSwitch) {
            return { success: false, message: 'Usage: git-projects switch <name>' };
          }
          
          const switchedProject = await this.gitProjectManager.switchProject(projectToSwitch);
          return { success: true, project: switchedProject };
          
        case 'list':
          const projects = this.gitProjectManager.listProjects();
          return { success: true, projects };
          
        case 'status':
          const statusProject = args[0];
          const status = await this.gitProjectManager.getProjectStatus(statusProject);
          return { success: true, status };
          
        case 'sync-memory':
          const syncProject = args[0];
          const syncResult = await this.gitProjectManager.syncProjectMemory(syncProject);
          return { success: true, ...syncResult };
          
        case 'clean':
          const cleanProject = args[0];
          if (!cleanProject) {
            return { success: false, message: 'Usage: git-projects clean <name>' };
          }
          
          const cleanResult = await this.gitProjectManager.cleanProjectForSwitch(cleanProject);
          return { success: true, ...cleanResult };
          
        case 'stats':
          const stats = await this.gitProjectManager.getProjectsStats();
          return { success: true, stats };
          
        default:
          return { 
            success: false, 
            message: `Unknown git project command: ${subcommand}. Use: add, remove, switch, list, status, sync-memory, clean, stats` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle agent memory commands
   */
  async handleAgentMemoryCommand(subcommand, args = []) {
    if (!this.config.agent.memoryEnabled) {
      return { success: false, message: 'Agent memory is disabled' };
    }

    try {
      switch (subcommand) {
        case 'stats':
          const stats = await this.memoryManager.getAgentMemoryStats();
          return { success: true, stats };
          
        case 'search':
          const query = args.join(' ');
          if (!query) {
            return { success: false, message: 'Search query required' };
          }
          const results = await this.memoryManager.searchAgentMemories(query);
          return { success: true, results };
          
        case 'sync-to-git':
          const syncResult = await this.memoryManager.syncAgentMemoryToGit();
          return { success: true, ...syncResult };
          
        default:
          return { 
            success: false, 
            message: `Unknown agent memory command: ${subcommand}. Use: stats, search, sync-to-git` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle project memory commands
   */
  async handleProjectMemoryCommand(subcommand, args = []) {
    if (!this.config.agent.memoryEnabled) {
      return { success: false, message: 'Project memory is disabled' };
    }

    try {
      switch (subcommand) {
        case 'stats':
          const projectName = args[0];
          const stats = await this.memoryManager.getProjectMemoryStats(projectName);
          return { success: true, stats };
          
        case 'search':
          const query = args.join(' ');
          if (!query) {
            return { success: false, message: 'Search query required' };
          }
          const results = await this.memoryManager.searchProjectMemories(query);
          return { success: true, results };
          
        case 'clean':
          const cleanProjectName = args[0];
          if (!cleanProjectName) {
            return { success: false, message: 'Project name required' };
          }
          const cleanResult = await this.memoryManager.cleanProjectMemory(cleanProjectName);
          return { success: true, cleaned: cleanResult, project: cleanProjectName };
          
        case 'list-projects':
          const projectList = await this.memoryManager.listProjectsWithMemory();
          return { success: true, projects: projectList };
          
        default:
          return { 
            success: false, 
            message: `Unknown project memory command: ${subcommand}. Use: stats, search, clean, list-projects` 
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

    // Add dual memory stats if enabled
    if (this.config.agent.memoryEnabled) {
      status.memory = await this.memoryManager.getStats();
    }

    // Add git projects stats
    try {
      status.gitProjects = await this.gitProjectManager.getProjectsStats();
    } catch (error) {
      status.gitProjects = { error: error.message };
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
  
  // Check environment variable for non-interactive mode (from orchestrator)
  if (process.env.AAI_NON_INTERACTIVE === 'true') {
    options.interactive = false;
    console.log('🤖 Starting AAI Agent in service mode for Cursor integration...');
  }
  
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
    console.log('Environment Variables:');
    console.log('  AAI_NON_INTERACTIVE=true  Run in service mode (for orchestrator)');
    console.log('');
    console.log('Examples:');
    console.log('  node index.js                # Interactive mode (default)');
    console.log('  node index.js --test         # Test mode (quick check)');
    console.log('  node index.js --no-interactive # Non-interactive mode');
    console.log('  AAI_NON_INTERACTIVE=true node index.js # Service mode');
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
    
    // In non-interactive service mode, keep running and log status
    if (!options.interactive && !options.testMode) {
      console.log('✅ AAI Agent initialized in service mode');
      console.log('🔄 Agent ready for Cursor integration and continuous operation');
      
      // Keep the process alive and responsive
      setInterval(() => {
        // Periodic health check
        if (agent.isInitialized) {
          console.log(`🔄 [${new Date().toLocaleTimeString()}] AAI Agent service running...`);
        }
      }, 300000); // Every 5 minutes
    }
  });
}

module.exports = SelfImprovementAgent; 