#!/bin/bash

# Script to update cursor_files_list.mdc with .cursor/rules files only
# Usage: ./scripts/update_cursor_rules_files.sh

echo "🔄 Updating cursor_files_list.mdc with .cursor/rules files..."

# Run the Python script
python3 scripts/update_cursor_rules_files.py

echo "✅ .cursor/rules file list update completed!"
echo "📄 Check .cursor/rules/00__TOOLS/cursor_files_list.mdc for the updated list" 