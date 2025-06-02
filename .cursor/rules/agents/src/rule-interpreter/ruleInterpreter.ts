import { Rule, RuleReference, AgentType, PermissionLevel } from '../common/types';
import { RuleParser } from './ruleParser';

/**
 * Result of rule validation
 */
export interface RuleValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** List of validation issues */
  issues: RuleValidationIssue[];
}

/**
 * An issue found during rule validation
 */
export interface RuleValidationIssue {
  /** Severity of the issue */
  severity: 'error' | 'warning' | 'info';
  /** Description of the issue */
  message: string;
  /** Path to the file with the issue */
  filePath?: string;
  /** Line number of the issue */
  line?: number;
  /** Rule that caused the issue */
  rule?: Rule;
}

/**
 * Resolution for a rule validation issue
 */
export interface RuleResolution {
  /** The issue being resolved */
  issue: RuleValidationIssue;
  /** Description of the resolution */
  description: string;
  /** Changes to be made */
  changes: ResolutionChange[];
  /** Whether the resolution is automatic */
  automatic: boolean;
}

/**
 * A change to be made for resolving an issue
 */
export interface ResolutionChange {
  /** Path to the file to change */
  filePath: string;
  /** Type of change */
  type: 'add' | 'remove' | 'modify';
  /** Line number to change */
  line?: number;
  /** Content to add/replace */
  content?: string;
}

/**
 * Options for rule interpretation
 */
export interface RuleInterpretationOptions {
  /** Current agent type */
  agentType?: AgentType;
  /** Permission level for the operation */
  permissionLevel?: PermissionLevel;
  /** Whether to perform automatic fixes */
  autoFix?: boolean;
  /** Strictness level for validation */
  strictness?: 'strict' | 'moderate' | 'relaxed';
}

/**
 * Interprets and applies rules in the cursor workspace
 */
export class RuleInterpreter {
  private rules: Rule[] = [];
  private options: RuleInterpretationOptions;

  /**
   * Creates a new rule interpreter
   * @param rules Optional array of rules to interpret
   * @param options Options for interpretation
   */
  constructor(rules?: Rule[], options: RuleInterpretationOptions = {}) {
    this.rules = rules || [];
    this.options = {
      agentType: options.agentType || AgentType.RULE_INTERPRETER,
      permissionLevel: options.permissionLevel || PermissionLevel.READ_ONLY,
      autoFix: options.autoFix || false,
      strictness: options.strictness || 'moderate'
    };
  }

  /**
   * Loads all rules from the cursor workspace
   * @param basePath Base path to search from
   */
  public loadRules(basePath: string = '.cursor/rules'): void {
    this.rules = RuleParser.parseAllRules(basePath);
  }

  /**
   * Gets rules applicable to a specific file
   * @param filePath Path to the file
   * @returns Applicable rules
   */
  public getApplicableRules(filePath: string): Rule[] {
    return RuleParser.findApplicableRules(filePath, this.rules);
  }

  /**
   * Validates a file against applicable rules
   * @param filePath Path to the file
   * @param fileContent Content of the file
   * @returns Validation result
   */
  public validateFile(filePath: string, fileContent: string): RuleValidationResult {
    const applicableRules = this.getApplicableRules(filePath);
    const issues: RuleValidationIssue[] = [];

    // Process each applicable rule
    for (const rule of applicableRules) {
      const ruleIssues = this.applyRuleToFile(rule, filePath, fileContent);
      issues.push(...ruleIssues);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Applies a specific rule to a file
   * @param rule Rule to apply
   * @param filePath Path to the file
   * @param fileContent Content of the file
   * @returns Validation issues found
   */
  private applyRuleToFile(rule: Rule, filePath: string, fileContent: string): RuleValidationIssue[] {
    const issues: RuleValidationIssue[] = [];
    const lines = fileContent.split('\n');

    // Process each section of the rule
    for (const section of rule.sections) {
      // Check for code examples to validate against
      if (section.codeExamples && section.codeExamples.length > 0) {
        // Find code examples that are negative patterns to avoid
        const negativeExamples = section.codeExamples.filter(ex => !ex.isPositive);

        for (const example of negativeExamples) {
          // Skip empty examples
          if (!example.code.trim()) continue;

          // Simple pattern matching - for complex cases, would need to use AST parsing
          if (fileContent.includes(example.code)) {
            issues.push({
              severity: 'error',
              message: `Contains pattern that violates the "${rule.title}" rule (${section.title})`,
              filePath,
              rule
            });
          }
        }
      }

      // Process directives from bullet points
      if (section.directives && section.directives.length > 0) {
        for (const directive of section.directives) {
          // Process various directive types
          if (directive.startsWith('**Required:**') || directive.startsWith('**Must:**')) {
            const requirement = directive.replace(/^\*\*Required:\*\*|\*\*Must:\*\*/, '').trim();
            // Basic check for requirement - complex cases would need specific logic
            if (!this.checkRequirement(requirement, fileContent)) {
              issues.push({
                severity: 'error',
                message: `Missing required element: ${requirement}`,
                filePath,
                rule
              });
            }
          } else if (directive.startsWith('**Avoid:**') || directive.startsWith('**Don\'t:**')) {
            const avoidPattern = directive.replace(/^\*\*Avoid:\*\*|\*\*Don't:\*\*/, '').trim();
            // Check if the file contains a pattern to avoid
            if (this.checkAvoidPattern(avoidPattern, fileContent)) {
              issues.push({
                severity: 'warning',
                message: `Contains pattern to avoid: ${avoidPattern}`,
                filePath,
                rule
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Checks if a file meets a requirement
   * @param requirement Requirement to check
   * @param fileContent File content to check against
   * @returns Whether the requirement is met
   */
  private checkRequirement(requirement: string, fileContent: string): boolean {
    // Simplified check - would need to be expanded for specific requirements
    // This is a placeholder for more complex logic
    return true;
  }

  /**
   * Checks if a file contains a pattern to avoid
   * @param pattern Pattern to avoid
   * @param fileContent File content to check against
   * @returns Whether the pattern is found
   */
  private checkAvoidPattern(pattern: string, fileContent: string): boolean {
    // Simplified check - would need to be expanded for complex patterns
    return fileContent.includes(pattern);
  }

  /**
   * Gets resolutions for rule validation issues
   * @param issues Validation issues to resolve
   * @returns Resolutions for the issues
   */
  public getResolutions(issues: RuleValidationIssue[]): RuleResolution[] {
    const resolutions: RuleResolution[] = [];

    for (const issue of issues) {
      // Skip issues without associated rules
      if (!issue.rule) continue;

      // Generate resolution based on issue type
      const resolution = this.generateResolution(issue);
      if (resolution) {
        resolutions.push(resolution);
      }
    }

    return resolutions;
  }

  /**
   * Generates a resolution for a validation issue
   * @param issue Issue to resolve
   * @returns Resolution for the issue
   */
  private generateResolution(issue: RuleValidationIssue): RuleResolution | null {
    // This is a simplified placeholder - real implementation would need
    // to generate specific resolutions based on the rule and issue type

    // Example for a missing requirement
    if (issue.message.startsWith('Missing required element:')) {
      return {
        issue,
        description: `Add the required element: ${issue.message.replace('Missing required element:', '').trim()}`,
        changes: [{
          filePath: issue.filePath || '',
          type: 'add',
          // Would need real content based on the requirement
          content: '// TODO: Add required element'
        }],
        automatic: this.options.autoFix || false
      };
    }

    // Example for a pattern to avoid
    if (issue.message.startsWith('Contains pattern to avoid:')) {
      return {
        issue,
        description: `Remove or replace the pattern: ${issue.message.replace('Contains pattern to avoid:', '').trim()}`,
        changes: [{
          filePath: issue.filePath || '',
          type: 'modify',
          // Would need real replacement logic
          content: '// FIXED: Replaced problematic pattern'
        }],
        automatic: false // Generally safer to not auto-fix these
      };
    }

    return null;
  }

  /**
   * Applies resolutions to fix validation issues
   * @param resolutions Resolutions to apply
   * @returns Number of resolutions applied
   */
  public applyResolutions(resolutions: RuleResolution[]): number {
    // Only apply automatic resolutions or if autoFix is enabled
    const applicableResolutions = resolutions.filter(r =>
      r.automatic || this.options.autoFix);

    // This would need real file system access to make the changes
    // For now, just return the count
    return applicableResolutions.length;
  }

  /**
   * Resolves references between rules
   * @param rule Rule containing references
   * @returns Resolved references with content
   */
  public resolveReferences(rule: Rule): Map<RuleReference, Rule> {
    const resolvedRefs = new Map<RuleReference, Rule>();

    for (const ref of rule.references) {
      // Find the referenced rule
      const referencedRule = this.rules.find(r => r.path === ref.path);
      if (referencedRule) {
        resolvedRefs.set(ref, referencedRule);
      }
    }

    return resolvedRefs;
  }

  /**
   * Validates consistency across all loaded rules
   * @returns Validation result
   */
  public validateRuleConsistency(): RuleValidationResult {
    const issues: RuleValidationIssue[] = [];

    // Check for duplicate rule titles
    const titleCounts = new Map<string, number>();
    for (const rule of this.rules) {
      const count = titleCounts.get(rule.title) || 0;
      titleCounts.set(rule.title, count + 1);
    }

    for (const [title, count] of titleCounts.entries()) {
      if (count > 1) {
        issues.push({
          severity: 'warning',
          message: `Duplicate rule title: "${title}" appears ${count} times`,
        });
      }
    }

    // Check for invalid references
    for (const rule of this.rules) {
      for (const ref of rule.references) {
        const referencedRule = this.rules.find(r => r.path === ref.path);
        if (!referencedRule) {
          issues.push({
            severity: 'error',
            message: `Invalid reference: "${ref.name}" references non-existent rule at ${ref.path}`,
            filePath: rule.path,
            rule
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
