/**
 * VisualizationEngine - Renders interactive charts using Chart.js
 * 
 * This class manages the creation and updating of dual-source data visualizations
 * with interactive tooltips, legends, and smooth animations.
 * 
 * @example
 * const canvas = document.getElementById('chart-canvas');
 * const vizEngine = new VisualizationEngine(canvas);
 * 
 * // Render a dual-source chart
 * vizEngine.renderDualSourceChart(airQualitySeries, cryptoSeries);
 * 
 * // Update the chart with new data
 * vizEngine.updateChart(newAirQualitySeries, newCryptoSeries);
 * 
 * // Clean up when done
 * vizEngine.destroy();
 */
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

export class VisualizationEngine {
  /**
   * Creates a new VisualizationEngine instance
   * @param {HTMLCanvasElement} canvasElement - The canvas element to render the chart on
   */
  constructor(canvasElement) {
    if (!canvasElement) {
      throw new Error('Canvas element is required for VisualizationEngine');
    }

    this.canvas = canvasElement;
    this.chart = null;
    this.currentData = null;
  }

  /**
   * Renders a dual-source chart with two y-axes
   * @param {Object} series1 - First normalized time series object
   * @param {Object} series2 - Second normalized time series object
   * @param {Object} options - Chart configuration options
   * @returns {Chart} The created Chart.js instance
   */
  renderDualSourceChart(series1, series2, options = {}) {
    // Destroy existing chart if it exists to prevent memory leaks
    if (this.chart) {
      this.chart.destroy();
    }

    // Validate input data
    if (!series1 || !series2) {
      throw new Error('Both series1 and series2 are required');
    }

    if (!series1.dataPoints || !series2.dataPoints) {
      throw new Error('Both series must have dataPoints arrays');
    }

    // Store current data for updates
    this.currentData = { series1, series2, options };

    // Prepare datasets
    const labels = this.generateLabels(series1, series2);
    const dataset1 = this.createDataset(series1, 'rgb(59, 130, 246)', 'y1'); // Blue
    const dataset2 = this.createDataset(series2, 'rgb(239, 68, 68)', 'y2'); // Red

    // Configure chart
    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [dataset1, dataset2]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: this.configureLegends(series1, series2),
          tooltip: this.configureTooltips(series1, series2)
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: `${series1.sourceName} (${series1.metadata.unit})`
            },
            grid: {
              drawOnChartArea: true,
            }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: `${series2.sourceName} (${series2.metadata.unit})`
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        ...options
      }
    };

    // Create the chart
    this.chart = new Chart(this.canvas, chartConfig);

    return this.chart;
  }

  /**
   * Updates the chart with new data
   * @param {Object} series1 - Updated first time series
   * @param {Object} series2 - Updated second time series
   */
  updateChart(series1, series2) {
    if (!this.chart) {
      // If no chart exists, create one
      return this.renderDualSourceChart(series1, series2);
    }

    // Validate input data
    if (!series1 || !series2 || !series1.dataPoints || !series2.dataPoints) {
      throw new Error('Invalid data provided for chart update');
    }

    // Update stored data
    this.currentData = { series1, series2, options: this.currentData?.options || {} };

    // Update labels
    this.chart.data.labels = this.generateLabels(series1, series2);

    // Update datasets
    this.chart.data.datasets[0].data = series1.dataPoints.map(dp => dp.originalValue);
    this.chart.data.datasets[0].label = series1.sourceName;

    this.chart.data.datasets[1].data = series2.dataPoints.map(dp => dp.originalValue);
    this.chart.data.datasets[1].label = series2.sourceName;

    // Update scale titles
    this.chart.options.scales.y1.title.text = `${series1.sourceName} (${series1.metadata.unit})`;
    this.chart.options.scales.y2.title.text = `${series2.sourceName} (${series2.metadata.unit})`;

    // Apply smooth transition animation
    this.applyTransitions();

    // Update the chart
    this.chart.update();
  }

  /**
   * Configures tooltip settings for detailed value display
   * @param {Object} series1 - First time series for context
   * @param {Object} series2 - Second time series for context
   * @returns {Object} Tooltip configuration
   */
  configureTooltips(series1, series2) {
    return {
      enabled: true,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        title: (tooltipItems) => {
          // Display the timestamp label
          return tooltipItems[0]?.label || '';
        },
        label: (context) => {
          const datasetLabel = context.dataset.label || '';
          const value = context.parsed.y;
          
          // Get the appropriate unit based on dataset
          const series = context.datasetIndex === 0 ? series1 : series2;
          const unit = series.metadata.unit;
          
          // Format the value with appropriate precision
          const formattedValue = typeof value === 'number' 
            ? value.toFixed(2) 
            : value;
          
          return `${datasetLabel}: ${formattedValue} ${unit}`;
        },
        afterBody: (tooltipItems) => {
          // Add additional context if needed
          if (tooltipItems.length > 1) {
            return '\nHover to see detailed values';
          }
          return '';
        }
      }
    };
  }

  /**
   * Configures legend settings with data source names
   * @param {Object} series1 - First time series
   * @param {Object} series2 - Second time series
   * @returns {Object} Legend configuration
   */
  configureLegends(series1, series2) {
    return {
      display: true,
      position: 'top',
      align: 'center',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          weight: 'normal'
        },
        color: '#374151',
        generateLabels: (chart) => {
          const datasets = chart.data.datasets;
          return datasets.map((dataset, i) => ({
            text: dataset.label,
            fillStyle: dataset.borderColor,
            strokeStyle: dataset.borderColor,
            lineWidth: 2,
            hidden: !chart.isDatasetVisible(i),
            index: i,
            pointStyle: 'circle'
          }));
        }
      },
      onClick: (e, legendItem, legend) => {
        // Toggle dataset visibility
        const index = legendItem.index;
        const chart = legend.chart;
        const meta = chart.getDatasetMeta(index);
        
        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
        chart.update();
      }
    };
  }

  /**
   * Applies smooth transition animations to chart updates
   */
  applyTransitions() {
    if (!this.chart) {
      return;
    }

    // Configure smooth transitions
    this.chart.options.animation = {
      duration: 750,
      easing: 'easeInOutQuart',
      onProgress: null,
      onComplete: null
    };

    // Enable animations for all properties
    this.chart.options.animations = {
      tension: {
        duration: 750,
        easing: 'easeInOutQuart',
        from: 0.4,
        to: 0.2,
        loop: false
      },
      y: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    };
  }

  /**
   * Creates a dataset configuration for Chart.js
   * @param {Object} series - Time series object
   * @param {string} color - RGB color string
   * @param {string} yAxisID - Y-axis identifier ('y1' or 'y2')
   * @returns {Object} Dataset configuration
   * @private
   */
  createDataset(series, color, yAxisID) {
    return {
      label: series.sourceName,
      data: series.dataPoints.map(dp => dp.originalValue),
      borderColor: color,
      backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 2,
      fill: false,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      yAxisID: yAxisID
    };
  }

  /**
   * Generates time labels from both series
   * @param {Object} series1 - First time series
   * @param {Object} series2 - Second time series
   * @returns {string[]} Array of formatted time labels
   * @private
   */
  generateLabels(series1, series2) {
    // Use the series with more data points as the base
    const baseSeries = series1.dataPoints.length >= series2.dataPoints.length 
      ? series1 
      : series2;

    // Generate labels from timestamps
    return baseSeries.dataPoints.map(dp => {
      const date = new Date(dp.timestamp);
      // Format as short date/time
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });
  }

  /**
   * Destroys the chart instance and cleans up resources
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.currentData = null;
  }

  /**
   * Gets the current chart instance
   * @returns {Chart|null} The Chart.js instance or null
   */
  getChart() {
    return this.chart;
  }
}
