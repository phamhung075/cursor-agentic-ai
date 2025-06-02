/**
 * Complex Rule System - Compatibility Layer
 *
 * This file provides compatibility between the existing simple rule format
 * and the new enhanced rule model.
 */

import { ComplexRule, RuleCondition, RuleRelation, RuleSection, SemanticPattern, RuleValidation, RuleTransformation } from './rule-model';

/**
 * Interface representing the existing simple rule format
 */
export interface SimpleRule {
  description: string;
  globs: string[];
  alwaysApply: boolean;
  content?: string;
}

/**
 * Converts a simple rule to a complex rule
 * @param simpleRule The simple rule to convert
 * @param id Optional ID for the complex rule (defaults to a generated ID)
 * @returns A complex rule equivalent to the simple rule
 */
export function convertSimpleToComplex(simpleRule: SimpleRule, id?: string): ComplexRule {
  // Generate a unique ID if not provided
  const ruleId = id || `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Create a section for the content if provided
  const sections: RuleSection[] = [];
  if (simpleRule.content) {
    sections.push({
      id: `${ruleId}_main`,
      title: 'Main Content',
      content: simpleRule.content,
      order: 0
    });
  }

  // Create a file pattern condition from the globs
  const conditions: RuleCondition[] = simpleRule.globs.map((glob, index) => ({
    type: 'filePattern',
    expression: glob,
    negate: false,
    metadata: {
      source: 'legacy-rule-conversion'
    }
  }));

  // Create the complex rule
  return {
    id: ruleId,
    metadata: {
      description: simpleRule.description,
      globs: simpleRule.globs,
      alwaysApply: simpleRule.alwaysApply,
      priority: 1, // Default priority
      category: 'legacy', // Mark as legacy
      relations: [],
      conditions,
      parameters: [],
      version: '1.0.0',
      tags: ['legacy', 'auto-converted']
    },
    sections,
    semanticPatterns: [],
    validations: [{
      id: `${ruleId}_validation`,
      description: 'Legacy validation',
      severity: 'warning',
      validationRef: 'legacy-simple-matcher',
      message: 'This rule was automatically converted from a simple rule and may not function optimally.'
    }],
    transformations: [],
    customValidators: ['legacy-simple-matcher']
  };
}

/**
 * Converts a complex rule back to a simple rule (lossy conversion)
 * @param complexRule The complex rule to convert
 * @returns A simple rule approximating the complex rule
 */
export function convertComplexToSimple(complexRule: ComplexRule): SimpleRule {
  // Extract the main content from sections if available
  let content = '';
  const mainSection = complexRule.sections.find(s => s.order === 0 || s.title === 'Main Content');
  if (mainSection) {
    content = mainSection.content;
  } else if (complexRule.sections.length > 0) {
    // Use the first section if no main section found
    content = complexRule.sections[0].content;
  }

  return {
    description: complexRule.metadata.description,
    globs: complexRule.metadata.globs,
    alwaysApply: complexRule.metadata.alwaysApply,
    content
  };
}

/**
 * Detects if a rule is in the simple format or complex format
 * @param rule The rule to check
 * @returns True if the rule is in the simple format, false if complex
 */
export function isSimpleRule(rule: SimpleRule | ComplexRule): rule is SimpleRule {
  return !('id' in rule) && !('metadata' in rule);
}

/**
 * Checks if a complex rule was converted from a simple rule
 * @param rule The complex rule to check
 * @returns True if the rule was converted from a simple rule
 */
export function isConvertedSimpleRule(rule: ComplexRule): boolean {
  return rule.metadata.tags?.includes('auto-converted') ||
         rule.metadata.category === 'legacy';
}

/**
 * Converts a batch of rules from simple to complex format
 * @param simpleRules Array of simple rules
 * @returns Array of equivalent complex rules
 */
export function batchConvertToComplex(simpleRules: SimpleRule[]): ComplexRule[] {
  return simpleRules.map((rule, index) =>
    convertSimpleToComplex(rule, `legacy_rule_${index}`)
  );
}

/**
 * Enhances a converted simple rule with additional complex features
 * @param convertedRule A complex rule that was converted from a simple rule
 * @param enhancements Object containing enhancements to apply
 * @returns An enhanced complex rule
 */
export function enhanceConvertedRule(
  convertedRule: ComplexRule,
  enhancements: {
    priority?: number;
    category?: string;
    relations?: RuleRelation[];
    semanticPatterns?: SemanticPattern[];
    validations?: RuleValidation[];
    transformations?: RuleTransformation[];
  }
): ComplexRule {
  // Create a copy of the rule to avoid modifying the original
  const enhancedRule: ComplexRule = JSON.parse(JSON.stringify(convertedRule));

  // Apply enhancements
  if (enhancements.priority !== undefined) {
    enhancedRule.metadata.priority = enhancements.priority;
  }

  if (enhancements.category) {
    enhancedRule.metadata.category = enhancements.category;
  }

  if (enhancements.relations) {
    enhancedRule.metadata.relations = [
      ...enhancedRule.metadata.relations,
      ...enhancements.relations
    ];
  }

  if (enhancements.semanticPatterns) {
    enhancedRule.semanticPatterns = [
      ...enhancedRule.semanticPatterns,
      ...enhancements.semanticPatterns
    ];
  }

  if (enhancements.validations) {
    enhancedRule.validations = [
      ...enhancedRule.validations,
      ...enhancements.validations
    ];
  }

  if (enhancements.transformations) {
    enhancedRule.transformations = [
      ...enhancedRule.transformations,
      ...enhancements.transformations
    ];
  }

  // Update tags to show it's been enhanced
  enhancedRule.metadata.tags = [
    ...(enhancedRule.metadata.tags || []),
    'enhanced'
  ];

  return enhancedRule;
}
