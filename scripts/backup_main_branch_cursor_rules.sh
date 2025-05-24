#!/bin/bash

# Script to backup all .cursor/rules content from main branch
# This preserves the original/clean state from main branch

set -e  # Exit on any error

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="backups/main-branch-cursor-rules-$TIMESTAMP"

echo "🔄 Creating backup of .cursor/rules from main branch..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# Get list of all files in .cursor/rules from main branch
echo "🔍 Getting file list from main branch..."
git ls-tree -r --name-only main -- .cursor/rules/ > "$BACKUP_DIR/file_list.txt"

if [ ! -s "$BACKUP_DIR/file_list.txt" ]; then
    echo "❌ No files found in main branch .cursor/rules"
    exit 1
fi

FILE_COUNT=$(wc -l < "$BACKUP_DIR/file_list.txt")
echo "📄 Found $FILE_COUNT files in main branch .cursor/rules"
echo ""

# Create directory structure and extract each file
echo "📂 Creating directory structure and extracting files..."
EXTRACTED=0
FAILED=0

while IFS= read -r file; do
    # Create directory structure
    DIR=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$DIR"
    
    # Extract file content from main branch
    if git show "main:$file" > "$BACKUP_DIR/$file" 2>/dev/null; then
        EXTRACTED=$((EXTRACTED + 1))
        echo "  ✅ Extracted: $file"
    else
        FAILED=$((FAILED + 1))
        echo "  ❌ Failed: $file"
    fi
done < "$BACKUP_DIR/file_list.txt"

echo ""
echo "📊 BACKUP SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Backup Location: $BACKUP_DIR"
echo "📄 Total Files: $FILE_COUNT"
echo "✅ Successfully Extracted: $EXTRACTED"
echo "❌ Failed: $FAILED"
echo ""

# Create index file
echo "📋 Creating backup index..."
cat > "$BACKUP_DIR/BACKUP_INFO.md" << EOF
# Main Branch .cursor/rules Backup

**Created**: $(date)
**Source Branch**: main
**Backup Location**: $BACKUP_DIR
**Total Files**: $FILE_COUNT
**Successfully Extracted**: $EXTRACTED
**Failed**: $FAILED

## How to Use This Backup

### Restore entire .cursor/rules from main branch:
\`\`\`bash
# Replace current .cursor/rules with main branch version
rm -rf .cursor/rules
cp -r $BACKUP_DIR/.cursor/rules .cursor/
\`\`\`

### Restore specific file:
\`\`\`bash
# Example: restore a specific file
cp $BACKUP_DIR/.cursor/rules/01__AI-RUN/00_Getting_Started.mdc .cursor/rules/01__AI-RUN/
\`\`\`

### Compare with current version:
\`\`\`bash
# Compare a file
diff .cursor/rules/01__AI-RUN/00_Getting_Started.mdc $BACKUP_DIR/.cursor/rules/01__AI-RUN/00_Getting_Started.mdc
\`\`\`

## File List
EOF

# Add file list to backup info
echo "" >> "$BACKUP_DIR/BACKUP_INFO.md"
echo "\`\`\`" >> "$BACKUP_DIR/BACKUP_INFO.md"
cat "$BACKUP_DIR/file_list.txt" >> "$BACKUP_DIR/BACKUP_INFO.md"
echo "\`\`\`" >> "$BACKUP_DIR/BACKUP_INFO.md"

echo "✅ MAIN BRANCH BACKUP COMPLETE!"
echo ""
echo "📖 See backup info: $BACKUP_DIR/BACKUP_INFO.md"
echo "📁 All files available in: $BACKUP_DIR/.cursor/rules/"
echo "" 