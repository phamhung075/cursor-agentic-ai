# Cursor MCP Integration Guide

This guide explains how to integrate the AAI System Enhanced MCP server with Cursor IDE for advanced task management capabilities.

## 🚀 Quick Setup

1. **Update Cursor Settings**

   The `.cursor/settings.json` file has been configured with the MCP server settings:

   ```json
   {
     "mcp": {
       "servers": {
         "aai-system-enhanced": {
           "command": "npm",
           "args": ["run", "sse"],
           "cwd": ".cursor/rules/agents",
           "env": { 
             "AAI_MODE": "mcp",
             "NODE_ENV": "production",
             "STORAGE_TYPE": "sqlite",
             "SQLITE_DB_PATH": "./_store/tasks.db"
           },
           "transport": "stdio"
         }
       },
       "defaultServer": "aai-system-enhanced"
     },
     "aai": {
       "mcp": {
         "enabled": true,
         "autoConnect": true,
         "taskManagement": {
           "autoCreate": true,
           "autoUpdate": true,
           "autoAnalyze": true,
           "autoDecompose": true,
           "autoPrioritize": true
         },
         "workflow": {
           "automation": true,
           "gitIntegration": true,
           "timeBasedTriggers": true,
           "fileEventTriggers": true
         },
         "logging": {
           "enabled": true,
           "level": "info",
           "showInOutput": true
         }
       }
     }
   }
   ```

2. **Restart Cursor**

   Restart Cursor IDE to apply the settings.

3. **Verify Connection**

   Open Cursor and check that the MCP server is running by looking for the status indicator in the bottom status bar.

## 📋 Available MCP Tools

The MCP server provides a rich set of tools for task management:

### Core Task Operations

| Tool Name | Description | Required Parameters |
|-----------|-------------|---------------------|
| `create_task` | Create a new task | `title`, `description`, `priority` |
| `get_tasks` | Query and filter tasks | None |
| `update_task` | Modify an existing task | `taskId` |
| `delete_task` | Remove a task | `taskId` |
| `get_task_by_id` | Get detailed information for a task | `taskId` |

### Advanced Task Operations

| Tool Name | Description | Required Parameters |
|-----------|-------------|---------------------|
| `get_most_priority_task` | Get highest priority task | None |
| `get_subtasks` | Get all subtasks for a parent | `parentId` |
| `delete_all_tasks` | Remove all tasks | `confirm: true` |
| `delete_all_subtasks` | Remove all subtasks of a parent | `parentId`, `confirm: true` |
| `get_task_tree` | Get hierarchical task structure | `taskId` |

### Analysis and Management

| Tool Name | Description | Required Parameters |
|-----------|-------------|---------------------|
| `analyze_complexity` | Analyze task or code complexity | `description`, `context` |
| `decompose_task` | Break down a task into subtasks | `description`, `complexity` |
| `calculate_priority` | Calculate task priority based on multiple factors | `urgency`, `importance`, `effort` |
| `get_system_status` | Get system health information | None |

## 🔄 Workflow Automation Rules

The MCP server supports automated workflows for development processes:

### Development Workflows

- **Feature Development**: Automatically creates tasks when feature branches are created
- **Bug Fix Process**: Handles bug tracking from branch creation to resolution
- **Refactoring Process**: Analyzes code complexity before and after refactoring
- **Testing Implementation**: Creates and links test tasks to feature tasks

### Git Integration Workflows

- **Commit-Based Updates**: Updates task progress based on commit messages
- **Pull Request Workflow**: Manages tasks through PR creation, review, and merge

### Time-Based Workflows

- **Daily Standup**: Prepares task summaries every morning
- **Weekly Planning**: Helps decompose and prioritize tasks for the week

For full details, see the [Workflow Automation Rules](./.cursor/rules/WORKFLOW_AUTOMATION_RULES.mdc).

## 🔍 Available MCP Resources

The MCP server provides several resources that can be accessed:

| Resource URI | Description | MIME Type |
|--------------|-------------|-----------|
| `task://list` | List of all tasks | `application/json` |
| `task://statistics` | Task statistics and metrics | `application/json` |
| `task://tree` | Hierarchical task structure | `application/json` |
| `config://settings` | System configuration | `application/json` |
| `system://health` | System health status | `application/json` |
| `analytics://metrics` | Usage and performance metrics | `application/json` |

## 📝 Available MCP Prompts

The MCP server provides prompt templates for common task management scenarios:

| Prompt Name | Description | Required Arguments |
|-------------|-------------|-------------------|
| `analyze_task` | Analyze task details and insights | `task_id` |
| `task_breakdown` | Break down a task into subtasks | `task_id` |
| `generate_report` | Generate a task report | `type` |
| `task_status_update` | Document a task status change | `task_id`, `status` |
| `prioritization_analysis` | Analyze task priorities | None |
| `complexity_assessment` | Assess code complexity | `file_path` |
| `feature_planning` | Plan feature implementation | `feature_name` |

## 🛠️ Configuration Options

### Storage Options

The MCP server supports multiple storage backends:

#### SQLite (Default)

```json
{
  "env": { 
    "STORAGE_TYPE": "sqlite",
    "SQLITE_DB_PATH": "./_store/tasks.db"
  }
}
```

#### Supabase Cloud

```json
{
  "env": { 
    "STORAGE_TYPE": "supabase",
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_ANON_KEY": "your-anon-key"
  }
}
```

### Server Settings

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `PORT` | Server port | `3233` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Node environment | `production` |
| `AAI_MODE` | AAI system mode | `mcp` |

### Advanced Configuration

For advanced configuration options, including:

- Performance settings
- Error handling
- Security settings
- Analytics and monitoring
- UI integration

See the [Cursor MCP Configuration](./.cursor/rules/CURSOR_MCP_CONFIG.mdc) for complete details.

## 🔄 Starting and Stopping

The MCP server can be started and stopped manually:

```bash
# Start server
cd .cursor/rules/agents
npm run sse

# Check status
npm run sse:status

# Stop server
npm run sse:kill
```

## 🔍 Troubleshooting

### Server Not Starting

1. Check if the server is already running on port 3233
2. Ensure all dependencies are installed (`npm install`)
3. Check file permissions on the database path
4. Check the terminal output for error messages

### Connection Issues

1. Verify the port setting (3233 by default)
2. Check that no other application is using port 3233
3. Restart Cursor IDE
4. Check firewall settings

### Database Issues

1. Ensure the database directory exists and is writable
2. Check environment variables are set correctly
3. Try running migrations: `npm run db:migrate`

### Task Management Issues

1. Ensure MCP is enabled in settings (`aai.mcp.enabled: true`)
2. Check automation settings (`aai.taskManagement.autoCreate`, etc.)
3. Review logs for any error messages
4. Restart the MCP server if necessary

## 📚 Further Resources

- [AAI System Enhanced README](../README.md)
- [Centralized MCP Rules](./.cursor/rules/CENTRALIZED_MCP_RULES.mdc)
- [MCP Task Management Rules](./.cursor/rules/MCP_TASK_MANAGEMENT_RULES.mdc)
- [Workflow Automation Rules](./.cursor/rules/WORKFLOW_AUTOMATION_RULES.mdc)
- [Cursor MCP Configuration](./.cursor/rules/CURSOR_MCP_CONFIG.mdc)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Task Schema Documentation](./TASK_SCHEMA.md)

---

For additional support, please open an issue in the project repository. 