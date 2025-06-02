import path from 'path';
import fs from 'fs';

/**
 * Simple rule matching demo
 */
function runRuleMatchingDemo() {
  console.log('=======================================');
  console.log('Rule Matching Demo');
  console.log('=======================================\n');

  // Create sample rules
  const rules = [
    {
      id: 'typescript-best-practices',
      description: 'TypeScript Best Practices',
      globs: ["**/*.ts", "**/*.tsx", "!node_modules/**"],
      alwaysApply: false,
      content: '# TypeScript Best Practices\nUse proper types and avoid any.'
    },
    {
      id: 'react-components',
      description: 'React Component Rules',
      globs: ["src/components/**/*.tsx"],
      alwaysApply: false,
      content: '# React Component Rules\nUse functional components with hooks.'
    },
    {
      id: 'global-rules',
      description: 'Global Coding Standards',
      globs: [],
      alwaysApply: true,
      content: '# Global Coding Standards\nMaintain consistent formatting.'
    }
  ];

  // Sample files to check
  const files = [
    '/project/src/index.ts',
    '/project/src/components/Button.tsx',
    '/project/src/utils/helpers.js',
    '/project/node_modules/lib/index.ts'
  ];

  console.log('Sample Rules:');
  rules.forEach(rule => {
    console.log(`- ${rule.id}: ${rule.description}`);
  });

  console.log('\nSample Files:');
  files.forEach(file => {
    console.log(`- ${file}`);
  });

  // Simple glob matching function from our improvements
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

  // Check if a rule applies to a file - improved method
  function doesRuleApplyToFile(rule: any, filePath: string): boolean {
    // Always apply rules marked as such
    if (rule.alwaysApply) {
      return true;
    }

    // No globs means no match (unless alwaysApply is true)
    if (!rule.globs || rule.globs.length === 0) {
      return false;
    }

    // Convert to array if it's a string
    const patterns = Array.isArray(rule.globs) ? rule.globs : [rule.globs];

    // Check each pattern
    for (const pattern of patterns) {
      const isNegative = pattern.startsWith('!');
      const patternToCheck = isNegative ? pattern.substring(1) : pattern;

      const isMatch = simpleMatch(filePath, patternToCheck);

      // If negative pattern matches, rule does not apply
      if (isNegative && isMatch) {
        return false;
      }

      // If positive pattern matches and no negative patterns have matched, rule applies
      if (!isNegative && isMatch) {
        return true;
      }
    }

    return false;
  }

  // Find which rules apply to each file
  console.log('\nMatching Rules to Files:');
  files.forEach(file => {
    console.log(`\nFile: ${file}`);
    console.log('Applicable Rules:');

    const applicableRules = rules.filter(rule => doesRuleApplyToFile(rule, file));

    if (applicableRules.length === 0) {
      console.log('- None');
    } else {
      applicableRules.forEach(rule => {
        console.log(`- ${rule.id}: ${rule.description}`);
      });
    }
  });

  console.log('\n=======================================');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runRuleMatchingDemo();
}

export { runRuleMatchingDemo };
