#!/usr/bin/env python3
"""
Single MDC File Path Fixer
Fixes markdown links in a specific MDC file to use proper relative paths from project root
"""

import os
import re
import sys
from pathlib import Path

def fix_mdc_file_paths(file_path):
    """Fix paths in a single MDC file to use paths from project root"""
    
    # Read the file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    original_content = content
    
    # Define the path mappings for files in the 01__AI-RUN directory
    # These should use full paths from project root
    path_mappings = {
        '01_Idea.mdc': '.cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/01_Idea.mdc',
        '03_Core_Concept.mdc': '.cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/03_Core_Concept.mdc', 
        '04_PRD_Generation.mdc': '.cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/04_PRD_Generation.mdc',
        '05_Specs_Docs.mdc': '.cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/05_Specs_Docs.mdc',
        '07_Start_Building.mdc': '.cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/07_Start_Building.mdc'
    }
    
    # Fix any corrupted mdc: prefixes first
    content = re.sub(r'mdc:([^)]+)', r'\1', content)
    
    # Count changes
    changes_made = 0
    
    # Fix relative paths to use full paths from root
    for short_name, full_path in path_mappings.items():
        # Pattern to match [filename](filename) and replace with [filename](full_path)
        pattern = rf'\[{re.escape(short_name)}\]\({re.escape(short_name)}\)'
        replacement = f'[{short_name}]({full_path})'
        
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            changes_made += 1
            print(f"  ✅ Fixed: {short_name} -> {full_path}")
    
    # Check if any changes were made
    if content != original_content:
        # Write back the fixed content
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed {changes_made} path issues in {file_path}")
            return True
        except Exception as e:
            print(f"❌ Error writing file: {e}")
            return False
    else:
        print(f"✅ No path issues found in {file_path}")
        return True

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python3 fix_single_mdc.py <file_path>")
        print("Example: python3 fix_single_mdc.py .cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/02_Market_Research.mdc")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    if not file_path.endswith('.mdc'):
        print(f"❌ File must be an MDC file: {file_path}")
        sys.exit(1)
    
    print(f"🔧 Fixing paths in: {file_path}")
    print("📝 Converting relative paths to full paths from project root...")
    
    success = fix_mdc_file_paths(file_path)
    
    if success:
        print("✅ Path fixing completed successfully!")
        print("📋 All links now use proper relative paths from project root")
    else:
        print("❌ Path fixing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 