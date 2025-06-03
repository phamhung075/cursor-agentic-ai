/**
 * Metadata Schema Definitions
 *
 * Defines the standardized schema for rule metadata and composition rules.
 */

import { z } from 'zod';

/**
 * Rule Layer constraints
 * Defines the priority ranges for different rule layers
 */
export const RuleLayerSchema = z.object({
  name: z.string().describe('Layer name for grouping rules'),
  min: z.number().int().min(100).max(999).describe('Minimum priority value for this layer'),
  max: z.number().int().min(100).max(999).describe('Maximum priority value for this layer'),
  description: z.string().describe('Description of the purpose of this layer'),
});

/**
 * Rule composition strategy schema
 * Defines how rules should be composed at different layers
 */
export const CompositionStrategySchema = z.enum([
  'override', // Higher priority rules completely override lower priority ones
  'merge',    // Rules are merged with higher priority rules having precedence for conflicts
  'append',   // Rules are combined with higher priority rules appended to lower priority ones
  'prepend',  // Rules are combined with higher priority rules prepended to lower priority ones
  'union',    // For arrays, create a union of values from all rules
  'intersection', // For arrays, only keep values present in all rules
]);

/**
 * Rule composition field schema
 * Defines how a specific field in rules should be composed
 */
export const CompositionFieldSchema = z.object({
  path: z.string().describe('JSON path to the field (e.g., cursor_rules.intellisense_settings)'),
  strategy: CompositionStrategySchema.describe('Composition strategy for this field'),
  description: z.string().optional().describe('Description of why this strategy was chosen'),
});

/**
 * Rule metadata schema
 * Defines how rules should be composed
 */
export const MetadataRuleSchema = z.object({
  metadata: z.object({
    id: z.string().min(1).describe('Unique identifier for the metadata rule'),
    name: z.string().min(1).describe('Human-readable name of the metadata rule'),
    description: z.string().describe('Detailed description of what this metadata rule defines'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/).describe('Semantic version (MAJOR.MINOR.PATCH)'),
    author: z.string().describe('Author or team responsible for the metadata rule'),
    created: z.string().describe('Creation date in ISO format'),
    updated: z.string().describe('Last update date in ISO format'),
  }),

  layers: z.array(RuleLayerSchema)
    .describe('Layer definitions for rule prioritization'),

  composition: z.object({
    default_strategy: CompositionStrategySchema
      .describe('Default composition strategy for fields not explicitly defined'),

    fields: z.array(CompositionFieldSchema)
      .describe('Field-specific composition strategies'),
  }),

  conflict_resolution: z.object({
    allow_conflicts: z.boolean()
      .describe('Whether to allow conflicting rules to be active simultaneously'),

    resolution_strategy: z.enum(['higher_priority', 'higher_weight', 'higher_confidence', 'newer_rule'])
      .describe('Strategy to use when resolving conflicts between rules'),

    manual_resolution: z.boolean()
      .describe('Whether to prompt users for manual resolution of conflicts'),
  }),
});

/**
 * Type definitions generated from the schemas
 */
export type RuleLayer = z.infer<typeof RuleLayerSchema>;
export type CompositionStrategy = z.infer<typeof CompositionStrategySchema>;
export type CompositionField = z.infer<typeof CompositionFieldSchema>;
export type MetadataRule = z.infer<typeof MetadataRuleSchema>;

/**
 * JSON Schema representation for documentation purposes
 */
export const metadataRuleJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Rule Metadata",
  description: "Schema for defining how cursor rules should be composed",
  type: "object",
  required: ["metadata", "layers", "composition", "conflict_resolution"],
  properties: {
    metadata: {
      type: "object",
      required: ["id", "name", "description", "version", "author", "created", "updated"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        description: { type: "string" },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        author: { type: "string" },
        created: { type: "string", format: "date-time" },
        updated: { type: "string", format: "date-time" }
      }
    },
    layers: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "min", "max", "description"],
        properties: {
          name: { type: "string" },
          min: { type: "integer", minimum: 100, maximum: 999 },
          max: { type: "integer", minimum: 100, maximum: 999 },
          description: { type: "string" }
        }
      }
    },
    composition: {
      type: "object",
      required: ["default_strategy", "fields"],
      properties: {
        default_strategy: {
          type: "string",
          enum: ["override", "merge", "append", "prepend", "union", "intersection"]
        },
        fields: {
          type: "array",
          items: {
            type: "object",
            required: ["path", "strategy"],
            properties: {
              path: { type: "string" },
              strategy: {
                type: "string",
                enum: ["override", "merge", "append", "prepend", "union", "intersection"]
              },
              description: { type: "string" }
            }
          }
        }
      }
    },
    conflict_resolution: {
      type: "object",
      required: ["allow_conflicts", "resolution_strategy", "manual_resolution"],
      properties: {
        allow_conflicts: { type: "boolean" },
        resolution_strategy: {
          type: "string",
          enum: ["higher_priority", "higher_weight", "higher_confidence", "newer_rule"]
        },
        manual_resolution: { type: "boolean" }
      }
    }
  }
};
