#!/usr/bin/env python3
"""
Script to list ALL .cursor/rules files and update cursor_files_list.mdc with clickable references
"""

import os
import subprocess
from pathlib import Path

def get_cursor_rules_files():
    """Get ALL relevant files in the .cursor/rules directory recursively"""
    cursor_rules_dir = Path('.cursor/rules')
    
    if not cursor_rules_dir.exists():
        print("❌ .cursor/rules directory not found!")
        return []
    
    try:
        # Run find command specifically on .cursor/rules directory
        result = subprocess.run([
            'find', '.cursor/rules', '-type', 'f', 
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
    """Format a file entry as clickable markdown link for .cursor/rules files"""
    # Get just the filename for display
    filename = os.path.basename(filepath)
    
    print(f"🔍 DEBUG: Processing file: {filepath}")
    print(f"🔍 DEBUG: Filename: {filename}")
    
    # For .cursor/rules files, the path should be relative from cursor_files_list.mdc location
    # cursor_files_list.mdc is at .cursor/rules/00__TOOLS/cursor_files_list.mdc
    if filepath.startswith('.cursor/rules/'):
        # Remove .cursor/rules/ prefix to get path within rules directory
        rules_relative_path = filepath[len('.cursor/rules/'):]
        print(f"🔍 DEBUG: Rules relative path: {rules_relative_path}")
        
        # If the file is in 00__TOOLS directory (same as cursor_files_list.mdc)
        if rules_relative_path.startswith('00__TOOLS/'):
            # Same directory - use just the filename (no path needed)
            relative_path = rules_relative_path[len('00__TOOLS/'):]
            print(f"🔍 DEBUG: Same directory, relative path: {relative_path}")
        else:
            # Different directory, need to go up one level then down
            # But we need to maintain the .cursor/rules prefix for the full path
            relative_path = f"../{rules_relative_path}"
            print(f"🔍 DEBUG: Different directory, relative path: {relative_path}")
        
        # Create clickable link format: filename : [filename](relative_path)
        formatted_entry = f"{filename} : [{filename}]({relative_path})"
        print(f"🔍 DEBUG: Formatted entry: {formatted_entry}")
        return formatted_entry
    else:
        # Fallback for any edge cases
        print(f"🔍 DEBUG: Using fallback formatting for: {filepath}")
        return f"{filename} : [{filename}]({filepath})"

def format_file_entry_fixed(filepath):
    """FIXED: Format a file entry as clickable markdown link for .cursor/rules files"""
    filename = os.path.basename(filepath)
    
    print(f"🔧 FIXED DEBUG: Processing file: {filepath}")
    
    # The user wants to keep the full .cursor/rules/ path in the links
    # cursor_files_list.mdc is located at .cursor/rules/00__TOOLS/cursor_files_list.mdc
    
    if filepath.startswith('.cursor/rules/'):
        # Remove .cursor/rules/ prefix to get path within rules directory
        rules_relative_path = filepath[len('.cursor/rules/'):]
        print(f"🔧 FIXED DEBUG: Rules relative path: {rules_relative_path}")
        
        # If the file is cursor_files_list.mdc itself, skip it
        if rules_relative_path == '00__TOOLS/cursor_files_list.mdc':
            print(f"🔧 FIXED DEBUG: Skipping cursor_files_list.mdc itself")
            return None
            
        # If the file is in the same 00__TOOLS directory
        if rules_relative_path.startswith('00__TOOLS/'):
            # Same directory - use just the filename (no path needed)
            link_path = rules_relative_path[len('00__TOOLS/'):]
            print(f"🔧 FIXED DEBUG: Same directory, link path: {link_path}")
        else:
            # Different directory - keep the FULL .cursor/rules/ path as requested
            link_path = filepath  # Use the complete original path
            print(f"🔧 FIXED DEBUG: Different directory, using full path: {link_path}")
        
        formatted_entry = f"{filename} : [{filename}]({link_path})"
        print(f"🔧 FIXED DEBUG: Formatted entry: {formatted_entry}")
        return formatted_entry
    else:
        print(f"🔧 FIXED DEBUG: File not in .cursor/rules, using full path: {filepath}")
        return f"{filename} : [{filename}]({filepath})"

def update_cursor_files_list():
    """Update the cursor_files_list.mdc file with ALL .cursor/rules files"""
    
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
    
    print(f"🔧 DEBUG: Target file location: {target_file}")
    print(f"🔧 DEBUG: Target file absolute path: {target_file.absolute()}")
    
    # Generate the complete file list in the format: filename : [filename](relative_path)
    file_list_content = ""
    processed_files = 0
    
    for filepath in files:
        formatted_entry = format_file_entry_fixed(filepath)
        if formatted_entry:  # Skip None entries (like cursor_files_list.mdc itself)
            file_list_content += formatted_entry + "\n"
            processed_files += 1
    
    print(f"🔧 DEBUG: Processed {processed_files} files out of {len(files)} total")
    
    # Write the complete new content
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(file_list_content.rstrip() + '\n')  # Remove last newline and add single newline at end
        print(f"✅ Successfully updated {target_file}")
        print(f"📄 Added {processed_files} .cursor/rules files to the file list")
        
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
        ".cursor/rules/frontend/angular.mdc",
        ".cursor/rules/backend/nodejs.mdc", 
        ".cursor/rules/00__TOOLS/helper.mdc",
        ".cursor/rules/00__TOOLS/cursor_files_list.mdc",
        ".cursor/rules/01__AI-RUN/01_Idea.mdc",
        ".cursor/rules/deep/nested/file.mdc"
    ]
    
    print("Expected results:")
    print("- Files in 00__TOOLS/ (same dir): filename only")
    print("- Files in other dirs: full .cursor/rules/... path")
    print("- cursor_files_list.mdc: should be skipped (None)")
    
    for test_path in test_cases:
        print(f"\n🧪 Testing: {test_path}")
        result = format_file_entry_fixed(test_path)
        if result:
            print(f"🧪 Result: {result}")
        else:
            print(f"🧪 Result: None (skipped)")
        
        # Show expected vs actual
        filename = os.path.basename(test_path)
        if 'cursor_files_list.mdc' in test_path:
            expected = "None (skipped)"
        elif test_path.startswith('.cursor/rules/00__TOOLS/'):
            expected = f"{filename} : [{filename}]({filename})"
        else:
            expected = f"{filename} : [{filename}]({test_path})"
        print(f"🧪 Expected: {expected}")
        print(f"🧪 Match: {'✅' if str(result) == expected or (result is None and 'None' in expected) else '❌'}")

def main():
    """Main function"""
    print("📂 Updating cursor_files_list.mdc with ALL .cursor/rules files...")
    
    # Add validation step
    validate_paths()
    
    print("\n" + "="*50)
    update_cursor_files_list()
    print("✅ Done!")

if __name__ == "__main__":
    main()