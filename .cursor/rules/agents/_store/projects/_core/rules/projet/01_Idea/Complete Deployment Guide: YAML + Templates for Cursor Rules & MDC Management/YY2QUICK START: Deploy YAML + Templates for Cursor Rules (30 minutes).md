# =============================================================================
# QUICK START: Deploy YAML + Templates for Cursor Rules (30 minutes)
# =============================================================================

# Step 1: Run the automated setup (5 minutes)
curl -sL https://raw.githubusercontent.com/your-repo/cursor-rules-manager/main/deploy.sh | bash
cd cursor-rules-manager

# Step 2: Create your first project (5 minutes)
npm run setup:project
# Follow the prompts:
# - Project name: "My React App"
# - Type: "web_application" 
# - Team: "frontend-team"
# - Frameworks: "react,typescript"

# Step 3: Build cursor rules (2 minutes)
npm run build

# Step 4: Copy to your actual project (1 minute)
cp output/.cursor/rules/my-react-app..cursor/rules ~/my-actual-project/..cursor/rules

# Step 5: Start development mode (ongoing)
npm run dev  # Watches for changes and rebuilds automatically

# =============================================================================
# USAGE EXAMPLES
# =============================================================================

# Create different project types
npm run setup:project  # Interactive wizard

# Or create manually:
cat > config/projects/backend-api.yaml << 'EOF'
project:
  name: "Backend API"
  type: "api_service"
  frameworks: ["node", "typescript", "express"]
  
settings:
  strict_mode: true
  security_critical: true
  
rules:
  api:
    openapi_required: true
    rate_limiting: true
  testing:
    coverage_threshold: 85
    
build:
  output_formats: [".cursor/rules", "mdc"]
EOF

# Build specific project
npm run build:project backend-api

# Build all projects
npm run build:all

# Validate configuration
npm run validate

# Clean generated files
npm run clean

# Preview HTML output
npm run preview  # Opens browser at http://localhost:3000

# =============================================================================
# TEAM WORKFLOW SETUP
# =============================================================================

# 1. Set up team configurations
cat > config/teams/my-team.yaml << 'EOF'
team:
  name: "My Development Team"
  lead: "team-lead@company.com"
  members: 5
  
preferences:
  frameworks: ["react", "node", "typescript"]
  testing: ["jest", "testing-library"]
  tools: ["vscode", "github"]
  
rules:
  code_review:
    required_reviewers: 2
    checklist:
      - "Tests added/updated"
      - "Documentation updated"
      - "Performance impact considered"
EOF

# 2. Configure Git hooks for automatic builds
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run validate
npm run build
git add output/
EOF

# 3. Set up CI/CD (GitHub Actions already included)
git add .
git commit -m "feat: add cursor rules automation"
git push  # Triggers automatic build in CI

# =============================================================================
# CUSTOMIZATION EXAMPLES
# =============================================================================

# Create custom framework rules
cat > config/frameworks/vue.yaml << 'EOF'
framework:
  name: "Vue"
  version: "3.x"
  
rules:
  components:
    single_file: true
    composition_api: true
    script_setup: true
    
  naming:
    components: "PascalCase"
    composables: "use_prefix"
    
  testing:
    framework: "@vue/test-utils"
    coverage_threshold: 80
EOF

# Create custom templates
cat > templates/.cursor/rules/vue-custom.hbs << 'EOF'
# {{project.name}} - Vue 3 Rules

## Vue 3 Guidelines
- Use Composition API with <script setup>
- Components in PascalCase
- Composables with "use" prefix
- Single File Components only

{{#with vue}}
### Component Structure
{{#if single_file}}
- Use .vue single file components
{{/if}}
{{#if composition_api}}
- Prefer Composition API over Options API
{{/if}}
{{/with}}
EOF

# Use custom template in project config
cat > config/projects/vue-app.yaml << 'EOF'
project:
  name: "Vue App"
  frameworks: ["vue", "typescript"]
  
build:
  template: "vue-custom"  # Uses vue-custom.hbs
  output_formats: [".cursor/rules", "mdc"]
EOF

# =============================================================================
# ADVANCED FEATURES
# =============================================================================

# 1. Multi-project management
npm run build:all  # Builds all projects in config/projects/

# 2. Environment-specific rules
cat > config/projects/production-app.yaml << 'EOF'
project:
  name: "Production App"
  environments:
    development:
      strict_mode: false
      debug: true
    production:
      strict_mode: true
      performance_critical: true
      security_critical: true
EOF

# 3. Shared constants across projects
# Edit config/shared/constants.yaml to add company-wide standards

# 4. Template inheritance
cat > templates/.cursor/rules/partials/common-header.hbs << 'EOF'
# {{project.name}} Development Rules
Generated: {{build.timestamp}}
Team: {{project.team}}

## Common Standards
- Code review required
- Tests must pass
- Documentation updated
EOF

# Use in templates:
# {{> common-header}}

# =============================================================================
# DEPLOYMENT TO PRODUCTION
# =============================================================================

# 1. Build for production
NODE_ENV=production npm run build:all

# 2. Deploy via npm script
npm run deploy  # Builds, validates, commits, and pushes

# 3. Distribute to team projects
# Option A: Copy manually
cp output/.cursor/rules/*..cursor/rules ~/team-projects/

# Option B: Create distribution script
cat > scripts/distribute.js << 'EOF'
#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const projects = [
  '~/frontend-app',
  '~/backend-api',
  '~/mobile-app'
];

for (const project of projects) {
  const projectName = path.basename(project);
  const source = `output/.cursor/rules/${projectName}..cursor/rules`;
  const target = `${project}/..cursor/rules`;
  
  try {
    await fs.copyFile(source, target);
    console.log(`✅ Updated ${project}`);
  } catch (error) {
    console.error(`❌ Failed to update ${project}:`, error.message);
  }
}
EOF

# Run distribution
node scripts/distribute.js

# =============================================================================
# MONITORING AND MAINTENANCE
# =============================================================================

# 1. Set up file watching for auto-rebuild
npm run dev  # Watches config/ and templates/ for changes

# 2. Regular validation
npm run validate  # Check all YAML files for syntax errors

# 3. Clean rebuilds
npm run clean && npm run build:all

# 4. Update shared constants
# Edit config/shared/constants.yaml
# Run npm run build:all to propagate changes

# =============================================================================
# INTEGRATION WITH EXISTING PROJECTS
# =============================================================================

# 1. Add to existing project
cd ~/my-existing-project
curl -sL https://setup-cursor-rules.sh | bash
# Copies nearest matching configuration

# 2. Create project-specific config
mkdir .cursor-rules
cd .cursor-rules
npm init cursor-rules  # Interactive setup

# 3. Link to central manager
ln -s ~/cursor-rules-manager/output/.cursor/rules/my-project..cursor/rules ..cursor/rules

# =============================================================================
# TROUBLESHOOTING
# =============================================================================

# Common issues and solutions:

# Issue: Build fails with template error
# Solution: Check template syntax and partial references
npm run validate
# Check templates/*/partials/ exist

# Issue: YAML parsing error
# Solution: Validate YAML syntax
npm run lint:yaml

# Issue: Missing project configuration
# Solution: Ensure project file exists in config/projects/
ls config/projects/

# Issue: Generated file is empty
# Solution: Check template data and Handlebars syntax
# Add debug output: {{json this}}

# Issue: Git hooks not working
# Solution: Reinstall husky
npx husky install

# =============================================================================
# BACKUP AND RESTORE
# =============================================================================

# Backup configuration
tar -czf cursor-rules-backup-$(date +%Y%m%d).tar.gz config/ templates/

# Restore from backup
tar -xzf cursor-rules-backup-20250526.tar.gz

# Version control best practices
git tag -a v1.0.0 -m "Initial cursor rules setup"
git push origin v1.0.0

echo "🎉 YAML + Templates Cursor Rules Manager is now deployed and ready!"
echo ""
echo "Quick start commands:"
echo "  npm run setup:project    # Create new project"
echo "  npm run build           # Build cursor rules"
echo "  npm run dev             # Development mode"
echo "  npm run validate        # Check configuration"
echo ""
echo "Generated files are in: output/"
echo "Copy ..cursor/rules files to your projects and start coding!"