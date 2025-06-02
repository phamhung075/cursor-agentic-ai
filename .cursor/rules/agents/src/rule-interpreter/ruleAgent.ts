import { Agent } from '../common/agentFactory';
import { AgentConfig } from '../common/types';
import { RuleInterpreter } from './ruleInterpreter';
import { RuleParser } from './ruleParser';

/**
 * Agent responsible for interpreting and applying rules
 */
export default class RuleAgent extends Agent {
  private interpreter: RuleInterpreter | null = null;

  /**
   * Creates a new RuleAgent
   * @param config Agent configuration
   */
  constructor(config: AgentConfig) {
    super(config);
  }

  /**
   * Initializes the rule agent
   */
  public async initialize(): Promise<void> {
    // Create a new interpreter
    this.interpreter = new RuleInterpreter();

    // Load all rules
    this.interpreter.loadRules();

    console.log(`Rule Agent initialized with ${RuleParser.parseAllRules().length} rules`);
  }

  /**
   * Activates the rule agent to respond to a trigger
   * @param trigger The trigger that activated the agent
   * @param data Optional data associated with the trigger
   * @returns Result of rule validation
   */
  public async activate(trigger: string, data?: any): Promise<any> {
    if (!this.interpreter) {
      await this.initialize();
    }

    console.log(`Rule Agent activated with trigger: ${trigger}`);

    switch (trigger) {
      case 'validate-file':
        return this.validateFile(data.filePath, data.fileContent);

      case 'check-rules':
        return this.checkRuleConsistency();

      case 'apply-resolutions':
        return this.applyResolutions(data.issues);

      default:
        throw new Error(`Unknown trigger: ${trigger}`);
    }
  }

  /**
   * Validates a file against applicable rules
   * @param filePath Path to the file
   * @param fileContent Content of the file
   * @returns Validation result
   */
  private validateFile(filePath: string, fileContent: string): any {
    if (!this.interpreter) {
      throw new Error('Rule interpreter not initialized');
    }

    console.log(`Validating file: ${filePath}`);
    return this.interpreter.validateFile(filePath, fileContent);
  }

  /**
   * Checks consistency across all rules
   * @returns Validation result
   */
  private checkRuleConsistency(): any {
    if (!this.interpreter) {
      throw new Error('Rule interpreter not initialized');
    }

    console.log('Checking rule consistency');
    return this.interpreter.validateRuleConsistency();
  }

  /**
   * Applies resolutions to fix validation issues
   * @param issues Validation issues to resolve
   * @returns Number of resolutions applied
   */
  private applyResolutions(issues: any[]): any {
    if (!this.interpreter) {
      throw new Error('Rule interpreter not initialized');
    }

    console.log(`Applying resolutions for ${issues.length} issues`);
    const resolutions = this.interpreter.getResolutions(issues);
    return this.interpreter.applyResolutions(resolutions);
  }

  /**
   * Deactivates the rule agent
   */
  public async deactivate(): Promise<void> {
    console.log('Rule Agent deactivated');
    this.interpreter = null;
  }
}
