# 🚀 AAI System Enhanced - Quick Reference Card

**Fast reference for using AAI System Enhanced MCP server with Cursor IDE**

## 🎯 Quick Setup

```bash
# 1. Run the automated setup
./scripts/setup-cursor-mcp.sh

# 2. Add to Cursor settings.json:
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["run", "sse"],
        "cwd": "/path/to/your/project/.cursor/rules/agents",
        "env": { "AAI_MODE": "mcp" }
      }
    }
  }
}

# 3. Restart Cursor IDE
```

## 🛠️ Available MCP Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `create_task` | Create new tasks | `title`, `description`, `priority`, `projectId` |
| `update_task` | Update existing tasks | `taskId`, `title`, `status`, `priority` |
| `get_task` | Get task details | `taskId` |
| `list_tasks` | Query tasks | `projectId`, `status`, `priority`, `limit` |
| `delete_task` | Remove tasks | `taskId` |
| `decompose_task` | AI task breakdown | `taskId`, `maxDepth`, `analysisType` |
| `analyze_complexity` | Complexity analysis | `taskDescription`, `context` |
| `calculate_priority` | Priority calculation | `taskId`, `factors` |
| `get_system_status` | System health | `includeMetrics`, `includeHealth` |

## 📚 Resources

| Resource | Access Pattern | Description |
|----------|----------------|-------------|
| `task://{taskId}` | Direct task access | Get task data as JSON |
| `project://{projectId}/tasks` | Project tasks | All tasks in a project |

## 💡 Prompts

| Prompt | Purpose | Parameters |
|--------|---------|------------|
| `task-analysis` | Comprehensive task analysis | `taskDescription`, `context` |
| `priority-assessment` | Multi-task prioritization | `tasks` (JSON array) |

## ⚡ Quick Commands

### Start MCP Server
```bash
# Production
AAI_MODE=mcp npm run sse

# Development
AAI_MODE=mcp npm run sse

# Using scripts
./scripts/start-mcp.sh
./scripts/start-mcp-dev.sh
```

### Test MCP Server
```bash
# Basic test
echo '{"type": "ping"}' | AAI_MODE=mcp npm run sse

# Health check
curl -s http://localhost:3233/health
```

## 🎯 Common Usage Patterns

### 1. Create Development Task
```typescript
await mcp.call('create_task', {
  title: 'Implement user authentication',
  description: 'Add JWT-based auth with login/logout',
  priority: 'high',
  projectId: 'web-app',
  tags: ['auth', 'security'],
  estimatedHours: 8
});
```

### 2. Break Down Complex Feature
```typescript
await mcp.call('decompose_task', {
  taskId: 'feature-123',
  maxDepth: 3,
  analysisType: 'comprehensive'
});
```

### 3. Get Project Status
```typescript
await mcp.call('list_tasks', {
  projectId: 'current-project',
  status: 'in_progress',
  limit: 10
});
```

### 4. Analyze Code Complexity
```typescript
await mcp.call('analyze_complexity', {
  taskDescription: 'Implement real-time chat',
  context: 'Node.js + React + WebSocket',
  includeRecommendations: true
});
```

## 🔧 Environment Variables

```bash
AAI_MODE=mcp          # Enable MCP mode
PORT=3000             # Server port
HOST=localhost        # Server host
LOG_LEVEL=info        # Logging level
NODE_ENV=production   # Environment
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP server won't start | Check Node.js version (18+), run `npm install` |
| Cursor can't connect | Verify `cwd` path in settings, check permissions |
| Tools not available | Restart Cursor, check MCP server logs |
| Permission errors | Run `chmod +x scripts/*.sh` |

## 📊 System Status

```typescript
// Check system health
const status = await mcp.call('get_system_status', {
  includeMetrics: true,
  includeHealth: true
});

console.log('Uptime:', status.uptime);
console.log('Tasks:', status.metrics.tasksProcessed);
console.log('Health:', status.health);
```

## 🔗 File Locations

```
.cursor/rules/agents/
├── docs/CURSOR_MCP_INTEGRATION.md  # Full integration guide
├── scripts/setup-cursor-mcp.sh     # Automated setup
├── scripts/start-mcp.sh            # Production startup
├── scripts/start-mcp-dev.sh        # Development startup
└── src/mcp/MCPServer.ts            # MCP server implementation

~/.cursor/mcp/
├── aai-config.json                 # MCP configuration
└── cursor-settings-template.json   # Settings template
```

## 🎉 Pro Tips

1. **Use consistent project IDs** for better organization
2. **Leverage AI decomposition** for complex features
3. **Set realistic time estimates** for better planning
4. **Use tags effectively** for filtering and search
5. **Monitor system status** regularly for health checks
6. **Batch operations** for better performance

---

**Need help?** Check the [full integration guide](./CURSOR_MCP_INTEGRATION.md) or [main README](../README.md)

# MCP Server Quick Reference

This is a quick reference guide for the MCP server tools and resources.

## Task Creation

```json
{
  "title": "New feature implementation",
  "description": "Implement the new feature X for project Y",
  "type": "feature",
  "level": 2,
  "status": "pending",
  "priority": "high",
  "complexity": "medium",
  "tags": ["feature", "frontend", "api"]
}
```

## Task Querying

```json
{
  "status": "pending",
  "priority": "high",
  "limit": 10,
  "sortBy": "priority",
  "sortOrder": "desc"
}
```

## Task Update

```json
{
  "id": "task_123",
  "status": "in-progress",
  "progress": 25,
  "assignee": "developer1"
}
```

## Task Tree Retrieval

```json
{
  "rootId": "epic_001",
  "depth": 2,
  "includeCompleted": false
}
```

## Task Deletion

```json
{
  "id": "task_123",
  "cascade": true,
  "reason": "Feature no longer needed"
}
```

## Get Most Priority Task

```json
{
  "status": "pending",
  "type": "bug"
}
```

## Get Subtasks

```json
{
  "parentId": "feat_123",
  "includeCompleted": false,
  "recursive": true
}
```

## Delete All Tasks

```json
{
  "confirm": true,
  "backupBeforeDelete": true,
  "auditReason": "System reset for new phase"
}
```

## Delete All Subtasks

```json
{
  "parentId": "epic_001",
  "confirm": true,
  "recursive": true,
  "onlyStatus": "completed"
}
```

## System Status

```json
{
  "includeMetrics": true,
  "format": "detailed"
}
```

## Starting MCP Server

```bash
# Start MCP server
npm run sse

# Check status
npm run sse:status

# Stop server
npm run sse:kill
```

## Cursor MCP Configuration

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["run", "sse"],
        "cwd": ".cursor/rules/agents",
        "env": { 
          "STORAGE_TYPE": "sqlite",
          "SQLITE_DB_PATH": "./_store/tasks.db"
        }
      }
    },
    "defaultServer": "aai-system-enhanced"
  }
}
``` 