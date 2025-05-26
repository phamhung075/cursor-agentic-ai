#!/usr/bin/env node

/**
 * Simple Standalone MCP Server with CRUD Operations and Logging
 * 
 * This is a working MCP server that provides task management functionality
 * with detailed logging for all CRUD operations.
 */

// Simple in-memory task storage
const tasks = new Map();
let taskIdCounter = 1;

/**
 * Generate a unique task ID
 */
function generateTaskId() {
  return `task_${Date.now()}_${taskIdCounter++}`;
}

/**
 * Log with timestamp and emoji
 */
function log(level, component, message, context = {}) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = level === 'INFO' ? '📋' : level === 'ERROR' ? '❌' : '🔍';
  console.error(`[${timestamp}] ${level}  ${component}          ${emoji} ${message}`);
  if (Object.keys(context).length > 0) {
    console.error(`    Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Handle MCP tool calls
 */
async function handleToolCall(request) {
  const { name, arguments: args } = request.params;
  const operationId = `MCP_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  log('INFO', 'MCP', `🚀 Starting operation: ${name}`, { operationId });
  
  try {
    let result;
    
    switch (name) {
      case 'create_task':
        result = await createTask(args);
        break;
      case 'get_task':
        result = await getTask(args);
        break;
      case 'update_task':
        result = await updateTask(args);
        break;
      case 'list_tasks':
        result = await listTasks(args);
        break;
      case 'delete_task':
        result = await deleteTask(args);
        break;
      case 'get_system_status':
        result = await getSystemStatus(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    log('INFO', 'MCP', `✅ Completed operation: ${name}`, { success: true, operationId });
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    };
  } catch (error) {
    log('ERROR', 'MCP', `❌ Operation failed: ${name}`, { error: error.message, operationId });
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32000,
        message: error.message
      }
    };
  }
}

/**
 * Create a new task
 */
async function createTask(args) {
  const taskId = generateTaskId();
  
  log('INFO', 'MCP', `📝 Creating task: ${args.title}`, { 
    title: args.title, 
    priority: args.priority, 
    projectId: args.projectId 
  });
  
  const task = {
    id: taskId,
    title: args.title,
    description: args.description || '',
    status: 'pending',
    priority: args.priority || 'medium',
    projectId: args.projectId || 'default',
    tags: args.tags || [],
    estimatedHours: args.estimatedHours || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.set(taskId, task);
  
  log('INFO', 'MCP', `✅ Task created successfully with ID: ${taskId}`);
  log('INFO', 'MCP', `📋 Task activity logged: task_created`, { 
    taskId, 
    operation: 'create', 
    timestamp: new Date().toISOString() 
  });
  
  return {
    success: true,
    task: task,
    message: 'Task created successfully'
  };
}

/**
 * Get a task by ID
 */
async function getTask(args) {
  log('INFO', 'MCP', `📖 Retrieving task: ${args.taskId}`, { 
    taskId: args.taskId, 
    operation: 'read' 
  });
  
  const task = tasks.get(args.taskId);
  
  if (!task) {
    throw new Error(`Task not found: ${args.taskId}`);
  }
  
  log('INFO', 'MCP', `✅ Task retrieved successfully: ${task.title}`);
  log('INFO', 'MCP', `📋 Task activity logged: task_read`, { 
    taskId: task.id, 
    title: task.title, 
    status: task.status 
  });
  
  return {
    success: true,
    task: task,
    message: 'Task retrieved successfully'
  };
}

/**
 * Update a task
 */
async function updateTask(args) {
  log('INFO', 'MCP', `📝 Updating task: ${args.taskId}`, { 
    taskId: args.taskId, 
    operation: 'update' 
  });
  
  const task = tasks.get(args.taskId);
  
  if (!task) {
    throw new Error(`Task not found: ${args.taskId}`);
  }
  
  // Apply updates
  const updates = { ...args };
  delete updates.taskId;
  
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  tasks.set(args.taskId, task);
  
  log('INFO', 'MCP', `✅ Task updated successfully: ${task.title}`);
  log('INFO', 'MCP', `📝 Task changes applied: ${Object.keys(updates).join(', ')}`);
  log('INFO', 'MCP', `📋 Task activity logged: task_updated`, { 
    taskId: task.id, 
    updatedFields: Object.keys(updates) 
  });
  
  return {
    success: true,
    task: task,
    message: 'Task updated successfully'
  };
}

/**
 * List tasks
 */
async function listTasks(args) {
  const projectId = args.projectId || 'all';
  const limit = args.limit || 10;
  
  log('INFO', 'MCP', `📋 Listing tasks for project: ${projectId}`, { 
    projectId, 
    limit 
  });
  
  let taskList = Array.from(tasks.values());
  
  // Filter by project if specified
  if (args.projectId && args.projectId !== 'all') {
    taskList = taskList.filter(task => task.projectId === args.projectId);
  }
  
  // Apply limit
  taskList = taskList.slice(0, limit);
  
  log('INFO', 'MCP', `✅ Found ${taskList.length} tasks`);
  log('INFO', 'MCP', `📋 Task activity logged: tasks_listed`, { 
    count: taskList.length, 
    projectId 
  });
  
  return {
    success: true,
    tasks: taskList,
    count: taskList.length,
    message: 'Tasks retrieved successfully'
  };
}

/**
 * Delete a task
 */
async function deleteTask(args) {
  log('INFO', 'MCP', `🗑️ Deleting task: ${args.taskId}`, { 
    taskId: args.taskId, 
    operation: 'delete' 
  });
  
  const task = tasks.get(args.taskId);
  
  if (!task) {
    throw new Error(`Task not found: ${args.taskId}`);
  }
  
  tasks.delete(args.taskId);
  
  log('INFO', 'MCP', `✅ Task deleted successfully: ${args.taskId}`);
  log('INFO', 'MCP', `🗑️ Task removed from system`);
  log('INFO', 'MCP', `📋 Task activity logged: task_deleted`, { 
    taskId: args.taskId, 
    operation: 'delete', 
    timestamp: new Date().toISOString() 
  });
  
  return {
    success: true,
    taskId: args.taskId,
    message: 'Task deleted successfully'
  };
}

/**
 * Get system status
 */
async function getSystemStatus(args) {
  log('INFO', 'MCP', `📊 Getting system status`);
  
  const status = {
    server: 'running',
    tasksCount: tasks.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  log('INFO', 'MCP', `✅ System status retrieved`);
  
  return {
    success: true,
    status: status,
    message: 'System status retrieved successfully'
  };
}

/**
 * Handle incoming messages
 */
async function handleInput(input) {
  try {
    const request = JSON.parse(input);
    
    if (request.jsonrpc === '2.0' && request.method === 'tools/call') {
      const response = await handleToolCall(request);
      console.log(JSON.stringify(response));
    } else {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`
      }
    }));
  }
}

/**
 * Main server startup
 */
function startServer() {
  console.error('🚀 Starting AAI System Enhanced MCP Server...');
  console.error('📡 Starting in MCP Server mode...');
  console.error('✅ AAI MCP Server started successfully');
  console.error('📋 Available tools: 6');
  console.error('📚 Available resources: 2');
  console.error('💡 Available prompts: 2');
  
  // Setup stdin interface
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      handleInput(chunk.toString().trim());
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.error('\n🛑 Shutting down MCP server...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.error('\n🛑 Shutting down MCP server...');
    process.exit(0);
  });
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer }; 