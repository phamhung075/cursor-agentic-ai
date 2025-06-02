import { AgentFactory, AgentType } from './common';

/**
 * Demonstrates the agent system functionality
 */
async function demonstrateAgentSystem() {
  console.log('🤖 Agent System Demonstration');
  console.log('---------------------------');

  // Get the agent factory
  const agentFactory = AgentFactory.getInstance();

  try {
    // Demonstrate Rule Interpreter Agent
    console.log('\n📏 Demonstrating Rule Interpreter Agent:');
    const ruleAgent = await agentFactory.getAgentByType(AgentType.RULE_INTERPRETER);

    if (ruleAgent) {
      console.log('✅ Rule Interpreter Agent created successfully');

      // Sample file for validation
      const sampleFile = {
        filePath: 'sample.ts',
        fileContent: `
          // Sample file for validation
          function badFunction() {
            var x = 5; // Using var instead of let/const
            return x;
          }
        `
      };

      // Activate the agent to validate the file
      console.log('\nValidating sample file...');
      const validationResult = await ruleAgent.activate('validate-file', sampleFile);

      console.log(`\nValidation result: ${validationResult.valid ? 'Valid' : 'Invalid'}`);
      if (!validationResult.valid) {
        console.log(`Found ${validationResult.issues.length} issues:`);
        validationResult.issues.forEach((issue: any, index: number) => {
          console.log(`  ${index + 1}. ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      }

      // Check rule consistency
      console.log('\nChecking rule consistency...');
      const consistencyResult = await ruleAgent.activate('check-rules');

      console.log(`Consistency check: ${consistencyResult.valid ? 'Passed' : 'Failed'}`);
      if (!consistencyResult.valid) {
        console.log(`Found ${consistencyResult.issues.length} issues:`);
        consistencyResult.issues.forEach((issue: any, index: number) => {
          console.log(`  ${index + 1}. ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      }
    } else {
      console.log('❌ Failed to create Rule Interpreter Agent');
    }

    // Deactivate all agents when done
    console.log('\nDeactivating all agents...');
    await agentFactory.deactivateAll();
    console.log('✅ All agents deactivated');

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error);
  }

  console.log('\n🏁 Demonstration complete');
}

// Run the demonstration
demonstrateAgentSystem().catch(console.error);
