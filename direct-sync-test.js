// Direct test for TaskmasterSyncTool

const fs = require('fs').promises;
const path = require('path');
const { TaskmasterSyncTool } = require('./dist/api/tools/TaskmasterSyncTool');
const { consoleLogger } = require('./dist/utils/ConsoleLogger');

async function createTestTaskmasterFile() {
  const testTasksFile = path.join(process.cwd(), 'test-tasks.json');
  const testTasks = {
    tasks: [
      {
        id: '100',
        title: 'Test Task 1',
        description: 'This is a test task from Taskmaster',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        details: 'This task was created specifically for testing the Taskmaster sync functionality.'
      },
      {
        id: '101',
        title: 'Test Task 2',
        description: 'Another test task from Taskmaster',
        status: 'in-progress',
        priority: 'medium',
        dependencies: ['100'],
        details: 'This task depends on Test Task 1 and should be imported correctly.'
      }
    ]
  };
  
  try {
    await fs.writeFile(testTasksFile, JSON.stringify(testTasks, null, 2), 'utf-8');
    console.log(`Created test Taskmaster file at: ${testTasksFile}`);
    return testTasksFile;
  } catch (error) {
    console.error('Error creating test Taskmaster file:', error);
    throw error;
  }
}

async function directTest() {
  try {
    console.log('Creating test Taskmaster file...');
    const testTasksFile = await createTestTaskmasterFile();
    
    console.log('Creating TaskmasterSyncTool...');
    const syncTool = new TaskmasterSyncTool(consoleLogger);
    
    console.log('Executing bidirectional sync...');
    const result = await syncTool.execute({
      direction: 'bidirectional',
      taskmasterFile: testTasksFile,
      forceTaskmasterAsSource: true
    });
    
    console.log('Sync result:', JSON.stringify(result, null, 2));
    
    // Clean up
    try {
      await fs.unlink(testTasksFile);
      console.log(`Deleted test Taskmaster file: ${testTasksFile}`);
    } catch (error) {
      console.error('Error deleting test Taskmaster file:', error);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error during direct test:', error);
  }
}

directTest().catch(console.error); 