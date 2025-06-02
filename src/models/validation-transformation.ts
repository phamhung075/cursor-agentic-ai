/**
 * Complex Rule System - Validation and Transformation Models
 *
 * This file implements models for rule validation and code transformation
 * including validation strategies, issue reporting, and transformation methods.
 */

import { RuleValidation, RuleTransformation, RuleValidationIssue, RuleResolution, ComplexRule, FixReport } from './rule-model';

/**
 * Enum for validation strategy types
 */
export enum ValidationStrategyType {
  AST_PATTERN = 'astPattern',
  REGEX_PATTERN = 'regexPattern',
  SEMANTIC_PATTERN = 'semanticPattern',
  COMPOSITE = 'composite',
  CUSTOM = 'custom'
}

/**
 * Interface for validation strategy context
 */
export interface ValidationContext {
  /** File path being validated */
  filePath: string;
  /** File content */
  content: string;
  /** AST representation (if available) */
  ast?: any;
  /** Project context */
  projectContext?: Record<string, any>;
  /** Rule context */
  ruleContext?: Record<string, any>;
}

/**
 * Interface for validation strategy
 */
export interface ValidationStrategy {
  /** Type of validation strategy */
  type: ValidationStrategyType;
  /** Validate content against rule */
  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[];
}

/**
 * AST-based validation strategy
 */
export class AstPatternValidationStrategy implements ValidationStrategy {
  type = ValidationStrategyType.AST_PATTERN;

  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[] {
    // In a real implementation, this would use the AST to validate the rule
    // For now, we'll return an empty array
    return [];
  }
}

/**
 * Regex-based validation strategy
 */
export class RegexPatternValidationStrategy implements ValidationStrategy {
  type = ValidationStrategyType.REGEX_PATTERN;

  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[] {
    const issues: RuleValidationIssue[] = [];

    // Find semantic patterns with regex format
    const regexPatterns = rule.semanticPatterns.filter(pattern =>
      pattern.format === 'regex'
    );

    for (const pattern of regexPatterns) {
      try {
        const regex = new RegExp(pattern.pattern, 'g');
        let match;

        while ((match = regex.exec(context.content)) !== null) {
          // Get line and character position
          const lineInfo = this.getLineAndCharacterFromOffset(context.content, match.index);

          // Create validation issue
          issues.push({
            ruleId: rule.id,
            validationId: validation.id,
            filePath: context.filePath,
            start: { line: lineInfo.line, character: lineInfo.character },
            end: {
              line: lineInfo.line,
              character: lineInfo.character + match[0].length
            },
            severity: validation.severity,
            message: validation.message,
            fixes: validation.fixes,
            codeSnippet: match[0]
          });
        }
      } catch (e) {
        // Invalid regex pattern
        console.error(`Invalid regex pattern in rule ${rule.id}: ${pattern.pattern}`);
      }
    }

    return issues;
  }

  /**
   * Calculate line and character position from offset
   */
  private getLineAndCharacterFromOffset(content: string, offset: number): { line: number; character: number } {
    const lines = content.substring(0, offset).split('\n');
    return {
      line: lines.length,
      character: lines[lines.length - 1].length
    };
  }
}

/**
 * Semantic pattern validation strategy
 */
export class SemanticPatternValidationStrategy implements ValidationStrategy {
  type = ValidationStrategyType.SEMANTIC_PATTERN;

  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[] {
    // In a real implementation, this would use semantic patterns to validate the rule
    // For now, we'll return an empty array
    return [];
  }
}

/**
 * Composite validation strategy that combines multiple strategies
 */
export class CompositeValidationStrategy implements ValidationStrategy {
  type = ValidationStrategyType.COMPOSITE;
  private strategies: ValidationStrategy[];

  constructor(strategies: ValidationStrategy[]) {
    this.strategies = strategies;
  }

  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[] {
    // Combine results from all strategies
    return this.strategies.flatMap(strategy =>
      strategy.validate(rule, validation, context)
    );
  }
}

/**
 * Custom validation strategy
 */
export class CustomValidationStrategy implements ValidationStrategy {
  type = ValidationStrategyType.CUSTOM;
  private validatorFn: (rule: ComplexRule, validation: RuleValidation, context: ValidationContext) => RuleValidationIssue[];

  constructor(validatorFn: (rule: ComplexRule, validation: RuleValidation, context: ValidationContext) => RuleValidationIssue[]) {
    this.validatorFn = validatorFn;
  }

  validate(rule: ComplexRule, validation: RuleValidation, context: ValidationContext): RuleValidationIssue[] {
    return this.validatorFn(rule, validation, context);
  }
}

/**
 * Validation strategy factory
 */
export class ValidationStrategyFactory {
  private strategies: Map<string, ValidationStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.register('astPattern', new AstPatternValidationStrategy());
    this.register('regexPattern', new RegexPatternValidationStrategy());
    this.register('semanticPattern', new SemanticPatternValidationStrategy());

    // Register composite strategy
    this.register('composite', new CompositeValidationStrategy([
      new AstPatternValidationStrategy(),
      new RegexPatternValidationStrategy(),
      new SemanticPatternValidationStrategy()
    ]));
  }

  /**
   * Register a validation strategy
   */
  register(name: string, strategy: ValidationStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get a validation strategy by name
   */
  getStrategy(name: string): ValidationStrategy {
    const strategy = this.strategies.get(name);

    if (!strategy) {
      throw new Error(`Validation strategy not found: ${name}`);
    }

    return strategy;
  }

  /**
   * Create a custom validation strategy
   */
  createCustomStrategy(validatorFn: (rule: ComplexRule, validation: RuleValidation, context: ValidationContext) => RuleValidationIssue[]): ValidationStrategy {
    return new CustomValidationStrategy(validatorFn);
  }
}

/**
 * Enum for transformation strategy types
 */
export enum TransformationStrategyType {
  AST_TRANSFORMATION = 'astTransformation',
  REGEX_REPLACEMENT = 'regexReplacement',
  TEMPLATE_REPLACEMENT = 'templateReplacement',
  COMPOSITE = 'composite',
  CUSTOM = 'custom'
}

/**
 * Interface for transformation context
 */
export interface TransformationContext {
  /** File path being transformed */
  filePath: string;
  /** Original file content */
  originalContent: string;
  /** AST representation (if available) */
  ast?: any;
  /** Project context */
  projectContext?: Record<string, any>;
  /** Rule context */
  ruleContext?: Record<string, any>;
  /** Validation issues (if any) */
  issues?: RuleValidationIssue[];
}

/**
 * Interface for transformation result
 */
export interface TransformationResult {
  /** Whether the transformation was successful */
  success: boolean;
  /** Transformed content */
  content: string;
  /** Description of the transformation */
  description: string;
  /** Applied resolutions */
  resolutions: RuleResolution[];
  /** Errors (if any) */
  errors?: string[];
}

/**
 * Interface for transformation strategy
 */
export interface TransformationStrategy {
  /** Type of transformation strategy */
  type: TransformationStrategyType;
  /** Transform content based on rule */
  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult;
}

/**
 * AST-based transformation strategy
 */
export class AstTransformationStrategy implements TransformationStrategy {
  type = TransformationStrategyType.AST_TRANSFORMATION;

  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult {
    // In a real implementation, this would use the AST to transform the content
    // For now, we'll return the original content
    return {
      success: false,
      content: context.originalContent,
      description: 'AST transformation not implemented',
      resolutions: [],
      errors: ['AST transformation not implemented']
    };
  }
}

/**
 * Regex-based transformation strategy
 */
export class RegexReplacementStrategy implements TransformationStrategy {
  type = TransformationStrategyType.REGEX_REPLACEMENT;

  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult {
    try {
      // Find regex transformations in the transformation reference
      const transformRef = transformation.transformRef;
      const [patternStr, replacement] = transformRef.split('::');

      if (!patternStr || !replacement) {
        return {
          success: false,
          content: context.originalContent,
          description: 'Invalid regex transformation reference',
          resolutions: [],
          errors: ['Invalid regex transformation reference']
        };
      }

      // Create regex and apply replacement
      const regex = new RegExp(patternStr, 'g');
      const newContent = context.originalContent.replace(regex, replacement);

      // Check if any replacements were made
      if (newContent === context.originalContent) {
        return {
          success: false,
          content: context.originalContent,
          description: 'No matches found for regex replacement',
          resolutions: [],
          errors: []
        };
      }

      // Create resolution
      const resolutions: RuleResolution[] = context.issues?.map(issue => ({
        issueId: issue.ruleId + ':' + issue.validationId,
        ruleId: rule.id,
        type: 'fix',
        fixRef: transformation.transformRef,
        reason: transformation.description,
        scope: 'file',
        filePath: context.filePath
      })) || [];

      return {
        success: true,
        content: newContent,
        description: `Applied regex replacement: ${patternStr} -> ${replacement}`,
        resolutions
      };
    } catch (e) {
      return {
        success: false,
        content: context.originalContent,
        description: 'Error applying regex transformation',
        resolutions: [],
        errors: [(e as Error).message]
      };
    }
  }
}

/**
 * Template-based transformation strategy
 */
export class TemplateReplacementStrategy implements TransformationStrategy {
  type = TransformationStrategyType.TEMPLATE_REPLACEMENT;

  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult {
    // In a real implementation, this would use templates to transform the content
    // For now, we'll return the original content
    return {
      success: false,
      content: context.originalContent,
      description: 'Template replacement not implemented',
      resolutions: [],
      errors: ['Template replacement not implemented']
    };
  }
}

/**
 * Composite transformation strategy
 */
export class CompositeTransformationStrategy implements TransformationStrategy {
  type = TransformationStrategyType.COMPOSITE;
  private strategies: TransformationStrategy[];

  constructor(strategies: TransformationStrategy[]) {
    this.strategies = strategies;
  }

  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult {
    // Try each strategy in order until one succeeds
    for (const strategy of this.strategies) {
      const result = strategy.transform(rule, transformation, context);

      if (result.success) {
        return result;
      }
    }

    // If all strategies fail, return a failure result
    return {
      success: false,
      content: context.originalContent,
      description: 'All transformation strategies failed',
      resolutions: [],
      errors: ['All transformation strategies failed']
    };
  }
}

/**
 * Custom transformation strategy
 */
export class CustomTransformationStrategy implements TransformationStrategy {
  type = TransformationStrategyType.CUSTOM;
  private transformerFn: (rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext) => TransformationResult;

  constructor(transformerFn: (rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext) => TransformationResult) {
    this.transformerFn = transformerFn;
  }

  transform(rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext): TransformationResult {
    return this.transformerFn(rule, transformation, context);
  }
}

/**
 * Transformation strategy factory
 */
export class TransformationStrategyFactory {
  private strategies: Map<string, TransformationStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.register('astTransformation', new AstTransformationStrategy());
    this.register('regexReplacement', new RegexReplacementStrategy());
    this.register('templateReplacement', new TemplateReplacementStrategy());

    // Register composite strategy
    this.register('composite', new CompositeTransformationStrategy([
      new RegexReplacementStrategy(),
      new TemplateReplacementStrategy(),
      new AstTransformationStrategy()
    ]));
  }

  /**
   * Register a transformation strategy
   */
  register(name: string, strategy: TransformationStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get a transformation strategy by name
   */
  getStrategy(name: string): TransformationStrategy {
    const strategy = this.strategies.get(name);

    if (!strategy) {
      throw new Error(`Transformation strategy not found: ${name}`);
    }

    return strategy;
  }

  /**
   * Create a custom transformation strategy
   */
  createCustomStrategy(transformerFn: (rule: ComplexRule, transformation: RuleTransformation, context: TransformationContext) => TransformationResult): TransformationStrategy {
    return new CustomTransformationStrategy(transformerFn);
  }
}

/**
 * Fix generator for creating resolutions to validation issues
 */
export class FixGenerator {
  private transformationFactory: TransformationStrategyFactory;

  constructor(transformationFactory: TransformationStrategyFactory) {
    this.transformationFactory = transformationFactory;
  }

  /**
   * Generate resolutions for validation issues
   */
  generateResolutions(rule: ComplexRule, issues: RuleValidationIssue[]): RuleResolution[] {
    const resolutions: RuleResolution[] = [];

    for (const issue of issues) {
      // Find matching validation in rule
      const validation = rule.validations.find(v => v.id === issue.validationId);

      if (!validation || !validation.fixes || validation.fixes.length === 0) {
        continue;
      }

      // Create a resolution for each fix
      for (const fix of validation.fixes) {
        resolutions.push({
          issueId: issue.ruleId + ':' + issue.validationId,
          ruleId: rule.id,
          type: 'fix',
          fixRef: fix.fixRef,
          reason: fix.description,
          scope: 'line',
          filePath: issue.filePath
        });
      }
    }

    return resolutions;
  }

  /**
   * Apply resolutions to transform content
   */
  applyResolutions(rule: ComplexRule, content: string, filePath: string, resolutions: RuleResolution[], issues: RuleValidationIssue[]): TransformationResult {
    let currentContent = content;
    const appliedResolutions: RuleResolution[] = [];
    const errors: string[] = [];

    for (const resolution of resolutions) {
      if (resolution.type !== 'fix' || !resolution.fixRef) {
        // Skip non-fix resolutions
        continue;
      }

      try {
        // Find corresponding transformation
        const transformation = rule.transformations.find(t => t.transformRef === resolution.fixRef);

        if (!transformation) {
          errors.push(`Transformation not found for fix: ${resolution.fixRef}`);
          continue;
        }

        // Determine strategy type from fixRef
        const strategyType = resolution.fixRef.startsWith('regex:')
          ? 'regexReplacement'
          : resolution.fixRef.startsWith('ast:')
            ? 'astTransformation'
            : 'composite';

        // Get strategy and apply transformation
        const strategy = this.transformationFactory.getStrategy(strategyType);
        const context: TransformationContext = {
          filePath,
          originalContent: currentContent,
          issues,
          ruleContext: {}
        };

        const result = strategy.transform(rule, transformation, context);

        if (result.success) {
          currentContent = result.content;
          appliedResolutions.push(resolution);
        } else if (result.errors && result.errors.length > 0) {
          errors.push(...result.errors);
        }
      } catch (e) {
        errors.push(`Error applying resolution: ${(e as Error).message}`);
      }
    }

    return {
      success: appliedResolutions.length > 0,
      content: currentContent,
      description: `Applied ${appliedResolutions.length} resolutions`,
      resolutions: appliedResolutions,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Generate a fix report
   */
  generateFixReport(issues: RuleValidationIssue[], appliedResolutions: RuleResolution[], modifiedFiles: string[]): FixReport {
    const totalIssues = issues.length;
    const fixedIssues = appliedResolutions.filter(r => r.type === 'fix').length;
    const ignoredIssues = appliedResolutions.filter(r => r.type === 'ignore').length;
    const suppressedIssues = appliedResolutions.filter(r => r.type === 'suppress').length;

    return {
      totalIssues,
      fixedIssues,
      ignoredIssues,
      suppressedIssues,
      remainingIssues: totalIssues - fixedIssues - ignoredIssues - suppressedIssues,
      modifiedFiles,
      appliedResolutions
    };
  }
}
