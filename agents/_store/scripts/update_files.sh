#!/bin/bash

# Script to update cursor_files_list.mdc with all project files
# Usage: ./scripts/update_files.sh

printf "🔄 Updating cursor_files_list.mdc with all project files...\n"

# Run the Python script
python3 scripts/update_file_list.py

printf "✅ File list update completed!\n"
printf "📄 Check .cursor/rules/00__TOOLS/cursor_files_list.mdc for the updated list\n" 