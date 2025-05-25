#!/usr/bin/env node

/**
 * 🔗 Cursor-AAI Integration Wrapper
 * 
 * Automatically handles task management when working with Cursor
 * - Intercepts user requests and creates task lists
 * - Executes tasks in sequence
 * - Provides structured results
 * - Keeps Cursor working in good direction
 */

const AAITaskManager = require('./aai-task-manager');
const fs = require('fs');
const path = require('path');

class CursorAAIIntegration {
  constructor() {
    this.taskManager = new AAITaskManager();
    this.integrationDir = 'agents/_store/cursor-summaries';
    this.version = '1.0.0';
    this.isActive = false;
  }

  /**
   * Initialize the integration
   */
  async initialize() {
    console.log('🔗 Cursor-AAI Integration v' + this.version);
    console.log('━'.repeat(50));

    await this.taskManager.initialize();
    await this.setupIntegration();
    
    this.isActive = true;
    console.log('✅ Cursor-AAI Integration active');
  }

  /**
   * Setup integration files and monitoring
   */
  async setupIntegration() {
    // Create integration status file
    const statusFile = path.join(this.integrationDir, 'cursor-aai-status.json');
    const status = {
      active: true,
      version: this.version,
      initialized: new Date().toISOString(),
      features: {
        autoTaskCreation: true,
        taskExecution: true,
        resultCompilation: true,
        contextAwareness: true
      }
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }

  /**
   * Main handler for user requests
   */
  async handleUserRequest(userRequest, context = {}) {
    console.log('\n🎯 Processing user request through AAI Task Manager...');
    console.log(`Request: "${userRequest}"`);

    try {
      // Ensure task manager is initialized
      if (!this.taskManager.taskState) {
        await this.taskManager.initialize();
      }

      // Step 1: Analyze and create tasks
      const taskAnalysis = await this.taskManager.analyzeAndCreateTasks(userRequest, context);
      
      console.log(`\n📋 Created ${taskAnalysis.totalTasks} tasks for execution`);
      this.displayTaskList(taskAnalysis.tasks);

      // Step 2: Execute tasks
      console.log('\n🚀 Executing tasks...');
      const results = await this.taskManager.executeTaskSession(taskAnalysis.sessionId);

      // Step 3: Compile and present results
      const finalResults = await this.compileResults(results, userRequest);
      
      console.log('\n🎉 Request completed successfully!');
      this.displayResults(finalResults);

      return finalResults;

    } catch (error) {
      console.error('❌ Error processing request:', error.message);
      return {
        success: false,
        error: error.message,
        userRequest: userRequest
      };
    }
  }

  /**
   * Display task list in a user-friendly format
   */
  displayTaskList(tasks) {
    console.log('\n📋 Task List:');
    console.log('━'.repeat(40));
    
    tasks.forEach((task, index) => {
      const priority = task.priority === 'high' ? '🔴' : 
                      task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${index + 1}. ${priority} ${task.title}`);
      console.log(`   Type: ${task.type} | Category: ${task.category}`);
      console.log(`   Estimated: ${task.estimatedTime}min | Priority: ${task.priority}`);
      console.log('');
    });
  }

  /**
   * Compile results into a structured format
   */
  async compileResults(results, originalRequest) {
    const compiledResults = {
      originalRequest: originalRequest,
      sessionId: results.sessionId,
      success: results.summary.successRate === '100.0%',
      summary: {
        totalTasks: results.summary.totalTasks,
        completedTasks: results.summary.completedTasks,
        failedTasks: results.summary.failedTasks,
        successRate: results.summary.successRate,
        duration: results.timeline.duration
      },
      deliverables: this.extractDeliverables(results),
      insights: this.generateInsights(results),
      recommendations: results.recommendations,
      nextSteps: results.nextSteps,
      timestamp: new Date().toISOString()
    };

    // Save compiled results
    await this.saveCompiledResults(compiledResults);

    return compiledResults;
  }

  /**
   * Extract deliverables from task results
   */
  extractDeliverables(results) {
    const deliverables = [];
    
    results.taskResults.forEach(taskResult => {
      if (taskResult.status === 'completed') {
        deliverables.push({
          task: taskResult.title,
          type: taskResult.metadata.type,
          output: taskResult.output,
          validation: taskResult.validation
        });
      }
    });

    return deliverables;
  }

  /**
   * Generate insights from task execution
   */
  generateInsights(results) {
    const insights = [];
    
    // Performance insights
    if (results.summary.successRate === '100.0%') {
      insights.push('All tasks completed successfully - excellent execution');
    } else if (parseFloat(results.summary.successRate) > 80) {
      insights.push('Most tasks completed successfully - minor issues encountered');
    } else {
      insights.push('Significant issues encountered - review failed tasks');
    }

    // Time insights
    const duration = results.timeline.duration;
    if (duration.includes('m')) {
      const minutes = parseInt(duration.split('m')[0]);
      if (minutes < 5) {
        insights.push('Quick execution - simple request handled efficiently');
      } else if (minutes < 15) {
        insights.push('Standard execution time - moderate complexity handled well');
      } else {
        insights.push('Extended execution time - complex request required thorough processing');
      }
    }

    return insights;
  }

  /**
   * Save compiled results
   */
  async saveCompiledResults(results) {
    const resultsFile = path.join(this.integrationDir, `request-results-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    // Update latest results
    const latestFile = path.join(this.integrationDir, 'latest-request-results.json');
    fs.writeFileSync(latestFile, JSON.stringify(results, null, 2));
  }

  /**
   * Display results in a user-friendly format
   */
  displayResults(results) {
    console.log('\n🎉 RESULTS SUMMARY');
    console.log('━'.repeat(50));
    console.log(`📝 Original Request: "${results.originalRequest}"`);
    console.log(`✅ Success Rate: ${results.summary.successRate}`);
    console.log(`⏱️  Duration: ${results.summary.duration}`);
    console.log(`📊 Tasks: ${results.summary.completedTasks}/${results.summary.totalTasks} completed`);
    
    if (results.deliverables.length > 0) {
      console.log('\n📦 DELIVERABLES:');
      results.deliverables.forEach((deliverable, index) => {
        console.log(`${index + 1}. ${deliverable.task}`);
        console.log(`   Type: ${deliverable.type}`);
        console.log(`   Output: ${deliverable.output}`);
      });
    }

    if (results.insights.length > 0) {
      console.log('\n💡 INSIGHTS:');
      results.insights.forEach(insight => {
        console.log(`• ${insight}`);
      });
    }

    if (results.recommendations.length > 0) {
      console.log('\n🔍 RECOMMENDATIONS:');
      results.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });
    }

    if (results.nextSteps.length > 0) {
      console.log('\n🚀 NEXT STEPS:');
      results.nextSteps.forEach(step => {
        console.log(`• ${step}`);
      });
    }
  }

  /**
   * Auto-manage tasks based on current context
   */
  async autoManage(context = {}) {
    if (!this.isActive) {
      await this.initialize();
    }

    console.log('🔄 Auto-managing AAI tasks...');
    
    // Get current Cursor context
    const cursorContext = await this.getCursorContext();
    
    // Merge with provided context
    const fullContext = { ...cursorContext, ...context };
    
    // Auto-manage tasks
    await this.taskManager.autoManageTasks(fullContext);
    
    console.log('✅ Auto-management completed');
  }

  /**
   * Get current Cursor context
   */
  async getCursorContext() {
    const context = {
      timestamp: new Date().toISOString(),
      workspaceFiles: [],
      recentChanges: [],
      activeProjects: []
    };

    try {
      // Read workspace context if available
      const workspaceContextFile = path.join(this.integrationDir, 'workspace-context.json');
      if (fs.existsSync(workspaceContextFile)) {
        const workspaceContext = JSON.parse(fs.readFileSync(workspaceContextFile, 'utf8'));
        context.workspace = workspaceContext;
      }

      // Read latest insights if available
      const insightsFile = path.join(this.integrationDir, 'latest-insights.json');
      if (fs.existsSync(insightsFile)) {
        const insights = JSON.parse(fs.readFileSync(insightsFile, 'utf8'));
        context.insights = insights;
      }
    } catch (error) {
      console.warn('⚠️ Could not load full Cursor context:', error.message);
    }

    return context;
  }

  /**
   * Quick request handler for simple commands
   */
  async quickRequest(request) {
    console.log(`⚡ Quick request: "${request}"`);
    
    // For simple requests, create and execute immediately
    const result = await this.handleUserRequest(request);
    
    return result;
  }

  /**
   * Batch request handler for multiple requests
   */
  async batchRequest(requests) {
    console.log(`📦 Batch processing ${requests.length} requests...`);
    
    const results = [];
    
    for (let i = 0; i < requests.length; i++) {
      console.log(`\n🔄 Processing request ${i + 1}/${requests.length}`);
      const result = await this.handleUserRequest(requests[i]);
      results.push(result);
    }
    
    // Compile batch results
    const batchResults = {
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      results: results,
      timestamp: new Date().toISOString()
    };
    
    console.log(`\n🎉 Batch completed: ${batchResults.successfulRequests}/${batchResults.totalRequests} successful`);
    
    return batchResults;
  }

  /**
   * CLI interface
   */
  static async handleCommand(command, args) {
    const integration = new CursorAAIIntegration();

    switch (command) {
      case 'init':
        await integration.initialize();
        break;

      case 'request':
        const userRequest = args.join(' ');
        if (!userRequest) {
          console.log('❌ Please provide a request');
          return;
        }
        await integration.handleUserRequest(userRequest);
        break;

      case 'quick':
        const quickRequest = args.join(' ');
        if (!quickRequest) {
          console.log('❌ Please provide a quick request');
          return;
        }
        await integration.quickRequest(quickRequest);
        break;

      case 'auto-manage':
        await integration.autoManage();
        break;

      case 'status':
        const statusFile = path.join('agents/_store/cursor-summaries', 'cursor-aai-status.json');
        if (fs.existsSync(statusFile)) {
          const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          console.log('📊 Cursor-AAI Integration Status:');
          console.log(`Active: ${status.active ? '✅' : '❌'}`);
          console.log(`Version: ${status.version}`);
          console.log(`Initialized: ${status.initialized}`);
          console.log('Features:', status.features);
        } else {
          console.log('❌ Integration not initialized');
        }
        break;

      default:
        console.log('❌ Unknown command. Available: init, request, quick, auto-manage, status');
    }
  }
}

// CLI execution
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  
  if (!command) {
    console.log('🔗 Cursor-AAI Integration');
    console.log('Commands:');
    console.log('  init                    - Initialize integration');
    console.log('  request <text>          - Process user request');
    console.log('  quick <text>            - Quick request processing');
    console.log('  auto-manage             - Auto-manage tasks');
    console.log('  status                  - Show integration status');
  } else {
    CursorAAIIntegration.handleCommand(command, args);
  }
}

module.exports = CursorAAIIntegration; 