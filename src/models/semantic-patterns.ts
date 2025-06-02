/**
 * Complex Rule System - Semantic Pattern Models
 *
 * This file implements semantic pattern models for advanced code analysis
 * beyond simple pattern matching.
 */

import { SemanticPattern } from './rule-model';

/**
 * Enum for different types of semantic patterns
 */
export enum SemanticPatternType {
  FUNCTION_CALL = 'functionCall',
  VARIABLE_USAGE = 'variableUsage',
  DATA_FLOW = 'dataFlow',
  CONTROL_FLOW = 'controlFlow',
  DEPENDENCY = 'dependency',
  IMPORT_EXPORT = 'importExport',
  CLASS_STRUCTURE = 'classStructure',
  TYPE_USAGE = 'typeUsage',
  CUSTOM = 'custom'
}

/**
 * Enum for different formats of pattern definitions
 */
export enum PatternFormat {
  AST = 'ast',
  REGEX = 'regex',
  JSONPATH = 'jsonpath',
  XPATH = 'xpath',
  GRAPHQUERY = 'graphquery',
  CUSTOM = 'custom'
}

/**
 * Interface for function call pattern
 */
export interface FunctionCallPattern {
  /** Name or pattern of the function */
  name: string;
  /** Match by exact name or pattern */
  exactMatch?: boolean;
  /** Parameter constraints */
  parameters?: {
    /** Minimum number of parameters */
    minCount?: number;
    /** Maximum number of parameters */
    maxCount?: number;
    /** Specific parameter constraints by index or name */
    constraints?: Array<{
      /** Parameter index or name */
      key: number | string;
      /** Value pattern to match */
      value?: string;
      /** Type to match */
      type?: string;
    }>;
  };
  /** Constraints on the calling context */
  callingContext?: {
    /** Type of scope (global, module, class, function) */
    scope?: string;
    /** Allowed parent constructs */
    allowedParents?: string[];
    /** Disallowed parent constructs */
    disallowedParents?: string[];
  };
}

/**
 * Interface for variable usage pattern
 */
export interface VariableUsagePattern {
  /** Name or pattern of the variable */
  name: string;
  /** Match by exact name or pattern */
  exactMatch?: boolean;
  /** Usage context */
  usage: 'read' | 'write' | 'readWrite';
  /** Type constraints */
  typeConstraints?: string[];
  /** Scope constraints */
  scopeConstraints?: {
    /** Type of scope (global, module, class, function) */
    scope: string;
    /** Name pattern for the scope */
    name?: string;
  };
}

/**
 * Interface for data flow pattern
 */
export interface DataFlowPattern {
  /** Source of the data */
  source: {
    /** Type of source (parameter, variable, function, etc.) */
    type: string;
    /** Name or pattern for the source */
    name: string;
  };
  /** Sink for the data */
  sink: {
    /** Type of sink (return, variable, function, etc.) */
    type: string;
    /** Name or pattern for the sink */
    name: string;
  };
  /** Intermediate operations */
  operations?: Array<{
    /** Type of operation (transformation, validation, etc.) */
    type: string;
    /** Name or pattern for the operation */
    name?: string;
  }>;
}

/**
 * Interface for control flow pattern
 */
export interface ControlFlowPattern {
  /** Type of control flow structure */
  structureType: 'if' | 'switch' | 'loop' | 'try' | 'function';
  /** Constraints on the condition */
  conditionConstraints?: {
    /** Variables referenced in condition */
    variables?: string[];
    /** Functions called in condition */
    functions?: string[];
    /** Pattern for the condition expression */
    pattern?: string;
  };
  /** Constraints on the body */
  bodyConstraints?: {
    /** Required statements */
    requiredStatements?: string[];
    /** Prohibited statements */
    prohibitedStatements?: string[];
    /** Nesting depth */
    maxNestingDepth?: number;
  };
}

/**
 * Interface for import/export pattern
 */
export interface ImportExportPattern {
  /** Type of pattern */
  type: 'import' | 'export';
  /** Module name or pattern */
  module?: string;
  /** Imported/exported symbol */
  symbol?: string;
  /** Whether default import/export */
  isDefault?: boolean;
  /** Alias pattern */
  alias?: string;
}

/**
 * Interface for class structure pattern
 */
export interface ClassStructurePattern {
  /** Name or pattern for the class */
  name?: string;
  /** Required superclasses */
  extends?: string[];
  /** Required interfaces */
  implements?: string[];
  /** Required members */
  requiredMembers?: Array<{
    /** Name or pattern */
    name: string;
    /** Type (method, property, getter, setter) */
    type: string;
    /** Access modifier */
    access?: 'public' | 'private' | 'protected';
    /** Whether it's static */
    static?: boolean;
  }>;
  /** Pattern for class decorator */
  decoratorPattern?: string;
}

/**
 * Interface for type usage pattern
 */
export interface TypeUsagePattern {
  /** Name or pattern for the type */
  name: string;
  /** Context where the type is used */
  context: 'variable' | 'parameter' | 'return' | 'extends' | 'implements' | 'typeAssertion';
  /** Whether generic type */
  isGeneric?: boolean;
  /** Constraints on generic type parameters */
  genericConstraints?: string[];
}

/**
 * Type for all specific pattern types
 */
export type PatternDefinition =
  | FunctionCallPattern
  | VariableUsagePattern
  | DataFlowPattern
  | ControlFlowPattern
  | ImportExportPattern
  | ClassStructurePattern
  | TypeUsagePattern
  | Record<string, any>; // For custom patterns

/**
 * Factory class for creating semantic patterns
 */
export class SemanticPatternFactory {
  /**
   * Creates a function call pattern
   */
  static createFunctionCallPattern(
    id: string,
    pattern: FunctionCallPattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.FUNCTION_CALL,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || { description: `Detect function calls matching pattern: ${pattern.name}` }
    };
  }

  /**
   * Creates a variable usage pattern
   */
  static createVariableUsagePattern(
    id: string,
    pattern: VariableUsagePattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.VARIABLE_USAGE,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || { description: `Detect variable usage matching pattern: ${pattern.name}` }
    };
  }

  /**
   * Creates a data flow pattern
   */
  static createDataFlowPattern(
    id: string,
    pattern: DataFlowPattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.DATA_FLOW,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.GRAPHQUERY,
      language: languages,
      metadata: metadata || {
        description: `Detect data flow from ${pattern.source.name} to ${pattern.sink.name}`
      }
    };
  }

  /**
   * Creates a control flow pattern
   */
  static createControlFlowPattern(
    id: string,
    pattern: ControlFlowPattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.CONTROL_FLOW,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || {
        description: `Detect control flow structures of type: ${pattern.structureType}`
      }
    };
  }

  /**
   * Creates an import/export pattern
   */
  static createImportExportPattern(
    id: string,
    pattern: ImportExportPattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.IMPORT_EXPORT,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || {
        description: `Detect ${pattern.type} of ${pattern.symbol || 'module'} from ${pattern.module || 'any module'}`
      }
    };
  }

  /**
   * Creates a class structure pattern
   */
  static createClassStructurePattern(
    id: string,
    pattern: ClassStructurePattern,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.CLASS_STRUCTURE,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || {
        description: `Detect class structures ${pattern.name ? `matching: ${pattern.name}` : ''}`
      }
    };
  }

  /**
   * Creates a type usage pattern
   */
  static createTypeUsagePattern(
    id: string,
    pattern: TypeUsagePattern,
    languages: string[] = ['typescript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: SemanticPatternType.TYPE_USAGE,
      pattern: JSON.stringify(pattern),
      format: PatternFormat.AST,
      language: languages,
      metadata: metadata || {
        description: `Detect usage of type ${pattern.name} in context: ${pattern.context}`
      }
    };
  }

  /**
   * Creates a custom pattern
   */
  static createCustomPattern(
    id: string,
    type: string,
    pattern: any,
    format: PatternFormat,
    languages: string[] = ['typescript', 'javascript'],
    metadata?: Record<string, any>
  ): SemanticPattern {
    return {
      id,
      type: type as any,
      pattern: typeof pattern === 'string' ? pattern : JSON.stringify(pattern),
      format,
      language: languages,
      metadata: metadata || { description: `Custom pattern of type: ${type}` }
    };
  }

  /**
   * Parses a semantic pattern into its specific type
   */
  static parsePattern(semanticPattern: SemanticPattern): PatternDefinition {
    try {
      return JSON.parse(semanticPattern.pattern);
    } catch (e) {
      // If it's not JSON, return as is
      return { rawPattern: semanticPattern.pattern };
    }
  }
}

/**
 * Class for composite patterns that combine multiple patterns with logical operations
 */
export class CompositePattern {
  /**
   * Creates a pattern that requires all specified patterns to match (AND)
   */
  static createAllPattern(
    id: string,
    patterns: SemanticPattern[],
    languages?: string[],
    metadata?: Record<string, any>
  ): SemanticPattern {
    const commonLanguages = languages || this.findCommonLanguages(patterns);

    return {
      id,
      type: 'composite',
      pattern: JSON.stringify({
        operation: 'ALL',
        patterns: patterns.map(p => p.id)
      }),
      format: PatternFormat.CUSTOM,
      language: commonLanguages,
      metadata: metadata || {
        description: `Composite pattern requiring all of: ${patterns.map(p => p.id).join(', ')}`,
        childPatterns: patterns.map(p => p.id)
      }
    };
  }

  /**
   * Creates a pattern that requires any of the specified patterns to match (OR)
   */
  static createAnyPattern(
    id: string,
    patterns: SemanticPattern[],
    languages?: string[],
    metadata?: Record<string, any>
  ): SemanticPattern {
    const commonLanguages = languages || this.findCommonLanguages(patterns);

    return {
      id,
      type: 'composite',
      pattern: JSON.stringify({
        operation: 'ANY',
        patterns: patterns.map(p => p.id)
      }),
      format: PatternFormat.CUSTOM,
      language: commonLanguages,
      metadata: metadata || {
        description: `Composite pattern requiring any of: ${patterns.map(p => p.id).join(', ')}`,
        childPatterns: patterns.map(p => p.id)
      }
    };
  }

  /**
   * Creates a pattern that requires the first pattern to match and the second not to match (AND NOT)
   */
  static createNotPattern(
    id: string,
    pattern: SemanticPattern,
    notPattern: SemanticPattern,
    languages?: string[],
    metadata?: Record<string, any>
  ): SemanticPattern {
    const commonLanguages = languages || this.findCommonLanguages([pattern, notPattern]);

    return {
      id,
      type: 'composite',
      pattern: JSON.stringify({
        operation: 'NOT',
        pattern: pattern.id,
        notPattern: notPattern.id
      }),
      format: PatternFormat.CUSTOM,
      language: commonLanguages,
      metadata: metadata || {
        description: `Composite pattern requiring ${pattern.id} AND NOT ${notPattern.id}`,
        childPatterns: [pattern.id, notPattern.id]
      }
    };
  }

  /**
   * Creates a pattern that requires patterns to match in sequence (SEQUENCE)
   */
  static createSequencePattern(
    id: string,
    patterns: SemanticPattern[],
    maxDistance?: number,
    languages?: string[],
    metadata?: Record<string, any>
  ): SemanticPattern {
    const commonLanguages = languages || this.findCommonLanguages(patterns);

    return {
      id,
      type: 'composite',
      pattern: JSON.stringify({
        operation: 'SEQUENCE',
        patterns: patterns.map(p => p.id),
        maxDistance
      }),
      format: PatternFormat.CUSTOM,
      language: commonLanguages,
      metadata: metadata || {
        description: `Composite pattern requiring sequence: ${patterns.map(p => p.id).join(' -> ')}`,
        childPatterns: patterns.map(p => p.id),
        maxDistance
      }
    };
  }

  /**
   * Finds common languages among patterns
   */
  private static findCommonLanguages(patterns: SemanticPattern[]): string[] {
    if (patterns.length === 0) return [];
    if (patterns.length === 1) return patterns[0].language || [];

    // Start with languages from the first pattern
    let commonLanguages = new Set(patterns[0].language || []);

    // Intersect with languages from each other pattern
    for (let i = 1; i < patterns.length; i++) {
      const patternLanguages = new Set(patterns[i].language || []);
      commonLanguages = new Set(
        [...commonLanguages].filter(lang => patternLanguages.has(lang))
      );
    }

    return [...commonLanguages];
  }
}
