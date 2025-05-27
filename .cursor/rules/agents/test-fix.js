// This is a simple test script to verify our fix for the level field issue
const fs = require('fs');
const path = require('path');

// Create tasks directory if it doesn't exist
const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
}

// Create a sample tasks.json with nested tasks to test level computation
const tasksFile = path.join(tasksDir, 'tasks.json');
const sampleTasks = [
  {
    id: "1",
    title: "Parent Task 1",
    status: "pending",
    priority: "high",
    details: "This is a parent task",
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Child Task 1.1",
        status: "pending",
        priority: "medium",
        details: "This is a child task",
        dependencies: []
      },
      {
        id: "1.2",
        title: "Child Task 1.2",
        status: "pending",
        priority: "low",
        details: "This is another child task",
        dependencies: [],
        subtasks: [
          {
            id: "1.2.1",
            title: "Grandchild Task 1.2.1",
            status: "pending",
            priority: "medium",
            details: "This is a grandchild task",
            dependencies: []
          }
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Parent Task 2",
    status: "pending",
    priority: "medium",
    details: "This is another parent task",
    dependencies: []
  }
];

// Write the sample tasks to the file
fs.writeFileSync(tasksFile, JSON.stringify(sampleTasks, null, 2));

console.log('Created sample tasks.json file with hierarchical tasks.');
console.log('Now you can start the server and run the sync to test the level field fix.');
console.log('');
console.log('To start the server: npm start');
console.log('');
console.log('The TaskmasterSyncTool will automatically sync on startup and should now');
console.log('properly set the level field based on the task hierarchy depth.'); 