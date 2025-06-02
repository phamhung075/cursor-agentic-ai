#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { AgentFactory, AgentType, Rule } from './common';
import { RuleParser } from './rule-interpreter/ruleParser';
import { RuleInterpreter } from './rule-interpreter/ruleInterpreter';
import { RuleValidator } from './rule-interpreter/ruleValidator';
import { ContextManager } from './context-manager/contextManager';
import { ContextAutomation } from './context-manager/contextAutomation';
import { AgentIntegrationService } from './agent-integration/agentIntegrationService';
import path from 'path';
import fs from 'fs';

// Display banner
console.log(
  chalk.blue(
    figlet.textSync('Cursor AI', { horizontalLayout: 'full' })
  )
);
console.log(
  chalk.green(
    'Agent Automation Framework CLI'
  )
);

const program = new Command();

program
  .version('1.0.0')
  .description('CLI for Cursor AI Automation Framework');

// Parse Rules Command
program
  .command('parse-rule')
  .description('Parse a rule file and display its structure')
  .argument('<file>', 'Path to the rule file')
  .action(async (file) => {
    try {
      console.log(chalk.blue(`Parsing rule file: ${file}`));
      const rule = RuleParser.parseRuleFile(file);
      console.log(chalk.green('Rule parsed successfully:'));
      console.log(JSON.stringify(rule, null, 2));
    } catch (error) {
      console.error(chalk.red(`Error parsing rule: ${error.message}`));
      process.exit(1);
    }
  });

// Validate Rules Command
program
  .command('validate-rule')
  .description('Validate rules for consistency and detect conflicts')
  .argument('<files...>', 'Paths to rule files or directory')
  .option('-s, --schema <file>', 'Path to schema file for validation')
  .option('-r, --resolve', 'Attempt to automatically resolve conflicts')
  .option('-o, --output <file>', 'Output path for resolved rules')
  .action(async (files, options) => {
    try {
      console.log(chalk.blue(`Validating rules: ${files.join(', ')}`));

      // Create validator with optional schema
      const validator = new RuleValidator(options.schema);

      // Parse the rules
      const allRules: Rule[] = [];
      for (const file of files) {
        try {
          // Check if it's a directory
          const stats = fs.statSync(file);

          if (stats.isDirectory()) {
            // Get all .mdc files in the directory
            const ruleFiles = fs.readdirSync(file)
              .filter(f => f.endsWith('.mdc'))
              .map(f => path.join(file, f));

            for (const ruleFile of ruleFiles) {
              try {
                const rule = RuleParser.parseRuleFile(ruleFile);
                allRules.push(rule);
              } catch (error) {
                console.error(chalk.yellow(`Error parsing rule file ${ruleFile}: ${error.message}`));
              }
            }
          } else {
            // Single file
            const rule = RuleParser.parseRuleFile(file);
            allRules.push(rule);
          }
        } catch (error) {
          console.error(chalk.red(`Error processing ${file}: ${error.message}`));
        }
      }

      // Validate all rules
      console.log(chalk.blue(`\nValidating ${allRules.length} rules...`));

      let allValid = true;
      for (const rule of allRules) {
        const result = validator.validateRule(rule);
        if (!result.valid) {
          allValid = false;
          console.error(chalk.red(`Invalid rule: ${rule.description}`));
          console.error(chalk.red(`Errors: ${JSON.stringify(result.errors, null, 2)}`));
        }
      }

      if (allValid) {
        console.log(chalk.green('All rules are valid!'));
      }

      // Detect conflicts
      console.log(chalk.blue('\nChecking for conflicts...'));
      const conflicts = validator.detectConflicts(allRules);

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

        // Resolve conflicts if requested
        if (options.resolve) {
          console.log(chalk.blue('\nResolving conflicts...'));
          const { resolved, unresolved } = validator.resolveConflicts(allRules);

          console.log(`Resolved ${allRules.length - resolved.length - unresolved.length} conflicts automatically.`);

          if (unresolved.length > 0) {
            console.log(chalk.yellow(`\n${unresolved.length} unresolved conflicts require manual intervention:`));

            for (const { rule, reason } of unresolved) {
              console.log(chalk.yellow(`- Rule "${rule.description}": ${reason}`));
            }
          }

          // Save resolved rules if output path is provided
          if (options.output && resolved.length > 0) {
            console.log(chalk.blue(`\nSaving ${resolved.length} resolved rules to ${options.output}`));
            fs.writeFileSync(options.output, JSON.stringify(resolved, null, 2));
            console.log(chalk.green('Resolved rules saved successfully!'));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error validating rules: ${error.message}`));
      process.exit(1);
    }
  });

// Context Management Commands
program
  .command('init-context')
  .description('Initialize a new context file for a task')
  .argument('<taskId>', 'ID of the task')
  .argument('<taskTitle>', 'Title of the task')
  .action(async (taskId, taskTitle) => {
    try {
      console.log(chalk.blue(`Initializing context for task ${taskId}`));
      const contextAutomation = ContextAutomation.getInstance();
      const context = await contextAutomation.initializeContext(taskId, taskTitle);
      console.log(chalk.green('Context initialized:'));
      console.log(JSON.stringify(context, null, 2));
    } catch (error) {
      console.error(chalk.red(`Error initializing context: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('get-context')
  .description('Get context for a task')
  .argument('<taskId>', 'ID of the task')
  .action(async (taskId) => {
    try {
      console.log(chalk.blue(`Getting context for task ${taskId}`));
      const contextAutomation = ContextAutomation.getInstance();
      const context = await contextAutomation.getContext(taskId);

      if (context) {
        console.log(chalk.green('Context:'));
        console.log(JSON.stringify(context, null, 2));
      } else {
        console.log(chalk.yellow(`No context found for task ${taskId}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error getting context: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('add-action')
  .description('Add an action to a task context')
  .argument('<taskId>', 'ID of the task')
  .argument('<action>', 'Description of the action')
  .action(async (taskId, action) => {
    try {
      console.log(chalk.blue(`Adding action to task ${taskId}`));
      const contextAutomation = ContextAutomation.getInstance();
      await contextAutomation.addAction(taskId, action);
      console.log(chalk.green('Action added successfully'));
    } catch (error) {
      console.error(chalk.red(`Error adding action: ${error.message}`));
      process.exit(1);
    }
  });

// Agent Integration Commands
program
  .command('init-agents')
  .description('Initialize all agents')
  .action(async () => {
    try {
      console.log(chalk.blue('Initializing agents'));
      const agentIntegration = AgentIntegrationService.getInstance();
      await agentIntegration.initializeAgents();
      console.log(chalk.green('Agents initialized successfully'));
    } catch (error) {
      console.error(chalk.red(`Error initializing agents: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('validate-file')
  .description('Validate a file against workspace rules')
  .argument('<file>', 'Path to the file to validate')
  .option('-t, --taskId <taskId>', 'Task ID for context association')
  .action(async (file, options) => {
    try {
      console.log(chalk.blue(`Validating file: ${file}`));

      if (!fs.existsSync(file)) {
        console.error(chalk.red(`File not found: ${file}`));
        process.exit(1);
      }

      const fileContent = fs.readFileSync(file, 'utf8');
      const agentIntegration = AgentIntegrationService.getInstance();
      const result = await agentIntegration.validateFileWithRules(file, fileContent, options.taskId);

      console.log(chalk.green('Validation result:'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(chalk.red(`Error validating file: ${error.message}`));
      process.exit(1);
    }
  });

// Run demo commands
program
  .command('demo-context')
  .description('Run context automation demo')
  .action(async () => {
    try {
      console.log(chalk.blue('Running context automation demo'));
      const demoPath = path.join(__dirname, 'demoContextAutomation.js');

      if (!fs.existsSync(demoPath)) {
        console.error(chalk.red(`Demo file not found: ${demoPath}`));
        process.exit(1);
      }

      require('./demoContextAutomation');
    } catch (error) {
      console.error(chalk.red(`Error running demo: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('demo-integration')
  .description('Run agent integration demo')
  .action(async () => {
    try {
      console.log(chalk.blue('Running agent integration demo'));
      const demoPath = path.join(__dirname, 'demoAgentIntegration.js');

      if (!fs.existsSync(demoPath)) {
        console.error(chalk.red(`Demo file not found: ${demoPath}`));
        process.exit(1);
      }

      require('./demoAgentIntegration');
    } catch (error) {
      console.error(chalk.red(`Error running demo: ${error.message}`));
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Display help if no arguments
if (process.argv.length <= 2) {
  program.help();
}
