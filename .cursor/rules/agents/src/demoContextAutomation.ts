import { ContextAutomation } from './context-manager/contextAutomation';
import { ContextStatus } from './common/types';

/**
 * Demonstrates the context automation system
 */
async function demonstrateContextAutomation() {
  console.log('📝 Context Automation System Demonstration');
  console.log('------------------------------------------');

  try {
    // Get the context automation instance
    const contextAutomation = ContextAutomation.getInstance();

    // Define a demo task
    const taskId = 'demo-123';
    const taskTitle = 'Implement Context Automation';

    // 1. Initialize context
    console.log('\n1️⃣ Initializing context file...');
    const context = await contextAutomation.initializeContext(taskId, taskTitle);
    console.log(`✅ Context initialized for task ${taskId}`);
    console.log(`   Phase: ${context.status.phase}`);
    console.log(`   Progress: ${context.status.progress}`);
    console.log(`   Next Action: ${context.status.nextAction}`);

    // 2. Update status
    console.log('\n2️⃣ Updating task status...');
    const newStatus: ContextStatus = {
      phase: 'Implementation',
      progress: '30% - Core functionality implemented',
      nextAction: 'Add documentation and tests'
    };
    await contextAutomation.updateStatus(taskId, newStatus, 3);
    console.log('✅ Status updated');

    // 3. Add actions
    console.log('\n3️⃣ Adding actions...');
    await contextAutomation.addAction(taskId, 'Created basic file structure');
    await contextAutomation.addAction(taskId, 'Implemented core interfaces');
    await contextAutomation.addAction(taskId, 'Added automation logic');
    console.log('✅ Actions added');

    // 4. Increment tool calls
    console.log('\n4️⃣ Incrementing tool calls...');
    await contextAutomation.incrementToolCalls(taskId, 2);
    console.log('✅ Tool calls incremented');

    // 5. Add code references
    console.log('\n5️⃣ Adding code references...');
    await contextAutomation.addCodeReference(
      taskId,
      '.cursor/rules/agents/src/context-manager/contextAutomation.ts',
      'Implementation of context automation system',
      true // Created (not modified)
    );
    await contextAutomation.addCodeReference(
      taskId,
      '.cursor/rules/agents/src/context-manager/contextManager.ts',
      'Updated to work with the automation system',
      false // Modified
    );
    console.log('✅ Code references added');

    // 6. Start a new session
    console.log('\n6️⃣ Starting a new session...');
    await contextAutomation.startNewSession(taskId);
    console.log('✅ New session started');

    // 7. Add more actions in the new session
    console.log('\n7️⃣ Adding actions to new session...');
    await contextAutomation.addAction(taskId, 'Added unit tests');
    await contextAutomation.addAction(taskId, 'Improved error handling');
    console.log('✅ Actions added to new session');

    // 8. Finalize the context
    console.log('\n8️⃣ Finalizing context...');
    await contextAutomation.finalizeContext(taskId);
    console.log('✅ Context finalized');

    // 9. Print the final context
    const finalContext = await contextAutomation.getContext(taskId);
    console.log('\n📋 Final Context File:');
    console.log(JSON.stringify(finalContext, null, 2));

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error);
  }

  console.log('\n🏁 Demonstration complete');
}

// Run the demonstration
demonstrateContextAutomation().catch(console.error);
