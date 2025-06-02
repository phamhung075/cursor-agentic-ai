import { Rule } from '../common/types';
import { RuleParser } from './ruleParser';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Cache entry with metadata for tracking freshness
 */
interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** When the entry was last updated */
  timestamp: number;
  /** Checksum of the source file for validation */
  checksum: string;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Cache configuration options
 */
export interface RuleCacheOptions {
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Default time-to-live in milliseconds */
  defaultTtl?: number;
  /** Whether to enable file watching for auto-invalidation */
  enableWatching?: boolean;
}

/**
 * Rule with file path for caching purposes
 */
interface RuleWithPath extends Rule {
  /** Path to the rule file */
  path: string;
}

/**
 * Caches rule parsing and interpretation results to improve performance
 */
export class RuleCache {
  private static instance: RuleCache;

  // Caches
  private parsedRuleCache: Map<string, CacheEntry<RuleWithPath>> = new Map();
  private applicableRulesCache: Map<string, CacheEntry<Rule[]>> = new Map();

  // Options
  private maxEntries: number;
  private defaultTtl: number;
  private enableWatching: boolean;

  // Stats for monitoring
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  /**
   * Creates a new RuleCache with the specified options
   * @param options Cache configuration options
   */
  private constructor(options: RuleCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 5 * 60 * 1000; // 5 minutes default
    this.enableWatching = options.enableWatching ?? false;
  }

  /**
   * Gets the singleton cache instance
   * @param options Optional configuration options
   * @returns The RuleCache instance
   */
  public static getInstance(options?: RuleCacheOptions): RuleCache {
    if (!RuleCache.instance) {
      RuleCache.instance = new RuleCache(options);
    }
    return RuleCache.instance;
  }

  /**
   * Gets a parsed rule from cache or parses it if not cached
   * @param filePath Path to the rule file
   * @returns The parsed rule
   */
  public getParsedRule(filePath: string): RuleWithPath {
    const absPath = path.resolve(filePath);
    const cacheKey = absPath;

    // Check if in cache and valid
    if (this.parsedRuleCache.has(cacheKey)) {
      const entry = this.parsedRuleCache.get(cacheKey)!;

      // Check if entry is still fresh
      if (this.isEntryFresh(entry, absPath)) {
        this.hits++;
        return entry.data;
      }
    }

    // Cache miss - parse the rule
    this.misses++;
    const baseRule = RuleParser.parseRuleFile(absPath);

    // Add path information for caching
    const rule: RuleWithPath = {
      ...baseRule,
      path: absPath
    };

    // Cache the result
    this.cacheParsedRule(absPath, rule);

    return rule;
  }

  /**
   * Gets applicable rules for a file path from cache or computes them
   * @param filePath File path to check
   * @param rules Array of rules to check against
   * @returns Array of applicable rules
   */
  public getApplicableRules(filePath: string, rules: RuleWithPath[]): Rule[] {
    const cacheKey = `${filePath}:${this.getRulesFingerprint(rules)}`;

    // Check if in cache and valid
    if (this.applicableRulesCache.has(cacheKey)) {
      const entry = this.applicableRulesCache.get(cacheKey)!;

      // Check if entry is still fresh
      if (Date.now() - entry.timestamp < entry.ttl) {
        this.hits++;
        return entry.data;
      }
    }

    // Cache miss - compute applicable rules
    this.misses++;
    const applicableRules = RuleParser.findApplicableRules(filePath, rules);

    // Cache the result
    this.cacheApplicableRules(cacheKey, applicableRules);

    return applicableRules;
  }

  /**
   * Caches a parsed rule
   * @param filePath Path to the rule file
   * @param rule The parsed rule
   */
  private cacheParsedRule(filePath: string, rule: RuleWithPath): void {
    // Enforce cache size limit
    if (this.parsedRuleCache.size >= this.maxEntries) {
      this.evictOldestEntry(this.parsedRuleCache);
    }

    // Calculate checksum for freshness checking
    const checksum = this.calculateFileChecksum(filePath);

    // Create cache entry
    const entry: CacheEntry<RuleWithPath> = {
      data: rule,
      timestamp: Date.now(),
      checksum,
      ttl: this.defaultTtl
    };

    this.parsedRuleCache.set(filePath, entry);

    // Set up file watching if enabled
    if (this.enableWatching) {
      this.watchFile(filePath);
    }
  }

  /**
   * Caches applicable rules for a file path
   * @param cacheKey The cache key
   * @param rules The applicable rules
   */
  private cacheApplicableRules(cacheKey: string, rules: Rule[]): void {
    // Enforce cache size limit
    if (this.applicableRulesCache.size >= this.maxEntries) {
      this.evictOldestEntry(this.applicableRulesCache);
    }

    // Create cache entry
    const entry: CacheEntry<Rule[]> = {
      data: rules,
      timestamp: Date.now(),
      checksum: '', // Not file-based, so no checksum needed
      ttl: this.defaultTtl
    };

    this.applicableRulesCache.set(cacheKey, entry);
  }

  /**
   * Calculates a fingerprint for an array of rules
   * @param rules Array of rules
   * @returns A string fingerprint
   */
  private getRulesFingerprint(rules: RuleWithPath[]): string {
    // Use rule paths and modification times as fingerprint
    const fingerprint = rules
      .map(rule => rule.path)
      .sort()
      .join('|');

    return crypto.createHash('md5').update(fingerprint).digest('hex');
  }

  /**
   * Calculates a checksum for a file
   * @param filePath Path to the file
   * @returns Checksum string
   */
  private calculateFileChecksum(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Error calculating checksum for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Checks if a cache entry is still fresh
   * @param entry The cache entry
   * @param filePath Path to the file
   * @returns Whether the entry is fresh
   */
  private isEntryFresh(entry: CacheEntry<any>, filePath: string): boolean {
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      return false;
    }

    // Check if file has changed (if there's a checksum)
    if (entry.checksum) {
      const currentChecksum = this.calculateFileChecksum(filePath);
      return currentChecksum === entry.checksum;
    }

    return true;
  }

  /**
   * Evicts the oldest entry from a cache
   * @param cache The cache to evict from
   */
  private evictOldestEntry<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    // Find the oldest entry
    for (const [key, entry] of cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    // Remove the oldest entry
    if (oldestKey) {
      cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Sets up file watching for a rule file
   * @param filePath Path to the file
   */
  private watchFile(filePath: string): void {
    try {
      fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          // Invalidate the cache entry when the file changes
          this.parsedRuleCache.delete(filePath);
        }
      });
    } catch (error) {
      // Silently fail if watching is not supported
    }
  }

  /**
   * Clears all caches
   */
  public clearCache(): void {
    this.parsedRuleCache.clear();
    this.applicableRulesCache.clear();
  }

  /**
   * Gets cache statistics
   * @returns Object with cache statistics
   */
  public getStats(): { hits: number; misses: number; evictions: number; parsedSize: number; applicableSize: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      parsedSize: this.parsedRuleCache.size,
      applicableSize: this.applicableRulesCache.size
    };
  }
}
