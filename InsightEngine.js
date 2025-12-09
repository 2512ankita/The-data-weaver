/**
 * InsightEngine - Analyzes data and generates descriptive observations
 * 
 * This class analyzes time series data to detect trends, spikes, correlations,
 * and generates human-readable insights about patterns in the data.
 * 
 * @example
 * const insightEngine = new InsightEngine({ spikeThreshold: 1.5 });
 * 
 * // Analyze two time series
 * const insights = insightEngine.analyzeData(airQualitySeries, cryptoSeries);
 * console.log(insights.summary); // Human-readable insight text
 * console.log(insights.correlation); // { coefficient: 0.23, strength: 'weak', direction: 'positive' }
 * console.log(insights.trends); // { source1: 'increasing', source2: 'stable' }
 * console.log(insights.spikes); // Array of detected spikes
 */
export class InsightEngine {
  /**
   * Creates a new InsightEngine instance
   * @param {Object} options - Configuration options
   * @param {number} options.spikeThreshold - Threshold for spike detection (default: 1.5 standard deviations)
   */
  constructor(options = {}) {
    this.spikeThreshold = options.spikeThreshold || 1.5;
  }

  /**
   * Analyzes two time series datasets and generates comprehensive insights
   * @param {Object} series1 - First normalized time series object
   * @param {Object} series2 - Second normalized time series object
   * @returns {Object} Analysis results with trends, spikes, correlation, and summary
   */
  analyzeData(series1, series2) {
    if (!series1 || !series2) {
      return this.createEmptyAnalysis();
    }

    // Detect trends in both series
    const trend1 = this.detectTrends(series1);
    const trend2 = this.detectTrends(series2);

    // Detect spikes in both series
    const spikes1 = this.detectSpikes(series1, this.spikeThreshold);
    const spikes2 = this.detectSpikes(series2, this.spikeThreshold);

    // Calculate correlation between series
    const correlation = this.calculateCorrelation(series1, series2);

    // Generate human-readable insight text
    const summary = this.generateInsightText({
      series1,
      series2,
      trends: { source1: trend1, source2: trend2 },
      spikes: [...spikes1, ...spikes2],
      correlation
    });

    return {
      trends: {
        source1: trend1,
        source2: trend2
      },
      spikes: [...spikes1, ...spikes2],
      correlation,
      summary
    };
  }

  /**
   * Detects the overall trend in a time series
   * @param {Object} series - Normalized time series object
   * @returns {string} Trend classification: "increasing", "decreasing", or "stable"
   */
  detectTrends(series) {
    if (!series || !series.dataPoints || series.dataPoints.length < 2) {
      return 'stable';
    }

    const dataPoints = series.dataPoints;
    const n = dataPoints.length;

    // Calculate linear regression slope
    // Using simple linear regression: y = mx + b
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // Use index as x-coordinate
      const y = dataPoints[i].value;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    // Calculate slope (m)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate mean value for normalization
    const meanValue = sumY / n;

    // Normalize slope by mean to get percentage change per data point
    const normalizedSlope = meanValue !== 0 ? slope / meanValue : slope;

    // Classify trend based on normalized slope
    // Threshold: 0.01 means 1% change per data point
    const threshold = 0.01;

    if (normalizedSlope > threshold) {
      return 'increasing';
    } else if (normalizedSlope < -threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Detects significant spikes in a time series
   * @param {Object} series - Normalized time series object
   * @param {number} threshold - Number of standard deviations to consider a spike
   * @returns {Array} Array of spike objects with source, timestamp, value, and percentChange
   */
  detectSpikes(series, threshold = 1.5) {
    if (!series || !series.dataPoints || series.dataPoints.length < 3) {
      return [];
    }

    const dataPoints = series.dataPoints;
    const values = dataPoints.map(dp => dp.value);

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // If standard deviation is too small, no meaningful spikes
    if (stdDev < 0.0001) {
      return [];
    }

    const spikes = [];

    // Check each data point for spikes
    for (let i = 1; i < dataPoints.length - 1; i++) {
      const currentValue = dataPoints[i].value;
      const prevValue = dataPoints[i - 1].value;
      const nextValue = dataPoints[i + 1].value;

      // Calculate z-score (how many standard deviations from mean)
      const zScore = Math.abs((currentValue - mean) / stdDev);

      // Check if this is a spike (significantly different from mean)
      if (zScore > threshold) {
        // Also check if it's a local extremum (higher or lower than neighbors)
        const isLocalMax = currentValue > prevValue && currentValue > nextValue;
        const isLocalMin = currentValue < prevValue && currentValue < nextValue;

        if (isLocalMax || isLocalMin) {
          // Calculate percent change from previous value
          const percentChange = prevValue !== 0 
            ? ((currentValue - prevValue) / Math.abs(prevValue)) * 100
            : 0;

          spikes.push({
            source: series.sourceName,
            timestamp: dataPoints[i].timestamp,
            value: dataPoints[i].originalValue,
            percentChange: Math.round(percentChange * 100) / 100,
            zScore: Math.round(zScore * 100) / 100
          });
        }
      }
    }

    return spikes;
  }

  /**
   * Calculates the correlation coefficient between two time series
   * @param {Object} series1 - First normalized time series object
   * @param {Object} series2 - Second normalized time series object
   * @returns {Object} Correlation object with coefficient, strength, and direction
   */
  calculateCorrelation(series1, series2) {
    if (!series1 || !series2 || 
        !series1.dataPoints || !series2.dataPoints ||
        series1.dataPoints.length === 0 || series2.dataPoints.length === 0) {
      return {
        coefficient: 0,
        strength: 'none',
        direction: 'none'
      };
    }

    // Align data points by timestamp for correlation calculation
    const alignedPairs = this.alignDataPoints(series1.dataPoints, series2.dataPoints);

    if (alignedPairs.length < 2) {
      return {
        coefficient: 0,
        strength: 'none',
        direction: 'none'
      };
    }

    // Extract aligned values
    const values1 = alignedPairs.map(pair => pair.value1);
    const values2 = alignedPairs.map(pair => pair.value2);

    // Calculate Pearson correlation coefficient
    const n = values1.length;
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);

    // Handle edge case where denominator is zero
    const coefficient = denominator !== 0 ? numerator / denominator : 0;

    // Classify correlation strength and direction
    const absCoeff = Math.abs(coefficient);
    let strength;
    
    if (absCoeff >= 0.7) {
      strength = 'strong';
    } else if (absCoeff >= 0.4) {
      strength = 'moderate';
    } else if (absCoeff >= 0.1) {
      strength = 'weak';
    } else {
      strength = 'none';
    }

    const direction = coefficient > 0.1 ? 'positive' : 
                     coefficient < -0.1 ? 'negative' : 
                     'none';

    return {
      coefficient: Math.round(coefficient * 1000) / 1000,
      strength,
      direction
    };
  }

  /**
   * Generates human-readable insight text from analysis results
   * @param {Object} analysis - Analysis results object
   * @returns {string} Human-readable insight paragraph
   */
  generateInsightText(analysis) {
    const { series1, series2, trends, spikes, correlation } = analysis;

    if (!series1 || !series2) {
      return 'Insufficient data to generate insights.';
    }

    const insights = [];

    // Generate trend insights
    const trendText = this.generateTrendInsight(series1, series2, trends);
    if (trendText) {
      insights.push(trendText);
    }

    // Generate spike insights
    const spikeText = this.generateSpikeInsight(spikes);
    if (spikeText) {
      insights.push(spikeText);
    }

    // Generate correlation insights
    const correlationText = this.generateCorrelationInsight(series1, series2, correlation);
    if (correlationText) {
      insights.push(correlationText);
    }

    // Combine insights into a paragraph
    if (insights.length === 0) {
      return 'The data shows stable patterns with no significant trends or correlations detected.';
    }

    return insights.join(' ');
  }

  /**
   * Generates insight text about trends
   * @param {Object} series1 - First time series
   * @param {Object} series2 - Second time series
   * @param {Object} trends - Trends object
   * @returns {string} Trend insight text
   * @private
   */
  generateTrendInsight(series1, series2, trends) {
    const name1 = series1.sourceName || 'First dataset';
    const name2 = series2.sourceName || 'Second dataset';

    const trend1 = trends.source1;
    const trend2 = trends.source2;

    if (trend1 === 'stable' && trend2 === 'stable') {
      return `Both ${name1} and ${name2} show stable patterns over the observed period.`;
    }

    const parts = [];

    if (trend1 !== 'stable') {
      parts.push(`${name1} is ${trend1}`);
    }

    if (trend2 !== 'stable') {
      parts.push(`${name2} is ${trend2}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return parts.join(', while ') + '.';
  }

  /**
   * Generates insight text about spikes
   * @param {Array} spikes - Array of spike objects
   * @returns {string} Spike insight text
   * @private
   */
  generateSpikeInsight(spikes) {
    if (!spikes || spikes.length === 0) {
      return '';
    }

    // Sort spikes by absolute percent change
    const sortedSpikes = [...spikes].sort((a, b) => 
      Math.abs(b.percentChange) - Math.abs(a.percentChange)
    );

    // Report the most significant spike
    const topSpike = sortedSpikes[0];
    const date = new Date(topSpike.timestamp).toLocaleDateString();
    const direction = topSpike.percentChange > 0 ? 'spike' : 'drop';
    const absChange = Math.abs(topSpike.percentChange);

    if (spikes.length === 1) {
      return `A notable ${direction} of ${absChange}% was detected in ${topSpike.source} on ${date}.`;
    } else {
      return `Notable fluctuations were detected, including a ${absChange}% ${direction} in ${topSpike.source} on ${date}.`;
    }
  }

  /**
   * Generates insight text about correlation
   * @param {Object} series1 - First time series
   * @param {Object} series2 - Second time series
   * @param {Object} correlation - Correlation object
   * @returns {string} Correlation insight text
   * @private
   */
  generateCorrelationInsight(series1, series2, correlation) {
    const name1 = series1.sourceName || 'First dataset';
    const name2 = series2.sourceName || 'Second dataset';

    if (correlation.strength === 'none') {
      return `No significant correlation was found between ${name1} and ${name2}.`;
    }

    const strengthText = correlation.strength;
    const directionText = correlation.direction === 'positive' 
      ? 'positive' 
      : 'negative';

    return `A ${strengthText} ${directionText} correlation (r=${correlation.coefficient}) exists between ${name1} and ${name2}.`;
  }

  /**
   * Aligns data points from two series by timestamp
   * @param {Array} dataPoints1 - Data points from first series
   * @param {Array} dataPoints2 - Data points from second series
   * @returns {Array} Array of aligned pairs
   * @private
   */
  alignDataPoints(dataPoints1, dataPoints2) {
    const aligned = [];
    const toleranceMs = 3600000; // 1 hour tolerance

    for (const point1 of dataPoints1) {
      // Find closest point in series2
      let closestPoint = null;
      let minDiff = Infinity;

      for (const point2 of dataPoints2) {
        const diff = Math.abs(point1.timestamp - point2.timestamp);
        
        if (diff < minDiff && diff <= toleranceMs) {
          minDiff = diff;
          closestPoint = point2;
        }
      }

      if (closestPoint) {
        aligned.push({
          timestamp: point1.timestamp,
          value1: point1.value,
          value2: closestPoint.value
        });
      }
    }

    return aligned;
  }

  /**
   * Creates an empty analysis result
   * @returns {Object} Empty analysis object
   * @private
   */
  createEmptyAnalysis() {
    return {
      trends: {
        source1: 'stable',
        source2: 'stable'
      },
      spikes: [],
      correlation: {
        coefficient: 0,
        strength: 'none',
        direction: 'none'
      },
      summary: 'Insufficient data to generate insights.'
    };
  }
}
