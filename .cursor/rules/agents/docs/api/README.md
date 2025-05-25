# API Documentation

Complete REST API reference for the Intelligent Task Management System.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

The API uses Bearer token authentication:

```bash
Authorization: Bearer <your-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-01-25T12:00:00.000Z",
    "requestId": "req_123456789",
    "version": "1.0.0"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid task data",
    "metadata": { ... }
  },
  "metadata": {
    "timestamp": "2025-01-25T12:00:00.000Z",
    "requestId": "req_123456789",
    "version": "1.0.0"
  }
}
```

## Endpoints

### Tasks

#### Create Task

```http
POST /tasks
```

**Request Body:**

```json
{
  "title": "Implement user authentication",
  "description": "Build secure login and registration system",
  "type": "feature",
  "priority": "high",
  "complexity": "medium",
  "estimatedHours": 20,
  "assignee": "user123",
  "dueDate": "2025-02-15T00:00:00.000Z",
  "tags": ["auth", "security"],
  "metadata": {
    "domain": "backend",
    "framework": "express"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "taskId": "task_123456789",
    "task": {
      "id": "task_123456789",
      "title": "Implement user authentication",
      "description": "Build secure login and registration system",
      "type": "feature",
      "status": "pending",
      "priority": "high",
      "complexity": "medium",
      "estimatedHours": 20,
      "actualHours": null,
      "progress": 0,
      "assignee": "user123",
      "dueDate": "2025-02-15T00:00:00.000Z",
      "tags": ["auth", "security"],
      "dependencies": [],
      "children": [],
      "parent": null,
      "createdAt": "2025-01-25T12:00:00.000Z",
      "updatedAt": "2025-01-25T12:00:00.000Z",
      "metadata": {
        "domain": "backend",
        "framework": "express"
      }
    }
  }
}
```

#### Get Task

```http
GET /tasks/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "task": { ... }
  }
}
```

#### Update Task

```http
PUT /tasks/:id
```

**Request Body:**

```json
{
  "status": "in_progress",
  "progress": 25,
  "actualHours": 5
}
```

#### Delete Task

```http
DELETE /tasks/:id
```

#### Query Tasks

```http
GET /tasks
```

**Query Parameters:**

- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `priority` - Filter by priority (low, medium, high, critical)
- `assignee` - Filter by assignee
- `type` - Filter by type (feature, bug, task, epic)
- `tags` - Filter by tags (comma-separated)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sort` - Sort field (createdAt, updatedAt, priority, dueDate)
- `order` - Sort order (asc, desc)

**Example:**

```http
GET /tasks?status=in_progress&priority=high&page=1&limit=10&sort=dueDate&order=asc
```

#### Bulk Operations

```http
POST /tasks/bulk
```

**Request Body:**

```json
{
  "operation": "update",
  "taskIds": ["task_1", "task_2", "task_3"],
  "data": {
    "status": "completed"
  }
}
```

### AI Task Decomposition

#### Decompose Task

```http
POST /ai/decompose/:taskId
```

**Request Body:**

```json
{
  "strategy": "complexity_based",
  "maxDepth": 3,
  "minSubtasks": 2,
  "maxSubtasks": 8
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "decomposition": {
      "taskId": "task_123456789",
      "strategy": "complexity_based",
      "subtasks": [
        {
          "title": "Design authentication schema",
          "description": "Create database schema for users and sessions",
          "estimatedHours": 4,
          "complexity": "simple",
          "dependencies": []
        },
        {
          "title": "Implement password hashing",
          "description": "Add secure password hashing with bcrypt",
          "estimatedHours": 3,
          "complexity": "simple",
          "dependencies": []
        }
      ],
      "confidence": 0.85,
      "reasoning": [
        "Task complexity suggests 4-6 subtasks",
        "Authentication domain patterns applied",
        "Estimated 20 hours distributed across subtasks"
      ]
    }
  }
}
```

#### Get Complexity Assessment

```http
GET /ai/complexity/:taskId
```

#### Get Estimation

```http
GET /ai/estimation/:taskId
```

### Priority Management

#### Get Priority Score

```http
GET /priority/:taskId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "priorityScore": {
      "taskId": "task_123456789",
      "currentScore": 85.5,
      "factors": {
        "urgency": 0.8,
        "importance": 0.9,
        "dependencies": 0.7,
        "businessValue": 0.95,
        "effort": 0.6
      },
      "recommendation": "high",
      "reasoning": [
        "High business value impact",
        "Multiple dependent tasks",
        "Approaching deadline"
      ]
    }
  }
}
```

#### Update Priority

```http
PUT /priority/:taskId
```

**Request Body:**

```json
{
  "factors": {
    "urgency": 0.9,
    "importance": 0.8
  },
  "reason": "Deadline moved up"
}
```

#### Bulk Priority Update

```http
POST /priority/bulk-update
```

### Learning System

#### Get Learning Insights

```http
GET /learning/insights
```

**Response:**

```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "estimation_accuracy",
        "title": "Estimation Accuracy Improving",
        "description": "Task estimation accuracy has improved by 15% over the last month",
        "confidence": 0.92,
        "impact": "medium",
        "recommendations": [
          "Continue current estimation practices",
          "Focus on complex task breakdown"
        ]
      }
    ]
  }
}
```

#### Provide Feedback

```http
POST /learning/feedback
```

**Request Body:**

```json
{
  "taskId": "task_123456789",
  "feedbackType": "estimation_accuracy",
  "rating": 4,
  "comments": "Estimation was close but could be more accurate for UI tasks"
}
```

#### Get Recommendations

```http
GET /learning/recommendations
```

### Automation

#### Get Automation Rules

```http
GET /automation/rules
```

#### Create Automation Rule

```http
POST /automation/rules
```

**Request Body:**

```json
{
  "name": "Auto-assign high priority bugs",
  "description": "Automatically assign high priority bugs to senior developers",
  "trigger": {
    "event": "task_created",
    "conditions": {
      "type": "bug",
      "priority": "high"
    }
  },
  "actions": [
    {
      "type": "assign_task",
      "parameters": {
        "assigneePool": ["senior_dev_1", "senior_dev_2"],
        "strategy": "round_robin"
      }
    }
  ],
  "enabled": true
}
```

#### Execute Workflow

```http
POST /automation/workflows/:workflowId/execute
```

#### Get Automation Metrics

```http
GET /automation/metrics
```

### Real-time Events

#### WebSocket Connection

```javascript
const socket = io('ws://localhost:3000');

// Subscribe to task updates
socket.emit('subscribe', { channel: 'tasks' });

// Listen for task events
socket.on('task_updated', (data) => {
  console.log('Task updated:', data);
});

socket.on('task_created', (data) => {
  console.log('New task:', data);
});
```

#### Get Live Dashboard Data

```http
GET /realtime/dashboard
```

#### Get User Presence

```http
GET /realtime/presence
```

### Analytics

#### Get Task Analytics

```http
GET /analytics/tasks
```

**Query Parameters:**

- `period` - Time period (day, week, month, year)
- `startDate` - Start date for analysis
- `endDate` - End date for analysis
- `groupBy` - Group results by (status, priority, assignee, type)

**Response:**

```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalTasks": 150,
      "completedTasks": 120,
      "averageCompletionTime": 4.5,
      "tasksByStatus": {
        "pending": 10,
        "in_progress": 20,
        "completed": 120
      },
      "tasksByPriority": {
        "low": 30,
        "medium": 80,
        "high": 35,
        "critical": 5
      },
      "trends": [
        {
          "date": "2025-01-20",
          "completed": 8,
          "created": 12
        }
      ]
    }
  }
}
```

#### Get Performance Metrics

```http
GET /analytics/performance
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND_ERROR` | Resource not found |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Access denied |
| `RATE_LIMIT_ERROR` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `AI_SERVICE_ERROR` | AI service unavailable |
| `DATABASE_ERROR` | Database operation failed |

## Rate Limiting

The API implements rate limiting:

- **Standard endpoints**: 100 requests per minute
- **AI endpoints**: 20 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

## Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## WebSocket Events

### Task Events

- `task_created` - New task created
- `task_updated` - Task modified
- `task_deleted` - Task removed
- `task_status_changed` - Task status updated
- `task_assigned` - Task assigned to user

### System Events

- `user_connected` - User joined
- `user_disconnected` - User left
- `system_notification` - System-wide notification
- `automation_triggered` - Automation rule executed

### Subscription Management

```javascript
// Subscribe to specific task
socket.emit('subscribe', { 
  channel: 'task', 
  taskId: 'task_123456789' 
});

// Subscribe to user's tasks
socket.emit('subscribe', { 
  channel: 'user_tasks', 
  userId: 'user123' 
});

// Unsubscribe
socket.emit('unsubscribe', { 
  channel: 'tasks' 
});
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { TaskManagementAPI } from '@task-management/sdk';

const api = new TaskManagementAPI({
  baseURL: 'http://localhost:3000/api/v1',
  apiKey: 'your-api-key'
});

// Create a task
const task = await api.tasks.create({
  title: 'New feature',
  type: 'feature',
  priority: 'high'
});

// Get AI decomposition
const decomposition = await api.ai.decompose(task.id);

// Update priority
await api.priority.update(task.id, { urgency: 0.9 });
```

### Python

```python
from task_management import TaskManagementAPI

api = TaskManagementAPI(
    base_url='http://localhost:3000/api/v1',
    api_key='your-api-key'
)

# Create task
task = api.tasks.create({
    'title': 'New feature',
    'type': 'feature',
    'priority': 'high'
})

# Get analytics
analytics = api.analytics.get_task_analytics(period='month')
```

## Testing the API

### Using curl

```bash
# Create a task
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "Test task",
    "type": "feature",
    "priority": "medium"
  }'

# Get tasks
curl -X GET "http://localhost:3000/api/v1/tasks?status=pending" \
  -H "Authorization: Bearer your-token"
```

### Using Postman

Import the [Postman collection](./postman-collection.json) for easy API testing.

---

For more examples and advanced usage, see the [Developer Guide](../guides/developer-guide.md). 