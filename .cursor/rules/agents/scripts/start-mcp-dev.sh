#!/bin/bash

# AAI System Enhanced MCP Server Development Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Set environment
export AAI_MODE=mcp
export NODE_ENV=development

# Start MCP server in development mode
echo "🚀 Starting AAI System Enhanced MCP Server (Development Mode)..."
echo "Note: TypeScript warnings are expected but MCP functionality works"
npm run dev
