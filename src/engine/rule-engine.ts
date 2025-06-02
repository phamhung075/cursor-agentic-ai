/**
 * Complex Rule System - Rule Engine
 *
 * This file implements the main rule engine that processes complex rules,
 * validates content against rules, and applies transformations.
 */

import {
  ComplexRule,
  RuleValidationIssue,
  RuleValidationResult,
  RuleResolution,
  RuleEngineOptions,
  FixReport,
  ValidationStrategyFactory,
  TransformationStrategyFactory,
  ValidationContext,
  TransformationContext,
  FixGenerator
} from '../models';

/**
 * Main rule engine class for the Complex Rule System
 */
export class ComplexRuleEngine {
  private rules: ComplexRule[] = [];
  private validationFactory: ValidationStrategyFactory;
  private transformationFactory: TransformationStrategyFactory;
  private fixGenerator: FixGenerator;
  private options: RuleEngineOptions;

  /**
   * Constructor for the rule engine
   * @param options Rule engine options
   */
  constructor(options: Partial<RuleEngineOptions> = {}) {
    this.validationFactory = new ValidationStrategyFactory();
    this.transformationFactory = new TransformationStrategyFactory();
    this.fixGenerator = new FixGenerator(this.transformationFactory);

    // Default options
    this.options = {
      include: ['.'],
      exclude: ['node_modules', '.git'],
      incremental: false,
      concurrency: 4,
      cache: {
        enabled: true,
        location: '.rule-cache',
        maxSize: 100 * 1024 * 1024 // 100 MB
      },
      ...options
    };
  }

  /**
   * Load rules from various sources
   * @param rules Rules to load
   * @returns This rule engine instance for chaining
   */
  loadRules(rules: ComplexRule[]): ComplexRuleEngine {
    this.rules = [...this.rules, ...rules];
    return this;
  }

  /**
   * Clear all loaded rules
   * @returns This rule engine instance for chaining
   */
  clearRules(): ComplexRuleEngine {
    this.rules = [];
    return this;
  }

  /**
   * Register a custom validation strategy
   * @param name Name of the strategy
   * @param validatorFn Validator function
   * @returns This rule engine instance for chaining
   */
  registerValidationStrategy(name: string, validatorFn: any): ComplexRuleEngine {
    const strategy = this.validationFactory.createCustomStrategy(validatorFn);
    this.validationFactory.register(name, strategy);
    return this;
  }

  /**
   * Register a custom transformation strategy
   * @param name Name of the strategy
   * @param transformerFn Transformer function
   * @returns This rule engine instance for chaining
   */
  registerTransformationStrategy(name: string, transformerFn: any): ComplexRuleEngine {
    const strategy = this.transformationFactory.createCustomStrategy(transformerFn);
    this.transformationFactory.register(name, strategy);
    return this;
  }

  /**
   * Validate content against all applicable rules
   * @param filePath File path to validate
   * @param content Content to validate
   * @param ast Optional AST representation
   * @returns Validation result
   */
  validateContent(filePath: string, content: string, ast?: any): RuleValidationResult {
    const startTime = Date.now();
    const parseTime = 0; // In a real implementation, this would be the time to parse the content

    // Filter rules that apply to this file
    const applicableRules = this.getApplicableRules(filePath);
    const skippedRules = this.rules.filter(rule => !applicableRules.includes(rule)).map(rule => rule.id);

    // Create validation context
    const context: ValidationContext = {
      filePath,
      content,
      ast,
      projectContext: {},
      ruleContext: {}
    };

    const validateStartTime = Date.now();
    const issues: RuleValidationIssue[] = [];

    // Apply each rule
    for (const rule of applicableRules) {
      for (const validation of rule.validations) {
        try {
          // Determine validation strategy based on validation reference
          const strategyName = validation.validationRef.split(':')[0] || 'composite';
          const strategy = this.validationFactory.getStrategy(strategyName);

          // Validate using strategy
          const validationIssues = strategy.validate(rule, validation, context);
          issues.push(...validationIssues);
        } catch (e) {
          console.error(`Error validating rule ${rule.id} with validation ${validation.id}: ${(e as Error).message}`);
        }
      }
    }

    const validateTime = Date.now() - validateStartTime;
    const resolveTime = 0; // In a real implementation, this would be the time to resolve issues

    return {
      issues,
      appliedRules: applicableRules.map(rule => rule.id),
      skippedRules,
      performance: {
        totalTime: Date.now() - startTime,
        parseTime,
        validateTime,
        resolveTime
      }
    };
  }

  /**
   * Apply fixes to resolve validation issues
   * @param filePath File path to fix
   * @param content Content to fix
   * @param issues Validation issues
   * @returns Fix result
   */
  applyFixes(filePath: string, content: string, issues: RuleValidationIssue[]): FixReport {
    const ruleMap = new Map<string, ComplexRule>();
    this.rules.forEach(rule => ruleMap.set(rule.id, rule));

    const appliedResolutions: RuleResolution[] = [];
    const modifiedFilesSet = new Set<string>();
    modifiedFilesSet.add(filePath);
    const modifiedFiles = Array.from(modifiedFilesSet);

    let currentContent = content;

    // Group issues by rule
    const issuesByRule = new Map<string, RuleValidationIssue[]>();
    issues.forEach(issue => {
      if (!issuesByRule.has(issue.ruleId)) {
        issuesByRule.set(issue.ruleId, []);
      }
      issuesByRule.get(issue.ruleId)!.push(issue);
    });

    // Apply fixes for each rule
    for (const [ruleId, ruleIssues] of issuesByRule.entries()) {
      const rule = ruleMap.get(ruleId);

      if (!rule) {
        continue;
      }

      try {
        // Generate resolutions for issues
        const resolutions = this.fixGenerator.generateResolutions(rule, ruleIssues);

        // Apply resolutions
        const result = this.fixGenerator.applyResolutions(
          rule,
          currentContent,
          filePath,
          resolutions,
          ruleIssues
        );

        if (result.success) {
          currentContent = result.content;
          appliedResolutions.push(...result.resolutions);
        }
      } catch (e) {
        console.error(`Error applying fixes for rule ${ruleId}: ${(e as Error).message}`);
      }
    }

    // Generate fix report
    return this.fixGenerator.generateFixReport(
      issues,
      appliedResolutions,
      modifiedFiles
    );
  }

  /**
   * Get rules that apply to a file
   * @param filePath File path to check
   * @returns Applicable rules
   */
  private getApplicableRules(filePath: string): ComplexRule[] {
    return this.rules.filter(rule => {
      // Check if rule applies to this file
      const applies = rule.metadata.globs.some(glob => this.matchGlob(filePath, glob));

      // Check if rule should always apply
      if (rule.metadata.alwaysApply) {
        return true;
      }

      return applies;
    });
  }

  /**
   * Match a file path against a glob pattern
   * @param filePath File path to match
   * @param globPattern Glob pattern to match against
   * @returns Whether the file path matches the glob pattern
   */
  private matchGlob(filePath: string, globPattern: string): boolean {
    // In a real implementation, this would use a glob matching library
    // For now, we'll do a simple check
    if (globPattern === '*') {
      return true;
    }

    if (globPattern.endsWith('*')) {
      const prefix = globPattern.slice(0, -1);
      return filePath.startsWith(prefix);
    }

    if (globPattern.startsWith('*')) {
      const suffix = globPattern.slice(1);
      return filePath.endsWith(suffix);
    }

    return filePath.includes(globPattern);
  }
}
