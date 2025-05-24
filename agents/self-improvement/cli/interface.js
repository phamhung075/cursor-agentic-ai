/**
 * 🖥️ CLI Interface - Main command line interface
 * 
 * Handles user interaction and command processing
 */

const readline = require('readline');
const chalk = require('chalk');

class CLIInterface {
  constructor(agent, config) {
    this.agent = agent;
    this.config = config;
    this.rl = null;
    this.currentContext = null;
  }

  /**
   * Start the interactive CLI
   */
  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.config.cli.prompt
    });

    this.showWelcome();
    this.setupEventHandlers();
    this.rl.prompt();
  }

  /**
   * Show welcome message
   */
  showWelcome() {
    console.log(chalk.cyan('🧠 Interactive Self-Improvement Agent v2.0'));
    console.log(chalk.green('💡 I will analyze files as you work with them.'));
    this.showCommands();
  }

  /**
   * Show available commands
   */
  showCommands() {
    console.log(chalk.yellow('📋 Available Commands:'));
    Object.entries(this.config.cli.commands).forEach(([cmd, desc]) => {
      console.log(chalk.gray(`  ${cmd.padEnd(18)} - ${desc}`));
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.rl.on('line', async (input) => {
      const trimmed = input.trim();
      if (trimmed) {
        await this.processCommand(trimmed);
      }
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.cyan('👋 Self-Improvement Agent stopped.'));
      process.exit(0);
    });
  }

  /**
   * Process user commands
   */
  async processCommand(input) {
    const parts = input.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'analyze':
          await this.handleAnalyze(args);
          break;
        case 'improve':
          await this.handleImprove(args);
          break;
        case 'context':
          await this.handleContext(args);
          break;
        case 'smart-detect':
          await this.handleSmartDetect();
          break;
        case 'memory':
          await this.handleMemory(args);
          break;
        case 'projects':
        case 'project':
          await this.handleProjects(args);
          break;
        case 'migrate':
          await this.handleMigrate(args);
          break;
        case 'dependencies':
        case 'deps':
          await this.handleDependencies(args);
          break;
        case 'status':
          await this.handleStatus();
          break;
        case 'help':
          this.showCommands();
          break;
        case 'exit':
        case 'quit':
          this.rl.close();
          break;
        default:
          console.log(chalk.red(`❌ Unknown command: ${command}`));
          this.showCommands();
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  }

  /**
   * Handle analyze command
   */
  async handleAnalyze(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: analyze <filename>'));
      return;
    }

    const filename = args.join(' ');
    console.log(chalk.blue(`🔍 Analyzing: ${filename}`));
    
    const result = await this.agent.analyzeSpecificFile(filename);
    this.displayAnalysisResult(result);
  }

  /**
   * Handle improve command
   */
  async handleImprove(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: improve <filename>'));
      return;
    }

    const filename = args.join(' ');
    console.log(chalk.blue(`🔧 Getting improvements for: ${filename}`));
    
    const result = await this.agent.getImprovementSuggestions(filename);
    this.displayImprovements(result);
  }

  /**
   * Handle context command
   */
  async handleContext(args) {
    if (args.length === 0) {
      if (this.currentContext) {
        console.log(chalk.green(`📍 Current context: ${this.currentContext}`));
      } else {
        console.log(chalk.yellow('📍 No context set. Usage: context <topic>'));
      }
      return;
    }

    this.currentContext = args.join(' ');
    this.agent.setContext(this.currentContext);
    console.log(chalk.green(`📍 Context set to: ${this.currentContext}`));
  }

  /**
   * Handle smart detect command
   */
  async handleSmartDetect() {
    if (!this.currentContext) {
      console.log(chalk.yellow('💡 Please set context first: context <topic>'));
      return;
    }

    console.log(chalk.blue(`🎯 Smart detection for context: ${this.currentContext}`));
    const result = await this.agent.smartDetectIssues(this.currentContext);
    this.displaySmartDetectionResult(result);
  }

  /**
   * Display analysis results
   */
  displayAnalysisResult(result) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    const { improvements, filePath } = result;
    
    if (improvements.length === 0) {
      console.log(chalk.green('✅ No issues found! File looks good.'));
      return;
    }

    console.log(chalk.yellow(`📊 Found ${improvements.length} improvement opportunities:`));
    console.log();

    improvements.forEach((item, index) => {
      const icon = this.config.messages.priority[item.priority] || '•';
      console.log(chalk.white(`${index + 1}. ${icon} ${item.category}: ${item.issue}`));
      console.log(chalk.gray(`   💡 ${item.suggestion}`));
      if (item.line) {
        console.log(chalk.gray(`   📍 Line ${item.line}`));
      }
      console.log();
    });
  }

  /**
   * Display improvement suggestions
   */
  displayImprovements(result) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    console.log(chalk.green('🔧 Improvement suggestions generated!'));
    // Implementation would depend on the improvement format
  }

  /**
   * Display smart detection results
   */
  displaySmartDetectionResult(result) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    const { relevantFiles, totalIssues } = result;
    
    console.log(chalk.green(`🎯 Found ${relevantFiles.length} relevant files`));
    console.log(chalk.yellow(`📊 Total issues detected: ${totalIssues}`));
    
    relevantFiles.forEach(file => {
      console.log(chalk.blue(`📄 ${file.path} (${file.issues.length} issues)`));
    });
  }

  /**
   * Handle memory commands
   */
  async handleMemory(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: memory <subcommand>'));
      console.log(chalk.gray('  Available subcommands: stats, search <query>, cleanup [days]'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    console.log(chalk.blue(`🧠 Memory: ${subcommand}`));
    const result = await this.agent.handleMemoryCommand(subcommand, subArgs);
    this.displayCommandResult(result, 'Memory');
  }

  /**
   * Handle project commands
   */
  async handleProjects(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: projects <subcommand>'));
      console.log(chalk.gray('  Available subcommands: list, set <name>, stats [name], overview'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);

    try {
      switch (subcommand) {
        case 'list':
          const result = await this.agent.handleFileCommand('projects');
          if (result.success) {
            console.log(chalk.green('📁 Available projects:'));
            if (result.projects.length === 0) {
              console.log(chalk.gray('  No projects found'));
            } else {
              result.projects.forEach(project => {
                const current = project === this.agent.getCurrentProject() ? ' (current)' : '';
                console.log(chalk.blue(`  📂 ${project}${current}`));
              });
            }
          } else {
            console.log(chalk.red(`❌ ${result.message}`));
          }
          break;

        case 'set':
          if (subArgs.length === 0) {
            console.log(chalk.yellow('💡 Usage: projects set <project-name>'));
            return;
          }
          const projectName = subArgs[0];
          this.agent.setProject(projectName);
          console.log(chalk.green(`📁 Project set to: ${projectName}`));
          break;

        case 'stats':
          const statsResult = await this.agent.handleFileCommand('stats', subArgs);
          this.displayCommandResult(statsResult, 'Project Stats');
          break;

        case 'overview':
          const overviewResult = await this.agent.handleFileCommand('overview');
          this.displayCommandResult(overviewResult, 'Projects Overview');
          break;

        default:
          console.log(chalk.red(`❌ Unknown project command: ${subcommand}`));
          console.log(chalk.gray('  Available: list, set, stats, overview'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  }

  /**
   * Handle migrate command
   */
  async handleMigrate(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: migrate <project-name>'));
      console.log(chalk.gray('  Migrates existing AutoPilot files to agent store'));
      return;
    }

    const projectName = args[0];
    console.log(chalk.blue(`📦 Migrating files to project: ${projectName}`));
    
    const result = await this.agent.handleFileCommand('migrate', [projectName]);
    
    if (result.success) {
      console.log(chalk.green(`✅ Migration completed for project: ${projectName}`));
      
      if (result.migrated.length > 0) {
        console.log(chalk.blue('📁 Migrated files:'));
        result.migrated.forEach(file => {
          console.log(chalk.gray(`  ${file.fileName}: ${file.from} → ${file.to}`));
        });
      }
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow('⚠️ Migration errors:'));
        result.errors.forEach(error => {
          console.log(chalk.red(`  ${error.fileName}: ${error.error}`));
        });
      }
      
      // Set the project as current
      this.agent.setProject(projectName);
    } else {
      console.log(chalk.red(`❌ Migration failed: ${result.message}`));
    }
  }

  /**
   * Handle dependencies command
   */
  async handleDependencies(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: dependencies <subcommand>'));
      console.log(chalk.gray('  Available subcommands:'));
      console.log(chalk.gray('    stats              - Show dependency tracking statistics'));
      console.log(chalk.gray('    analyze <file>     - Analyze file dependencies'));
      console.log(chalk.gray('    info <file>        - Get dependency info for specific file'));
      console.log(chalk.gray('    search <pattern>   - Search files by dependency pattern'));
      console.log(chalk.gray('    graph              - Show dependency graph overview'));
      console.log(chalk.gray('    reanalyze <file>   - Force reanalysis of file and dependents'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    console.log(chalk.blue(`🔗 Dependencies: ${subcommand}`));
    const result = await this.agent.handleDependencyCommand(subcommand, subArgs);
    this.displayDependencyResult(result, subcommand);
  }

  /**
   * Display dependency command results
   */
  displayDependencyResult(result, subcommand) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    switch (subcommand) {
      case 'stats':
        this.displayDependencyStats(result.stats);
        break;
      case 'info':
      case 'analyze':
        this.displayDependencyInfo(result.info);
        break;
      case 'search':
        this.displayDependencySearchResults(result.results);
        break;
      case 'graph':
        this.displayDependencyGraph(result.graph);
        break;
      case 'reanalyze':
        console.log(chalk.green(`✅ ${result.message}`));
        break;
      default:
        this.displayCommandResult(result, 'Dependencies');
    }
  }

  /**
   * Display dependency tracking statistics
   */
  displayDependencyStats(stats) {
    console.log(chalk.green('📊 Dependency Tracking Statistics:'));
    console.log(chalk.gray(`  Total Files Tracked: ${stats.totalFiles}`));
    console.log(chalk.gray(`  Total Dependencies: ${stats.totalDependencies}`));
    console.log(chalk.gray(`  Files with Dependents: ${stats.filesWithDependents}`));
    console.log(chalk.gray(`  Average Dependencies per File: ${stats.averageDependencies}`));
    console.log(chalk.gray(`  Analysis Queue Size: ${stats.queueSize}`));
    console.log(chalk.gray(`  File Watcher Active: ${stats.isWatching ? 'Yes' : 'No'}`));
  }

  /**
   * Display file dependency information
   */
  displayDependencyInfo(info) {
    console.log(chalk.blue(`📄 Dependencies for: ${info.filePath}`));
    console.log();
    
    if (info.dependencies.length > 0) {
      console.log(chalk.yellow('📥 Dependencies (files this file depends on):'));
      info.dependencies.forEach(dep => {
        console.log(chalk.gray(`  • ${dep}`));
      });
      console.log();
    }
    
    if (info.dependents.length > 0) {
      console.log(chalk.yellow('📤 Dependents (files that depend on this file):'));
      info.dependents.forEach(dep => {
        console.log(chalk.gray(`  • ${dep}`));
      });
      console.log();
    }
    
    console.log(chalk.gray(`Dependencies: ${info.dependencyCount}, Dependents: ${info.dependentCount}`));
  }

  /**
   * Display dependency search results
   */
  displayDependencySearchResults(results) {
    if (results.length === 0) {
      console.log(chalk.yellow('🔍 No files found matching the dependency pattern'));
      return;
    }
    
    console.log(chalk.green(`🔍 Found ${results.length} files with matching dependencies:`));
    console.log();
    
    results.forEach(result => {
      console.log(chalk.blue(`📄 ${result.filePath}`));
      console.log(chalk.yellow('   Matching dependencies:'));
      result.matchingDependencies.forEach(dep => {
        console.log(chalk.gray(`     • ${dep}`));
      });
      console.log();
    });
  }

  /**
   * Display dependency graph overview
   */
  displayDependencyGraph(graph) {
    console.log(chalk.green('🕸️ Dependency Graph Overview:'));
    console.log(chalk.gray(`  Total Files: ${graph.totalFiles}`));
    console.log();
    
    if (graph.dependencies.length > 0) {
      console.log(chalk.yellow('📊 Sample Dependencies (first 10):'));
      graph.dependencies.forEach(([file, deps]) => {
        const depArray = Array.from(deps);
        console.log(chalk.blue(`  ${file}: ${depArray.length} dependencies`));
        if (depArray.length > 0) {
          console.log(chalk.gray(`    ${depArray.slice(0, 3).join(', ')}${depArray.length > 3 ? '...' : ''}`));
        }
      });
    }
  }

  /**
   * Handle status command
   */
  async handleStatus() {
    console.log(chalk.blue('📊 Agent Status'));
    
    try {
      const status = await this.agent.getStatus();
      
      console.log(chalk.green(`🤖 Agent: ${status.agent.name} v${status.agent.version}`));
      console.log(chalk.blue(`📁 Current Project: ${status.currentProject || 'None'}`));
      console.log(chalk.cyan(`📍 Context: ${status.context.currentContext || 'None'}`));
      
      // Memory stats
      if (status.memory) {
        console.log(chalk.magenta('🧠 Memory:'));
        console.log(chalk.gray(`  Pinecone: ${status.memory.pineconeConnected ? '✅ Connected' : '❌ Not connected'}`));
        console.log(chalk.gray(`  OpenAI: ${status.memory.openaiConnected ? '✅ Connected' : '❌ Not connected'}`));
        console.log(chalk.gray(`  Local memories: ${status.memory.localMemories}`));
        console.log(chalk.gray(`  Cache size: ${status.memory.cacheSize}`));
      }
      
      // File store stats
      if (status.fileStore && !status.fileStore.error) {
        console.log(chalk.yellow('📁 File Store:'));
        console.log(chalk.gray(`  Projects: ${status.fileStore.projectCount}`));
        console.log(chalk.gray(`  Store root: ${status.fileStore.storeRoot}`));
      }
      
      // Patterns
      console.log(chalk.white('🔍 Detection Patterns:'));
      console.log(chalk.gray(`  Security rules: ${status.patterns.securityRules}`));
      console.log(chalk.gray(`  Obsolete patterns: ${status.patterns.obsoletePatterns}`));
      console.log(chalk.gray(`  Best practices: ${status.patterns.bestPractices}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Status error:'), error.message);
    }
  }

  /**
   * Display command result in a formatted way
   */
  displayCommandResult(result, commandName) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${commandName} failed: ${result.message}`));
      return;
    }

    console.log(chalk.green(`✅ ${commandName} completed`));
    
    // Handle different result types
    if (result.stats) {
      this.displayProjectStats(result.stats);
    } else if (result.overview) {
      this.displayStoreOverview(result.overview);
    } else if (result.results) {
      this.displayMemorySearchResults(result.results);
    } else if (result.deletedCount !== undefined) {
      console.log(chalk.blue(`🗑️ Cleaned up ${result.deletedCount} old memories (older than ${result.days} days)`));
    }
  }

  /**
   * Display project statistics
   */
  displayProjectStats(stats) {
    console.log(chalk.blue(`📊 Project: ${stats.projectName}`));
    console.log(chalk.gray(`📁 Directory: ${stats.projectDir}`));
    console.log(chalk.gray(`📄 Files: ${stats.fileCount}`));
    
    if (stats.files.length > 0) {
      console.log(chalk.white('Files:'));
      stats.files.forEach(file => {
        const sizeKB = Math.round(file.size / 1024);
        const modified = new Date(file.modified).toLocaleDateString();
        console.log(chalk.gray(`  ${file.name} (${sizeKB}KB, ${file.type}, ${modified})`));
      });
    }
  }

  /**
   * Display store overview
   */
  displayStoreOverview(overview) {
    console.log(chalk.blue(`📊 Agent Store Overview`));
    console.log(chalk.gray(`📁 Store root: ${overview.storeRoot}`));
    console.log(chalk.gray(`📂 Projects: ${overview.projectCount}`));
    
    if (overview.projects.length > 0) {
      console.log(chalk.white('Project Details:'));
      overview.projects.forEach(project => {
        console.log(chalk.gray(`  📂 ${project.projectName} (${project.fileCount} files)`));
      });
    }
  }

  /**
   * Display memory search results
   */
  displayMemorySearchResults(results) {
    if (results.length === 0) {
      console.log(chalk.yellow('No memories found matching the query'));
      return;
    }

    console.log(chalk.blue(`🔍 Found ${results.length} relevant memories:`));
    results.forEach((result, index) => {
      const score = Math.round(result.score * 100);
      console.log(chalk.white(`${index + 1}. Score: ${score}% - ${result.metadata.type || 'unknown'}`));
      console.log(chalk.gray(`   ${result.content.substring(0, 100)}...`));
    });
  }

  /**
   * Stop the CLI
   */
  stop() {
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = CLIInterface; 