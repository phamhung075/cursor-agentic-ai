#!/bin/bash

# MCP SSE Server Test Script
# A simple shell script to test the MCP server functionality

echo "🔍 Testing MCP SSE Server..."

# Test health endpoint
echo -e "\n🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3233/health)
echo "$HEALTH_RESPONSE"

# Create a temporary file for the SSE response
TMP_FILE=$(mktemp)
echo "Using temporary file: $TMP_FILE"

# Start SSE connection in the background
echo -e "\n🔌 Opening SSE connection..."
curl -s -N -H "Accept: text/event-stream" http://localhost:3233/sse > $TMP_FILE &
SSE_PID=$!

# Give the SSE connection time to establish
echo "Waiting for SSE connection to establish..."
sleep 2

# Extract the session URL from the SSE response
SESSION_URL=$(grep -m 1 "data:" $TMP_FILE | cut -d ":" -f 2- | tr -d '\n\r' | sed 's/^[ \t]*//')
echo "Session URL: $SESSION_URL"

# Check if we have a valid session URL
if [ -z "$SESSION_URL" ]; then
  echo "❌ Failed to get session URL. Check the SSE server."
  cat $TMP_FILE
  kill $SSE_PID
  rm $TMP_FILE
  exit 1
fi

# Extract the session ID from the URL
SESSION_ID=$(echo "$SESSION_URL" | grep -o "sessionId=[^&]*" | cut -d= -f2)
echo "Session ID: $SESSION_ID"

# Test initialize endpoint
echo -e "\n🚀 Testing initialize endpoint..."
INIT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0",
  "id": "init-1",
  "method": "initialize",
  "params": {
    "protocol_version": "2024-11-05",
    "client": {
      "name": "Shell Test Client",
      "version": "1.0.0"
    }
  }
}' "http://localhost:3233$SESSION_URL")
echo "$INIT_RESPONSE"

# Only proceed if initialization was successful (check for either result or success field)
if echo "$INIT_RESPONSE" | grep -q -E '"result"|"success":"?true'; then
  # Test tools.list endpoint
  echo -e "\n🔧 Testing tools.list endpoint..."
  TOOLS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "jsonrpc": "2.0",
    "id": "tools-1",
    "method": "mcp/tools.list",
    "params": {}
  }' "http://localhost:3233$SESSION_URL")
  echo "$TOOLS_RESPONSE"

  # Test resources.list endpoint
  echo -e "\n📚 Testing resources.list endpoint..."
  RESOURCES_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "jsonrpc": "2.0",
    "id": "resources-1",
    "method": "mcp/resources.list",
    "params": {}
  }' "http://localhost:3233$SESSION_URL")
  echo "$RESOURCES_RESPONSE"

  # Test prompts.list endpoint
  echo -e "\n💬 Testing prompts.list endpoint..."
  PROMPTS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "jsonrpc": "2.0",
    "id": "prompts-1",
    "method": "mcp/prompts.list",
    "params": {}
  }' "http://localhost:3233$SESSION_URL")
  echo "$PROMPTS_RESPONSE"

  # Test create_task tool
  echo -e "\n📝 Testing create_task tool..."
  CREATE_TASK_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "jsonrpc": "2.0",
    "id": "task-1",
    "method": "mcp/tools.call",
    "params": {
      "name": "create_task",
      "arguments": {
        "title": "Test Task Created via Shell Script",
        "description": "This is a test task created through the MCP protocol",
        "type": "task",
        "level": 3,
        "status": "pending",
        "priority": "medium",
        "complexity": "low",
        "tags": ["test", "mcp", "shell"]
      }
    }
  }' "http://localhost:3233$SESSION_URL")
  echo "$CREATE_TASK_RESPONSE"
else
  echo "❌ Initialization failed. Skipping remaining tests."
fi

# Clean up
echo -e "\n🧹 Cleaning up..."
kill $SSE_PID
rm $TMP_FILE

echo -e "\n✅ Test completed" 