import { Rule } from '../common/types';
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

/**
 * Validates rules for consistency and detects conflicts
 */
export class RuleValidator {
  private ajv: any;
  private schema: any;

  /**
   * Creates a new RuleValidator
   * @param schemaPath Optional path to schema file
   */
  constructor(schemaPath?: string) {
    this.ajv = new Ajv({ allErrors: true });

    if (schemaPath && fs.existsSync(schemaPath)) {
      this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    } else {
      // Default schema for rules
      this.schema = {
        type: 'object',
        required: ['description', 'content'],
        properties: {
          description: { type: 'string' },
          globs: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ]
          },
          alwaysApply: { type: 'boolean' },
          version: { type: 'string' },
          content: { type: 'string' },
          references: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                path: { type: 'string' }
              },
              required: ['type', 'path']
            }
          }
        }
      };
    }
  }

  /**
   * Validates a rule against the schema
   * @param rule Rule to validate
   * @returns Validation result with errors if any
   */
  public validateRule(rule: Rule): { valid: boolean; errors: any[] } {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(rule);

    return {
      valid: !!valid,
      errors: validate.errors || []
    };
  }

  /**
   * Checks for conflicts between rules
   * @param rules Array of rules to check
   * @returns Array of conflict details
   */
  public detectConflicts(rules: Rule[]): { rule1: Rule; rule2: Rule; reason: string }[] {
    const conflicts: { rule1: Rule; rule2: Rule; reason: string }[] = [];

    // Check for duplicate descriptions
    const descriptionMap = new Map<string, Rule>();

    for (const rule of rules) {
      // Validate each rule individually first
      const validation = this.validateRule(rule);
      if (!validation.valid) {
        continue; // Skip invalid rules
      }

      // Check for duplicate descriptions
      if (rule.description && descriptionMap.has(rule.description)) {
        conflicts.push({
          rule1: descriptionMap.get(rule.description)!,
          rule2: rule,
          reason: 'Duplicate rule description'
        });
      } else if (rule.description) {
        descriptionMap.set(rule.description, rule);
      }

      // Check for glob pattern conflicts
      this.checkGlobConflicts(rule, rules, conflicts);
    }

    return conflicts;
  }

  /**
   * Resolves conflicts in a set of rules
   * @param rules Rules with potential conflicts
   * @returns Rules with conflicts resolved
   */
  public resolveConflicts(rules: Rule[]): { resolved: Rule[]; unresolved: { rule: Rule; reason: string }[] } {
    const conflicts = this.detectConflicts(rules);
    const unresolvedConflicts: { rule: Rule; reason: string }[] = [];
    const resolvedRules = [...rules];

    // Create a set of rules to remove
    const rulesToRemove = new Set<Rule>();

    for (const conflict of conflicts) {
      // For duplicate descriptions, we can rename one
      if (conflict.reason === 'Duplicate rule description') {
        const index = resolvedRules.findIndex(r => r === conflict.rule2);
        if (index !== -1) {
          resolvedRules[index] = {
            ...conflict.rule2,
            description: `${conflict.rule2.description} (Copy)`
          };
        }
      } else {
        // For other conflicts, mark as unresolved
        unresolvedConflicts.push({
          rule: conflict.rule2,
          reason: conflict.reason
        });
        rulesToRemove.add(conflict.rule2);
      }
    }

    // Remove unresolved rules
    return {
      resolved: resolvedRules.filter(rule => !rulesToRemove.has(rule)),
      unresolved: unresolvedConflicts
    };
  }

  /**
   * Checks for conflicts in glob patterns
   * @param rule Rule to check
   * @param allRules All rules to compare against
   * @param conflicts Array to add conflicts to
   */
  private checkGlobConflicts(
    rule: Rule,
    allRules: Rule[],
    conflicts: { rule1: Rule; rule2: Rule; reason: string }[]
  ): void {
    // Skip rules without glob patterns
    if (!rule.globs) {
      return;
    }

    const ruleGlobs = Array.isArray(rule.globs) ? rule.globs : [rule.globs];

    for (const otherRule of allRules) {
      // Skip comparing with self
      if (rule === otherRule) {
        continue;
      }

      // Skip rules without glob patterns
      if (!otherRule.globs) {
        continue;
      }

      const otherGlobs = Array.isArray(otherRule.globs) ? otherRule.globs : [otherRule.globs];

      // Check for identical glob patterns with different content
      const hasOverlap = ruleGlobs.some(glob => otherGlobs.includes(glob));

      if (hasOverlap && rule.content !== otherRule.content) {
        conflicts.push({
          rule1: rule,
          rule2: otherRule,
          reason: 'Conflicting rules for the same file pattern'
        });
      }
    }
  }
}
