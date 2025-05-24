#!/usr/bin/env python3
"""
Script to detect and fix broken link patterns created by the file replacement script
"""

import os
import re
import subprocess
from pathlib import Path

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

def detect_broken_patterns_in_line(line, line_number):
    """Detect broken link patterns in a single line"""
    broken_patterns = []
    
    # Skip lines that contain inline code patterns that should be preserved
    # Pattern: `[filename](path)` (backtick, bracket, filename, bracket, path, bracket, backtick)
    inline_code_pattern = r'`\[[^\]]+\]\([^)]+\)`'
    if re.search(inline_code_pattern, line):
        # This line contains inline code patterns that should be preserved
        # Only check for obvious broken patterns, not inline code
        pass
    
    # Pattern 1: Nested brackets - [text](.../[text](.../...))
    pattern1 = r'\[([^\]]{1,100})\]\(([^)]{0,200})\[([^\]]{1,100})\]\(([^)]{1,200})\)\)'
    for match in re.finditer(pattern1, line):
        broken_patterns.append({
            'type': 'nested_brackets',
            'match': match,
            'line_number': line_number,
            'full_text': match.group(0),
            'inner_filename': match.group(3),
            'inner_path': match.group(4)
        })
    
    # Pattern 2: Double .cursor/rules paths
    pattern2 = r'\[([^\]]{1,100})\]\(([^)]*\.cursor/rules/[^)]*\.cursor/rules/[^)]{1,200})\)'
    for match in re.finditer(pattern2, line):
        broken_patterns.append({
            'type': 'double_path',
            'match': match,
            'line_number': line_number,
            'full_text': match.group(0),
            'filename': match.group(1),
            'path': match.group(2)
        })
    
    # Pattern 3: Double ending brackets - [text](path)](.path)
    pattern3 = r'\[([^\]]{1,100})\]\(([^)]{1,200})\)\]\(([^)]{1,200})\)'
    for match in re.finditer(pattern3, line):
        broken_patterns.append({
            'type': 'double_ending',
            'match': match,
            'line_number': line_number,
            'full_text': match.group(0),
            'filename': match.group(1),
            'first_path': match.group(2),
            'second_path': match.group(3)
        })
    
    # Pattern 4: Mixed text with embedded links
    pattern4 = r'(?<!\[)([^[\n]{0,50})\.cursor/rules/[^/\n]{1,50}/\[([^\]]{1,100})\]\(([^)]{1,200})\)'
    for match in re.finditer(pattern4, line):
        broken_patterns.append({
            'type': 'mixed_text_link',
            'match': match,
            'line_number': line_number,
            'full_text': match.group(0),
            'prefix_text': match.group(1),
            'filename': match.group(2),
            'path': match.group(3)
        })
    
    # Pattern 5: Malformed with extra brackets - [text](path[extra]more)
    pattern5 = r'\[([^\]]{1,100})\]\(([^)]{0,100})\[([^\]]{0,50})\]([^)]{0,100})\)'
    for match in re.finditer(pattern5, line):
        broken_patterns.append({
            'type': 'malformed_path',
            'match': match,
            'line_number': line_number,
            'full_text': match.group(0),
            'filename': match.group(1),
            'path_start': match.group(2),
            'extra_content': match.group(3),
            'path_end': match.group(4)
        })
    
    # Only check for obviously broken patterns when inline code is not present
    if not re.search(inline_code_pattern, line):
        # Pattern 6: Backtick-bracket combinations - [`[filename](path))
        pattern6 = r'\[`\[([^\]]{1,100})\]\(([^)]{1,200})\)\)'
        for match in re.finditer(pattern6, line):
            broken_patterns.append({
                'type': 'backtick_bracket',
                'match': match,
                'line_number': line_number,
                'full_text': match.group(0),
                'filename': match.group(1),
                'path': match.group(2)
            })
        
        # Pattern 7: Missing closing bracket before double parenthesis - [`filename](path))
        pattern7 = r'\[`([^\]]{1,100})\]\(([^)]{1,200})\)\)'
        for match in re.finditer(pattern7, line):
            broken_patterns.append({
                'type': 'missing_bracket_double_paren',
                'match': match,
                'line_number': line_number,
                'full_text': match.group(0),
                'filename': match.group(1),
                'path': match.group(2)
            })
        
        # Pattern 8: Double square brackets with single paren - [[filename](path)
        pattern8 = r'\[\[([^\]]{1,100})\]\(([^)]{1,200})\)'
        for match in re.finditer(pattern8, line):
            broken_patterns.append({
                'type': 'double_square_bracket',
                'match': match,
                'line_number': line_number,
                'full_text': match.group(0),
                'filename': match.group(1),
                'path': match.group(2)
            })
        
        # Pattern 9: Complex nested with backticks - [`[filename](path)`](...) 
        pattern9 = r'\[`\[([^\]]{1,100})\]\(([^)]{1,200})\)`\]\(([^)]{1,200})\)'
        for match in re.finditer(pattern9, line):
            broken_patterns.append({
                'type': 'complex_nested_backtick',
                'match': match,
                'line_number': line_number,
                'full_text': match.group(0),
                'filename': match.group(1),
                'inner_path': match.group(2),
                'outer_path': match.group(3)
            })
        
        # Pattern 10: Missing closing bracket with double paren - [`filename](path))
        pattern10 = r'\[`([^\]]{1,100})\]\(([^)]{1,200})\)\)'
        for match in re.finditer(pattern10, line):
            broken_patterns.append({
                'type': 'missing_close_bracket',
                'match': match,
                'line_number': line_number,
                'full_text': match.group(0),
                'filename': match.group(1),
                'path': match.group(2)
            })
    
    return broken_patterns

def load_file_mappings():
    """Load the correct file mappings from cursor_files_list.mdc"""
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
                        mappings[filename] = path
        
        print(f"Loaded {len(mappings)} file mappings")
        return mappings
    except Exception as e:
        print(f"Error reading {cursor_files_list}: {e}")
        return mappings

def fix_broken_patterns_in_line(line, broken_patterns, file_mappings):
    """Fix the broken patterns found in a single line"""
    updated_line = line
    fixes_made = 0
    
    # Sort patterns by position (reverse order to maintain positions)
    line_patterns = [p for p in broken_patterns]
    sorted_patterns = sorted(line_patterns, key=lambda x: x['match'].start(), reverse=True)
    
    for pattern in sorted_patterns:
        if pattern['type'] == 'nested_brackets':
            filename = pattern['inner_filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed nested brackets for {filename}")
        
        elif pattern['type'] == 'double_path':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed double path for {filename}")
        
        elif pattern['type'] == 'malformed_path':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed malformed path for {filename}")
        
        elif pattern['type'] == 'double_ending':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed double ending for {filename}")
        
        elif pattern['type'] == 'mixed_text_link':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed mixed text/link for {filename}")
        
        elif pattern['type'] == 'backtick_bracket':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed backtick-bracket for {filename}")
        
        elif pattern['type'] == 'missing_bracket_double_paren':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed missing bracket/double paren for {filename}")
        
        elif pattern['type'] == 'double_square_bracket':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed double square bracket for {filename}")
        
        elif pattern['type'] == 'complex_nested_backtick':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed complex nested backtick for {filename}")
        
        elif pattern['type'] == 'missing_close_bracket':
            filename = pattern['filename']
            if filename in file_mappings:
                correct_path = file_mappings[filename]
                replacement = f"[{filename}]({correct_path})"
                
                start_pos = pattern['match'].start()
                end_pos = pattern['match'].end()
                updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                fixes_made += 1
                print(f"  → Fixed missing close bracket for {filename}")
    
    return updated_line, fixes_made

def process_file(filepath, file_mappings):
    """Process a single file line by line to fix broken links"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0
    
    updated_lines = []
    total_fixes = 0
    total_patterns = 0
    
    # Process each line
    for line_number, line in enumerate(lines, 1):
        # Detect broken patterns in this line
        broken_patterns = detect_broken_patterns_in_line(line, line_number)
        total_patterns += len(broken_patterns)
        
        if broken_patterns:
            # Fix the broken patterns in this line
            updated_line, fixes = fix_broken_patterns_in_line(line, broken_patterns, file_mappings)
            updated_lines.append(updated_line)
            total_fixes += fixes
        else:
            # No broken patterns, keep line as is
            updated_lines.append(line)
    
    if total_patterns == 0:
        return 0
    
    print(f"  Found {total_patterns} broken patterns across {len(lines)} lines")
    
    # Only write back if changes were made
    if total_fixes > 0:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(updated_lines)
            print(f"✅ Fixed {filepath} ({total_fixes} fixes)")
            return total_fixes
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return 0
    
    return 0

def main():
    """Main function"""
    print("🔧 Starting broken link detection and repair process...")
    
    # Load file mappings
    file_mappings = load_file_mappings()
    if not file_mappings:
        print("❌ No file mappings found. Exiting.")
        return
    
    # Get all .mdc files to process
    files_to_process = get_all_mdc_files()
    if not files_to_process:
        print("❌ No .mdc files found to process. Exiting.")
        return
    
    print(f"📁 Found {len(files_to_process)} .mdc files to process")
    
    # Process each file
    total_files_fixed = 0
    total_fixes = 0
    
    for filepath in files_to_process:
        print(f"\n🔍 Processing: {filepath}")
        fixes = process_file(filepath, file_mappings)
        if fixes > 0:
            total_files_fixed += 1
            total_fixes += fixes
    
    print(f"\n✅ Broken link repair completed!")
    print(f"📊 Files fixed: {total_files_fixed}")
    print(f"🔗 Total fixes made: {total_fixes}")

if __name__ == "__main__":
    main() 