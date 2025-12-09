/**
 * Basic smoke tests for VisualizationEngine
 * These tests verify the class structure and basic functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisualizationEngine } from '../src/VisualizationEngine.js';

describe('VisualizationEngine', () => {
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // Create a mock canvas element
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      canvas: { width: 800, height: 600 }
    };

    mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: 800,
      height: 600,
      style: {}
    };
  });

  it('should create an instance with a canvas element', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(engine).toBeDefined();
    expect(engine.canvas).toBe(mockCanvas);
  });

  it('should throw error when canvas element is missing', () => {
    expect(() => new VisualizationEngine(null)).toThrow('Canvas element is required');
  });

  it('should have renderDualSourceChart method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.renderDualSourceChart).toBe('function');
  });

  it('should have updateChart method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.updateChart).toBe('function');
  });

  it('should have configureTooltips method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.configureTooltips).toBe('function');
  });

  it('should have configureLegends method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.configureLegends).toBe('function');
  });

  it('should have applyTransitions method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.applyTransitions).toBe('function');
  });

  it('should have destroy method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.destroy).toBe('function');
  });

  it('should have getChart method', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(typeof engine.getChart).toBe('function');
  });

  it('should return null from getChart before rendering', () => {
    const engine = new VisualizationEngine(mockCanvas);
    expect(engine.getChart()).toBeNull();
  });

  it('should configure tooltips with proper structure', () => {
    const engine = new VisualizationEngine(mockCanvas);
    const series1 = {
      sourceName: 'Test Series 1',
      dataPoints: [],
      metadata: { unit: 'units' }
    };
    const series2 = {
      sourceName: 'Test Series 2',
      dataPoints: [],
      metadata: { unit: 'values' }
    };

    const tooltipConfig = engine.configureTooltips(series1, series2);
    
    expect(tooltipConfig).toBeDefined();
    expect(tooltipConfig.enabled).toBe(true);
    expect(tooltipConfig.callbacks).toBeDefined();
    expect(typeof tooltipConfig.callbacks.label).toBe('function');
  });

  it('should configure legends with proper structure', () => {
    const engine = new VisualizationEngine(mockCanvas);
    const series1 = {
      sourceName: 'Test Series 1',
      dataPoints: [],
      metadata: { unit: 'units' }
    };
    const series2 = {
      sourceName: 'Test Series 2',
      dataPoints: [],
      metadata: { unit: 'values' }
    };

    const legendConfig = engine.configureLegends(series1, series2);
    
    expect(legendConfig).toBeDefined();
    expect(legendConfig.display).toBe(true);
    expect(legendConfig.position).toBe('top');
    expect(legendConfig.labels).toBeDefined();
  });
});
