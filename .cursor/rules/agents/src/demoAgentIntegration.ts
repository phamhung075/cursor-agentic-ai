import { AgentIntegrationService } from './agent-integration/agentIntegrationService';

/**
 * Demonstrates the agent integration functionality
 */
async function demonstrateAgentIntegration() {
  console.log('🔄 Agent Integration Demonstration');
  console.log('----------------------------------');

  // Get the agent integration service
  const integrationService = AgentIntegrationService.getInstance();

  try {
    // Initialize all agents
    console.log('\n1️⃣ Initializing agents...');
    await integrationService.initializeAgents();
    console.log('✅ Agents initialized');

    // Create a task context
    console.log('\n2️⃣ Creating task context...');
    const taskId = 'demo-integration-task';
    const taskTitle = 'Demonstrate Agent Integration';
    const contextFile = await integrationService.createTaskContext(taskId, taskTitle);
    console.log(`✅ Context created for task ${taskId}`);

    // Validate a file with rules
    console.log('\n3️⃣ Validating file with rules...');
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

    const validationResult = await integrationService.validateFileWithRules(
      sampleFile.filePath,
      sampleFile.fileContent,
      taskId
    );

    console.log('✅ File validation completed');
    if (validationResult.issues?.length > 0) {
      console.log(`Found ${validationResult.issues.length} issues`);
    }

    // Update task status
    console.log('\n4️⃣ Updating task status...');
    await integrationService.updateTaskStatus(taskId, 'in-progress');
    console.log('✅ Task status updated to in-progress');

    // Expand the task
    console.log('\n5️⃣ Expanding task into subtasks...');
    try {
      const expansionResult = await integrationService.expandTask(taskId, {
        num: 3,
        research: false
      });
      console.log(`✅ Task expanded into ${expansionResult.subtasks?.length || 0} subtasks`);
    } catch (error) {
      console.log('⚠️ Task expansion simulation (would normally create subtasks)');
    }

    // Complete the task
    console.log('\n6️⃣ Completing the task...');
    await integrationService.updateTaskStatus(taskId, 'done');
    console.log('✅ Task marked as done and context finalized');

    // Shutdown agents
    console.log('\n7️⃣ Shutting down agents...');
    await integrationService.shutdownAgents();
    console.log('✅ All agents deactivated');

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error);
  }

  console.log('\n🏁 Demonstration complete');
}

// Run the demonstration
demonstrateAgentIntegration().catch(console.error);