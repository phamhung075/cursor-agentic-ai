#!/usr/bin/env python3
import re
import glob
import os

def fix_file_paths(filename):
    """Fix file paths in a single file"""
    with open(filename, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: [filename.mdc](../path/to/file.mdc) -> [filename.mdc](agents/_store/projects/_core/path/to/file.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(\.\./([^)]+)\)', r'[\1](agents/_store/projects/_core/\2)', content)
    
    # Pattern 2: [filename.mdc](filename.mdc) -> [filename.mdc](agents/_store/projects/_core/rules/01__AI-RUN/filename.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(([^/][^)]*\.mdc)\)', r'[\1](agents/_store/projects/_core/rules/01__AI-RUN/\2)', content)
    
    # Pattern 3: Fix any remaining relative paths that start with just a filename
    content = re.sub(r'\[([^]]+\.mdc)\]\(([^/][^)]*\.mdc)\)', r'[\1](agents/_store/projects/_core/rules/01__AI-RUN/\2)', content)
    
    # Write back if changed
    if content != original_content:
        with open(filename, 'w') as f:
            f.write(content)
        print(f"Fixed paths in {filename}")
        return True
    else:
        print(f"No changes needed in {filename}")
        return False

def main():
    # Get all .mdc files except 00_ and 01_ prefixed ones
    files = glob.glob('*.mdc')
    files = [f for f in files if not f.startswith(('00_', '01_'))]
    
    print(f"Processing {len(files)} files...")
    
    for filename in sorted(files):
        fix_file_paths(filename)
    
    print("Path fixing complete!")

if __name__ == "__main__":
    main() 