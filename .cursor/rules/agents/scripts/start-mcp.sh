#!/bin/bash

# AAI System Enhanced MCP Server Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Set environment
export AAI_MODE=mcp
export NODE_ENV=production

# Start MCP server
echo "🚀 Starting AAI System Enhanced MCP Server..."
echo "Note: TypeScript warnings are expected but MCP functionality works"
npm start
