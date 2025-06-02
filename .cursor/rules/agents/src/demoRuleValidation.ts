import { RuleValidator } from './rule-interpreter/ruleValidator';
import { Rule } from './common/types';
import chalk from 'chalk';

/**
 * Demonstrates the rule validation functionality
 */
async function demonstrateRuleValidation() {
  console.log(chalk.blue('🔍 Rule Validation System Demonstration'));
  console.log(chalk.blue('----------------------------------------'));

  // Create a rule validator
  const validator = new RuleValidator();

  // Define some sample rules
  const rules: Rule[] = [
    {
      description: 'TypeScript naming convention',
      globs: ['**/*.ts', '**/*.tsx'],
      alwaysApply: true,
      version: '1.0.0',
      content: 'Use camelCase for variables and functions, PascalCase for classes and interfaces.'
    },
    {
      description: 'React component structure',
      globs: ['**/*.tsx'],
      alwaysApply: false,
      version: '1.0.0',
      content: 'Functional components should use arrow function syntax and be exported as named exports.'
    },
    {
      description: 'TypeScript naming convention',
      globs: ['**/*.ts'],
      alwaysApply: true,
      version: '1.1.0',
      content: 'Use camelCase for variables and functions, PascalCase for classes and interfaces, and UPPER_CASE for constants.'
    },
    {
      description: 'File organization',
      globs: ['**/*'],
      content: 'Group related files in directories with clear naming.'
    }
  ];

  // 1. Validate individual rules
  console.log('\n1️⃣ Validating individual rules:');
  for (const rule of rules) {
    const result = validator.validateRule(rule);
    console.log(`Rule "${rule.description}" is ${result.valid ? chalk.green('valid') : chalk.red('invalid')}`);
    if (!result.valid) {
      console.log(chalk.red('Errors:'), result.errors);
    }
  }

  // 2. Detect conflicts between rules
  console.log('\n2️⃣ Detecting conflicts between rules:');
  const conflicts = validator.detectConflicts(rules);

  if (conflicts.length === 0) {
    console.log(chalk.green('No conflicts detected!'));
  } else {
    console.log(chalk.yellow(`Found ${conflicts.length} conflicts:`));

    for (const conflict of conflicts) {
      console.log(chalk.yellow('\nConflict:'));
      console.log(`- Rule 1: "${conflict.rule1.description}"`);
      console.log(`- Rule 2: "${conflict.rule2.description}"`);
      console.log(`- Reason: ${conflict.reason}`);
    }
  }

  // 3. Resolve conflicts
  console.log('\n3️⃣ Resolving conflicts:');
  const { resolved, unresolved } = validator.resolveConflicts(rules);

  console.log(`Resolved ${rules.length - resolved.length - unresolved.length} conflicts automatically.`);
  console.log(`${resolved.length} rules after resolution:`);

  for (const rule of resolved) {
    console.log(`- "${rule.description}" (${rule.version || 'no version'})`);
  }

  if (unresolved.length > 0) {
    console.log(chalk.yellow(`\n${unresolved.length} unresolved conflicts require manual intervention:`));

    for (const { rule, reason } of unresolved) {
      console.log(chalk.yellow(`- Rule "${rule.description}": ${reason}`));
    }
  }
}

// Run the demonstration
demonstrateRuleValidation().catch(console.error);
