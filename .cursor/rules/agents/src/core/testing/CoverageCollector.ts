import {
  TestCoverage,
  CoverageMetrics,
  FileCoverage,
  FunctionCoverage,
  BranchCoverage,
  StatementCoverage
} from '../../types/TestingTypes';

/**
 * Coverage Collector
 * 
 * Tracks code coverage during test execution including
 * files, functions, branches, and statements coverage.
 */
export class CoverageCollector {
  private isCollecting: boolean = false;
  private files: Map<string, FileCoverage> = new Map();
  private functions: Map<string, FunctionCoverage> = new Map();
  private branches: Map<string, BranchCoverage> = new Map();
  private statements: Map<string, StatementCoverage> = new Map();
  private thresholds: { overall: number; file: number; function: number; branch: number; statement: number };

  constructor(thresholds = { overall: 80, file: 70, function: 80, branch: 70, statement: 80 }) {
    this.thresholds = thresholds;
  }

  /**
   * Start coverage collection
   */
  public start(): void {
    this.isCollecting = true;
    this.reset();
  }

  /**
   * Stop coverage collection
   */
  public stop(): void {
    this.isCollecting = false;
  }

  /**
   * Record file coverage
   */
  public recordFile(filePath: string, lines: Record<number, boolean>): void {
    if (!this.isCollecting) return;

    const totalLines = Object.keys(lines).length;
    const coveredLines = Object.values(lines).filter(covered => covered).length;

    const coverage: FileCoverage = {
      path: filePath,
      lines,
      functions: [],
      branches: [],
      percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      covered: coveredLines,
      total: totalLines,
      threshold: this.thresholds.file,
      passed: totalLines > 0 ? (coveredLines / totalLines) * 100 >= this.thresholds.file : true
    };

    this.files.set(filePath, coverage);
  }

  /**
   * Record function coverage
   */
  public recordFunction(
    name: string,
    file: string,
    startLine: number,
    endLine: number,
    calls: number
  ): void {
    if (!this.isCollecting) return;

    const coverage: FunctionCoverage = {
      name,
      file,
      startLine,
      endLine,
      calls,
      percentage: calls > 0 ? 100 : 0,
      covered: calls > 0 ? 1 : 0,
      total: 1,
      threshold: this.thresholds.function,
      passed: calls > 0
    };

    this.functions.set(`${file}:${name}`, coverage);

    // Add to file's function list
    const fileCoverage = this.files.get(file);
    if (fileCoverage && !fileCoverage.functions.includes(name)) {
      fileCoverage.functions.push(name);
    }
  }

  /**
   * Record branch coverage
   */
  public recordBranch(
    file: string,
    line: number,
    condition: string,
    trueCovered: boolean,
    falseCovered: boolean
  ): void {
    if (!this.isCollecting) return;

    const covered = trueCovered && falseCovered ? 2 : (trueCovered || falseCovered ? 1 : 0);
    const total = 2;

    const coverage: BranchCoverage = {
      file,
      line,
      condition,
      trueCovered,
      falseCovered,
      percentage: (covered / total) * 100,
      covered,
      total,
      threshold: this.thresholds.branch,
      passed: covered === total
    };

    this.branches.set(`${file}:${line}:${condition}`, coverage);

    // Add to file's branch list
    const fileCoverage = this.files.get(file);
    if (fileCoverage && !fileCoverage.branches.includes(`${line}:${condition}`)) {
      fileCoverage.branches.push(`${line}:${condition}`);
    }
  }

  /**
   * Record statement coverage
   */
  public recordStatement(
    file: string,
    line: number,
    statement: string,
    executed: boolean
  ): void {
    if (!this.isCollecting) return;

    const coverage: StatementCoverage = {
      file,
      line,
      statement,
      executed,
      percentage: executed ? 100 : 0,
      covered: executed ? 1 : 0,
      total: 1,
      threshold: this.thresholds.statement,
      passed: executed
    };

    this.statements.set(`${file}:${line}`, coverage);
  }

  /**
   * Get comprehensive coverage results
   */
  public getResults(): TestCoverage {
    const overall = this.calculateOverallCoverage();
    
    return {
      overall,
      files: Object.fromEntries(this.files),
      functions: Object.fromEntries(this.functions),
      branches: Object.fromEntries(this.branches),
      statements: Object.fromEntries(this.statements)
    };
  }

  /**
   * Reset all coverage data
   */
  public reset(): void {
    this.files.clear();
    this.functions.clear();
    this.branches.clear();
    this.statements.clear();
  }

  /**
   * Get coverage summary
   */
  public getSummary(): {
    files: number;
    functions: number;
    branches: number;
    statements: number;
    overall: number;
  } {
    const filesCoverage = this.calculateAverageCoverage(Array.from(this.files.values()));
    const functionsCoverage = this.calculateAverageCoverage(Array.from(this.functions.values()));
    const branchesCoverage = this.calculateAverageCoverage(Array.from(this.branches.values()));
    const statementsCoverage = this.calculateAverageCoverage(Array.from(this.statements.values()));

    return {
      files: filesCoverage,
      functions: functionsCoverage,
      branches: branchesCoverage,
      statements: statementsCoverage,
      overall: this.calculateOverallCoverage().percentage
    };
  }

  /**
   * Check if coverage meets thresholds
   */
  public meetsThresholds(): boolean {
    const summary = this.getSummary();
    
    return (
      summary.overall >= this.thresholds.overall &&
      summary.files >= this.thresholds.file &&
      summary.functions >= this.thresholds.function &&
      summary.branches >= this.thresholds.branch &&
      summary.statements >= this.thresholds.statement
    );
  }

  /**
   * Get uncovered items
   */
  public getUncoveredItems(): {
    files: string[];
    functions: string[];
    branches: string[];
    statements: string[];
  } {
    return {
      files: Array.from(this.files.entries())
        .filter(([, coverage]) => !coverage.passed)
        .map(([path]) => path),
      functions: Array.from(this.functions.entries())
        .filter(([, coverage]) => !coverage.passed)
        .map(([key]) => key),
      branches: Array.from(this.branches.entries())
        .filter(([, coverage]) => !coverage.passed)
        .map(([key]) => key),
      statements: Array.from(this.statements.entries())
        .filter(([, coverage]) => !coverage.passed)
        .map(([key]) => key)
    };
  }

  /**
   * Generate coverage report
   */
  public generateReport(): string {
    const summary = this.getSummary();
    const uncovered = this.getUncoveredItems();
    
    let report = '📊 Coverage Report\n';
    report += '==================\n\n';
    
    report += `Overall Coverage: ${summary.overall.toFixed(2)}%\n`;
    report += `Files: ${summary.files.toFixed(2)}%\n`;
    report += `Functions: ${summary.functions.toFixed(2)}%\n`;
    report += `Branches: ${summary.branches.toFixed(2)}%\n`;
    report += `Statements: ${summary.statements.toFixed(2)}%\n\n`;
    
    if (uncovered.files.length > 0) {
      report += `Uncovered Files (${uncovered.files.length}):\n`;
      uncovered.files.forEach(file => report += `  - ${file}\n`);
      report += '\n';
    }
    
    if (uncovered.functions.length > 0) {
      report += `Uncovered Functions (${uncovered.functions.length}):\n`;
      uncovered.functions.slice(0, 10).forEach(func => report += `  - ${func}\n`);
      if (uncovered.functions.length > 10) {
        report += `  ... and ${uncovered.functions.length - 10} more\n`;
      }
      report += '\n';
    }
    
    const meetsThresholds = this.meetsThresholds();
    report += `Thresholds: ${meetsThresholds ? '✅ PASSED' : '❌ FAILED'}\n`;
    
    return report;
  }

  /**
   * Calculate overall coverage metrics
   */
  private calculateOverallCoverage(): CoverageMetrics {
    const allItems = [
      ...Array.from(this.files.values()),
      ...Array.from(this.functions.values()),
      ...Array.from(this.branches.values()),
      ...Array.from(this.statements.values())
    ];

    if (allItems.length === 0) {
      return {
        percentage: 0,
        covered: 0,
        total: 0,
        threshold: this.thresholds.overall,
        passed: false
      };
    }

    const totalCovered = allItems.reduce((sum, item) => sum + item.covered, 0);
    const totalItems = allItems.reduce((sum, item) => sum + item.total, 0);
    const percentage = totalItems > 0 ? (totalCovered / totalItems) * 100 : 0;

    return {
      percentage,
      covered: totalCovered,
      total: totalItems,
      threshold: this.thresholds.overall,
      passed: percentage >= this.thresholds.overall
    };
  }

  /**
   * Calculate average coverage for a set of items
   */
  private calculateAverageCoverage(items: CoverageMetrics[]): number {
    if (items.length === 0) return 0;
    
    const totalCovered = items.reduce((sum, item) => sum + item.covered, 0);
    const totalItems = items.reduce((sum, item) => sum + item.total, 0);
    
    return totalItems > 0 ? (totalCovered / totalItems) * 100 : 0;
  }
} 