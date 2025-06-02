#!/bin/bash
npx task-master-ai "$@" 2>&1 | grep -v -E "\[FastMCP (warning|error)\]"
