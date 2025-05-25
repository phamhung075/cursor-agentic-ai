#!/usr/bin/env node

/**
 * 🔧 Task Logger Helper
 * 
 * Easy-to-use helper functions for logging nested task events
 * Integrates with the NestedTaskMonitor for comprehensive tracking
 */

const fs = require('fs');
const path = require('path');
const NestedTaskMonitor = require('./nested-task-monitor');

class TaskLoggerHelper {
    constructor() {
        this.projectRoot = process.cwd();
        this.tasksFile = path.join(this.projectRoot, '.cursor/rules/agents/_store/projects/_core/tasks/nested_tasks.json');
        this.monitor = new NestedTaskMonitor();
        
        // Auto-start monitoring if not already running
        if (!this.monitor.isMonitoring) {
            this.monitor.startMonitoring();
        }
    }

    /**
     * Load current tasks data
     */
    loadTasksData() {
        try {
            if (fs.existsSync(this.tasksFile)) {
                return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading tasks data:', error);
            return null;
        }
    }

    /**
     * Save tasks data
     */
    saveTasksData(tasksData) {
        try {
            fs.writeFileSync(this.tasksFile, JSON.stringify(tasksData, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error saving tasks data:', error);
            return false;
        }
    }

    /**
     * Generate unique task ID
     */
    generateTaskId(type = 'task') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6);
        return `${type}_${timestamp}_${random}`;
    }

    /**
     * Add a new nested task and log it
     */
    addNestedTask(taskData) {
        console.log('➕ Adding new nested task...');
        
        const tasksData = this.loadTasksData();
        if (!tasksData) {
            console.error('❌ Could not load tasks data');
            return null;
        }

        // Generate ID if not provided
        if (!taskData.id) {
            taskData.id = this.generateTaskId(taskData.type || 'task');
        }

        // Set default values
        const newTask = {
            id: taskData.id,
            type: taskData.type || 'task',
            level: taskData.level || 2,
            title: taskData.title || 'New Task',
            description: taskData.description || '',
            status: 'pending',
            priority: taskData.priority || 'medium',
            complexity: taskData.complexity || 'medium',
            estimatedHours: taskData.estimatedHours || 8,
            actualHours: null,
            progress: 0,
            aiGenerated: taskData.aiGenerated || false,
            aiConfidence: taskData.aiConfidence || 0.8,
            parent: taskData.parent || null,
            children: taskData.children || [],
            dependencies: taskData.dependencies || [],
            blockedBy: taskData.blockedBy || [],
            enables: taskData.enables || [],
            tags: taskData.tags || [],
            assignee: taskData.assignee || null,
            dueDate: taskData.dueDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            metadata: {
                businessValue: taskData.businessValue || 'medium',
                technicalRisk: taskData.technicalRisk || 'low',
                userImpact: taskData.userImpact || 'medium',
                domain: taskData.domain || 'general',
                ...taskData.metadata
            },
            ...taskData
        };

        // Add to appropriate array based on type
        switch (newTask.type) {
            case 'epic':
                tasksData.epics.push(newTask);
                break;
            case 'feature':
            case 'task':
                tasksData.tasks.push(newTask);
                break;
            case 'implementation':
            case 'subtask':
                tasksData.subtasks.push(newTask);
                break;
            default:
                tasksData.tasks.push(newTask);
        }

        // Update parent's children array if parent exists
        if (newTask.parent) {
            this.addChildToParent(tasksData, newTask.parent, newTask.id);
        }

        // Update metadata
        tasksData.metadata.totalTasks++;
        tasksData.metadata.timestamp = new Date().toISOString();

        // Save the updated data
        if (this.saveTasksData(tasksData)) {
            // Log the event
            this.monitor.logNestedTaskAdded(newTask);
            
            console.log(`✅ Task added successfully: ${newTask.id} - "${newTask.title}"`);
            return newTask;
        } else {
            console.error('❌ Failed to save task data');
            return null;
        }
    }

    /**
     * Add child to parent's children array
     */
    addChildToParent(tasksData, parentId, childId) {
        const allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        const parent = allTasks.find(task => task.id === parentId);
        if (parent && !parent.children.includes(childId)) {
            parent.children.push(childId);
        }
    }

    /**
     * Update task status and log it
     */
    updateTaskStatus(taskId, newStatus, actualHours = null) {
        console.log(`📝 Updating task status: ${taskId} → ${newStatus}`);
        
        const tasksData = this.loadTasksData();
        if (!tasksData) {
            console.error('❌ Could not load tasks data');
            return false;
        }

        const allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        const task = allTasks.find(t => t.id === taskId);
        if (!task) {
            console.error(`❌ Task not found: ${taskId}`);
            return false;
        }

        const previousTask = { ...task };
        
        // Update task
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        
        if (actualHours !== null) {
            task.actualHours = actualHours;
        }
        
        if (newStatus === 'completed') {
            task.completedAt = new Date().toISOString();
            task.progress = 100;
        } else if (newStatus === 'in-progress') {
            task.progress = Math.max(task.progress, 10);
        }

        // Save the updated data
        if (this.saveTasksData(tasksData)) {
            // Log the appropriate event
            if (newStatus === 'completed') {
                this.monitor.logTaskCompleted(task, actualHours);
            } else {
                this.monitor.logTaskUpdated(previousTask, task);
            }
            
            console.log(`✅ Task status updated: ${taskId} → ${newStatus}`);
            return true;
        } else {
            console.error('❌ Failed to save task data');
            return false;
        }
    }

    /**
     * Complete a task and log it
     */
    completeTask(taskId, actualHours = null) {
        return this.updateTaskStatus(taskId, 'completed', actualHours);
    }

    /**
     * Start a task and log it
     */
    startTask(taskId) {
        return this.updateTaskStatus(taskId, 'in-progress');
    }

    /**
     * Update task progress and log it
     */
    updateTaskProgress(taskId, progress) {
        console.log(`📊 Updating task progress: ${taskId} → ${progress}%`);
        
        const tasksData = this.loadTasksData();
        if (!tasksData) {
            console.error('❌ Could not load tasks data');
            return false;
        }

        const allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        const task = allTasks.find(t => t.id === taskId);
        if (!task) {
            console.error(`❌ Task not found: ${taskId}`);
            return false;
        }

        const previousTask = { ...task };
        
        // Update progress
        task.progress = Math.max(0, Math.min(100, progress));
        task.updatedAt = new Date().toISOString();
        
        // Auto-update status based on progress
        if (task.progress === 100 && task.status !== 'completed') {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
        } else if (task.progress > 0 && task.status === 'pending') {
            task.status = 'in-progress';
        }

        // Save the updated data
        if (this.saveTasksData(tasksData)) {
            // Log the event
            if (task.status === 'completed' && previousTask.status !== 'completed') {
                this.monitor.logTaskCompleted(task);
            } else {
                this.monitor.logTaskUpdated(previousTask, task);
            }
            
            console.log(`✅ Task progress updated: ${taskId} → ${progress}%`);
            return true;
        } else {
            console.error('❌ Failed to save task data');
            return false;
        }
    }

    /**
     * Add dependency between tasks and log it
     */
    addTaskDependency(taskId, dependsOnTaskId) {
        console.log(`🔗 Adding dependency: ${taskId} depends on ${dependsOnTaskId}`);
        
        const tasksData = this.loadTasksData();
        if (!tasksData) {
            console.error('❌ Could not load tasks data');
            return false;
        }

        const allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        const task = allTasks.find(t => t.id === taskId);
        const dependencyTask = allTasks.find(t => t.id === dependsOnTaskId);
        
        if (!task || !dependencyTask) {
            console.error('❌ One or both tasks not found');
            return false;
        }

        const previousTask = { ...task };
        
        // Add dependency
        if (!task.dependencies.includes(dependsOnTaskId)) {
            task.dependencies.push(dependsOnTaskId);
        }
        
        if (!task.blockedBy.includes(dependsOnTaskId)) {
            task.blockedBy.push(dependsOnTaskId);
        }
        
        // Add to dependency task's enables array
        if (!dependencyTask.enables.includes(taskId)) {
            dependencyTask.enables.push(taskId);
        }
        
        task.updatedAt = new Date().toISOString();
        dependencyTask.updatedAt = new Date().toISOString();

        // Update dependencies object
        if (!tasksData.dependencies[taskId]) {
            tasksData.dependencies[taskId] = {
                requires: [],
                enables: [],
                blocks: [],
                blockedBy: [],
                type: 'sequential',
                strength: 'hard'
            };
        }
        
        if (!tasksData.dependencies[taskId].requires.includes(dependsOnTaskId)) {
            tasksData.dependencies[taskId].requires.push(dependsOnTaskId);
            tasksData.dependencies[taskId].blockedBy.push(dependsOnTaskId);
        }

        // Save the updated data
        if (this.saveTasksData(tasksData)) {
            // Log the event
            this.monitor.logTaskUpdated(previousTask, task);
            
            console.log(`✅ Dependency added: ${taskId} → ${dependsOnTaskId}`);
            return true;
        } else {
            console.error('❌ Failed to save task data');
            return false;
        }
    }

    /**
     * Get task by ID
     */
    getTask(taskId) {
        const tasksData = this.loadTasksData();
        if (!tasksData) return null;

        const allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        return allTasks.find(t => t.id === taskId) || null;
    }

    /**
     * List all tasks with optional filtering
     */
    listTasks(filter = {}) {
        const tasksData = this.loadTasksData();
        if (!tasksData) return [];

        let allTasks = [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];

        // Apply filters
        if (filter.status) {
            allTasks = allTasks.filter(t => t.status === filter.status);
        }
        
        if (filter.type) {
            allTasks = allTasks.filter(t => t.type === filter.type);
        }
        
        if (filter.priority) {
            allTasks = allTasks.filter(t => t.priority === filter.priority);
        }
        
        if (filter.parent) {
            allTasks = allTasks.filter(t => t.parent === filter.parent);
        }

        return allTasks;
    }

    /**
     * Get monitoring status
     */
    getMonitoringStatus() {
        return this.monitor.getStatus();
    }

    /**
     * Get analytics
     */
    getAnalytics() {
        return this.monitor.getAnalytics();
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.monitor.stopMonitoring();
    }
}

// CLI execution
if (require.main === module) {
    const command = process.argv[2];
    const helper = new TaskLoggerHelper();
    
    switch (command?.toLowerCase()) {
        case 'add':
            // Example: node task-logger-helper.js add "New Feature Task" feature high
            const title = process.argv[3] || 'New Task';
            const type = process.argv[4] || 'task';
            const priority = process.argv[5] || 'medium';
            
            const newTask = helper.addNestedTask({
                title: title,
                type: type,
                priority: priority,
                description: `Auto-generated ${type} task: ${title}`
            });
            
            if (newTask) {
                console.log(`✅ Task created: ${newTask.id}`);
            }
            break;
            
        case 'complete':
            // Example: node task-logger-helper.js complete task_001 8
            const taskId = process.argv[3];
            const actualHours = process.argv[4] ? parseFloat(process.argv[4]) : null;
            
            if (!taskId) {
                console.error('❌ Task ID required');
                break;
            }
            
            if (helper.completeTask(taskId, actualHours)) {
                console.log(`✅ Task completed: ${taskId}`);
            }
            break;
            
        case 'start':
            // Example: node task-logger-helper.js start task_001
            const startTaskId = process.argv[3];
            
            if (!startTaskId) {
                console.error('❌ Task ID required');
                break;
            }
            
            if (helper.startTask(startTaskId)) {
                console.log(`✅ Task started: ${startTaskId}`);
            }
            break;
            
        case 'progress':
            // Example: node task-logger-helper.js progress task_001 50
            const progressTaskId = process.argv[3];
            const progress = process.argv[4] ? parseInt(process.argv[4]) : null;
            
            if (!progressTaskId || progress === null) {
                console.error('❌ Task ID and progress percentage required');
                break;
            }
            
            if (helper.updateTaskProgress(progressTaskId, progress)) {
                console.log(`✅ Task progress updated: ${progressTaskId} → ${progress}%`);
            }
            break;
            
        case 'list':
            // Example: node task-logger-helper.js list pending
            const status = process.argv[3];
            const filter = status ? { status } : {};
            
            const tasks = helper.listTasks(filter);
            console.log(`📋 Found ${tasks.length} tasks:`);
            tasks.forEach(task => {
                console.log(`  ${task.id}: "${task.title}" (${task.status}, ${task.priority})`);
            });
            break;
            
        case 'status':
            console.log('📊 Monitoring Status:');
            console.log(JSON.stringify(helper.getMonitoringStatus(), null, 2));
            break;
            
        case 'analytics':
            console.log('📈 Analytics:');
            const analytics = helper.getAnalytics();
            if (analytics) {
                console.log(JSON.stringify(analytics, null, 2));
            } else {
                console.log('No analytics data available');
            }
            break;
            
        default:
            console.log('🔧 Task Logger Helper');
            console.log('Available commands:');
            console.log('  add <title> [type] [priority] - Add new task');
            console.log('  complete <taskId> [actualHours] - Complete task');
            console.log('  start <taskId> - Start task');
            console.log('  progress <taskId> <percentage> - Update progress');
            console.log('  list [status] - List tasks');
            console.log('  status - Show monitoring status');
            console.log('  analytics - Show analytics');
    }
}

module.exports = TaskLoggerHelper; 