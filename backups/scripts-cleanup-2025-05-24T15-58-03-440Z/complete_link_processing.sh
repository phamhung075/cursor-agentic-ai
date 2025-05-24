#!/bin/bash

# Complete script to process all file links: replacement + broken link fixing
# Usage: ./scripts/complete_link_processing.sh

echo "🚀 Starting complete file link processing workflow..."
echo "📝 This will:"
echo "   1. Update the file list"
echo "   2. Replace plain text file references with clickable links"
echo "   3. Fix any broken links created during replacement"
echo ""

# Step 1: Update file list
echo "📋 Step 1: Updating file list..."
./scripts/update_files.sh

echo ""

# Step 2: Replace file references
echo "🔗 Step 2: Replacing plain text file references..."
python3 scripts/replace_file_links.py

echo ""

# Step 3: Fix any broken links (if script didn't already run it)
echo "🔧 Step 3: Running final broken link check and repair..."
python3 scripts/fix_broken_links.py

echo ""
echo "✅ Complete file link processing workflow finished!"
echo "🎯 All file references are now properly formatted as clickable links" 