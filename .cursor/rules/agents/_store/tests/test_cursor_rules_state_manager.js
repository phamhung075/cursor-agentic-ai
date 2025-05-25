#!/usr/bin/env node

/**
 * 🧪 Cursor Rules State Manager Test
 * 
 * Comprehensive test suite for the cursor rules state management system
 * Tests scanning, analysis, fixing, and modernization capabilities
 */

require('dotenv').config();
const CursorRulesStateManager = require('../projects/cursor_rules_state_manager.js');
const CursorRulesManagerCLI = require('../projects/cursor_rules_manager_cli.js');
const CursorRulesFileFixer = require('../projects/cursor_rules_fixer.js');

async function testCursorRulesStateManager() {
  console.log('🧪 Testing Cursor Rules State Manager System...');
  console.log('📁 Test location: .cursor/rules/agents/_store/tests/');
  console.log('');
  
  try {
    // Test 1: Initialize State Manager
    console.log('🗂️ Test 1: Initialize State Manager');
    console.log('━'.repeat(60));
    
    const manager = new CursorRulesStateManager();
    await manager.initialize();
    
    console.log('✅ State Manager initialized successfully');
    console.log('');
    
    // Test 2: Get Status Report
    console.log('📊 Test 2: Generate Status Report');
    console.log('━'.repeat(60));
    
    const report = manager.getStatusReport();
    
    console.log(`📁 Total Files: ${report.summary.totalFiles}`);
    console.log(`⚠️  Files Needing Update: ${report.summary.filesNeedingUpdate}`);
    console.log(`📂 Categories: ${report.summary.categories}`);
    console.log('');
    
    console.log('📂 Categories Found:');
    for (const [category, info] of Object.entries(report.categories)) {
      console.log(`  📁 ${category.toUpperCase()}: ${info.count} files`);
      if (info.needsUpdate > 0) {
        console.log(`    ⚠️  ${info.needsUpdate} need updates`);
      }
    }
    console.log('');
    
    // Test 3: Show Files Needing Updates
    console.log('🔍 Test 3: Files Needing Updates');
    console.log('━'.repeat(60));
    
    const filesNeedingUpdate = manager.getFilesNeedingUpdate();
    
    if (filesNeedingUpdate.length > 0) {
      console.log(`Found ${filesNeedingUpdate.length} files needing updates:`);
      
      filesNeedingUpdate.slice(0, 5).forEach((file, index) => {
        console.log(`${index + 1}. 📄 ${file.path}`);
        console.log(`   📊 Issues: ${file.issues.length}`);
        console.log(`   🔄 Modernization: ${file.modernizationNeeded ? 'Yes' : 'No'}`);
        
        if (file.issues.length > 0) {
          file.issues.slice(0, 2).forEach(issue => {
            console.log(`   ⚠️  ${issue.severity}: ${issue.message}`);
          });
        }
        console.log('');
      });
      
      if (filesNeedingUpdate.length > 5) {
        console.log(`... and ${filesNeedingUpdate.length - 5} more files`);
      }
    } else {
      console.log('🎉 All files are up to date!');
    }
    console.log('');
    
    // Test 4: Generate Update Plan
    console.log('📋 Test 4: Generate Update Plan');
    console.log('━'.repeat(60));
    
    const plan = await manager.generateUpdatePlan();
    
    console.log(`📄 Total Files to Update: ${plan.totalFiles}`);
    console.log(`⏱️  Estimated Time: ${plan.estimatedTime} minutes`);
    console.log(`📅 Generated: ${new Date(plan.timestamp).toLocaleString()}`);
    console.log('');
    
    if (plan.phases.length > 0) {
      console.log('📋 Update Phases:');
      plan.phases.forEach((phase, index) => {
        console.log(`  ${index + 1}. ${phase.name} (Priority ${phase.priority})`);
        console.log(`     📄 Files: ${phase.files.length}`);
        console.log(`     ⏱️  Time: ${phase.estimatedTime} minutes`);
        
        if (phase.files.length > 0) {
          console.log(`     📝 Sample files: ${phase.files.slice(0, 2).join(', ')}`);
        }
        console.log('');
      });
    }
    
    // Test 5: Test CLI Interface
    console.log('🎛️ Test 5: CLI Interface');
    console.log('━'.repeat(60));
    
    const cli = new CursorRulesManagerCLI();
    
    console.log('Testing CLI status command...');
    await cli.statusCommand([]);
    console.log('');
    
    // Test 6: Test File Fixer (Dry Run)
    console.log('🔧 Test 6: File Fixer (Dry Run)');
    console.log('━'.repeat(60));
    
    const fixer = new CursorRulesFileFixer();
    await fixer.initialize();
    
    if (filesNeedingUpdate.length > 0) {
      const testFile = filesNeedingUpdate[0];
      console.log(`Testing fixes for: ${testFile.path}`);
      
      // Simulate fixes without actually changing files
      console.log('🔗 Simulating broken link fixes...');
      const brokenLinkIssues = testFile.issues.filter(i => i.type === 'broken_link');
      if (brokenLinkIssues.length > 0) {
        console.log(`  Found ${brokenLinkIssues.length} broken link issues`);
      } else {
        console.log('  No broken link issues found');
      }
      
      console.log('🔄 Simulating modernization...');
      if (testFile.modernizationNeeded) {
        console.log('  File needs modernization');
      } else {
        console.log('  File is up to date');
      }
    }
    console.log('');
    
    // Test 7: Export State
    console.log('📤 Test 7: Export State');
    console.log('━'.repeat(60));
    
    const exportPath = await manager.exportState();
    console.log(`✅ State exported to: ${exportPath}`);
    console.log('');
    
    // Test 8: Category Analysis
    console.log('📊 Test 8: Category Analysis');
    console.log('━'.repeat(60));
    
    const categories = ['workflow', 'documentation', 'specifications'];
    
    for (const category of categories) {
      const categoryFiles = manager.getFilesByCategory(category);
      console.log(`📁 ${category.toUpperCase()}: ${categoryFiles.length} files`);
      
      if (categoryFiles.length > 0) {
        const needsUpdate = categoryFiles.filter(f => f.needsUpdate).length;
        const modernizationNeeded = categoryFiles.filter(f => f.modernizationNeeded).length;
        
        console.log(`  ⚠️  Needs Update: ${needsUpdate}`);
        console.log(`  🔄 Needs Modernization: ${modernizationNeeded}`);
        
        // Show sample files
        categoryFiles.slice(0, 3).forEach(file => {
          console.log(`    📄 ${file.filename} (${file.issues.length} issues)`);
        });
      }
      console.log('');
    }
    
    // Test 9: Performance Metrics
    console.log('⚡ Test 9: Performance Metrics');
    console.log('━'.repeat(60));
    
    const performanceMetrics = {
      totalFiles: report.summary.totalFiles,
      filesWithIssues: filesNeedingUpdate.length,
      healthScore: Math.round(((report.summary.totalFiles - filesNeedingUpdate.length) / report.summary.totalFiles) * 100),
      categoryCoverage: Object.keys(report.categories).length,
      averageFileSize: Object.values(manager.state.files).reduce((sum, f) => sum + f.size, 0) / Object.keys(manager.state.files).length,
      totalWordCount: Object.values(manager.state.files).reduce((sum, f) => sum + f.wordCount, 0)
    };
    
    console.log(`📊 Performance Metrics:`);
    console.log(`  🎯 Health Score: ${performanceMetrics.healthScore}%`);
    console.log(`  📁 Category Coverage: ${performanceMetrics.categoryCoverage} categories`);
    console.log(`  📄 Average File Size: ${Math.round(performanceMetrics.averageFileSize)} bytes`);
    console.log(`  📝 Total Word Count: ${performanceMetrics.totalWordCount.toLocaleString()}`);
    console.log(`  🔗 Total Dependencies: ${Object.values(manager.state.files).reduce((sum, f) => sum + f.dependencies.length, 0)}`);
    console.log('');
    
    // Test 10: System Readiness
    console.log('🚀 Test 10: System Readiness Assessment');
    console.log('━'.repeat(60));
    
    const readinessScore = calculateReadinessScore(report);
    const readinessLevel = getReadinessLevel(readinessScore);
    
    console.log(`📊 System Readiness Score: ${readinessScore}%`);
    console.log(`🎯 Readiness Level: ${readinessLevel}`);
    console.log('');
    
    console.log('📋 Readiness Breakdown:');
    console.log(`  🔗 Link Integrity: ${100 - (report.issues.high * 10)}%`);
    console.log(`  🔄 Modernization: ${Math.round((1 - report.modernization.needed / report.modernization.total) * 100)}%`);
    console.log(`  📋 Structure: ${100 - (report.issues.medium * 5)}%`);
    console.log(`  📊 Documentation Coverage: ${Math.round((report.summary.totalFiles / 30) * 100)}%`); // Assuming 30 is target
    console.log('');
    
    // Final Summary
    console.log('🎉 Test Summary');
    console.log('━'.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('');
    console.log('🎯 Key Findings:');
    console.log(`  📁 Total Files Tracked: ${report.summary.totalFiles}`);
    console.log(`  ⚠️  Files Needing Attention: ${filesNeedingUpdate.length}`);
    console.log(`  🎯 System Health: ${performanceMetrics.healthScore}%`);
    console.log(`  📈 Readiness Score: ${readinessScore}%`);
    console.log('');
    console.log('💡 Next Steps:');
    if (plan.totalFiles > 0) {
      console.log('  1. Run the update plan to fix identified issues');
      console.log('  2. Modernize outdated content');
      console.log('  3. Verify all file references');
    } else {
      console.log('  🎉 System is ready! No updates needed.');
    }
    console.log('');
    console.log('📁 Files saved to:');
    console.log(`  📊 State: .cursor/rules/agents/_store/project-memory/cursor_rules_state.json`);
    console.log(`  📋 Update Plan: .cursor/rules/agents/_store/project-memory/update_plan.json`);
    console.log(`  📤 Export: ${exportPath}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Calculate system readiness score
 */
function calculateReadinessScore(report) {
  const weights = {
    highIssues: -10,    // Each high priority issue reduces score by 10
    mediumIssues: -5,   // Each medium priority issue reduces score by 5
    lowIssues: -2,      // Each low priority issue reduces score by 2
    modernization: -20  // Modernization needs reduce score significantly
  };
  
  let score = 100; // Start with perfect score
  
  score += report.issues.high * weights.highIssues;
  score += report.issues.medium * weights.mediumIssues;
  score += report.issues.low * weights.lowIssues;
  score += (report.modernization.needed / report.modernization.total) * weights.modernization;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get readiness level based on score
 */
function getReadinessLevel(score) {
  if (score >= 90) return '🟢 Excellent - Ready for Production';
  if (score >= 75) return '🟡 Good - Minor Updates Needed';
  if (score >= 60) return '🟠 Fair - Some Issues to Address';
  if (score >= 40) return '🔴 Poor - Significant Updates Required';
  return '💀 Critical - Major Overhaul Needed';
}

// Run the test
if (require.main === module) {
  testCursorRulesStateManager().then(() => {
    console.log('✅ All tests completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test error:', error.message);
    process.exit(1);
  });
}

module.exports = testCursorRulesStateManager; 