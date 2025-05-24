#!/usr/bin/env python3
"""
Script to list ALL _core files and update core_files_list.mdc with clickable references
Updated for agents/_store/projects/_core structure instead of .cursor/rules
"""

import os
import subprocess
from pathlib import Path

def get_core_files():
    """Get ALL relevant files in the _core directory recursively"""
    core_dir = Path('agents/_store/projects/_core')
    
    if not core_dir.exists():
        print("❌ agents/_store/projects/_core directory not found!")
        return []
    
    try:
        # Run find command specifically on _core directory
        result = subprocess.run([
            'find', 'agents/_store/projects/_core', '-type', 'f', 
            '(', '-name', '*.mdc', '-o', '-name', '*.json', '-o', '-name', '*.md', ')',
            '!', '-name', '.*'  # Exclude hidden files like .DS_Store
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            files = result.stdout.strip().split('\n')
            # Filter out empty lines and sort
            files = [f for f in files if f.strip()]
            files.sort()
            print(f"🔍 DEBUG: Found {len(files)} files total")
            for file in files[:5]:  # Show first 5 for debugging
                print(f"🔍 DEBUG: Raw file path: {file}")
            return files
        else:
            print(f"❌ Error running find command: {result.stderr}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting file list: {e}")
        return []

def format_file_entry(filepath):
    """Format a file entry as clickable markdown link for _core files"""
    filename = os.path.basename(filepath)
    
    print(f"🔧 DEBUG: Processing file: {filepath}")
    
    # The target file will be at agents/_store/projects/_core/rules/00__TOOLS/core_files_list.mdc
    if filepath.startswith('agents/_store/projects/_core/'):
        # Remove the _core prefix to get path within _core directory
        core_relative_path = filepath[len('agents/_store/projects/_core/'):]
        print(f"🔧 DEBUG: Core relative path: {core_relative_path}")
        
        # If the file is core_files_list.mdc itself, skip it
        if core_relative_path == 'rules/00__TOOLS/core_files_list.mdc':
            print(f"🔧 DEBUG: Skipping core_files_list.mdc itself")
            return None
            
        # If the file is in the same 00__TOOLS directory
        if core_relative_path.startswith('rules/00__TOOLS/'):
            # Same directory - use just the filename (no path needed)
            link_path = core_relative_path[len('rules/00__TOOLS/'):]
            print(f"🔧 DEBUG: Same directory, link path: {link_path}")
        else:
            # Different directory - use relative path from 00__TOOLS
            if core_relative_path.startswith('rules/'):
                # Other rules directories - go up one level
                link_path = f"../{core_relative_path[len('rules/'):]}"
            else:
                # Files in root _core - go up two levels
                link_path = f"../../{core_relative_path}"
            print(f"🔧 DEBUG: Different directory, link path: {link_path}")
        
        formatted_entry = f"{filename} : [{filename}]({link_path})"
        print(f"🔧 DEBUG: Formatted entry: {formatted_entry}")
        return formatted_entry
    else:
        print(f"🔧 DEBUG: File not in _core, using full path: {filepath}")
        return f"{filename} : [{filename}]({filepath})"

def update_core_files_list():
    """Update the core_files_list.mdc file with ALL _core files"""
    
    # Get all _core files
    files = get_core_files()
    
    if not files:
        print("❌ No files found in _core directory")
        return
    
    # Path to the core_files_list.mdc file
    target_file = Path('agents/_store/projects/_core/rules/00__TOOLS/core_files_list.mdc')
    
    if not target_file.exists():
        print(f"❌ Target file {target_file} does not exist")
        return
    
    print(f"🔧 DEBUG: Target file location: {target_file}")
    print(f"🔧 DEBUG: Target file absolute path: {target_file.absolute()}")
    
    # Generate the complete file list in the format: filename : [filename](relative_path)
    file_list_content = ""
    processed_files = 0
    
    for filepath in files:
        formatted_entry = format_file_entry(filepath)
        if formatted_entry:  # Skip None entries (like core_files_list.mdc itself)
            file_list_content += formatted_entry + "\n"
            processed_files += 1
    
    print(f"🔧 DEBUG: Processed {processed_files} files out of {len(files)} total")
    
    # Write the complete new content
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(file_list_content.rstrip() + '\n')  # Remove last newline and add single newline at end
        print(f"✅ Successfully updated {target_file}")
        print(f"📄 Added {processed_files} _core files to the file list")
        
        # Debug: show some processed content
        print("📋 Sample entries generated:")
        lines = file_list_content.strip().split('\n')
        for line in lines[:5]:  # Show first 5 entries
            print(f"  - {line}")
        if len(lines) > 5:
            print(f"  ... and {len(lines) - 5} more entries")
            
    except Exception as e:
        print(f"❌ Error writing to {target_file}: {e}")

def validate_paths():
    """Validate the path calculation logic"""
    print("\n🧪 VALIDATION: Testing path calculations...")
    
    test_cases = [
        "agents/_store/projects/_core/rules/01__AI-RUN/01_Idea.mdc",
        "agents/_store/projects/_core/rules/02__AI-DOCS/AI-Coder/test.mdc", 
        "agents/_store/projects/_core/rules/00__TOOLS/helper.mdc",
        "agents/_store/projects/_core/rules/00__TOOLS/core_files_list.mdc",
        "agents/_store/projects/_core/docs/README.mdc",
        "agents/_store/projects/_core/README.mdc"
    ]
    
    print("Expected results:")
    print("- Files in 00__TOOLS/ (same dir): filename only")
    print("- Files in other rules dirs: ../subdir/filename")
    print("- Files in _core root: ../../filename")
    print("- core_files_list.mdc: should be skipped (None)")
    
    for test_path in test_cases:
        print(f"\n🧪 Testing: {test_path}")
        result = format_file_entry(test_path)
        if result:
            print(f"🧪 Result: {result}")
        else:
            print(f"🧪 Result: None (skipped)")

def main():
    """Main function"""
    print("🔧 CORE FILES LIST UPDATER")
    print("━" * 60)
    print("📁 Updating file list for agents/_store/projects/_core")
    print("")
    
    # Validate paths first
    validate_paths()
    
    # Update the file list
    print("\n" + "="*60)
    print("📝 UPDATING CORE FILES LIST")
    print("="*60)
    update_core_files_list()
    
    print("\n🎯 Core files list update completed!")

if __name__ == "__main__":
    main() 