/**
 * Rule Schema Definitions
 *
 * Defines the structure and validation schema for YAML rule files.
 */

import { z } from 'zod';

/**
 * Rule metadata interface
 */
export interface RuleMetadata {
  id: string;
  name: string;
  description?: string;
  version?: string;
  category?: string;
  tags?: string[];
  author?: string;
  created?: string;
  updated?: string;
}

/**
 * Rule conditions interface
 */
export interface RuleConditions {
  phase?: string[];
  technologies?: string[];
  files_present?: string[];
  dependencies?: string[];
  project_type?: string[];
  [key: string]: unknown;
}

/**
 * Complete Rule interface
 */
export interface Rule {
  metadata: RuleMetadata;
  conditions?: RuleConditions;
  cursor_rules?: Record<string, unknown>;
  includes?: string[];
  [key: string]: unknown;
}

/**
 * Zod schema for RuleMetadata
 */
export const RuleMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

/**
 * Zod schema for RuleConditions
 */
export const RuleConditionsSchema = z.object({
  phase: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  files_present: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  project_type: z.array(z.string()).optional(),
}).catchall(z.unknown());

/**
 * Zod schema for Rule
 */
export const RuleSchema = z.object({
  metadata: RuleMetadataSchema,
  conditions: RuleConditionsSchema.optional(),
  cursor_rules: z.record(z.unknown()).optional(),
  includes: z.array(z.string()).optional(),
}).catchall(z.unknown());

/**
 * Validate a rule against the schema
 */
export function validateRule(rule: unknown): { valid: boolean; errors?: z.ZodError } {
  const result = RuleSchema.safeParse(rule);
  if (!result.success) {
    return { valid: false, errors: result.error };
  }
  return { valid: true };
}

/**
 * Parse and validate a rule
 */
export function parseRule(data: unknown): Rule {
  return RuleSchema.parse(data);
}