import { Rule } from './ruleTypes';
import * as path from 'path';

/**
 * Utility for matching rules to files
 */
export class RuleMatcher {
  /**
   * Checks if a rule applies to a file based on glob patterns
   * @param rule The rule to check
   * @param filePath The file path to check against
   * @returns Whether the rule applies to the file
   */
  public static doesRuleApplyToFile(rule: Rule, filePath: string): boolean {
    // Always apply rules marked as such
    if (rule.alwaysApply) {
      return true;
    }

    // No globs means no match
    if (!rule.globs || rule.globs.length === 0) {
      return false;
    }

    // Simple path-based matching for the benchmark
    // This is a simplified version that avoids regex complexity
    for (const glob of rule.globs) {
      // Handle negative patterns
      const isNegative = glob.startsWith('!');
      const pattern = isNegative ? glob.substring(1) : glob;

      // Very basic glob implementation for benchmark
      // Just checks for extension or directory matches
      const isMatch = this.simpleMatch(filePath, pattern);

      if (isNegative && isMatch) {
        return false; // Excluded by negative pattern
      } else if (!isNegative && isMatch) {
        return true; // Matched by positive pattern
      }
    }

    return false;
  }

  /**
   * Simple pattern matching for benchmarking purposes only
   * @param filePath File path to check
   * @param pattern Simple glob pattern
   * @returns Whether the file matches the pattern
   */
  private static simpleMatch(filePath: string, pattern: string): boolean {
    // Normalize paths
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Handle extension patterns (e.g., "**/*.ts")
    if (pattern.includes('*.')) {
      const extension = pattern.split('*.')[1];
      return normalizedPath.endsWith(`.${extension}`);
    }

    // Handle directory patterns (e.g., "src/**")
    if (pattern.includes('/**')) {
      const directory = pattern.split('/**')[0];
      return normalizedPath.startsWith(directory);
    }

    // Direct matches
    return normalizedPath === normalizedPattern;
  }
}
