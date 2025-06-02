import { Rule, RuleMetadata, RuleSection, CodeExample, RuleReference } from '../common/types';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { RuleCache } from './ruleCache';
import micromatch from 'micromatch';

/**
 * Extended Rule interface with additional properties needed by the parser
 */
interface ParsedRule extends Rule {
  title?: string;
  sections?: RuleSection[];
}

/**
 * Parses rule files in the cursor workspace
 */
export class RuleParser {
  // Compiled regex patterns for faster parsing
  private static sectionRegex = /^##\s+(.+)$([\s\S]*?)(?=^##\s+|\s*$)/gm;
  private static codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  private static bulletPointRegex = /^\s*-\s+(.+)$/gm;
  private static refRegex = /\[([^\]]+)\]\(mdc:([^)]+)\)/g;

  // Cache for compiled glob patterns
  private static globPatternCache = new Map<string, RegExp>();

  /**
   * Parses a rule file from the given path
   * @param filePath Path to the rule file
   * @returns Parsed rule object
   */
  public static parseRuleFile(filePath: string): ParsedRule {
    // Try to get from cache first
    try {
      const ruleCache = RuleCache.getInstance();
      const cachedRule = ruleCache.getParsedRule(filePath);

      // Return cached rule without the path property
      const { path: _, ...rule } = cachedRule;
      return rule as ParsedRule;
    } catch (error) {
      // Cache not available or error occurred, parse normally
    }

    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Use gray-matter to parse frontmatter
    const { data, content } = matter(fileContent);

    // Extract title from the first line (assuming it's a markdown heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.mdc');

    // Parse metadata
    const metadata: RuleMetadata = {
      description: data.description || '',
      globs: typeof data.globs === 'string' ? data.globs.split(',').map(g => g.trim()) : data.globs || [],
      alwaysApply: Boolean(data.alwaysApply),
      priority: data.priority || undefined,
      category: data.category || undefined,
      relatedRules: data.relatedRules || undefined,
      version: data.version || undefined
    };

    // Parse sections
    const sections = this.parseSections(content);

    // Extract references
    const references = this.extractReferences(content);

    // Create rule object according to the interface
    const rule: ParsedRule = {
      description: metadata.description,
      globs: metadata.globs,
      alwaysApply: metadata.alwaysApply,
      version: metadata.version,
      content: content,
      references: references,
      // Additional properties needed by the parser but not in the base interface
      title: title,
      sections: sections
    };

    return rule;
  }

  /**
   * Parses rule content into sections
   * @param content Rule content
   * @returns Array of rule sections
   */
  private static parseSections(content: string): RuleSection[] {
    const sections: RuleSection[] = [];

    // Reset regex lastIndex
    this.sectionRegex.lastIndex = 0;

    // Split content by second-level headings
    let match;
    while ((match = this.sectionRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const sectionContent = match[2].trim();

      // Extract code examples
      const codeExamples = this.extractCodeExamples(sectionContent);

      // Extract directives (bullet points)
      const directives = this.extractDirectives(sectionContent);

      sections.push({
        title,
        content: sectionContent,
        codeExamples,
        directives
      });
    }

    return sections;
  }

  /**
   * Extracts code examples from section content
   * @param content Section content
   * @returns Array of code examples
   */
  private static extractCodeExamples(content: string): CodeExample[] {
    const codeExamples: CodeExample[] = [];

    // Reset regex lastIndex
    this.codeBlockRegex.lastIndex = 0;

    let match;
    while ((match = this.codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      // Determine if this is a positive or negative example
      const isPositive = !code.includes('// ❌') && !code.includes('// DON\'T');

      codeExamples.push({
        language,
        code,
        isPositive
      });
    }

    return codeExamples;
  }

  /**
   * Extracts directives (bullet points) from section content
   * @param content Section content
   * @returns Array of directive strings
   */
  private static extractDirectives(content: string): string[] {
    const directives: string[] = [];

    // Reset regex lastIndex
    this.bulletPointRegex.lastIndex = 0;

    let match;
    while ((match = this.bulletPointRegex.exec(content)) !== null) {
      directives.push(match[1].trim());
    }

    return directives;
  }

  /**
   * Extracts references to other rules
   * @param content Rule content
   * @returns Array of rule references
   */
  private static extractReferences(content: string): RuleReference[] {
    const references: RuleReference[] = [];

    // Reset regex lastIndex
    this.refRegex.lastIndex = 0;

    let match;
    while ((match = this.refRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const refPath = match[2].trim();

      // Check if there's a section reference
      const sectionMatch = refPath.match(/#(.+)$/);

      references.push({
        type: 'rule', // Using 'rule' as default type to match the interface
        path: sectionMatch ? refPath.replace(/#.+$/, '') : refPath
      });
    }

    return references;
  }

  /**
   * Recursively traverses a directory to find all .mdc files
   * @param dirPath Directory path to traverse
   * @returns Array of .mdc file paths
   */
  private static traverseDirectory(dirPath: string): string[] {
    const ruleFiles: string[] = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          ruleFiles.push(...this.traverseDirectory(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
          ruleFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Error traversing directory ${dirPath}:`, error);
    }

    return ruleFiles;
  }

  /**
   * Gets all rule files in the given directory
   * @param directory Directory to search in
   * @returns List of rule file paths
   */
  static getRuleFiles(directory: string = '.cursor/rules'): string[] {
    try {
      const ruleDirPath = path.resolve(directory, '.cursor/rules');
      console.log(`Searching for rules in: ${ruleDirPath}`);

      // Check if the directory exists
      if (!fs.existsSync(ruleDirPath)) {
        console.warn(`Directory not found: ${ruleDirPath}`);
        // Try alternative path: look for rules directory at the specified path directly
        const altPath = path.resolve(directory);
        if (fs.existsSync(altPath)) {
          console.log(`Using alternative path: ${altPath}`);
          return this.traverseDirectory(altPath);
        }

        // If no rules directory found, return empty array
        console.warn('No rules directory found. Returning empty array.');
        return [];
      }

      return this.traverseDirectory(ruleDirPath);
    } catch (error) {
      console.error('Error getting rule files:', error);
      return [];
    }
  }

  /**
   * Parses all rule files in the cursor workspace
   * @param basePath Base path to start searching from
   * @returns Array of parsed rules
   */
  public static parseAllRules(basePath: string = '.cursor/rules'): ParsedRule[] {
    const ruleFiles = this.getRuleFiles(basePath);
    return ruleFiles.map(file => this.parseRuleFile(file));
  }

  /**
   * Finds rules that apply to a specific file path
   * @param filePath Path to check rules against
   * @param rules Array of rules to check
   * @returns Array of applicable rules
   */
  public static findApplicableRules(filePath: string, rules: Rule[]): Rule[] {
    // Try to get from cache first
    try {
      const ruleCache = RuleCache.getInstance();
      return ruleCache.getApplicableRules(filePath, rules as any);
    } catch (error) {
      // Cache not available or error occurred, proceed with normal processing
    }

    return rules.filter(rule => {
      // Rules marked as alwaysApply are always included
      if (rule.alwaysApply) return true;

      // Check if any glob pattern matches the file path
      const globPatterns = Array.isArray(rule.globs) ? rule.globs : rule.globs ? [rule.globs] : [];
      return globPatterns.some(glob => this.matchGlob(filePath, glob));
    });
  }

  /**
   * Improved glob pattern matching using micromatch
   * @param filePath File path to check
   * @param pattern Glob pattern to match against
   * @returns Whether the pattern matches the file path
   */
  private static matchGlob(filePath: string, pattern: string): boolean {
    // Use micromatch for more efficient and accurate glob matching
    try {
      return micromatch.isMatch(filePath, pattern);
    } catch (error) {
      // Fallback to our simple implementation if micromatch fails
      return this.simpleMatchGlob(filePath, pattern);
    }
  }

  /**
   * Simple glob pattern matching as a fallback
   * @param filePath File path to check
   * @param pattern Glob pattern to match against
   * @returns Whether the pattern matches the file path
   */
  private static simpleMatchGlob(filePath: string, pattern: string): boolean {
    // Memory-safe simple glob matching without regex

    // Normalize paths for consistent comparison
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Handle negative patterns
    if (pattern.startsWith('!')) {
      return !this.simpleMatchGlob(filePath, pattern.substring(1));
    }

    // Handle simple extension matching (e.g., "*.ts")
    if (pattern.startsWith('*.')) {
      const extension = pattern.substring(2);
      return normalizedPath.endsWith('.' + extension);
    }

    // Handle directory wildcard (e.g., "src/**")
    if (pattern.endsWith('/**')) {
      const prefix = pattern.substring(0, pattern.length - 3);
      return normalizedPath.startsWith(prefix);
    }

    // Handle file wildcard in directory (e.g., "src/*.ts")
    if (pattern.includes('/*.')) {
      const [directory, filePattern] = pattern.split('/*.');
      const extension = filePattern;

      // Check if path is in the directory and has the right extension
      return normalizedPath.startsWith(directory + '/') &&
             normalizedPath.endsWith('.' + extension) &&
             !normalizedPath.substring(directory.length + 1).includes('/');
    }

    // Direct exact matches
    return normalizedPath === pattern;
  }
}
