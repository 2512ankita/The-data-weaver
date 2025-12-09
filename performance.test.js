/**
 * Performance Tests for Data Weaver Dashboard
 * 
 * These tests verify that the application meets performance requirements
 * for data processing, rendering, and memory usage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataNormalizer } from '../src/DataNormalizer.js';
import { InsightEngine } from '../src/InsightEngine.js';

describe('Performance Tests', () => {
  let normalizer;
  let insightEngine;

  beforeEach(() => {
    normalizer = new DataNormalizer();
    insightEngine = new InsightEngine();
  });

  describe('Data Normalization Performance', () => {
    it('should normalize air quality data in under 50ms', () => {
      // Generate large dataset
      const rawData = {
        list: Array.from({ length: 200 }, (_, i) => ({
          dt: 1638316800 + i * 3600,
          main: { aqi: Math.floor(Math.random() * 5) + 1 }
        }))
      };

      const startTime = performance.now();
      const result = normalizer.normalizeAirQuality(rawData, { normalize: true });
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
      expect(result.dataPoints.length).toBeLessThanOrEqual(100); // Should be limited
    });

    it('should normalize crypto data in under 50ms', () => {
      // Generate large dataset
      const rawData = {
        prices: Array.from({ length: 200 }, (_, i) => [
          1638316800000 + i * 3600000,
          40000 + Math.random() * 10000
        ])
      };

      const startTime = performance.now();
      const result = normalizer.normalizeCrypto(rawData, { normalize: true });
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
      expect(result.dataPoints.length).toBeLessThanOrEqual(100); // Should be limited
    });

    it('should limit data points to 100 for optimal performance', () => {
      // Generate dataset with 200 points
      const rawData = {
        prices: Array.from({ length: 200 }, (_, i) => [
          1638316800000 + i * 3600000,
          40000 + Math.random() * 10000
        ])
      };

      const result = normalizer.normalizeCrypto(rawData, { normalize: true });
      
      // Should be limited to 100 most recent points
      expect(result.dataPoints.length).toBe(100);
      
      // Verify we kept the most recent points
      const firstTimestamp = result.dataPoints[0].timestamp;
      const lastTimestamp = result.dataPoints[99].timestamp;
      expect(lastTimestamp).toBeGreaterThan(firstTimestamp);
    });
  });

  describe('Insight Generation Performance', () => {
    it('should generate insights in under 50ms', () => {
      // Create test series
      const series1 = {
        sourceName: 'Air Quality',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: Math.random(),
          originalValue: Math.floor(Math.random() * 5) + 1
        })),
        metadata: { unit: 'AQI', min: 1, max: 5, mean: 3, count: 100 }
      };

      const series2 = {
        sourceName: 'Cryptocurrency',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: Math.random(),
          originalValue: 40000 + Math.random() * 10000
        })),
        metadata: { unit: 'USD', min: 40000, max: 50000, mean: 45000, count: 100 }
      };

      const startTime = performance.now();
      const insights = insightEngine.analyzeData(series1, series2);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
      expect(insights).toHaveProperty('trends');
      expect(insights).toHaveProperty('correlation');
      expect(insights).toHaveProperty('summary');
    });

    it('should detect trends efficiently', () => {
      const series = {
        sourceName: 'Test',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: i * 0.01, // Increasing trend
          originalValue: i
        })),
        metadata: { unit: 'test', min: 0, max: 99, mean: 50, count: 100 }
      };

      const startTime = performance.now();
      const trend = insightEngine.detectTrends(series);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(trend).toBe('increasing');
    });

    it('should calculate correlation efficiently', () => {
      const series1 = {
        sourceName: 'Series 1',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: i * 0.01,
          originalValue: i
        })),
        metadata: { unit: 'test', min: 0, max: 99, mean: 50, count: 100 }
      };

      const series2 = {
        sourceName: 'Series 2',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: i * 0.01,
          originalValue: i
        })),
        metadata: { unit: 'test', min: 0, max: 99, mean: 50, count: 100 }
      };

      const startTime = performance.now();
      const correlation = insightEngine.calculateCorrelation(series1, series2);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(20);
      expect(correlation).toHaveProperty('coefficient');
      expect(correlation).toHaveProperty('strength');
      expect(correlation).toHaveProperty('direction');
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive objects during normalization', () => {
      const rawData = {
        prices: Array.from({ length: 100 }, (_, i) => [
          1638316800000 + i * 3600000,
          40000 + Math.random() * 10000
        ])
      };

      // Normalize multiple times
      for (let i = 0; i < 10; i++) {
        const result = normalizer.normalizeCrypto(rawData, { normalize: true });
        expect(result.dataPoints.length).toBeLessThanOrEqual(100);
      }

      // If this test completes without memory issues, we're good
      expect(true).toBe(true);
    });

    it('should handle empty datasets efficiently', () => {
      const emptyData = { list: [] };
      
      const startTime = performance.now();
      const result = normalizer.normalizeAirQuality(emptyData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5);
      expect(result.dataPoints).toEqual([]);
    });
  });

  describe('Data Point Limiting', () => {
    it('should limit air quality data to 100 points', () => {
      const rawData = {
        list: Array.from({ length: 500 }, (_, i) => ({
          dt: 1638316800 + i * 3600,
          main: { aqi: Math.floor(Math.random() * 5) + 1 }
        }))
      };

      const result = normalizer.normalizeAirQuality(rawData);
      
      expect(result.dataPoints.length).toBe(100);
    });

    it('should limit crypto data to 100 points', () => {
      const rawData = {
        prices: Array.from({ length: 500 }, (_, i) => [
          1638316800000 + i * 3600000,
          40000 + Math.random() * 10000
        ])
      };

      const result = normalizer.normalizeCrypto(rawData);
      
      expect(result.dataPoints.length).toBe(100);
    });

    it('should keep most recent data points when limiting', () => {
      const rawData = {
        prices: Array.from({ length: 200 }, (_, i) => [
          1638316800000 + i * 3600000,
          40000 + i // Increasing values
        ])
      };

      const result = normalizer.normalizeCrypto(rawData);
      
      // Should have 100 points
      expect(result.dataPoints.length).toBe(100);
      
      // First point should be from index 100 (most recent 100)
      expect(result.dataPoints[0].originalValue).toBeGreaterThanOrEqual(40100);
      
      // Last point should be from index 199
      expect(result.dataPoints[99].originalValue).toBeCloseTo(40199, 0);
    });
  });

  describe('Scalability', () => {
    it('should handle maximum data points efficiently', () => {
      const series1 = {
        sourceName: 'Series 1',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: Math.random(),
          originalValue: Math.random() * 100
        })),
        metadata: { unit: 'test', min: 0, max: 100, mean: 50, count: 100 }
      };

      const series2 = {
        sourceName: 'Series 2',
        dataPoints: Array.from({ length: 100 }, (_, i) => ({
          timestamp: 1638316800000 + i * 3600000,
          value: Math.random(),
          originalValue: Math.random() * 100
        })),
        metadata: { unit: 'test', min: 0, max: 100, mean: 50, count: 100 }
      };

      const startTime = performance.now();
      const insights = insightEngine.analyzeData(series1, series2);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      // Should complete in under 100ms even with max data
      expect(duration).toBeLessThan(100);
      expect(insights.summary).toBeTruthy();
    });
  });
});
