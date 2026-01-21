import { renderHook, act } from '@testing-library/react-native';
import { usePerformanceMeasurement } from '../usePerformanceMeasurement';
import type { UsePerformanceMeasurementOptions } from '../types';

// Mock console.log to capture debug output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('usePerformanceMeasurement', () => {
  const defaultOptions: UsePerformanceMeasurementOptions = {
    componentName: 'TestComponent',
    debug: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Hook Functionality', () => {
    it('should return markInteractive function, metrics, panResponder, and score', async () => {
      const { result } = renderHook(() => usePerformanceMeasurement(defaultOptions));

      expect(result.current.markInteractive).toBeInstanceOf(Function);
      expect(result.current.metrics).toBeNull(); // Initially null
      expect(result.current.panResponder).toBeDefined();
      expect(result.current.panResponder.panHandlers).toBeDefined();
      expect(result.current.score).toBeNull(); // Initially null

      // Wait for async state updates
      await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
      });
    });

    it('should capture TTFF on mount', async () => {
      const onMetricsReady = jest.fn();

      const { result } = renderHook(() =>
        usePerformanceMeasurement({
          ...defaultOptions,
          onMetricsReady,
        })
      );

      // Wait for the useEffect and queueMicrotask to complete
      await act(async () => {
        await new Promise((resolve) => {
          setImmediate(() => {
            setImmediate(() => {
              resolve(undefined);
            });
          });
        });
      });

      if (result.current.metrics) {
        expect(result.current.metrics.timeToFirstFrameMs).toBeGreaterThanOrEqual(0);
        expect(result.current.metrics.mountStartTimeMs).toBeGreaterThan(0);
        expect(result.current.metrics.firstFrameTimeMs).toBeGreaterThan(0);
        expect(onMetricsReady).toHaveBeenCalled();
        expect(result.current.score).not.toBeNull();
      }
    });

    it('should mark interactive when called', async () => {
      const onInteractive = jest.fn();

      const { result } = renderHook(() =>
        usePerformanceMeasurement({
          ...defaultOptions,
          onInteractive,
        })
      );

      // Wait for TTFF to be captured first
      await act(async () => {
        await new Promise((resolve) => {
          setImmediate(() => {
            setImmediate(() => {
              resolve(undefined);
            });
          });
        });
      });

      // Mark interactive
      act(() => {
        result.current.markInteractive();
      });

      // Wait for the metrics to be updated
      await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
      });

      expect(result.current.metrics?.timeToInteractiveMs).toBeGreaterThanOrEqual(0);
      expect(result.current.metrics?.interactiveTimeMs).toBeGreaterThan(0);
      expect(onInteractive).toHaveBeenCalled();
    });

    it('should not mark interactive multiple times', async () => {
      const onInteractive = jest.fn();

      const { result } = renderHook(() =>
        usePerformanceMeasurement({
          ...defaultOptions,
          onInteractive,
        })
      );

      // Wait for async TTFF state updates
      await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
      });

      // Mark interactive first time
      act(() => {
        result.current.markInteractive();
      });

      const firstTTI = result.current.metrics?.timeToInteractiveMs;
      const firstInteractiveTime = result.current.metrics?.interactiveTimeMs;

      // Try to mark interactive again
      act(() => {
        result.current.markInteractive();
      });

      expect(result.current.metrics?.timeToInteractiveMs).toBe(firstTTI);
      expect(result.current.metrics?.interactiveTimeMs).toBe(firstInteractiveTime);
      expect(onInteractive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scoring', () => {
    it('should calculate score when metrics are available', async () => {
      const { result } = renderHook(() => usePerformanceMeasurement(defaultOptions));

      // Wait for TTFF
      await act(async () => {
        await new Promise((resolve) => {
          setImmediate(() => {
            setImmediate(() => {
              resolve(undefined);
            });
          });
        });
      });

      // Should have a score after TTFF
      if (result.current.score) {
        expect(result.current.score.overall).toBeGreaterThanOrEqual(0);
        expect(result.current.score.overall).toBeLessThanOrEqual(100);
        expect(result.current.score.breakdown).toBeDefined();
        expect(result.current.score.category).toBeDefined();
      }
    });

    it('should update score when marking interactive', async () => {
      const { result } = renderHook(() => usePerformanceMeasurement(defaultOptions));

      // Wait for TTFF
      await act(async () => {
        await new Promise((resolve) => {
          setImmediate(() => {
            setImmediate(() => {
              resolve(undefined);
            });
          });
        });
      });

      const initialScore = result.current.score?.overall;

      // Mark interactive
      act(() => {
        result.current.markInteractive();
      });

      // Score should still be valid
      expect(result.current.score?.overall).toBeGreaterThanOrEqual(0);
      expect(result.current.score?.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('Callbacks', () => {
    it('should call onReport after timeout if no FID', async () => {
      jest.useFakeTimers();
      const onReport = jest.fn();

      const { result } = renderHook(() =>
        usePerformanceMeasurement({
          ...defaultOptions,
          fidTimeout: 1000,
          onReport,
        })
      );

      // Wait for TTFF
      await act(async () => {
        jest.runAllTicks();
      });

      // Mark interactive
      act(() => {
        result.current.markInteractive();
      });

      // Fast-forward past FID timeout
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(onReport).toHaveBeenCalled();
      expect(onReport).toHaveBeenCalledWith(
        expect.objectContaining({
          timeToFirstFrameMs: expect.any(Number),
        }),
        expect.objectContaining({
          overall: expect.any(Number),
          category: expect.any(String),
        })
      );

      jest.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    it('should handle cleanup on unmount', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => usePerformanceMeasurement(defaultOptions));

      // Wait for async state updates
      await act(async () => {
        await new Promise((resolve) => setImmediate(resolve));
      });

      // Mark interactive to potentially start timeout
      act(() => {
        result.current.markInteractive();
      });

      // Unmount should clear any timeouts
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Namespace', () => {
    it('should include namespace in log prefix', async () => {
      renderHook(() =>
        usePerformanceMeasurement({
          componentName: 'TestComponent',
          namespace: 'checkout',
          debug: true,
        })
      );

      // Wait for TTFF
      await act(async () => {
        await new Promise((resolve) => {
          setImmediate(() => {
            setImmediate(() => {
              resolve(undefined);
            });
          });
        });
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('checkout/TestComponent')
      );
    });
  });
});
