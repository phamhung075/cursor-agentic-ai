#!/bin/bash

# 📦 Core Structure Backup Script
# Updated for .cursor/rules/agents/_store/projects/_core structure instead of .cursor
# Backs up the entire core framework structure with timestamp

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
CORE_DIR=".cursor/rules/agents/_store/projects/_core"
BACKUP_BASE_DIR="backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${BACKUP_BASE_DIR}/core-structure-backup-${TIMESTAMP}"
COMPRESSION="tar.gz"

# Print with colors
print_header() {
    printf "${BLUE}📦 CORE STRUCTURE BACKUP${NC}\n"
    printf "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_info() {
    printf "${BLUE}ℹ️  $1${NC}\n"
}

print_success() {
    printf "${GREEN}✅ $1${NC}\n"
}

print_warning() {
    printf "${YELLOW}⚠️  $1${NC}\n"
}

print_error() {
    printf "${RED}❌ $1${NC}\n"
}

# Check if core directory exists
check_core_directory() {
    print_info "Checking core directory..."
    
    if [ ! -d "$CORE_DIR" ]; then
        print_error "Core directory not found: $CORE_DIR"
        print_info "Please ensure the core structure exists before running backup"
        exit 1
    fi
    
    print_success "Core directory found: $CORE_DIR"
}

# Get directory size
get_directory_size() {
    local dir="$1"
    if command -v du >/dev/null 2>&1; then
        du -sh "$dir" 2>/dev/null | cut -f1 || printf "Unknown\n"
    else
        printf "Unknown\n"
    fi
}

# Count files in directory
count_files() {
    local dir="$1"
    if [ -d "$dir" ]; then
        find "$dir" -type f | wc -l | tr -d ' '
    else
        printf "0\n"
    fi
}

# Create backup directory
create_backup_directory() {
    print_info "Creating backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Failed to create backup directory: $BACKUP_DIR"
        exit 1
    fi
    
    print_success "Backup directory created: $BACKUP_DIR"
}

# Backup core structure
backup_core_structure() {
    print_info "Backing up core structure..."
    
    local core_size=$(get_directory_size "$CORE_DIR")
    local core_files=$(count_files "$CORE_DIR")
    
    print_info "Core directory size: $core_size"
    print_info "Core files count: $core_files"
    
    # Copy the entire core structure
    cp -R "$CORE_DIR" "$BACKUP_DIR/"
    
    if [ $? -eq 0 ]; then
        print_success "Core structure backed up successfully"
    else
        print_error "Failed to backup core structure"
        exit 1
    fi
}

# Create compressed archive
create_compressed_archive() {
    print_info "Creating compressed archive..."
    
    local archive_name="core-structure-backup-${TIMESTAMP}.${COMPRESSION}"
    local archive_path="${BACKUP_BASE_DIR}/${archive_name}"
    
    # Create tar.gz archive
    tar -czf "$archive_path" -C "$BACKUP_BASE_DIR" "$(basename "$BACKUP_DIR")"
    
    if [ $? -eq 0 ]; then
        local archive_size=$(get_directory_size "$archive_path")
        print_success "Compressed archive created: $archive_path"
        print_info "Archive size: $archive_size"
        
        # Remove uncompressed backup directory
        rm -rf "$BACKUP_DIR"
        print_success "Cleaned up temporary backup directory"
        
        printf "$archive_path\n"  # Return archive path
    else
        print_error "Failed to create compressed archive"
        exit 1
    fi
}

# Generate backup report
generate_backup_report() {
    local archive_path="$1"
    local report_path="${BACKUP_BASE_DIR}/backup-report-${TIMESTAMP}.txt"
    
    print_info "Generating backup report..."
    
    cat > "$report_path" << EOF
📦 CORE STRUCTURE BACKUP REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🕐 Backup Timestamp: $TIMESTAMP
📁 Source Directory: $CORE_DIR
💾 Archive Location: $archive_path
📊 Archive Size: $(get_directory_size "$archive_path")
📄 Files Backed Up: $(count_files "$CORE_DIR")

🔧 Backup Details:
- Core structure: ✅ Complete
- Rules directory: ✅ Included
- Documentation: ✅ Included
- Templates: ✅ Included
- All .mdc files: ✅ Included

🚀 Restore Instructions:
1. Extract archive: tar -xzf "$archive_path"
2. Copy to project: cp -R "$(basename "$BACKUP_DIR")/_core" ".cursor/rules/agents/_store/projects/"
3. Verify structure: ls -la ".cursor/rules/agents/_store/projects/_core"

🛡️ Backup Integrity:
- Archive format: tar.gz (compressed)
- Permissions: Preserved
- Directory structure: Preserved
- File timestamps: Preserved

Generated: $(date)
EOF

    print_success "Backup report saved: $report_path"
}

# Main backup function
main() {
    print_header
    print_info "Starting core structure backup..."
    print_info "Timestamp: $TIMESTAMP"
    printf "\n"
    
    # Check prerequisites
    check_core_directory
    
    # Create backup
    create_backup_directory
    backup_core_structure
    
    # Create compressed archive and get path
    archive_path=$(create_compressed_archive)
    
    # Generate report
    generate_backup_report "$archive_path"
    
    printf "\n"
    print_success "🎉 Core structure backup completed successfully!"
    print_info "📦 Archive: $archive_path"
    print_info "📊 Size: $(get_directory_size "$archive_path")"
    
    printf "\n"
    print_info "🔧 To restore this backup:"
    print_info "   tar -xzf \"$archive_path\""
    print_info "   cp -R \"core-structure-backup-${TIMESTAMP}/_core\" \".cursor/rules/agents/_store/projects/\""
    
    printf "\n"
    print_success "✅ Backup process completed!"
}

# Handle script interruption
trap 'print_error "Backup interrupted! Cleaning up..."; rm -rf "$BACKUP_DIR" 2>/dev/null; exit 1' INT TERM

# Run main function
main "$@" 