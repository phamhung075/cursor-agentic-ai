/**
 * Complex Rule System - Context Manager
 *
 * This file implements a context manager for rule application that provides
 * contextual awareness for rules based on file content, project structure,
 * and other relevant factors.
 */

import { ComplexRule, RuleParameter } from '../models';

/**
 * Interface for context values
 */
export interface ContextValue {
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Raw value */
  value: any;
  /** Source of the value */
  source: 'rule' | 'file' | 'project' | 'global' | 'user';
  /** Time when the value was last updated */
  lastUpdated: number;
}

/**
 * Interface for context scope
 */
export interface ContextScope {
  /** Scope name */
  name: string;
  /** Scope values */
  values: Map<string, ContextValue>;
  /** Child scopes */
  children: Map<string, ContextScope>;
  /** Parent scope (if any) */
  parent?: ContextScope;
  /** Whether the scope is persistent */
  persistent: boolean;
}

/**
 * Context manager for the Complex Rule System
 */
export class ContextManager {
  /** Global scope */
  private globalScope: ContextScope;
  /** Current active scope */
  private activeScope: ContextScope;
  /** Persistent storage for context values */
  private storage: Map<string, any> = new Map();

  /**
   * Constructor for the context manager
   */
  constructor() {
    // Initialize global scope
    this.globalScope = {
      name: 'global',
      values: new Map(),
      children: new Map(),
      persistent: true
    };

    // Set global scope as active scope
    this.activeScope = this.globalScope;

    // Initialize project scope
    const projectScope: ContextScope = {
      name: 'project',
      values: new Map(),
      children: new Map(),
      parent: this.globalScope,
      persistent: true
    };

    // Add project scope to global scope
    this.globalScope.children.set('project', projectScope);
  }

  /**
   * Create a new scope
   * @param name Scope name
   * @param parent Parent scope
   * @param persistent Whether the scope is persistent
   * @returns New scope
   */
  createScope(name: string, parent: ContextScope = this.activeScope, persistent: boolean = false): ContextScope {
    // Check if scope already exists
    if (parent.children.has(name)) {
      return parent.children.get(name)!;
    }

    // Create new scope
    const scope: ContextScope = {
      name,
      values: new Map(),
      children: new Map(),
      parent,
      persistent
    };

    // Add scope to parent
    parent.children.set(name, scope);

    return scope;
  }

  /**
   * Switch to a scope
   * @param scope Scope to switch to
   */
  setActiveScope(scope: ContextScope): void {
    this.activeScope = scope;
  }

  /**
   * Get a scope by path
   * @param path Path to scope (e.g., 'project.files.src')
   * @param createIfMissing Whether to create missing scopes
   * @returns Scope at path
   */
  getScope(path: string, createIfMissing: boolean = false): ContextScope | undefined {
    const parts = path.split('.');
    let current: ContextScope = this.globalScope;

    for (const part of parts) {
      if (!current.children.has(part)) {
        if (createIfMissing) {
          current = this.createScope(part, current);
        } else {
          return undefined;
        }
      } else {
        current = current.children.get(part)!;
      }
    }

    return current;
  }

  /**
   * Create a file scope
   * @param filePath File path
   * @returns File scope
   */
  createFileScope(filePath: string): ContextScope {
    // Create or get files scope
    const filesScope = this.getScope('project.files', true)!;

    // Create normalized file path
    const normalizedPath = filePath.replace(/[/\\]/g, '_');

    // Create file scope
    return this.createScope(normalizedPath, filesScope);
  }

  /**
   * Create a rule scope
   * @param rule Rule to create scope for
   * @returns Rule scope
   */
  createRuleScope(rule: ComplexRule): ContextScope {
    // Create or get rules scope
    const rulesScope = this.getScope('project.rules', true)!;

    // Create rule scope
    const ruleScope = this.createScope(rule.id, rulesScope);

    // Initialize rule parameters
    for (const param of rule.metadata.parameters) {
      this.setValue(param.name, param.defaultValue, ruleScope, 'rule');
    }

    return ruleScope;
  }

  /**
   * Set a value in the active scope
   * @param key Key to set
   * @param value Value to set
   * @param scope Scope to set in (defaults to active scope)
   * @param source Source of the value
   */
  setValue(key: string, value: any, scope: ContextScope = this.activeScope, source: ContextValue['source'] = 'user'): void {
    // Create context value
    const contextValue: ContextValue = {
      type: this.getValueType(value),
      value,
      source,
      lastUpdated: Date.now()
    };

    // Set value in scope
    scope.values.set(key, contextValue);

    // Update persistent storage if scope is persistent
    if (scope.persistent) {
      const path = this.getScopePath(scope);
      this.storage.set(`${path}.${key}`, value);
    }
  }

  /**
   * Get a value from the active scope or parent scopes
   * @param key Key to get
   * @param scope Scope to get from (defaults to active scope)
   * @returns Value or undefined if not found
   */
  getValue<T = any>(key: string, scope: ContextScope = this.activeScope): T | undefined {
    // Check current scope
    if (scope.values.has(key)) {
      return scope.values.get(key)!.value as T;
    }

    // Check parent scope
    if (scope.parent) {
      return this.getValue<T>(key, scope.parent);
    }

    // Value not found
    return undefined;
  }

  /**
   * Get a context value from the active scope or parent scopes
   * @param key Key to get
   * @param scope Scope to get from (defaults to active scope)
   * @returns Context value or undefined if not found
   */
  getContextValue(key: string, scope: ContextScope = this.activeScope): ContextValue | undefined {
    // Check current scope
    if (scope.values.has(key)) {
      return scope.values.get(key);
    }

    // Check parent scope
    if (scope.parent) {
      return this.getContextValue(key, scope.parent);
    }

    // Value not found
    return undefined;
  }

  /**
   * Check if a value exists in the active scope or parent scopes
   * @param key Key to check
   * @param scope Scope to check in (defaults to active scope)
   * @returns Whether the value exists
   */
  hasValue(key: string, scope: ContextScope = this.activeScope): boolean {
    // Check current scope
    if (scope.values.has(key)) {
      return true;
    }

    // Check parent scope
    if (scope.parent) {
      return this.hasValue(key, scope.parent);
    }

    // Value not found
    return false;
  }

  /**
   * Delete a value from the active scope
   * @param key Key to delete
   * @param scope Scope to delete from (defaults to active scope)
   * @returns Whether the value was deleted
   */
  deleteValue(key: string, scope: ContextScope = this.activeScope): boolean {
    // Delete value from scope
    const result = scope.values.delete(key);

    // Update persistent storage if scope is persistent
    if (result && scope.persistent) {
      const path = this.getScopePath(scope);
      this.storage.delete(`${path}.${key}`);
    }

    return result;
  }

  /**
   * Clear all values from the active scope
   * @param scope Scope to clear (defaults to active scope)
   */
  clearScope(scope: ContextScope = this.activeScope): void {
    // Clear values
    scope.values.clear();

    // Update persistent storage if scope is persistent
    if (scope.persistent) {
      const path = this.getScopePath(scope);

      // Delete all values with this scope path
      for (const key of this.storage.keys()) {
        if (key.startsWith(`${path}.`)) {
          this.storage.delete(key);
        }
      }
    }
  }

  /**
   * Apply rule parameters to the rule scope
   * @param rule Rule to apply parameters for
   * @param params Parameter values to apply
   * @returns Rule scope with applied parameters
   */
  applyRuleParameters(rule: ComplexRule, params: Record<string, any> = {}): ContextScope {
    // Create or get rule scope
    const ruleScope = this.createRuleScope(rule);

    // Apply parameter values
    for (const [key, value] of Object.entries(params)) {
      // Check if parameter exists
      const param = rule.metadata.parameters.find(p => p.name === key);

      if (param) {
        // Validate parameter value
        if (this.validateParameterValue(param, value)) {
          this.setValue(key, value, ruleScope, 'user');
        }
      }
    }

    return ruleScope;
  }

  /**
   * Save context to persistent storage
   */
  saveContext(): void {
    // In a real implementation, this would save to disk or database
    console.log('Context saved', this.storage.size);
  }

  /**
   * Load context from persistent storage
   */
  loadContext(): void {
    // In a real implementation, this would load from disk or database
    console.log('Context loaded', this.storage.size);
  }

  /**
   * Get the type of a value
   * @param value Value to get type of
   * @returns Type of value
   */
  private getValueType(value: any): ContextValue['type'] {
    if (value === null || value === undefined) {
      return 'object';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    return typeof value as ContextValue['type'];
  }

  /**
   * Get the path to a scope
   * @param scope Scope to get path for
   * @returns Path to scope
   */
  private getScopePath(scope: ContextScope): string {
    const parts: string[] = [scope.name];
    let current = scope;

    while (current.parent) {
      current = current.parent;
      parts.unshift(current.name);
    }

    return parts.join('.');
  }

  /**
   * Validate a parameter value against its definition
   * @param param Parameter definition
   * @param value Value to validate
   * @returns Whether the value is valid
   */
  private validateParameterValue(param: RuleParameter, value: any): boolean {
    // Check required
    if (param.required && (value === undefined || value === null)) {
      return false;
    }

    // Check type
    if (value !== undefined && value !== null) {
      if (param.type === 'string' && typeof value !== 'string') {
        return false;
      }

      if (param.type === 'number' && typeof value !== 'number') {
        return false;
      }

      if (param.type === 'boolean' && typeof value !== 'boolean') {
        return false;
      }

      if (param.type === 'array' && !Array.isArray(value)) {
        return false;
      }

      if (param.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        return false;
      }
    }

    // Check validation rules
    if (param.validation) {
      // Check pattern
      if (param.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(param.validation.pattern);

        if (!regex.test(value)) {
          return false;
        }
      }

      // Check min/max for numbers
      if (typeof value === 'number') {
        if (param.validation.min !== undefined && value < param.validation.min) {
          return false;
        }

        if (param.validation.max !== undefined && value > param.validation.max) {
          return false;
        }
      }

      // Check min/max for arrays
      if (Array.isArray(value)) {
        if (param.validation.min !== undefined && value.length < param.validation.min) {
          return false;
        }

        if (param.validation.max !== undefined && value.length > param.validation.max) {
          return false;
        }
      }

      // Check enum
      if (param.validation.enum && !param.validation.enum.includes(value)) {
        return false;
      }
    }

    return true;
  }
}
