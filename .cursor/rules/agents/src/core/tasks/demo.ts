import { AITaskService } from './AITaskService';
import { CreateTaskInput, AITaskGenerationContext } from '../../types/TaskTypes';

/**
 * Demo script for AI Task Decomposition System
 * 
 * This demonstrates the capabilities of the AI-driven task decomposition algorithm.
 */
async function demoAITaskDecomposition() {
  console.log('🚀 Starting AI Task Decomposition Demo...\n');

  // Initialize the AI Task Service
  const aiTaskService = new AITaskService();

  // Create a sample complex task
  const complexTaskInput: CreateTaskInput = {
    title: 'Build User Authentication System',
    description: 'Create a comprehensive user authentication system with login, registration, password reset, and multi-factor authentication capabilities',
    type: 'feature',
    priority: 'high',
    complexity: 'complex',
    estimatedHours: 32,
    tags: ['authentication', 'security', 'backend'],
    metadata: {
      businessValue: 'high',
      technicalRisk: 'medium',
      userImpact: 'high',
      domain: 'security',
      framework: 'node.js'
    }
  };

  // Generate project context
  const projectContext: AITaskGenerationContext = aiTaskService.generateProjectContext(
    'Building a modern web application with user management, authentication, and secure data handling'
  );

  console.log('📋 Creating complex task with AI decomposition...');
  
  try {
    // Create task with automatic AI decomposition
    const result = await aiTaskService.createTaskWithDecomposition(
      complexTaskInput,
      projectContext,
      true // Enable auto-decomposition
    );

    if (result.success) {
      console.log(`✅ Task created successfully: ${result.taskId}`);
      
      if (result.subtasks && result.subtasks.length > 0) {
        console.log(`🔄 AI decomposed task into ${result.subtasks.length} subtasks:`);
        
        for (let i = 0; i < result.subtasks.length; i++) {
          const subtask = result.subtasks[i];
          if (subtask && subtask.success) {
            const subtaskDetails = aiTaskService.getTask(subtask.taskId);
            if (subtaskDetails) {
              console.log(`  ${i + 1}. ${subtaskDetails.title} (${subtaskDetails.complexity}, ${subtaskDetails.estimatedHours}h)`);
            }
          }
        }
      } else {
        console.log('ℹ️  Task was not decomposed (complexity threshold not met)');
      }
    } else {
      console.error(`❌ Failed to create task: ${result.error}`);
    }

    // Get AI recommendations
    console.log('\n🤖 Getting AI recommendations...');
    const recommendations = await aiTaskService.getAIRecommendations();
    
    if (recommendations.length > 0) {
      console.log(`Found ${recommendations.length} recommendations:`);
      recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.recommendation} (confidence: ${rec.confidence})`);
      });
    } else {
      console.log('No recommendations at this time.');
    }

    // Display task hierarchy
    console.log('\n📊 Current task hierarchy:');
    const rootTasks = aiTaskService.getRootTasks();
    
    for (const rootTask of rootTasks) {
      console.log(`📁 ${rootTask.title} (${rootTask.status})`);
      const hierarchy = aiTaskService.getTaskHierarchy(rootTask.id);
      
      if (hierarchy?.children && hierarchy.children.length > 0) {
        hierarchy.children.forEach((child: any, _index: number) => {
          console.log(`  └─ ${child.task.title} (${child.task.complexity}, ${child.task.estimatedHours}h)`);
        });
      }
    }

    // Display statistics
    console.log('\n📈 Task Statistics:');
    const stats = aiTaskService.getStatistics();
    console.log(`  Total tasks: ${stats.totalTasks}`);
    console.log(`  Root tasks: ${stats.rootTasks}`);
    console.log(`  Max depth: ${stats.maxDepth}`);
    console.log(`  Average progress: ${stats.averageProgress.toFixed(1)}%`);
    console.log(`  AI generated: ${stats.aiGeneratedPercentage.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }

  console.log('\n✨ AI Task Decomposition Demo completed!');
}

/**
 * Demo for batch processing with AI
 */
async function demoBatchProcessing() {
  console.log('\n🔄 Starting Batch Processing Demo...\n');

  const aiTaskService = new AITaskService();

  // Create multiple tasks for batch processing
  const tasks: CreateTaskInput[] = [
    {
      title: 'Implement API Gateway',
      description: 'Create a centralized API gateway for microservices routing and authentication',
      type: 'feature',
      priority: 'high',
      complexity: 'complex',
      estimatedHours: 24,
      tags: ['api', 'gateway', 'microservices']
    },
    {
      title: 'Setup Database Monitoring',
      description: 'Implement comprehensive database monitoring and alerting system',
      type: 'task',
      priority: 'medium',
      complexity: 'medium',
      estimatedHours: 12,
      tags: ['database', 'monitoring']
    },
    {
      title: 'Create User Dashboard',
      description: 'Build responsive user dashboard with analytics and reporting',
      type: 'feature',
      priority: 'medium',
      complexity: 'complex',
      estimatedHours: 20,
      tags: ['frontend', 'dashboard', 'analytics']
    }
  ];

  const taskIds: string[] = [];

  // Create all tasks
  for (const taskInput of tasks) {
    const result = await aiTaskService.createTask(taskInput);
    if (result.success) {
      taskIds.push(result.taskId);
      console.log(`✅ Created task: ${taskInput.title}`);
    }
  }

  // Generate context for batch processing
  const context = aiTaskService.generateProjectContext(
    'Enterprise web application with microservices architecture'
  );

  // Perform batch processing with AI
  console.log('\n🤖 Running batch AI processing...');
  const batchResults = await aiTaskService.batchProcessWithAI(
    taskIds,
    context,
    ['analyze', 'decompose', 'optimize']
  );

  // Display results
  for (const [taskId, result] of batchResults) {
    const task = aiTaskService.getTask(taskId);
    console.log(`📋 ${task?.title}:`);
    
    if (result.success) {
      console.log(`  ✅ Processed successfully`);
      if (result.metadata && result.metadata['decompositionAnalysis']) {
        console.log(`  🔄 Decomposition analysis completed`);
      }
    } else {
      console.log(`  ❌ Processing failed: ${result.error}`);
    }
  }

  console.log('\n✨ Batch Processing Demo completed!');
}

// Run the demos
if (require.main === module) {
  (async () => {
    await demoAITaskDecomposition();
    await demoBatchProcessing();
  })().catch(console.error);
}

export { demoAITaskDecomposition, demoBatchProcessing }; 