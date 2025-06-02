# Task Management System API

This document outlines the REST API endpoints for the Task Management System.

## Base URL

All API endpoints are relative to:

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT (JSON Web Token).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### User Management

#### Register User

```
POST /users/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "60d21b4667d0d8992e610c85"
}
```

#### Login

```
POST /users/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Task Management

#### Get All Tasks

```
GET /tasks
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, completed, in-progress)
- `priority` (optional): Filter by priority (high, medium, low)
- `limit` (optional): Number of tasks to return (default: 10)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "count": 15,
  "totalPages": 2,
  "currentPage": 1,
  "tasks": [
    {
      "id": "60d21b4667d0d8992e610c86",
      "title": "Finish project proposal",
      "description": "Complete the final draft of the project proposal",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2023-10-15T00:00:00.000Z",
      "createdAt": "2023-09-01T10:30:00.000Z",
      "updatedAt": "2023-09-05T14:25:00.000Z"
    },
    // More tasks...
  ]
}
```

#### Get Task by ID

```
GET /tasks/:id
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "60d21b4667d0d8992e610c86",
    "title": "Finish project proposal",
    "description": "Complete the final draft of the project proposal",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2023-10-15T00:00:00.000Z",
    "createdAt": "2023-09-01T10:30:00.000Z",
    "updatedAt": "2023-09-05T14:25:00.000Z"
  }
}
```

#### Create Task

```
POST /tasks
```

**Request Body:**
```json
{
  "title": "Prepare presentation",
  "description": "Create slides for the client meeting",
  "status": "pending",
  "priority": "medium",
  "dueDate": "2023-10-20T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": "60d21b4667d0d8992e610c87",
    "title": "Prepare presentation",
    "description": "Create slides for the client meeting",
    "status": "pending",
    "priority": "medium",
    "dueDate": "2023-10-20T00:00:00.000Z",
    "createdAt": "2023-09-07T09:45:00.000Z",
    "updatedAt": "2023-09-07T09:45:00.000Z"
  }
}
```

#### Update Task

```
PUT /tasks/:id
```

**Request Body:**
```json
{
  "status": "completed",
  "updatedAt": "2023-09-10T11:20:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": {
    "id": "60d21b4667d0d8992e610c87",
    "status": "completed",
    "updatedAt": "2023-09-10T11:20:00.000Z"
    // Other fields remain unchanged
  }
}
```

#### Delete Task

```
DELETE /tasks/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error 