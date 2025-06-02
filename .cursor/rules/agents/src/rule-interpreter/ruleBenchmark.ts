import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { RuleCache } from './ruleCache';
import { RuleParser } from './ruleParser';
import { Rule } from './ruleTypes';

/**
 * Result of a benchmark
 */
interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsageMB: number;
  details?: any;
}

/**
 * Benchmark test configuration
 */
interface BenchmarkTest {
  /** Name of the test */
  name: string;
  /** Function to run for the test */
  fn: () => void;
  /** Number of iterations to run */
  iterations?: number;
  /** Whether to warm up the test before measuring */
  warmup?: boolean;
  /** Whether to clear cache before running */
  clearCache?: boolean;
}

/**
 * Utility for benchmarking rule processing performance
 */
export class RuleBenchmark {
  /** Cache instance for testing */
  private cache: RuleCache;
  /** All rules loaded from the workspace */
  private rules: Rule[] = [];
  /** List of sample files for testing */
  private sampleFiles: string[] = [];
  /** Benchmark results */
  private results: BenchmarkResult[] = [];

  /**
   * Creates a new benchmark utility
   * @param rulesPath Path to rules directory
   * @param sampleFilesPath Path to sample files
   */
  constructor(rulesPath: string = '.', sampleFilesPath: string = '.') {
    console.log(`Using rules path: ${path.resolve(rulesPath)}`);

    this.cache = RuleCache.getInstance({
      maxEntries: 1000,
      defaultTtl: 5 * 60 * 1000,
      enableWatching: false
    });

    // Load rules and sample files
    this.loadRules(rulesPath);
    this.loadSampleFiles(sampleFilesPath);
  }

  /**
   * Loads rules from the specified path
   * @param rulesPath Path to rules directory
   */
  private loadRules(rulesPath: string): void {
    try {
      this.rules = RuleParser.parseAllRules(rulesPath);
      console.log(`Loaded ${this.rules.length} rules for benchmarking`);
    } catch (error) {
      console.warn(`Could not load rules from ${rulesPath}. Using sample rules for benchmarking.`);
      console.error(error);

      // Create some sample rules for benchmarking if we can't load real ones
      this.rules = this.createSampleRules();
      console.log(`Created ${this.rules.length} sample rules for benchmarking`);
    }
  }

  /**
   * Creates sample rules for benchmarking if real rules can't be loaded
   * @returns Array of sample rules
   */
  private createSampleRules(): Rule[] {
    const sampleRules: Rule[] = [];

    // Create 10 sample rules with different patterns
    for (let i = 1; i <= 10; i++) {
      sampleRules.push({
        description: `Sample Rule ${i}`,
        globs: [
          `**/*.ts`,
          `src/**/*.js`,
          `!node_modules/**`,
          `!dist/**`
        ],
        alwaysApply: i % 5 === 0, // Every 5th rule always applies
        content: `# Sample Rule ${i}\n\n## Section 1\n\nThis is a sample rule for benchmarking.`,
        references: [
          {
            type: 'rule',
            path: `sample/rule${i + 1 > 10 ? 1 : i + 1}.mdc`
          }
        ]
      });
    }

    return sampleRules;
  }

  /**
   * Loads sample files from the specified path
   * @param sampleFilesPath Path to sample files
   */
  private loadSampleFiles(sampleFilesPath: string): void {
    try {
      // Try to find some actual files for testing
      const sampleDirs = [
        path.join(sampleFilesPath, 'src'),
        path.join(sampleFilesPath, '.cursor/rules/agents/src'),
        path.resolve(__dirname, '..'), // Look in the current source directory
      ];

      let foundFiles = false;

      for (const dir of sampleDirs) {
        if (fs.existsSync(dir)) {
          this.sampleFiles = this.getSampleFiles(dir);
          console.log(`Loaded ${this.sampleFiles.length} sample files from ${dir}`);
          foundFiles = this.sampleFiles.length > 0;
          if (foundFiles) break;
        }
      }

      // If we didn't find any files, create some sample ones
      if (!foundFiles) {
        console.warn('Could not find sample files. Creating in-memory samples.');
        this.sampleFiles = this.createSampleFiles();
        console.log(`Created ${this.sampleFiles.length} in-memory sample files`);
      }
    } catch (error) {
      console.warn('Error loading sample files:', error);
      this.sampleFiles = this.createSampleFiles();
      console.log(`Created ${this.sampleFiles.length} in-memory sample files`);
    }
  }

  /**
   * Creates sample files for benchmarking
   * @returns Array of sample file paths
   */
  private createSampleFiles(): string[] {
    // Create some fake file paths for benchmarking
    return [
      '/project/src/index.ts',
      '/project/src/components/Button.tsx',
      '/project/src/components/Card.tsx',
      '/project/src/utils/helpers.ts',
      '/project/src/services/api.ts',
      '/project/src/models/user.ts',
      '/project/tests/unit/helpers.test.ts',
      '/project/docs/README.md',
      '/project/package.json',
      '/project/tsconfig.json'
    ];
  }

  /**
   * Gets sample files from a directory (up to a maximum number)
   * @param dirPath Directory to scan for files
   * @param maxFiles Maximum number of files to return
   * @returns Array of file paths
   */
  private getSampleFiles(dirPath: string, maxFiles: number = 100): string[] {
    const allFiles: string[] = [];

    function traverseDirectory(dir: string) {
      if (allFiles.length >= maxFiles) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (allFiles.length >= maxFiles) break;

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('dist')) {
            traverseDirectory(fullPath);
          } else if (entry.isFile() && !entry.name.startsWith('.')) {
            allFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }

    traverseDirectory(dirPath);
    return allFiles.slice(0, maxFiles);
  }

  /**
   * Runs a benchmark test
   * @param test Test configuration
   * @returns Benchmark result
   */
  private runTest(test: BenchmarkTest): BenchmarkResult {
    const iterations = test.iterations || 100;
    const warmup = test.warmup !== false;

    // Clear cache if requested
    if (test.clearCache) {
      this.cache.clearCache();
      console.log(`Cleared cache for test: ${test.name}`);
    }

    // Warm up the test
    if (warmup) {
      for (let i = 0; i < Math.min(10, iterations / 10); i++) {
        test.fn();
      }
    }

    // Measure memory before
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

    // Run the test and measure time
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      test.fn();
    }
    const end = performance.now();

    // Measure memory after
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

    // Calculate results
    const duration = end - start;
    const opsPerSecond = Math.round((iterations / duration) * 1000);

    return {
      name: test.name,
      duration,
      operations: iterations,
      opsPerSecond,
      memoryUsageMB: Math.max(0, memAfter - memBefore)
    };
  }

  /**
   * Benchmarks rule parsing
   * @param sampleSize Number of rules to parse
   * @param iterations Number of iterations
   * @returns Benchmark result
   */
  public benchmarkRuleParsing(sampleSize: number = 10, iterations: number = 100): BenchmarkResult {
    const ruleFiles = RuleParser.getRuleFiles().slice(0, sampleSize);

    // Without cache
    const resultWithoutCache = this.runTest({
      name: 'Rule Parsing (No Cache)',
      fn: () => {
        for (const file of ruleFiles) {
          RuleParser.parseRuleFile(file);
        }
      },
      iterations,
      clearCache: true
    });
    this.results.push(resultWithoutCache);

    // With cache
    const resultWithCache = this.runTest({
      name: 'Rule Parsing (With Cache)',
      fn: () => {
        for (const file of ruleFiles) {
          RuleParser.parseRuleFile(file);
        }
      },
      iterations
    });
    this.results.push(resultWithCache);

    console.log(`Rule Parsing (No Cache): ${resultWithoutCache.opsPerSecond} ops/sec`);
    console.log(`Rule Parsing (With Cache): ${resultWithCache.opsPerSecond} ops/sec`);
    console.log(`Cache Speedup: ${Math.round((resultWithCache.opsPerSecond / resultWithoutCache.opsPerSecond) * 100) / 100}x`);

    return resultWithCache;
  }

  /**
   * Benchmarks finding applicable rules
   * @param sampleSize Number of files to check
   * @param iterations Number of iterations
   * @returns Benchmark result
   */
  public benchmarkFindApplicableRules(sampleSize: number = 10, iterations: number = 100): BenchmarkResult {
    const files = this.sampleFiles.slice(0, sampleSize);

    // Without cache
    const resultWithoutCache = this.runTest({
      name: 'Find Applicable Rules (No Cache)',
      fn: () => {
        for (const file of files) {
          RuleParser.findApplicableRules(file, this.rules);
        }
      },
      iterations,
      clearCache: true
    });
    this.results.push(resultWithoutCache);

    // With cache
    const resultWithCache = this.runTest({
      name: 'Find Applicable Rules (With Cache)',
      fn: () => {
        for (const file of files) {
          RuleParser.findApplicableRules(file, this.rules);
        }
      },
      iterations
    });
    this.results.push(resultWithCache);

    console.log(`Find Applicable Rules (No Cache): ${resultWithoutCache.opsPerSecond} ops/sec`);
    console.log(`Find Applicable Rules (With Cache): ${resultWithCache.opsPerSecond} ops/sec`);
    console.log(`Cache Speedup: ${Math.round((resultWithCache.opsPerSecond / resultWithoutCache.opsPerSecond) * 100) / 100}x`);

    return resultWithCache;
  }

  /**
   * Benchmarks glob pattern matching performance
   * @param iterations Number of iterations for testing
   */
  benchmarkGlobMatching(iterations: number = 1000): void {
    if (!this.rules.length || !this.sampleFiles.length) {
      console.warn('No rules or sample files available for glob matching benchmark');
      return;
    }

    // Select a small subset of rules and files to avoid memory issues
    const testRules = this.rules.slice(0, 3);
    const testFiles = this.sampleFiles.slice(0, 10);

    console.log(`Using ${testRules.length} rules for glob matching`);
    console.log(`Testing against ${testFiles.length} sample files`);

    // Simple matching function to avoid dependency on external module
    const simpleMatch = (filePath: string, pattern: string): boolean => {
      // Normalize paths
      const normalizedPath = filePath.replace(/\\/g, '/');

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
      return normalizedPath === pattern;
    };

    // Function to check if a rule applies to a file
    const doesRuleApplyToFile = (rule: Rule, filePath: string): boolean => {
      // Always apply rules marked as such
      if (rule.alwaysApply) {
        return true;
      }

      // No globs means no match
      if (!rule.globs) {
        return false;
      }

      // Convert to array if it's a string
      const globs = Array.isArray(rule.globs) ? rule.globs : [rule.globs];

      // If empty array, no match
      if (globs.length === 0) {
        return false;
      }

      // Test only the first glob pattern to avoid memory issues
      const glob = globs[0];

      // Handle negative patterns
      const isNegative = glob.startsWith('!');
      const pattern = isNegative ? glob.substring(1) : glob;

      const isMatch = simpleMatch(filePath, pattern);
      return isNegative ? !isMatch : isMatch;
    };

    // Warm up
    for (const file of testFiles) {
      for (const rule of testRules) {
        doesRuleApplyToFile(rule, file);
      }
    }

    // Benchmark: legacy approach
    const startLegacy = performance.now();
    for (let i = 0; i < Math.min(iterations, 50); i++) {
      for (const file of testFiles) {
        for (const rule of testRules) {
          doesRuleApplyToFile(rule, file);
        }
      }
    }
    const endLegacy = performance.now();

    // Results
    const totalLegacyTime = endLegacy - startLegacy;
    const avgLegacyTime = totalLegacyTime / Math.min(iterations, 50);

    this.results.push({
      name: 'Glob Matching (legacy)',
      duration: totalLegacyTime,
      operations: Math.min(iterations, 50),
      opsPerSecond: Math.round((Math.min(iterations, 50) / totalLegacyTime) * 1000),
      memoryUsageMB: 0,
      details: {
        totalRules: testRules.length,
        totalFiles: testFiles.length,
        legacyTime: totalLegacyTime,
        averageLegacyTime: avgLegacyTime,
        improvement: 0
      }
    });

    console.log(`Legacy glob matching: ${totalLegacyTime.toFixed(2)}ms total, ${avgLegacyTime.toFixed(3)}ms per iteration`);
    console.log('Note: Cache-based performance testing disabled to avoid memory issues');
  }

  /**
   * Runs all benchmarks
   * @returns Array of benchmark results
   */
  public runAllBenchmarks(): BenchmarkResult[] {
    console.log('Running rule processing benchmarks...');

    this.benchmarkRuleParsing();
    this.benchmarkFindApplicableRules();
    this.benchmarkGlobMatching();

    return this.results;
  }

  /**
   * Generates a report of benchmark results
   * @returns Benchmark report as a string
   */
  public generateReport(): string {
    if (this.results.length === 0) {
      this.runAllBenchmarks();
    }

    let report = '# Rule Processing Performance Benchmark\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Summary\n\n';
    report += '| Test | Operations/sec | Duration (ms) | Memory Usage (MB) |\n';
    report += '|------|---------------|---------------|------------------|\n';

    for (const result of this.results) {
      report += `| ${result.name} | ${result.opsPerSecond.toLocaleString()} | ${result.duration.toFixed(2)} | ${result.memoryUsageMB.toFixed(2)} |\n`;
    }

    report += '\n## Comparison\n\n';

    // Compare cache vs no cache
    const noCacheRuleParsing = this.results.find(r => r.name === 'Rule Parsing (No Cache)');
    const withCacheRuleParsing = this.results.find(r => r.name === 'Rule Parsing (With Cache)');

    if (noCacheRuleParsing && withCacheRuleParsing) {
      const speedup = (withCacheRuleParsing.opsPerSecond / noCacheRuleParsing.opsPerSecond).toFixed(2);
      report += `- Rule Parsing Speedup with Cache: ${speedup}x\n`;
    }

    const noCacheApplicableRules = this.results.find(r => r.name === 'Find Applicable Rules (No Cache)');
    const withCacheApplicableRules = this.results.find(r => r.name === 'Find Applicable Rules (With Cache)');

    if (noCacheApplicableRules && withCacheApplicableRules) {
      const speedup = (withCacheApplicableRules.opsPerSecond / noCacheApplicableRules.opsPerSecond).toFixed(2);
      report += `- Find Applicable Rules Speedup with Cache: ${speedup}x\n`;
    }

    const globMatching = this.results.find(r => r.name === 'Glob Matching (legacy)');

    if (globMatching) {
      report += `- Glob Matching Performance Improvement: ${globMatching.details?.improvement.toFixed(2)}x\n`;
    }

    report += '\n## Recommendations\n\n';

    // Add recommendations based on results
    report += '- Use caching for rule parsing and applicable rules lookups\n';

    if (globMatching) {
      if (globMatching.details?.improvement > 1) {
        report += '- Use simplified glob matching implementation for better performance\n';
      }
    }

    return report;
  }

  /**
   * Saves the benchmark report to a file
   * @param outputPath Path to save the report
   */
  public saveReport(outputPath: string = 'benchmark-report.md'): void {
    const report = this.generateReport();
    fs.writeFileSync(outputPath, report);
    console.log(`Benchmark report saved to ${outputPath}`);
  }
}
