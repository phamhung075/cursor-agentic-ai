import { v4 as uuidv4 } from 'uuid';
import {
  TestDataRegistry as ITestDataRegistry,
  TestDataSet,
  DataGenerator,
  RandomFieldConfig
} from '../../types/TestingTypes';

/**
 * Test Data Registry
 * 
 * Manages test data sets, fixtures, and data generation for testing.
 */
export class TestDataRegistry implements ITestDataRegistry {
  private datasets: Map<string, TestDataSet> = new Map();

  /**
   * Register a test data set
   */
  public register(dataset: TestDataSet): void {
    this.datasets.set(dataset.name, dataset);
  }

  /**
   * Get a test data set by name
   */
  public get(name: string): TestDataSet | undefined {
    return this.datasets.get(name);
  }

  /**
   * Generate test data based on type and count
   */
  public generate(type: string, count: number): any[] {
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'task':
          results.push(this.generateTask());
          break;
        case 'user':
          results.push(this.generateUser());
          break;
        case 'automation_rule':
          results.push(this.generateAutomationRule());
          break;
        default:
          results.push(this.generateGeneric(type));
      }
    }

    return results;
  }

  /**
   * Clear all registered data sets
   */
  public clear(): void {
    this.datasets.clear();
  }

  /**
   * Get all registered data sets
   */
  public getAll(): TestDataSet[] {
    return Array.from(this.datasets.values());
  }

  /**
   * Generate a test task
   */
  private generateTask(): any {
    return {
      id: uuidv4(),
      title: `Test Task ${Math.floor(Math.random() * 1000)}`,
      description: 'Generated test task for testing purposes',
      type: this.randomChoice(['feature', 'bug', 'task', 'story']),
      status: this.randomChoice(['pending', 'in_progress', 'completed']),
      priority: this.randomChoice(['low', 'medium', 'high']),
      complexity: this.randomChoice(['simple', 'medium', 'complex']),
      estimatedHours: Math.floor(Math.random() * 40) + 1,
      actualHours: null,
      progress: Math.floor(Math.random() * 101),
      aiGenerated: Math.random() > 0.5,
      aiConfidence: Math.random(),
      parent: null,
      children: [],
      dependencies: [],
      tags: this.generateTags(),
      assignee: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    };
  }

  /**
   * Generate a test user
   */
  private generateUser(): any {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const name = this.randomChoice(names);
    
    return {
      id: uuidv4(),
      username: name.toLowerCase(),
      email: `${name.toLowerCase()}@test.com`,
      role: this.randomChoice(['admin', 'user', 'viewer']),
      permissions: ['read', 'write'],
      metadata: {
        department: this.randomChoice(['Engineering', 'Product', 'Design']),
        level: this.randomChoice(['Junior', 'Senior', 'Lead'])
      }
    };
  }

  /**
   * Generate a test automation rule
   */
  private generateAutomationRule(): any {
    return {
      id: uuidv4(),
      name: `Test Rule ${Math.floor(Math.random() * 100)}`,
      description: 'Generated automation rule for testing',
      trigger: {
        event: 'task_created',
        conditions: { priority: 'high' }
      },
      actions: [
        {
          type: 'notify',
          parameters: { message: 'High priority task created' }
        }
      ],
      enabled: true,
      createdAt: new Date().toISOString(),
      lastTriggered: null
    };
  }

  /**
   * Generate generic test data
   */
  private generateGeneric(type: string): any {
    return {
      id: uuidv4(),
      type,
      name: `Test ${type} ${Math.floor(Math.random() * 1000)}`,
      data: {
        randomValue: Math.random(),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate random tags
   */
  private generateTags(): string[] {
    const allTags = ['frontend', 'backend', 'api', 'ui', 'testing', 'bug', 'feature'];
    const count = Math.floor(Math.random() * 3) + 1;
    const tags: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const tag = this.randomChoice(allTags);
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  /**
   * Choose random item from array
   */
  private randomChoice<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index] as T;
  }

  /**
   * Generate data based on field configuration
   */
  private generateFieldValue(config: RandomFieldConfig): any {
    switch (config.type) {
      case 'string':
        return this.generateRandomString(config.min || 5, config.max || 20);
      case 'number':
        return this.generateRandomNumber(config.min || 0, config.max || 100);
      case 'boolean':
        return Math.random() > 0.5;
      case 'date':
        return new Date().toISOString();
      case 'enum':
        return config.options ? this.randomChoice(config.options) : 'default';
      case 'uuid':
        return uuidv4();
      default:
        return null;
    }
  }

  /**
   * Generate random string
   */
  private generateRandomString(min: number, max: number): string {
    const length = Math.floor(Math.random() * (max - min + 1)) + min;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Generate random number
   */
  private generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
} 