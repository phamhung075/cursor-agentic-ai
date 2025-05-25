# Developer Guide

Complete guide for developers working with the Intelligent Task Management System.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Component Development](#component-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **TypeScript** 5.0.0 or higher
- **SQLite** 3.35.0 or higher
- **Git** for version control

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd intelligent-task-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database:**
   ```bash
   npm run db:setup
   npm run db:migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Environment Variables

```bash
# Database
DATABASE_PATH=./data/tasks.db
DATABASE_MAX_CONNECTIONS=10

# AI Services
AI_PROVIDER=openai
AI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000

# Server
PORT=3000
HOST=localhost
NODE_ENV=development

# Real-time
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

## Development Environment

### IDE Configuration

#### VS Code Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

#### Recommended Extensions

- TypeScript Importer
- ESLint
- Prettier
- Jest
- SQLite Viewer
- REST Client

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:watch        # Start with file watching
npm run dev:debug        # Start with debugging enabled

# Building
npm run build            # Build for production
npm run build:watch      # Build with watching
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Database
npm run db:setup         # Initialize database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:reset         # Reset database
```

## Project Structure

```
src/
├── core/                    # Core system components
│   ├── tasks/              # Task management
│   │   ├── TaskManager.ts
│   │   ├── TaskHierarchyEngine.ts
│   │   └── index.ts
│   ├── ai/                 # AI services
│   │   ├── AITaskDecomposer.ts
│   │   ├── ComplexityAssessor.ts
│   │   └── index.ts
│   ├── automation/         # Automation engine
│   │   ├── AutomationEngine.ts
│   │   ├── RuleEngine.ts
│   │   ├── WorkflowManager.ts
│   │   └── index.ts
│   ├── learning/           # Learning system
│   │   ├── AdaptiveLearningEngine.ts
│   │   ├── LearningService.ts
│   │   └── index.ts
│   ├── priority/           # Priority management
│   │   ├── DynamicPriorityManager.ts
│   │   └── index.ts
│   ├── realtime/           # Real-time features
│   │   ├── WebSocketManager.ts
│   │   ├── SynchronizationService.ts
│   │   └── index.ts
│   └── testing/            # Testing framework
│       ├── TestRunner.ts
│       ├── MockServiceRegistry.ts
│       └── index.ts
├── api/                    # REST API
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/            # Route definitions
│   └── server.ts          # Express server
├── types/                  # TypeScript definitions
│   ├── TaskTypes.ts
│   ├── AutomationTypes.ts
│   ├── APITypes.ts
│   └── index.ts
├── utils/                  # Utility functions
│   ├── logger.ts
│   ├── validation.ts
│   └── helpers.ts
└── config/                 # Configuration
    ├── database.ts
    ├── ai.ts
    └── server.ts

tests/                      # Test suites
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── performance/            # Performance tests
└── fixtures/               # Test data

docs/                       # Documentation
├── api/                    # API documentation
├── guides/                 # User guides
└── components/             # Component docs
```

## Core Concepts

### Task Hierarchy

The system uses a tree-based structure for task organization:

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: TaskComplexity;
  parent?: string;
  children: string[];
  dependencies: string[];
  // ... other fields
}
```

### Event-Driven Architecture

Components communicate through events:

```typescript
// Emit events
this.emit('task_created', { taskId, task });

// Listen to events
taskManager.on('task_updated', (data) => {
  // Handle task update
});
```

### AI Integration

AI services are abstracted through interfaces:

```typescript
interface AIService {
  decomposeTask(taskId: string): Promise<DecompositionResult>;
  assessComplexity(task: Task): Promise<ComplexityAssessment>;
  estimateEffort(task: Task): Promise<EffortEstimation>;
}
```

## Component Development

### Creating a New Component

1. **Define the interface:**
   ```typescript
   // src/types/MyComponentTypes.ts
   export interface MyComponent {
     initialize(): Promise<void>;
     process(data: any): Promise<Result>;
     destroy(): void;
   }
   ```

2. **Implement the component:**
   ```typescript
   // src/core/mycomponent/MyComponent.ts
   import { EventEmitter } from 'events';
   import { MyComponent as IMyComponent } from '../../types/MyComponentTypes';

   export class MyComponent extends EventEmitter implements IMyComponent {
     constructor() {
       super();
     }

     async initialize(): Promise<void> {
       // Initialization logic
       this.emit('initialized');
     }

     async process(data: any): Promise<Result> {
       // Processing logic
       this.emit('processed', { data });
       return result;
     }

     destroy(): void {
       this.removeAllListeners();
     }
   }
   ```

3. **Add tests:**
   ```typescript
   // tests/unit/MyComponent.test.ts
   import { MyComponent } from '../../src/core/mycomponent/MyComponent';

   describe('MyComponent', () => {
     let component: MyComponent;

     beforeEach(() => {
       component = new MyComponent();
     });

     afterEach(() => {
       component.destroy();
     });

     it('should initialize correctly', async () => {
       await component.initialize();
       // Assertions
     });
   });
   ```

### Integration Patterns

#### Service Registration

```typescript
// src/core/ServiceRegistry.ts
export class ServiceRegistry {
  private services: Map<string, any> = new Map();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    return this.services.get(name);
  }
}
```

#### Dependency Injection

```typescript
// src/core/Container.ts
export class Container {
  private dependencies: Map<string, any> = new Map();

  bind<T>(token: string, factory: () => T): void {
    this.dependencies.set(token, factory);
  }

  resolve<T>(token: string): T {
    const factory = this.dependencies.get(token);
    if (!factory) {
      throw new Error(`Dependency ${token} not found`);
    }
    return factory();
  }
}
```

## Testing

### Testing Strategy

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test component interactions
3. **Performance Tests** - Test system performance
4. **End-to-End Tests** - Test complete workflows

### Writing Unit Tests

```typescript
import { TaskManager } from '../../src/core/tasks/TaskManager';
import { MockDatabase } from '../mocks/MockDatabase';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = new MockDatabase();
    taskManager = new TaskManager(mockDb);
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        type: 'feature' as const,
        priority: 'medium' as const
      };

      const result = await taskManager.createTask(taskData);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(mockDb.tasks).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      const invalidData = { title: '' };

      const result = await taskManager.createTask(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('title is required');
    });
  });
});
```

### Integration Testing

```typescript
import { TestRunner } from '../../src/core/testing/TestRunner';
import { TaskManager } from '../../src/core/tasks/TaskManager';
import { AITaskDecomposer } from '../../src/core/ai/AITaskDecomposer';

describe('Task Management Integration', () => {
  let testRunner: TestRunner;
  let taskManager: TaskManager;
  let aiDecomposer: AITaskDecomposer;

  beforeEach(async () => {
    testRunner = new TestRunner({
      name: 'integration',
      type: 'testing',
      database: { type: 'memory', config: {} },
      services: {
        taskManager: true,
        learningService: true,
        automationEngine: false,
        realTimeSync: false
      },
      mocking: { enabled: true, level: 'partial' },
      isolation: true,
      cleanup: true
    });

    taskManager = new TaskManager();
    aiDecomposer = new AITaskDecomposer();
  });

  it('should decompose complex tasks', async () => {
    // Create a complex task
    const task = await taskManager.createTask({
      title: 'Build authentication system',
      complexity: 'complex',
      estimatedHours: 40
    });

    // Decompose the task
    const decomposition = await aiDecomposer.decomposeTask(task.taskId!);

    expect(decomposition.success).toBe(true);
    expect(decomposition.subtasks).toHaveLength(4);
  });
});
```

### Performance Testing

```typescript
import { PerformanceTracker } from '../../src/core/testing/PerformanceTracker';
import { TaskManager } from '../../src/core/tasks/TaskManager';

describe('Performance Tests', () => {
  let taskManager: TaskManager;
  let performance: PerformanceTracker;

  beforeEach(() => {
    taskManager = new TaskManager();
    performance = new PerformanceTracker();
  });

  it('should handle 1000 task operations within 5 seconds', async () => {
    performance.start('bulk_operations');

    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(taskManager.createTask({
        title: `Task ${i}`,
        type: 'task',
        priority: 'medium'
      }));
    }

    await Promise.all(promises);
    const duration = performance.end('bulk_operations');

    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

## Debugging

### Debug Configuration

```typescript
// src/utils/logger.ts
import debug from 'debug';

export const debugTask = debug('app:task');
export const debugAI = debug('app:ai');
export const debugAutomation = debug('app:automation');

// Usage
debugTask('Creating task: %O', taskData);
```

### Error Handling

```typescript
// src/utils/errors.ts
export class TaskManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: any
  ) {
    super(message);
    this.name = 'TaskManagementError';
  }
}

// Usage
throw new TaskManagementError(
  'Task not found',
  'TASK_NOT_FOUND',
  404,
  { taskId }
);
```

### Debugging Tools

1. **VS Code Debugger Configuration:**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug App",
     "program": "${workspaceFolder}/src/index.ts",
     "outFiles": ["${workspaceFolder}/dist/**/*.js"],
     "env": {
       "NODE_ENV": "development",
       "DEBUG": "app:*"
     }
   }
   ```

2. **Chrome DevTools:**
   ```bash
   node --inspect-brk dist/index.js
   ```

## Performance

### Optimization Guidelines

1. **Database Queries:**
   ```typescript
   // Use indexes for frequent queries
   await db.query(`
     CREATE INDEX idx_tasks_status ON tasks(status);
     CREATE INDEX idx_tasks_assignee ON tasks(assignee);
   `);

   // Batch operations
   const tasks = await taskManager.bulkCreate(taskDataArray);
   ```

2. **Memory Management:**
   ```typescript
   // Clean up event listeners
   component.removeAllListeners();

   // Use weak references for caches
   const cache = new WeakMap();
   ```

3. **Async Operations:**
   ```typescript
   // Use Promise.all for parallel operations
   const [tasks, analytics, metrics] = await Promise.all([
     taskManager.getTasks(),
     analyticsService.getMetrics(),
     performanceService.getStats()
   ]);
   ```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  measure(operation: string, fn: () => Promise<any>): Promise<any> {
    const start = Date.now();
    
    return fn().finally(() => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
    });
  }

  private recordMetric(operation: string, duration: number): void {
    const metrics = this.metrics.get(operation) || [];
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.metrics.set(operation, metrics);
  }

  getAverageTime(operation: string): number {
    const metrics = this.metrics.get(operation) || [];
    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
  }
}
```

## Best Practices

### Code Organization

1. **Single Responsibility Principle:**
   ```typescript
   // Good: Each class has one responsibility
   class TaskValidator {
     validate(task: Task): ValidationResult { }
   }

   class TaskRepository {
     save(task: Task): Promise<void> { }
     findById(id: string): Promise<Task> { }
   }
   ```

2. **Dependency Inversion:**
   ```typescript
   // Good: Depend on abstractions
   class TaskService {
     constructor(
       private repository: TaskRepository,
       private validator: TaskValidator
     ) {}
   }
   ```

### Error Handling

```typescript
// Consistent error handling
async function processTask(taskId: string): Promise<TaskOperationResult> {
  try {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      return {
        success: false,
        error: 'Task not found',
        errorCode: 'TASK_NOT_FOUND'
      };
    }

    // Process task
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to process task', { taskId, error });
    return {
      success: false,
      error: 'Internal error',
      errorCode: 'INTERNAL_ERROR'
    };
  }
}
```

### Type Safety

```typescript
// Use strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// Define comprehensive types
interface TaskCreateRequest {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  complexity?: TaskComplexity;
  estimatedHours?: number;
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### Testing Best Practices

1. **Test Structure:**
   ```typescript
   describe('Component', () => {
     describe('method', () => {
       it('should handle normal case', () => {});
       it('should handle edge case', () => {});
       it('should handle error case', () => {});
     });
   });
   ```

2. **Mock External Dependencies:**
   ```typescript
   jest.mock('../../src/external/AIService', () => ({
     AIService: jest.fn().mockImplementation(() => ({
       analyze: jest.fn().mockResolvedValue({ confidence: 0.8 })
     }))
   }));
   ```

## Contributing

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/new-component
   ```

2. **Make changes and add tests:**
   ```bash
   # Implement feature
   # Add tests
   npm run test
   ```

3. **Ensure code quality:**
   ```bash
   npm run lint
   npm run type-check
   npm run test:coverage
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add new component"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/new-component
   # Create pull request
   ```

### Code Review Guidelines

- **Functionality**: Does the code work as intended?
- **Readability**: Is the code easy to understand?
- **Performance**: Are there any performance concerns?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code properly documented?

### Release Process

1. **Version bump:**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and test:**
   ```bash
   npm run build
   npm run test:all
   ```

3. **Create release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

---

For more information, see the [API Documentation](../api/README.md) and [Architecture Guide](./architecture.md). 