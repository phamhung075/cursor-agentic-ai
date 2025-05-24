#!/usr/bin/env python3
"""
Script to list only .cursor/rules files and update cursor_files_list.mdc with clickable references
"""

import os
import subprocess
from pathlib import Path

def get_cursor_rules_files():
    """Get all relevant files in the .cursor/rules directory only"""
    cursor_rules_dir = Path('.cursor/rules')
    
    if not cursor_rules_dir.exists():
        print("❌ .cursor/rules directory not found!")
        return []
    
    try:
        # Run find command to get all relevant files in .cursor/rules only
        result = subprocess.run([
            'find', str(cursor_rules_dir), '-type', 'f', 
            '(', '-name', '*.mdc', '-o', '-name', '*.json', ')'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            files = result.stdout.strip().split('\n')
            # Filter out empty lines and sort
            files = [f for f in files if f.strip()]
            files.sort()
            return files
        else:
            print(f"❌ Error running find command: {result.stderr}")
            return []
    except Exception as e:
        print(f"❌ Error getting file list: {e}")
        return []

def format_file_entry(filepath):
    """Format a file entry as clickable markdown link for .cursor/rules files"""
    # Get just the filename for display
    filename = os.path.basename(filepath)
    
    # For .cursor/rules files, the path should be relative from .cursor/rules
    if filepath.startswith('.cursor/rules/'):
        relative_path = filepath[len('.cursor/rules/'):]
        # Create clickable link format: filename : [filename](relative_path)
        return f"{filename} : [{filename}]({relative_path})"
    else:
        # Fallback for any edge cases
        return f"{filename} : [{filename}]({filepath})"

def update_cursor_files_list():
    """Update the cursor_files_list.mdc file with .cursor/rules files only"""
    
    # Get all .cursor/rules files
    files = get_cursor_rules_files()
    
    if not files:
        print("❌ No files found in .cursor/rules directory")
        return
    
    # Path to the cursor_files_list.mdc file
    target_file = Path('.cursor/rules/00__TOOLS/cursor_files_list.mdc')
    
    if not target_file.exists():
        print(f"❌ Target file {target_file} does not exist")
        return
    
    # Generate the complete file list in the format: filename : [filename](relative_path)
    file_list_content = ""
    
    for filepath in files:
        file_list_content += format_file_entry(filepath) + "\n"
    
    # Write the complete new content
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(file_list_content.rstrip() + '\n')  # Remove last newline and add single newline at end
        print(f"✅ Successfully updated {target_file}")
        print(f"📄 Added {len(files)} .cursor/rules files to the file list")
    except Exception as e:
        print(f"❌ Error writing to {target_file}: {e}")

def main():
    """Main function"""
    print("📂 Updating cursor_files_list.mdc with .cursor/rules files only...")
    update_cursor_files_list()
    print("✅ Done!")

if __name__ == "__main__":
    main() 