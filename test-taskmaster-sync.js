// Test script for TaskmasterSyncTool

console.log('Importing modules...');
const fs = require('fs').promises;
const path = require('path');
const { ToolManager } = require('./dist/api/tools/ToolManager');
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

async function testTaskmasterSync() {
  try {
    console.log('Creating ToolManager...');
    const toolManager = new ToolManager(consoleLogger);
    
    console.log('Loading tools...');
    await toolManager.loadAllTools('./dist/api/tools');
    
    const tools = toolManager.getAllTools();
    console.log(`Tools loaded: ${tools.length}`);
    console.log('Tool names:', tools.map(t => t.name));
    
    const syncTool = toolManager.getTool('sync_taskmaster');
    if (!syncTool) {
      throw new Error('TaskmasterSyncTool not found');
    }
    
    console.log('Found TaskmasterSyncTool');
    
    // Create a test Taskmaster file
    const testTasksFile = await createTestTaskmasterFile();
    
    // Check current database state
    console.log('Checking database state...');
    const taskStorage = require('./dist/core/tasks/TaskStorageFactory').default;
    const storage = await taskStorage.getStorageService();
    const beforeTasks = await storage.getTasks();
    console.log(`Before sync: ${beforeTasks.tasks.length} tasks in the database`);
    console.log('Database task IDs:', beforeTasks.tasks.map(t => t.id));
    
    // Check current Taskmaster state
    let taskmasterTasks = [];
    try {
      const fileContent = await fs.readFile(testTasksFile, 'utf-8');
      const tasksData = JSON.parse(fileContent);
      taskmasterTasks = tasksData.tasks || [];
      console.log(`Before sync: ${taskmasterTasks.length} tasks in Taskmaster test file`);
      console.log('Taskmaster task IDs:', taskmasterTasks.map(t => t.id));
    } catch (error) {
      console.error('Error reading Taskmaster tasks:', error);
    }
    
    console.log('Executing bidirectional sync with forceTaskmasterAsSource=true...');
    const result = await syncTool.execute({
      direction: 'bidirectional',
      taskmasterFile: testTasksFile,
      forceTaskmasterAsSource: true
    });
    
    console.log('Sync result:', JSON.stringify(result, null, 2));
    
    // Check database state after sync
    const afterTasks = await storage.getTasks();
    console.log(`After sync: ${afterTasks.tasks.length} tasks in the database`);
    console.log('Database task IDs after sync:', afterTasks.tasks.map(t => t.id));
    
    // Check Taskmaster state after sync
    try {
      const fileContent = await fs.readFile(testTasksFile, 'utf-8');
      const tasksData = JSON.parse(fileContent);
      const afterTaskmasterTasks = tasksData.tasks || [];
      console.log(`After sync: ${afterTaskmasterTasks.length} tasks in Taskmaster`);
      console.log('Taskmaster task IDs after sync:', afterTaskmasterTasks.map(t => t.id));
    } catch (error) {
      console.error('Error reading Taskmaster tasks after sync:', error);
    }
    
    // Clean up
    try {
      await fs.unlink(testTasksFile);
      console.log(`Deleted test Taskmaster file: ${testTasksFile}`);
    } catch (error) {
      console.error('Error deleting test Taskmaster file:', error);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

testTaskmasterSync().catch(console.error); 