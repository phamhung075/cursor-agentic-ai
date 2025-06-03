/**
 * Rule Schema Definitions
 *
 * Defines the standardized schema for Cursor rule formats.
 */

import { z } from 'zod';

/**
 * Metadata section schema
 * Contains identification and classification information for the rule
 */
export const RuleMetadataSchema = z.object({
  id: z.string().min(1).describe('Unique identifier for the rule'),
  name: z.string().min(1).describe('Human-readable name of the rule'),
  description: z.string().describe('Detailed description of what the rule enforces'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).describe('Semantic version (MAJOR.MINOR.PATCH)'),
  category: z.string().describe('Primary category of the rule (e.g., language, framework, style)'),
  tags: z.array(z.string()).describe('Additional tags for categorization and searching'),
  author: z.string().describe('Author or team responsible for the rule'),
  created: z.string().describe('Creation date in ISO format'),
  updated: z.string().describe('Last update date in ISO format'),
});

/**
 * Conditions section schema
 * Defines when and where this rule should be applied
 */
export const RuleConditionsSchema = z.object({
  phase: z.array(z.enum([
    'conception', 'research', 'setup', 'development',
    'testing', 'deployment', 'maintenance', 'scaling'
  ])).optional().describe('Development phases where this rule applies'),

  technologies: z.array(z.string()).optional()
    .describe('Technology stacks this rule applies to (e.g., typescript, react)'),

  files_present: z.array(z.string()).optional()
    .describe('Glob patterns for files that should be present to activate this rule'),

  dependencies: z.array(z.string()).optional()
    .describe('Required dependencies in package.json to activate this rule'),

  patterns: z.array(z.string()).optional()
    .describe('Code patterns that should be present to activate this rule'),

  project_type: z.array(z.string()).optional()
    .describe('Project types this rule applies to (e.g., node, web, mobile)'),
});

/**
 * Compatibility section schema
 * Defines relationships with other rules
 */
export const RuleCompatibilitySchema = z.object({
  conflicts_with: z.array(z.string()).optional()
    .describe('IDs of rules that cannot be used with this rule'),

  requires: z.array(z.string()).optional()
    .describe('IDs of rules that must be present for this rule to function'),

  enhances: z.array(z.string()).optional()
    .describe('IDs of rules that this rule improves or extends'),

  replaces: z.array(z.string()).optional()
    .describe('IDs of rules that this rule supersedes'),
});

/**
 * Cursor rules section schema
 * The actual rule content specific to Cursor IDE
 */
export const CursorRuleContentSchema = z.record(z.string(), z.any())
  .describe('Cursor-specific rule configuration properties');

/**
 * File structure section schema
 * Templates for file structure generation
 */
export const FileStructureTemplateSchema = z.array(
  z.object({
    path: z.string().describe('Path template for file or directory'),
    type: z.enum(['file', 'directory']).describe('Whether this is a file or directory'),
    content: z.string().optional().describe('Template content for files'),
    when: z.string().optional().describe('Condition for when this template should be applied'),
  })
).optional().describe('File structure templates associated with this rule');

/**
 * Complete rule schema
 */
export const RuleSchema = z.object({
  metadata: RuleMetadataSchema,
  conditions: RuleConditionsSchema,
  compatibility: RuleCompatibilitySchema,
  cursor_rules: CursorRuleContentSchema,
  file_structure: FileStructureTemplateSchema,

  priority: z.number().int().min(100).max(999)
    .describe('Priority value for rule application order (100-999)'),

  weight: z.number().min(0).max(1)
    .describe('Weight factor for this rule when merging (0.0-1.0)'),

  confidence: z.number().min(0).max(1).optional()
    .describe('Confidence level in rule applicability (0.0-1.0)'),
});

/**
 * Type definitions generated from the schemas
 */
export type RuleMetadata = z.infer<typeof RuleMetadataSchema>;
export type RuleConditions = z.infer<typeof RuleConditionsSchema>;
export type RuleCompatibility = z.infer<typeof RuleCompatibilitySchema>;
export type CursorRuleContent = z.infer<typeof CursorRuleContentSchema>;
export type FileStructureTemplate = z.infer<typeof FileStructureTemplateSchema>;
export type Rule = z.infer<typeof RuleSchema>;

/**
 * JSON Schema representation for documentation purposes
 */
export const ruleJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Cursor Rule",
  description: "Schema for defining Cursor IDE rules",
  type: "object",
  required: ["metadata", "conditions", "compatibility", "cursor_rules", "priority", "weight"],
  properties: {
    metadata: {
      type: "object",
      required: ["id", "name", "description", "version", "category", "tags", "author", "created", "updated"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        description: { type: "string" },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        author: { type: "string" },
        created: { type: "string", format: "date-time" },
        updated: { type: "string", format: "date-time" }
      }
    },
    conditions: {
      type: "object",
      properties: {
        phase: {
          type: "array",
          items: {
            type: "string",
            enum: ["conception", "research", "setup", "development",
                   "testing", "deployment", "maintenance", "scaling"]
          }
        },
        technologies: { type: "array", items: { type: "string" } },
        files_present: { type: "array", items: { type: "string" } },
        dependencies: { type: "array", items: { type: "string" } },
        patterns: { type: "array", items: { type: "string" } },
        project_type: { type: "array", items: { type: "string" } }
      }
    },
    compatibility: {
      type: "object",
      properties: {
        conflicts_with: { type: "array", items: { type: "string" } },
        requires: { type: "array", items: { type: "string" } },
        enhances: { type: "array", items: { type: "string" } },
        replaces: { type: "array", items: { type: "string" } }
      }
    },
    cursor_rules: {
      type: "object",
      additionalProperties: true
    },
    file_structure: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "type"],
        properties: {
          path: { type: "string" },
          type: { type: "string", enum: ["file", "directory"] },
          content: { type: "string" },
          when: { type: "string" }
        }
      }
    },
    priority: { type: "integer", minimum: 100, maximum: 999 },
    weight: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  }
};

/**
 * Layer constants for rule prioritization
 */
export const RuleLayers = {
  BASE: { min: 100, max: 199 },
  TECHNOLOGY: { min: 200, max: 299 },
  DOMAIN: { min: 300, max: 399 },
  CROSS_CUTTING: { min: 400, max: 499 },
  QUALITY: { min: 500, max: 599 },
  DEPLOYMENT: { min: 600, max: 699 }
};
