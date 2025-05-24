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
    
    # Skip lines that contain simple inline code patterns that should be preserved
    # Only skip if there are ONLY simple inline code patterns and no complex broken patterns
    # Simple inline code: `[filename](path)` (standalone, not part of complex patterns)
    simple_inline_code_pattern = r'(?<!\[)`\[[^\]]+\]\([^)]+\)`(?!\])'
    complex_pattern_exists = bool(re.search(r'\[`\[|\]`\]', line))  # Check for complex patterns
    
    if re.search(simple_inline_code_pattern, line) and not complex_pattern_exists:
        # This line contains only simple inline code patterns, skip processing
        return broken_patterns
    
    # Pattern 1: [filename](.../[filename](.../...))
    pattern1 = r'\[([^\]]+)\]\([^)]*\[([^\]]+)\]\([^)]*\)[^)]*\)'
    for match in re.finditer(pattern1, line):
        broken_patterns.append({
            'type': 'nested_brackets_double_path',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Nested brackets with double paths: {match.group(0)}"
        })
    
    # Pattern 2: Mixed text with embedded links: .cursor/rules/folder/[filename](path)
    pattern2 = r'([^[\s]+)/\[([^\]]+)\]\(([^)]+)\)'
    for match in re.finditer(pattern2, line):
        if not match.group(0).startswith('['):  # Make sure it's not already a proper link
            broken_patterns.append({
                'type': 'mixed_text_embedded_link',
                'line_number': line_number,
                'match': match.group(0),
                'start': match.start(),
                'end': match.end(),
                'details': f"Mixed text with embedded link: {match.group(0)}"
            })
    
    # Pattern 3: Complex bracket/backtick combinations: [`[filename](path)]
    pattern3 = r'\[`\[([^\]]+)\]\(([^)]+)\)\]'
    for match in re.finditer(pattern3, line):
        broken_patterns.append({
            'type': 'complex_bracket_backtick',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Complex bracket/backtick combination: {match.group(0)}"
        })
    
    # Pattern 4: Double square brackets: [[filename](path)
    pattern4 = r'\[\[([^\]]+)\]\(([^)]+)\)'
    for match in re.finditer(pattern4, line):
        broken_patterns.append({
            'type': 'double_square_brackets',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Double square brackets: {match.group(0)}"
        })
    
    # Pattern 5: Backtick-bracket combinations: `[filename](path)]
    pattern5 = r'`\[([^\]]+)\]\(([^)]+)\)\]'
    for match in re.finditer(pattern5, line):
        broken_patterns.append({
            'type': 'backtick_bracket_combo',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Backtick-bracket combination: {match.group(0)}"
        })
    
    # Pattern 6: Missing opening bracket: filename](path)
    pattern6 = r'(?<!\[)([^\s\[\]]+\.mdc)\]\(([^)]+)\)'
    for match in re.finditer(pattern6, line):
        broken_patterns.append({
            'type': 'missing_opening_bracket',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Missing opening bracket: {match.group(0)}"
        })
    
    # Pattern 7: Complex nested backticks with brackets: [`[filename](path)`](path)
    pattern7 = r'\[`\[([^\]]+)\]\(([^)]+)\)`\]\(([^)]+)\)'
    for match in re.finditer(pattern7, line):
        broken_patterns.append({
            'type': 'complex_nested_backticks',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Complex nested backticks with brackets: {match.group(0)}"
        })
    
    # Pattern 8: Missing close bracket: [filename](path
    pattern8 = r'\[([^\]]+)\]\(([^)]+)(?!\))'
    for match in re.finditer(pattern8, line):
        # Check if the line ends or there's whitespace/other characters after
        if match.end() == len(line) or line[match.end()] in ' \t\n.,;:!?':
            broken_patterns.append({
                'type': 'missing_close_bracket',
                'line_number': line_number,
                'match': match.group(0),
                'start': match.start(),
                'end': match.end(),
                'details': f"Missing close bracket: {match.group(0)}"
            })
    
    # Pattern 9: Complex nested backticks: `[filename](.../`[filename](.../...)`)`
    pattern9 = r'`\[([^\]]+)\]\([^)]*`\[([^\]]+)\]\([^)]*\)`[^)]*\)`'
    for match in re.finditer(pattern9, line):
        broken_patterns.append({
            'type': 'complex_nested_backticks_paths',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Complex nested backticks with paths: {match.group(0)}"
        })
    
    # Pattern 10: Missing close bracket with text after: [filename](path other text
    pattern10 = r'\[([^\]]+)\]\(([^)]+\s+[^)]+)(?!\))'
    for match in re.finditer(pattern10, line):
        broken_patterns.append({
            'type': 'missing_close_bracket_with_text',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Missing close bracket with text after: {match.group(0)}"
        })
    
    # Pattern 11: Complex nested pattern with backticks: [`[filename](path)`](path) 
    pattern11 = r'\[\`\[([^\]]+)\]\(([^)]+)\)\`\]\(([^)]+)\)'
    for match in re.finditer(pattern11, line):
        broken_patterns.append({
            'type': 'nested_backtick_brackets',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Nested backtick brackets: {match.group(0)}"
        })
    
    # Pattern 12: Complex nested bracket pattern: [`[filename](path)`](path)
    pattern12 = r'\[`\[([^\]]+)\]\(([^)]+)\)`\]\(([^)]+)\)'
    for match in re.finditer(pattern12, line):
        broken_patterns.append({
            'type': 'complex_nested_bracket_pattern',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Complex nested bracket pattern: {match.group(0)}"
        })
    
    # Pattern 13: Extra closing parenthesis: [filename](path))
    pattern13 = r'\[([^\]]+)\]\(([^)]+)\)\)'
    for match in re.finditer(pattern13, line):
        broken_patterns.append({
            'type': 'extra_closing_parenthesis',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"Extra closing parenthesis: {match.group(0)}"
        })
    
    # Pattern 14: Links with mdc: prefix: [filename](mdc:path)
    pattern14 = r'\[([^\]]+)\]\(mdc:([^)]+)\)'
    for match in re.finditer(pattern14, line):
        broken_patterns.append({
            'type': 'mdc_prefix_in_path',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"MDC prefix in path: {match.group(0)}"
        })
    
    # Pattern 15: Links with mdc: prefix and extra closing parenthesis: [filename](mdc:path))
    pattern15 = r'\[([^\]]+)\]\(mdc:([^)]+)\)\)'
    for match in re.finditer(pattern15, line):
        broken_patterns.append({
            'type': 'mdc_prefix_with_extra_parenthesis',
            'line_number': line_number,
            'match': match.group(0),
            'start': match.start(),
            'end': match.end(),
            'details': f"MDC prefix with extra parenthesis: {match.group(0)}"
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
    """Fix broken patterns in a single line"""
    if not broken_patterns:
        return line, 0
    
    # Group patterns by line number
    line_patterns = [p for p in broken_patterns if p['line_number'] == broken_patterns[0]['line_number']]
    
    if not line_patterns:
        return line, 0
    
    # Sort patterns by start position (rightmost first for safe replacement)
    sorted_patterns = sorted(line_patterns, key=lambda x: x['start'], reverse=True)
    
    updated_line = line
    fixes_made = 0
    
    for pattern in sorted_patterns:
        if pattern['type'] == 'nested_brackets_double_path':
            # Extract filename from pattern like [`[01_Idea.mdc](.cursor/rules/01__AI-RUN/01_Idea.mdc)`](.cursor/rules/01__AI-RUN/01_Idea.mdc)
            match_text = pattern['match']
            # Find the first filename between brackets
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed nested brackets with double paths for {filename}")
        
        elif pattern['type'] == 'mixed_text_embedded_link':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed mixed text with embedded link for {filename}")
        
        elif pattern['type'] == 'complex_bracket_backtick':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed complex bracket/backtick combination for {filename}")
        
        elif pattern['type'] == 'double_square_brackets':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed double square brackets for {filename}")
        
        elif pattern['type'] == 'backtick_bracket_combo':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed backtick-bracket combination for {filename}")
        
        elif pattern['type'] == 'missing_opening_bracket':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed missing opening bracket for {filename}")
        
        elif pattern['type'] == 'complex_nested_backticks':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed complex nested backticks with brackets for {filename}")
        
        elif pattern['type'] == 'missing_close_bracket':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed missing close bracket for {filename}")
        
        elif pattern['type'] == 'complex_nested_backticks_paths':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed complex nested backticks with paths for {filename}")
        
        elif pattern['type'] == 'missing_close_bracket_with_text':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed missing close bracket with text for {filename}")
        
        elif pattern['type'] == 'nested_backtick_brackets':
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed nested backtick brackets for {filename}")
        
        elif pattern['type'] == 'complex_nested_bracket_pattern':
            match_text = pattern['match']
            # Find the inner filename between the SECOND [ and SECOND ]
            # The pattern is [`[filename](path)`](path)
            # So we need to find the second [ and second ]
            first_bracket = match_text.find('[')
            second_bracket = match_text.find('[', first_bracket + 1)
            second_bracket_end = match_text.find(']', second_bracket)
            
            if second_bracket != -1 and second_bracket_end != -1:
                filename = match_text[second_bracket+1:second_bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed complex nested bracket pattern for {filename}")
        
        elif pattern['type'] == 'extra_closing_parenthesis':
            # Pattern: [filename](path)) - just remove the extra closing parenthesis
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed extra closing parenthesis for {filename}")
        
        elif pattern['type'] == 'mdc_prefix_in_path':
            # Pattern: [filename](mdc:path) - remove mdc: prefix
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed mdc: prefix in path for {filename}")
        
        elif pattern['type'] == 'mdc_prefix_with_extra_parenthesis':
            # Pattern: [filename](mdc:path)) - remove mdc: prefix and extra parenthesis
            match_text = pattern['match']
            bracket_start = match_text.find('[')
            bracket_end = match_text.find(']', bracket_start)
            if bracket_start != -1 and bracket_end != -1:
                filename = match_text[bracket_start+1:bracket_end]
                if filename in file_mappings:
                    correct_path = file_mappings[filename]
                    replacement = f"[{filename}]({correct_path})"
                    
                    start_pos = pattern['start']
                    end_pos = pattern['end']
                    updated_line = updated_line[:start_pos] + replacement + updated_line[end_pos:]
                    fixes_made += 1
                    print(f"  → Fixed mdc: prefix with extra parenthesis for {filename}")
    
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
    
    # Process each line
    for line_number, line in enumerate(lines, 1):
        # Detect broken patterns in this line
        broken_patterns = detect_broken_patterns_in_line(line, line_number)
        
        if broken_patterns:
            # Fix the broken patterns in this line
            updated_line, fixes = fix_broken_patterns_in_line(line, broken_patterns, file_mappings)
            updated_lines.append(updated_line)
            total_fixes += fixes
        else:
            # No broken patterns, keep line as is
            updated_lines.append(line)
    
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