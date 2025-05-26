#!/bin/bash

# MCP Tool Validation Test Runner
# For Task MCP-001 - MCP Server Tool Validation

# ANSI Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RESET='\033[0m'

# Function to print colorful status messages
print_status() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${RESET} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${RESET} $1"
}

print_header() {
    echo -e "\n${PURPLE}====== $1 ======${RESET}\n"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_deps=0
    
    # Check for Node.js
    if command_exists node; then
        local node_version=$(node --version)
        print_success "Node.js is installed (${node_version})"
    else
        print_error "Node.js is not installed"
        missing_deps=1
    fi
    
    # Check for npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_success "npm is installed (${npm_version})"
    else
        print_error "npm is not installed"
        missing_deps=1
    fi
    
    # Express (needed for tests)
    if npm list express >/dev/null 2>&1; then
        print_success "Express is installed"
    else
        print_warning "Express is not installed, installing now..."
        npm install express --no-fund --no-audit
        if [ $? -eq 0 ]; then
            print_success "Express installed successfully"
        else
            print_error "Failed to install Express"
            missing_deps=1
        fi
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Some dependencies are missing. Please install them and try again."
        exit 1
    else
        print_success "All dependencies are satisfied"
    fi
}

# Verify test files exist
verify_test_files() {
    print_header "Verifying Test Files"
    
    local test_file="tests/mcp-tool-validation.js"
    
    if [ -f "$test_file" ]; then
        print_success "Found test file: $test_file"
    else
        print_error "Test file not found: $test_file"
        exit 1
    fi
}

# Create reports directory if it doesn't exist
setup_reports_dir() {
    print_header "Setting Up Reports Directory"
    
    local reports_dir="reports"
    if [ ! -d "$reports_dir" ]; then
        mkdir -p "$reports_dir"
        print_success "Created reports directory: $reports_dir"
    else
        print_success "Reports directory already exists: $reports_dir"
    fi
}

# Run the tests
run_tests() {
    print_header "Running MCP Tool Validation Tests"
    
    print_status "Starting tests..."
    
    node tests/mcp-tool-validation.js
    local test_exit_code=$?
    
    if [ $test_exit_code -eq 0 ]; then
        print_success "All tests passed successfully!"
        return 0
    else
        print_error "Tests failed with exit code: $test_exit_code"
        return 1
    fi
}

# Main function to orchestrate the test process
main() {
    print_header "MCP Tool Validation Test Runner"
    
    # Get current directory and navigate to project root
    local current_dir=$(pwd)
    local script_dir=$(dirname "$0")
    cd "$script_dir/.." || exit 1
    
    print_status "Working directory: $(pwd)"
    
    check_dependencies
    verify_test_files
    setup_reports_dir
    
    run_tests
    local test_result=$?
    
    # Return to original directory
    cd "$current_dir" || exit 1
    
    if [ $test_result -eq 0 ]; then
        print_success "MCP Tool Validation Test Runner completed successfully."
        exit 0
    else
        print_error "MCP Tool Validation Test Runner completed with errors."
        exit 1
    fi
}

# Run the main function
main 