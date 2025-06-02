# Cursor Rules Management System

## Universal Development Lifecycle Rule Engine

An intelligent, context-aware rule management system that automatically detects project context and generates optimized Cursor IDE configurations throughout the entire software development lifecycle.

## Overview

The Cursor Rules Management System eliminates manual IDE configuration overhead and provides developers with context-perfect coding assistance by intelligently composing rules from a comprehensive library based on project characteristics, development phase, technology stack, and team requirements.

## Key Features

- **Intelligent Context Detection**: Automatic project analysis across multiple dimensions
- **Smart Rule Composition**: Conflict detection and resolution with intelligent merging
- **Universal Coverage**: Support for the entire development lifecycle
- **Zero-Configuration Experience**: Automatic rule generation and application

## Project Structure

```
YAMLManagerRules/
├── core/           - Core engine components
├── models/         - Data models and interfaces
├── utils/          - Utility functions
├── services/       - Service modules
├── config/         - Configuration files
└── tests/          - Test files
```

## Technology Stack

- TypeScript/Node.js 18+
- YAML for rule storage
- JSON Schema for validation
- Jest for testing
- ESLint + Prettier for linting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Cursor IDE

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd YAMLManagerRules

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development

```bash
# Start development with hot-reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT 