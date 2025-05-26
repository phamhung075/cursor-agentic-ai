---
description: 
globs: 
alwaysApply: false
---
# 🎯 MCP Task Management Rules for Roo Code IDE

> **📝 UPDATE INSTRUCTIONS**: When modifying these rules, also update [CENTRALIZED_MCP_RULES.md](mdc:.roo/rules/CENTRALIZED_MCP_RULES.md), [WORKFLOW_AUTOMATION_RULES.md](mdc:.roo/rules/WORKFLOW_AUTOMATION_RULES.md), and [ROO CODE_MCP_CONFIG.md](mdc:.roo/rules/ROO CODE_MCP_CONFIG.md) to maintain consistency.

## 🚀 Core Task Management Rules (1-5)

### Rule 1: Automatic Task Creation
**Trigger**: File creation, TODO comments, branch creation
**MCP Tool**: `create_task`

```typescript
// When user creates a new file
onFileCreate(file) {
  if (file.extension in ['.ts', '.tsx', '.js', '.jsx', '.py', '.md']) {
    mcp.call('create_task', {
      title: `Work on ${file.name}`,
      description: `File created: ${file.path}`,
      projectId: workspace.name,
      priority: 'medium',
      tags: ['file-work', file.extension],
      estimatedHours: calculateEstimatedHours(file)
    });
  }
}

// When user writes TODO comments
onTodoComment(comment) {
  mcp.call('create_task', {
    title: comment.text,
    description: `TODO found in ${comment.file}:${comment.line}`,
    projectId: workspace.name,
    priority: 'low',
    tags: ['todo', 'comment'],
    context: { file: comment.file, line: comment.line }
  });
}
```

### Rule 2: Task Progress Updates
**Trigger**: File modifications, commits, time intervals
**MCP Tool**: `update_task`

```typescript
// When user modifies files
onFileModify(file) {
  if (file.hasActiveTask) {
    mcp.call('update_task', {
      taskId: file.activeTaskId,
      status: 'in_progress',
      updatedAt: new Date(),
      notes: `File modified: ${file.path}`,
      progress: calculateProgress(file)
    });
  }
}

// When user commits changes
onCommit(commit) {
  const taskId = extractTaskIdFromCommit(commit.message);
  if (taskId) {
    mcp.call('update_task', {
      taskId: taskId,
      status: 'in_progress',
      notes: `Commit: ${commit.message}`,
      progress: calculateCommitProgress(commit)
    });
  }
}
```

### Rule 3: Complexity Analysis
**Trigger**: Large files, complex tasks, user request
**MCP Tool**: `analyze_complexity`

```typescript
// When opening large files
onFileOpen(file) {
  if (file.lineCount > 200) {
    mcp.call('analyze_complexity', {
      description: `Analyze complexity of ${file.name}`,
      context: {
        fileSize: file.lineCount,
        filePath: file.path,
        fileType: file.extension,
        cyclomaticComplexity: calculateCyclomaticComplexity(file)
      }
    });
  }
}

// When creating complex tasks
onTaskCreate(task) {
  if (task.description.length > 500 || task.estimatedHours > 8) {
    mcp.call('analyze_complexity', {
      description: task.description,
      context: {
        taskType: task.type,
        estimatedHours: task.estimatedHours,
        dependencies: task.dependencies
      }
    });
  }
}
```

### Rule 4: Task Decomposition
**Trigger**: Complex tasks, feature branches, planning sessions
**MCP Tool**: `decompose_task`

```typescript
// When creating feature branches
onBranchCreate(branch) {
  if (branch.name.startsWith('feature/')) {
    mcp.call('decompose_task', {
      description: `Implement ${extractFeatureName(branch.name)}`,
      complexity: 'high',
      context: {
        branchName: branch.name,
        featureType: detectFeatureType(branch.name),
        estimatedComplexity: 'high'
      }
    });
  }
}

// When tasks are marked as complex
onComplexityAnalysis(result) {
  if (result.complexity === 'high') {
    mcp.call('decompose_task', {
      description: result.description,
      complexity: result.complexity,
      context: result.context
    });
  }
}
```

### Rule 5: Priority Recalculation
**Trigger**: Task updates, deadlines, dependencies
**MCP Tool**: `calculate_priority`

```typescript
// When tasks are updated
onTaskUpdate(task) {
  mcp.call('calculate_priority', {
    urgency: calculateUrgency(task),
    importance: calculateImportance(task),
    effort: task.estimatedHours || 1,
    dependencies: task.dependencies || [],
    deadline: task.deadline
  });
}

// Daily priority recalculation
onDailyTrigger() {
  mcp.call('calculate_priority', {
    recalculateAll: true,
    context: { trigger: 'daily_recalculation' }
  });
}
```

## 🔄 Workflow Integration Rules (6-9)

### Rule 6: Project Startup Workflow
**Trigger**: Workspace open, project initialization
**MCP Tools**: `get_system_status`, `list_tasks`

```typescript
onWorkspaceOpen(workspace) {
  // Check system health
  mcp.call('get_system_status');
  
  // Load active tasks
  mcp.call('list_tasks', {
    projectId: workspace.name,
    status: 'in_progress',
    limit: 10
  });
  
  // Show daily summary
  showDailySummary();
}
```

### Rule 7: Feature Development Workflow
**Trigger**: Feature branch creation, feature file creation
**MCP Tools**: `create_task`, `decompose_task`, `analyze_complexity`

```typescript
onFeatureBranchCreate(branch) {
  const featureName = extractFeatureName(branch.name);
  
  // Create main feature task
  const mainTask = mcp.call('create_task', {
    title: `Implement ${featureName}`,
    description: `Feature development: ${branch.name}`,
    priority: 'high',
    tags: ['feature', 'development']
  });
  
  // Decompose into subtasks
  mcp.call('decompose_task', {
    description: `Implement ${featureName}`,
    complexity: 'high',
    context: { featureName, branchName: branch.name }
  });
}
```

### Rule 8: Bug Fix Workflow
**Trigger**: Bug branch creation, error detection
**MCP Tools**: `create_task`, `update_task`

```typescript
onBugBranchCreate(branch) {
  const bugDescription = extractBugDescription(branch.name);
  
  mcp.call('create_task', {
    title: `Fix: ${bugDescription}`,
    description: `Bug fix: ${branch.name}`,
    priority: 'urgent',
    tags: ['bug', 'fix'],
    context: { branchName: branch.name, bugType: 'fix' }
  });
}

onErrorDetection(error) {
  mcp.call('create_task', {
    title: `Fix error: ${error.message}`,
    description: `Error detected in ${error.file}:${error.line}`,
    priority: 'high',
    tags: ['error', 'bug'],
    context: { error: error.stack, file: error.file }
  });
}
```

### Rule 9: Code Review Workflow
**Trigger**: Pull request creation, review requests
**MCP Tools**: `update_task`, `create_task`

```typescript
onPullRequestCreate(pr) {
  // Update main task status
  mcp.call('update_task', {
    taskId: pr.linkedTaskId,
    status: 'review',
    notes: `PR created: ${pr.title}`,
    reviewers: pr.reviewers
  });
  
  // Create review tasks for reviewers
  pr.reviewers.forEach(reviewer => {
    mcp.call('create_task', {
      title: `Review: ${pr.title}`,
      description: `Code review for PR #${pr.number}`,
      assignee: reviewer,
      priority: 'medium',
      tags: ['review', 'pr']
    });
  });
}
```

## 🎯 Context-Aware Rules (10-12)

### Rule 10: File Type Specific Rules
**Trigger**: File operations based on file type
**MCP Tools**: Various based on file type

```typescript
const fileTypeRules = {
  '.ts': {
    onOpen: () => mcp.call('analyze_complexity'),
    priority: 'high',
    autoAnalyze: true,
    tags: ['typescript', 'development']
  },
  '.tsx': {
    onOpen: () => mcp.call('analyze_complexity'),
    priority: 'high',
    autoAnalyze: true,
    tags: ['react', 'frontend', 'typescript']
  },
  '.py': {
    onOpen: () => mcp.call('analyze_complexity'),
    priority: 'medium',
    autoAnalyze: true,
    tags: ['python', 'backend']
  },
  '.md': {
    onOpen: () => {},
    priority: 'low',
    autoAnalyze: false,
    tags: ['documentation']
  }
};
```

### Rule 11: Git Integration Rules
**Trigger**: Git operations, branch changes
**MCP Tools**: `update_task`, `create_task`

```typescript
onBranchSwitch(fromBranch, toBranch) {
  // Pause tasks from old branch
  mcp.call('update_task', {
    branchName: fromBranch,
    status: 'paused',
    notes: `Switched from ${fromBranch} to ${toBranch}`
  });
  
  // Resume tasks for new branch
  mcp.call('list_tasks', {
    branchName: toBranch,
    status: 'paused'
  }).then(tasks => {
    tasks.forEach(task => {
      mcp.call('update_task', {
        taskId: task.id,
        status: 'in_progress',
        notes: `Resumed on branch ${toBranch}`
      });
    });
  });
}
```

### Rule 12: Time-Based Maintenance
**Trigger**: Scheduled intervals, time events
**MCP Tools**: `get_system_status`, `calculate_priority`

```typescript
// Every 4 hours: recalculate priorities
setInterval(() => {
  mcp.call('calculate_priority', {
    recalculateAll: true,
    context: { trigger: 'scheduled_recalculation' }
  });
}, 4 * 60 * 60 * 1000);

// Daily at 9 AM: system health check
scheduleDaily('09:00', () => {
  mcp.call('get_system_status');
  generateDailyReport();
});
```

## 🤖 Automation Rules (13-15)

### Rule 13: Smart Task Creation from Comments
**Trigger**: Special comments, annotations
**MCP Tool**: `create_task`

```typescript
onCommentCreate(comment) {
  const patterns = {
    'TODO:': { priority: 'low', tags: ['todo'] },
    'FIXME:': { priority: 'medium', tags: ['fix'] },
    'HACK:': { priority: 'high', tags: ['refactor'] },
    'BUG:': { priority: 'urgent', tags: ['bug'] },
    'FEATURE:': { priority: 'medium', tags: ['feature'] }
  };
  
  for (const [pattern, config] of Object.entries(patterns)) {
    if (comment.text.startsWith(pattern)) {
      mcp.call('create_task', {
        title: comment.text.replace(pattern, '').trim(),
        description: `${pattern} found in ${comment.file}:${comment.line}`,
        priority: config.priority,
        tags: config.tags,
        context: { file: comment.file, line: comment.line }
      });
    }
  }
}
```

### Rule 14: Dependency Tracking
**Trigger**: Import changes, dependency updates
**MCP Tool**: `update_task`

```typescript
onImportChange(file, imports) {
  const affectedTasks = findTasksByFile(file.path);
  
  affectedTasks.forEach(task => {
    mcp.call('update_task', {
      taskId: task.id,
      dependencies: [...task.dependencies, ...imports],
      notes: `Dependencies updated in ${file.path}`,
      complexity: recalculateComplexity(task, imports)
    });
  });
}
```

### Rule 15: Progress Tracking
**Trigger**: File saves, test runs, builds
**MCP Tool**: `update_task`

```typescript
onFileSave(file) {
  const progress = calculateFileProgress(file);
  const activeTask = getActiveTaskForFile(file);
  
  if (activeTask) {
    mcp.call('update_task', {
      taskId: activeTask.id,
      progress: progress,
      lastActivity: new Date(),
      notes: `Progress update: ${file.path} saved`
    });
  }
}

onTestRun(results) {
  const affectedTasks = findTasksByTestFiles(results.files);
  
  affectedTasks.forEach(task => {
    mcp.call('update_task', {
      taskId: task.id,
      testStatus: results.passed ? 'passing' : 'failing',
      notes: `Tests ${results.passed ? 'passed' : 'failed'}: ${results.summary}`
    });
  });
}
```

## 🔧 System Rules (16-20)

### Rule 16: MCP Server Health Monitoring
**Trigger**: Regular intervals, system events
**MCP Tool**: `get_system_status`

```typescript
// Health check every 5 minutes
setInterval(() => {
  mcp.call('get_system_status').then(status => {
    if (status.health !== 'healthy') {
      showHealthWarning(status);
    }
  }).catch(error => {
    showMCPConnectionError(error);
  });
}, 5 * 60 * 1000);
```

### Rule 17: Error Handling and Recovery
**Trigger**: MCP call failures, system errors
**MCP Tools**: Retry mechanisms

```typescript
function mcpCallWithRetry(tool, args, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attempt() {
      attempts++;
      mcp.call(tool, args)
        .then(resolve)
        .catch(error => {
          if (attempts < maxRetries) {
            setTimeout(attempt, 1000 * attempts);
          } else {
            logError(`MCP call failed after ${maxRetries} attempts`, error);
            reject(error);
          }
        });
    }
    
    attempt();
  });
}
```

### Rule 18: Performance Optimization
**Trigger**: Performance monitoring, resource usage
**MCP Tools**: Batched operations

```typescript
// Batch multiple MCP calls for efficiency
class MCPBatcher {
  private queue: Array<{tool: string, args: any, resolve: Function, reject: Function}> = [];
  
  add(tool: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ tool, args, resolve, reject });
      this.scheduleFlush();
    });
  }
  
  private scheduleFlush() {
    if (this.queue.length >= 5 || !this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 100);
    }
  }
  
  private flush() {
    const batch = this.queue.splice(0);
    // Process batch efficiently
    processBatch(batch);
  }
}
```

### Rule 19: Analytics and Metrics
**Trigger**: Task operations, user actions
**MCP Tools**: Data collection

```typescript
onTaskOperation(operation, task) {
  collectMetrics({
    operation: operation,
    taskId: task.id,
    timestamp: new Date(),
    duration: operation.duration,
    success: operation.success
  });
  
  // Weekly analytics report
  if (isWeeklyReportTime()) {
    generateAnalyticsReport();
  }
}
```

### Rule 20: Continuous Improvement
**Trigger**: Pattern detection, user feedback
**MCP Tools**: Learning algorithms

```typescript
onPatternDetection(pattern) {
  if (pattern.confidence > 0.8) {
    suggestAutomationRule(pattern);
  }
  
  // Learn from user behavior
  updateLearningModel(pattern);
}

onUserFeedback(feedback) {
  if (feedback.type === 'rule_suggestion') {
    evaluateRuleSuggestion(feedback);
  }
}
```

---

**These 20 rules provide comprehensive automatic task management integration between Roo Code IDE and your MCP server. Each rule is designed to trigger specific MCP tool calls based on development activities, ensuring intelligent and seamless task management throughout your workflow.** 