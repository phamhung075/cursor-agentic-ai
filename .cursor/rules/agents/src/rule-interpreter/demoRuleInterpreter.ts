import { RuleParser, RuleInterpreter } from './index';
import fs from 'fs';
import path from 'path';

/**
 * Demonstrates the usage of the RuleInterpreter
 */
async function demonstrateRuleInterpreter() {
  console.log('💡 Rule Interpreter Demonstration');
  console.log('--------------------------------');

  // Create a rule interpreter
  const interpreter = new RuleInterpreter();

  // Load all rules from the workspace
  console.log('⏳ Loading rules from workspace...');
  interpreter.loadRules();

  // Get all rule files
  const ruleFiles = RuleParser.getRuleFiles();
  console.log(`✅ Loaded ${ruleFiles.length} rule files`);

  // Show rule titles
  const rules = RuleParser.parseAllRules();
  console.log('\n📚 Rule Titles:');
  rules.forEach(rule => {
    console.log(`   - ${rule.title} (${rule.metadata.description})`);
  });

  // Check rule consistency
  console.log('\n🔍 Validating rule consistency...');
  const consistencyResult = interpreter.validateRuleConsistency();
  if (consistencyResult.valid) {
    console.log('✅ All rules are consistent');
  } else {
    console.log('⚠️ Found consistency issues:');
    consistencyResult.issues.forEach(issue => {
      console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
    });
  }

  // Demonstrate file validation
  console.log('\n🧪 Testing rule application on a sample file...');

  // Create a sample file content that would violate some rules
  const sampleContent = `// Sample file for rule validation
function badFunction() {
  // This is a function with poor naming
  var x = 5; // Using var instead of let/const
  return x;
}

// Missing proper JSDoc
export function exportedFunction(param) {
  return param + 1;
}`;

  // Validate the sample content
  const validation = interpreter.validateFile('sample.ts', sampleContent);
  if (validation.valid) {
    console.log('✅ Sample file passes all rules');
  } else {
    console.log(`⚠️ Found ${validation.issues.length} issues in sample file:`);
    validation.issues.forEach(issue => {
      console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
    });

    // Get and show resolutions
    const resolutions = interpreter.getResolutions(validation.issues);
    if (resolutions.length > 0) {
      console.log(`\n🔧 Suggested resolutions (${resolutions.length}):`);
      resolutions.forEach(resolution => {
        console.log(`   - ${resolution.description}`);
        console.log(`     ${resolution.automatic ? '(Automatic)' : '(Manual)'}`);
      });

      // Apply automatic resolutions
      const appliedCount = interpreter.applyResolutions(resolutions);
      console.log(`\n✅ Applied ${appliedCount} automatic resolutions`);
    }
  }

  console.log('\n🏁 Demonstration complete');
}

// Run the demonstration
demonstrateRuleInterpreter().catch(console.error);