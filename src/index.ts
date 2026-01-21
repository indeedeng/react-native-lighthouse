/**
 * react-native-lighthouse
 *
 * Core Web Vitals performance measurement for React Native.
 * Measure TTFF (Time to First Frame), TTI (Time to Interactive),
 * and FID (First Input Delay) with Lighthouse-style performance scores.
 *
 * @packageDocumentation
 */

// Main hook
export { usePerformanceMeasurement } from './usePerformanceMeasurement';

// Scoring utilities
export {
  calculatePerformanceScore,
  calculateMetricScore,
  getScoreCategory,
  getScoreColor,
  formatScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
} from './scoring';

// Types
export type {
  // Core metrics types
  PerformanceMetrics,
  FirstInputDelayMetrics,
  PerformanceScore,

  // Hook types
  PerformanceHookResult,
  UsePerformanceMeasurementOptions,

  // Configuration types
  PerformanceThresholds,
  MetricWeights,
} from './types';
