#!/usr/bin/env python3
import re
import glob

def fix_all_paths(filename):
    """Fix all file path patterns in a single file"""
    with open(filename, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: [../path/file.mdc](path/file.mdc) -> [file.mdc](agents/_store/projects/_core/path/file.mdc)
    content = re.sub(r'\[(\.\./[^]]+\.mdc)\]\(([^)]+\.mdc)\)', r'[\1](agents/_store/projects/_core/\2)', content)
    
    # Pattern 2: [filename.mdc](filename.mdc) -> [filename.mdc](agents/_store/projects/_core/rules/01__AI-RUN/filename.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(([^/][^)]*\.mdc)\)', r'[\1](agents/_store/projects/_core/rules/01__AI-RUN/\2)', content)
    
    # Fix specific path corrections
    content = content.replace('agents/_store/projects/_core/rules/01__AI-RUN/projet/', 'agents/_store/projects/_core/projet/')
    content = content.replace('agents/_store/projects/_core/rules/01__AI-RUN/02__AI-DOCS/', 'agents/_store/projects/_core/rules/02__AI-DOCS/')
    content = content.replace('agents/_store/projects/_core/rules/01__AI-RUN/03__SPECS/', 'agents/_store/projects/_core/rules/03__SPECS/')
    content = content.replace('agents/_store/projects/_core/rules/01__AI-RUN/tasks/', 'agents/_store/projects/_core/tasks/')
    
    # Remove any mdc: prefixes that might be added
    content = content.replace('](mdc:agents/_store/projects/_core/', '](agents/_store/projects/_core/')
    
    # Write back if changed
    if content != original_content:
        with open(filename, 'w') as f:
            f.write(content)
        print(f"Fixed all paths in {filename}")
        return True
    else:
        print(f"No changes needed in {filename}")
        return False

def main():
    # Get all .mdc files except 00_ and 01_ prefixed ones
    files = glob.glob('*.mdc')
    files = [f for f in files if not f.startswith(('00_', '01_'))]
    
    print(f"Processing {len(files)} files with comprehensive path fixes...")
    
    for filename in sorted(files):
        fix_all_paths(filename)
    
    print("All path fixing complete!")

if __name__ == "__main__":
    main() 