#!/usr/bin/env python3
import re
import glob
import os

def comprehensive_path_fix(filename):
    """Comprehensively fix all file paths in a single file"""
    with open(filename, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Remove any corrupted backup paths
    content = re.sub(r'agents/_store/project-memory/corrupted-backup-[^)]+\)', '', content)
    
    # Fix doubled paths
    content = re.sub(r'agents/_store/projects/_core/rules/01__AI-RUN/agents/_store/projects/_core/', 'agents/_store/projects/_core/', content)
    
    # Fix nested markdown links like [filename](agents/_store/...)
    content = re.sub(r'\[([^]]+\.mdc)\]\(agents/_store/project-memory/[^)]+\)', r'[\1]', content)
    
    # Clean up any remaining corrupted references
    content = re.sub(r'\[([^]]+\.mdc)\]\([^)]*corrupted-backup[^)]*\)', r'[\1]', content)
    
    # Standard patterns for proper URL conversion
    # Pattern 1: [filename.mdc](../path/to/file.mdc) -> [filename.mdc](agents/_store/projects/_core/path/to/file.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(\.\./([^)]+)\)', r'[\1](agents/_store/projects/_core/\2)', content)
    
    # Pattern 2: [filename.mdc](filename.mdc) -> [filename.mdc](agents/_store/projects/_core/rules/01__AI-RUN/filename.mdc)
    content = re.sub(r'\[([^]]+\.mdc)\]\(([^/][^)]*\.mdc)\)', r'[\1](agents/_store/projects/_core/rules/01__AI-RUN/\2)', content)
    
    # Fix specific known patterns
    # Fix projet paths
    content = re.sub(r'agents/_store/projects/_core/rules/01__AI-RUN/projet/', 'agents/_store/projects/_core/projet/', content)
    
    # Fix 02__AI-DOCS paths
    content = re.sub(r'agents/_store/projects/_core/rules/01__AI-RUN/02__AI-DOCS/', 'agents/_store/projects/_core/rules/02__AI-DOCS/', content)
    
    # Fix 03__SPECS paths
    content = re.sub(r'agents/_store/projects/_core/rules/01__AI-RUN/03__SPECS/', 'agents/_store/projects/_core/rules/03__SPECS/', content)
    
    # Fix tasks paths
    content = re.sub(r'agents/_store/projects/_core/rules/01__AI-RUN/tasks/', 'agents/_store/projects/_core/tasks/', content)
    
    # Clean up any remaining malformed links
    content = re.sub(r'\[([^]]+\.mdc)\]\(\)', r'`\1`', content)
    
    # Write back if changed
    if content != original_content:
        with open(filename, 'w') as f:
            f.write(content)
        print(f"Comprehensively fixed paths in {filename}")
        return True
    else:
        print(f"No changes needed in {filename}")
        return False

def main():
    # Get all .mdc files except 00_ and 01_ prefixed ones
    files = glob.glob('*.mdc')
    files = [f for f in files if not f.startswith(('00_', '01_'))]
    
    print(f"Processing {len(files)} files with comprehensive fixes...")
    
    for filename in sorted(files):
        comprehensive_path_fix(filename)
    
    print("Comprehensive path fixing complete!")

if __name__ == "__main__":
    main() 