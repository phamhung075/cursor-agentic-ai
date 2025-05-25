#!/usr/bin/env python3
"""
Script to detect plain text file references and replace them with clickable links
from cursor_files_list.mdc
"""

import os
import re
import subprocess
from pathlib import Path

def load_file_mappings():
    """Load the file mappings from cursor_files_list.mdc"""
    mappings = {}
    cursor_files_list = Path('.cursor/rules/00__TOOLS/cursor_files_list.mdc')
    
    if not cursor_files_list.exists():
        print(f"Error: {cursor_files_list} not found")
        return mappings
    
    try:
        with open(cursor_files_list, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if ' : [' in line and '](' in line:
                    # Parse format: filename : [filename](path)
                    match = re.match(r'(.+?) : \[(.+?)\]\((.+?)\)', line)
                    if match:
                        filename = match.group(1)
                        path = match.group(3)
                        mappings[filename] = f"[{filename}]({path})"
        
        print(f"Loaded {len(mappings)} file mappings")
        return mappings
    except Exception as e:
        print(f"Error reading {cursor_files_list}: {e}")
        return mappings

def get_all_mdc_files():
    """Get only .mdc files in the project to process"""
    try:
        result = subprocess.run([
            'find', '.', '-type', 'f', '-name', '*.mdc'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            files = result.stdout.strip().split('\n')
            # Filter out empty lines, cursor_files_list.mdc, and files in ./scripts directory
            files = [f for f in files if f.strip() 
                    and 'cursor_files_list.mdc' not in f 
                    and not f.startswith('./scripts/')]
            files.sort()
            return files
        else:
            print(f"Error running find command: {result.stderr}")
            return []
    except Exception as e:
        print(f"Error getting file list: {e}")
        return []

def is_already_clickable_link(text, filename):
    """Check if the filename is already in a clickable markdown link format"""
    # Pattern to match [filename](path) format - make sure it's exact
    pattern = rf'\[{re.escape(filename)}\]\([^)]+\)'
    
    # Check if any instances exist
    matches = re.findall(pattern, text)
    plain_instances = len(re.findall(re.escape(filename), text))
    clickable_instances = len(matches)
    
    # If all instances are clickable, return True
    return clickable_instances > 0 and clickable_instances >= plain_instances

def replace_plain_text_references(content, file_mappings):
    """Replace plain text file references with clickable links"""
    updated_content = content
    replacements_made = 0
    
    for filename, clickable_link in file_mappings.items():
        # Multiple patterns to catch different formats:
        patterns = [
            # Pattern 1: Space + filename + space (or punctuation/end of line)
            rf'(\s){re.escape(filename)}(\s|[.,;:!?\n]|$)',
            # Pattern 2: Start of line + filename + space (or punctuation)
            rf'^{re.escape(filename)}(\s|[.,;:!?\n])',
            # Pattern 3: Quote + filename + quote/space
            rf'(["\']){re.escape(filename)}(["\'\s])',
            # Pattern 4: Single backticks `filename`
            rf'(`){re.escape(filename)}(`)',
            # Pattern 5: Just filename not in brackets or backticks
            rf'(?<!\[)(?<!`)(?<!/)(?<!\.){re.escape(filename)}(?!\]\()(?!`)(?!/)(?!\w)',
            # Pattern 6: .cursor/rules + ... + filename.mdc format
            rf'(\.cursor/rules \+ \.\.\. \+ ){re.escape(filename)}(?!\]\()',
            # Pattern 7: Backtick path with filename at end
            rf'(`[^`]*){re.escape(filename)}(`)',
        ]
        
        total_matches = 0
        for i, pattern in enumerate(patterns):
            # Find all matches for this pattern
            matches = list(re.finditer(pattern, updated_content, re.MULTILINE))
            
            if matches:
                # Replace from last to first to preserve positions
                for match in reversed(matches):
                    # Check if this match is inside a code block
                    start_pos = match.start()
                    
                    # For single backticks pattern (pattern 4), we want to replace them
                    # Only skip if inside triple backticks code blocks
                    if i not in [3, 6]:  # Not the single backtick patterns
                        # Simple check for code blocks (between ``` or between `)
                        before_match = updated_content[:start_pos]
                        code_block_count = before_match.count('```')
                        # For single backticks, only count if we're not in the single backtick pattern
                        backtick_count = before_match.count('`')
                        
                        # Skip if inside code block
                        if code_block_count % 2 == 1 or backtick_count % 2 == 1:
                            continue
                    else:
                        # For single backtick patterns, only skip if inside triple backticks
                        before_match = updated_content[:start_pos]
                        code_block_count = before_match.count('```')
                        if code_block_count % 2 == 1:
                            continue
                    
                    # Check if this specific instance is already a clickable link
                    # Look at surrounding context
                    start_context = max(0, match.start() - 10)
                    end_context = min(len(updated_content), match.end() + 10)
                    context = updated_content[start_context:end_context]
                    
                    # Skip if this instance is already clickable
                    if f'[{filename}](' in context:
                        continue
                    
                    # Get the full match and groups
                    full_match = match.group(0)
                    
                    if i == 0:  # Space + filename + space/punctuation
                        prefix = match.group(1)
                        suffix = match.group(2)
                        replacement = f"{prefix}{clickable_link}{suffix}"
                    elif i == 1:  # Start of line + filename
                        suffix = match.group(1)
                        replacement = f"{clickable_link}{suffix}"
                    elif i == 2:  # Quote + filename + quote/space
                        prefix = match.group(1)
                        suffix = match.group(2)
                        replacement = f"{prefix}{clickable_link}{suffix}"
                    elif i == 3:  # Single backticks `filename`
                        # Replace `filename` with `clickable_link`
                        replacement = f"`{clickable_link}`"
                    elif i == 5:  # .cursor/rules + ... + filename.mdc pattern
                        prefix = match.group(1)
                        replacement = f"{prefix}{clickable_link}"
                    elif i == 6:  # Backtick path with filename - replace with clickable link in backticks
                        prefix = match.group(1)
                        suffix = match.group(2)
                        replacement = f"`{clickable_link}`"
                    else:  # Just filename
                        replacement = clickable_link
                    
                    # Replace this specific occurrence
                    updated_content = updated_content[:match.start()] + replacement + updated_content[match.end():]
                    total_matches += 1
        
        if total_matches > 0:
            replacements_made += total_matches
            print(f"  → Replaced {total_matches} references to {filename}")
    
    return updated_content, replacements_made

def process_file(filepath, file_mappings):
    """Process a single file to replace plain text references"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0
    
    # Replace plain text references
    updated_content, replacements = replace_plain_text_references(content, file_mappings)
    
    # Only write back if changes were made
    if replacements > 0:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated {filepath} ({replacements} replacements)")
            return replacements
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return 0
    
    return 0

def run_update_files():
    """Run the update_files.sh script to refresh the file list"""
    try:
        print("\n🔄 Refreshing file list...")
        result = subprocess.run(['./scripts/update_files.sh'], 
                              capture_output=True, text=True, cwd='.')
        if result.returncode == 0:
            print("✅ File list refreshed successfully")
            return True
        else:
            print(f"❌ Error refreshing file list: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running update_files.sh: {e}")
        return False

def run_broken_link_fixer():
    """Run the broken link fixer script"""
    try:
        print("\n🔧 Running broken link fixer...")
        result = subprocess.run(['python3', 'scripts/fix_broken_links.py'], 
                              capture_output=True, text=True, cwd='.')
        if result.returncode == 0:
            print("✅ Broken link fixer completed successfully")
            return True
        else:
            print(f"❌ Error running broken link fixer: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running broken link fixer: {e}")
        return False

def main():
    """Main function"""
    print("🔄 Starting file reference replacement process for .mdc files only...")
    
    # Load file mappings
    file_mappings = load_file_mappings()
    if not file_mappings:
        print("❌ No file mappings found. Exiting.")
        return
    
    # Get only .mdc files to process
    files_to_process = get_all_mdc_files()
    if not files_to_process:
        print("❌ No .mdc files found to process. Exiting.")
        return
    
    print(f"📁 Found {len(files_to_process)} .mdc files to process")
    
    # Process each file
    total_files_updated = 0
    total_replacements = 0
    
    for filepath in files_to_process:
        print(f"\n🔍 Processing: {filepath}")
        replacements = process_file(filepath, file_mappings)
        if replacements > 0:
            total_files_updated += 1
            total_replacements += replacements
    
    # Run update_files.sh to refresh the file list after all replacements
    if total_replacements > 0:
        run_update_files()
    
    print(f"\n✅ Replacement process completed!")
    print(f"📊 .mdc files updated: {total_files_updated}")
    print(f"🔗 Total replacements made: {total_replacements}")
    
    # Run broken link fixer to clean up any malformed links
    run_broken_link_fixer()

if __name__ == "__main__":
    main() 