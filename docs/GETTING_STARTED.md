# Getting Started with the Task Management System

This guide will help you set up and start developing the Task Management System.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

## Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

4. **Database Setup**
   - Start your local MongoDB server or configure connection to Atlas
   - The application will create the necessary collections on first run

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start the application in development mode with nodemon for auto-reloading.

## Development Workflow

- **Code Style**: We follow the Airbnb JavaScript style guide
- **Branching Strategy**: Create feature branches from `main`
- **Testing**: Write tests for new features and run with `npm test`
- **Pull Requests**: All code changes should be submitted via pull requests

## Project Structure

```
task-management-system/
├── src/               # Source code
│   ├── controllers/   # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── tests/             # Test files
└── docs/              # Documentation
```

## API Documentation

The API endpoints will be documented in the [API.md](./API.md) file. 