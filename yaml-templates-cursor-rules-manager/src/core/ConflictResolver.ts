import { ConfigFile, ConfigLevel } from './ConfigManager';
import { MergeStrategy } from './InheritanceModel';
import { logger } from '../utils/logger';

/**
 * Conflict type enum for categorizing different types of conflicts
 */
export enum ConflictType {
  TypeMismatch = 'type_mismatch',
  ValueOverride = 'value_override',
  ArrayMergeConflict = 'array_merge_conflict',
  ObjectMergeConflict = 'object_merge_conflict',
  ReferenceResolutionError = 'reference_resolution_error'
}

/**
 * Resolution strategy enum for handling conflicts
 */
export enum ResolutionStrategy {
  UseHigherPriority = 'use_higher_priority',
  UseLowerPriority = 'use_lower_priority',
  MergeArrays = 'merge_arrays',
  MergeObjects = 'merge_objects',
  KeepBoth = 'keep_both',
  Custom = 'custom'
}

/**
 * Configuration conflict interface
 */
export interface ConfigConflict {
  type: ConflictType;
  path: string[];
  configA: string;
  configB: string;
  valueA: any;
  valueB: any;
  levelA: ConfigLevel;
  levelB: ConfigLevel;
  resolved: boolean;
  resolutionStrategy?: ResolutionStrategy;
  resolvedValue?: any;
}

/**
 * Interface for custom conflict resolution functions
 */
export interface ConflictResolutionFn {
  (conflict: ConfigConflict): any;
}

/**
 * Class responsible for detecting and resolving conflicts
 */
export class ConflictResolver {
  private customResolvers: Map<ConflictType, ConflictResolutionFn> = new Map();
  private conflicts: ConfigConflict[] = [];

  /**
   * Register a custom conflict resolver
   * @param type - Type of conflict to handle
   * @param resolver - Custom resolver function
   */
  public registerResolver(type: ConflictType, resolver: ConflictResolutionFn): void {
    this.customResolvers.set(type, resolver);
  }

  /**
   * Detect conflicts between two configuration objects
   * @param configA - First configuration
   * @param configB - Second configuration
   * @param path - Current path in the object tree
   */
  public detectConflicts(
    configA: ConfigFile, 
    configB: ConfigFile, 
    path: string[] = []
  ): void {
    this.detectObjectConflicts(
      configA.content, 
      configB.content, 
      path, 
      configA.name || 'unknown', 
      configB.name || 'unknown',
      configA.level || ConfigLevel.Project,
      configB.level || ConfigLevel.Project
    );
  }

  /**
   * Get all detected conflicts
   * @returns Array of configuration conflicts
   */
  public getConflicts(): ConfigConflict[] {
    return [...this.conflicts];
  }

  /**
   * Get unresolved conflicts
   * @returns Array of unresolved configuration conflicts
   */
  public getUnresolvedConflicts(): ConfigConflict[] {
    return this.conflicts.filter(conflict => !conflict.resolved);
  }

  /**
   * Resolve all conflicts automatically
   * @returns Number of conflicts resolved
   */
  public resolveAllConflicts(): number {
    let resolvedCount = 0;

    for (const conflict of this.conflicts) {
      if (!conflict.resolved) {
        this.resolveConflict(conflict);
        resolvedCount++;
      }
    }

    return resolvedCount;
  }

  /**
   * Resolve a specific conflict
   * @param conflict - Conflict to resolve
   * @param strategy - Optional specific resolution strategy to use
   * @param customValue - Optional custom value for resolution
   * @returns The resolved value
   */
  public resolveConflict(
    conflict: ConfigConflict,
    strategy?: ResolutionStrategy,
    customValue?: any
  ): any {
    // If already resolved, return the resolved value
    if (conflict.resolved && conflict.resolvedValue !== undefined) {
      return conflict.resolvedValue;
    }

    // Use provided strategy or determine automatically
    const resolutionStrategy = strategy || this.determineResolutionStrategy(conflict);
    
    // Resolve based on strategy
    let resolvedValue: any;
    
    switch (resolutionStrategy) {
      case ResolutionStrategy.UseHigherPriority:
        // Use the value from the higher priority config
        resolvedValue = this.getHigherPriorityValue(
          conflict.valueA, 
          conflict.valueB, 
          conflict.levelA, 
          conflict.levelB
        );
        break;
        
      case ResolutionStrategy.UseLowerPriority:
        // Use the value from the lower priority config
        resolvedValue = this.getLowerPriorityValue(
          conflict.valueA, 
          conflict.valueB, 
          conflict.levelA, 
          conflict.levelB
        );
        break;
        
      case ResolutionStrategy.MergeArrays:
        // Merge arrays if both values are arrays
        if (Array.isArray(conflict.valueA) && Array.isArray(conflict.valueB)) {
          resolvedValue = [...conflict.valueA, ...conflict.valueB];
        } else {
          logger.warn(`Cannot merge non-array values at ${conflict.path.join('.')}`);
          resolvedValue = this.getHigherPriorityValue(
            conflict.valueA, 
            conflict.valueB, 
            conflict.levelA, 
            conflict.levelB
          );
        }
        break;
        
      case ResolutionStrategy.MergeObjects:
        // Merge objects if both values are objects
        if (
          typeof conflict.valueA === 'object' && conflict.valueA !== null &&
          typeof conflict.valueB === 'object' && conflict.valueB !== null &&
          !Array.isArray(conflict.valueA) && !Array.isArray(conflict.valueB)
        ) {
          resolvedValue = { ...conflict.valueA, ...conflict.valueB };
        } else {
          logger.warn(`Cannot merge non-object values at ${conflict.path.join('.')}`);
          resolvedValue = this.getHigherPriorityValue(
            conflict.valueA, 
            conflict.valueB, 
            conflict.levelA, 
            conflict.levelB
          );
        }
        break;
        
      case ResolutionStrategy.KeepBoth:
        // Keep both values in an array
        resolvedValue = [conflict.valueA, conflict.valueB];
        break;
        
      case ResolutionStrategy.Custom:
        // Use custom value if provided, otherwise try custom resolver
        if (customValue !== undefined) {
          resolvedValue = customValue;
        } else {
          const customResolver = this.customResolvers.get(conflict.type);
          if (customResolver) {
            resolvedValue = customResolver(conflict);
          } else {
            logger.warn(`No custom resolver for conflict type ${conflict.type}`);
            resolvedValue = this.getHigherPriorityValue(
              conflict.valueA, 
              conflict.valueB, 
              conflict.levelA, 
              conflict.levelB
            );
          }
        }
        break;
        
      default:
        // Default to higher priority
        logger.warn(`Unknown resolution strategy: ${resolutionStrategy}`);
        resolvedValue = this.getHigherPriorityValue(
          conflict.valueA, 
          conflict.valueB, 
          conflict.levelA, 
          conflict.levelB
        );
    }
    
    // Update the conflict
    conflict.resolved = true;
    conflict.resolutionStrategy = resolutionStrategy;
    conflict.resolvedValue = resolvedValue;
    
    return resolvedValue;
  }

  /**
   * Apply resolved conflicts to a configuration
   * @param config - Configuration to update
   * @returns Updated configuration
   */
  public applyResolutions(config: ConfigFile): ConfigFile {
    // Create a deep copy of the config
    const result: ConfigFile = {
      ...config,
      content: JSON.parse(JSON.stringify(config.content))
    };
    
    // Apply each resolved conflict
    for (const conflict of this.conflicts) {
      if (conflict.resolved && 
          (conflict.configA === config.name || conflict.configB === config.name)) {
        // Apply the resolution to the appropriate path
        this.applyResolutionAtPath(
          result.content, 
          conflict.path, 
          conflict.resolvedValue
        );
      }
    }
    
    return result;
  }

  /**
   * Apply a resolution at a specific path in an object
   * @param obj - Object to update
   * @param path - Path to the property
   * @param value - Value to set
   */
  private applyResolutionAtPath(obj: any, path: string[], value: any): void {
    if (path.length === 0) {
      return;
    }
    
    let current = obj;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      
      if (current[segment] === undefined) {
        current[segment] = {};
      }
      
      current = current[segment];
    }
    
    // Set the value
    const lastSegment = path[path.length - 1];
    current[lastSegment] = value;
  }

  /**
   * Determine which resolution strategy to use for a conflict
   * @param conflict - Conflict to resolve
   * @returns The appropriate resolution strategy
   */
  private determineResolutionStrategy(conflict: ConfigConflict): ResolutionStrategy {
    switch (conflict.type) {
      case ConflictType.TypeMismatch:
        // For type mismatches, use the higher priority value
        return ResolutionStrategy.UseHigherPriority;
        
      case ConflictType.ValueOverride:
        // For value overrides, use the higher priority value
        return ResolutionStrategy.UseHigherPriority;
        
      case ConflictType.ArrayMergeConflict:
        // For array conflicts, merge the arrays
        return ResolutionStrategy.MergeArrays;
        
      case ConflictType.ObjectMergeConflict:
        // For object conflicts, merge the objects
        return ResolutionStrategy.MergeObjects;
        
      case ConflictType.ReferenceResolutionError:
        // For reference errors, use the higher priority value
        return ResolutionStrategy.UseHigherPriority;
        
      default:
        // Default to higher priority
        return ResolutionStrategy.UseHigherPriority;
    }
  }

  /**
   * Get the value from the higher priority configuration
   * @param valueA - Value from config A
   * @param valueB - Value from config B
   * @param levelA - Level of config A
   * @param levelB - Level of config B
   * @returns The higher priority value
   */
  private getHigherPriorityValue(
    valueA: any, 
    valueB: any, 
    levelA: ConfigLevel, 
    levelB: ConfigLevel
  ): any {
    // Lower index in PRECEDENCE_ORDER means higher priority
    const priorityA = Object.values(ConfigLevel).indexOf(levelA);
    const priorityB = Object.values(ConfigLevel).indexOf(levelB);
    
    return priorityA <= priorityB ? valueA : valueB;
  }

  /**
   * Get the value from the lower priority configuration
   * @param valueA - Value from config A
   * @param valueB - Value from config B
   * @param levelA - Level of config A
   * @param levelB - Level of config B
   * @returns The lower priority value
   */
  private getLowerPriorityValue(
    valueA: any, 
    valueB: any, 
    levelA: ConfigLevel, 
    levelB: ConfigLevel
  ): any {
    // Lower index in PRECEDENCE_ORDER means higher priority
    const priorityA = Object.values(ConfigLevel).indexOf(levelA);
    const priorityB = Object.values(ConfigLevel).indexOf(levelB);
    
    return priorityA > priorityB ? valueA : valueB;
  }

  /**
   * Detect conflicts between two objects
   * @param objA - First object
   * @param objB - Second object
   * @param path - Current path in the object tree
   * @param configA - Name of first configuration
   * @param configB - Name of second configuration
   * @param levelA - Level of first configuration
   * @param levelB - Level of second configuration
   */
  private detectObjectConflicts(
    objA: any, 
    objB: any, 
    path: string[], 
    configA: string, 
    configB: string,
    levelA: ConfigLevel,
    levelB: ConfigLevel
  ): void {
    // Type mismatch check
    if (typeof objA !== typeof objB) {
      this.conflicts.push({
        type: ConflictType.TypeMismatch,
        path: [...path],
        configA,
        configB,
        valueA: objA,
        valueB: objB,
        levelA,
        levelB,
        resolved: false
      });
      return;
    }
    
    // Handle arrays
    if (Array.isArray(objA) && Array.isArray(objB)) {
      // Check for array merge conflicts
      if (objA.length > 0 && objB.length > 0) {
        this.conflicts.push({
          type: ConflictType.ArrayMergeConflict,
          path: [...path],
          configA,
          configB,
          valueA: objA,
          valueB: objB,
          levelA,
          levelB,
          resolved: false
        });
      }
      return;
    }
    
    // Handle objects
    if (typeof objA === 'object' && objA !== null && typeof objB === 'object' && objB !== null) {
      // Get all keys from both objects
      const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
      
      for (const key of allKeys) {
        const hasKeyA = key in objA;
        const hasKeyB = key in objB;
        
        if (hasKeyA && hasKeyB) {
          // Both objects have the key, check for conflicts
          const valueA = objA[key];
          const valueB = objB[key];
          
          if (typeof valueA !== typeof valueB) {
            // Type mismatch
            this.conflicts.push({
              type: ConflictType.TypeMismatch,
              path: [...path, key],
              configA,
              configB,
              valueA,
              valueB,
              levelA,
              levelB,
              resolved: false
            });
          } else if (typeof valueA === 'object' && valueA !== null && 
                     typeof valueB === 'object' && valueB !== null) {
            // Recursively check objects
            this.detectObjectConflicts(
              valueA, 
              valueB, 
              [...path, key], 
              configA, 
              configB,
              levelA,
              levelB
            );
          } else if (valueA !== valueB) {
            // Value conflict
            this.conflicts.push({
              type: ConflictType.ValueOverride,
              path: [...path, key],
              configA,
              configB,
              valueA,
              valueB,
              levelA,
              levelB,
              resolved: false
            });
          }
        }
      }
    } else if (objA !== objB) {
      // Handle primitive values
      this.conflicts.push({
        type: ConflictType.ValueOverride,
        path: [...path],
        configA,
        configB,
        valueA: objA,
        valueB: objB,
        levelA,
        levelB,
        resolved: false
      });
    }
  }
} 