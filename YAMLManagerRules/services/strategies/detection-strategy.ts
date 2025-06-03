/**
 * Detection Strategy Interface
 *
 * Defines the interface for all context detection strategies.
 */

import { DetectionStrategyResult } from '../../models/context';

/**
 * Detection strategy interface
 */
export interface DetectionStrategy {
  /**
   * Unique name for this detection strategy
   */
  readonly name: string;

  /**
   * Priority of this strategy (higher = runs earlier)
   */
  readonly priority: number;

  /**
   * Weight of this strategy's results in the overall detection (0-1)
   */
  readonly weight: number;

  /**
   * Check if this strategy can be applied to the given project path
   *
   * @param projectPath Path to the project root
   * @returns True if this strategy can be applied
   */
  canApply(projectPath: string): Promise<boolean>;

  /**
   * Detect context information from the project
   *
   * @param projectPath Path to the project root
   * @param existingResults Optional existing results from other strategies
   * @returns Detection results from this strategy
   */
  detect(projectPath: string, existingResults?: DetectionStrategyResult): Promise<DetectionStrategyResult>;
}

/**
 * Abstract base class for detection strategies
 */
export abstract class BaseDetectionStrategy implements DetectionStrategy {
  /**
   * Create a new detection strategy
   *
   * @param name Unique name for this strategy
   * @param priority Priority for execution order (higher runs earlier)
   * @param weight Weight of this strategy's results (0-1)
   */
  constructor(
    public readonly name: string,
    public readonly priority: number = 0,
    public readonly weight: number = 1
  ) {}

  /**
   * Check if this strategy can be applied to the given project path
   */
  abstract canApply(projectPath: string): Promise<boolean>;

  /**
   * Detect context information from the project
   */
  abstract detect(projectPath: string, existingResults?: DetectionStrategyResult): Promise<DetectionStrategyResult>;
}
