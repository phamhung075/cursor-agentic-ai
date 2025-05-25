#!/usr/bin/env python3
"""
Script to list all files in the project and update cursor_files_list.mdc with clickable references
"""

import os
import subprocess
from pathlib import Path

def get_all_project_files():
    """Get all relevant files in the project"""
    try:
        # Run find command to get all relevant files
        result = subprocess.run([
            'find', '.', '-type', 'f', 
            '(', '-name', '*.mdc', '-o', '-name', '*.json', '-o', '-name', '*.md', 
            '-o', '-name', '*.js', '-o', '-name', '*.ts', '-o', '-name', '*.py', ')'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            files = result.stdout.strip().split('\n')
            # Filter out empty lines and sort
            files = [f for f in files if f.strip()]
            files.sort()
            return files
        else:
            print(f"Error running find command: {result.stderr}")
            return []
    except Exception as e:
        print(f"Error getting file list: {e}")
        return []

def format_file_entry(filepath):
    """Format a file entry as clickable markdown link"""
    # Remove leading ./ if present but preserve the path structure
    clean_path = filepath.lstrip('./')
    
    # If the path starts with cursor, add the leading dot back
    if clean_path.startswith('cursor'):
        clean_path = '.' + clean_path
    
    # Get just the filename for display
    filename = os.path.basename(filepath)
    
    # Create clickable link format: filename : [filename](filepath)
    return f"{filename} : [{filename}]({clean_path})"

def update_cursor_files_list():
    """Update the cursor_files_list.mdc file with current file list"""
    
    # Get all files
    files = get_all_project_files()
    
    if not files:
        print("No files found to process")
        return
    
    # Path to the cursor_files_list.mdc file
    target_file = Path('.cursor/rules/00__TOOLS/cursor_files_list.mdc')
    
    if not target_file.exists():
        print(f"Target file {target_file} does not exist")
        return
    
    # Generate the complete file list in the format: filename : [filename](filepath)
    file_list_content = ""
    
    for filepath in files:
        file_list_content += format_file_entry(filepath) + "\n"
    
    # Write the complete new content
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(file_list_content.rstrip() + '\n')  # Remove last newline and add single newline at end
        print(f"Successfully updated {target_file}")
        print(f"Added {len(files)} files to the file list")
    except Exception as e:
        print(f"Error writing to {target_file}: {e}")

def main():
    """Main function"""
    print("Updating cursor_files_list.mdc with complete file list...")
    update_cursor_files_list()
    print("Done!")

if __name__ == "__main__":
    main() 