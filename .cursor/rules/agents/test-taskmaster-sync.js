// This script will test the TaskmasterSyncTool using the compiled JavaScript

const path = require('path');
const fs = require('fs');

async function main() {
  try {
    console.log('Importing modules...');
    const { TaskmasterSyncTool } = require('./dist/api/tools/TaskmasterSyncTool');
    const { consoleLogger } = require('./dist/utils/ConsoleLogger');
    const taskStorageFactory = require('./dist/core/tasks/TaskStorageFactory').default;
    
    console.log('Initializing task storage...');
    await taskStorageFactory.initialize();
    console.log('Task storage initialized successfully');
    
    console.log('Creating TaskmasterSyncTool...');
    const syncTool = new TaskmasterSyncTool(consoleLogger);
    console.log('TaskmasterSyncTool created successfully');
    
    const tasksDir = path.join(process.cwd(), 'tasks');
    const tasksFile = path.join(tasksDir, 'tasks.json');
    
    console.log(`Creating tasks directory: ${tasksDir}`);
    fs.mkdirSync(tasksDir, { recursive: true });
    
    console.log(`Creating empty tasks.json file: ${tasksFile}`);
    fs.writeFileSync(tasksFile, JSON.stringify([]), 'utf-8');
    
    console.log('Executing TaskmasterSyncTool...');
    const result = await syncTool.execute({
      direction: 'bidirectional',
      taskmasterFile: tasksFile
    });
    
    console.log('TaskmasterSyncTool executed successfully');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error in test:', error);
    console.error('Stack trace:', error.stack);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  console.error('Stack trace:', error.stack);
}); 