---
description: 
globs: 
alwaysApply: false
---
# 🔄 Roo Code Workflow Automation Rules for MCP Task Management

**Automated workflow integration rules for seamless task management during development**

## 🚀 Development Workflow Rules
# 🔄 Workflow Automation Rules for Roo Code IDE

**Advanced workflow automation sequences for development process integration**

> **📝 IMPORTANT FOR roo AI**: When modifying this file, you MUST also update:
> - [CENTRALIZED_MCP_RULES.md](mdc:.roo/rules/CENTRALIZED_MCP_RULES.md) - Update workflow summaries and links
> - [MCP_TASK_MANAGEMENT_RULES.md](mdc:.roo/rules/MCP_TASK_MANAGEMENT_RULES.md) - Check rule dependencies
> - [ROO CODE_MCP_CONFIG.md](mdc:.roo/rules/ROO CODE_MCP_CONFIG.md) - Update event handlers and triggers
> 
> **File Dependencies**: This file extends the core MCP rules with workflow-specific automation sequences.

# 🔄 Roo Code Workflow Automation Rules for MCP Task Management

**Automated workflow integration rules for seamless task management during development**

## 🚀 Development Workflow Rules

### Workflow 1: New Feature Development
**Trigger**: Feature branch creation (`feature/`, `feat/`)
**MCP Tools**: `create_task`, `decompose_task`, `analyze_complexity`

```typescript
onFeatureBranchCreate(branch: GitBranch) {
  const featureName = extractFeatureName(branch.name);
  
  // Step 1: Create main feature task
  const mainTask = await mcp.call('create_task', {
    title: `Feature: ${featureName}`,
    description: `Implement ${featureName} feature`,
    priority: 'high',
    projectId: workspace.name,
    tags: ['feature', 'development'],
    branchName: branch.name,
    estimatedHours: estimateFeatureComplexity(featureName)
  });
  
  // Step 2: Decompose into subtasks
  const decomposition = await mcp.call('decompose_task', {
    description: `Implement ${featureName}`,
    complexity: 'high',
    context: {
      featureName,
      branchName: branch.name,
      featureType: detectFeatureType(featureName)
    }
  });
  
  // Step 3: Create subtasks
  for (const subtask of decomposition.subtasks) {
    await mcp.call('create_task', {
      title: subtask.title,
      description: subtask.description,
      priority: subtask.priority,
      parentTaskId: mainTask.id,
      tags: [...subtask.tags, 'subtask'],
      estimatedHours: subtask.estimatedHours
    });
  }
  
  // Step 4: Show feature development plan
  showFeaturePlan(mainTask, decomposition.subtasks);
}

// Auto-update on feature file creation
onFileCreate(file: File) {
  if (isFeatureBranch() && isFeatureFile(file)) {
    const activeFeatureTask = getActiveFeatureTask();
    
    mcp.call('update_task', {
      taskId: activeFeatureTask.id,
      status: 'in_progress',
      notes: `Started working on ${file.name}`,
      files: [...activeFeatureTask.files, file.path]
    });
  }
}
```

### Workflow 2: Bug Fix Process
**Trigger**: Bug branch creation (`bug/`, `fix/`, `hotfix/`)
**MCP Tools**: `create_task`, `analyze_complexity`, `update_task`

```typescript
onBugBranchCreate(branch: GitBranch) {
  const bugDescription = extractBugDescription(branch.name);
  const severity = detectBugSeverity(branch.name);
  
  // Step 1: Create bug fix task
  const bugTask = await mcp.call('create_task', {
    title: `Bug Fix: ${bugDescription}`,
    description: `Fix bug: ${bugDescription}`,
    priority: severity === 'critical' ? 'urgent' : 'high',
    projectId: workspace.name,
    tags: ['bug', 'fix', severity],
    branchName: branch.name,
    bugSeverity: severity
  });
  
  // Step 2: Analyze bug complexity
  const complexity = await mcp.call('analyze_complexity', {
    description: `Bug fix: ${bugDescription}`,
    context: {
      bugType: detectBugType(bugDescription),
      severity: severity,
      affectedAreas: detectAffectedAreas(branch.name)
    }
  });
  
  // Step 3: Update task with complexity analysis
  await mcp.call('update_task', {
    taskId: bugTask.id,
    complexity: complexity.level,
    estimatedHours: complexity.estimatedHours,
    notes: `Complexity analysis: ${complexity.summary}`
  });
  
  // Step 4: Set up bug tracking
  setupBugTracking(bugTask);
}

// Auto-update on bug investigation
onFileOpen(file: File) {
  if (isBugBranch() && isBugRelatedFile(file)) {
    const activeBugTask = getActiveBugTask();
    
    mcp.call('update_task', {
      taskId: activeBugTask.id,
      notes: `Investigating ${file.name}`,
      investigatedFiles: [...activeBugTask.investigatedFiles, file.path]
    });
  }
}
```

### Workflow 3: Refactoring Process
**Trigger**: Refactor branch creation (`refactor/`, `improve/`)
**MCP Tools**: `create_task`, `analyze_complexity`, `decompose_task`

```typescript
onRefactorBranchCreate(branch: GitBranch) {
  const refactorTarget = extractRefactorTarget(branch.name);
  
  // Step 1: Analyze current complexity
  const currentComplexity = await mcp.call('analyze_complexity', {
    description: `Current state of ${refactorTarget}`,
    context: {
      refactorType: 'before',
      targetArea: refactorTarget,
      codebaseSection: detectCodebaseSection(refactorTarget)
    }
  });
  
  // Step 2: Create refactoring task
  const refactorTask = await mcp.call('create_task', {
    title: `Refactor: ${refactorTarget}`,
    description: `Refactor ${refactorTarget} to improve code quality`,
    priority: 'medium',
    projectId: workspace.name,
    tags: ['refactor', 'improvement', 'code-quality'],
    branchName: branch.name,
    currentComplexity: currentComplexity.level
  });
  
  // Step 3: Decompose refactoring steps
  const steps = await mcp.call('decompose_task', {
    description: `Refactor ${refactorTarget}`,
    complexity: currentComplexity.level,
    context: {
      refactorType: 'improvement',
      currentState: currentComplexity,
      targetImprovement: 'reduce_complexity'
    }
  });
  
  // Step 4: Create refactoring checklist
  createRefactoringChecklist(refactorTask, steps.subtasks);
}
```

### Workflow 4: Testing Implementation
**Trigger**: Test file creation, test branch creation
**MCP Tools**: `create_task`, `update_task`

```typescript
onTestFileCreate(file: File) {
  if (file.name.includes('.test.') || file.name.includes('.spec.')) {
    const testTarget = extractTestTarget(file.name);
    
    // Create testing task
    const testTask = await mcp.call('create_task', {
      title: `Test: ${testTarget}`,
      description: `Implement tests for ${testTarget}`,
      priority: 'medium',
      projectId: workspace.name,
      tags: ['testing', 'qa', getTestType(file)],
      testFile: file.path,
      testTarget: testTarget
    });
    
    // Link to main feature task if exists
    const relatedTask = findRelatedFeatureTask(testTarget);
    if (relatedTask) {
      await mcp.call('update_task', {
        taskId: relatedTask.id,
        testTaskId: testTask.id,
        notes: `Test task created: ${testTask.title}`
      });
    }
  }
}

// Auto-update on test runs
onTestRun(results: TestResults) {
  const affectedTasks = findTasksByTestFiles(results.files);
  
  for (const task of affectedTasks) {
    await mcp.call('update_task', {
      taskId: task.id,
      testStatus: results.passed ? 'passing' : 'failing',
      testCoverage: results.coverage,
      notes: `Tests ${results.passed ? 'passed' : 'failed'}: ${results.summary}`
    });
  }
}
```

## 📝 Documentation Workflow Rules

### Workflow 5: Documentation Updates
**Trigger**: Documentation file creation/modification
**MCP Tools**: `create_task`, `update_task`

```typescript
onDocumentationChange(file: File) {
  if (file.extension === '.md' || file.path.includes('/docs/')) {
    const docType = detectDocumentationType(file);
    
    // Create or update documentation task
    const existingTask = findDocumentationTask(file.path);
    
    if (existingTask) {
      await mcp.call('update_task', {
        taskId: existingTask.id,
        status: 'in_progress',
        notes: `Updated documentation: ${file.name}`,
        lastModified: new Date()
      });
    } else {
      await mcp.call('create_task', {
        title: `Documentation: ${file.name}`,
        description: `Update documentation in ${file.path}`,
        priority: 'low',
        projectId: workspace.name,
        tags: ['documentation', docType],
        documentationFile: file.path
      });
    }
  }
}

// Auto-link documentation to features
onFeatureDocumentation(file: File, featureTask: Task) {
  await mcp.call('update_task', {
    taskId: featureTask.id,
    documentationFiles: [...featureTask.documentationFiles, file.path],
    notes: `Documentation added: ${file.name}`
  });
}
```

## 🔄 Git Integration Workflow Rules

### Workflow 6: Commit-Based Task Updates
**Trigger**: Git commits with task references
**MCP Tools**: `update_task`, `calculate_priority`

```typescript
onCommit(commit: GitCommit) {
  // Extract task references from commit message
  const taskReferences = extractTaskReferences(commit.message);
  
  for (const taskRef of taskReferences) {
    const task = await findTaskById(taskRef.taskId);
    
    if (task) {
      // Calculate progress based on commit
      const progress = calculateCommitProgress(commit, task);
      
      await mcp.call('update_task', {
        taskId: task.id,
        progress: progress,
        status: determineStatusFromCommit(commit.message),
        notes: `Commit: ${commit.message}`,
        commits: [...task.commits, commit.hash],
        lastActivity: new Date()
      });
      
      // Recalculate priority if significant progress
      if (progress > task.progress + 20) {
        await mcp.call('calculate_priority', {
          taskId: task.id,
          urgency: calculateUrgency(task),
          importance: calculateImportance(task),
          effort: task.estimatedHours - (task.estimatedHours * progress / 100)
        });
      }
    }
  }
  
  // Auto-create tasks from commit messages
  if (shouldCreateTaskFromCommit(commit.message)) {
    await mcp.call('create_task', {
      title: extractTaskTitleFromCommit(commit.message),
      description: `Task created from commit: ${commit.message}`,
      priority: 'medium',
      projectId: workspace.name,
      tags: ['auto-created', 'commit'],
      sourceCommit: commit.hash
    });
  }
}

// Commit message patterns that trigger task creation
const commitPatterns = {
  'feat:': { priority: 'medium', tags: ['feature'] },
  'fix:': { priority: 'high', tags: ['bug', 'fix'] },
  'refactor:': { priority: 'low', tags: ['refactor'] },
  'test:': { priority: 'low', tags: ['testing'] },
  'docs:': { priority: 'low', tags: ['documentation'] }
};
```

### Workflow 7: Pull Request Workflow
**Trigger**: Pull request creation, review, merge
**MCP Tools**: `update_task`, `create_task`

```typescript
onPullRequestCreate(pr: PullRequest) {
  // Find related tasks
  const relatedTasks = findTasksByBranch(pr.sourceBranch);
  
  for (const task of relatedTasks) {
    await mcp.call('update_task', {
      taskId: task.id,
      status: 'review',
      pullRequestId: pr.id,
      pullRequestUrl: pr.url,
      reviewers: pr.reviewers,
      notes: `PR created: ${pr.title}`
    });
  }
  
  // Create review tasks for each reviewer
  for (const reviewer of pr.reviewers) {
    await mcp.call('create_task', {
      title: `Review PR: ${pr.title}`,
      description: `Code review for pull request #${pr.number}`,
      priority: 'medium',
      assignee: reviewer,
      projectId: workspace.name,
      tags: ['review', 'pr'],
      pullRequestId: pr.id,
      estimatedHours: estimateReviewTime(pr)
    });
  }
}

onPullRequestMerge(pr: PullRequest) {
  // Complete related tasks
  const relatedTasks = findTasksByPullRequest(pr.id);
  
  for (const task of relatedTasks) {
    if (task.tags.includes('review')) {
      // Complete review tasks
      await mcp.call('update_task', {
        taskId: task.id,
        status: 'completed',
        completedAt: new Date(),
        notes: `PR merged: ${pr.title}`
      });
    } else {
      // Update main tasks
      await mcp.call('update_task', {
        taskId: task.id,
        status: 'completed',
        completedAt: new Date(),
        mergedPullRequest: pr.id,
        notes: `Feature merged: ${pr.title}`
      });
    }
  }
}
```

## ⏰ Time-Based Workflow Rules

### Workflow 8: Daily Standup Preparation
**Trigger**: Daily at 9:00 AM
**MCP Tools**: `get_system_status`, `list_tasks`, `calculate_priority`

```typescript
scheduleDailyStandup('09:00', async () => {
  // Step 1: Get system health
  const systemStatus = await mcp.call('get_system_status');
  
  // Step 2: Get active tasks
  const activeTasks = await mcp.call('list_tasks', {
    status: 'in_progress',
    assignee: currentUser,
    limit: 10
  });
  
  // Step 3: Get completed tasks from yesterday
  const completedTasks = await mcp.call('list_tasks', {
    status: 'completed',
    completedAfter: getYesterday(),
    assignee: currentUser
  });
  
  // Step 4: Recalculate priorities
  for (const task of activeTasks.tasks) {
    await mcp.call('calculate_priority', {
      taskId: task.id,
      urgency: calculateUrgency(task),
      importance: calculateImportance(task),
      effort: task.remainingHours
    });
  }
  
  // Step 5: Generate standup report
  const standupReport = generateStandupReport({
    systemHealth: systemStatus,
    activeTasks: activeTasks.tasks,
    completedTasks: completedTasks.tasks,
    blockers: findBlockedTasks(activeTasks.tasks)
  });
  
  // Step 6: Show standup summary
  showStandupSummary(standupReport);
});

function generateStandupReport(data: StandupData) {
  return {
    yesterday: data.completedTasks.map(task => ({
      title: task.title,
      progress: task.progress,
      timeSpent: task.timeSpent
    })),
    today: data.activeTasks.slice(0, 3).map(task => ({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedHours
    })),
    blockers: data.blockers.map(task => ({
      title: task.title,
      blocker: task.blockerReason
    })),
    systemHealth: data.systemHealth.health
  };
}
```

### Workflow 9: Weekly Sprint Planning
**Trigger**: Weekly on Monday at 10:00 AM
**MCP Tools**: `list_tasks`, `decompose_task`, `calculate_priority`

```typescript
scheduleWeeklyPlanning('monday', '10:00', async () => {
  // Step 1: Review last week's performance
  const lastWeekTasks = await mcp.call('list_tasks', {
    completedAfter: getLastWeek(),
    completedBefore: getToday()
  });
  
  // Step 2: Get pending tasks
  const pendingTasks = await mcp.call('list_tasks', {
    status: ['pending', 'in_progress'],
    limit: 50
  });
  
  // Step 3: Decompose large tasks for the week
  const largeTasks = pendingTasks.tasks.filter(task => 
    task.estimatedHours > 8 || task.complexity === 'high'
  );
  
  for (const task of largeTasks) {
    await mcp.call('decompose_task', {
      description: task.description,
      complexity: task.complexity,
      context: {
        sprintPlanning: true,
        weeklyCapacity: calculateWeeklyCapacity()
      }
    });
  }
  
  // Step 4: Recalculate all priorities for sprint planning
  for (const task of pendingTasks.tasks) {
    await mcp.call('calculate_priority', {
      taskId: task.id,
      urgency: calculateSprintUrgency(task),
      importance: calculateBusinessValue(task),
      effort: task.estimatedHours,
      sprintContext: true
    });
  }
  
  // Step 5: Generate sprint plan
  const sprintPlan = generateSprintPlan(pendingTasks.tasks);
  showSprintPlan(sprintPlan);
});
```

## 🎯 Context-Aware Workflow Rules

### Workflow 10: File-Based Context Switching
**Trigger**: File opening, workspace switching
**MCP Tools**: `list_tasks`, `update_task`

```typescript
onFileOpen(file: File) {
  // Find tasks related to this file
  const relatedTasks = await mcp.call('list_tasks', {
    files: [file.path],
    status: ['pending', 'in_progress']
  });
  
  if (relatedTasks.tasks.length > 0) {
    // Show context-aware task panel
    showContextualTasks(relatedTasks.tasks);
    
    // Update task activity
    for (const task of relatedTasks.tasks) {
      await mcp.call('update_task', {
        taskId: task.id,
        lastActivity: new Date(),
        currentFile: file.path,
        notes: `Working on ${file.name}`
      });
    }
  } else {
    // Suggest creating a task for this file
    if (shouldSuggestTaskCreation(file)) {
      suggestTaskCreation(file);
    }
  }
}

onWorkspaceSwitch(fromWorkspace: string, toWorkspace: string) {
  // Pause tasks from old workspace
  const oldTasks = await mcp.call('list_tasks', {
    projectId: fromWorkspace,
    status: 'in_progress'
  });
  
  for (const task of oldTasks.tasks) {
    await mcp.call('update_task', {
      taskId: task.id,
      status: 'paused',
      notes: `Paused due to workspace switch to ${toWorkspace}`
    });
  }
  
  // Resume tasks for new workspace
  const newTasks = await mcp.call('list_tasks', {
    projectId: toWorkspace,
    status: 'paused'
  });
  
  for (const task of newTasks.tasks) {
    await mcp.call('update_task', {
      taskId: task.id,
      status: 'in_progress',
      notes: `Resumed in workspace ${toWorkspace}`
    });
  }
}
```

### Workflow 11: Project Type Detection
**Trigger**: Project initialization, configuration changes
**MCP Tools**: `create_task`, `decompose_task`

```typescript
onProjectDetection(projectType: ProjectType) {
  const projectTemplates = {
    'react-app': {
      tasks: [
        'Set up component structure',
        'Configure routing',
        'Set up state management',
        'Implement styling system'
      ],
      tags: ['react', 'frontend']
    },
    'node-api': {
      tasks: [
        'Set up Express server',
        'Configure database',
        'Implement authentication',
        'Set up API routes'
      ],
      tags: ['node', 'backend', 'api']
    },
    'python-app': {
      tasks: [
        'Set up virtual environment',
        'Configure dependencies',
        'Implement main modules',
        'Set up testing framework'
      ],
      tags: ['python', 'backend']
    }
  };
  
  const template = projectTemplates[projectType];
  if (template) {
    // Create project setup tasks
    for (const taskTitle of template.tasks) {
      await mcp.call('create_task', {
        title: taskTitle,
        description: `Project setup: ${taskTitle}`,
        priority: 'medium',
        projectId: workspace.name,
        tags: [...template.tags, 'setup', 'project-init'],
        projectType: projectType
      });
    }
  }
}
```

## 🔧 Configuration and Setup

### Workflow Configuration
```typescript
// Workflow Configuration Object
const workflowConfig = {
  autoTaskCreation: true,
  autoProgressTracking: true,
  autoPriorityCalculation: true,
  dailyStandupTime: "09:00",
  weeklyPlanningDay: "monday",
  weeklyPlanningTime: "10:00",
  complexityThreshold: 200, // lines of code
  estimationAccuracy: 0.8,
  defaultEstimates: {
    feature: 16,
    bug: 4,
    refactor: 8,
    test: 3,
    documentation: 2
  }
};
```

### Helper Functions
```typescript
// Utility Functions for Workflow Rules
function getCurrentProjectId(): string {
  return workspace.getConfiguration('aai.project.id') || 'default';
}

function extractFeatureName(branchName: string): string {
  return branchName.replace(/^(feature|feat)\//, '').replace(/[-_]/g, ' ');
}

function calculateEstimatedHours(fileSize: number, complexity: number): number {
  const baseHours = Math.ceil(fileSize / 100); // 1 hour per 100 lines
  const complexityMultiplier = 1 + (complexity / 10);
  return Math.min(baseHours * complexityMultiplier, 40); // Max 40 hours
}

function shouldCreateTaskForFile(filePath: string): boolean {
  const excludePatterns = [
    /node_modules/, /\.git/, /dist/, /build/,
    /\.log$/, /\.tmp$/, /\.cache/
  ];
  return !excludePatterns.some(pattern => pattern.test(filePath));
}
```

---

**These workflow automation rules provide comprehensive automatic task management for all common development scenarios. Each workflow is designed to trigger appropriate MCP operations based on specific development activities, ensuring seamless integration between your development process and intelligent task management.** 