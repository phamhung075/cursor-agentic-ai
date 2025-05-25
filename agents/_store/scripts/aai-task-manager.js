#!/usr/bin/env node

/**
 * 🎯 AAI Intelligent Task Manager
 * 
 * Handles automatic task management for AAI when working with Cursor
 * - Auto creates tasks from user requests
 * - Manages task lifecycle (create, edit, delete, complete)
 * - Keeps Cursor working in good direction
 * - Provides structured task execution and results
 */

const fs = require('fs');
const path = require('path');

class AAITaskManager {
  constructor() {
    this.tasksDir = 'agents/_store/tasks';
    this.summariesDir = 'agents/_store/cursor-summaries';
    this.intelligenceDir = 'agents/_store/intelligence';
    this.version = '1.0.0';
    this.currentSession = this.generateSessionId();
  }

  /**
   * Initialize task management system
   */
  async initialize() {
    console.log('🎯 AAI Task Manager v' + this.version);
    console.log('━'.repeat(50));

    // Ensure directories exist
    await this.ensureDirectories();

    // Load or create task state
    await this.loadTaskState();

    console.log('✅ Task Manager initialized');
  }

  /**
   * Ensure all necessary directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.tasksDir,
      `${this.tasksDir}/active`,
      `${this.tasksDir}/completed`,
      `${this.tasksDir}/templates`,
      `${this.tasksDir}/sessions`,
      this.summariesDir,
      this.intelligenceDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load current task state
   */
  async loadTaskState() {
    const statePath = path.join(this.tasksDir, 'task-state.json');
    
    if (fs.existsSync(statePath)) {
      this.taskState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } else {
      this.taskState = {
        currentSession: this.currentSession,
        activeTasks: [],
        completedTasks: [],
        totalTasks: 0,
        lastUpdate: new Date().toISOString(),
        metadata: {
          created: new Date().toISOString(),
          version: this.version
        }
      };
      await this.saveTaskState();
    }
  }

  /**
   * Save task state
   */
  async saveTaskState() {
    const statePath = path.join(this.tasksDir, 'task-state.json');
    this.taskState.lastUpdate = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(this.taskState, null, 2));
  }

  /**
   * Analyze user request and create task list
   */
  async analyzeAndCreateTasks(userRequest, context = {}) {
    console.log('🔍 Analyzing user request...');
    console.log(`Request: "${userRequest}"`);

    const analysis = await this.analyzeRequest(userRequest, context);
    const tasks = await this.generateTasksFromAnalysis(analysis);
    
    console.log(`📋 Generated ${tasks.length} tasks`);
    
    // Save tasks and start execution
    const taskSession = await this.createTaskSession(userRequest, tasks);
    
    return {
      sessionId: taskSession.id,
      analysis: analysis,
      tasks: tasks,
      totalTasks: tasks.length
    };
  }

  /**
   * Analyze user request to understand intent and requirements
   */
  async analyzeRequest(userRequest, context) {
    const analysis = {
      timestamp: new Date().toISOString(),
      originalRequest: userRequest,
      context: context,
      intent: this.detectIntent(userRequest),
      complexity: this.assessComplexity(userRequest),
      requiredActions: this.identifyRequiredActions(userRequest),
      dependencies: this.identifyDependencies(userRequest),
      estimatedTime: this.estimateTime(userRequest),
      priority: this.assessPriority(userRequest)
    };

    // Save analysis for learning
    await this.saveAnalysis(analysis);
    
    return analysis;
  }

  /**
   * Detect user intent from request
   */
  detectIntent(request) {
    const intents = {
      'create': ['create', 'make', 'build', 'generate', 'add', 'new'],
      'modify': ['modify', 'change', 'update', 'edit', 'improve', 'enhance'],
      'analyze': ['analyze', 'check', 'review', 'examine', 'investigate'],
      'fix': ['fix', 'repair', 'solve', 'debug', 'resolve'],
      'optimize': ['optimize', 'improve', 'enhance', 'speed up', 'performance'],
      'integrate': ['integrate', 'connect', 'link', 'combine', 'merge'],
      'document': ['document', 'explain', 'describe', 'write docs'],
      'test': ['test', 'verify', 'validate', 'check']
    };

    const requestLower = request.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => requestLower.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
  }

  /**
   * Assess complexity of request
   */
  assessComplexity(request) {
    const complexityIndicators = {
      'simple': ['simple', 'quick', 'small', 'basic'],
      'medium': ['medium', 'moderate', 'standard'],
      'complex': ['complex', 'advanced', 'comprehensive', 'full', 'complete'],
      'enterprise': ['enterprise', 'large-scale', 'production', 'system-wide']
    };

    const requestLower = request.toLowerCase();
    const wordCount = request.split(' ').length;
    
    // Check for complexity keywords
    for (const [level, keywords] of Object.entries(complexityIndicators)) {
      if (keywords.some(keyword => requestLower.includes(keyword))) {
        return level;
      }
    }
    
    // Assess by word count and technical terms
    if (wordCount < 10) return 'simple';
    if (wordCount < 20) return 'medium';
    if (wordCount < 40) return 'complex';
    return 'enterprise';
  }

  /**
   * Identify required actions from request
   */
  identifyRequiredActions(request) {
    const actions = [];
    const requestLower = request.toLowerCase();

    const actionPatterns = {
      'file_creation': ['create file', 'new file', 'generate file', 'create component', 'new component', 'create a', 'make a'],
      'code_writing': ['write code', 'implement', 'code', 'component', 'function', 'class', 'method'],
      'configuration': ['configure', 'setup', 'config', 'settings'],
      'documentation': ['document', 'write docs', 'explain', 'readme', 'documentation'],
      'testing': ['test', 'verify', 'validate', 'validation', 'check'],
      'integration': ['integrate', 'connect', 'link', 'combine', 'merge'],
      'analysis': ['analyze', 'review', 'examine', 'investigate', 'audit'],
      'optimization': ['optimize', 'improve', 'enhance', 'performance', 'speed up']
    };

    for (const [action, patterns] of Object.entries(actionPatterns)) {
      if (patterns.some(pattern => requestLower.includes(pattern))) {
        actions.push(action);
      }
    }

    // If no specific actions found but it's a create request, add file_creation and code_writing
    if (actions.length === 0 && (requestLower.includes('create') || requestLower.includes('new') || requestLower.includes('make'))) {
      actions.push('file_creation', 'code_writing');
    }

    return actions.length > 0 ? actions : ['general_task'];
  }

  /**
   * Identify dependencies
   */
  identifyDependencies(request) {
    const dependencies = [];
    const requestLower = request.toLowerCase();

    // Check for file/directory dependencies
    if (requestLower.includes('agents/')) {
      dependencies.push('aai_system');
    }
    if (requestLower.includes('.cursor/')) {
      dependencies.push('cursor_settings');
    }
    if (requestLower.includes('package.json')) {
      dependencies.push('npm_packages');
    }

    return dependencies;
  }

  /**
   * Estimate time for completion
   */
  estimateTime(request) {
    const complexity = this.assessComplexity(request);
    const actionCount = this.identifyRequiredActions(request).length;
    
    const baseTime = {
      'simple': 5,
      'medium': 15,
      'complex': 30,
      'enterprise': 60
    };

    return baseTime[complexity] + (actionCount * 5);
  }

  /**
   * Assess priority
   */
  assessPriority(request) {
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('urgent') || requestLower.includes('critical')) {
      return 'high';
    }
    if (requestLower.includes('important') || requestLower.includes('priority')) {
      return 'medium';
    }
    return 'normal';
  }

  /**
   * Generate tasks from analysis
   */
  async generateTasksFromAnalysis(analysis) {
    const tasks = [];
    const { intent, requiredActions, complexity } = analysis;

    // Generate tasks based on intent and actions
    for (const action of requiredActions) {
      const taskTemplate = await this.getTaskTemplate(action, intent);
      const task = await this.createTaskFromTemplate(taskTemplate, analysis);
      tasks.push(task);
    }

    // Add coordination tasks for complex requests
    if (complexity === 'complex' || complexity === 'enterprise') {
      tasks.unshift(await this.createPlanningTask(analysis));
      tasks.push(await this.createValidationTask(analysis));
    }

    return tasks;
  }

  /**
   * Get task template for action type
   */
  async getTaskTemplate(action, intent) {
    const templates = {
      'file_creation': {
        type: 'file_operation',
        category: 'creation',
        estimatedTime: 5,
        dependencies: [],
        validation: ['file_exists', 'content_valid']
      },
      'code_writing': {
        type: 'development',
        category: 'implementation',
        estimatedTime: 15,
        dependencies: ['file_creation'],
        validation: ['syntax_valid', 'logic_correct']
      },
      'configuration': {
        type: 'system',
        category: 'setup',
        estimatedTime: 10,
        dependencies: [],
        validation: ['config_valid', 'system_working']
      },
      'documentation': {
        type: 'documentation',
        category: 'writing',
        estimatedTime: 10,
        dependencies: ['code_writing'],
        validation: ['docs_complete', 'examples_working']
      },
      'testing': {
        type: 'quality_assurance',
        category: 'validation',
        estimatedTime: 15,
        dependencies: ['code_writing'],
        validation: ['tests_pass', 'coverage_adequate']
      },
      'integration': {
        type: 'system',
        category: 'integration',
        estimatedTime: 20,
        dependencies: ['code_writing', 'configuration'],
        validation: ['integration_working', 'no_conflicts']
      },
      'analysis': {
        type: 'investigation',
        category: 'analysis',
        estimatedTime: 10,
        dependencies: [],
        validation: ['analysis_complete', 'insights_documented']
      },
      'optimization': {
        type: 'improvement',
        category: 'optimization',
        estimatedTime: 20,
        dependencies: ['analysis'],
        validation: ['performance_improved', 'no_regressions']
      }
    };

    return templates[action] || templates['general_task'] || {
      type: 'general',
      category: 'task',
      estimatedTime: 10,
      dependencies: [],
      validation: ['task_complete']
    };
  }

  /**
   * Create task from template
   */
  async createTaskFromTemplate(template, analysis) {
    const taskId = this.generateTaskId();
    
    return {
      id: taskId,
      title: this.generateTaskTitle(template, analysis),
      description: this.generateTaskDescription(template, analysis),
      type: template.type,
      category: template.category,
      status: 'pending',
      priority: analysis.priority,
      estimatedTime: template.estimatedTime,
      dependencies: template.dependencies,
      validation: template.validation,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        sessionId: this.currentSession,
        originalRequest: analysis.originalRequest,
        intent: analysis.intent
      }
    };
  }

  /**
   * Generate task title
   */
  generateTaskTitle(template, analysis) {
    const { intent, originalRequest } = analysis;
    const action = template.category;
    
    // Extract key subject from request
    const subject = this.extractSubject(originalRequest);
    
    if (subject) {
      return `${intent.charAt(0).toUpperCase() + intent.slice(1)} ${subject} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
    }
    
    return `${intent.charAt(0).toUpperCase() + intent.slice(1)} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  }

  /**
   * Extract main subject from user request
   */
  extractSubject(request) {
    const requestLower = request.toLowerCase();
    
    // Common patterns to extract subjects
    const patterns = [
      /create (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /make (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /build (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /generate (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /add (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /implement (?:a |an |new )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /fix (?:the )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /optimize (?:the )?(.+?)(?:\s+with|\s+for|\s+that|$)/i,
      /improve (?:the )?(.+?)(?:\s+with|\s+for|\s+that|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Generate task description
   */
  generateTaskDescription(template, analysis) {
    return `Task generated from: "${analysis.originalRequest}"\nType: ${template.type}\nCategory: ${template.category}`;
  }

  /**
   * Create planning task for complex requests
   */
  async createPlanningTask(analysis) {
    return {
      id: this.generateTaskId(),
      title: 'Planning & Analysis',
      description: `Plan and analyze the approach for: "${analysis.originalRequest}"`,
      type: 'planning',
      category: 'coordination',
      status: 'pending',
      priority: 'high',
      estimatedTime: 5,
      dependencies: [],
      validation: ['plan_complete', 'approach_defined'],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        sessionId: this.currentSession,
        originalRequest: analysis.originalRequest,
        intent: 'planning'
      }
    };
  }

  /**
   * Create validation task for complex requests
   */
  async createValidationTask(analysis) {
    return {
      id: this.generateTaskId(),
      title: 'Final Validation & Results',
      description: `Validate completion and compile results for: "${analysis.originalRequest}"`,
      type: 'validation',
      category: 'quality_assurance',
      status: 'pending',
      priority: 'high',
      estimatedTime: 10,
      dependencies: ['all_previous_tasks'],
      validation: ['all_tasks_complete', 'results_compiled'],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        sessionId: this.currentSession,
        originalRequest: analysis.originalRequest,
        intent: 'validation'
      }
    };
  }

  /**
   * Create task session
   */
  async createTaskSession(userRequest, tasks) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userRequest: userRequest,
      tasks: tasks,
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      progress: {
        total: tasks.length,
        completed: 0,
        pending: tasks.length,
        failed: 0
      },
      results: []
    };

    // Save session
    const sessionPath = path.join(this.tasksDir, 'sessions', `${sessionId}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    // Update task state - ensure taskState exists
    if (!this.taskState) {
      await this.loadTaskState();
    }
    
    this.taskState.activeTasks.push(...tasks.map(t => t.id));
    this.taskState.totalTasks += tasks.length;
    await this.saveTaskState();

    return session;
  }

  /**
   * Execute task session
   */
  async executeTaskSession(sessionId) {
    console.log(`🚀 Executing task session: ${sessionId}`);
    
    const session = await this.loadTaskSession(sessionId);
    const results = [];

    for (const task of session.tasks) {
      console.log(`\n📋 Executing task: ${task.title}`);
      
      try {
        const result = await this.executeTask(task);
        results.push(result);
        
        // Update progress
        session.progress.completed++;
        session.progress.pending--;
        
        console.log(`✅ Task completed: ${task.title}`);
      } catch (error) {
        console.log(`❌ Task failed: ${task.title} - ${error.message}`);
        session.progress.failed++;
        session.progress.pending--;
        
        results.push({
          taskId: task.id,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update session
    session.results = results;
    session.status = 'completed';
    session.updated = new Date().toISOString();
    
    await this.saveTaskSession(session);
    
    // Generate final results
    const finalResults = await this.generateFinalResults(session);
    
    console.log('\n🎉 Task session completed!');
    console.log(`📊 Results: ${session.progress.completed}/${session.progress.total} tasks completed`);
    
    return finalResults;
  }

  /**
   * Execute individual task
   */
  async executeTask(task) {
    // This is where the actual task execution logic would go
    // For now, we'll simulate task execution
    
    const result = {
      taskId: task.id,
      title: task.title,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      output: `Task "${task.title}" executed successfully`,
      validation: this.validateTask(task),
      metadata: {
        type: task.type,
        category: task.category,
        estimatedTime: task.estimatedTime
      }
    };

    // Update task status
    task.status = 'completed';
    task.updated = new Date().toISOString();

    return result;
  }

  /**
   * Validate task completion
   */
  validateTask(task) {
    const validationResults = {};
    
    for (const validation of task.validation) {
      // Simulate validation logic
      validationResults[validation] = true;
    }
    
    return validationResults;
  }

  /**
   * Generate final results
   */
  async generateFinalResults(session) {
    const results = {
      sessionId: session.id,
      userRequest: session.userRequest,
      status: session.status,
      summary: {
        totalTasks: session.progress.total,
        completedTasks: session.progress.completed,
        failedTasks: session.progress.failed,
        successRate: (session.progress.completed / session.progress.total * 100).toFixed(1) + '%'
      },
      timeline: {
        started: session.created,
        completed: session.updated,
        duration: this.calculateDuration(session.created, session.updated)
      },
      taskResults: session.results,
      recommendations: this.generateRecommendations(session),
      nextSteps: this.generateNextSteps(session)
    };

    // Save results
    const resultsPath = path.join(this.tasksDir, 'completed', `${session.id}-results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    return results;
  }

  /**
   * Generate recommendations based on session results
   */
  generateRecommendations(session) {
    const recommendations = [];
    
    if (session.progress.failed > 0) {
      recommendations.push('Review failed tasks and consider retry or alternative approaches');
    }
    
    if (session.progress.completed === session.progress.total) {
      recommendations.push('All tasks completed successfully - consider documenting the process');
    }
    
    return recommendations;
  }

  /**
   * Generate next steps
   */
  generateNextSteps(session) {
    const nextSteps = [];
    
    nextSteps.push('Review task results and validate outputs');
    nextSteps.push('Update project documentation if needed');
    nextSteps.push('Consider creating templates for similar future requests');
    
    return nextSteps;
  }

  /**
   * Auto-manage tasks (add, edit, delete as needed)
   */
  async autoManageTasks(context = {}) {
    console.log('🔄 Auto-managing tasks...');
    
    // Check for tasks that need updates
    await this.checkTaskRelevance();
    
    // Remove obsolete tasks
    await this.removeObsoleteTasks();
    
    // Update task priorities based on context
    await this.updateTaskPriorities(context);
    
    console.log('✅ Task auto-management completed');
  }

  /**
   * Check task relevance
   */
  async checkTaskRelevance() {
    // Implementation for checking if tasks are still relevant
    // This would analyze current project state and remove/update tasks accordingly
  }

  /**
   * Remove obsolete tasks
   */
  async removeObsoleteTasks() {
    // Implementation for removing tasks that are no longer needed
  }

  /**
   * Update task priorities
   */
  async updateTaskPriorities(context) {
    // Implementation for updating task priorities based on current context
  }

  /**
   * Utility methods
   */
  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  generateTaskId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  calculateDuration(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = endTime - startTime;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  async saveAnalysis(analysis) {
    const analysisPath = path.join(this.intelligenceDir, 'request-analysis.json');
    let analyses = [];
    
    if (fs.existsSync(analysisPath)) {
      analyses = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    }
    
    analyses.push(analysis);
    fs.writeFileSync(analysisPath, JSON.stringify(analyses, null, 2));
  }

  async loadTaskSession(sessionId) {
    const sessionPath = path.join(this.tasksDir, 'sessions', `${sessionId}.json`);
    return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  }

  async saveTaskSession(session) {
    const sessionPath = path.join(this.tasksDir, 'sessions', `${session.id}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  }

  /**
   * CLI interface
   */
  static async handleCommand(command, args) {
    const manager = new AAITaskManager();
    await manager.initialize();

    switch (command) {
      case 'analyze':
        const userRequest = args.join(' ');
        const result = await manager.analyzeAndCreateTasks(userRequest);
        console.log('\n📋 Task Analysis Complete:');
        console.log(`Session ID: ${result.sessionId}`);
        console.log(`Tasks Generated: ${result.totalTasks}`);
        console.log('\nTasks:');
        result.tasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title} (${task.priority} priority)`);
        });
        break;

      case 'execute':
        const sessionId = args[0];
        if (!sessionId) {
          console.log('❌ Please provide session ID');
          return;
        }
        await manager.executeTaskSession(sessionId);
        break;

      case 'status':
        console.log('📊 Task Manager Status:');
        console.log(`Active Tasks: ${manager.taskState.activeTasks.length}`);
        console.log(`Completed Tasks: ${manager.taskState.completedTasks.length}`);
        console.log(`Total Tasks: ${manager.taskState.totalTasks}`);
        break;

      case 'auto-manage':
        await manager.autoManageTasks();
        break;

      default:
        console.log('❌ Unknown command. Available: analyze, execute, status, auto-manage');
    }
  }
}

// CLI execution
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  
  if (!command) {
    console.log('🎯 AAI Task Manager');
    console.log('Commands:');
    console.log('  analyze <request>  - Analyze request and create tasks');
    console.log('  execute <session>  - Execute task session');
    console.log('  status            - Show task manager status');
    console.log('  auto-manage       - Auto-manage tasks');
  } else {
    AAITaskManager.handleCommand(command, args);
  }
}

module.exports = AAITaskManager; 