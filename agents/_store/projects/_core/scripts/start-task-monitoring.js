#!/usr/bin/env node

/**
 * 🚀 Quick Start - Task Monitoring System
 * 
 * Initialize and demonstrate the nested task monitoring system
 */

const TaskLoggerHelper = require('./task-logger-helper');

console.log('🚀 Starting Nested Task Monitoring System...\n');

// Initialize the task logger helper
const taskLogger = new TaskLoggerHelper();

console.log('📊 Task Monitoring System Status:');
console.log(JSON.stringify(taskLogger.getMonitoringStatus(), null, 2));
console.log('\n');

// Demonstrate adding a new task
console.log('🔧 Demonstrating Task Operations...\n');

// Add a sample task
const sampleTask = taskLogger.addNestedTask({
    title: 'Monitor System Integration Test',
    type: 'feature',
    priority: 'high',
    complexity: 'medium',
    estimatedHours: 4,
    description: 'Test the monitoring system integration with nested tasks',
    tags: ['monitoring', 'test', 'integration'],
    metadata: {
        businessValue: 'high',
        technicalRisk: 'low',
        userImpact: 'medium',
        domain: 'monitoring'
    }
});

if (sampleTask) {
    console.log('\n✅ Sample task created successfully!');
    
    // Start the task
    setTimeout(() => {
        console.log('\n📝 Starting the task...');
        taskLogger.startTask(sampleTask.id);
        
        // Update progress
        setTimeout(() => {
            console.log('\n📊 Updating progress to 50%...');
            taskLogger.updateTaskProgress(sampleTask.id, 50);
            
            // Complete the task
            setTimeout(() => {
                console.log('\n✅ Completing the task...');
                taskLogger.completeTask(sampleTask.id, 3.5);
                
                // Show final analytics
                setTimeout(() => {
                    console.log('\n📈 Final Analytics:');
                    const analytics = taskLogger.getAnalytics();
                    if (analytics) {
                        console.log(JSON.stringify(analytics, null, 2));
                    }
                    
                    console.log('\n🎉 Task monitoring demonstration complete!');
                    console.log('\n📋 Available Commands:');
                    console.log('  node task-logger-helper.js add "Task Title" [type] [priority]');
                    console.log('  node task-logger-helper.js complete <taskId> [actualHours]');
                    console.log('  node task-logger-helper.js start <taskId>');
                    console.log('  node task-logger-helper.js progress <taskId> <percentage>');
                    console.log('  node task-logger-helper.js list [status]');
                    console.log('  node task-logger-helper.js status');
                    console.log('  node task-logger-helper.js analytics');
                    
                    console.log('\n📁 Log Files Location:');
                    const status = taskLogger.getMonitoringStatus();
                    console.log(`  Session logs: ${status.logFiles.session}`);
                    console.log(`  Daily logs: ${status.logFiles.daily}`);
                    console.log(`  Analytics: ${status.logFiles.analytics}`);
                    console.log(`  Errors: ${status.logFiles.errors}`);
                    
                    console.log('\n🔄 The monitoring system will continue running in the background.');
                    console.log('   Use Ctrl+C to stop monitoring when done.');
                    
                }, 2000);
            }, 2000);
        }, 2000);
    }, 2000);
} else {
    console.log('❌ Failed to create sample task');
}

// Keep the process alive to demonstrate monitoring
process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping task monitoring...');
    taskLogger.stopMonitoring();
    console.log('✅ Task monitoring stopped. Goodbye!');
    process.exit(0);
});

// Prevent process from exiting
setInterval(() => {}, 1000); 