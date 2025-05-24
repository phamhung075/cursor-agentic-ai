#!/usr/bin/env python3
import re
import glob

def simple_path_fix(filename):
    """Simple fix for basic relative paths only"""
    with open(filename, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Only fix the most basic patterns
    # Pattern 1: [filename.mdc](../path/to/file.mdc) -> [filename.mdc](agents/_store/projects/_core/path/to/file.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(\.\./([^)]+)\)', r'[\1](agents/_store/projects/_core/\2)', content)
    
    # Write back if changed
    if content != original_content:
        with open(filename, 'w') as f:
            f.write(content)
        print(f"Fixed basic paths in {filename}")
        return True
    else:
        print(f"No basic path changes needed in {filename}")
        return False

def main():
    # Get all .mdc files except 00_ and 01_ prefixed ones
    files = glob.glob('*.mdc')
    files = [f for f in files if not f.startswith(('00_', '01_'))]
    
    print(f"Processing {len(files)} files with simple fixes...")
    
    for filename in sorted(files):
        simple_path_fix(filename)
    
    print("Simple path fixing complete!")

if __name__ == "__main__":
    main() 