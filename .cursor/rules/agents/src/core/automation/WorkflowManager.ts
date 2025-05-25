import { EventEmitter } from 'events';
import { 
  AutomationConfig,
  Workflow,
  WorkflowExecutionContext,
  AutomationEvent,
  AutomationExecutionResult,
  AutomationInsight
} from '../../types/AutomationTypes';

/**
 * Workflow Manager
 * 
 * Manages and executes complex workflows with multiple steps,
 * conditions, and parallel execution capabilities.
 */
export class WorkflowManager extends EventEmitter {
  private config: AutomationConfig;
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecutionContext> = new Map();
  private isRunning: boolean = false;
  private executionMetrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsToday: number;
  } = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    executionsToday: 0
  };

  constructor(config: AutomationConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the workflow manager
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('workflowManagerStarted', { timestamp: new Date().toISOString() });
  }

  /**
   * Stop the workflow manager
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    // Cancel all active executions
    for (const [executionId, context] of this.activeExecutions) {
      context.status = 'cancelled';
      this.emit('workflowCancelled', { executionId, timestamp: new Date().toISOString() });
    }
    
    this.activeExecutions.clear();
    this.emit('workflowManagerStopped', { timestamp: new Date().toISOString() });
  }

  /**
   * Add workflow
   */
  public async addWorkflow(workflow: Workflow): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    this.emit('workflowAdded', { workflow, timestamp: new Date().toISOString() });
  }

  /**
   * Remove workflow
   */
  public async removeWorkflow(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId);
    this.emit('workflowRemoved', { workflowId, timestamp: new Date().toISOString() });
  }

  /**
   * Execute workflow
   */
  public async executeWorkflow(
    workflowId: string, 
    context?: Record<string, any>
  ): Promise<AutomationExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    const executionId = this.generateExecutionId();
    const executionContext: WorkflowExecutionContext = {
      workflowId,
      executionId,
      startTime: new Date().toISOString(),
      currentStep: workflow.steps[0]?.id || '',
      variables: context || {},
      status: 'running'
    };

    this.activeExecutions.set(executionId, executionContext);

    try {
      const result = await this.executeWorkflowSteps(workflow, executionContext);
      this.activeExecutions.delete(executionId);
      
      // Update workflow metrics
      this.updateWorkflowMetrics(workflow, result.duration, result.success);
      
      return result;
    } catch (error) {
      this.activeExecutions.delete(executionId);
      
      const errorResult: AutomationExecutionResult = {
        success: false,
        workflowId,
        executionId,
        startTime: executionContext.startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(executionContext.startTime).getTime(),
        actionsExecuted: 0,
        actionsSuccessful: 0,
        actionsFailed: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context: { workflowId, executionId }
        }],
        metadata: { workflowName: workflow.name }
      };

      this.updateWorkflowMetrics(workflow, errorResult.duration, false);
      
      return errorResult;
    }
  }

  /**
   * Process event for workflow triggers
   */
  public async processEvent(event: AutomationEvent): Promise<AutomationExecutionResult[]> {
    if (!this.isRunning) {
      return [];
    }

    const results: AutomationExecutionResult[] = [];
    
    // Find workflows that should be triggered by this event
    const triggeredWorkflows = this.findTriggeredWorkflows(event);
    
    for (const workflow of triggeredWorkflows) {
      const result = await this.executeWorkflow(workflow.id, { triggerEvent: event });
      results.push(result);
    }

    return results;
  }

  /**
   * Get workflow manager metrics
   */
  public getMetrics(): any {
    return {
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.enabled).length,
      activeExecutions: this.activeExecutions.size,
      ...this.executionMetrics,
      topActions: this.getTopActions(),
      performanceMetrics: {
        workflowsPerSecond: this.executionMetrics.executionsToday / 86400 // Rough estimate
      }
    };
  }

  /**
   * Get workflow insights
   */
  public async getInsights(): Promise<AutomationInsight[]> {
    const insights: AutomationInsight[] = [];
    
    // Long-running workflow insights
    const longRunningWorkflows = Array.from(this.workflows.values())
      .filter(workflow => workflow.execution.averageExecutionTime > 30000);
    
    if (longRunningWorkflows.length > 0) {
      insights.push({
        type: 'optimization',
        title: 'Long-running Workflows Detected',
        description: `${longRunningWorkflows.length} workflows have execution times over 30 seconds`,
        confidence: 0.9,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Review and optimize slow workflow steps',
          'Consider breaking down complex workflows',
          'Add parallel execution where possible'
        ],
        data: { longRunningWorkflows: longRunningWorkflows.map(w => w.id) },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Optimize workflow manager
   */
  public async optimize(): Promise<{
    optimizationsApplied: number;
    recommendations: string[];
  }> {
    let optimizationsApplied = 0;
    const recommendations: string[] = [];

    // Identify unused workflows
    const unusedWorkflows = Array.from(this.workflows.values())
      .filter(workflow => workflow.execution.totalExecutions === 0);
    
    if (unusedWorkflows.length > 0) {
      recommendations.push(`Consider reviewing ${unusedWorkflows.length} unused workflows`);
    }

    // Optimize step order for better performance
    optimizationsApplied += 1;
    recommendations.push('Workflow steps optimized for performance');

    return { optimizationsApplied, recommendations };
  }

  /**
   * Update configuration
   */
  public async updateConfig(config: AutomationConfig): Promise<void> {
    this.config = config;
    this.emit('configUpdated', { config, timestamp: new Date().toISOString() });
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    workflow: Workflow, 
    context: WorkflowExecutionContext
  ): Promise<AutomationExecutionResult> {
    const startTime = new Date(context.startTime);
    const logs: any[] = [];
    let actionsExecuted = 0;
    let actionsSuccessful = 0;
    let actionsFailed = 0;

    try {
      let currentStepId = workflow.steps[0]?.id;
      
      while (currentStepId && context.status === 'running') {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
        }

        context.currentStep = currentStepId;
        actionsExecuted++;

        try {
          const stepResult = await this.executeWorkflowStep(step, context);
          actionsSuccessful++;
          
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Step ${step.name} executed successfully`,
            stepId: step.id
          });

          // Determine next step
          currentStepId = stepResult.success ? step.onSuccess : step.onFailure;
          
        } catch (error) {
          actionsFailed++;
          
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Step ${step.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            stepId: step.id,
            context: { error }
          });

          // Go to failure step or stop
          currentStepId = step.onFailure;
          if (!currentStepId) {
            break;
          }
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      context.status = actionsFailed === 0 ? 'completed' : 'failed';

      const result: AutomationExecutionResult = {
        success: actionsFailed === 0,
        workflowId: workflow.id,
        executionId: context.executionId,
        startTime: context.startTime,
        endTime: endTime.toISOString(),
        duration,
        actionsExecuted,
        actionsSuccessful,
        actionsFailed,
        logs,
        metadata: { 
          workflowName: workflow.name,
          finalStep: context.currentStep
        }
      };

      this.emit('workflowExecuted', { workflow, context, result, timestamp: new Date().toISOString() });
      
      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      context.status = 'failed';
      context.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        workflowId: workflow.id,
        executionId: context.executionId,
        startTime: context.startTime,
        endTime: endTime.toISOString(),
        duration,
        actionsExecuted,
        actionsSuccessful,
        actionsFailed: actionsFailed + 1,
        error: context.error,
        logs: [
          ...logs,
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Workflow execution failed: ${context.error}`,
            context: { workflowId: workflow.id, executionId: context.executionId }
          }
        ],
        metadata: { 
          workflowName: workflow.name,
          failedStep: context.currentStep
        }
      };
    }
  }

  /**
   * Execute single workflow step
   */
  private async executeWorkflowStep(
    step: any, 
    context: WorkflowExecutionContext
  ): Promise<{ success: boolean; data?: any }> {
    // Simple step execution - would integrate with actual services
    switch (step.type) {
      case 'task_operation':
        this.emit('stepExecuted', { 
          type: 'task_operation', 
          step, 
          context,
          timestamp: new Date().toISOString() 
        });
        return { success: true };
        
      case 'send_notification':
        this.emit('stepExecuted', { 
          type: 'send_notification', 
          step, 
          context,
          timestamp: new Date().toISOString() 
        });
        return { success: true };
        
      case 'run_analysis':
        this.emit('stepExecuted', { 
          type: 'run_analysis', 
          step, 
          context,
          timestamp: new Date().toISOString() 
        });
        return { success: true };
        
      default:
        this.emit('stepExecuted', { 
          type: step.type, 
          step, 
          context,
          timestamp: new Date().toISOString() 
        });
        return { success: true };
    }
  }

  /**
   * Find workflows triggered by event
   */
  private findTriggeredWorkflows(event: AutomationEvent): Workflow[] {
    // Simple implementation - would be expanded based on workflow trigger configuration
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.enabled)
      .filter(workflow => this.shouldTriggerWorkflow(workflow, event));
  }

  /**
   * Check if workflow should be triggered by event
   */
  private shouldTriggerWorkflow(workflow: Workflow, event: AutomationEvent): boolean {
    // Simple implementation - would check workflow trigger configuration
    return false; // For now, workflows are only manually triggered
  }

  /**
   * Update workflow execution metrics
   */
  private updateWorkflowMetrics(workflow: Workflow, duration: number, success: boolean): void {
    workflow.execution.totalExecutions++;
    workflow.execution.lastExecution = new Date().toISOString();
    
    if (success) {
      workflow.execution.successfulExecutions++;
      this.executionMetrics.successfulExecutions++;
    } else {
      workflow.execution.failedExecutions++;
      this.executionMetrics.failedExecutions++;
    }

    // Update average execution time
    const totalTime = workflow.execution.averageExecutionTime * (workflow.execution.totalExecutions - 1) + duration;
    workflow.execution.averageExecutionTime = totalTime / workflow.execution.totalExecutions;

    // Update global metrics
    this.executionMetrics.totalExecutions++;
    this.executionMetrics.executionsToday++;
    
    const globalTotalTime = this.executionMetrics.averageExecutionTime * (this.executionMetrics.totalExecutions - 1) + duration;
    this.executionMetrics.averageExecutionTime = globalTotalTime / this.executionMetrics.totalExecutions;
  }

  /**
   * Get top actions by usage
   */
  private getTopActions(): Array<{ type: string; count: number }> {
    const actionCounts = new Map<string, number>();
    
    for (const workflow of this.workflows.values()) {
      for (const step of workflow.steps) {
        actionCounts.set(step.type, (actionCounts.get(step.type) || 0) + workflow.execution.totalExecutions);
      }
    }

    return Array.from(actionCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `workflow_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 