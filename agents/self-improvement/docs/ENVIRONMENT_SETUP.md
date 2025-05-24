# 🧠 Environment Setup for Self-Improvement Agent v2.0

## Required API Keys

### Pinecone (for Agent Memory)
1. Sign up at [https://app.pinecone.io/](https://app.pinecone.io/)
2. Create a new index named `agentic-framework-memory`
3. Copy your API key
4. Set environment variable: `PINECONE_API_KEY=your_api_key_here`

### OpenAI (for Embeddings)
1. Get API key from [https://platform.openai.com/](https://platform.openai.com/)
2. Set environment variable: `OPENAI_API_KEY=your_api_key_here`

## Environment Variables

Create a `.env` file in your project root:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Optional Settings
PINECONE_INDEX_NAME=agentic-framework-memory
MEMORY_RETENTION_DAYS=90
MAX_LOCAL_MEMORIES=1000
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the Agent**
   ```bash
   npm run agent
   ```

4. **Test Memory System**
   ```bash
   🤖 > memory stats
   🤖 > status
   ```

## Features

### 🧠 Memory System
- **Pinecone Integration**: Persistent vector memory for learning
- **Local Fallback**: Works without API keys using local storage
- **Context Awareness**: Remembers project contexts and user preferences
- **Learning**: Adapts suggestions based on user feedback

### 📁 File Management
- **Separated Storage**: Agent working files in `./agents/_store/`
- **Project Organization**: Each project gets its own directory
- **Migration Tools**: Migrate existing files to new structure

### 🎯 Smart Features
- **Context-Aware Analysis**: Analyzes files relevant to current work
- **Memory-Enhanced Suggestions**: Uses past feedback to improve recommendations
- **Pattern Recognition**: Learns successful patterns across projects

## Commands

### Memory Management
```bash
memory stats          # Show memory statistics
memory search <query> # Search stored memories
memory cleanup [days] # Clean old memories
```

### Project Management
```bash
projects list         # List all projects
projects set <name>   # Set current project
projects stats        # Show project statistics
migrate <project>     # Migrate existing files
```

### Analysis
```bash
analyze <file>        # Analyze specific file
context <topic>       # Set work context
smart-detect          # Context-aware analysis
status               # Show agent status
```

## Troubleshooting

### Memory Issues
- **No Pinecone**: Agent works with local memory only
- **No OpenAI**: Uses simple hash-based embeddings
- **Connection Errors**: Check API keys and network

### File Issues
- **Migration Errors**: Check file permissions
- **Missing Files**: Use `projects stats` to verify
- **Path Issues**: Ensure proper project setup

## Security

- **API Keys**: Never commit `.env` files to git
- **Local Storage**: Memory files stored in `agents/_store/memory/`
- **Permissions**: Agent only accesses its own storage directory 