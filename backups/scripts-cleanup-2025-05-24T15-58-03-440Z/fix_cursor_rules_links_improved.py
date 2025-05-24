#!/usr/bin/env python3
"""
Improved script to detect and fix ONLY actually broken link patterns in .cursor/rules directory
"""

import os
import re
from pathlib import Path

def get_cursor_rules_mdc_files():
    """Get only .mdc files in the .cursor/rules directory"""
    cursor_rules_dir = Path('.cursor/rules')
    if not cursor_rules_dir.exists():
        print("❌ .cursor/rules directory not found!")
        return []
    
    mdc_files = []
    for file_path in cursor_rules_dir.rglob('*.mdc'):
        mdc_files.append(str(file_path))
    
    mdc_files.sort()
    return mdc_files

def load_file_mappings():
    """Load file mappings from cursor_files_list.mdc"""
    mapping_file = Path('.cursor/rules/00__TOOLS/cursor_files_list.mdc')
    file_mappings = {}
    
    if not mapping_file.exists():
        print("❌ cursor_files_list.mdc not found!")
        return file_mappings
    
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if ' : [' in line and '](/' not in line:  # Skip absolute paths
                    # Format: filename : [filename](relative_path)
                    parts = line.split(' : [')
                    if len(parts) == 2:
                        display_name = parts[0]
                        link_part = parts[1]
                        if '](' in link_part and link_part.endswith(')'):
                            filename = link_part.split('](')[0]
                            path = link_part.split('](')[1][:-1]  # Remove closing )
                            file_mappings[filename] = path
                            file_mappings[display_name] = path
    except Exception as e:
        print(f"❌ Error loading file mappings: {e}")
    
    return file_mappings

def is_valid_markdown_link(text):
    """Check if text contains a valid markdown link pattern"""
    # Valid patterns: [text](path)
    valid_link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    return bool(re.search(valid_link_pattern, text))

def find_broken_link_patterns(content):
    """Find actually broken link patterns that need fixing"""
    broken_patterns = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        # Skip lines that already have valid markdown links
        if is_valid_markdown_link(line):
            continue
            
        # Pattern 1: Missing opening bracket - text](path)
        missing_open_pattern = r'([a-zA-Z0-9_\-\.]+)\]\(([^)]+)\)'
        matches = re.finditer(missing_open_pattern, line)
        for match in matches:
            # Check if this isn't part of a valid link already
            start_pos = match.start()
            if start_pos > 0 and line[start_pos-1] == '[':
                continue  # This is actually part of a valid link
            
            broken_patterns.append({
                'line_num': line_num,
                'type': 'missing_opening_bracket',
                'original': match.group(0),
                'text': match.group(1),
                'path': match.group(2),
                'position': start_pos
            })
        
        # Pattern 2: Missing closing bracket on text - [textpath)
        missing_close_text_pattern = r'\[([^]]+)([^]]+)\)\s'
        matches = re.finditer(missing_close_text_pattern, line)
        for match in matches:
            broken_patterns.append({
                'line_num': line_num,
                'type': 'missing_closing_bracket_text',
                'original': match.group(0),
                'text': match.group(1),
                'path': match.group(2).replace('(', ''),
                'position': match.start()
            })
    
    return broken_patterns

def fix_broken_patterns(content, file_mappings):
    """Fix only the identified broken patterns"""
    fixed_content = content
    fixes_made = 0
    
    broken_patterns = find_broken_link_patterns(content)
    
    # Sort by position in reverse order to avoid index shifting
    broken_patterns.sort(key=lambda x: x['position'], reverse=True)
    
    for pattern in broken_patterns:
        if pattern['type'] == 'missing_opening_bracket':
            # Fix: text](path) → [text](path)
            original = pattern['original']
            text = pattern['text']
            path = pattern['path']
            fixed = f"[{text}]({path})"
            
            fixed_content = fixed_content.replace(original, fixed, 1)
            fixes_made += 1
            print(f"  ✅ Fixed missing bracket: {text}]({path}) → [{text}]({path})")
        
        elif pattern['type'] == 'missing_closing_bracket_text':
            # Fix: [textpath) → [text](path)
            original = pattern['original']
            text = pattern['text']
            path = pattern['path']
            fixed = f"[{text}]({path})"
            
            fixed_content = fixed_content.replace(original, fixed, 1)
            fixes_made += 1
            print(f"  ✅ Fixed missing bracket: [text](path)")
    
    return fixed_content, fixes_made

def process_file(file_path, file_mappings):
    """Process a single file to fix broken links"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Check if file has any broken patterns
        broken_patterns = find_broken_link_patterns(original_content)
        if not broken_patterns:
            print(f"  ⚪ No broken patterns found")
            return 0
        
        print(f"  🔍 Found {len(broken_patterns)} broken patterns")
        
        # Fix the broken patterns
        fixed_content, fixes_made = fix_broken_patterns(original_content, file_mappings)
        
        # Only write if changes were made
        if fixes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"  ✅ Applied {fixes_made} fixes")
            return fixes_made
        
        return 0
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function"""
    print("🔧 IMPROVED Cursor Rules Link Fixer")
    print("━" * 50)
    print("")
    
    # Load file mappings
    file_mappings = load_file_mappings()
    print(f"📄 Loaded {len(file_mappings)} file mappings")
    
    # Get all .mdc files in .cursor/rules
    mdc_files = get_cursor_rules_mdc_files()
    print(f"📁 Found {len(mdc_files)} .mdc files in .cursor/rules")
    print("")
    
    total_fixes = 0
    files_modified = 0
    
    # Process each file
    for file_path in mdc_files:
        rel_path = file_path.replace('.cursor/rules/', '')
        print(f"🔍 Processing: {rel_path}")
        
        fixes_made = process_file(file_path, file_mappings)
        if fixes_made > 0:
            files_modified += 1
            total_fixes += fixes_made
    
    print("")
    print("✅ IMPROVED LINK FIXING COMPLETE")
    print(f"📄 Files processed: {len(mdc_files)}")
    print(f"📝 Files modified: {files_modified}")
    print(f"🔧 Total fixes applied: {total_fixes}")

if __name__ == "__main__":
    main() 