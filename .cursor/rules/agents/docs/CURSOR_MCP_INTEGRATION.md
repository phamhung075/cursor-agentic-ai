# 🎯 Cursor IDE Integration Guide for AAI System Enhanced MCP Server

**Complete guide for integrating the AAI System Enhanced MCP server with Cursor IDE for intelligent task management and AI-powered development workflows.**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Cursor Configuration](#cursor-configuration)
5. [Available MCP Tools](#available-mcp-tools)
6. [Usage Examples](#usage-examples)
7. [Advanced Configuration](#advanced-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## 🌟 Overview

The AAI System Enhanced MCP server provides Cursor IDE with intelligent task management capabilities through the Model Context Protocol (MCP). This integration enables:

- **AI-powered task creation and management**
- **Intelligent task decomposition and analysis**
- **Dynamic priority calculation**
- **Automated workflow optimization**
- **Real-time project insights**
- **Context-aware development assistance**

## 🔧 Prerequisites

### System Requirements
- **Node.js** 18+ 
- **npm** or **yarn**
- **Cursor IDE** with MCP support
- **TypeScript** (for development)

### AAI System Setup
```bash
# Clone and setup AAI System Enhanced
cd .cursor/rules/agents
npm install
npm run build
```

## 🚀 Installation & Setup

### 1. Verify MCP Server

First, ensure the MCP server is working:

```bash
# Test MCP server startup
cd .cursor/rules/agents
AAI_MODE=mcp npm start
```

You should see:
```
🚀 Starting AAI System Enhanced in MCP mode...
[INFO] MCP          🚀 AAI MCP Server started successfully
[INFO] MCP          📋 Available tools: 9
[INFO] MCP          📚 Available resources: 2
[INFO] MCP          💡 Available prompts: 2
```

### 2. Create MCP Configuration

Create a configuration file for Cursor:

```bash
# Create MCP config directory
mkdir -p ~/.cursor/mcp

# Create configuration file
touch ~/.cursor/mcp/aai-config.json
```

## ⚙️ Cursor Configuration

### 1. MCP Server Configuration

Add the AAI MCP server to your Cursor settings. Open Cursor settings and add:

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["start"],
        "cwd": "/path/to/your/project/.cursor/rules/agents",
        "env": {
          "AAI_MODE": "mcp"
        },
        "description": "AAI System Enhanced - Intelligent Task Management",
        "capabilities": {
          "tools": true,
          "resources": true,
          "prompts": true
        }
      }
    }
  }
}
```

### 2. Alternative Configuration (Direct Node)

For more control, you can run the server directly:

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "node",
        "args": ["dist/index.js", "mcp"],
        "cwd": "/path/to/your/project/.cursor/rules/agents",
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

### 3. Development Configuration

For development with auto-reload:

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced-dev": {
        "command": "npm",
        "args": ["run", "dev"],
        "cwd": "/path/to/your/project/.cursor/rules/agents",
        "env": {
          "AAI_MODE": "mcp",
          "NODE_ENV": "development"
        }
      }
    }
  }
}
```

## 🛠️ Available MCP Tools

### Task Management Tools

#### 1. `create_task`
Create new tasks with intelligent defaults.

**Parameters:**
- `title` (string): Task title
- `description` (string): Task description
- `priority` (enum): low, medium, high, urgent
- `projectId` (string): Project identifier
- `parentId` (string, optional): Parent task ID
- `tags` (array): Task tags
- `estimatedHours` (number): Time estimate
- `dueDate` (string): ISO date string

#### 2. `update_task`
Update existing tasks with validation.

#### 3. `get_task`
Retrieve detailed task information.

#### 4. `list_tasks`
Query tasks with filtering and pagination.

#### 5. `delete_task`
Remove tasks safely.

### AI-Powered Tools

#### 6. `decompose_task`
Break down complex tasks using AI.

**Parameters:**
- `taskId` (string): Task to decompose
- `maxDepth` (number): Decomposition depth (default: 3)
- `includeEstimates` (boolean): Include time estimates
- `analysisType` (enum): basic, detailed, comprehensive

#### 7. `analyze_complexity`
Analyze task complexity and provide insights.

#### 8. `calculate_priority`
Dynamic priority calculation based on multiple factors.

### System Tools

#### 9. `get_system_status`
Get real-time system health and metrics.

## 💡 Usage Examples

### Example 1: Create a Development Task

```typescript
// In Cursor, use the MCP tool
await mcp.call('create_task', {
  title: 'Implement user authentication',
  description: 'Add JWT-based authentication with login/logout functionality',
  priority: 'high',
  projectId: 'web-app-v2',
  tags: ['authentication', 'security', 'backend'],
  estimatedHours: 8,
  dueDate: '2024-02-15T00:00:00Z'
});
```

### Example 2: Decompose Complex Task

```typescript
// Break down a complex feature into subtasks
await mcp.call('decompose_task', {
  taskId: 'task-123',
  maxDepth: 3,
  includeEstimates: true,
  analysisType: 'comprehensive'
});
```

### Example 3: Analyze Code Complexity

```typescript
// Analyze complexity of a new feature
await mcp.call('analyze_complexity', {
  taskDescription: 'Implement real-time chat with WebSocket support',
  context: 'Node.js backend with React frontend',
  includeRecommendations: true
});
```

### Example 4: Get Project Overview

```typescript
// Get current project status
await mcp.call('list_tasks', {
  projectId: 'current-project',
  status: 'in_progress',
  limit: 10
});
```

## 🎯 Cursor IDE Integration Patterns

### 1. Context-Aware Task Creation

Use Cursor's context to automatically create relevant tasks:

```typescript
// When working on a specific file
const currentFile = cursor.getCurrentFile();
const taskContext = `Working on ${currentFile.path}`;

await mcp.call('create_task', {
  title: `Refactor ${currentFile.name}`,
  description: `Improve code quality and performance in ${currentFile.path}`,
  context: taskContext,
  priority: 'medium'
});
```

### 2. AI-Powered Code Analysis

Integrate task analysis with code review:

```typescript
// Analyze complexity of current code changes
const codeChanges = cursor.getSelectedText();
await mcp.call('analyze_complexity', {
  taskDescription: `Review and optimize: ${codeChanges}`,
  context: 'Code refactoring task',
  includeRecommendations: true
});
```

### 3. Automated Project Planning

Use MCP for sprint planning:

```typescript
// Get all pending tasks and analyze priorities
const pendingTasks = await mcp.call('list_tasks', {
  status: 'pending',
  limit: 50
});

// Calculate priorities for sprint planning
for (const task of pendingTasks.tasks) {
  await mcp.call('calculate_priority', {
    taskId: task.id,
    factors: {
      urgency: 7,
      importance: 8,
      effort: 5,
      dependencies: 3
    }
  });
}
```

## 🔧 Advanced Configuration

### Environment Variables

Configure the MCP server behavior:

```bash
# .env file in .cursor/rules/agents/
AAI_MODE=mcp
PORT=3000
HOST=localhost
LOG_LEVEL=info
ENABLE_ANALYTICS=true
ENABLE_LEARNING=true
```

### Custom MCP Server Script

Create a custom startup script:

```bash
#!/bin/bash
# scripts/start-mcp.sh

cd "$(dirname "$0")/../.cursor/rules/agents"

# Set environment
export AAI_MODE=mcp
export NODE_ENV=production

# Start MCP server
npm start
```

### Cursor Workspace Settings

Add to `.vscode/settings.json` (Cursor uses similar format):

```json
{
  "aai.mcp.enabled": true,
  "aai.mcp.autoStart": true,
  "aai.mcp.logLevel": "info",
  "aai.taskManagement.enabled": true,
  "aai.aiDecomposition.enabled": true,
  "aai.priorityManagement.enabled": true
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MCP Server Won't Start

```bash
# Check if port is available
lsof -i :3000

# Check logs
cd .cursor/rules/agents
npm run build
AAI_MODE=mcp npm start
```

#### 2. Cursor Can't Connect to MCP

- Verify the `cwd` path in Cursor settings
- Check environment variables
- Ensure npm dependencies are installed
- Verify Node.js version (18+)

#### 3. Tools Not Available

```bash
# Verify MCP server is exposing tools
echo '{"type": "ping"}' | AAI_MODE=mcp npm start
```

#### 4. Permission Issues

```bash
# Fix permissions
chmod +x scripts/start-mcp.sh
npm audit fix
```

### Debug Mode

Enable debug logging:

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["start"],
        "cwd": "/path/to/project/.cursor/rules/agents",
        "env": {
          "AAI_MODE": "mcp",
          "DEBUG": "true",
          "LOG_LEVEL": "debug"
        }
      }
    }
  }
}
```

## ✨ Best Practices

### 1. Task Organization

- Use consistent project IDs
- Apply meaningful tags
- Set realistic time estimates
- Maintain task hierarchies

### 2. AI Integration

- Provide detailed task descriptions for better AI analysis
- Use context information effectively
- Leverage decomposition for complex features
- Regular priority recalculation

### 3. Development Workflow

```typescript
// Recommended workflow pattern
async function developmentWorkflow() {
  // 1. Create main feature task
  const mainTask = await mcp.call('create_task', {
    title: 'New Feature Implementation',
    description: 'Detailed feature description...',
    priority: 'high'
  });

  // 2. Decompose into subtasks
  const decomposition = await mcp.call('decompose_task', {
    taskId: mainTask.id,
    analysisType: 'comprehensive'
  });

  // 3. Calculate priorities
  for (const subtask of decomposition.subtasks) {
    await mcp.call('calculate_priority', {
      taskId: subtask.id
    });
  }

  // 4. Track progress
  await mcp.call('get_system_status', {
    includeMetrics: true
  });
}
```

### 4. Performance Optimization

- Use pagination for large task lists
- Cache frequently accessed data
- Batch operations when possible
- Monitor system metrics

## 📊 Monitoring & Analytics

### System Health Checks

```typescript
// Regular health monitoring
setInterval(async () => {
  const status = await mcp.call('get_system_status', {
    includeMetrics: true,
    includeHealth: true
  });
  
  console.log('System Status:', status);
}, 30000); // Every 30 seconds
```

### Performance Metrics

Track key metrics:
- Task creation rate
- Decomposition accuracy
- Priority calculation time
- System response time

## 🔗 Integration Examples

### GitHub Integration

```typescript
// Create tasks from GitHub issues
async function createTaskFromIssue(issue) {
  await mcp.call('create_task', {
    title: issue.title,
    description: issue.body,
    priority: issue.labels.includes('urgent') ? 'urgent' : 'medium',
    tags: issue.labels,
    projectId: issue.repository.name
  });
}
```

### Slack Integration

```typescript
// Create tasks from Slack messages
async function createTaskFromSlack(message) {
  await mcp.call('create_task', {
    title: `Follow up: ${message.text.substring(0, 50)}...`,
    description: message.text,
    priority: 'medium',
    tags: ['slack', 'communication']
  });
}
```

## 🎉 Conclusion

The AAI System Enhanced MCP server provides powerful task management capabilities directly within Cursor IDE. By following this guide, you can:

- ✅ Set up and configure the MCP server
- ✅ Integrate with Cursor IDE effectively
- ✅ Leverage AI-powered task management
- ✅ Optimize your development workflow
- ✅ Monitor and maintain system health

For additional support and advanced features, refer to the main [README.md](../README.md) and explore the [API documentation](./API_REFERENCE.md).

---

**Happy coding with intelligent task management! 🚀** 