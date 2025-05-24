# Source Projects Directory

This directory contains sub-git projects for building coding projects.

## Structure

```
src/
├── projects/          # Sub-git repositories for individual coding projects
├── docs/             # Documentation for all src projects
├── scripts/          # Build and management scripts
├── config/           # Configuration files for project management
└── README.md         # This file
```

## Sub-Git Project Management

### Adding a New Sub-Project
```bash
# Navigate to projects directory
cd src/projects

# Add a new git submodule
git submodule add <repository-url> <project-name>

# Or clone a repository directly
git clone <repository-url> <project-name>
```

### Project Organization
- Each project in `projects/` should be a separate git repository
- Use descriptive folder names for projects
- Maintain individual README.md files for each project
- Keep project-specific configurations within each project

### Build Management
- Use `scripts/` for cross-project build automation
- Use `config/` for shared configuration files
- Document all projects in `docs/`

## Getting Started

1. Navigate to `src/projects/`
2. Clone or add your coding projects as submodules
3. Use the management scripts in `scripts/` for automation
4. Update documentation in `docs/` for each project

## Integration with Main Framework

This src structure is independent of the main `agents/_store/` framework but can be integrated through:
- Build scripts that reference both structures
- Shared configuration management
- Cross-project dependency tracking 