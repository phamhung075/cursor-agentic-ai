# Cursor AI Automation Framework

A framework for building AI agents that can work with the Cursor IDE to automate software development tasks, interpret rules, manage context, and integrate with TaskMaster.

## Overview

The Cursor AI Automation Framework provides a structured environment for AI agents to collaborate on software projects, with capabilities for:

- Interpreting and enforcing cursor workspace rules
- Managing context across AI sessions
- Integrating with TaskMaster for task management
- Enabling communication between different types of AI agents
- Applying rule validation and optimization

## Project Structure

```
.cursor/rules/agents/
├── src/
│   ├── common/
│   │   └── types.ts           # Common type definitions
│   ├── rule-interpreter/
│   │   ├── ruleParser.ts      # Parses rule files in the workspace
│   │   ├── ruleInterpreter.ts # Interprets and applies rules
│   │   ├── ruleValidator.ts   # Validates rules for correctness
│   │   ├── ruleCache.ts       # Optimizes rule processing with caching
│   │   ├── ruleBenchmark.ts   # Utilities for benchmarking performance
│   │   └── index.ts           # Exports all rule interpreter components
│   ├── context-manager/
│   │   └── contextManager.ts  # Manages context files for task continuity
│   ├── task-manager/
│   │   └── taskMaster.ts      # Integrates with TaskMaster for task management
│   ├── agent-config/
│   │   └── agentConfig.ts     # Manages agent roles and permissions
│   └── agent-communication/
│       └── messageHub.ts      # Facilitates communication between agents
├── types/
│   └── micromatch.d.ts        # Type definitions for micromatch
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Completed Features

1. **Project Repository Setup**
   - Established directory structure
   - Set up TypeScript configuration
   - Defined base interfaces and types

2. **Rule Format Definition**
   - Created rule specification format
   - Defined rule metadata structure
   - Established rule application criteria

3. **Context File Templates**
   - Defined context file format
   - Implemented context update mechanisms
   - Created session tracking structure

4. **Agent Configuration**
   - Defined agent roles and permissions
   - Created configuration validation
   - Implemented activation triggers

5. **Rule Parser and Interpreter**
   - Developed rule parsing logic
   - Created rule interpretation engine
   - Implemented glob pattern matching

6. **Context Management System**
   - Implemented context file I/O
   - Created context update mechanisms
   - Established context serialization

7. **TaskMaster Integration**
   - Connected to TaskMaster API
   - Created task management wrappers
   - Implemented status tracking

8. **Agent Communication Protocol**
   - Defined message format
   - Implemented message hub
   - Created inter-agent communication

9. **Rule Validation System**
   - Implemented rule syntax validation
   - Created rule dependency resolution
   - Added error reporting mechanism

10. **Rule Processing Optimization**
    - Implemented caching for rule parsing
    - Optimized glob pattern matching
    - Created performance benchmarking tools

## Performance Optimizations

The framework includes several performance optimizations:

- **Caching System**: In-memory caching of parsed rules and applicable rules lookups
- **Efficient Glob Matching**: Using micromatch for more efficient pattern matching
- **LRU-like Cache Eviction**: Automatic management of cache size with oldest-first eviction
- **File Change Detection**: Automatic cache invalidation when rule files change
- **Benchmark Utilities**: Tools to measure and compare performance improvements

## Getting Started

### Prerequisites

- Node.js 16+
- TypeScript 4.5+
- Cursor IDE

### Installation

```bash
cd .cursor/rules/agents
npm install
```

### Running Benchmarks

```bash
cd .cursor/rules/agents
npx ts-node src/rule-interpreter/demoRuleBenchmark.ts
```

## License

MIT 
