#!/bin/bash

# Script to replace plain text file references with clickable links
# Usage: ./scripts/replace_file_links.sh

echo "🔗 Starting file reference replacement process..."
echo "📝 This will scan all files and replace plain text file references with clickable links"
echo ""

# Check if cursor_files_list.mdc exists
if [ ! -f ".cursor/rules/00__TOOLS/cursor_files_list.mdc" ]; then
    echo "❌ cursor_files_list.mdc not found. Running update_files.sh first..."
    ./scripts/update_files.sh
fi

# Run the Python script
python3 scripts/replace_file_links.py

echo ""
echo "🎯 File replacement process completed!"
echo "📋 All plain text file references have been converted to clickable links" 