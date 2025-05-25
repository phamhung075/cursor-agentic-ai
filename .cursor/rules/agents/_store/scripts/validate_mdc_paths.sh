#!/bin/bash

# MDC Path Validator Script
# Validates and fixes markdown links in MDC files using proper relative paths from root

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VALIDATOR_SCRIPT="$SCRIPT_DIR/core/mdc_path_validator.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    printf "${BLUE}[INFO]${NC} $1\n"
}

log_success() {
    printf "${GREEN}[SUCCESS]${NC} $1\n"
}

log_warning() {
    printf "${YELLOW}[WARNING]${NC} $1\n"
}

log_error() {
    printf "${RED}[ERROR]${NC} $1\n"
}

print_header() {
    printf "${PURPLE}$1${NC}\n"
}

print_subheader() {
    printf "${CYAN}$1${NC}\n"
}

# Function to show usage
show_usage() {
    cat << EOF
🔧 MDC Path Validator & Fixer

DESCRIPTION:
    Validates and fixes markdown links in MDC files to use proper relative paths
    from the project root. Integrates with existing path management tools.

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    validate        Validate all MDC files (dry run - no changes)
    fix            Fix all MDC files (applies changes)
    check FILE     Check specific file only
    update-list    Update core files list first, then validate
    report         Generate detailed validation report
    help           Show this help message

OPTIONS:
    --file FILE    Target specific file for validation/fixing
    --report FILE  Save detailed report to specified file
    --verbose      Show detailed output during processing

EXAMPLES:
    # Validate all MDC files (dry run)
    $0 validate

    # Fix all MDC files
    $0 fix

    # Check specific file
    $0 check .cursor/rules/agents/_store/projects/_core/rules/01__AI-RUN/02_Market_Research.mdc

    # Update file list and then validate
    $0 update-list

    # Generate report
    $0 report --report validation_report.md

    # Fix with detailed output
    $0 fix --verbose

INTEGRATION:
    This tool integrates with:
    - .cursor/rules/agents/_store/scripts/core/update_core_files_list.py
    - .cursor/rules/agents/_store/projects/_core/rules/00__TOOLS/cursor_files_list.mdc
    - Existing path management infrastructure

EOF
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Python 3 is available
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check if validator script exists
    if [[ ! -f "$VALIDATOR_SCRIPT" ]]; then
        log_error "Validator script not found: $VALIDATOR_SCRIPT"
        exit 1
    fi
    
    # Make sure script is executable
    chmod +x "$VALIDATOR_SCRIPT"
    
    log_success "Prerequisites check passed"
}

# Function to validate files (dry run)
validate_files() {
    local verbose=${1:-false}
    
    log_info "🔍 VALIDATING MDC FILES (DRY RUN)"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    local cmd="python3 \"$VALIDATOR_SCRIPT\" --project-root \"$PROJECT_ROOT\""
    
    if [[ "$verbose" == "true" ]]; then
        print_subheader "Running: $cmd"
    fi
    
    eval "$cmd"
    
    printf "\\n"
    log_info "Validation complete. No files were modified."
    log_info "Use 'fix' command to apply changes."
}

# Function to fix files
fix_files() {
    local verbose=${1:-false}
    
    log_info "🔧 FIXING MDC FILES"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    log_warning "This will modify your MDC files. Make sure you have backups!"
    read -p "Continue? (y/N): " -n 1 -r
    printf "\\n"
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
    
    local cmd="python3 \"$VALIDATOR_SCRIPT\" --fix --project-root \"$PROJECT_ROOT\""
    
    if [[ "$verbose" == "true" ]]; then
        print_subheader "Running: $cmd"
    fi
    
    eval "$cmd"
    
    log_success "MDC files have been fixed!"
}

# Function to check specific file
check_file() {
    local file="$1"
    local verbose=${2:-false}
    
    if [[ -z "$file" ]]; then
        log_error "No file specified"
        show_usage
        exit 1
    fi
    
    if [[ ! -f "$file" ]]; then
        log_error "File not found: $file"
        exit 1
    fi
    
    log_info "🔍 CHECKING FILE: $file"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    # For now, run full validation but focus output on the specific file
    local cmd="python3 \"$VALIDATOR_SCRIPT\" --project-root \"$PROJECT_ROOT\""
    
    if [[ "$verbose" == "true" ]]; then
        print_subheader "Running: $cmd"
    fi
    
    eval "$cmd" | grep -A 10 -B 2 "$(basename "$file")" || {
        log_info "Running full validation to check file..."
        eval "$cmd"
    }
}

# Function to update core files list and validate
update_and_validate() {
    local verbose=${1:-false}
    
    log_info "📋 UPDATING CORE FILES LIST & VALIDATING"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    local cmd="python3 \"$VALIDATOR_SCRIPT\" --update-list --project-root \"$PROJECT_ROOT\""
    
    if [[ "$verbose" == "true" ]]; then
        print_subheader "Running: $cmd"
    fi
    
    eval "$cmd"
    
    log_success "Core files list updated and validation complete!"
}

# Function to generate report
generate_report() {
    local report_file="$1"
    local verbose=${2:-false}
    
    if [[ -z "$report_file" ]]; then
        report_file="mdc_validation_report_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    log_info "📄 GENERATING VALIDATION REPORT"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    local cmd="python3 \"$VALIDATOR_SCRIPT\" --report \"$report_file\" --project-root \"$PROJECT_ROOT\""
    
    if [[ "$verbose" == "true" ]]; then
        print_subheader "Running: $cmd"
    fi
    
    eval "$cmd"
    
    log_success "Report generated: $report_file"
}

# Function to show project status
show_status() {
    log_info "📊 PROJECT STATUS"
    printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"
    
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Validator Script: $VALIDATOR_SCRIPT"
    
    # Count MDC files
    local mdc_count=$(find "$PROJECT_ROOT" -name "*.mdc" -type f | wc -l)
    log_info "MDC Files Found: $mdc_count"
    
    # Check if core files list exists
    local core_files_list="$PROJECT_ROOT/.cursor/rules/agents/_store/projects/_core/rules/00__TOOLS/cursor_files_list.mdc"
    if [[ -f "$core_files_list" ]]; then
        local list_count=$(wc -l < "$core_files_list")
        log_info "Core Files List: $list_count entries"
    else
        log_warning "Core files list not found"
    fi
    
    printf "\\n"
}

# Main script logic
main() {
    local command="$1"
    shift || true
    
    local verbose=false
    local target_file=""
    local report_file=""
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                verbose=true
                shift
                ;;
            --file)
                target_file="$2"
                shift 2
                ;;
            --report)
                report_file="$2"
                shift 2
                ;;
            *)
                if [[ -z "$target_file" && "$command" == "check" ]]; then
                    target_file="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Show status first
    show_status
    
    # Check prerequisites
    check_prerequisites
    
    # Execute command
    case "$command" in
        validate|"")
            validate_files "$verbose"
            ;;
        fix)
            fix_files "$verbose"
            ;;
        check)
            check_file "$target_file" "$verbose"
            ;;
        update-list)
            update_and_validate "$verbose"
            ;;
        report)
            generate_report "$report_file" "$verbose"
            ;;
        status)
            # Status already shown above
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            printf "\\n"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 