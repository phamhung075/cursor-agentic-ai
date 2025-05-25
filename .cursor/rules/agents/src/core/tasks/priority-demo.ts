import { TaskManager } from './TaskManager';
import { PriorityService } from './PriorityService';
import { CreateTaskInput } from '../../types/TaskTypes';

/**
 * Demo script for Dynamic Priority Management System
 * 
 * This demonstrates the capabilities of the intelligent priority management system.
 */
async function demoDynamicPriorityManagement() {
  console.log('🎯 Starting Dynamic Priority Management Demo...\n');

  // Initialize the Task Manager and Priority Service
  const taskManager = new TaskManager();
  const priorityService = new PriorityService(taskManager);

  // Create sample tasks with different characteristics
  const sampleTasks: CreateTaskInput[] = [
    {
      title: 'Critical Security Patch',
      description: 'Fix critical security vulnerability in authentication system',
      type: 'bug',
      priority: 'medium', // Will be adjusted by priority system
      complexity: 'medium',
      estimatedHours: 8,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
      tags: ['security', 'critical', 'bug'],
      metadata: {
        businessValue: 'very-high',
        technicalRisk: 'high',
        userImpact: 'high'
      }
    },
    {
      title: 'User Dashboard Enhancement',
      description: 'Add new analytics widgets to user dashboard',
      type: 'feature',
      priority: 'high', // May be adjusted down
      complexity: 'medium',
      estimatedHours: 16,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 weeks
      tags: ['frontend', 'analytics', 'enhancement'],
      metadata: {
        businessValue: 'medium',
        technicalRisk: 'low',
        userImpact: 'medium'
      }
    },
    {
      title: 'Database Performance Optimization',
      description: 'Optimize database queries and add indexing for better performance',
      type: 'improvement',
      priority: 'low', // May be adjusted up due to blocking others
      complexity: 'complex',
      estimatedHours: 24,
      tags: ['database', 'performance', 'optimization'],
      metadata: {
        businessValue: 'high',
        technicalRisk: 'medium',
        userImpact: 'high'
      }
    },
    {
      title: 'API Documentation Update',
      description: 'Update API documentation with latest endpoint changes',
      type: 'task',
      priority: 'low',
      complexity: 'simple',
      estimatedHours: 4,
      tags: ['documentation', 'api'],
      metadata: {
        businessValue: 'low',
        technicalRisk: 'low',
        userImpact: 'low'
      }
    },
    {
      title: 'Mobile App Integration',
      description: 'Integrate new features with mobile application',
      type: 'feature',
      priority: 'medium',
      complexity: 'complex',
      estimatedHours: 32,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 1 week
      tags: ['mobile', 'integration', 'feature'],
      metadata: {
        businessValue: 'high',
        technicalRisk: 'medium',
        userImpact: 'high'
      }
    }
  ];

  const taskIds: string[] = [];

  // Create all tasks
  console.log('📋 Creating sample tasks...');
  for (const taskInput of sampleTasks) {
    const result = await taskManager.createTask(taskInput);
    if (result.success) {
      taskIds.push(result.taskId);
      console.log(`✅ Created: ${taskInput.title} (${taskInput.priority})`);
    }
  }

  // Add some dependencies to make it more realistic
  console.log('\n🔗 Setting up task dependencies...');
  
  // Database optimization should be done before mobile integration
  if (taskIds.length >= 5 && taskIds[4] && taskIds[2]) {
    await taskManager.updateTask(taskIds[4], { // Mobile app integration
      dependencies: [taskIds[2]] // Database optimization
    });
    console.log('✅ Mobile App Integration now depends on Database Optimization');
  }

  // Security patch blocks dashboard enhancement
  if (taskIds.length >= 2 && taskIds[1] && taskIds[0]) {
    await taskManager.updateTask(taskIds[1], { // Dashboard enhancement
      dependencies: [taskIds[0]] // Security patch
    });
    console.log('✅ Dashboard Enhancement now depends on Security Patch');
  }

  console.log('\n🤖 Analyzing priorities with AI...');

  // Get priority recommendations
  const recommendations = await priorityService.getPriorityRecommendations();
  
  console.log(`\n📊 Found ${recommendations.length} priority recommendations:`);
  
  for (let i = 0; i < Math.min(recommendations.length, 5); i++) {
    const rec = recommendations[i];
    const task = taskManager.getTask(rec.taskId);
    console.log(`\n${i + 1}. ${task?.title}`);
    console.log(`   Current: ${rec.currentPriority} → Recommended: ${rec.recommendedPriority}`);
    console.log(`   Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${rec.reasoning}`);
    console.log(`   Impact: ${rec.impact}, Urgency: ${rec.urgency}`);
  }

  // Apply some recommendations
  console.log('\n🔄 Applying high-confidence recommendations...');
  
  let appliedCount = 0;
  for (const rec of recommendations) {
    if (rec.confidence >= 0.8 && appliedCount < 3) {
      const result = await priorityService.applyPriorityRecommendation(rec.taskId);
      if (result.success) {
        const task = taskManager.getTask(rec.taskId);
        console.log(`✅ Updated "${task?.title}" priority: ${rec.currentPriority} → ${rec.recommendedPriority}`);
        appliedCount++;
      }
    }
  }

  // Show priority insights
  console.log('\n📈 Priority Management Insights:');
  const insights = priorityService.getPriorityInsights();
  
  console.log(`📊 Total tasks: ${insights.totalTasks}`);
  console.log(`🔄 Tasks needing adjustment: ${insights.tasksNeedingAdjustment}`);
  console.log(`🎯 Average confidence: ${(insights.averageConfidence * 100).toFixed(1)}%`);
  
  console.log('\n📋 Current Priority Distribution:');
  for (const [priority, count] of Object.entries(insights.priorityDistribution)) {
    if ((count as number) > 0) {
      console.log(`  ${priority}: ${count} tasks`);
    }
  }

  console.log('\n🎯 Recommended Priority Distribution:');
  for (const [priority, count] of Object.entries(insights.recommendedDistribution)) {
    if ((count as number) > 0) {
      console.log(`  ${priority}: ${count} tasks`);
    }
  }

  // Test automatic adjustments
  console.log('\n⚡ Testing automatic priority adjustments...');
  
  // Enable auto-adjustment (in real usage, this would run periodically)
  priorityService.enableAutoAdjustment(60); // Every 60 minutes
  
  // Run one cycle of automatic adjustments
  const autoResults = await priorityService.runAutomaticAdjustments();
  
  console.log(`🤖 Automatic adjustments completed:`);
  console.log(`   Total adjustments: ${autoResults.length}`);
  console.log(`   Successful: ${autoResults.filter(r => r.success).length}`);
  
  for (const result of autoResults) {
    if (result.success) {
      const task = taskManager.getTask(result.taskId);
      console.log(`   ✅ ${task?.title}: ${result.oldPriority} → ${result.newPriority}`);
    }
  }

  // Show final task list with updated priorities
  console.log('\n📋 Final Task List (with updated priorities):');
  const finalTasks = taskManager.queryTasks();
  
  // Sort by priority for display
  const priorityOrder = ['critical', 'urgent', 'high', 'medium', 'low'];
  finalTasks.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.priority);
    const bIndex = priorityOrder.indexOf(b.priority);
    return aIndex - bIndex;
  });

  for (const task of finalTasks) {
    const dueInfo = task.dueDate ? 
      ` (due ${new Date(task.dueDate).toLocaleDateString()})` : '';
    const depInfo = task.dependencies && task.dependencies.length > 0 ? 
      ` [${task.dependencies.length} deps]` : '';
    
    console.log(`  🎯 [${task.priority.toUpperCase()}] ${task.title}${dueInfo}${depInfo}`);
  }

  // Cleanup
  priorityService.disableAutoAdjustment();
  priorityService.destroy();

  console.log('\n✨ Dynamic Priority Management Demo completed!');
}

// Run the demo
if (require.main === module) {
  demoDynamicPriorityManagement().catch(console.error);
}

export { demoDynamicPriorityManagement }; 