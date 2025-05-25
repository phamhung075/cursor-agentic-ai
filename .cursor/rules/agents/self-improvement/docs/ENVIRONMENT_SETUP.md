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
   cp .cursor/rules/agents/_store/templates/environment-template.env .env
   # Edit .env with your API keys
   ```

3. **Start the Agent**
   ```bash
   npm run AAI:agent
   ```

4. **Test Memory System**
   ```