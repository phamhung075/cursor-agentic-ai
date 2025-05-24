#!/bin/bash

# Script to update cursor_files_list.mdc with all project files
# Usage: ./scripts/update_files.sh

echo "🔄 Updating cursor_files_list.mdc with all project files..."

# Run the Python script
python3 scripts/update_file_list.py

echo "✅ File list update completed!"
echo "📄 Check .cursor/rules/00__TOOLS/cursor_files_list.mdc for the updated list" 