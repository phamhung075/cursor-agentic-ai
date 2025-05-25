# Enhanced MDC Path Fixer

## 🎯 Overview

The Enhanced MDC Path Fixer is a comprehensive script designed to fix path issues in `.mdc` files while **preserving all URLs** (https:// and http://). This script addresses the specific requirement to skip all URLs while fixing broken paths, malformed links, and other path-related issues.

## 🌐 Key Feature: URL Preservation

**The script specifically skips all URLs starting with:**
- `https://`
- `http://`

This ensures that external links remain untouched while fixing internal file references.

## 🔧 Features

### ✅ What It Fixes
- **mdc: prefixed links** - Converts `[text](mdc:path)` to `[text](path)`
- **Broken markdown links** - Fixes empty links, malformed patterns
- **Invalid file paths** - Resolves and corrects file references
- **Redundant patterns** - Cleans up `/./ ` and multiple slashes
- **Numbered references** - Removes broken `[123]` and `](456)` patterns
- **Malformed extensions** - Fixes `.mdcc` to `.mdc`

### 🌐 What It Preserves
- **All https:// URLs** - External secure links
- **All http:// URLs** - External non-secure links
- **Anchor links** - Internal page anchors (`#section`)
- **Special protocols** - `mailto:`, `tel:`, etc.

## 📋 Usage

### Check Status
```bash
npm run mdc:status
```
Shows current status of .mdc files and potential issues.

### Dry Run (Preview Changes)
```bash
npm run mdc:fix
```
Shows what would be fixed without making changes.

### Apply Fixes
```bash
npm run mdc:fix-apply
```
Actually applies the fixes to files (creates backup first).

### Fix Specific File
```bash
npm run mdc:fix-file path/to/file.mdc
```
Fix a specific .mdc file only.

### Direct Script Usage
```bash
# Status check
node agents/_store/scripts/enhanced-mdc-path-fixer.js status

# Dry run
node agents/_store/scripts/enhanced-mdc-path-fixer.js fix

# Apply fixes
node agents/_store/scripts/enhanced-mdc-path-fixer.js fix --apply

# Fix specific file
node agents/_store/scripts/enhanced-mdc-path-fixer.js fix path/to/file.mdc
```

## 📊 Example Output

```
🔧 ENHANCED MDC PATH FIXER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 PRESERVING all https:// and http:// URLs
🔗 FIXING broken paths and malformed links

🔍 Scanning project files...
  ✅ Found 3430 valid files
📄 Found 598 .mdc file(s) to process

📝 Processing: agents/_store/docs/README.mdc
    🌐 Skipped URL: https://github.com/example/repo
    🌐 Skipped URL: https://www.youtube.com/watch?v=example
    🔧 Fixed mdc link: [text](mdc:path.mdc) → [text](path.mdc)
    🔗 Fixed empty link: [broken]() → broken
    🔧 Fixed path: old/path.mdc → correct/path.mdc
  🔍 Would fix 3 issues

════════════════════════════════════════════════════════════
📊 PROCESSING SUMMARY
════════════════════════════════════════════════════════════
Files processed: 598
Files fixed: 45
Total fixes applied: 229
URLs preserved: 15
Paths fixed: 180
Broken links fixed: 34
MDC links fixed: 15

🌐 All https:// and http:// URLs were preserved
```

## 🛡️ Safety Features

### Automatic Backup
- Creates timestamped backup directory before making changes
- Backup location: `backups/mdc-path-fix-YYYY-MM-DDTHH-MM-SS/`
- Only created when actually applying fixes (not in dry-run mode)

### Dry Run by Default
- All commands run in preview mode unless `--apply` is specified
- Shows exactly what would be changed before making modifications
- Allows safe testing and verification

### Error Handling
- Gracefully handles files that can't be read
- Reports errors without stopping the entire process
- Provides detailed error messages for troubleshooting

## 🔍 Technical Details

### URL Detection Logic
```javascript
isUrl(path) {
  return path.startsWith('http://') || path.startsWith('https://');
}
```

### Path Resolution
1. **Scan Project** - Builds map of all valid files
2. **Validate Links** - Checks if referenced files exist
3. **Resolve Paths** - Calculates correct relative paths
4. **Skip URLs** - Preserves all external links

### File Types Processed
- **Primary**: `.mdc` files (Markdown with metadata)
- **Reference**: `.md`, `.json`, `.js`, `.ts`, `.txt` (for path resolution)

### Directories Skipped
- `node_modules`, `.git`, `__pycache__`, `.vscode`
- `dist`, `build`, `cache`, `temp`, `.cursor`
- Any directory starting with `.`

## 📈 Performance

### Optimizations
- **Efficient Scanning** - Only processes relevant files
- **Smart Caching** - Builds file map once, reuses for all operations
- **Batch Processing** - Handles multiple fixes per file in single pass
- **Memory Efficient** - Processes files individually, not all at once

### Scale Handling
- Tested with 598+ .mdc files
- Handles 3000+ project files for reference resolution
- Processes hundreds of links per file efficiently

## 🚀 Integration

### Package.json Scripts
```json
{
  "mdc:status": "node agents/_store/scripts/enhanced-mdc-path-fixer.js status",
  "mdc:fix": "node agents/_store/scripts/enhanced-mdc-path-fixer.js fix",
  "mdc:fix-apply": "node agents/_store/scripts/enhanced-mdc-path-fixer.js fix --apply",
  "mdc:fix-file": "node agents/_store/scripts/enhanced-mdc-path-fixer.js fix"
}
```

### CI/CD Integration
```bash
# Check for issues in CI
npm run mdc:status

# Validate fixes in PR
npm run mdc:fix

# Apply fixes in deployment
npm run mdc:fix-apply
```

## 🔧 Troubleshooting

### Common Issues

**Issue**: Script reports "No .mdc files found"
**Solution**: Ensure you're running from project root directory

**Issue**: "Permission denied" errors
**Solution**: Check file permissions, ensure write access to target files

**Issue**: Backup directory creation fails
**Solution**: Ensure sufficient disk space and write permissions

### Debug Mode
Add verbose logging by modifying the script or checking individual file processing output.

### Recovery
If fixes cause issues:
1. Restore from automatic backup in `backups/` directory
2. Use git to revert changes if under version control
3. Re-run with specific file targeting to isolate issues

## 📝 Examples

### Before and After

**Before:**
```markdown
Check out [this guide](mdc:../guides/setup.mdc) and visit [our site](https://example.com).
Also see [broken]() and [old](./old/path.mdc).
```

**After:**
```markdown
Check out [this guide](../guides/setup.mdc) and visit [our site](https://example.com).
Also see broken and [old](correct/path.mdc).
```

**Note**: The URL `https://example.com` is preserved exactly as-is.

## 🎯 Use Cases

1. **Migration Cleanup** - After moving files or restructuring
2. **Documentation Maintenance** - Regular cleanup of broken links
3. **URL Preservation** - Ensuring external links remain functional
4. **Batch Processing** - Fixing multiple files efficiently
5. **CI/CD Integration** - Automated link validation and fixing

## 🔄 Related Scripts

- `agents/_store/scripts/core/mdc_path_validator.py` - Python-based validator
- `agents/_store/projects/core_path_analyzer.js` - Core path analysis
- `agents/_store/scripts/fix_single_mdc.py` - Single file fixer

## 📞 Support

For issues or enhancements:
1. Check existing scripts in `agents/_store/scripts/`
2. Review backup files if fixes cause problems
3. Use dry-run mode to test before applying changes
4. Check project structure and file permissions

---

**Key Takeaway**: This script is specifically designed to fix path issues while **preserving all URLs** (https:// and http://), making it safe for documentation with external links. 