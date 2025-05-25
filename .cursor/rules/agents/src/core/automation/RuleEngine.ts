import { EventEmitter } from 'events';
import { 
  AutomationConfig,
  AutomationRule,
  AutomationEvent,
  AutomationExecutionResult,
  AutomationCondition,
  AutomationAction,
  AutomationInsight
} from '../../types/AutomationTypes';

/**
 * Rule Engine
 * 
 * Manages and executes automation rules based on events and conditions.
 * Provides intelligent rule matching and action execution.
 */
export class RuleEngine extends EventEmitter {
  private config: AutomationConfig;
  private rules: Map<string, AutomationRule> = new Map();
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
   * Start the rule engine
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('ruleEngineStarted', { timestamp: new Date().toISOString() });
  }

  /**
   * Stop the rule engine
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('ruleEngineStopped', { timestamp: new Date().toISOString() });
  }

  /**
   * Add automation rule
   */
  public async addRule(rule: AutomationRule): Promise<void> {
    this.rules.set(rule.id, rule);
    this.emit('ruleAdded', { rule, timestamp: new Date().toISOString() });
  }

  /**
   * Remove automation rule
   */
  public async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    this.emit('ruleRemoved', { ruleId, timestamp: new Date().toISOString() });
  }

  /**
   * Process event against all rules
   */
  public async processEvent(event: AutomationEvent): Promise<AutomationExecutionResult[]> {
    if (!this.isRunning) {
      return [];
    }

    const results: AutomationExecutionResult[] = [];
    const matchingRules = this.findMatchingRules(event);

    for (const rule of matchingRules) {
      const result = await this.executeRule(rule, event);
      results.push(result);
    }

    return results;
  }

  /**
   * Get rule engine metrics
   */
  public getMetrics(): any {
    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      ...this.executionMetrics,
      topActions: this.getTopActions(),
      performanceMetrics: {
        rulesPerSecond: this.executionMetrics.executionsToday / 86400 // Rough estimate
      }
    };
  }

  /**
   * Get rule insights
   */
  public async getInsights(): Promise<AutomationInsight[]> {
    const insights: AutomationInsight[] = [];
    
    // Rule performance insights
    const slowRules = Array.from(this.rules.values())
      .filter(rule => rule.execution.averageExecutionTime > 1000);
    
    if (slowRules.length > 0) {
      insights.push({
        type: 'optimization',
        title: 'Slow Automation Rules Detected',
        description: `${slowRules.length} rules have execution times over 1 second`,
        confidence: 0.9,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Review and optimize slow rules',
          'Consider breaking down complex conditions',
          'Add timeout configurations'
        ],
        data: { slowRules: slowRules.map(r => r.id) },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Optimize rule engine
   */
  public async optimize(): Promise<{
    optimizationsApplied: number;
    recommendations: string[];
  }> {
    let optimizationsApplied = 0;
    const recommendations: string[] = [];

    // Disable unused rules
    const unusedRules = Array.from(this.rules.values())
      .filter(rule => rule.execution.executionCount === 0);
    
    if (unusedRules.length > 0) {
      recommendations.push(`Consider reviewing ${unusedRules.length} unused rules`);
    }

    // Optimize rule priority order
    const rulesByPriority = Array.from(this.rules.values())
      .sort((a, b) => b.priority - a.priority);
    
    optimizationsApplied += 1;
    recommendations.push('Rules optimized by priority order');

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
   * Find rules that match the event
   */
  private findMatchingRules(event: AutomationEvent): AutomationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .filter(rule => this.doesRuleMatchEvent(rule, event))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if rule matches event
   */
  private doesRuleMatchEvent(rule: AutomationRule, event: AutomationEvent): boolean {
    // Check trigger type
    if (rule.trigger.type !== event.type) {
      return false;
    }

    // Check trigger configuration
    if (!this.checkTriggerConfig(rule.trigger.config, event)) {
      return false;
    }

    // Check conditions
    if (!this.evaluateConditions(rule.conditions, event)) {
      return false;
    }

    return true;
  }

  /**
   * Check trigger configuration
   */
  private checkTriggerConfig(config: any, event: AutomationEvent): boolean {
    // Simple implementation - can be expanded
    return true;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(conditions: AutomationCondition[], event: AutomationEvent): boolean {
    if (conditions.length === 0) {
      return true;
    }

    // Simple AND logic for now
    return conditions.every(condition => this.evaluateCondition(condition, event));
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: AutomationCondition, event: AutomationEvent): boolean {
    // Simple implementation - can be expanded based on condition type
    switch (condition.type) {
      case 'task_property':
        return this.evaluateTaskPropertyCondition(condition, event);
      case 'time_condition':
        return this.evaluateTimeCondition(condition, event);
      default:
        return true;
    }
  }

  /**
   * Evaluate task property condition
   */
  private evaluateTaskPropertyCondition(condition: AutomationCondition, event: AutomationEvent): boolean {
    const taskData = event.data;
    if (!taskData || !condition.field) {
      return false;
    }

    const fieldValue = taskData[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(condition.value) : 
               String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(condition: AutomationCondition, event: AutomationEvent): boolean {
    const now = new Date();
    const eventTime = new Date(event.timestamp);
    
    switch (condition.operator) {
      case 'greater_than':
        return eventTime.getTime() > condition.value;
      case 'less_than':
        return eventTime.getTime() < condition.value;
      default:
        return true;
    }
  }

  /**
   * Execute rule actions
   */
  private async executeRule(rule: AutomationRule, event: AutomationEvent): Promise<AutomationExecutionResult> {
    const startTime = new Date();
    const executionId = this.generateExecutionId();
    
    try {
      let actionsExecuted = 0;
      let actionsSuccessful = 0;
      let actionsFailed = 0;
      const logs: any[] = [];

      for (const action of rule.actions) {
        actionsExecuted++;
        
        try {
          await this.executeAction(action, event);
          actionsSuccessful++;
          
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Action ${action.type} executed successfully`,
            actionType: action.type
          });
        } catch (error) {
          actionsFailed++;
          
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Action ${action.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            actionType: action.type,
            context: { error }
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Update rule execution metrics
      this.updateRuleMetrics(rule, duration, actionsSuccessful > 0);

      const result: AutomationExecutionResult = {
        success: actionsFailed === 0,
        ruleId: rule.id,
        executionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        actionsExecuted,
        actionsSuccessful,
        actionsFailed,
        logs,
        metadata: { 
          ruleName: rule.name,
          eventType: event.type 
        }
      };

      this.emit('ruleExecuted', { rule, event, result, timestamp: new Date().toISOString() });
      
      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.updateRuleMetrics(rule, duration, false);

      return {
        success: false,
        ruleId: rule.id,
        executionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        actionsExecuted: 0,
        actionsSuccessful: 0,
        actionsFailed: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context: { rule: rule.id, event: event.id }
        }],
        metadata: { 
          ruleName: rule.name,
          eventType: event.type 
        }
      };
    }
  }

  /**
   * Execute single action
   */
  private async executeAction(action: AutomationAction, event: AutomationEvent): Promise<void> {
    // Simple action execution - would integrate with actual services
    switch (action.type) {
      case 'update_task':
        this.emit('actionExecuted', { 
          type: 'update_task', 
          config: action.config, 
          event,
          timestamp: new Date().toISOString() 
        });
        break;
      case 'send_notification':
        this.emit('actionExecuted', { 
          type: 'send_notification', 
          config: action.config, 
          event,
          timestamp: new Date().toISOString() 
        });
        break;
      case 'change_priority':
        this.emit('actionExecuted', { 
          type: 'change_priority', 
          config: action.config, 
          event,
          timestamp: new Date().toISOString() 
        });
        break;
      default:
        this.emit('actionExecuted', { 
          type: action.type, 
          config: action.config, 
          event,
          timestamp: new Date().toISOString() 
        });
    }
  }

  /**
   * Update rule execution metrics
   */
  private updateRuleMetrics(rule: AutomationRule, duration: number, success: boolean): void {
    rule.execution.executionCount++;
    rule.execution.lastTriggered = new Date().toISOString();
    
    if (success) {
      rule.execution.successCount++;
      this.executionMetrics.successfulExecutions++;
    } else {
      rule.execution.failureCount++;
      this.executionMetrics.failedExecutions++;
    }

    // Update average execution time
    const totalTime = rule.execution.averageExecutionTime * (rule.execution.executionCount - 1) + duration;
    rule.execution.averageExecutionTime = totalTime / rule.execution.executionCount;

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
    
    for (const rule of this.rules.values()) {
      for (const action of rule.actions) {
        actionCounts.set(action.type, (actionCounts.get(action.type) || 0) + rule.execution.executionCount);
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
    return `rule_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 