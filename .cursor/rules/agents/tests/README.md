# MCP Tool Validation Tests

This directory contains the test suite for validating MCP server tools functionality (Task MCP-001).

## Overview

The MCP Tool Validation suite tests all MCP server tools via HTTP API communication, including:

- **Basic Tools**
  - create_task
  - get_task
  - update_task
  - list_tasks
  - delete_task

- **AI Tools**
  - decompose_task
  - analyze_complexity
  - calculate_priority
  - get_system_status

## Test Architecture

The test suite uses a standalone approach with the following components:

1. **Built-in HTTP Server**: The test suite includes its own HTTP server that simulates the MCP API endpoints, handling requests and providing appropriate responses.

2. **Test Runner**: The `run-mcp-tests.sh` script in the `scripts` directory orchestrates the test execution, dependency checks, and reporting.

3. **Test Cases**: Each MCP tool has dedicated test cases that verify functionality, error handling, and response formats.

## Running the Tests

To run the full test suite:

```bash
./scripts/run-mcp-tests.sh
```

The test runner will:
- Check all dependencies
- Verify test files exist
- Create a reports directory if needed
- Execute all test cases
- Display a comprehensive summary

## Test Results

Test results are saved to the `reports` directory in JSON format. The report includes:

- Overall test summary (pass/fail counts)
- Individual tool test results
- Performance metrics
- Environment information
- Recommendations

## Adding New Tests

To add new tests:

1. Extend the `MCPToolValidator` class in `mcp-tool-validation.js`
2. Add your test case to the appropriate section
3. Update the test configuration if needed

## Troubleshooting

If tests fail, check:

1. Dependencies are properly installed
2. Port 3333 is available for the test server
3. The test environment meets all requirements

For detailed error information, review the test output and logs.

## Next Steps

After successfully completing the MCP Tool Validation tests, proceed to:

1. Task MCP-002: MCP Workflow Automation Setup
2. Task MCP-003: MCP Server Performance Testing 