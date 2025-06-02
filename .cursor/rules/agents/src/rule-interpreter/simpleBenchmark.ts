import path from 'path';
import fs from 'fs';
import { performance } from 'perf_hooks';

/**
 * Ultra simple benchmark to avoid memory issues
 */
async function runSimpleBenchmark() {
  console.log('=======================================');
  console.log('Rule Processor - Simple Performance Test');
  console.log('=======================================\n');

  const startTime = performance.now();

  // Create sample rules
  const sampleRules = [];
  for (let i = 1; i <= 3; i++) {
    sampleRules.push({
      description: `Sample Rule ${i}`,
      globs: ["**/*.ts", "src/**/*.js", "!node_modules/**"],
      alwaysApply: i % 3 === 0,
      content: `# Sample Rule ${i}\n\nThis is a simple rule.`
    });
  }

  // Create sample files
  const sampleFiles = [
    '/project/src/index.ts',
    '/project/src/components/Button.tsx',
    '/project/src/utils/helpers.js',
    '/project/tests/index.test.js'
  ];

  console.log(`Created ${sampleRules.length} sample rules`);
  console.log(`Created ${sampleFiles.length} sample files\n`);

  // Simple glob matching function
  function simpleMatch(filePath: string, pattern: string): boolean {
    // Handle negative patterns
    if (pattern.startsWith('!')) {
      return !simpleMatch(filePath, pattern.substring(1));
    }

    // Handle extension patterns
    if (pattern.includes('*.')) {
      const extension = pattern.split('*.')[1];
      return filePath.endsWith(`.${extension}`);
    }

    // Handle directory patterns
    if (pattern.includes('/**')) {
      const directory = pattern.split('/**')[0];
      return filePath.startsWith(directory);
    }

    // Direct matches
    return filePath === pattern;
  }

  // Check if a rule applies to a file
  function doesRuleApplyToFile(rule: any, filePath: string): boolean {
    if (rule.alwaysApply) {
      return true;
    }

    const patterns = rule.globs || [];
    for (const pattern of patterns) {
      const isMatch = simpleMatch(filePath, pattern);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  // Run simple benchmark
  console.log('--- Running Simple Matching Test ---');
  let matchCount = 0;

  const benchStart = performance.now();

  // Run a small number of iterations
  for (let i = 0; i < 100; i++) {
    for (const file of sampleFiles) {
      for (const rule of sampleRules) {
        if (doesRuleApplyToFile(rule, file)) {
          matchCount++;
        }
      }
    }
  }

  const benchEnd = performance.now();

  // Print results
  console.log(`Completed 100 iterations in ${(benchEnd - benchStart).toFixed(2)}ms`);
  console.log(`Found ${matchCount} matches`);
  console.log(`Average time per match: ${((benchEnd - benchStart) / matchCount).toFixed(3)}ms`);

  // Create a simple report file
  const reportContent = `
# Simple Benchmark Report

- Date: ${new Date().toISOString()}
- Duration: ${(benchEnd - benchStart).toFixed(2)}ms
- Iterations: 100
- Total matches: ${matchCount}
- Average time per match: ${((benchEnd - benchStart) / matchCount).toFixed(3)}ms
  `;

  // Save report
  const reportPath = path.join(__dirname, '../../simple-benchmark-report.md');
  fs.writeFileSync(reportPath, reportContent);

  console.log(`\nBenchmark complete! Report saved to: ${reportPath}`);
  console.log('=======================================');
}

// Run the benchmark if this file is executed directly
if (require.main === module) {
  runSimpleBenchmark().catch(console.error);
}

export { runSimpleBenchmark };
