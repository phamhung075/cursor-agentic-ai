// Test script for Taskmaster synchronization
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    console.log('Starting Taskmaster sync test...');
    
    // Ensure we have a tasks directory
    const tasksDir = path.join(process.cwd(), 'tasks');
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    
    // Create a sample tasks.json file for testing
    const tasksFilePath = path.join(tasksDir, 'tasks.json');
    const sampleTasks = [
      {
        id: "1",
        title: "Implement TaskmasterSyncTool",
        details: "Create a tool to sync tasks between the server and Taskmaster",
        status: "in-progress",
        priority: "high",
        dependencies: []
      },
      {
        id: "2",
        title: "Create TaskmasterSyncService",
        details: "Implement automatic synchronization service",
        status: "pending",
        priority: "medium",
        dependencies: ["1"]
      },
      {
        id: "3",
        title: "Update SSEServer for Taskmaster sync",
        details: "Integrate TaskmasterSyncService with SSEServer",
        status: "pending",
        priority: "medium",
        dependencies: ["2"]
      }
    ];
    
    console.log(`Writing sample tasks to ${tasksFilePath}`);
    fs.writeFileSync(tasksFilePath, JSON.stringify(sampleTasks, null, 2), 'utf-8');
    
    console.log('Sample tasks created successfully');
    console.log('You can now test the sync functionality using:');
    console.log('node ./dist/test-taskmaster-sync.js');
    
    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Error in test setup:', error);
    console.error('Stack trace:', error.stack);
  }
}

main().catch(console.error); 