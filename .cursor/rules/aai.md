# AAI Development Rules for Cursor

## Context Awareness
- Always check agents/_store/cursor-summaries/ for latest context
- Reference agents/_core/rules/ for coding conventions
- Use agents/_store/memory/ for historical insights

## File Patterns
- `.mdc` files are enhanced markdown with metadata
- `.memory.json` files contain agent learning data
- `.analysis.json` files contain code analysis results
- `.intelligence.json` files contain AI insights

## Development Workflow
1. Check workspace-context.json for current focus
2. Review latest-insights.json for recent analysis
3. Follow conventions in agents/_store/projects/_core/rules/
4. Update memory when making significant changes

## AI Assistance Guidelines
- Leverage AAI memory for context-aware suggestions
- Use project-specific memory for targeted recommendations
- Reference core framework patterns for consistency
- Maintain dual memory system (agent + project)

## Performance Considerations
- Cache frequently accessed AAI data
- Use incremental analysis for large codebases
- Optimize memory storage for quick retrieval
- Monitor file watcher performance

## Integration Points
- npm run AAI:* commands for agent operations
- Real-time memory sync with development actions
- Automatic context updates on file changes
- Intelligent code suggestions based on patterns
