# 🎯 Cursor MCP Task Management Rules

**Comprehensive rule system for automatic intelligent task management integration in Cursor IDE**

## 📋 Overview

This directory contains a complete set of rules that enable Cursor IDE to automatically integrate with the AAI System Enhanced MCP server for intelligent task management. These rules transform your development workflow by automatically creating, updating, and managing tasks based on your coding activities.

## 📁 Rule Files Structure

### Core Rule Files

| File | Purpose | Description |
|------|---------|-------------|
| **[MCP_TASK_MANAGEMENT_RULES.md](./MCP_TASK_MANAGEMENT_RULES.md)** | Core MCP Integration | 20 fundamental rules for MCP tool usage and task management |
| **[WORKFLOW_AUTOMATION_RULES.md](./WORKFLOW_AUTOMATION_RULES.md)** | Workflow Integration | 11 workflow-specific rules for development process automation |
| **[CURSOR_MCP_CONFIG.md](./CURSOR_MCP_CONFIG.md)** | Configuration | Complete Cursor configuration for MCP integration |

### Supporting Files

| File | Purpose |
|------|---------|
| `README.md` | This file - main documentation and index |
| `agents/` | AAI System Enhanced MCP server implementation |

## 🚀 Quick Start

### 1. Enable MCP Integration

Add to your Cursor `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["start"],
        "cwd": ".cursor/rules/agents",
        "env": { "AAI_MODE": "mcp" }
      }
    }
  }
}
```

### 2. Activate Automatic Rules

Add to your workspace settings:

```json
{
  "aai.mcp.enabled": true,
  "aai.taskManagement.autoCreate": true,
  "aai.taskManagement.autoUpdate": true,
  "aai.workflow.automation": true
}
```

### 3. Start Working

The rules will automatically activate when you:
- Create new files
- Start new branches
- Make commits
- Work on complex code
- And much more!

## 🔧 Rule Categories

### 🎯 Core MCP Integration Rules (20 Rules)

**File**: `MCP_TASK_MANAGEMENT_RULES.md`

#### Task Management (Rules 1-5)
- **Rule 1**: Automatic task creation for new files/features
- **Rule 2**: Task progress updates on code changes
- **Rule 3**: Complexity analysis for large files
- **Rule 4**: Task decomposition for complex features
- **Rule 5**: Priority recalculation based on context

#### Workflow Integration (Rules 6-9)
- **Rule 6**: Project startup workflow
- **Rule 7**: Feature development workflow
- **Rule 8**: Bug fix workflow
- **Rule 9**: Code review workflow

#### Context-Aware Rules (Rules 10-12)
- **Rule 10**: File type specific task handling
- **Rule 11**: Git integration for task updates
- **Rule 12**: Time-based task maintenance

#### Automation Rules (Rules 13-15)
- **Rule 13**: Smart task creation from code comments
- **Rule 14**: Dependency tracking and management
- **Rule 15**: Automatic progress tracking

#### System Rules (Rules 16-20)
- **Rule 16**: MCP server health monitoring
- **Rule 17**: Error handling and recovery
- **Rule 18**: Performance optimization
- **Rule 19**: Development metrics collection
- **Rule 20**: Continuous improvement analysis

### 🔄 Workflow Automation Rules (11 Workflows)

**File**: `WORKFLOW_AUTOMATION_RULES.md`

#### Development Workflows (1-4)
- **Workflow 1**: New feature development automation
- **Workflow 2**: Bug fix process automation
- **Workflow 3**: Code refactoring workflow
- **Workflow 4**: Testing implementation workflow

#### Documentation Workflow (5)
- **Workflow 5**: Documentation update automation

#### Git Integration Workflows (6-7)
- **Workflow 6**: Commit-based task updates
- **Workflow 7**: Pull request workflow automation

#### Time-Based Workflows (8-9)
- **Workflow 8**: Daily standup preparation
- **Workflow 9**: Weekly sprint planning

#### Context-Aware Workflows (10-11)
- **Workflow 10**: File-based context rules
- **Workflow 11**: Project context switching

## 🎯 How Rules Work

### Trigger-Based Activation

Rules are automatically triggered by:

```typescript
// File Events
onFileCreate() → Rule 1 (Automatic Task Creation)
onFileModify() → Rule 2 (Task Progress Updates)
onFileOpen() → Workflow 10 (File Context)

// Git Events
onBranchCreate() → Workflow 1 (Feature Development)
onCommit() → Workflow 6 (Commit Updates)
onPullRequest() → Workflow 7 (PR Workflow)

// Time Events
daily(09:00) → Workflow 8 (Daily Standup)
weekly(monday, 10:00) → Workflow 9 (Sprint Planning)

// Code Events
onComplexityDetected() → Rule 3 (Complexity Analysis)
onTodoComment() → Rule 13 (Smart Task Creation)
```

### MCP Tool Integration

Each rule uses specific MCP tools:

| Rule Type | Primary MCP Tools |
|-----------|-------------------|
| Task Creation | `create_task`, `decompose_task` |
| Task Updates | `update_task`, `calculate_priority` |
| Analysis | `analyze_complexity`, `get_system_status` |
| Management | `list_tasks`, `delete_task` |

## 📊 Available MCP Tools

### 🛠️ Task Management Tools
- `create_task` - Create new tasks with intelligent defaults
- `update_task` - Update existing tasks with validation
- `get_task` - Retrieve detailed task information
- `list_tasks` - Query tasks with filtering and pagination
- `delete_task` - Remove tasks safely

### 🧠 AI-Powered Tools
- `decompose_task` - Break down complex tasks using AI
- `analyze_complexity` - Analyze task complexity and provide insights
- `calculate_priority` - Dynamic priority calculation

### 📊 System Tools
- `get_system_status` - Get real-time system health and metrics

### 📚 Resources
- `task://{taskId}` - Direct task data access
- `project://{projectId}/tasks` - Project-specific task collections

### 💡 Prompts
- `task-analysis` - Comprehensive task analysis template
- `priority-assessment` - Multi-task prioritization template

## 🎯 Usage Examples

### Example 1: Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Rules automatically trigger:
# - Workflow 1: Feature Development
# - Rule 1: Automatic Task Creation
# - Rule 4: Task Decomposition

# 3. Result: Complete task hierarchy created automatically
```

### Example 2: Working on Complex Code

```typescript
// 1. Open large file (>200 lines)
// 2. Rule 3 triggers: Complexity Analysis
// 3. Rule 10 triggers: File Type Specific Rules
// 4. Result: Task created with complexity assessment
```

### Example 3: Daily Development Workflow

```bash
# 9:00 AM - Workflow 8 triggers automatically:
# - Get yesterday's completed tasks
# - List today's planned tasks
# - Recalculate priorities
# - Generate standup report
```

## 🔧 Configuration Options

### Basic Configuration

```json
{
  "aai.mcp.enabled": true,
  "aai.taskManagement.autoCreate": true,
  "aai.taskManagement.autoUpdate": true,
  "aai.workflow.automation": true
}
```

### Advanced Configuration

```json
{
  "aai.rules.complexityThreshold": 200,
  "aai.rules.autoEstimation": true,
  "aai.rules.dailyStandupTime": "09:00",
  "aai.rules.weeklyPlanningDay": "monday"
}
```

### Project-Specific Settings

```json
{
  "aai.project.id": "web-app-v2",
  "aai.project.taskPrefix": "WEB",
  "aai.project.defaultPriority": "high",
  "aai.project.technologies": ["react", "typescript"]
}
```

## 📈 Benefits

### 🚀 Automatic Task Management
- **Zero Manual Effort**: Tasks created and updated automatically
- **Intelligent Prioritization**: AI-powered priority calculation
- **Context Awareness**: Rules adapt to your coding context

### 🧠 AI-Powered Insights
- **Complexity Analysis**: Automatic code complexity assessment
- **Task Decomposition**: AI breaks down complex features
- **Predictive Planning**: Smart estimation and planning

### 🔄 Workflow Integration
- **Git Integration**: Seamless integration with Git workflows
- **Time Management**: Automatic time tracking and reporting
- **Team Coordination**: Automated standup and planning reports

### 📊 Analytics and Monitoring
- **Performance Metrics**: Track development productivity
- **Health Monitoring**: System health and performance tracking
- **Continuous Improvement**: Learn and optimize over time

## 🐛 Troubleshooting

### Common Issues

#### MCP Server Not Starting
```bash
# Check MCP server status
cd .cursor/rules/agents
AAI_MODE=mcp npm start
```

#### Rules Not Triggering
```json
// Verify configuration in settings.json
{
  "aai.mcp.enabled": true,
  "aai.workflow.automation": true
}
```

#### Task Creation Issues
```typescript
// Check project configuration
{
  "aai.project.id": "your-project-id"
}
```

### Debug Mode

Enable debug logging:

```json
{
  "aai.logging.level": "debug",
  "aai.mcp.logging.enabled": true
}
```

## 📚 Documentation

### Complete Guides
- **[Integration Guide](../agents/docs/CURSOR_MCP_INTEGRATION.md)** - Full setup and usage guide
- **[Quick Reference](../agents/docs/QUICK_REFERENCE.md)** - Fast reference for daily use

### Rule Documentation
- **[MCP Task Management Rules](./MCP_TASK_MANAGEMENT_RULES.md)** - Core integration rules
- **[Workflow Automation Rules](./WORKFLOW_AUTOMATION_RULES.md)** - Workflow-specific rules
- **[Configuration Guide](./CURSOR_MCP_CONFIG.md)** - Complete configuration reference

## 🎉 Getting Started

1. **Setup MCP Server**: Follow the [integration guide](../agents/docs/CURSOR_MCP_INTEGRATION.md)
2. **Configure Cursor**: Add MCP server to your settings
3. **Enable Rules**: Activate automatic task management
4. **Start Coding**: Rules will automatically manage your tasks!

---

**Transform your development workflow with intelligent, automatic task management powered by AI and seamlessly integrated into Cursor IDE.**

## 🔗 Quick Links

- 🚀 **[Quick Setup](../agents/scripts/quick-setup.sh)** - Automated setup script
- 📖 **[Full Documentation](../agents/README.md)** - Complete system documentation
- 🛠️ **[MCP Tools Reference](../agents/docs/QUICK_REFERENCE.md#available-mcp-tools)** - Tool usage guide
- ⚙️ **[Configuration Examples](./CURSOR_MCP_CONFIG.md#core-configuration)** - Setup examples 