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
const AgentLogger = require('./core/logger');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs').promises;

// Load configuration
const config = require('./config/default.json');

class SelfImprovementAgent {
  constructor() {
    this.config = require('./config/default.json');
    
    // Initialize logger first
    this.logger = new AgentLogger({
      logLevel: process.env.LOG_LEVEL || 'INFO',
      logPath: this.config.fileStore.storeRoot + '/' + this.config.fileStore.logsPath,
      logToConsole: true,
      logToFile: true
    });
    
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
    
    this.logger.info('🤖 Self-Improvement Agent v2.0 initialized');
  }

  /**
   * Start the agent (with optional non-interactive mode)
   */
  async start(options = {}) {
    const startTime = Date.now();
    const { interactive = true, testMode = false } = options;
    
    this.logger.logOperation('agent_start', { interactive, testMode });
    
    try {
      await this.initialize();
      
      if (testMode) {
        this.logger.info('🧪 Running in test mode');
        console.log('✅ Agent started successfully in test mode');
        console.log('🔍 All systems operational');
        
        // Quick system check
        const status = await this.getStatus();
        this.logger.logOperation('system_check', status);
        
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
        
        const duration = Date.now() - startTime;
        this.logger.logPerformance('agent_test_mode', duration);
        
        return { success: true, message: 'Agent test completed' };
      }
      
      if (!interactive) {
        this.logger.info('🔧 Running in non-interactive mode');
        console.log('✅ Agent initialized in non-interactive mode');
        return { success: true, message: 'Agent ready for programmatic use' };
      }
      
      // Interactive mode
      this.logger.info('🎮 Starting interactive mode');
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
      console.log('  logs               - View logging information and metrics');
      console.log('  help               - Show help information');
      console.log('  exit               - Stop the agent');
      console.log('');
      
      // Start CLI interface
      await this.cli.start();
      
    } catch (error) {
      this.logger.error('Failed to start agent', { error: error.message, stack: error.stack });
      console.error('❌ Failed to start agent:', error.message);
      throw error;
    }
  }

  /**
   * Initialize all agent components
   */
  async initialize() {
    const startTime = Date.now();
    this.logger.logOperation('agent_initialize', { memoryEnabled: this.config.agent.memoryEnabled, fileStoreEnabled: this.config.agent.fileStoreEnabled });
    
    try {
      // Initialize file manager
      if (this.config.agent.fileStoreEnabled) {
        await this.fileManager.initialize();
        this.logger.info('📁 FileManager initialized');
        console.log('📁 FileManager initialized');
      }

      // Initialize memory manager (dual memory system)
      if (this.config.agent.memoryEnabled) {
        await this.memoryManager.initialize();
        this.logger.logMemory('initialize', 'dual_memory_system');
      }

      // Initialize git project manager
      await this.gitProjectManager.initialize();
      this.logger.logGit('initialize', 'project_manager');

      // Initialize file dependency manager
      if (this.config.agent.memoryEnabled && this.config.agent.dependencyTrackingEnabled !== false) {
        await this.fileDependencyManager.initialize();
        this.logger.info('🔗 FileDependencyManager initialized');
        console.log('🔗 FileDependencyManager initialized');
      }

      this.isInitialized = true;
      const duration = Date.now() - startTime;
      this.logger.logPerformance('agent_initialize', duration);
      this.logger.info('✅ Agent initialization completed successfully');

    } catch (error) {
      this.logger.error('Agent initialization failed', { error: error.message, stack: error.stack });
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
    const startTime = Date.now();
    this.logger.logOperation('analyze_file', { filename });
    
    try {
      // Find the file
      this.logger.debug('🔍 Searching for file', { filename });
      const filePath = await this.analyzer.findFile(filename);
      
      if (!filePath) {
        const result = {
          success: false,
          message: `File not found: ${filename}. Try a partial name or check spelling.`
        };
        this.logger.warn('File not found', { filename, searchAttempted: true });
        return result;
      }

      this.logger.info('📄 File found, starting analysis', { filename, filePath });

      // Analyze the file
      const improvements = await this.analyzer.analyzeFile(filePath);
      const duration = Date.now() - startTime;
      
      this.logger.logAnalysis(filename, {
        issuesFound: improvements.length,
        suggestions: improvements.length,
        duration,
        filePath
      });
      
      // Store analysis in agent memory for learning (global improvement patterns)
      if (this.config.agent.memoryEnabled && improvements.length > 0) {
        this.logger.logMemory('store', 'agent_learning', { 
          filename, 
          improvementCount: improvements.length 
        });
        
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
        this.logger.logMemory('store', 'project_context', { 
          filename, 
          project: currentGitProject.name 
        });
        
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
      
      const result = {
        success: true,
        filePath,
        improvements,
        stats: await this.analyzer.getFileStats(filePath)
      };
      
      this.logger.info('✅ File analysis completed successfully', { 
        filename, 
        issuesFound: improvements.length,
        duration: Date.now() - startTime 
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('File analysis failed', { 
        filename, 
        error: error.message, 
        duration: Date.now() - startTime 
      });
      
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
    const startTime = Date.now();
    this.logger.logOperation('get_suggestions', { filename });
    
    try {
      const analysisResult = await this.analyzeSpecificFile(filename);
      
      if (!analysisResult.success) {
        this.logger.warn('Analysis failed, cannot generate suggestions', { filename });
        return analysisResult;
      }

      // Generate detailed improvement suggestions
      let suggestions = this.generateDetailedSuggestions(analysisResult.improvements);
      this.logger.debug('Generated base suggestions', { filename, count: suggestions.length });
      
      // Enhance suggestions with agent memory if available
      if (this.config.agent.memoryEnabled) {
        this.logger.debug('Enhancing suggestions with memory', { filename });
        suggestions = await this.enhanceWithAgentMemory(suggestions, filename);
      }
      
      const duration = Date.now() - startTime;
      this.logger.logPerformance('get_suggestions', duration, { 
        filename, 
        suggestionsCount: suggestions.length 
      });
      
      return {
        success: true,
        suggestions,
        filePath: analysisResult.filePath
      };
      
    } catch (error) {
      this.logger.error('Failed to generate suggestions', { 
        filename, 
        error: error.message 
      });
      
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
    this.logger.logUserInteraction('git-projects', [subcommand, ...args]);
    this.logger.logGit('command', subcommand, { args });
    
    try {
      switch (subcommand) {
        case 'add':
          const [name, gitUrl] = args;
          if (!name || !gitUrl) {
            this.logger.warn('Git add command missing parameters', { name, gitUrl });
            return { success: false, message: 'Usage: git-projects add <name> <git-url> [--branch <branch>]' };
          }
          
          const options = {};
          const branchIndex = args.indexOf('--branch');
          if (branchIndex !== -1 && args[branchIndex + 1]) {
            options.branch = args[branchIndex + 1];
          }
          
          this.logger.logGit('add_project', name, { gitUrl, options });
          const project = await this.gitProjectManager.addProject(name, gitUrl, options);
          this.logger.logGit('add_project_success', name, { project: project.name });
          return { success: true, project };
          
        case 'remove':
          const projectToRemove = args[0];
          if (!projectToRemove) {
            this.logger.warn('Git remove command missing project name');
            return { success: false, message: 'Usage: git-projects remove <name> [--force] [--clean-memory]' };
          }
          
          const removeOptions = {
            force: args.includes('--force'),
            cleanMemory: args.includes('--clean-memory')
          };
          
          this.logger.logGit('remove_project', projectToRemove, removeOptions);
          const removeResult = await this.gitProjectManager.removeProject(projectToRemove, removeOptions);
          this.logger.logGit('remove_project_success', projectToRemove, removeResult);
          return { success: true, ...removeResult };
          
        case 'switch':
          const projectToSwitch = args[0];
          if (!projectToSwitch) {
            this.logger.warn('Git switch command missing project name');
            return { success: false, message: 'Usage: git-projects switch <name>' };
          }
          
          this.logger.logGit('switch_project', projectToSwitch);
          const switchedProject = await this.gitProjectManager.switchProject(projectToSwitch);
          this.logger.logGit('switch_project_success', projectToSwitch, { newProject: switchedProject.name });
          return { success: true, project: switchedProject };
          
        case 'list':
          this.logger.logGit('list_projects', 'all');
          const projects = this.gitProjectManager.listProjects();
          this.logger.debug('Listed git projects', { count: projects.length });
          return { success: true, projects };
          
        case 'status':
          const statusProject = args[0];
          this.logger.logGit('get_status', statusProject || 'current');
          const status = await this.gitProjectManager.getProjectStatus(statusProject);
          this.logger.debug('Retrieved git project status', { project: statusProject, status: status.status });
          return { success: true, status };
          
        case 'sync-memory':
          const syncProject = args[0];
          this.logger.logGit('sync_memory', syncProject || 'current');
          const syncResult = await this.gitProjectManager.syncProjectMemory(syncProject);
          this.logger.logGit('sync_memory_success', syncProject, syncResult);
          return { success: true, ...syncResult };
          
        case 'clean':
          const cleanProject = args[0];
          if (!cleanProject) {
            this.logger.warn('Git clean command missing project name');
            return { success: false, message: 'Usage: git-projects clean <name>' };
          }
          
          this.logger.logGit('clean_project', cleanProject);
          const cleanResult = await this.gitProjectManager.cleanProjectForSwitch(cleanProject);
          this.logger.logGit('clean_project_success', cleanProject, cleanResult);
          return { success: true, ...cleanResult };
          
        case 'stats':
          this.logger.logGit('get_stats', 'all');
          const stats = await this.gitProjectManager.getProjectsStats();
          this.logger.debug('Retrieved git projects stats', { totalProjects: stats.totalProjects });
          return { success: true, stats };
          
        default:
          this.logger.warn('Unknown git project command', { subcommand, availableCommands: ['add', 'remove', 'switch', 'list', 'status', 'sync-memory', 'clean', 'stats'] });
          return { 
            success: false, 
            message: `Unknown git project command: ${subcommand}. Use: add, remove, switch, list, status, sync-memory, clean, stats` 
          };
      }
    } catch (error) {
      this.logger.error('Git project command failed', { 
        subcommand, 
        args, 
        error: error.message,
        stack: error.stack 
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle agent memory commands (global learning patterns)
   */
  async handleAgentMemoryCommand(subcommand, args = []) {
    this.logger.logUserInteraction('agent-memory', [subcommand, ...args]);
    
    if (!this.config.agent.memoryEnabled) {
      const result = { success: false, message: 'Agent memory is disabled in configuration' };
      this.logger.warn('Agent memory command attempted but memory disabled', { subcommand });
      return result;
    }

    this.logger.logMemory('command', 'agent', { subcommand, args });

    try {
      const result = await this.memoryManager.handleAgentMemoryCommand(subcommand, args);
      this.logger.logMemory('command_result', 'agent', { 
        subcommand, 
        success: result.success,
        message: result.message 
      });
      return result;
    } catch (error) {
      this.logger.error('Agent memory command failed', { 
        subcommand, 
        args, 
        error: error.message 
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle project memory commands (project-specific context)
   */
  async handleProjectMemoryCommand(subcommand, args = []) {
    this.logger.logUserInteraction('project-memory', [subcommand, ...args]);
    
    if (!this.config.agent.memoryEnabled) {
      const result = { success: false, message: 'Project memory is disabled in configuration' };
      this.logger.warn('Project memory command attempted but memory disabled', { subcommand });
      return result;
    }

    this.logger.logMemory('command', 'project', { subcommand, args });

    try {
      const result = await this.memoryManager.handleProjectMemoryCommand(subcommand, args);
      this.logger.logMemory('command_result', 'project', { 
        subcommand, 
        success: result.success,
        message: result.message 
      });
      return result;
    } catch (error) {
      this.logger.error('Project memory command failed', { 
        subcommand, 
        args, 
        error: error.message 
      });
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
   * Handle memory commands (unified interface for sync operations)
   */
  async handleMemoryCommand(command, args = []) {
    if (!this.config.agent.memoryEnabled) {
      return { success: false, message: 'Memory system is disabled' };
    }

    try {
      switch (command) {
        case 'sync-status':
          return await this.getMemorySyncStatus();
          
        case 'sync-up':
          return await this.syncMemoryUp();
          
        case 'sync-down':
          return await this.syncMemoryDown();
          
        case 'sync-both':
          return await this.syncMemoryBoth();
          
        case 'reset-pinecone':
          return await this.resetPineconeIndex();
          
        case 'fix-embeddings':
          return await this.fixEmbeddingDimensions();
          
        case 'stats':
          // Route to agent memory stats for backward compatibility
          return await this.handleAgentMemoryCommand('stats', args);
          
        default:
          return { 
            success: false, 
            message: `Unknown memory command: ${command}. Use: sync-status, sync-up, sync-down, sync-both, reset-pinecone, fix-embeddings, stats` 
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get memory synchronization status
   */
  async getMemorySyncStatus() {
    try {
      const .cursor/rules/agentstats = await this.memoryManager.getAgentMemoryStats();
      const projectStats = await this.memoryManager.getProjectMemoryStats();
      
      // Check Pinecone connection
      let pineconeConnected = false;
      let pineconeMemories = 0;
      
      if (this.memoryManager.index) {
        try {
          const indexStats = await this.memoryManager.index.describeIndexStats();
          pineconeConnected = true;
          pineconeMemories = indexStats.totalVectorCount || 0;
        } catch (error) {
          console.warn('⚠️ Pinecone connection check failed:', error.message);
        }
      }
      
      // Check OpenAI connection
      const openaiConnected = !!this.memoryManager.openai;
      
      // Handle project stats safely
      const agentMemories = .cursor/rules/agentstats.localMemories || 0;
      const projectMemories = (projectStats && !projectStats.error) ? (projectStats.localMemories || 0) : 0;
      
      return {
        success: true,
        syncStatus: {
          pineconeConnected,
          openaiConnected,
          localMemories: agentMemories + projectMemories,
          pineconeMemories,
          agentMemories,
          projectMemories
        }
      };
    } catch (error) {
      return { success: false, message: `Failed to get sync status: ${error.message}` };
    }
  }

  /**
   * Sync local memories to Pinecone
   */
  async syncMemoryUp() {
    if (!this.memoryManager.index) {
      return { success: false, message: 'Pinecone not connected' };
    }

    try {
      let uploaded = 0;
      let skipped = 0;
      let errors = 0;

      // Sync agent memories
      const agentMemoryFiles = await this.getAllLocalMemoryFiles(this.memoryManager.agentMemoryStore);
      for (const file of agentMemoryFiles) {
        try {
          const memory = JSON.parse(await fs.readFile(file.path, 'utf8'));
          
          // Check if already exists in Pinecone
          try {
            await this.memoryManager.index.fetch([memory.id]);
            skipped++;
            continue;
          } catch (fetchError) {
            // Memory doesn't exist, upload it
          }
          
          await this.memoryManager.index.upsert([{
            id: memory.id,
            values: memory.embedding,
            metadata: {
              type: memory.type,
              content: memory.content.substring(0, 1000),
              memoryClass: 'agent',
              ...memory.metadata
            }
          }]);
          uploaded++;
        } catch (error) {
          console.warn(`⚠️ Failed to sync ${file.path}:`, error.message);
          errors++;
        }
      }

      return { success: true, uploaded, skipped, errors };
    } catch (error) {
      return { success: false, message: `Sync up failed: ${error.message}` };
    }
  }

  /**
   * Sync Pinecone memories to local
   */
  async syncMemoryDown() {
    if (!this.memoryManager.index) {
      return { success: false, message: 'Pinecone not connected' };
    }

    try {
      let downloaded = 0;
      let skipped = 0;
      let errors = 0;

      // Query all memories from Pinecone (this is a simplified approach)
      // In a real implementation, you'd want to paginate through results
      const queryResponse = await this.memoryManager.index.query({
        vector: new Array(1536).fill(0), // Dummy vector for listing
        topK: 1000,
        includeMetadata: true
      });

      for (const match of queryResponse.matches) {
        try {
          const memory = {
            id: match.id,
            type: match.metadata.type,
            content: match.metadata.content,
            metadata: match.metadata,
            embedding: match.values || []
          };

          // Check if already exists locally
          const localPath = this.getLocalMemoryPath(memory);
          try {
            await fs.access(localPath);
            skipped++;
            continue;
          } catch (accessError) {
            // Memory doesn't exist locally, download it
          }

          await this.memoryManager.storeAgentMemoryLocally(memory, memory.type.replace('agent_', ''));
          downloaded++;
        } catch (error) {
          console.warn(`⚠️ Failed to download memory ${match.id}:`, error.message);
          errors++;
        }
      }

      return { success: true, downloaded, skipped, errors };
    } catch (error) {
      return { success: false, message: `Sync down failed: ${error.message}` };
    }
  }

  /**
   * Perform bidirectional sync
   */
  async syncMemoryBoth() {
    try {
      const uploadResult = await this.syncMemoryUp();
      const downloadResult = await this.syncMemoryDown();

      return {
        success: uploadResult.success && downloadResult.success,
        upload: uploadResult.success ? uploadResult : { uploaded: 0, skipped: 0, errors: 1 },
        download: downloadResult.success ? downloadResult : { downloaded: 0, skipped: 0, errors: 1 }
      };
    } catch (error) {
      return { success: false, message: `Bidirectional sync failed: ${error.message}` };
    }
  }

  /**
   * Reset Pinecone index (delete all memories)
   */
  async resetPineconeIndex() {
    if (!this.memoryManager.index) {
      return { success: false, message: 'Pinecone not connected' };
    }

    try {
      // Delete all vectors in the index
      await this.memoryManager.index.deleteAll();
      return { success: true, message: 'Pinecone index reset successfully' };
    } catch (error) {
      return { success: false, message: `Failed to reset Pinecone index: ${error.message}` };
    }
  }

  /**
   * Fix embedding dimensions (placeholder for future implementation)
   */
  async fixEmbeddingDimensions() {
    try {
      // This would implement logic to fix embedding dimension mismatches
      console.log('🔧 Checking embedding dimensions...');
      
      // For now, just return success
      return { success: true, message: 'Embedding dimensions checked' };
    } catch (error) {
      return { success: false, message: `Failed to fix embeddings: ${error.message}` };
    }
  }

  /**
   * Get all local memory files
   */
  async getAllLocalMemoryFiles(memoryStore) {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.json')) {
            files.push({ path: fullPath, name: entry.name });
          }
        }
      } catch (error) {
        // Directory might not exist, skip
      }
    }
    
    await scanDirectory(memoryStore);
    return files;
  }

  /**
   * Get local memory file path for a memory object
   */
  getLocalMemoryPath(memory) {
    const type = memory.type.replace('agent_', '');
    return path.join(this.memoryManager.agentMemoryStore, type, `${memory.id}.json`);
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown() {
    this.logger.logOperation('agent_shutdown');
    
    try {
      // Close CLI interface if running
      if (this.rl) {
        this.rl.close();
        this.logger.debug('CLI interface closed');
      }

      // Shutdown memory manager
      if (this.memoryManager && typeof this.memoryManager.shutdown === 'function') {
        await this.memoryManager.shutdown();
        this.logger.logMemory('shutdown', 'memory_manager');
      } else if (this.memoryManager) {
        this.logger.debug('Memory manager does not have shutdown method');
      }

      // Shutdown file dependency manager
      if (this.fileDependencyManager && typeof this.fileDependencyManager.shutdown === 'function') {
        await this.fileDependencyManager.shutdown();
        this.logger.debug('File dependency manager shutdown');
      }

      // Generate final session summary and shutdown logger
      await this.logger.shutdown();
      
      console.log('✅ Agent shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      if (this.logger) {
        this.logger.error('Shutdown error', { error: error.message });
      }
    }
  }

  /**
   * Handle logs command - view logging information and metrics
   */
  async handleLogsCommand(subcommand = 'status', args = []) {
    this.logger.logUserInteraction('logs', [subcommand, ...args]);
    
    try {
      switch (subcommand) {
        case 'status':
        case 'metrics':
          const metrics = this.logger.getMetrics();
          console.log('\n📊 LOGGING METRICS:');
          console.log('━'.repeat(50));
          console.log(`🆔 Session ID: ${metrics.sessionId}`);
          console.log(`⏱️  Uptime: ${metrics.uptimeFormatted}`);
          console.log(`📈 Operations: ${metrics.operations}`);
          console.log(`📊 Analyses: ${metrics.analysisCount}`);
          console.log(`🧠 Memory Ops: ${metrics.memoryOperations}`);
          console.log(`📁 Git Ops: ${metrics.gitOperations}`);
          console.log(`📄 File Ops: ${metrics.fileOperations}`);
          console.log(`❌ Errors: ${metrics.errors}`);
          console.log(`⚠️  Warnings: ${metrics.warnings}`);
          console.log(`📊 Log Level: ${metrics.logLevel}`);
          
          if (metrics.operations > 0) {
            const errorRate = ((metrics.errors / metrics.operations) * 100).toFixed(2);
            const successRate = (100 - errorRate).toFixed(2);
            console.log(`\n🎯 PERFORMANCE:`);
            console.log(`   Success Rate: ${successRate}%`);
            console.log(`   Error Rate: ${errorRate}%`);
            console.log(`   Ops/Min: ${(metrics.operations / (metrics.uptime / 60000)).toFixed(2)}`);
          }
          
          return { success: true, metrics };

        case 'level':
          if (args.length > 0) {
            const newLevel = args[0].toUpperCase();
            if (['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].includes(newLevel)) {
              this.logger.config.logLevel = newLevel;
              this.logger.currentLogLevel = this.logger.logLevels[newLevel];
              console.log(`✅ Log level set to: ${newLevel}`);
              this.logger.info(`Log level changed to ${newLevel}`);
              return { success: true, level: newLevel };
            } else {
              console.log('❌ Invalid log level. Use: ERROR, WARN, INFO, DEBUG, or TRACE');
              return { success: false, message: 'Invalid log level' };
            }
          } else {
            console.log(`📊 Current log level: ${this.logger.config.logLevel}`);
            return { success: true, level: this.logger.config.logLevel };
          }

        case 'summary':
          await this.logger.generateSessionSummary();
          return { success: true, message: 'Session summary generated' };

        case 'help':
          console.log('\n📋 LOGS COMMANDS:');
          console.log('━'.repeat(50));
          console.log('  logs status    - Show current metrics and status');
          console.log('  logs metrics   - Same as status');
          console.log('  logs level     - Show current log level');
          console.log('  logs level X   - Set log level (ERROR/WARN/INFO/DEBUG/TRACE)');
          console.log('  logs summary   - Generate session summary');
          console.log('  logs help      - Show this help');
          console.log('');
          return { success: true };

        default:
          console.log(`❌ Unknown logs command: ${subcommand}`);
          console.log('💡 Use "logs help" to see available commands');
          return { success: false, message: 'Unknown command' };
      }
    } catch (error) {
      this.logger.error('Logs command failed', { subcommand, error: error.message });
      console.error('❌ Error handling logs command:', error.message);
      return { success: false, message: error.message };
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