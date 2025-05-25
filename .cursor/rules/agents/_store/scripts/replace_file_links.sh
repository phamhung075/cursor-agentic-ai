#!/bin/bash

# Script to replace plain text file references with clickable links
# Usage: ./scripts/replace_file_links.sh

printf "🔗 Starting file reference replacement process...\n"
printf "📝 This will scan all files and replace plain text file references with clickable links\n"
printf "\n"

# Check if cursor_files_list.mdc exists
if [ ! -f ".cursor/rules/00__TOOLS/cursor_files_list.mdc" ]; then
    printf "❌ cursor_files_list.mdc not found. Running update_files.sh first...\n"
    ./scripts/update_files.sh
fi

# Run the Python script
python3 scripts/replace_file_links.py

printf "\n"
printf "🎯 File replacement process completed!\n"
printf "📋 All plain text file references have been converted to clickable links\n" 