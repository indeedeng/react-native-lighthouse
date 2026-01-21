import type {
  PerformanceMetrics,
  PerformanceScore,
  PerformanceThresholds,
  MetricWeights,
} from './types';

/**
 * Default performance thresholds optimized for native mobile apps
 * These are ~40% stricter than web Core Web Vitals because:
 * - No network requests for initial render (code is bundled)
 * - No HTML/CSS/JS parsing overhead
 * - Users expect native app speed
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  // Time to First Frame (maps to LCP)
  // Good: < 300ms - Users see content instantly
  // Poor: > 800ms - Users perceive as slow
  ttff: { good: 300, poor: 800 },

  // Time to Interactive (most critical for mobile)
  // Good: < 500ms - Component becomes interactive immediately
  // Poor: > 1500ms - Significant delay impacts user experience
  tti: { good: 500, poor: 1500 },

  // First Input Delay (maps to INP/TBT)
  // Good: < 50ms - Imperceptible delay, feels instant
  // Poor: > 150ms - Noticeable lag, feels unresponsive
  fid: { good: 50, poor: 150 },
};

/**
 * Default metric weights based on mobile app UX priorities
 * TTI is weighted highest as mobile users expect immediate interactivity
 */
export const DEFAULT_WEIGHTS: MetricWeights = {
  ttff: 0.25, // 25% - Visual loading performance
  tti: 0.45, // 45% - Interactivity (most critical for mobile)
  fid: 0.30, // 30% - Input responsiveness
};

/**
 * Calculate a 0-100 score for a single metric using linear interpolation
 *
 * @param value - The measured value in milliseconds
 * @param thresholds - The good/poor thresholds for this metric
 * @returns A score from 0-100
 */
export function calculateMetricScore(
  value: number,
  thresholds: { good: number; poor: number }
): number {
  if (value <= thresholds.good) return 100;
  if (value >= thresholds.poor) return 0;

  // Linear interpolation between good and poor
  const range = thresholds.poor - thresholds.good;
  const position = value - thresholds.good;
  return Math.round(100 - (position / range) * 100);
}

/**
 * Determine score category based on overall score
 */
export function getScoreCategory(
  score: number
): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

/**
 * Calculate a Lighthouse-style performance score from raw metrics
 *
 * @param metrics - The collected performance metrics
 * @param thresholds - Optional custom thresholds (defaults to mobile-optimized thresholds)
 * @param weights - Optional custom weights (defaults to mobile-optimized weights)
 * @returns A comprehensive performance score with breakdown
 *
 * @example
 * ```ts
 * const score = calculatePerformanceScore({
 *   timeToFirstFrameMs: 250,
 *   timeToInteractiveMs: 400,
 *   firstInputDelay: { firstInputDelayMs: 30 },
 *   mountStartTimeMs: 1000,
 *   firstFrameTimeMs: 1250,
 * });
 *
 * console.log(score);
 * // {
 * //   overall: 92,
 * //   breakdown: { ttff: 100, tti: 100, fid: 100 },
 * //   category: 'excellent'
 * // }
 * ```
 */
export function calculatePerformanceScore(
  metrics: PerformanceMetrics,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS,
  weights: MetricWeights = DEFAULT_WEIGHTS
): PerformanceScore {
  // Calculate individual metric scores
  const ttffScore = calculateMetricScore(metrics.timeToFirstFrameMs, thresholds.ttff);

  // TTI defaults to TTFF if not marked (component was interactive immediately)
  const ttiValue = metrics.timeToInteractiveMs ?? metrics.timeToFirstFrameMs;
  const ttiScore = calculateMetricScore(ttiValue, thresholds.tti);

  // FID defaults to 0 if no user interaction (best case scenario)
  const fidValue = metrics.firstInputDelay?.firstInputDelayMs ?? 0;
  const fidScore = calculateMetricScore(fidValue, thresholds.fid);

  // Calculate weighted overall score
  const overall = Math.round(
    ttffScore * weights.ttff + ttiScore * weights.tti + fidScore * weights.fid
  );

  return {
    overall,
    breakdown: {
      ttff: ttffScore,
      tti: ttiScore,
      fid: fidScore,
    },
    category: getScoreCategory(overall),
  };
}

/**
 * Format a performance score for display
 *
 * @param score - The performance score to format
 * @returns A formatted string representation
 *
 * @example
 * ```ts
 * formatScore(score);
 * // "92 (Excellent) - TTFF: 100, TTI: 100, FID: 100"
 * ```
 */
export function formatScore(score: PerformanceScore): string {
  const categoryLabel = score.category.charAt(0).toUpperCase() + score.category.slice(1);
  return `${score.overall} (${categoryLabel}) - TTFF: ${score.breakdown.ttff}, TTI: ${score.breakdown.tti}, FID: ${score.breakdown.fid}`;
}

/**
 * Get color for score category (useful for UI display)
 */
export function getScoreColor(category: PerformanceScore['category']): string {
  switch (category) {
    case 'excellent':
      return '#0cce6b'; // Green
    case 'good':
      return '#ffa400'; // Orange
    case 'needs-improvement':
      return '#ff6d00'; // Dark orange
    case 'poor':
      return '#ff0000'; // Red
  }
}
