#!/bin/bash

# Script to fix broken links created by the file replacement process
# Usage: ./scripts/fix_broken_links.sh

echo "🔧 Starting broken link detection and repair process..."
echo "🔍 This will scan all .mdc files and fix malformed links"
echo ""

# Run the Python script
python3 scripts/fix_broken_links.py

echo ""
echo "✅ Broken link repair process completed!"
echo "📋 All malformed links have been fixed with correct paths" 