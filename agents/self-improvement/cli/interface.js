/**
 * 🖥️ CLI Interface - Main command line interface
 * 
 * Handles user interaction and command processing for dual memory and git projects
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
    console.log(chalk.green('💡 I can analyze files and manage git projects with dual memory.'));
    this.showCommands();
  }

  /**
   * Show available commands
   */
  showCommands() {
    console.log(chalk.yellow('📋 Available Commands:'));
    console.log(chalk.gray('  🔍 Analysis Commands:'));
    console.log(chalk.gray('    analyze              - Analyze specific .mdc file'));
    console.log(chalk.gray('    improve              - Get improvement suggestions'));
    console.log(chalk.gray('    context              - Set current work context'));
    console.log(chalk.gray('    smart-detect         - Analyze based on current context'));
    console.log(chalk.gray(''));
    console.log(chalk.gray('  🧠 Memory Commands:'));
    console.log(chalk.gray('    agent-memory         - Agent memory management (global learning)'));
    console.log(chalk.gray('    project-memory       - Project memory management (project-specific)'));
    console.log(chalk.gray(''));
    console.log(chalk.gray('  🔗 Project Commands:'));
    console.log(chalk.gray('    git-projects         - Git project management commands'));
    console.log(chalk.gray('    dependencies         - File dependency tracking commands'));
    console.log(chalk.gray(''));
    console.log(chalk.gray('  ⚙️ System Commands:'));
    console.log(chalk.gray('    migrate              - Migrate files to agent store'));
    console.log(chalk.gray('    status               - Show agent status'));
    console.log(chalk.gray('    help                 - Show help information'));
    console.log(chalk.gray('    exit                 - Stop the agent'));
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
        case 'agent-memory':
          await this.handleAgentMemory(args);
          break;
        case 'project-memory':
          await this.handleProjectMemory(args);
          break;
        case 'git-projects':
          await this.handleGitProjects(args);
          break;
        case 'dependencies':
        case 'deps':
          await this.handleDependencies(args);
          break;
        case 'migrate':
          await this.handleMigrate(args);
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
   * Handle agent memory commands
   */
  async handleAgentMemory(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: agent-memory <subcommand>'));
      console.log(chalk.gray('  Available subcommands:'));
      console.log(chalk.gray('    stats              - Show agent memory statistics'));
      console.log(chalk.gray('    search <query>     - Search agent memories'));
      console.log(chalk.gray('    sync-to-git        - Sync agent memory to git (version control)'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    console.log(chalk.blue(`🧠 Agent Memory: ${subcommand}`));
    const result = await this.agent.handleAgentMemoryCommand(subcommand, subArgs);
    this.displayAgentMemoryResult(result, subcommand);
  }

  /**
   * Handle project memory commands
   */
  async handleProjectMemory(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: project-memory <subcommand>'));
      console.log(chalk.gray('  Available subcommands:'));
      console.log(chalk.gray('    stats [project]    - Show project memory statistics'));
      console.log(chalk.gray('    search <query>     - Search current project memories'));
      console.log(chalk.gray('    clean <project>    - Clean project memory'));
      console.log(chalk.gray('    list-projects      - List projects with memory'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    console.log(chalk.blue(`📁 Project Memory: ${subcommand}`));
    const result = await this.agent.handleProjectMemoryCommand(subcommand, subArgs);
    this.displayProjectMemoryResult(result, subcommand);
  }

  /**
   * Handle git projects commands
   */
  async handleGitProjects(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('💡 Usage: git-projects <subcommand>'));
      console.log(chalk.gray('  Available subcommands:'));
      console.log(chalk.gray('    add <name> <url>   - Add new sub-git project'));
      console.log(chalk.gray('    remove <name>      - Remove sub-git project'));
      console.log(chalk.gray('    switch <name>      - Switch to project'));
      console.log(chalk.gray('    list               - List all projects'));
      console.log(chalk.gray('    status [name]      - Show project status'));
      console.log(chalk.gray('    sync-memory [name] - Sync project memory to git'));
      console.log(chalk.gray('    clean <name>       - Clean project for switch'));
      console.log(chalk.gray('    stats              - Show projects statistics'));
      console.log(chalk.gray(''));
      console.log(chalk.gray('  Examples:'));
      console.log(chalk.gray('    git-projects add my-app https://github.com/user/repo.git'));
      console.log(chalk.gray('    git-projects add my-app https://github.com/user/repo.git --branch dev'));
      console.log(chalk.gray('    git-projects switch my-app'));
      console.log(chalk.gray('    git-projects remove my-app --force --clean-memory'));
      return;
    }

    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    console.log(chalk.blue(`🔗 Git Projects: ${subcommand}`));
    const result = await this.agent.handleGitProjectCommand(subcommand, subArgs);
    this.displayGitProjectResult(result, subcommand);
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

    const { suggestions } = result;

    console.log(chalk.green('🔧 Improvement suggestions generated!'));
    console.log();

    suggestions.forEach((suggestion, index) => {
      console.log(chalk.white(`${index + 1}. ${suggestion.category}: ${suggestion.issue}`));
      console.log(chalk.gray(`   💡 ${suggestion.suggestion}`));
      console.log(chalk.blue(`   ⏱️ Estimate: ${suggestion.timeEstimate} (${suggestion.difficulty} difficulty)`));
      
      // Show agent insights if available
      if (suggestion.agentInsights) {
        console.log(chalk.magenta(`   🧠 Agent: ${suggestion.agentInsights.similarCases} similar cases (confidence: ${Math.round(suggestion.agentInsights.confidence * 100)}%)`));
      }
      
      // Show project insights if available
      if (suggestion.projectInsights) {
        console.log(chalk.cyan(`   📁 Project: ${suggestion.projectInsights.similarCases} cases in ${suggestion.projectInsights.projectName}`));
      }
      
      console.log();
    });
  }

  /**
   * Display smart detection results
   */
  displaySmartDetectionResult(result) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    const { relevantFiles, totalIssues, agentInsights, projectInsights, currentProject } = result;
    
    console.log(chalk.green(`🎯 Found ${relevantFiles.length} relevant files`));
    console.log(chalk.yellow(`📊 Total issues detected: ${totalIssues}`));
    
    if (currentProject) {
      console.log(chalk.cyan(`📁 Current project: ${currentProject}`));
    }
    
    console.log();
    
    relevantFiles.forEach(file => {
      console.log(chalk.blue(`📄 ${file.path} (${file.issues.length} issues)`));
    });

    // Show memory insights
    if (agentInsights && agentInsights.length > 0) {
      console.log();
      console.log(chalk.magenta('🧠 Agent Insights:'));
      agentInsights.forEach((insight, i) => {
        console.log(chalk.gray(`  ${i + 1}. Score: ${Math.round(insight.score * 100)}%`));
      });
    }

    if (projectInsights && projectInsights.length > 0) {
      console.log();
      console.log(chalk.cyan('📁 Project Insights:'));
      projectInsights.forEach((insight, i) => {
        console.log(chalk.gray(`  ${i + 1}. Score: ${Math.round(insight.score * 100)}%`));
      });
    }
  }

  /**
   * Display agent memory results
   */
  displayAgentMemoryResult(result, subcommand) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    switch (subcommand) {
      case 'stats':
        this.displayAgentMemoryStats(result.stats);
        break;
      case 'search':
        this.displayMemorySearchResults(result.results, 'agent');
        break;
      case 'sync-to-git':
        console.log(chalk.green(`✅ Agent memory ready for git sync`));
        console.log(chalk.blue(`📁 Location: ${result.location}`));
        console.log(chalk.blue(`🧠 Memory count: ${result.memoryCount} entries`));
        break;
      default:
        this.displayCommandResult(result, 'Agent Memory');
    }
  }

  /**
   * Display project memory results
   */
  displayProjectMemoryResult(result, subcommand) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    switch (subcommand) {
      case 'stats':
        this.displayProjectMemoryStats(result.stats);
        break;
      case 'search':
        this.displayMemorySearchResults(result.results, 'project');
        break;
      case 'clean':
        console.log(chalk.green(`✅ Cleaned project memory: ${result.project}`));
        break;
      case 'list-projects':
        this.displayProjectMemoryList(result.projects);
        break;
      default:
        this.displayCommandResult(result, 'Project Memory');
    }
  }

  /**
   * Display git project results
   */
  displayGitProjectResult(result, subcommand) {
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.message}`));
      return;
    }

    switch (subcommand) {
      case 'add':
        console.log(chalk.green(`✅ Added git project: ${result.project.name}`));
        console.log(chalk.blue(`📁 Local path: ${result.project.localPath}`));
        console.log(chalk.blue(`🌿 Branch: ${result.project.branch}`));
        break;
        
      case 'remove':
        console.log(chalk.green(`✅ Removed git project: ${result.name}`));
        break;
        
      case 'switch':
        console.log(chalk.green(`✅ Switched to project: ${result.project.name}`));
        console.log(chalk.blue(`📁 Working directory: ${result.project.localPath}`));
        break;
        
      case 'list':
        this.displayGitProjectsList(result.projects);
        break;
        
      case 'status':
        this.displayGitProjectStatus(result.status);
        break;
        
      case 'sync-memory':
        console.log(chalk.green(`✅ Project memory synced: ${result.project}`));
        console.log(chalk.blue(`🧠 Memory count: ${result.memoryCount} entries`));
        if (result.summaryFile) {
          console.log(chalk.gray(`📄 Summary: ${result.summaryFile}`));
        }
        break;
        
      case 'clean':
        console.log(chalk.green(`✅ Cleaned project memory: ${result.project}`));
        if (result.alreadyClean) {
          console.log(chalk.gray('💡 Project memory was already clean'));
        }
        break;
        
      case 'stats':
        this.displayGitProjectsStats(result.stats);
        break;
        
      default:
        this.displayCommandResult(result, 'Git Projects');
    }
  }

  /**
   * Display agent memory statistics
   */
  displayAgentMemoryStats(stats) {
    console.log(chalk.green('🧠 Agent Memory Statistics (Global Learning):'));
    console.log(chalk.blue(`  📊 Total Memories: ${stats.localMemories}`));
    
    if (Object.keys(stats.types).length > 0) {
      console.log(chalk.white('  📂 Memory Types:'));
      Object.entries(stats.types).forEach(([type, count]) => {
        console.log(chalk.gray(`    ${type}: ${count} entries`));
      });
    }
  }

  /**
   * Display project memory statistics
   */
  displayProjectMemoryStats(stats) {
    if (stats.error) {
      console.log(chalk.red(`❌ ${stats.error}`));
      return;
    }

    console.log(chalk.green(`📁 Project Memory Statistics: ${stats.projectName}`));
    console.log(chalk.blue(`  📊 Total Memories: ${stats.localMemories}`));
    
    if (Object.keys(stats.types).length > 0) {
      console.log(chalk.white('  📂 Memory Types:'));
      Object.entries(stats.types).forEach(([type, count]) => {
        console.log(chalk.gray(`    ${type}: ${count} entries`));
      });
    }
  }

  /**
   * Display project memory list
   */
  displayProjectMemoryList(projects) {
    if (projects.length === 0) {
      console.log(chalk.yellow('📁 No projects with memory found'));
      return;
    }

    console.log(chalk.green('📁 Projects with Memory:'));
    projects.forEach(project => {
      console.log(chalk.blue(`  📂 ${project.name}`));
      console.log(chalk.gray(`    Memory entries: ${project.memoryCount}`));
      console.log(chalk.gray(`    Types: ${project.types.join(', ')}`));
    });
  }

  /**
   * Display git projects list
   */
  displayGitProjectsList(projects) {
    if (projects.length === 0) {
      console.log(chalk.yellow('🔗 No git projects found'));
      return;
    }

    console.log(chalk.green('🔗 Git Projects:'));
    projects.forEach(project => {
      const current = project.isCurrent ? chalk.green(' (current)') : '';
      console.log(chalk.blue(`  📂 ${project.name}${current}`));
      console.log(chalk.gray(`    URL: ${project.gitUrl}`));
      console.log(chalk.gray(`    Branch: ${project.branch}`));
      console.log(chalk.gray(`    Status: ${project.status}`));
    });
  }

  /**
   * Display git project status
   */
  displayGitProjectStatus(status) {
    console.log(chalk.blue(`📂 Project: ${status.name}`));
    console.log(chalk.gray(`📁 Local path: ${status.localPath}`));
    console.log(chalk.gray(`🌐 Git URL: ${status.gitUrl}`));
    console.log(chalk.gray(`🌿 Branch: ${status.branch}`));
    console.log(chalk.gray(`📊 Status: ${status.status}`));
    
    if (status.hasUncommittedChanges) {
      console.log(chalk.yellow('⚠️ Has uncommitted changes'));
    } else {
      console.log(chalk.green('✅ Working directory clean'));
    }

    if (status.memoryStats && !status.memoryStats.error) {
      console.log(chalk.blue(`🧠 Memory: ${status.memoryStats.localMemories} entries`));
    }

    if (status.repoInfo && !status.repoInfo.error) {
      console.log(chalk.gray(`📝 Current branch: ${status.repoInfo.currentBranch}`));
      console.log(chalk.gray(`📋 Last commit: ${status.repoInfo.lastCommit.substring(0, 50)}...`));
    }
  }

  /**
   * Display git projects statistics
   */
  displayGitProjectsStats(stats) {
    console.log(chalk.green('🔗 Git Projects Statistics:'));
    console.log(chalk.blue(`📊 Total projects: ${stats.totalProjects}`));
    console.log(chalk.blue(`✅ Active projects: ${stats.activeProjects}`));
    console.log(chalk.blue(`🧠 Total memory entries: ${stats.totalMemoryEntries}`));
    
    if (stats.currentProject) {
      console.log(chalk.cyan(`📍 Current project: ${stats.currentProject}`));
    }

    if (stats.projectDetails.length > 0) {
      console.log(chalk.white('📂 Project Details:'));
      stats.projectDetails.forEach(project => {
        const current = project.isCurrent ? ' (current)' : '';
        console.log(chalk.gray(`  ${project.name}${current}: ${project.memoryCount || 0} memories`));
      });
    }
  }

  /**
   * Display memory search results
   */
  displayMemorySearchResults(results, type) {
    if (results.length === 0) {
      console.log(chalk.yellow(`🔍 No ${type} memories found matching the query`));
      return;
    }

    console.log(chalk.blue(`🔍 Found ${results.length} relevant ${type} memories:`));
    results.forEach((result, index) => {
      const score = Math.round(result.score * 100);
      console.log(chalk.white(`${index + 1}. Score: ${score}% - ${result.metadata.type || 'unknown'}`));
      console.log(chalk.gray(`   ${result.content.substring(0, 100)}...`));
    });
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
    
    // This would need to be implemented in the agent
    console.log(chalk.yellow('⚠️ Migration feature not yet implemented in new system'));
    console.log(chalk.gray('💡 Use git-projects to manage sub-git projects instead'));
  }

  /**
   * Handle status command
   */
  async handleStatus() {
    console.log(chalk.blue('📊 Agent Status'));
    
    try {
      const status = await this.agent.getStatus();
      
      console.log(chalk.green(`🤖 Agent: ${status.agent.name} v${status.agent.version}`));
      
      // Current project status
      const currentGitProject = this.agent.getCurrentGitProject();
      if (currentGitProject) {
        console.log(chalk.cyan(`📍 Current Git Project: ${currentGitProject.name}`));
      } else {
        console.log(chalk.gray('📍 No current git project'));
      }
      
      console.log(chalk.cyan(`📍 Context: ${status.context.currentContext || 'None'}`));
      
      // Dual memory stats
      if (status.memory) {
        console.log(chalk.magenta('🧠 Memory System:'));
        console.log(chalk.gray(`  Agent Memory: ${status.memory.agent ? status.memory.agent.localMemories : 0} entries`));
        console.log(chalk.gray(`  Project Memory: ${status.memory.project ? status.memory.project.localMemories : 0} entries`));
        console.log(chalk.gray(`  Pinecone: ${status.memory.pineconeConnected ? '✅ Connected' : '❌ Not connected'}`));
        console.log(chalk.gray(`  OpenAI: ${status.memory.openaiConnected ? '✅ Connected' : '❌ Not connected'}`));
      }
      
      // Git projects stats
      if (status.gitProjects && !status.gitProjects.error) {
        console.log(chalk.blue('🔗 Git Projects:'));
        console.log(chalk.gray(`  Total projects: ${status.gitProjects.totalProjects}`));
        console.log(chalk.gray(`  Active projects: ${status.gitProjects.activeProjects}`));
        console.log(chalk.gray(`  Total memory: ${status.gitProjects.totalMemoryEntries} entries`));
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
      console.log(chalk.blue('📊 Results available'));
    } else if (result.message) {
      console.log(chalk.gray(result.message));
    }
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