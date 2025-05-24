#!/usr/bin/env python3
"""
Script to detect and fix broken link patterns specifically in .cursor/rules directory only
"""

import os
import re
import subprocess
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
            content = f.read()
            
        # Parse mappings: filename : [filename](path)
        lines = content.strip().split('\n')
        for line in lines:
            if ' : ' in line:
                parts = line.split(' : ', 1)
                if len(parts) == 2:
                    filename = parts[0].strip()
                    full_link = parts[1].strip()
                    file_mappings[filename] = full_link
                    
                    # Also map without extension for .mdc files
                    if filename.endswith('.mdc'):
                        base_name = filename[:-4]
                        file_mappings[base_name] = full_link
        
        print(f"📄 Loaded {len(file_mappings)} file mappings")
        return file_mappings
        
    except Exception as e:
        print(f"❌ Error loading file mappings: {e}")
        return {}

def detect_broken_patterns_in_line(line, line_number):
    """Detect broken link patterns in a single line"""
    broken_patterns = []
    
    # Skip lines with simple inline code that should be preserved
    simple_inline_code_pattern = r'(?<!\[)`\[[^\]]+\]\([^)]+\)`(?!\])'
    complex_pattern_exists = bool(re.search(r'\[`\[|\]`\]', line))
    
    if re.search(simple_inline_code_pattern, line) and not complex_pattern_exists:
        return broken_patterns
    
    # Pattern 1: Nested brackets with double paths
    pattern1 = r'\[([^\]]+)\]\([^)]*\[([^\]]+)\]\([^)]*\)[^)]*\)'
    for match in re.finditer(pattern1, line):
        broken_patterns.append({
            'type': 'nested_brackets_double_path',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(2)}]({match.group(2)})"
        })
    
    # Pattern 2: Mixed text with embedded links
    pattern2 = r'([^[\s]+)/\[([^\]]+)\]\(([^)]+)\)'
    for match in re.finditer(pattern2, line):
        if not match.group(0).startswith('['):
            broken_patterns.append({
                'type': 'mixed_text_embedded_link',
                'line_number': line_number,
                'match': match.group(0),
                'start': match.start(),
                'end': match.end(),
                'fix': f"[{match.group(2)}]({match.group(3)})"
            })
    
    # Pattern 3: Complex bracket/backtick combinations
    pattern3 = r'\[`\[([^\]]+)\]\(([^)]+)\)\]'
    for match in re.finditer(pattern3, line):
        broken_patterns.append({
            'type': 'complex_bracket_backtick',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(2)})"
        })
    
    # Pattern 4: Double square brackets
    pattern4 = r'\[\[([^\]]+)\]\(([^)]+)\)'
    for match in re.finditer(pattern4, line):
        broken_patterns.append({
            'type': 'double_square_brackets',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(2)})"
        })
    
    # Pattern 5: Backtick-bracket combinations
    pattern5 = r'`\[([^\]]+)\]\(([^)]+)\)\]'
    for match in re.finditer(pattern5, line):
        broken_patterns.append({
            'type': 'backtick_bracket_combo',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(2)})"
        })
    
    # Pattern 6: Missing opening bracket
    pattern6 = r'(?<!\[)([^\s\[\]]+\.mdc)\]\(([^)]+)\)'
    for match in re.finditer(pattern6, line):
        broken_patterns.append({
            'type': 'missing_opening_bracket',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(2)})"
        })
    
    # Pattern 7: Double parentheses patterns like (file.mdc)(file.mdc)
    pattern7 = r'\(([^)]+\.mdc)\)\(([^)]+\.mdc)\)'
    for match in re.finditer(pattern7, line):
        broken_patterns.append({
            'type': 'double_parentheses',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(1)})"
        })
    
    # Pattern 8: Absolute .cursor/rules/ paths that should be relative
    pattern8 = r'\[([^\]]+)\]\(\.cursor/rules/([^)]+)\)'
    for match in re.finditer(pattern8, line):
        broken_patterns.append({
            'type': 'absolute_cursor_rules_path',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'fix': f"[{match.group(1)}]({match.group(2)})"
        })
    
    return broken_patterns

def fix_broken_patterns_in_line(line, broken_patterns, file_mappings):
    """Fix broken patterns in a line"""
    if not broken_patterns:
        return line, []
    
    # Sort patterns by start position in reverse order to avoid index shifting
    broken_patterns.sort(key=lambda x: x['start'], reverse=True)
    
    fixed_patterns = []
    for pattern in broken_patterns:
        start = pattern['start']
        end = pattern['end']
        
        # Use the predetermined fix
        replacement = pattern['fix']
        
        # Apply the fix
        line = line[:start] + replacement + line[end:]
        fixed_patterns.append({
            'type': pattern['type'],
            'line_number': pattern['line_number'],
            'original': pattern['match'],
            'replacement': replacement
        })
    
    return line, fixed_patterns

def process_file(filepath, file_mappings):
    """Process a single file to detect and fix broken patterns"""
    relative_path = os.path.relpath(filepath)
    print(f"🔍 Processing: {relative_path}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading {relative_path}: {e}")
        return False
    
    modified_lines = []
    all_fixed_patterns = []
    file_modified = False
    
    for line_number, line in enumerate(lines, 1):
        broken_patterns = detect_broken_patterns_in_line(line.rstrip('\n'), line_number)
        
        if broken_patterns:
            fixed_line, fixed_patterns = fix_broken_patterns_in_line(line.rstrip('\n'), broken_patterns, file_mappings)
            modified_lines.append(fixed_line + '\n')
            all_fixed_patterns.extend(fixed_patterns)
            file_modified = True
            
            for pattern in fixed_patterns:
                print(f"  → Line {pattern['line_number']}: {pattern['type']}")
                print(f"    Fixed: {pattern['original']} → {pattern['replacement']}")
        else:
            modified_lines.append(line)
    
    if file_modified:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(modified_lines)
            print(f"✅ Fixed {relative_path} ({len(all_fixed_patterns)} patterns)")
            return True
        except Exception as e:
            print(f"❌ Error writing {relative_path}: {e}")
            return False
    else:
        print(f"  ⚪ No broken patterns found")
        return False

def main():
    """Main function"""
    print("🔧 Fixing broken links in .cursor/rules directory only")
    print("━" * 60)
    print("")
    
    # Load file mappings
    file_mappings = load_file_mappings()
    if not file_mappings:
        print("❌ No file mappings loaded, cannot proceed")
        return
    
    # Get .mdc files in .cursor/rules
    mdc_files = get_cursor_rules_mdc_files()
    print(f"📁 Found {len(mdc_files)} .mdc files in .cursor/rules")
    print("")
    
    if not mdc_files:
        print("❌ No .mdc files found in .cursor/rules directory")
        return
    
    # Process each file
    files_modified = 0
    for filepath in mdc_files:
        if process_file(filepath, file_mappings):
            files_modified += 1
    
    print("")
    print("✅ CURSOR RULES LINK FIXING COMPLETE")
    print(f"📄 Files processed: {len(mdc_files)}")
    print(f"📝 Files modified: {files_modified}")
    print("")

if __name__ == "__main__":
    main() 