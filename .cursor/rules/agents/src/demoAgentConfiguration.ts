import fs from 'fs';
import path from 'path';
import { AgentFactory, AgentType, PermissionLevel } from './common';
import { initializeDefaultAgentConfigurations } from './initializeAgents';

/**
 * Demonstrates the agent configuration system
 */
async function demonstrateAgentConfiguration() {
  console.log('🔧 Agent Configuration System Demonstration');
  console.log('------------------------------------------');

  try {
    // Initialize default configurations
    console.log('\n📝 Initializing default agent configurations...');
    await initializeDefaultAgentConfigurations();

    // Get the agent factory
    const agentFactory = AgentFactory.getInstance();

    // Demonstrate activating different agent types
    console.log('\n🚀 Activating different agent types:');

    // Rule Interpreter Agent
    console.log('\n1️⃣ Rule Interpreter Agent:');
    const ruleAgent = await agentFactory.getAgentByType(AgentType.RULE_INTERPRETER);
    if (ruleAgent) {
      console.log('✅ Rule Interpreter Agent created successfully');
      console.log(`   Agent ID: ${ruleAgent.getConfig().id}`);
      console.log(`   Permission Level: ${PermissionLevel[ruleAgent.getConfig().permissionLevel]}`);

      // Activate the rule interpreter agent
      const validationResult = await ruleAgent.activate('check-rules');
      console.log(`   Validation result: ${validationResult.valid ? 'Valid' : 'Invalid'}`);
    }

    // Context Manager Agent
    console.log('\n2️⃣ Context Manager Agent:');
    const contextAgent = await agentFactory.getAgentByType(AgentType.CONTEXT_MANAGER);
    if (contextAgent) {
      console.log('✅ Context Manager Agent created successfully');
      console.log(`   Agent ID: ${contextAgent.getConfig().id}`);
      console.log(`   Permission Level: ${PermissionLevel[contextAgent.getConfig().permissionLevel]}`);

      // Activate the context manager agent
      const contextResult = await contextAgent.activate('session-start', {
        taskId: 'demo-task',
        taskTitle: 'Demonstration Task'
      });
      console.log(`   Context operation result: ${contextResult.success ? 'Success' : 'Failure'}`);
    }

    // Task Manager Agent
    console.log('\n3️⃣ Task Manager Agent:');
    const taskAgent = await agentFactory.getAgentByType(AgentType.TASK_MANAGER);
    if (taskAgent) {
      console.log('✅ Task Manager Agent created successfully');
      console.log(`   Agent ID: ${taskAgent.getConfig().id}`);
      console.log(`   Permission Level: ${PermissionLevel[taskAgent.getConfig().permissionLevel]}`);

      // Activate the task manager agent
      const taskResult = await taskAgent.activate('next-task');
      console.log(`   Task operation result: ${taskResult.success ? 'Success' : 'Failure'}`);
    }

    // Demonstrate agent deactivation
    console.log('\n🛑 Deactivating all agents...');
    await agentFactory.deactivateAll();
    console.log('✅ All agents deactivated');

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error);
  }

  console.log('\n🏁 Demonstration complete');
}

// Run the demonstration
demonstrateAgentConfiguration().catch(console.error);
