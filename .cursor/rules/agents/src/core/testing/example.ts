/**
* Testing Framework Example
* 
* Example of how to set up and use the comprehensive testing framework
* for the intelligent task management system.
*/

import { TaskManager } from '../tasks/TaskManager';
import { LearningService } from '../tasks/LearningService';
import { AutomationEngine } from '../automation/AutomationEngine';
import {
	TestRunner,
	TestSuite,
	Test,
	TestEnvironment,
	TestDataRegistry,
	MockServiceRegistry,
	AssertionRegistry,
	TestLogger,
	PerformanceTracker,
	CoverageCollector
} from './index';

/**
 * Example test environment setup
 */
function createTestEnvironment(): TestEnvironment {
	return {
		name: 'test',
		type: 'testing',
		database: {
			type: 'memory',
			config: { inMemory: true }
		},
		services: {
			taskManager: true,
			learningService: true,
			automationEngine: true,
			realTimeSync: false
		},
		mocking: {
			enabled: true,
			level: 'partial'
		},
		isolation: true,
		cleanup: true
	};
}

/**
 * Example test suite for TaskManager
 */
function createTaskManagerTestSuite(): TestSuite {
	return {
		id: 'task-manager-suite',
		name: 'Task Manager Test Suite',
		description: 'Comprehensive tests for TaskManager functionality',
		type: 'unit',
		priority: 'high',
		tests: [
			{
				id: 'test-create-task',
				name: 'Create Task Test',
				description: 'Test task creation functionality',
				type: 'unit',
				priority: 'high',
				testFunction: async (context) => {
					const taskManager = new TaskManager();

					context.logger.info('Testing task creation');
					context.performance.start('create-task');

					const result = await taskManager.createTask({
						title: 'Test Task',
						description: 'Test task description',
						type: 'feature',
						priority: 'medium',
						complexity: 'simple',
						estimatedHours: 4
					});

					const duration = context.performance.end('create-task');
					context.logger.info(`Task creation took ${duration}ms`);

					// Assertions
					context.assertions.assertTrue(result.success, 'Task creation should succeed');
					context.assertions.assertNotNull(result.taskId, 'Task ID should be generated');

					if (result.success && result.task) {
						context.assertions.assertEquals(result.task.title, 'Test Task', 'Task title should match');
						context.assertions.assertEquals(result.task.type, 'feature', 'Task type should match');
						context.assertions.assertEquals(result.task.status, 'pending', 'New task should be pending');
					}
				},
				timeout: 5000,
				retries: 0,
				tags: ['unit', 'task-manager', 'create'],
				dependencies: [],
				assertions: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			},
			{
				id: 'test-update-task',
				name: 'Update Task Test',
				description: 'Test task update functionality',
				type: 'unit',
				priority: 'high',
				testFunction: async (context) => {
					const taskManager = new TaskManager();

					// Create a task first
					const createResult = await taskManager.createTask({
						title: 'Test Task',
						description: 'Test task description',
						type: 'feature',
						priority: 'medium',
						complexity: 'simple',
						estimatedHours: 4
					});

					context.assertions.assertTrue(createResult.success, 'Task creation should succeed');

					if (createResult.success && createResult.taskId) {
						// Update the task
						context.performance.start('update-task');

						const updateResult = await taskManager.updateTask(createResult.taskId, {
							title: 'Updated Test Task',
							status: 'in_progress',
							progress: 50
						});

						const duration = context.performance.end('update-task');
						context.logger.info(`Task update took ${duration}ms`);

						// Assertions
						context.assertions.assertTrue(updateResult.success, 'Task update should succeed');

						if (updateResult.success && updateResult.task) {
							context.assertions.assertEquals(updateResult.task.title, 'Updated Test Task', 'Task title should be updated');
							context.assertions.assertEquals(updateResult.task.status, 'in_progress', 'Task status should be updated');
							context.assertions.assertEquals(updateResult.task.progress, 50, 'Task progress should be updated');
						}
					}
				},
				timeout: 5000,
				retries: 0,
				tags: ['unit', 'task-manager', 'update'],
				dependencies: [],
				assertions: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
		],
		timeout: 30000,
		retries: 1,
		parallel: true,
		tags: ['unit', 'task-manager'],
		dependencies: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

/**
 * Example integration test suite
 */
function createIntegrationTestSuite(): TestSuite {
	return {
		id: 'integration-suite',
		name: 'Integration Test Suite',
		description: 'Integration tests for system components',
		type: 'integration',
		priority: 'high',
		tests: [
			{
				id: 'test-task-learning-integration',
				name: 'Task-Learning Integration Test',
				description: 'Test integration between TaskManager and LearningService',
				type: 'integration',
				priority: 'high',
				testFunction: async (context) => {
					const taskManager = new TaskManager();
					const learningService = new LearningService(taskManager);

					context.logger.info('Testing task-learning integration');

					// Create a task
					const createResult = await taskManager.createTask({
						title: 'Integration Test Task',
						description: 'Test task for integration testing',
						type: 'feature',
						priority: 'high',
						complexity: 'medium',
						estimatedHours: 8
					});

					context.assertions.assertTrue(createResult.success, 'Task creation should succeed');

					if (createResult.success && createResult.taskId) {
						// Get learning prediction
						context.performance.start('learning-prediction');

						const prediction = await learningService.getIntelligentEstimation(createResult.taskId);

						const duration = context.performance.end('learning-prediction');
						context.logger.info(`Learning prediction took ${duration}ms`);

						// Assertions
						context.assertions.assertNotNull(prediction, 'Prediction should be returned');
						context.assertions.assertType(prediction.confidence, 'number', 'Confidence should be a number');
						context.assertions.assertTrue(prediction.confidence >= 0 && prediction.confidence <= 1, 'Confidence should be between 0 and 1');
					}
				},
				timeout: 10000,
				retries: 1,
				tags: ['integration', 'task-manager', 'learning'],
				dependencies: [],
				assertions: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
		],
		timeout: 60000,
		retries: 2,
		parallel: false,
		tags: ['integration'],
		dependencies: ['task-manager-suite'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

/**
 * Example performance test suite
 */
function createPerformanceTestSuite(): TestSuite {
	return {
		id: 'performance-suite',
		name: 'Performance Test Suite',
		description: 'Performance tests for system components',
		type: 'performance',
		priority: 'medium',
		tests: [
			{
				id: 'test-task-creation-performance',
				name: 'Task Creation Performance Test',
				description: 'Test performance of bulk task creation',
				type: 'performance',
				priority: 'medium',
				testFunction: async (context) => {
					const taskManager = new TaskManager();
					const taskCount = 100;

					context.logger.info(`Testing creation of ${taskCount} tasks`);
					context.performance.start('bulk-task-creation');

					const promises = [];
					for (let i = 0; i < taskCount; i++) {
						promises.push(taskManager.createTask({
							title: `Performance Test Task ${i}`,
							description: `Performance test task ${i}`,
							type: 'feature',
							priority: 'medium',
							complexity: 'simple',
							estimatedHours: 2
						}));
					}

					const results = await Promise.all(promises);
					const duration = context.performance.end('bulk-task-creation');

					context.logger.info(`Bulk task creation took ${duration}ms`);

					// Performance assertions
					const successfulTasks = results.filter(r => r.success).length;
					context.assertions.assertEquals(successfulTasks, taskCount, 'All tasks should be created successfully');
					context.assertions.assertTrue(duration < 5000, 'Bulk creation should complete within 5 seconds');

					const avgTimePerTask = duration / taskCount;
					context.assertions.assertTrue(avgTimePerTask < 50, 'Average time per task should be under 50ms');
				},
				timeout: 15000,
				retries: 0,
				tags: ['performance', 'task-manager', 'bulk'],
				dependencies: [],
				assertions: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
		],
		timeout: 30000,
		retries: 0,
		parallel: false,
		tags: ['performance'],
		dependencies: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

/**
 * Example of running the test framework
 */
async function runTestingExample() {
	try {
		console.log('🧪 Starting Testing Framework Example');

		// Create test environment
		const environment = createTestEnvironment();

		// Create test runner
		const testRunner = new TestRunner(environment);

		// Register test suites
		const taskManagerSuite = createTaskManagerTestSuite();
		const integrationSuite = createIntegrationTestSuite();
		const performanceSuite = createPerformanceTestSuite();

		testRunner.registerSuite(taskManagerSuite);
		testRunner.registerSuite(integrationSuite);
		testRunner.registerSuite(performanceSuite);

		console.log('📋 Registered test suites:');
		console.log(`  - ${taskManagerSuite.name} (${taskManagerSuite.tests.length} tests)`);
		console.log(`  - ${integrationSuite.name} (${integrationSuite.tests.length} tests)`);
		console.log(`  - ${performanceSuite.name} (${performanceSuite.tests.length} tests)`);

		// Run all tests
		console.log('\n🚀 Running all tests...');
		const report = await testRunner.runAll({
			parallel: true,
			maxConcurrency: 4,
			timeout: 30000,
			coverage: true,
			performance: true,
			verbose: true
		});

		// Display results
		console.log('\n📊 Test Results:');
		console.log(`  Total Suites: ${report.summary.totalSuites}`);
		console.log(`  Total Tests: ${report.summary.totalTests}`);
		console.log(`  Passed: ${report.summary.passed}`);
		console.log(`  Failed: ${report.summary.failed}`);
		console.log(`  Skipped: ${report.summary.skipped}`);
		console.log(`  Success Rate: ${report.summary.successRate.toFixed(2)}%`);
		console.log(`  Duration: ${report.summary.duration}ms`);
		console.log(`  Performance: ${report.summary.performance}`);

		if (report.coverage) {
			console.log(`  Coverage: ${report.coverage.overall.percentage.toFixed(2)}%`);
		}

		// Display recommendations
		if (report.recommendations.length > 0) {
			console.log('\n💡 Recommendations:');
			report.recommendations.forEach(rec => {
				console.log(`  - ${rec.title}: ${rec.description}`);
			});
		}

		console.log('\n✅ Testing framework example completed successfully');

		return report;

	} catch (error) {
		console.error('❌ Error running testing framework example:', error);
		throw error;
	}
}

/**
 * Example of individual test execution
 */
async function runIndividualTestExample() {
	console.log('🔬 Running individual test example');

	const environment = createTestEnvironment();
	const testRunner = new TestRunner(environment);

	// Register and run a single test
	const suite = createTaskManagerTestSuite();
	testRunner.registerSuite(suite);

	const testResult = await testRunner.runTest('test-create-task', {
		coverage: true,
		performance: true
	});

	console.log(`Test Result: ${testResult.status}`);
	console.log(`Duration: ${testResult.duration}ms`);
	console.log(`Assertions: ${testResult.assertions.length}`);

	return testResult;
}

// Export for use
export {
	createTestEnvironment,
	createTaskManagerTestSuite,
	createIntegrationTestSuite,
	createPerformanceTestSuite,
	runTestingExample,
	runIndividualTestExample
};

// Run example if this file is executed directly
if (require.main === module) {
	runTestingExample()
		.then(() => {
			console.log('🎉 Testing framework example completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Testing framework example failed:', error);
			process.exit(1);
		});
}