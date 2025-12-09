/**
 * UIController - Manages user interactions and coordinates components
 * 
 * This class orchestrates the dashboard by coordinating data fetching,
 * normalization, visualization, and insight generation. It also manages
 * UI state, loading indicators, and error display.
 * 
 * @example
 * const uiController = new UIController({
 *   configPath: '/.kiro',
 *   canvasId: 'chart-canvas'
 * });
 * 
 * // Initialize the dashboard
 * await uiController.initialize();
 * 
 * // The controller automatically:
 * // - Loads MCP configuration
 * // - Fetches data from all sources
 * // - Normalizes and visualizes data
 * // - Generates insights
 * // - Sets up event listeners for user interactions
 * 
 * // Clean up when done
 * uiController.destroy();
 */

import { MCPConfigParser } from './MCPConfigParser.js';
import { DataFetcherManager } from './DataFetcherManager.js';
import { DataNormalizer } from './DataNormalizer.js';
import { VisualizationEngine } from './VisualizationEngine.js';
import { InsightEngine } from './InsightEngine.js';
import { ErrorHandler } from './ErrorHandler.js';

export class UIController {
  /**
   * Creates a new UIController instance
   * @param {Object} options - Configuration options
   * @param {string} options.configPath - Path to .kiro configuration file
   * @param {string} options.canvasId - ID of canvas element for chart
   */
  constructor(options = {}) {
    this.configPath = options.configPath || '/config.json';
    this.canvasId = options.canvasId || 'chart-canvas';
    
    // Component instances
    this.mcpConfig = null;
    this.dataFetcher = null;
    this.dataNormalizer = null;
    this.visualizationEngine = null;
    this.insightEngine = null;
    
    // State
    this.currentTimeRange = '24h';
    this.isLoading = false;
    this.lastFetchTime = null;
    
    // DOM element references (will be set during initialization)
    this.elements = {};
  }

  /**
   * Initializes all components and sets up the UI
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.showLoading();
      
      // Initialize MCP configuration parser
      this.mcpConfig = new MCPConfigParser(this.configPath);
      await this.mcpConfig.loadConfig();
      
      // Initialize other components
      this.dataFetcher = new DataFetcherManager(this.mcpConfig);
      this.dataNormalizer = new DataNormalizer();
      this.insightEngine = new InsightEngine();
      
      // Set up DOM element references
      this.setupDOMReferences();
      
      // Initialize visualization engine
      const canvas = document.getElementById(this.canvasId);
      if (!canvas) {
        throw new Error(`Canvas element with id '${this.canvasId}' not found`);
      }
      this.visualizationEngine = new VisualizationEngine(canvas);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Fetch and display initial data
      await this.refreshData();
      
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      const errorInfo = ErrorHandler.handle(error, 'initialization');
      this.showError(errorInfo.message);
      throw error;
    }
  }

  /**
   * Sets up references to DOM elements
   * @private
   */
  setupDOMReferences() {
    this.elements = {
      refreshButton: document.getElementById('refresh-button'),
      timeRangeSelect: document.getElementById('time-range-select'),
      dataCard1: document.getElementById('data-card-1'),
      dataCard2: document.getElementById('data-card-2'),
      insightSection: document.getElementById('insight-section'),
      loadingIndicator: document.getElementById('loading-indicator'),
      errorContainer: document.getElementById('error-container'),
      chartCanvas: document.getElementById(this.canvasId)
    };
  }

  /**
   * Sets up event listeners for user interactions
   * @private
   */
  setupEventListeners() {
    // Refresh button
    if (this.elements.refreshButton) {
      this.elements.refreshButton.addEventListener('click', () => {
        this.handleRefresh();
      });
    }
    
    // Time range selector
    if (this.elements.timeRangeSelect) {
      this.elements.timeRangeSelect.addEventListener('change', (event) => {
        this.handleTimeRangeChange(event.target.value);
      });
    }
  }

  /**
   * Handles data refresh requests
   * @returns {Promise<void>}
   */
  async handleRefresh() {
    if (this.isLoading) {
      return; // Prevent multiple simultaneous refreshes
    }
    
    try {
      this.showLoading();
      this.clearError();
      
      await this.refreshData();
      
      this.lastFetchTime = Date.now();
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      const errorInfo = ErrorHandler.handle(error, 'refresh');
      this.showError(errorInfo.message);
    }
  }

  /**
   * Handles time range parameter changes
   * @param {string} range - New time range value (e.g., '24h', '7d', '30d')
   * @returns {Promise<void>}
   */
  async handleTimeRangeChange(range) {
    if (this.isLoading) {
      return;
    }
    
    // Update current time range
    this.currentTimeRange = range;
    
    try {
      this.showLoading();
      this.clearError();
      
      // Refresh data with new time range
      await this.refreshData();
      
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      const errorInfo = ErrorHandler.handle(error, 'time-range-change');
      this.showError(errorInfo.message);
    }
  }

  /**
   * Refreshes data from all sources and updates the UI
   * @private
   * @returns {Promise<void>}
   */
  async refreshData() {
    try {
      // Calculate time range parameters
      const params = this.getTimeRangeParams(this.currentTimeRange);
      
      // Fetch data from all sources
      const results = await this.dataFetcher.fetchAllSources(params);
      
      // Get data source names
      const sourceNames = this.mcpConfig.getDataSourceNames();
      
      if (sourceNames.length < 2) {
        throw new Error('At least two data sources are required');
      }
      
      // Extract data for each source
      const source1Name = sourceNames[0];
      const source2Name = sourceNames[1];
      
      const result1 = results[source1Name];
      const result2 = results[source2Name];
      
      // Check for errors
      if (result1.error) {
        throw result1.error;
      }
      if (result2.error) {
        throw result2.error;
      }
      
      // Normalize data
      const source1Config = this.mcpConfig.getDataSource(source1Name);
      const source2Config = this.mcpConfig.getDataSource(source2Name);
      
      let series1, series2;
      
      // Normalize based on source type
      if (source1Name === 'airQuality') {
        series1 = this.dataNormalizer.normalizeAirQuality(
          result1.data,
          source1Config.transformation
        );
      } else if (source1Name === 'weather') {
        series1 = this.dataNormalizer.normalizeWeather(
          result1.data,
          source1Config.transformation
        );
      } else if (source1Name === 'currency') {
        series1 = this.dataNormalizer.normalizeCurrency(
          result1.data,
          source1Config.transformation
        );
      } else if (source1Name === 'cryptocurrency') {
        series1 = this.dataNormalizer.normalizeCrypto(
          result1.data,
          source1Config.transformation
        );
      } else {
        series1 = this.dataNormalizer.createTimeSeries(
          result1.data,
          source1Config.transformation.valueField,
          source1Config.transformation.timestampField,
          {
            sourceName: source1Config.name,
            unit: source1Config.transformation.unit || '',
            normalize: source1Config.transformation.normalize
          }
        );
      }
      
      if (source2Name === 'airQuality') {
        series2 = this.dataNormalizer.normalizeAirQuality(
          result2.data,
          source2Config.transformation
        );
      } else if (source2Name === 'weather') {
        series2 = this.dataNormalizer.normalizeWeather(
          result2.data,
          source2Config.transformation
        );
      } else if (source2Name === 'currency') {
        series2 = this.dataNormalizer.normalizeCurrency(
          result2.data,
          source2Config.transformation
        );
      } else if (source2Name === 'cryptocurrency') {
        series2 = this.dataNormalizer.normalizeCrypto(
          result2.data,
          source2Config.transformation
        );
      } else {
        series2 = this.dataNormalizer.createTimeSeries(
          result2.data,
          source2Config.transformation.valueField,
          source2Config.transformation.timestampField,
          {
            sourceName: source2Config.name,
            unit: source2Config.transformation.unit || '',
            normalize: source2Config.transformation.normalize
          }
        );
      }
      
      // Update data cards
      this.updateDataCards({
        source1: series1,
        source2: series2
      });
      
      // Update or create visualization
      if (this.visualizationEngine.getChart()) {
        this.visualizationEngine.updateChart(series1, series2);
      } else {
        this.visualizationEngine.renderDualSourceChart(series1, series2);
      }
      
      // Generate and display insights
      const insights = this.insightEngine.analyzeData(series1, series2);
      this.updateInsightSection(insights);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates data summary cards with metrics from each source
   * @param {Object} data - Object containing series1 and series2
   */
  updateDataCards(data) {
    const { source1, source2 } = data;
    
    // Update first data card
    if (this.elements.dataCard1 && source1) {
      this.elements.dataCard1.innerHTML = this.renderDataCard(source1);
    }
    
    // Update second data card
    if (this.elements.dataCard2 && source2) {
      this.elements.dataCard2.innerHTML = this.renderDataCard(source2);
    }
  }

  /**
   * Renders HTML for a data summary card
   * @param {Object} series - Time series object
   * @returns {string} HTML string for the card
   * @private
   */
  renderDataCard(series) {
    const { sourceName, metadata, dataPoints } = series;
    
    // Calculate additional metrics
    const latestValue = dataPoints.length > 0 
      ? dataPoints[dataPoints.length - 1].originalValue 
      : 0;
    
    return `
      <div class="data-card-content">
        <h3 class="data-card-title">${this.escapeHtml(sourceName)}</h3>
        <div class="data-card-metrics">
          <div class="metric">
            <span class="metric-label">Latest</span>
            <span class="metric-value">${latestValue.toFixed(2)} ${metadata.unit}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Average</span>
            <span class="metric-value">${metadata.mean.toFixed(2)} ${metadata.unit}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Min</span>
            <span class="metric-value">${metadata.min.toFixed(2)} ${metadata.unit}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Max</span>
            <span class="metric-value">${metadata.max.toFixed(2)} ${metadata.unit}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Data Points</span>
            <span class="metric-value">${metadata.count}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Updates the insight section with analysis results
   * @param {Object} insights - Insights object from InsightEngine
   */
  updateInsightSection(insights) {
    if (!this.elements.insightSection) {
      return;
    }
    
    const { trends, spikes, correlation, summary } = insights;
    
    this.elements.insightSection.innerHTML = `
      <div class="insight-content">
        <h3 class="insight-title">Insights</h3>
        <p class="insight-summary">${this.escapeHtml(summary)}</p>
        
        <div class="insight-details">
          <div class="insight-detail">
            <span class="insight-label">Correlation:</span>
            <span class="insight-value">
              ${correlation.strength} ${correlation.direction} 
              (r=${correlation.coefficient})
            </span>
          </div>
          
          ${spikes.length > 0 ? `
            <div class="insight-detail">
              <span class="insight-label">Notable Events:</span>
              <span class="insight-value">${spikes.length} spike(s) detected</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Shows the loading indicator
   */
  showLoading() {
    this.isLoading = true;
    
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'block';
      this.elements.loadingIndicator.classList.add('visible');
    }
    
    // Disable interactive elements
    if (this.elements.refreshButton) {
      this.elements.refreshButton.disabled = true;
    }
    if (this.elements.timeRangeSelect) {
      this.elements.timeRangeSelect.disabled = true;
    }
  }

  /**
   * Hides the loading indicator
   */
  hideLoading() {
    this.isLoading = false;
    
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'none';
      this.elements.loadingIndicator.classList.remove('visible');
    }
    
    // Re-enable interactive elements
    if (this.elements.refreshButton) {
      this.elements.refreshButton.disabled = false;
    }
    if (this.elements.timeRangeSelect) {
      this.elements.timeRangeSelect.disabled = false;
    }
  }

  /**
   * Displays an error message to the user
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.elements.errorContainer) {
      console.error('Error container not found:', message);
      return;
    }
    
    this.elements.errorContainer.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${this.escapeHtml(message)}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">
          ×
        </button>
      </div>
    `;
    
    this.elements.errorContainer.style.display = 'block';
  }

  /**
   * Clears any displayed error messages
   */
  clearError() {
    if (this.elements.errorContainer) {
      this.elements.errorContainer.innerHTML = '';
      this.elements.errorContainer.style.display = 'none';
    }
  }

  /**
   * Calculates time range parameters for API requests
   * @param {string} range - Time range string (e.g., '24h', '7d', '30d')
   * @returns {Object} Parameters object with start and end timestamps
   * @private
   */
  getTimeRangeParams(range) {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    let start;
    
    switch (range) {
      case '24h':
        start = now - (24 * 60 * 60);
        break;
      case '7d':
        start = now - (7 * 24 * 60 * 60);
        break;
      case '30d':
        start = now - (30 * 24 * 60 * 60);
        break;
      default:
        start = now - (24 * 60 * 60); // Default to 24 hours
    }
    
    // Convert to date strings for Open-Meteo API (YYYY-MM-DD format)
    const startDate = new Date(start * 1000).toISOString().split('T')[0];
    const endDate = new Date(now * 1000).toISOString().split('T')[0];
    
    return {
      start: start,
      end: now,
      start_date: startDate,
      end_date: endDate,
      from: start,
      to: now
    };
  }

  /**
   * Escapes HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return text;
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroys the controller and cleans up resources
   */
  destroy() {
    // Clean up visualization engine
    if (this.visualizationEngine) {
      this.visualizationEngine.destroy();
    }
    
    // Remove event listeners
    if (this.elements.refreshButton) {
      this.elements.refreshButton.removeEventListener('click', this.handleRefresh);
    }
    if (this.elements.timeRangeSelect) {
      this.elements.timeRangeSelect.removeEventListener('change', this.handleTimeRangeChange);
    }
    
    // Clear references
    this.elements = {};
    this.mcpConfig = null;
    this.dataFetcher = null;
    this.dataNormalizer = null;
    this.visualizationEngine = null;
    this.insightEngine = null;
  }
}
