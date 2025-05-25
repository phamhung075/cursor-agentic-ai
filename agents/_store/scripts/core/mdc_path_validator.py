#!/usr/bin/env python3
"""
MDC Path Validator & Fixer
Validates and fixes markdown links in MDC files to use proper relative paths from project root
Integrates with existing path management tools
"""

import os
import re
import subprocess
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional

class MDCPathValidator:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.core_path = self.project_root / "agents/_store/projects/_core"
        self.rules_path = self.core_path / "rules"
        
        # Track all valid files in the project
        self.valid_files = {}
        self.scan_results = {
            "total_files_scanned": 0,
            "total_links_found": 0,
            "broken_links": [],
            "fixed_links": [],
            "relative_path_updates": []
        }
        
        # Load existing file mappings from core tools
        self.load_existing_mappings()
    
    def load_existing_mappings(self):
        """Load existing file mappings from core tools"""
        try:
            # Load from cursor_files_list.mdc if available
            cursor_files_list = self.core_path / "rules/00__TOOLS/cursor_files_list.mdc"
            if cursor_files_list.exists():
                with open(cursor_files_list, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if ' : [' in line and '](' in line:
                            # Parse format: filename : [filename](path)
                            match = re.match(r'(.+?) : \[(.+?)\]\((.+?)\)', line)
                            if match:
                                filename = match.group(1)
                                path = match.group(3)
                                self.valid_files[filename] = path
                                
            print(f"✅ Loaded {len(self.valid_files)} existing file mappings")
        except Exception as e:
            print(f"⚠️ Could not load existing mappings: {e}")
    
    def scan_project_files(self):
        """Scan project for all MDC and related files"""
        print("🔍 Scanning project files...")
        
        # Use find command to get all relevant files
        try:
            result = subprocess.run([
                'find', str(self.project_root), '-type', 'f',
                '(', '-name', '*.mdc', '-o', '-name', '*.md', '-o', '-name', '*.json', ')',
                '!', '-path', '*/node_modules/*',
                '!', '-path', '*/.git/*',
                '!', '-name', '.*'
            ], capture_output=True, text=True, cwd=self.project_root)
            
            if result.returncode == 0:
                files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
                
                for file_path in files:
                    # Convert to relative path from project root
                    rel_path = os.path.relpath(file_path, self.project_root)
                    filename = os.path.basename(file_path)
                    
                    # Store both filename and full relative path
                    self.valid_files[filename] = rel_path
                    self.valid_files[rel_path] = rel_path
                
                print(f"✅ Found {len(files)} project files")
                return files
            else:
                print(f"❌ Error scanning files: {result.stderr}")
                return []
                
        except Exception as e:
            print(f"❌ Error during file scan: {e}")
            return []
    
    def calculate_relative_path(self, from_file: str, to_file: str) -> str:
        """Calculate proper relative path from one file to another"""
        from_dir = os.path.dirname(from_file)
        
        # If to_file is already a relative path from project root, use it
        if not os.path.isabs(to_file):
            # Calculate relative path from from_file's directory to to_file
            try:
                rel_path = os.path.relpath(to_file, from_dir)
                return rel_path
            except ValueError:
                # Fallback to absolute path from project root
                return to_file
        
        # For absolute paths, convert to relative
        try:
            rel_path = os.path.relpath(to_file, from_dir)
            return rel_path
        except ValueError:
            return to_file
    
    def find_markdown_links(self, content: str) -> List[Tuple[str, str, str]]:
        """Find all markdown links in content"""
        # Pattern for markdown links: [text](path)
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        matches = []
        
        for match in re.finditer(link_pattern, content):
            full_match = match.group(0)
            link_text = match.group(1)
            link_path = match.group(2)
            matches.append((full_match, link_text, link_path))
        
        return matches
    
    def validate_link_path(self, link_path: str, current_file: str) -> Tuple[bool, str]:
        """Validate if a link path exists and return corrected path if needed"""
        # Skip external URLs
        if link_path.startswith(('http://', 'https://', 'mailto:', '#')):
            return True, link_path
        
        # Skip special prefixes
        if link_path.startswith(('mdc:', 'file:')):
            # Remove prefix and validate the actual path
            clean_path = link_path.split(':', 1)[1] if ':' in link_path else link_path
            return self.validate_link_path(clean_path, current_file)
        
        current_dir = os.path.dirname(current_file)
        
        # Try to resolve the path
        if os.path.isabs(link_path):
            # Absolute path
            target_path = link_path
        else:
            # Relative path
            target_path = os.path.join(current_dir, link_path)
        
        # Normalize the path
        target_path = os.path.normpath(target_path)
        
        # Check if file exists
        if os.path.exists(target_path):
            # Calculate proper relative path from project root
            try:
                rel_from_root = os.path.relpath(target_path, self.project_root)
                proper_rel_path = self.calculate_relative_path(current_file, rel_from_root)
                return True, proper_rel_path
            except ValueError:
                return True, link_path
        
        # Try to find the file by name in our valid files
        filename = os.path.basename(link_path)
        if filename in self.valid_files:
            target_rel_path = self.valid_files[filename]
            proper_rel_path = self.calculate_relative_path(current_file, target_rel_path)
            return True, proper_rel_path
        
        return False, link_path
    
    def fix_file_links(self, file_path: str, dry_run: bool = True) -> Dict:
        """Fix links in a single file"""
        results = {
            "file": file_path,
            "links_found": 0,
            "links_fixed": 0,
            "broken_links": [],
            "fixes_applied": []
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            links = self.find_markdown_links(content)
            results["links_found"] = len(links)
            
            for full_match, link_text, link_path in links:
                is_valid, corrected_path = self.validate_link_path(link_path, file_path)
                
                if not is_valid:
                    results["broken_links"].append({
                        "text": link_text,
                        "path": link_path,
                        "full_match": full_match
                    })
                elif corrected_path != link_path:
                    # Path needs correction
                    new_link = f"[{link_text}]({corrected_path})"
                    content = content.replace(full_match, new_link)
                    
                    results["fixes_applied"].append({
                        "original": full_match,
                        "fixed": new_link,
                        "old_path": link_path,
                        "new_path": corrected_path
                    })
                    results["links_fixed"] += 1
            
            # Write back if not dry run and changes were made
            if not dry_run and content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Fixed {results['links_fixed']} links in {file_path}")
            elif dry_run and content != original_content:
                print(f"🔍 Would fix {results['links_fixed']} links in {file_path}")
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            results["error"] = str(e)
        
        return results
    
    def validate_all_mdc_files(self, dry_run: bool = True) -> Dict:
        """Validate and fix all MDC files in the project"""
        print("🔧 MDC PATH VALIDATOR")
        print("━" * 60)
        
        # Scan for files
        self.scan_project_files()
        
        # Find all MDC files
        mdc_files = []
        for root, dirs, files in os.walk(self.project_root):
            # Skip certain directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__']]
            
            for file in files:
                if file.endswith('.mdc'):
                    mdc_files.append(os.path.join(root, file))
        
        print(f"📄 Found {len(mdc_files)} MDC files to validate")
        
        all_results = {
            "total_files": len(mdc_files),
            "files_processed": 0,
            "total_links_found": 0,
            "total_links_fixed": 0,
            "total_broken_links": 0,
            "file_results": []
        }
        
        for mdc_file in mdc_files:
            print(f"\n📝 Processing: {os.path.relpath(mdc_file, self.project_root)}")
            
            file_results = self.fix_file_links(mdc_file, dry_run)
            all_results["file_results"].append(file_results)
            all_results["files_processed"] += 1
            all_results["total_links_found"] += file_results["links_found"]
            all_results["total_links_fixed"] += file_results["links_fixed"]
            all_results["total_broken_links"] += len(file_results["broken_links"])
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Files processed: {all_results['files_processed']}")
        print(f"Total links found: {all_results['total_links_found']}")
        print(f"Links fixed: {all_results['total_links_fixed']}")
        print(f"Broken links: {all_results['total_broken_links']}")
        
        if dry_run:
            print("\n🔍 DRY RUN MODE - No files were modified")
            print("Run with --fix to apply changes")
        
        return all_results
    
    def update_core_files_list(self):
        """Update the core files list with current project structure"""
        print("📋 Updating core files list...")
        
        # Use existing script if available
        update_script = self.project_root / "agents/_store/scripts/core/update_core_files_list.py"
        if update_script.exists():
            try:
                subprocess.run(['python3', str(update_script)], cwd=self.project_root, check=True)
                print("✅ Core files list updated successfully")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error updating core files list: {e}")
        else:
            print("⚠️ Core files list update script not found")
    
    def generate_path_report(self, results: Dict) -> str:
        """Generate a detailed path validation report"""
        report = []
        report.append("# MDC Path Validation Report")
        report.append(f"Generated: {os.popen('date').read().strip()}")
        report.append("")
        
        report.append("## Summary")
        report.append(f"- Files processed: {results['files_processed']}")
        report.append(f"- Total links found: {results['total_links_found']}")
        report.append(f"- Links fixed: {results['total_links_fixed']}")
        report.append(f"- Broken links: {results['total_broken_links']}")
        report.append("")
        
        if results['total_broken_links'] > 0:
            report.append("## Broken Links")
            for file_result in results['file_results']:
                if file_result['broken_links']:
                    report.append(f"### {file_result['file']}")
                    for broken_link in file_result['broken_links']:
                        report.append(f"- `{broken_link['path']}` (text: {broken_link['text']})")
            report.append("")
        
        if results['total_links_fixed'] > 0:
            report.append("## Fixed Links")
            for file_result in results['file_results']:
                if file_result['fixes_applied']:
                    report.append(f"### {file_result['file']}")
                    for fix in file_result['fixes_applied']:
                        report.append(f"- `{fix['old_path']}` → `{fix['new_path']}`")
            report.append("")
        
        return "\n".join(report)

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='MDC Path Validator & Fixer')
    parser.add_argument('--fix', action='store_true', help='Apply fixes (default is dry run)')
    parser.add_argument('--update-list', action='store_true', help='Update core files list first')
    parser.add_argument('--report', type=str, help='Generate report file')
    parser.add_argument('--project-root', type=str, default='.', help='Project root directory')
    
    args = parser.parse_args()
    
    validator = MDCPathValidator(args.project_root)
    
    if args.update_list:
        validator.update_core_files_list()
    
    # Run validation
    results = validator.validate_all_mdc_files(dry_run=not args.fix)
    
    # Generate report if requested
    if args.report:
        report_content = validator.generate_path_report(results)
        with open(args.report, 'w', encoding='utf-8') as f:
            f.write(report_content)
        print(f"📄 Report saved to: {args.report}")

if __name__ == "__main__":
    main() 