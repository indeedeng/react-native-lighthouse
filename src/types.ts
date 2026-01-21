import type { PanResponder } from 'react-native';

/**
 * First Input Delay (FID) metrics
 * Measures the time from when a user first interacts with your app
 * to the time when the browser is actually able to respond to that interaction.
 */
export interface FirstInputDelayMetrics {
  /**
   * Time from first user input to when the input handler starts processing (FID)
   */
  firstInputDelayMs: number;

  /**
   * Timestamp when first input occurred
   */
  firstInputTimeMs: number;

  /**
   * Timestamp when input processing started
   */
  inputProcessingStartTimeMs: number;

  /**
   * Type of first input (touch, press, scroll, etc.)
   */
  inputType: 'touch' | 'press' | 'scroll' | 'other';
}

/**
 * Core performance metrics collected by the hook
 */
export interface PerformanceMetrics {
  /**
   * Time from component mount to first frame render (TTFF)
   * Maps to LCP (Largest Contentful Paint) in web Core Web Vitals
   */
  timeToFirstFrameMs: number;

  /**
   * Time from component mount to when markInteractive is called (TTI)
   * Maps to TTI (Time to Interactive) in web Core Web Vitals
   */
  timeToInteractiveMs?: number;

  /**
   * First Input Delay metrics (if user has interacted)
   * Maps to TBT (Total Blocking Time) / INP in web Core Web Vitals
   */
  firstInputDelay?: FirstInputDelayMetrics;

  /**
   * Timestamp when component started mounting
   */
  mountStartTimeMs: number;

  /**
   * Timestamp when first frame was rendered
   */
  firstFrameTimeMs: number;

  /**
   * Timestamp when component became interactive (if marked)
   */
  interactiveTimeMs?: number;
}

/**
 * Lighthouse-style performance score breakdown
 */
export interface PerformanceScore {
  /**
   * Overall performance score (0-100)
   */
  overall: number;

  /**
   * Individual metric scores (0-100)
   */
  breakdown: {
    ttff: number;
    tti: number;
    fid: number;
  };

  /**
   * Score category based on overall score
   */
  category: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

/**
 * Result returned by usePerformanceMeasurement hook
 */
export interface PerformanceHookResult {
  /**
   * Call this function when the component becomes interactive
   * (e.g., when data is loaded and UI is ready for user interaction)
   */
  markInteractive: () => void;

  /**
   * Current performance metrics (null until first frame is captured)
   */
  metrics: PerformanceMetrics | null;

  /**
   * PanResponder for capturing first input delay - attach to your root View
   * Example: <View {...panResponder.panHandlers}>...</View>
   */
  panResponder: ReturnType<typeof PanResponder.create>;

  /**
   * Lighthouse-style performance score (null until metrics are available)
   */
  score: PerformanceScore | null;
}

/**
 * Configuration options for usePerformanceMeasurement hook
 */
export interface UsePerformanceMeasurementOptions {
  /**
   * Component name for identification in logs
   */
  componentName: string;

  /**
   * Optional namespace/provider for grouping metrics (e.g., 'checkout', 'profile')
   */
  namespace?: string;

  /**
   * Timeout in ms to wait for FID before logging metrics anyway
   * @default 5000
   */
  fidTimeout?: number;

  /**
   * Enable debug logging to console
   * @default true in __DEV__ mode, false otherwise
   */
  debug?: boolean;

  /**
   * Custom callback when performance metrics are available
   */
  onMetricsReady?: (metrics: PerformanceMetrics) => void;

  /**
   * Custom callback when component becomes interactive
   */
  onInteractive?: (metrics: PerformanceMetrics) => void;

  /**
   * Custom callback when all metrics are collected (after FID or timeout)
   * This is the ideal place to send metrics to your analytics service
   */
  onReport?: (metrics: PerformanceMetrics, score: PerformanceScore) => void;
}

/**
 * Performance thresholds for mobile-native apps
 * These are ~40% stricter than web Core Web Vitals since native apps
 * have bundled code and no network latency for initial render
 */
export interface PerformanceThresholds {
  ttff: { good: number; poor: number };
  tti: { good: number; poor: number };
  fid: { good: number; poor: number };
}

/**
 * Metric weights for calculating overall performance score
 * Based on mobile app user experience priorities
 */
export interface MetricWeights {
  ttff: number;
  tti: number;
  fid: number;
}
