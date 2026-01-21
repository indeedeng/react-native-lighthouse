import {
  calculateMetricScore,
  calculatePerformanceScore,
  getScoreCategory,
  getScoreColor,
  formatScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
} from '../scoring';
import type { PerformanceMetrics } from '../types';

describe('scoring', () => {
  describe('calculateMetricScore', () => {
    it('should return 100 for values at or below good threshold', () => {
      expect(calculateMetricScore(0, { good: 300, poor: 800 })).toBe(100);
      expect(calculateMetricScore(300, { good: 300, poor: 800 })).toBe(100);
      expect(calculateMetricScore(100, { good: 300, poor: 800 })).toBe(100);
    });

    it('should return 0 for values at or above poor threshold', () => {
      expect(calculateMetricScore(800, { good: 300, poor: 800 })).toBe(0);
      expect(calculateMetricScore(1000, { good: 300, poor: 800 })).toBe(0);
      expect(calculateMetricScore(5000, { good: 300, poor: 800 })).toBe(0);
    });

    it('should interpolate linearly between good and poor', () => {
      // Midpoint should be 50
      expect(calculateMetricScore(550, { good: 300, poor: 800 })).toBe(50);

      // 25% of the way should be 75
      expect(calculateMetricScore(425, { good: 300, poor: 800 })).toBe(75);

      // 75% of the way should be 25
      expect(calculateMetricScore(675, { good: 300, poor: 800 })).toBe(25);
    });
  });

  describe('getScoreCategory', () => {
    it('should return excellent for scores >= 90', () => {
      expect(getScoreCategory(90)).toBe('excellent');
      expect(getScoreCategory(95)).toBe('excellent');
      expect(getScoreCategory(100)).toBe('excellent');
    });

    it('should return good for scores >= 75 and < 90', () => {
      expect(getScoreCategory(75)).toBe('good');
      expect(getScoreCategory(80)).toBe('good');
      expect(getScoreCategory(89)).toBe('good');
    });

    it('should return needs-improvement for scores >= 50 and < 75', () => {
      expect(getScoreCategory(50)).toBe('needs-improvement');
      expect(getScoreCategory(60)).toBe('needs-improvement');
      expect(getScoreCategory(74)).toBe('needs-improvement');
    });

    it('should return poor for scores < 50', () => {
      expect(getScoreCategory(0)).toBe('poor');
      expect(getScoreCategory(25)).toBe('poor');
      expect(getScoreCategory(49)).toBe('poor');
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate perfect score for excellent metrics', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 100, // Well under 300ms good threshold
        timeToInteractiveMs: 200, // Well under 500ms good threshold
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 1100,
        interactiveTimeMs: 1200,
        firstInputDelay: {
          firstInputDelayMs: 10, // Well under 50ms good threshold
          firstInputTimeMs: 1300,
          inputProcessingStartTimeMs: 1310,
          inputType: 'touch',
        },
      };

      const score = calculatePerformanceScore(metrics);

      expect(score.overall).toBe(100);
      expect(score.breakdown.ttff).toBe(100);
      expect(score.breakdown.tti).toBe(100);
      expect(score.breakdown.fid).toBe(100);
      expect(score.category).toBe('excellent');
    });

    it('should calculate poor score for bad metrics', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 1000, // Above 800ms poor threshold
        timeToInteractiveMs: 2000, // Above 1500ms poor threshold
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 2000,
        interactiveTimeMs: 3000,
        firstInputDelay: {
          firstInputDelayMs: 200, // Above 150ms poor threshold
          firstInputTimeMs: 3100,
          inputProcessingStartTimeMs: 3300,
          inputType: 'touch',
        },
      };

      const score = calculatePerformanceScore(metrics);

      expect(score.overall).toBe(0);
      expect(score.breakdown.ttff).toBe(0);
      expect(score.breakdown.tti).toBe(0);
      expect(score.breakdown.fid).toBe(0);
      expect(score.category).toBe('poor');
    });

    it('should handle missing TTI by using TTFF', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 200,
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 1200,
        // No TTI
      };

      const score = calculatePerformanceScore(metrics);

      // TTI should use TTFF value (200ms) which is under 500ms good threshold
      expect(score.breakdown.tti).toBe(100);
    });

    it('should handle missing FID by using 0', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 200,
        timeToInteractiveMs: 300,
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 1200,
        interactiveTimeMs: 1300,
        // No FID
      };

      const score = calculatePerformanceScore(metrics);

      // FID should be 100 (0ms delay is best case)
      expect(score.breakdown.fid).toBe(100);
    });

    it('should respect custom thresholds', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 400, // Would be "needs improvement" with default
        timeToInteractiveMs: 600, // Would be "needs improvement" with default
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 1400,
        interactiveTimeMs: 1600,
      };

      // With stricter thresholds
      const strictScore = calculatePerformanceScore(metrics, {
        ttff: { good: 200, poor: 500 },
        tti: { good: 300, poor: 700 },
        fid: { good: 30, poor: 100 },
      });

      // With looser thresholds
      const looseScore = calculatePerformanceScore(metrics, {
        ttff: { good: 500, poor: 1000 },
        tti: { good: 800, poor: 2000 },
        fid: { good: 100, poor: 300 },
      });

      expect(looseScore.overall).toBeGreaterThan(strictScore.overall);
    });

    it('should respect custom weights', () => {
      const metrics: PerformanceMetrics = {
        timeToFirstFrameMs: 100, // 100 score
        timeToInteractiveMs: 1500, // 0 score
        mountStartTimeMs: 1000,
        firstFrameTimeMs: 1100,
        interactiveTimeMs: 2500,
        firstInputDelay: {
          firstInputDelayMs: 150, // 0 score
          firstInputTimeMs: 2600,
          inputProcessingStartTimeMs: 2750,
          inputType: 'touch',
        },
      };

      // Weight TTFF heavily
      const ttffWeighted = calculatePerformanceScore(metrics, DEFAULT_THRESHOLDS, {
        ttff: 0.8,
        tti: 0.1,
        fid: 0.1,
      });

      // Weight TTI heavily
      const ttiWeighted = calculatePerformanceScore(metrics, DEFAULT_THRESHOLDS, {
        ttff: 0.1,
        tti: 0.8,
        fid: 0.1,
      });

      expect(ttffWeighted.overall).toBeGreaterThan(ttiWeighted.overall);
    });
  });

  describe('formatScore', () => {
    it('should format score correctly', () => {
      const score = {
        overall: 92,
        breakdown: { ttff: 100, tti: 90, fid: 85 },
        category: 'excellent' as const,
      };

      const formatted = formatScore(score);
      expect(formatted).toBe('92 (Excellent) - TTFF: 100, TTI: 90, FID: 85');
    });
  });

  describe('getScoreColor', () => {
    it('should return correct colors for each category', () => {
      expect(getScoreColor('excellent')).toBe('#0cce6b');
      expect(getScoreColor('good')).toBe('#ffa400');
      expect(getScoreColor('needs-improvement')).toBe('#ff6d00');
      expect(getScoreColor('poor')).toBe('#ff0000');
    });
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_THRESHOLDS.ttff).toEqual({ good: 300, poor: 800 });
      expect(DEFAULT_THRESHOLDS.tti).toEqual({ good: 500, poor: 1500 });
      expect(DEFAULT_THRESHOLDS.fid).toEqual({ good: 50, poor: 150 });
    });
  });

  describe('DEFAULT_WEIGHTS', () => {
    it('should have correct default values that sum to 1', () => {
      expect(DEFAULT_WEIGHTS.ttff).toBe(0.25);
      expect(DEFAULT_WEIGHTS.tti).toBe(0.45);
      expect(DEFAULT_WEIGHTS.fid).toBe(0.30);

      const sum = DEFAULT_WEIGHTS.ttff + DEFAULT_WEIGHTS.tti + DEFAULT_WEIGHTS.fid;
      expect(sum).toBe(1);
    });
  });
});
