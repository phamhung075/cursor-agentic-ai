#!/bin/bash

# 🎯 AAI System Enhanced - Cursor MCP Integration Setup Script
# Automates the setup process for integrating AAI MCP server with Cursor IDE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURSOR_CONFIG_DIR="$HOME/.cursor"
MCP_CONFIG_DIR="$CURSOR_CONFIG_DIR/mcp"

echo -e "${BLUE}🎯 AAI System Enhanced - Cursor MCP Integration Setup${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm $(npm --version) found"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found. Please run this script from the AAI project directory."
    exit 1
fi
print_status "AAI project directory confirmed"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check for MCP SDK
if ! npm list @modelcontextprotocol/sdk &> /dev/null; then
    print_info "Installing MCP SDK..."
    npm install @modelcontextprotocol/sdk
    print_status "MCP SDK installed"
else
    print_status "MCP SDK already installed"
fi

# Build the project
echo ""
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build
print_status "Project built successfully"

# Test MCP server
echo ""
echo -e "${BLUE}🧪 Testing MCP server...${NC}"
print_info "Starting MCP server test..."

# Start MCP server in background and test it
timeout 10s bash -c '
    AAI_MODE=mcp npm start &
    MCP_PID=$!
    sleep 5
    if kill -0 $MCP_PID 2>/dev/null; then
        echo "MCP server started successfully"
        kill $MCP_PID
        exit 0
    else
        echo "MCP server failed to start"
        exit 1
    fi
' && print_status "MCP server test passed" || {
    print_error "MCP server test failed"
    exit 1
}

# Create Cursor configuration directory
echo ""
echo -e "${BLUE}📁 Setting up Cursor configuration...${NC}"

if [ ! -d "$CURSOR_CONFIG_DIR" ]; then
    mkdir -p "$CURSOR_CONFIG_DIR"
    print_status "Created Cursor config directory: $CURSOR_CONFIG_DIR"
fi

if [ ! -d "$MCP_CONFIG_DIR" ]; then
    mkdir -p "$MCP_CONFIG_DIR"
    print_status "Created MCP config directory: $MCP_CONFIG_DIR"
fi

# Generate MCP configuration
MCP_CONFIG_FILE="$MCP_CONFIG_DIR/aai-config.json"
cat > "$MCP_CONFIG_FILE" << EOF
{
  "name": "aai-system-enhanced",
  "description": "AAI System Enhanced - Intelligent Task Management MCP Server",
  "version": "2.0.0",
  "command": "npm",
  "args": ["start"],
  "cwd": "$PROJECT_ROOT",
  "env": {
    "AAI_MODE": "mcp",
    "NODE_ENV": "production"
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  },
  "tools": [
    "create_task",
    "update_task", 
    "get_task",
    "list_tasks",
    "delete_task",
    "decompose_task",
    "analyze_complexity",
    "calculate_priority",
    "get_system_status"
  ],
  "resources": [
    "task://{taskId}",
    "project://{projectId}/tasks"
  ],
  "prompts": [
    "task-analysis",
    "priority-assessment"
  ]
}
EOF

print_status "Generated MCP configuration: $MCP_CONFIG_FILE"

# Generate Cursor settings template
CURSOR_SETTINGS_TEMPLATE="$MCP_CONFIG_DIR/cursor-settings-template.json"
cat > "$CURSOR_SETTINGS_TEMPLATE" << EOF
{
  "mcp": {
    "servers": {
      "aai-system-enhanced": {
        "command": "npm",
        "args": ["start"],
        "cwd": "$PROJECT_ROOT",
        "env": {
          "AAI_MODE": "mcp"
        },
        "description": "AAI System Enhanced - Intelligent Task Management",
        "capabilities": {
          "tools": true,
          "resources": true,
          "prompts": true
        }
      }
    }
  }
}
EOF

print_status "Generated Cursor settings template: $CURSOR_SETTINGS_TEMPLATE"

# Create startup script
STARTUP_SCRIPT="$PROJECT_ROOT/scripts/start-mcp.sh"
mkdir -p "$(dirname "$STARTUP_SCRIPT")"
cat > "$STARTUP_SCRIPT" << 'EOF'
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
npm start
EOF

chmod +x "$STARTUP_SCRIPT"
print_status "Created startup script: $STARTUP_SCRIPT"

# Create development script
DEV_SCRIPT="$PROJECT_ROOT/scripts/start-mcp-dev.sh"
cat > "$DEV_SCRIPT" << 'EOF'
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
npm run dev
EOF

chmod +x "$DEV_SCRIPT"
print_status "Created development script: $DEV_SCRIPT"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Add MCP server to Cursor settings:${NC}"
echo "   - Open Cursor IDE"
echo "   - Go to Settings (Cmd/Ctrl + ,)"
echo "   - Add the following to your settings.json:"
echo ""
echo -e "${BLUE}   Copy from: $CURSOR_SETTINGS_TEMPLATE${NC}"
echo ""
echo "2. ${YELLOW}Test the integration:${NC}"
echo "   - Restart Cursor IDE"
echo "   - Open the command palette (Cmd/Ctrl + Shift + P)"
echo "   - Look for MCP tools starting with 'aai-system-enhanced'"
echo ""
echo "3. ${YELLOW}Manual startup (if needed):${NC}"
echo "   - Production: $STARTUP_SCRIPT"
echo "   - Development: $DEV_SCRIPT"
echo ""
echo "4. ${YELLOW}Documentation:${NC}"
echo "   - Full guide: $PROJECT_ROOT/docs/CURSOR_MCP_INTEGRATION.md"
echo "   - API reference: $PROJECT_ROOT/README.md"
echo ""
echo -e "${GREEN}✨ Happy coding with intelligent task management!${NC}"
echo ""

# Offer to open documentation
read -p "Would you like to open the integration guide? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code "$PROJECT_ROOT/docs/CURSOR_MCP_INTEGRATION.md"
    elif command -v cursor &> /dev/null; then
        cursor "$PROJECT_ROOT/docs/CURSOR_MCP_INTEGRATION.md"
    else
        print_info "Please open: $PROJECT_ROOT/docs/CURSOR_MCP_INTEGRATION.md"
    fi
fi 