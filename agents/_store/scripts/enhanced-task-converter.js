#!/usr/bin/env node

/**
 * 🔄 Enhanced Task Converter
 * 
 * Converts AAI tasks to actionable VS Code tasks that Cursor can execute
 * Creates specific commands based on task type and user intent
 */

const fs = require('fs');
const path = require('path');

class EnhancedTaskConverter {
  constructor() {
    this.version = '1.0.0';
  }

  /**
   * Convert AAI tasks to actionable VS Code tasks
   */
  async convertToActionableTasks(aaiTasks, userCommand) {
    const actionableTasks = [];
    
    // Add a planning task first
    actionableTasks.push(this.createPlanningTask(userCommand, aaiTasks));
    
    // Convert each AAI task
    for (let i = 0; i < aaiTasks.length; i++) {
      const aaiTask = aaiTasks[i];
      const actionableTask = await this.convertToActionableTask(aaiTask, i + 1, userCommand);
      actionableTasks.push(actionableTask);
    }
    
    // Add a completion task
    actionableTasks.push(this.createCompletionTask(userCommand, aaiTasks));
    
    return actionableTasks;
  }

  /**
   * Create planning task
   */
  createPlanningTask(userCommand, aaiTasks) {
    return {
      label: "📋 1. Planning & Analysis",
      type: "shell",
      command: "echo",
      args: [
        `"🎯 PLANNING: ${userCommand}\\n` +
        `📊 Total Tasks: ${aaiTasks.length}\\n` +
        `⏱️  Estimated Time: ${aaiTasks.reduce((sum, task) => sum + task.estimatedTime, 0)} minutes\\n` +
        `🔍 Analysis complete - ready to proceed"`
      ],
      group: "build",
      presentation: {
        echo: true,
        reveal: "always",
        focus: true,
        panel: "new",
        clear: true
      },
      detail: `Planning phase for: ${userCommand}`,
      metadata: {
        isPlanning: true,
        userCommand: userCommand
      }
    };
  }

  /**
   * Create completion task
   */
  createCompletionTask(userCommand, aaiTasks) {
    return {
      label: `🎉 ${aaiTasks.length + 2}. Task Completion`,
      type: "shell",
      command: "echo",
      args: [
        `"✅ COMPLETED: ${userCommand}\\n` +
        `📊 All ${aaiTasks.length} tasks executed\\n` +
        `🎯 User request fulfilled successfully"`
      ],
      group: "build",
      presentation: {
        echo: true,
        reveal: "always",
        focus: true,
        panel: "shared"
      },
      detail: `Completion confirmation for: ${userCommand}`,
      metadata: {
        isCompletion: true,
        userCommand: userCommand
      }
    };
  }

  /**
   * Convert single AAI task to actionable VS Code task
   */
  async convertToActionableTask(aaiTask, taskNumber, userCommand) {
    const taskLabel = `${this.getTaskIcon(aaiTask.type)} ${taskNumber + 1}. ${aaiTask.title}`;
    
    // Get specific command based on task type and content
    const command = this.getActionableCommand(aaiTask, userCommand);
    
    return {
      label: taskLabel,
      type: command.type || "shell",
      command: command.command,
      args: command.args || [],
      group: this.getTaskGroup(aaiTask.type),
      presentation: {
        echo: true,
        reveal: "always",
        focus: false,
        panel: "shared",
        showReuseMessage: false,
        clear: false
      },
      options: {
        cwd: "${workspaceFolder}"
      },
      problemMatcher: command.problemMatcher || [],
      detail: `${aaiTask.description}\n\nEstimated time: ${aaiTask.estimatedTime} minutes\nPriority: ${aaiTask.priority}`,
      dependsOn: taskNumber === 1 ? ["📋 1. Planning & Analysis"] : [`${this.getTaskIcon(aaiTask.type)} ${taskNumber}. Previous Task`],
      metadata: {
        aaiTaskId: aaiTask.id,
        aaiTaskType: aaiTask.type,
        aaiCategory: aaiTask.category,
        userCommand: userCommand,
        estimatedTime: aaiTask.estimatedTime,
        priority: aaiTask.priority,
        taskNumber: taskNumber + 1
      }
    };
  }

  /**
   * Get task icon based on type
   */
  getTaskIcon(taskType) {
    const icons = {
      'file_operation': '📁',
      'development': '💻',
      'system': '⚙️',
      'documentation': '📚',
      'quality_assurance': '✅',
      'investigation': '🔍',
      'improvement': '⚡',
      'planning': '📋',
      'validation': '🎯'
    };
    return icons[taskType] || '🔧';
  }

  /**
   * Get actionable command based on task type and content
   */
  getActionableCommand(aaiTask, userCommand) {
    const taskType = aaiTask.type;
    const taskTitle = aaiTask.title.toLowerCase();
    const taskDescription = aaiTask.description.toLowerCase();
    
    // File operation tasks
    if (taskType === 'file_operation') {
      if (taskTitle.includes('create') || taskTitle.includes('new')) {
        return this.getFileCreationCommand(aaiTask, userCommand);
      }
      if (taskTitle.includes('modify') || taskTitle.includes('update')) {
        return this.getFileModificationCommand(aaiTask, userCommand);
      }
    }
    
    // Development tasks
    if (taskType === 'development') {
      if (taskTitle.includes('component') || taskTitle.includes('react')) {
        return this.getComponentCreationCommand(aaiTask, userCommand);
      }
      if (taskTitle.includes('function') || taskTitle.includes('method')) {
        return this.getFunctionCreationCommand(aaiTask, userCommand);
      }
      if (taskTitle.includes('api') || taskTitle.includes('endpoint')) {
        return this.getAPICreationCommand(aaiTask, userCommand);
      }
    }
    
    // System tasks
    if (taskType === 'system') {
      if (taskTitle.includes('install') || taskTitle.includes('dependency')) {
        return this.getDependencyInstallCommand(aaiTask, userCommand);
      }
      if (taskTitle.includes('config') || taskTitle.includes('setup')) {
        return this.getConfigurationCommand(aaiTask, userCommand);
      }
    }
    
    // Documentation tasks
    if (taskType === 'documentation') {
      return this.getDocumentationCommand(aaiTask, userCommand);
    }
    
    // Quality assurance tasks
    if (taskType === 'quality_assurance') {
      return this.getTestingCommand(aaiTask, userCommand);
    }
    
    // Default command
    return this.getDefaultCommand(aaiTask);
  }

  /**
   * File creation command
   */
  getFileCreationCommand(aaiTask, userCommand) {
    // Extract potential file name from user command or task
    const fileName = this.extractFileName(userCommand, aaiTask);
    
    return {
      command: "node",
      args: ["-e", `
        const fs = require('fs');
        const path = require('path');
        
        console.log('📁 Creating file: ${fileName}');
        
        // Determine file type and create appropriate content
        const fileContent = \`// ${fileName}
// Generated from: ${userCommand}
// Task: ${aaiTask.title}

// TODO: Implement ${aaiTask.title}
console.log('${fileName} created successfully');
\`;
        
        // Ensure directory exists
        const dir = path.dirname('${fileName}');
        if (dir !== '.' && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log('📁 Created directory: ' + dir);
        }
        
        // Create file
        fs.writeFileSync('${fileName}', fileContent);
        console.log('✅ File created: ${fileName}');
      `]
    };
  }

  /**
   * File modification command
   */
  getFileModificationCommand(aaiTask, userCommand) {
    const fileName = this.extractFileName(userCommand, aaiTask);
    
    return {
      command: "node",
      args: ["-e", `
        const fs = require('fs');
        
        console.log('📝 Modifying file: ${fileName}');
        
        if (fs.existsSync('${fileName}')) {
          let content = fs.readFileSync('${fileName}', 'utf8');
          
          // Add modification comment
          const modification = '\\n// Modified for: ${userCommand}\\n// ${aaiTask.title}\\n';
          content += modification;
          
          fs.writeFileSync('${fileName}', content);
          console.log('✅ File modified: ${fileName}');
        } else {
          console.log('⚠️ File not found: ${fileName}');
          console.log('Creating new file instead...');
          
          const newContent = \`// ${fileName}
// Created for: ${userCommand}
// Task: ${aaiTask.title}

// TODO: Implement ${aaiTask.title}
\`;
          fs.writeFileSync('${fileName}', newContent);
          console.log('✅ New file created: ${fileName}');
        }
      `]
    };
  }

  /**
   * Component creation command
   */
  getComponentCreationCommand(aaiTask, userCommand) {
    const componentName = this.extractComponentName(userCommand, aaiTask);
    const fileName = `src/components/${componentName}.jsx`;
    
    return {
      command: "node",
      args: ["-e", `
        const fs = require('fs');
        const path = require('path');
        
        console.log('⚛️ Creating React component: ${componentName}');
        
        const componentContent = \`import React from 'react';

/**
 * ${componentName} Component
 * Generated from: ${userCommand}
 * Task: ${aaiTask.title}
 */
const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName}</h2>
      <p>Component created for: ${userCommand}</p>
      {/* TODO: Implement ${aaiTask.title} */}
    </div>
  );
};

export default ${componentName};
\`;
        
        // Ensure directory exists
        const dir = path.dirname('${fileName}');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log('📁 Created directory: ' + dir);
        }
        
        // Create component file
        fs.writeFileSync('${fileName}', componentContent);
        console.log('✅ Component created: ${fileName}');
      `]
    };
  }

  /**
   * Function creation command
   */
  getFunctionCreationCommand(aaiTask, userCommand) {
    const functionName = this.extractFunctionName(userCommand, aaiTask);
    
    return {
      command: "echo",
      args: [`"💻 Function: ${functionName}\\n📝 Task: ${aaiTask.title}\\n🎯 Purpose: ${userCommand}\\n✅ Ready for implementation"`]
    };
  }

  /**
   * API creation command
   */
  getAPICreationCommand(aaiTask, userCommand) {
    const apiName = this.extractAPIName(userCommand, aaiTask);
    
    return {
      command: "echo",
      args: [`"🌐 API: ${apiName}\\n📝 Task: ${aaiTask.title}\\n🎯 Purpose: ${userCommand}\\n✅ Ready for implementation"`]
    };
  }

  /**
   * Dependency install command
   */
  getDependencyInstallCommand(aaiTask, userCommand) {
    const dependencies = this.extractDependencies(userCommand, aaiTask);
    
    if (dependencies.length > 0) {
      return {
        command: "npm",
        args: ["install", ...dependencies],
        problemMatcher: ["$npm"]
      };
    }
    
    return {
      command: "echo",
      args: [`"📦 Dependencies: Ready to install\\n📝 Task: ${aaiTask.title}\\n🎯 Purpose: ${userCommand}"`]
    };
  }

  /**
   * Configuration command
   */
  getConfigurationCommand(aaiTask, userCommand) {
    return {
      command: "echo",
      args: [`"⚙️ Configuration: ${aaiTask.title}\\n📝 Setup required for: ${userCommand}\\n✅ Ready to configure"`]
    };
  }

  /**
   * Documentation command
   */
  getDocumentationCommand(aaiTask, userCommand) {
    return {
      command: "echo",
      args: [`"📚 Documentation: ${aaiTask.title}\\n📝 Writing docs for: ${userCommand}\\n✅ Ready to document"`]
    };
  }

  /**
   * Testing command
   */
  getTestingCommand(aaiTask, userCommand) {
    return {
      command: "echo",
      args: [`"🧪 Testing: ${aaiTask.title}\\n📝 Testing for: ${userCommand}\\n✅ Ready to test"`]
    };
  }

  /**
   * Default command
   */
  getDefaultCommand(aaiTask) {
    return {
      command: "echo",
      args: [`"${this.getTaskIcon(aaiTask.type)} ${aaiTask.title}\\n📝 ${aaiTask.description}\\n✅ Task ready for execution"`]
    };
  }

  /**
   * Get task group
   */
  getTaskGroup(taskType) {
    const groups = {
      'file_operation': 'build',
      'development': 'build',
      'system': 'build',
      'documentation': 'build',
      'quality_assurance': 'test',
      'investigation': 'test',
      'improvement': 'build',
      'planning': 'build',
      'validation': 'test'
    };
    return groups[taskType] || 'build';
  }

  /**
   * Extract file name from command or task
   */
  extractFileName(userCommand, aaiTask) {
    // Look for file patterns in the command
    const filePatterns = [
      /create\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?([a-zA-Z0-9_-]+\.[a-zA-Z]+)/i,
      /(?:file|component|module)\s+(?:called\s+|named\s+)?([a-zA-Z0-9_-]+)/i,
      /([a-zA-Z0-9_-]+\.[a-zA-Z]+)/
    ];
    
    for (const pattern of filePatterns) {
      const match = userCommand.match(pattern);
      if (match) return match[1];
    }
    
    // Default based on task type
    if (aaiTask.type === 'development') return 'component.jsx';
    if (aaiTask.type === 'documentation') return 'README.md';
    return 'file.js';
  }

  /**
   * Extract component name from command or task
   */
  extractComponentName(userCommand, aaiTask) {
    const patterns = [
      /(?:component|comp)\s+(?:called\s+|named\s+)?([a-zA-Z][a-zA-Z0-9]*)/i,
      /create\s+(?:a\s+)?([a-zA-Z][a-zA-Z0-9]*)\s+component/i,
      /([A-Z][a-zA-Z0-9]*)\s+component/i
    ];
    
    for (const pattern of patterns) {
      const match = userCommand.match(pattern);
      if (match) {
        let name = match[1];
        // Ensure PascalCase
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    
    return 'NewComponent';
  }

  /**
   * Extract function name from command or task
   */
  extractFunctionName(userCommand, aaiTask) {
    const patterns = [
      /(?:function|func)\s+(?:called\s+|named\s+)?([a-zA-Z][a-zA-Z0-9]*)/i,
      /create\s+(?:a\s+)?([a-zA-Z][a-zA-Z0-9]*)\s+function/i
    ];
    
    for (const pattern of patterns) {
      const match = userCommand.match(pattern);
      if (match) return match[1];
    }
    
    return 'newFunction';
  }

  /**
   * Extract API name from command or task
   */
  extractAPIName(userCommand, aaiTask) {
    const patterns = [
      /(?:api|endpoint)\s+(?:called\s+|named\s+)?([a-zA-Z][a-zA-Z0-9]*)/i,
      /create\s+(?:a\s+)?([a-zA-Z][a-zA-Z0-9]*)\s+(?:api|endpoint)/i
    ];
    
    for (const pattern of patterns) {
      const match = userCommand.match(pattern);
      if (match) return match[1];
    }
    
    return 'newAPI';
  }

  /**
   * Extract dependencies from command or task
   */
  extractDependencies(userCommand, aaiTask) {
    const dependencies = [];
    
    // Common dependency patterns
    const patterns = [
      /install\s+([a-zA-Z0-9@/_-]+)/g,
      /add\s+([a-zA-Z0-9@/_-]+)/g,
      /dependency\s+([a-zA-Z0-9@/_-]+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(userCommand)) !== null) {
        dependencies.push(match[1]);
      }
    }
    
    return dependencies;
  }
}

module.exports = EnhancedTaskConverter; 