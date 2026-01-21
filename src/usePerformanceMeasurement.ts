import { useRef, useEffect, useCallback, useState } from 'react';
import { PanResponder } from 'react-native';
import type {
  PerformanceMetrics,
  PerformanceScore,
  PerformanceHookResult,
  UsePerformanceMeasurementOptions,
  FirstInputDelayMetrics,
} from './types';
import { calculatePerformanceScore } from './scoring';

// Check if we're in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

/**
 * Hook for measuring React Native component performance metrics
 *
 * Measures three core metrics similar to web Core Web Vitals:
 * - **TTFF (Time to First Frame)**: Maps to LCP - when users first see content
 * - **TTI (Time to Interactive)**: When users can actually interact with the component
 * - **FID (First Input Delay)**: Maps to INP/TBT - responsiveness to user input
 *
 * @param options - Configuration options
 * @returns Object containing markInteractive function, metrics, panResponder, and score
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { markInteractive, panResponder, score } = usePerformanceMeasurement({
 *     componentName: 'MyScreen',
 *     onReport: (metrics, score) => {
 *       // Send to your analytics service
 *       analytics.track('performance', { ...metrics, score: score.overall });
 *     },
 *   });
 *
 *   const [data, setData] = useState(null);
 *
 *   useEffect(() => {
 *     fetchData().then(setData);
 *   }, []);
 *
 *   // Mark interactive when data is loaded
 *   useEffect(() => {
 *     if (data) {
 *       markInteractive();
 *     }
 *   }, [data, markInteractive]);
 *
 *   return (
 *     <View {...panResponder.panHandlers}>
 *       {data ? <Content data={data} /> : <Loading />}
 *     </View>
 *   );
 * }
 * ```
 */
export function usePerformanceMeasurement(
  options: UsePerformanceMeasurementOptions
): PerformanceHookResult {
  const {
    componentName,
    namespace,
    fidTimeout = 5000,
    debug = isDev,
    onMetricsReady,
    onInteractive,
    onReport,
  } = options;

  // Refs for timing measurements (persist across renders without causing re-renders)
  const mountStartTimeMsRef = useRef<number>(Date.now());
  const firstFrameTimeMsRef = useRef<number | null>(null);
  const interactiveTimeMsRef = useRef<number | null>(null);
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const hasLoggedRef = useRef<boolean>(false);

  // State to trigger re-renders when metrics change
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [score, setScore] = useState<PerformanceScore | null>(null);

  // FID tracking refs
  const firstInputDelayRef = useRef<FirstInputDelayMetrics | null>(null);
  const hasRecordedFirstInputRef = useRef<boolean>(false);
  const fidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logging prefix for console output
  const logPrefix = namespace ? `${namespace}/${componentName}` : componentName;

  // Function to log final metrics (called when FID is captured or timeout occurs)
  const logFinalMetrics = useCallback(() => {
    if (hasLoggedRef.current || !metricsRef.current) {
      return;
    }

    hasLoggedRef.current = true;

    // Clear timeout if it exists
    if (fidTimeoutRef.current) {
      clearTimeout(fidTimeoutRef.current);
      fidTimeoutRef.current = null;
    }

    const finalMetrics: PerformanceMetrics = {
      ...metricsRef.current,
      // Ensure TTI data is preserved
      timeToInteractiveMs:
        metricsRef.current.timeToInteractiveMs ||
        (interactiveTimeMsRef.current
          ? interactiveTimeMsRef.current - mountStartTimeMsRef.current
          : undefined),
      interactiveTimeMs:
        metricsRef.current.interactiveTimeMs || interactiveTimeMsRef.current || undefined,
      // Ensure FID data is preserved
      firstInputDelay: firstInputDelayRef.current || metricsRef.current.firstInputDelay,
    };

    metricsRef.current = finalMetrics;
    setMetrics(finalMetrics);

    const finalScore = calculatePerformanceScore(finalMetrics);
    setScore(finalScore);

    // Debug logging
    if (debug) {
      console.log(`[Lighthouse] ${logPrefix}:`, {
        TTFF_ms: finalMetrics.timeToFirstFrameMs,
        TTI_ms: finalMetrics.timeToInteractiveMs,
        FID_ms: finalMetrics.firstInputDelay?.firstInputDelayMs,
        FID_type: finalMetrics.firstInputDelay?.inputType,
        score: finalScore.overall,
        category: finalScore.category,
      });
    }

    // Call the onReport callback for analytics
    onReport?.(finalMetrics, finalScore);
  }, [debug, logPrefix, onReport]);

  // Helper function to measure FID for different input types
  const measureFirstInputDelay = useCallback(
    (inputType: 'touch' | 'scroll') => {
      if (!hasRecordedFirstInputRef.current) {
        const inputTime = Date.now();
        hasRecordedFirstInputRef.current = true;

        // Measure FID: delay from input event to when processing starts
        queueMicrotask(() => {
          const processingStartTime = Date.now();

          const fidMetrics: FirstInputDelayMetrics = {
            firstInputDelayMs: processingStartTime - inputTime,
            firstInputTimeMs: inputTime,
            inputProcessingStartTimeMs: processingStartTime,
            inputType,
          };

          firstInputDelayRef.current = fidMetrics;

          // Update metrics with FID data
          if (metricsRef.current) {
            const updatedMetrics: PerformanceMetrics = {
              ...metricsRef.current,
              firstInputDelay: fidMetrics,
            };
            metricsRef.current = updatedMetrics;
            setMetrics(updatedMetrics);

            const updatedScore = calculatePerformanceScore(updatedMetrics);
            setScore(updatedScore);

            onMetricsReady?.(updatedMetrics);
          }

          // Log final metrics now that FID is captured
          logFinalMetrics();
        });
      }
      return false; // Don't actually handle the gesture, just measure it
    },
    [logFinalMetrics, onMetricsReady]
  );

  // Create PanResponder for FID measurement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => measureFirstInputDelay('touch'),
      onMoveShouldSetPanResponder: () => measureFirstInputDelay('scroll'),
    })
  ).current;

  // Capture first frame time after component mounts
  useEffect(() => {
    // Capture first frame timestamp immediately - closer to actual first frame
    if (firstFrameTimeMsRef.current === null) {
      firstFrameTimeMsRef.current = Date.now();
    }

    // Defer the logging and metrics calculation to avoid blocking
    queueMicrotask(() => {
      const initialMetrics: PerformanceMetrics = {
        timeToFirstFrameMs: firstFrameTimeMsRef.current! - mountStartTimeMsRef.current,
        mountStartTimeMs: mountStartTimeMsRef.current,
        firstFrameTimeMs: firstFrameTimeMsRef.current!,
      };

      metricsRef.current = initialMetrics;
      setMetrics(initialMetrics);

      const initialScore = calculatePerformanceScore(initialMetrics);
      setScore(initialScore);

      if (debug) {
        console.log(`[Lighthouse] ${logPrefix} TTFF: ${initialMetrics.timeToFirstFrameMs}ms`);
      }

      onMetricsReady?.(initialMetrics);
    });
  }, [debug, logPrefix, onMetricsReady]);

  const markInteractive = useCallback(() => {
    if (interactiveTimeMsRef.current !== null) {
      // Already marked as interactive
      return;
    }

    const now = Date.now();
    interactiveTimeMsRef.current = now;

    const updatedMetrics: PerformanceMetrics = {
      ...(metricsRef.current || {}),
      timeToInteractiveMs: now - mountStartTimeMsRef.current,
      interactiveTimeMs: now,
      // Preserve existing values or set defaults
      timeToFirstFrameMs: metricsRef.current?.timeToFirstFrameMs || 0,
      mountStartTimeMs: mountStartTimeMsRef.current,
      firstFrameTimeMs: metricsRef.current?.firstFrameTimeMs || 0,
      firstInputDelay: firstInputDelayRef.current || metricsRef.current?.firstInputDelay,
    };

    metricsRef.current = updatedMetrics;
    setMetrics(updatedMetrics);

    const updatedScore = calculatePerformanceScore(updatedMetrics);
    setScore(updatedScore);

    if (debug) {
      console.log(`[Lighthouse] ${logPrefix} TTI: ${updatedMetrics.timeToInteractiveMs}ms`);
    }

    onInteractive?.(updatedMetrics);

    // Start timeout to log metrics if FID is not captured within fidTimeout
    if (!hasLoggedRef.current && !fidTimeoutRef.current) {
      fidTimeoutRef.current = setTimeout(() => {
        if (debug) {
          console.log(`[Lighthouse] ${logPrefix} FID timeout (${fidTimeout}ms), logging without FID`);
        }
        logFinalMetrics();
      }, fidTimeout);
    }
  }, [debug, fidTimeout, logPrefix, onInteractive, logFinalMetrics]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fidTimeoutRef.current) {
        clearTimeout(fidTimeoutRef.current);
      }
    };
  }, []);

  return {
    markInteractive,
    metrics,
    panResponder,
    score,
  };
}
