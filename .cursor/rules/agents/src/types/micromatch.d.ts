/**
 * Type definitions for micromatch
 * https://github.com/micromatch/micromatch
 */

declare module 'micromatch' {
  /**
   * Returns true if a file path matches the given glob pattern(s)
   */
  export function isMatch(filepath: string, patterns: string | string[], options?: any): boolean;

  /**
   * Returns an array of strings that match one or more glob patterns
   */
  export function match(list: string[], patterns: string | string[], options?: any): string[];

  /**
   * Filter an array of strings using glob patterns
   */
  export function filter(patterns: string | string[], options?: any): (file: string) => boolean;

  /**
   * Create a matcher function from a glob pattern
   */
  export function matcher(pattern: string | string[], options?: any): (file: string) => boolean;

  /**
   * Test whether a filepath matches the given glob pattern
   */
  export function contains(filepath: string, pattern: string, options?: any): boolean;

  /**
   * Match with custom implementation for handling negation patterns
   */
  export function matchBase(pattern: string, filepath: string, options?: any): boolean;
}
