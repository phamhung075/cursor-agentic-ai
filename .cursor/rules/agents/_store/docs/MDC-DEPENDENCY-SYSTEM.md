# 📋 MDC Dependency System

## Overview

The MDC Dependency System provides automatic tracking and updating of `.mdc` files and their dependencies. When you edit an `.mdc` file in Cursor, the system automatically:

- Detects file changes
- Analyzes dependencies
- Updates related files
- Runs update scripts
- Refreshes Cursor summaries

## 🚀 Quick Start

### 1. Initialize the System

```bash
npm run mdc:init
```

### 2. Setup Cursor Integration

```bash
npm run mdc:cursor-setup
```

### 3. Start Watching Files

```bash
npm run mdc:watch
```

## 📋 How It Works

### Dependency Detection

The system automatically detects dependencies through:

1. **File References**: Markdown links `[text](file.path)`
2. **Dependency Comments**: `<!-- DEPENDS: file1.mdc, file2.mdc -->`
3. **Update Script Comments**: `<!-- UPDATE_SCRIPT: npm run some-command -->`
4. **Auto-detection**: Based on file location (rules, config, etc.)

### Example .mdc File with Dependencies

```markdown
<!-- DEPENDS: ../config/settings.mdc, ./related-rule.mdc -->
<!-- UPDATE_SCRIPT: npm run mdc:update-rules -->

# My Rule File

This rule depends on [settings](../config/settings.mdc) and 
references [another rule](./related-rule.mdc).

When this file changes, the system will:
- Update the dependent files
- Run the update script
- Refresh Cursor summaries
```

## 🎯 Cursor Integration Features

### Automatic File Associations

- `.mdc` files are treated as enhanced markdown
- Syntax highlighting and IntelliSense
- File watching and change detection

### Real-time Updates

- File changes trigger dependency updates
- Cursor summaries are refreshed automatically
- Background processing with debouncing

### Cursor Tasks

Access via Command Palette (`Ctrl/Cmd+Shift+P`):

- **MDC: Initialize Dependency Tracking**
- **MDC: Start Dependency Watcher**
- **MDC: Scan Dependencies**
- **MDC: Show Dependency Status**
- **MDC: Update Rules**

## 📂 File Structure

```
.cursor/
├── mdc-dependencies.json          # Dependency mappings
├── settings.json                  # Enhanced with MDC settings
└── tasks.json                     # MDC-specific tasks

.cursor/rules/agents/_store/
├── scripts/
│   ├── mdc-dependency-tracker.js  # Core dependency tracker
│   ├── cursor-mdc-integration.js  # Cursor integration
│   └── cursor-mdc-watcher.js      # File watcher
└── cursor-summaries/
    ├── mdc-dependency-updates.json # Update history
    └── latest-insights.json        # Current status
```

## 🔧 Available Commands

### Core Commands

```bash
# Initialize dependency tracking
npm run mdc:init

# Start file watcher
npm run mdc:watch

# Scan for dependencies
npm run mdc:scan

# Show status
npm run mdc:status
```

### Cursor Integration

```bash
# Setup Cursor integration
npm run mdc:cursor-setup

# Check integration status
npm run mdc:cursor-status

# Start Cursor file watcher
npm run mdc:cursor-watch
```

### Update Commands

```bash
# Update rules
npm run mdc:update-rules

# Update documentation
npm run mdc:update-docs
```

## 🎨 Dependency Types

### 1. Dependent Files

Files that should be updated when the current file changes:

```markdown
<!-- DEPENDS: file1.mdc, file2.mdc -->
```

### 2. Update Scripts

Commands to run when the file changes:

```markdown
<!-- UPDATE_SCRIPT: npm run mdc:update-rules -->
```

### 3. Linked Files

Files referenced in markdown links (auto-detected):

```markdown
[Configuration](../config/settings.mdc)
```

### 4. Auto-detected Dependencies

Based on file location:

- Files in `/rules/` → `npm run mdc:update-rules`
- Files in `/config/` → `npm run cursor:update-settings`
- Files with "settings" → `npm run cursor:update-settings`

## 🔄 Update Process

When an `.mdc` file changes:

1. **Detection**: File watcher detects the change
2. **Analysis**: System analyzes the file for dependencies
3. **Queue**: Change is added to update queue (debounced)
4. **Processing**: 
   - Update dependent files
   - Run update scripts
   - Refresh Cursor summaries
5. **Notification**: Cursor is notified of updates

## 📊 Monitoring

### Check Status

```bash
npm run mdc:status
```

Shows:
- Number of tracked files
- Dependency mappings
- Watcher status
- Update queue size

### View Dependencies

Dependencies are stored in `.cursor/mdc-dependencies.json`:

```json
{
  ".cursor/rules/agents/_core/rules/example.mdc": {
    "dependentFiles": ["file1.mdc", "file2.mdc"],
    "updateScripts": ["npm run mdc:update-rules"],
    "linkedFiles": ["../config/settings.mdc"],
    "ruleFiles": [],
    "configFiles": []
  }
}
```

### Update History

View recent updates in `.cursor/rules/agents/_store/cursor-summaries/mdc-dependency-updates.json`

## 🛠️ Configuration

### Cursor Settings

The system adds these settings to `.cursor/settings.json`:

```json
{
  "mdc.dependencyTracking": {
    "enabled": true,
    "autoUpdate": true,
    "watchPatterns": ["**/*.mdc"],
    "updateScripts": {
      "rules": "npm run mdc:update-rules",
      "config": "npm run cursor:update-settings",
      "docs": "npm run mdc:update-docs"
    }
  }
}
```

### File Watching

Watches these patterns:
- `.cursor/rules/agents/**/*.mdc`
- `.cursor/**/*.mdc`
- `src/**/*.mdc`
- `**/*.mdc`

Ignores:
- `node_modules`
- `.git`
- `dist`, `build`
- `backup`, `backups`

## 🚨 Troubleshooting

### Watcher Not Starting

```bash
# Check if chokidar is installed
npm install chokidar

# Restart the watcher
npm run mdc:watch
```

### Dependencies Not Updating

```bash
# Rescan dependencies
npm run mdc:scan

# Check status
npm run mdc:status
```

### Cursor Integration Issues

```bash
# Re-setup integration
npm run mdc:cursor-setup

# Check integration status
npm run mdc:cursor-status
```

## 💡 Best Practices

### 1. Use Dependency Comments

Always add dependency comments to important `.mdc` files:

```markdown
<!-- DEPENDS: related-file.mdc -->
<!-- UPDATE_SCRIPT: npm run update-command -->
```

### 2. Organize Files

Structure your `.mdc` files logically:

```
.cursor/rules/agents/_core/
├── rules/
│   ├── 01_core.mdc
│   └── 02_specific.mdc
├── config/
│   └── settings.mdc
└── docs/
    └── guide.mdc
```

### 3. Use Relative Paths

Use relative paths in markdown links:

```markdown
[Settings](../config/settings.mdc)
[Related Rule](./related-rule.mdc)
```

### 4. Monitor Updates

Regularly check the status:

```bash
npm run mdc:status
```

## 🔗 Integration with Other Systems

### AAI Agent Integration

The MDC system integrates with the AAI agent:

- Updates trigger AAI memory updates
- Dependency changes are logged
- Cursor summaries include MDC status

### Cursor AI Integration

- MDC files are included in AI context
- Dependency information helps AI understand relationships
- Real-time updates keep AI context current

## 📈 Advanced Usage

### Custom Update Scripts

Create custom update scripts for specific file types:

```json
{
  "scripts": {
    "mdc:update-custom": "node custom-update-script.js"
  }
}
```

Reference in `.mdc` files:

```markdown
<!-- UPDATE_SCRIPT: npm run mdc:update-custom -->
```

### Conditional Dependencies

Use environment variables in update scripts:

```bash
# Only update in development
if [ "$NODE_ENV" = "development" ]; then
  npm run mdc:update-rules
fi
```

### Batch Updates

Process multiple files at once:

```bash
# Scan all files
npm run mdc:scan

# Update all rules
npm run mdc:update-rules
```

## 🎉 Benefits

1. **Automatic Synchronization**: Files stay in sync automatically
2. **Reduced Manual Work**: No need to manually update dependencies
3. **Cursor Integration**: Seamless IDE experience
4. **Real-time Updates**: Changes are processed immediately
5. **Intelligent Detection**: Smart dependency analysis
6. **Extensible**: Easy to add custom update scripts

## 🔍 System Architecture

### Core Components

1. **MDCDependencyTracker**: Main tracking engine
2. **CursorMDCIntegration**: Cursor IDE integration
3. **CursorMDCWatcher**: Real-time file monitoring
4. **Dependency Analyzer**: Smart dependency detection

### Data Flow

```
.mdc File Change → File Watcher → Dependency Analysis → Update Queue → 
Process Updates → Run Scripts → Update Summaries → Notify Cursor
```

### Performance Features

- **Debounced Updates**: Prevents excessive processing
- **Background Processing**: Non-blocking operations
- **Smart Caching**: Efficient dependency storage
- **Incremental Updates**: Only processes changed files

## 📝 Example Workflows

### Creating a New Rule

1. Create new `.mdc` file in `rules/` directory
2. Add dependency comments if needed
3. Save file - system automatically detects and tracks it
4. Edit file - dependencies are updated automatically

### Updating Configuration

1. Edit configuration `.mdc` file
2. System detects change and runs update scripts
3. Dependent files are automatically updated
4. Cursor summaries are refreshed

### Bulk Operations

1. Run `npm run mdc:scan` to refresh all dependencies
2. Use `npm run mdc:status` to monitor system health
3. Check update history in cursor summaries

The MDC Dependency System ensures your `.mdc` files and their dependencies are always synchronized, providing a seamless development experience in Cursor! 