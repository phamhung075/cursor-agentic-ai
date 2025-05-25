#!/usr/bin/env node

/**
 * 📊 Nested Task Monitor & Logger
 * 
 * Comprehensive monitoring system for AI-driven nested task management
 * Tracks task creation, updates, completion, and hierarchy changes
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class NestedTaskMonitor extends EventEmitter {
    constructor() {
        super();
        this.projectRoot = process.cwd();
        this.tasksFile = path.join(this.projectRoot, '.cursor/rules/agents/_store/projects/_core/tasks/nested_tasks.json');
        this.logsDir = path.join(this.projectRoot, '.cursor/rules/agents/_store/logs/task-monitoring');
        this.sessionId = this.generateSessionId();
        this.isMonitoring = false;
        
        this.ensureDirectories();
        this.initializeLogger();
    }

    /**
     * Initialize the monitoring logger
     */
    initializeLogger() {
        console.log('📊 Initializing Nested Task Monitor...');
        
        // Create log files
        this.createLogFiles();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log(`✅ Task Monitor initialized with session: ${this.sessionId}`);
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        const dirs = [
            this.logsDir,
            path.join(this.logsDir, 'sessions'),
            path.join(this.logsDir, 'daily'),
            path.join(this.logsDir, 'analytics')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Create log files for the session
     */
    createLogFiles() {
        const timestamp = new Date().toISOString().split('T')[0];
        
        this.logFiles = {
            session: path.join(this.logsDir, 'sessions', `session-${this.sessionId}.log`),
            daily: path.join(this.logsDir, 'daily', `tasks-${timestamp}.log`),
            analytics: path.join(this.logsDir, 'analytics', `analytics-${timestamp}.json`),
            errors: path.join(this.logsDir, 'errors.log')
        };

        // Initialize session log
        this.writeLog('session', {
            type: 'SESSION_START',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            message: 'Task monitoring session started'
        });
    }

    /**
     * Set up event listeners for task monitoring
     */
    setupEventListeners() {
        this.on('task_added', (data) => this.handleTaskAdded(data));
        this.on('task_updated', (data) => this.handleTaskUpdated(data));
        this.on('task_completed', (data) => this.handleTaskCompleted(data));
        this.on('task_deleted', (data) => this.handleTaskDeleted(data));
        this.on('hierarchy_changed', (data) => this.handleHierarchyChanged(data));
        this.on('dependency_updated', (data) => this.handleDependencyUpdated(data));
    }

    /**
     * Start monitoring the nested tasks file
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Task monitoring is already active');
            return;
        }

        console.log('👁️ Starting nested task monitoring...');
        
        // Watch the tasks file for changes
        if (fs.existsSync(this.tasksFile)) {
            this.watcher = fs.watchFile(this.tasksFile, (curr, prev) => {
                this.handleFileChange(curr, prev);
            });
        }

        this.isMonitoring = true;
        
        this.logEvent({
            type: 'MONITORING_STARTED',
            message: 'Nested task monitoring activated',
            file: this.tasksFile
        });

        console.log('✅ Task monitoring active');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ Task monitoring is not active');
            return;
        }

        console.log('🛑 Stopping task monitoring...');
        
        if (this.watcher) {
            fs.unwatchFile(this.tasksFile);
            this.watcher = null;
        }

        this.isMonitoring = false;
        
        this.logEvent({
            type: 'MONITORING_STOPPED',
            message: 'Nested task monitoring deactivated'
        });

        console.log('✅ Task monitoring stopped');
    }

    /**
     * Handle file changes in the tasks file
     */
    handleFileChange(curr, prev) {
        if (curr.mtime !== prev.mtime) {
            this.logEvent({
                type: 'FILE_CHANGED',
                message: 'Nested tasks file modified',
                timestamp: curr.mtime.toISOString()
            });

            // Analyze the changes
            this.analyzeTaskChanges();
        }
    }

    /**
     * Analyze changes in the tasks file
     */
    analyzeTaskChanges() {
        try {
            if (!fs.existsSync(this.tasksFile)) {
                this.logEvent({
                    type: 'FILE_NOT_FOUND',
                    message: 'Tasks file not found',
                    level: 'warning'
                });
                return;
            }

            const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            
            // Store previous state for comparison
            if (this.previousTasksData) {
                this.compareTaskStates(this.previousTasksData, tasksData);
            }
            
            this.previousTasksData = JSON.parse(JSON.stringify(tasksData));
            
            this.logEvent({
                type: 'TASKS_ANALYZED',
                message: 'Task changes analyzed',
                totalTasks: tasksData.metadata.totalTasks,
                epics: tasksData.epics.length,
                tasks: tasksData.tasks.length,
                subtasks: tasksData.subtasks.length
            });

        } catch (error) {
            this.logError('Error analyzing task changes', error);
        }
    }

    /**
     * Compare previous and current task states
     */
    compareTaskStates(previous, current) {
        // Check for new tasks
        this.detectNewTasks(previous, current);
        
        // Check for updated tasks
        this.detectUpdatedTasks(previous, current);
        
        // Check for completed tasks
        this.detectCompletedTasks(previous, current);
        
        // Check for deleted tasks
        this.detectDeletedTasks(previous, current);
        
        // Check for hierarchy changes
        this.detectHierarchyChanges(previous, current);
    }

    /**
     * Detect new tasks
     */
    detectNewTasks(previous, current) {
        const allPreviousTasks = this.getAllTasks(previous);
        const allCurrentTasks = this.getAllTasks(current);
        
        const previousIds = new Set(allPreviousTasks.map(t => t.id));
        const newTasks = allCurrentTasks.filter(t => !previousIds.has(t.id));
        
        newTasks.forEach(task => {
            this.emit('task_added', {
                task: task,
                timestamp: new Date().toISOString(),
                parentId: task.parent,
                level: task.level,
                type: task.type
            });
        });
    }

    /**
     * Detect updated tasks
     */
    detectUpdatedTasks(previous, current) {
        const allPreviousTasks = this.getAllTasks(previous);
        const allCurrentTasks = this.getAllTasks(current);
        
        const previousTasksMap = new Map(allPreviousTasks.map(t => [t.id, t]));
        
        allCurrentTasks.forEach(currentTask => {
            const previousTask = previousTasksMap.get(currentTask.id);
            if (previousTask && this.hasTaskChanged(previousTask, currentTask)) {
                this.emit('task_updated', {
                    taskId: currentTask.id,
                    previous: previousTask,
                    current: currentTask,
                    changes: this.getTaskChanges(previousTask, currentTask),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Detect completed tasks
     */
    detectCompletedTasks(previous, current) {
        const allPreviousTasks = this.getAllTasks(previous);
        const allCurrentTasks = this.getAllTasks(current);
        
        const previousTasksMap = new Map(allPreviousTasks.map(t => [t.id, t]));
        
        allCurrentTasks.forEach(currentTask => {
            const previousTask = previousTasksMap.get(currentTask.id);
            if (previousTask && 
                previousTask.status !== 'completed' && 
                currentTask.status === 'completed') {
                
                this.emit('task_completed', {
                    task: currentTask,
                    previousStatus: previousTask.status,
                    completedAt: currentTask.completedAt || new Date().toISOString(),
                    estimatedHours: currentTask.estimatedHours,
                    actualHours: currentTask.actualHours,
                    efficiency: this.calculateEfficiency(currentTask)
                });
            }
        });
    }

    /**
     * Detect deleted tasks
     */
    detectDeletedTasks(previous, current) {
        const allPreviousTasks = this.getAllTasks(previous);
        const allCurrentTasks = this.getAllTasks(current);
        
        const currentIds = new Set(allCurrentTasks.map(t => t.id));
        const deletedTasks = allPreviousTasks.filter(t => !currentIds.has(t.id));
        
        deletedTasks.forEach(task => {
            this.emit('task_deleted', {
                task: task,
                timestamp: new Date().toISOString(),
                reason: 'Task removed from hierarchy'
            });
        });
    }

    /**
     * Detect hierarchy changes
     */
    detectHierarchyChanges(previous, current) {
        const allPreviousTasks = this.getAllTasks(previous);
        const allCurrentTasks = this.getAllTasks(current);
        
        const previousTasksMap = new Map(allPreviousTasks.map(t => [t.id, t]));
        
        allCurrentTasks.forEach(currentTask => {
            const previousTask = previousTasksMap.get(currentTask.id);
            if (previousTask && 
                (previousTask.parent !== currentTask.parent || 
                 JSON.stringify(previousTask.children) !== JSON.stringify(currentTask.children))) {
                
                this.emit('hierarchy_changed', {
                    taskId: currentTask.id,
                    previousParent: previousTask.parent,
                    currentParent: currentTask.parent,
                    previousChildren: previousTask.children,
                    currentChildren: currentTask.children,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Handle task added event
     */
    handleTaskAdded(data) {
        const logEntry = {
            type: 'TASK_ADDED',
            taskId: data.task.id,
            taskType: data.task.type,
            taskLevel: data.task.level,
            taskTitle: data.task.title,
            parentId: data.task.parent,
            priority: data.task.priority,
            complexity: data.task.complexity,
            estimatedHours: data.task.estimatedHours,
            aiGenerated: data.task.aiGenerated,
            aiConfidence: data.task.aiConfidence,
            timestamp: data.timestamp,
            message: `New ${data.task.type} task added: "${data.task.title}"`
        };

        this.logEvent(logEntry);
        this.updateAnalytics('task_added', data);

        console.log(`➕ Task Added: ${data.task.id} - "${data.task.title}" (${data.task.type}, Level ${data.task.level})`);
    }

    /**
     * Handle task updated event
     */
    handleTaskUpdated(data) {
        const logEntry = {
            type: 'TASK_UPDATED',
            taskId: data.taskId,
            changes: data.changes,
            timestamp: data.timestamp,
            message: `Task updated: ${data.taskId} - Changes: ${Object.keys(data.changes).join(', ')}`
        };

        this.logEvent(logEntry);
        this.updateAnalytics('task_updated', data);

        console.log(`📝 Task Updated: ${data.taskId} - Changes: ${Object.keys(data.changes).join(', ')}`);
    }

    /**
     * Handle task completed event
     */
    handleTaskCompleted(data) {
        const logEntry = {
            type: 'TASK_COMPLETED',
            taskId: data.task.id,
            taskTitle: data.task.title,
            taskType: data.task.type,
            taskLevel: data.task.level,
            previousStatus: data.previousStatus,
            completedAt: data.completedAt,
            estimatedHours: data.estimatedHours,
            actualHours: data.actualHours,
            efficiency: data.efficiency,
            timestamp: new Date().toISOString(),
            message: `Task completed: "${data.task.title}" - Efficiency: ${data.efficiency}%`
        };

        this.logEvent(logEntry);
        this.updateAnalytics('task_completed', data);

        console.log(`✅ Task Completed: ${data.task.id} - "${data.task.title}" (Efficiency: ${data.efficiency}%)`);
        
        // Check if this completion enables other tasks
        this.checkEnabledTasks(data.task);
    }

    /**
     * Handle task deleted event
     */
    handleTaskDeleted(data) {
        const logEntry = {
            type: 'TASK_DELETED',
            taskId: data.task.id,
            taskTitle: data.task.title,
            taskType: data.task.type,
            reason: data.reason,
            timestamp: data.timestamp,
            message: `Task deleted: "${data.task.title}" - Reason: ${data.reason}`
        };

        this.logEvent(logEntry);
        this.updateAnalytics('task_deleted', data);

        console.log(`🗑️ Task Deleted: ${data.task.id} - "${data.task.title}"`);
    }

    /**
     * Handle hierarchy changed event
     */
    handleHierarchyChanged(data) {
        const logEntry = {
            type: 'HIERARCHY_CHANGED',
            taskId: data.taskId,
            previousParent: data.previousParent,
            currentParent: data.currentParent,
            previousChildren: data.previousChildren,
            currentChildren: data.currentChildren,
            timestamp: data.timestamp,
            message: `Hierarchy changed for task: ${data.taskId}`
        };

        this.logEvent(logEntry);
        this.updateAnalytics('hierarchy_changed', data);

        console.log(`🔄 Hierarchy Changed: ${data.taskId} - Parent: ${data.previousParent} → ${data.currentParent}`);
    }

    /**
     * Check if task completion enables other tasks
     */
    checkEnabledTasks(completedTask) {
        try {
            const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            const allTasks = this.getAllTasks(tasksData);
            
            const enabledTasks = allTasks.filter(task => 
                task.dependencies.includes(completedTask.id) && 
                task.status === 'pending'
            );

            enabledTasks.forEach(task => {
                this.logEvent({
                    type: 'TASK_ENABLED',
                    taskId: task.id,
                    taskTitle: task.title,
                    enabledBy: completedTask.id,
                    message: `Task "${task.title}" is now enabled by completion of "${completedTask.title}"`
                });

                console.log(`🔓 Task Enabled: ${task.id} - "${task.title}" (enabled by ${completedTask.id})`);
            });

        } catch (error) {
            this.logError('Error checking enabled tasks', error);
        }
    }

    /**
     * Get all tasks from the data structure
     */
    getAllTasks(tasksData) {
        return [
            ...tasksData.epics,
            ...tasksData.tasks,
            ...tasksData.subtasks
        ];
    }

    /**
     * Check if a task has changed
     */
    hasTaskChanged(previous, current) {
        const fieldsToCheck = [
            'status', 'priority', 'progress', 'assignee', 'dueDate',
            'estimatedHours', 'actualHours', 'parent', 'children',
            'dependencies', 'description', 'title'
        ];

        return fieldsToCheck.some(field => {
            if (Array.isArray(previous[field]) && Array.isArray(current[field])) {
                return JSON.stringify(previous[field]) !== JSON.stringify(current[field]);
            }
            return previous[field] !== current[field];
        });
    }

    /**
     * Get specific changes between tasks
     */
    getTaskChanges(previous, current) {
        const changes = {};
        const fieldsToCheck = [
            'status', 'priority', 'progress', 'assignee', 'dueDate',
            'estimatedHours', 'actualHours', 'parent', 'children',
            'dependencies', 'description', 'title'
        ];

        fieldsToCheck.forEach(field => {
            if (Array.isArray(previous[field]) && Array.isArray(current[field])) {
                if (JSON.stringify(previous[field]) !== JSON.stringify(current[field])) {
                    changes[field] = {
                        from: previous[field],
                        to: current[field]
                    };
                }
            } else if (previous[field] !== current[field]) {
                changes[field] = {
                    from: previous[field],
                    to: current[field]
                };
            }
        });

        return changes;
    }

    /**
     * Calculate task efficiency
     */
    calculateEfficiency(task) {
        if (!task.estimatedHours || !task.actualHours) {
            return null;
        }
        
        const efficiency = (task.estimatedHours / task.actualHours) * 100;
        return Math.round(efficiency * 100) / 100;
    }

    /**
     * Log an event
     */
    logEvent(event) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            sessionId: this.sessionId,
            ...event
        };

        // Write to session log
        this.writeLog('session', logEntry);
        
        // Write to daily log
        this.writeLog('daily', logEntry);
    }

    /**
     * Log an error
     */
    logError(message, error) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: 'ERROR',
            message: message,
            error: error.message,
            stack: error.stack
        };

        this.writeLog('errors', errorEntry);
        console.error(`❌ Error: ${message}`, error);
    }

    /**
     * Write to log file
     */
    writeLog(logType, data) {
        try {
            const logFile = this.logFiles[logType];
            const logLine = JSON.stringify(data) + '\n';
            
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error(`Failed to write to ${logType} log:`, error);
        }
    }

    /**
     * Update analytics data
     */
    updateAnalytics(eventType, data) {
        try {
            let analytics = {};
            
            if (fs.existsSync(this.logFiles.analytics)) {
                analytics = JSON.parse(fs.readFileSync(this.logFiles.analytics, 'utf8'));
            }

            if (!analytics.events) {
                analytics.events = {};
            }

            if (!analytics.events[eventType]) {
                analytics.events[eventType] = 0;
            }

            analytics.events[eventType]++;
            analytics.lastUpdated = new Date().toISOString();

            // Add specific analytics based on event type
            if (eventType === 'task_completed') {
                if (!analytics.completionStats) {
                    analytics.completionStats = {
                        totalCompleted: 0,
                        averageEfficiency: 0,
                        efficiencySum: 0
                    };
                }
                
                analytics.completionStats.totalCompleted++;
                if (data.efficiency) {
                    analytics.completionStats.efficiencySum += data.efficiency;
                    analytics.completionStats.averageEfficiency = 
                        analytics.completionStats.efficiencySum / analytics.completionStats.totalCompleted;
                }
            }

            fs.writeFileSync(this.logFiles.analytics, JSON.stringify(analytics, null, 2));
        } catch (error) {
            this.logError('Error updating analytics', error);
        }
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            sessionId: this.sessionId,
            tasksFile: this.tasksFile,
            logsDir: this.logsDir,
            logFiles: this.logFiles
        };
    }

    /**
     * Get analytics summary
     */
    getAnalytics() {
        try {
            if (fs.existsSync(this.logFiles.analytics)) {
                return JSON.parse(fs.readFileSync(this.logFiles.analytics, 'utf8'));
            }
            return null;
        } catch (error) {
            this.logError('Error reading analytics', error);
            return null;
        }
    }

    /**
     * Manual task logging methods
     */
    
    /**
     * Manually log a new nested task
     */
    logNestedTaskAdded(taskData) {
        this.emit('task_added', {
            task: taskData,
            timestamp: new Date().toISOString(),
            parentId: taskData.parent,
            level: taskData.level,
            type: taskData.type
        });
    }

    /**
     * Manually log a task completion
     */
    logTaskCompleted(taskData, actualHours = null) {
        const updatedTask = { ...taskData };
        if (actualHours) {
            updatedTask.actualHours = actualHours;
        }
        updatedTask.status = 'completed';
        updatedTask.completedAt = new Date().toISOString();

        this.emit('task_completed', {
            task: updatedTask,
            previousStatus: taskData.status,
            completedAt: updatedTask.completedAt,
            estimatedHours: updatedTask.estimatedHours,
            actualHours: updatedTask.actualHours,
            efficiency: this.calculateEfficiency(updatedTask)
        });
    }

    /**
     * Manually log a task update
     */
    logTaskUpdated(previousTask, updatedTask) {
        this.emit('task_updated', {
            taskId: updatedTask.id,
            previous: previousTask,
            current: updatedTask,
            changes: this.getTaskChanges(previousTask, updatedTask),
            timestamp: new Date().toISOString()
        });
    }
}

// CLI execution
if (require.main === module) {
    const command = process.argv[2] || 'start';
    const monitor = new NestedTaskMonitor();
    
    switch (command.toLowerCase()) {
        case 'start':
            monitor.startMonitoring();
            
            // Keep process alive
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping task monitor...');
                monitor.stopMonitoring();
                process.exit(0);
            });
            
            // Prevent process from exiting
            setInterval(() => {}, 1000);
            break;
            
        case 'stop':
            monitor.stopMonitoring();
            break;
            
        case 'status':
            console.log('📊 Task Monitor Status:');
            console.log(JSON.stringify(monitor.getStatus(), null, 2));
            break;
            
        case 'analytics':
            console.log('📈 Task Analytics:');
            const analytics = monitor.getAnalytics();
            if (analytics) {
                console.log(JSON.stringify(analytics, null, 2));
            } else {
                console.log('No analytics data available');
            }
            break;
            
        default:
            console.log('❌ Unknown command:', command);
            console.log('Available commands: start, stop, status, analytics');
    }
}

module.exports = NestedTaskMonitor; 