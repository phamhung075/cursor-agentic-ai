/**
 * Interface for rule references
 */
export interface RuleReference {
  /** Type of the reference (rule, file, etc.) */
  type: string;
  /** Path to the referenced resource */
  path: string;
}

/**
 * Interface for a rule
 */
export interface Rule {
  /** Description of the rule */
  description: string;
  /** Glob patterns to match files this rule applies to */
  globs?: string | string[];
  /** Whether this rule should always be applied */
  alwaysApply?: boolean;
  /** Content of the rule */
  content: string;
  /** References to other rules or files */
  references?: RuleReference[];
}
