import { TaskmasterSyncTool } from './api/tools/TaskmasterSyncTool';
import { consoleLogger } from './utils/ConsoleLogger';
import taskStorageFactory from './core/tasks/TaskStorageFactory';
import path from 'path';

async function main() {
  try {
    console.log('Initializing task storage...');
    await taskStorageFactory.initialize();
    console.log('Task storage initialized successfully');
    
    console.log('Creating TaskmasterSyncTool...');
    const syncTool = new TaskmasterSyncTool(consoleLogger);
    console.log('TaskmasterSyncTool created successfully');
    
    const tasksDir = path.join(process.cwd(), 'tasks');
    const tasksFile = path.join(tasksDir, 'tasks.json');
    
    console.log(`Creating tasks directory: ${tasksDir}`);
    require('fs').mkdirSync(tasksDir, { recursive: true });
    
    console.log(`Creating empty tasks.json file: ${tasksFile}`);
    require('fs').writeFileSync(tasksFile, JSON.stringify([]), 'utf-8');
    
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
  }
}

main().catch(console.error); 