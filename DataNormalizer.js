/**
 * DataNormalizer - Transforms heterogeneous API responses into unified time series format
 * 
 * This class normalizes data from different sources into a consistent structure
 * for visualization and analysis.
 * 
 * @example
 * const normalizer = new DataNormalizer();
 * 
 * // Normalize air quality data
 * const airQualitySeries = normalizer.normalizeAirQuality(rawAirQualityData, {
 *   normalize: true
 * });
 * 
 * // Normalize cryptocurrency data
 * const cryptoSeries = normalizer.normalizeCrypto(rawCryptoData, {
 *   normalize: true
 * });
 * 
 * // Align two series by timestamp
 * const aligned = normalizer.alignTimeSeriesByTimestamp(
 *   airQualitySeries,
 *   cryptoSeries,
 *   3600000 // 1 hour tolerance
 * );
 */
export class DataNormalizer {
  /**
   * Normalizes OpenWeather Air Quality API response
   * @param {Object} rawData - Raw API response from OpenWeather
   * @param {Object} transformConfig - Transformation configuration from MCP config
   * @returns {Object} Normalized time series object
   */
  normalizeAirQuality(rawData, transformConfig = {}) {
    if (!rawData || !rawData.list || !Array.isArray(rawData.list)) {
      // Handle missing or incomplete data gracefully
      return this.createEmptyTimeSeries('Air Quality', 'AQI');
    }

    const dataPoints = [];
    
    for (const item of rawData.list) {
      if (!item || !item.dt || !item.main || typeof item.main.aqi === 'undefined') {
        // Skip incomplete data points
        continue;
      }

      dataPoints.push({
        timestamp: item.dt * 1000, // Convert Unix timestamp to milliseconds
        value: item.main.aqi,
        originalValue: item.main.aqi,
        label: new Date(item.dt * 1000).toLocaleString()
      });
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Limit to 100 most recent data points for optimal chart performance
    this.limitDataPoints(dataPoints, 100);

    // Calculate metadata
    const values = dataPoints.map(dp => dp.value);
    const metadata = this.calculateMetadata(values, 'AQI');

    // Normalize values if requested
    if (transformConfig.normalize && dataPoints.length > 0) {
      const min = metadata.min;
      const max = metadata.max;
      const range = max - min;

      if (range > 0) {
        dataPoints.forEach(dp => {
          dp.value = (dp.originalValue - min) / range;
        });
      }
    }

    return {
      sourceName: 'Air Quality',
      dataPoints,
      metadata
    };
  }

  /**
   * Normalizes CoinGecko Cryptocurrency API response
   * @param {Object} rawData - Raw API response from CoinGecko
   * @param {Object} transformConfig - Transformation configuration from MCP config
   * @returns {Object} Normalized time series object
   */
  normalizeCrypto(rawData, transformConfig = {}) {
    if (!rawData || !rawData.prices || !Array.isArray(rawData.prices)) {
      // Handle missing or incomplete data gracefully
      return this.createEmptyTimeSeries('Cryptocurrency', 'USD');
    }

    const dataPoints = [];
    
    for (const pricePoint of rawData.prices) {
      if (!Array.isArray(pricePoint) || pricePoint.length < 2) {
        // Skip incomplete data points
        continue;
      }

      const timestamp = pricePoint[0];
      const price = pricePoint[1];

      if (typeof timestamp !== 'number' || typeof price !== 'number') {
        // Skip invalid data types
        continue;
      }

      dataPoints.push({
        timestamp: timestamp, // Already in milliseconds
        value: price,
        originalValue: price,
        label: new Date(timestamp).toLocaleString()
      });
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Limit to 100 most recent data points for optimal chart performance
    this.limitDataPoints(dataPoints, 100);

    // Calculate metadata
    const values = dataPoints.map(dp => dp.value);
    const metadata = this.calculateMetadata(values, 'USD');

    // Normalize values if requested
    if (transformConfig.normalize && dataPoints.length > 0) {
      const min = metadata.min;
      const max = metadata.max;
      const range = max - min;

      if (range > 0) {
        dataPoints.forEach(dp => {
          dp.value = (dp.originalValue - min) / range;
        });
      }
    }

    return {
      sourceName: 'Cryptocurrency',
      dataPoints,
      metadata
    };
  }

  /**
   * Normalizes Open-Meteo Weather API response
   * @param {Object} rawData - Raw API response from Open-Meteo
   * @param {Object} transformConfig - Transformation configuration from MCP config
   * returns {Object} Normalized time series object
   */
  normalizeWeather(rawData, transformConfig = {}) {
    if (!rawData || !rawData.hourly || !Array.isArray(rawData.hourly.time) || !Array.isArray(rawData.hourly.temperature_2m)) {
      return this.createEmptyTimeSeries('Weather', '°C');
    }

    const dataPoints = [];
    const times = rawData.hourly.time;
    const temperatures = rawData.hourly.temperature_2m;

    for (let i = 0; i < times.length && i < temperatures.length; i++) {
      const timeStr = times[i];
      const temp = temperatures[i];

      if (!timeStr || temp === null || temp === undefined) {
        continue;
      }

      const timestamp = new Date(timeStr).getTime();

      dataPoints.push({
        timestamp: timestamp,
        value: temp,
        originalValue: temp,
        label: new Date(timestamp).toLocaleString()
      });
    }

    dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    this.limitDataPoints(dataPoints, 100);

    const values = dataPoints.map(dp => dp.value);
    const metadata = this.calculateMetadata(values, '°C');

    if (transformConfig.normalize && dataPoints.length > 0) {
      const min = metadata.min;
      const max = metadata.max;
      const range = max - min;

      if (range > 0) {
        dataPoints.forEach(dp => {
          dp.value = (dp.originalValue - min) / range;
        });
      }
    }

    return {
      sourceName: 'Weather',
      dataPoints,
      metadata
    };
  }

  /**
   * Normalizes Frankfurter Currency API response
   * @param {Object} rawData - Raw API response from Frankfurter
   * @param {Object} transformConfig - Transformation configuration from MCP config
   * @returns {Object} Normalized time series object
   */
  normalizeCurrency(rawData, transformConfig = {}) {
    if (!rawData || !rawData.rates) {
      console.error('Currency data missing or invalid:', rawData);
      return this.createEmptyTimeSeries('Currency', 'USD');
    }

    const dataPoints = [];
    const rates = rawData.rates;

    // Frankfurter returns rates as an object with dates as keys
    for (const [dateStr, rateObj] of Object.entries(rates)) {
      if (!rateObj || typeof rateObj.USD === 'undefined') {
        continue;
      }

      const timestamp = new Date(dateStr + 'T12:00:00Z').getTime();
      const rate = rateObj.USD;

      dataPoints.push({
        timestamp: timestamp,
        value: rate,
        originalValue: rate,
        label: new Date(timestamp).toLocaleString()
      });
    }

    if (dataPoints.length === 0) {
      console.warn('No valid currency data points found');
      return this.createEmptyTimeSeries('Currency', 'USD');
    }

    dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    this.limitDataPoints(dataPoints, 100);

    const values = dataPoints.map(dp => dp.value);
    const metadata = this.calculateMetadata(values, 'USD');

    if (transformConfig.normalize && dataPoints.length > 0) {
      const min = metadata.min;
      const max = metadata.max;
      const range = max - min;

      if (range > 0) {
        dataPoints.forEach(dp => {
          dp.value = (dp.originalValue - min) / range;
        });
      }
    }

    return {
      sourceName: 'Currency',
      dataPoints,
      metadata
    };
  }

  /**
   * Creates a generic time series from data with configurable field extraction
   * @param {Array} data - Array of data objects
   * @param {string} valueKey - Key or path to extract value from each object
   * @param {string} timestampKey - Key or path to extract timestamp from each object
   * @param {Object} options - Additional options (sourceName, unit, normalize)
   * @returns {Object} Normalized time series object
   */
  createTimeSeries(data, valueKey, timestampKey, options = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      return this.createEmptyTimeSeries(
        options.sourceName || 'Unknown',
        options.unit || ''
      );
    }

    const dataPoints = [];

    for (const item of data) {
      if (!item) {
        continue;
      }

      // Extract value and timestamp using key paths
      const value = this.extractValue(item, valueKey);
      const timestamp = this.extractValue(item, timestampKey);

      if (value === null || timestamp === null) {
        // Skip items where extraction failed
        continue;
      }

      // Ensure timestamp is in milliseconds
      const timestampMs = typeof timestamp === 'number' && timestamp < 10000000000
        ? timestamp * 1000
        : timestamp;

      dataPoints.push({
        timestamp: timestampMs,
        value: value,
        originalValue: value,
        label: new Date(timestampMs).toLocaleString()
      });
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Limit to 100 most recent data points for optimal chart performance
    this.limitDataPoints(dataPoints, 100);

    // Calculate metadata
    const values = dataPoints.map(dp => dp.value);
    const metadata = this.calculateMetadata(values, options.unit || '');

    // Normalize values if requested
    if (options.normalize && dataPoints.length > 0) {
      const min = metadata.min;
      const max = metadata.max;
      const range = max - min;

      if (range > 0) {
        dataPoints.forEach(dp => {
          dp.value = (dp.originalValue - min) / range;
        });
      }
    }

    return {
      sourceName: options.sourceName || 'Unknown',
      dataPoints,
      metadata
    };
  }

  /**
   * Aligns two time series by timestamp, creating matched pairs
   * @param {Object} series1 - First time series object
   * @param {Object} series2 - Second time series object
   * @param {number} toleranceMs - Timestamp matching tolerance in milliseconds (default: 3600000 = 1 hour)
   * @returns {Object} Object containing aligned series and matched pairs
   */
  alignTimeSeriesByTimestamp(series1, series2, toleranceMs = 3600000) {
    if (!series1 || !series2 || 
        !series1.dataPoints || !series2.dataPoints ||
        series1.dataPoints.length === 0 || series2.dataPoints.length === 0) {
      return {
        series1: series1 || this.createEmptyTimeSeries('Series 1', ''),
        series2: series2 || this.createEmptyTimeSeries('Series 2', ''),
        alignedPairs: []
      };
    }

    const alignedPairs = [];
    const points1 = [...series1.dataPoints];
    const points2 = [...series2.dataPoints];

    // For each point in series1, find the closest point in series2
    for (const point1 of points1) {
      let closestPoint = null;
      let minDiff = Infinity;

      for (const point2 of points2) {
        const diff = Math.abs(point1.timestamp - point2.timestamp);
        
        if (diff < minDiff && diff <= toleranceMs) {
          minDiff = diff;
          closestPoint = point2;
        }
      }

      if (closestPoint) {
        alignedPairs.push({
          timestamp: point1.timestamp,
          value1: point1.value,
          value2: closestPoint.value,
          originalValue1: point1.originalValue,
          originalValue2: closestPoint.originalValue,
          timeDiff: Math.abs(point1.timestamp - closestPoint.timestamp)
        });
      }
    }

    return {
      series1,
      series2,
      alignedPairs
    };
  }

  /**
   * Extracts a value from an object using a key path
   * @param {Object} obj - Object to extract from
   * @param {string} keyPath - Dot-notation path or array notation (e.g., "main.aqi" or "prices[][0]")
   * @returns {any} Extracted value or null if not found
   * @private
   */
  extractValue(obj, keyPath) {
    if (!obj || !keyPath) {
      return null;
    }

    // Handle array notation like "prices[][0]"
    if (keyPath.includes('[]')) {
      // This is a simplified handler - assumes the object itself is the array
      const parts = keyPath.split('[]');
      if (parts.length === 2 && parts[0] === '' && Array.isArray(obj)) {
        // Extract from array element
        const index = parseInt(parts[1].replace(/[\[\]]/g, ''), 10);
        return !isNaN(index) && obj.length > index ? obj[index] : null;
      }
      return null;
    }

    // Handle dot notation like "main.aqi"
    const keys = keyPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[key];
    }

    return current !== undefined ? current : null;
  }

  /**
   * Calculates metadata for a set of values
   * @param {number[]} values - Array of numeric values
   * @param {string} unit - Unit of measurement
   * @returns {Object} Metadata object with min, max, mean, unit
   * @private
   */
  calculateMetadata(values, unit) {
    if (!values || values.length === 0) {
      return {
        unit,
        min: 0,
        max: 0,
        mean: 0,
        count: 0
      };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    return {
      unit,
      min,
      max,
      mean,
      count: values.length
    };
  }

  /**
   * Creates an empty time series object
   * @param {string} sourceName - Name of the data source
   * @param {string} unit - Unit of measurement
   * @returns {Object} Empty time series object
   * @private
   */
  createEmptyTimeSeries(sourceName, unit) {
    return {
      sourceName,
      dataPoints: [],
      metadata: {
        unit,
        min: 0,
        max: 0,
        mean: 0,
        count: 0
      }
    };
  }

  /**
   * Limits data points array to maximum size for performance
   * Keeps the most recent data points
   * @param {Array} dataPoints - Array of data points to limit (modified in place)
   * @param {number} maxPoints - Maximum number of points to keep (default: 100)
   * @private
   */
  limitDataPoints(dataPoints, maxPoints = 100) {
    if (dataPoints.length > maxPoints) {
      // Remove oldest points, keep most recent
      dataPoints.splice(0, dataPoints.length - maxPoints);
    }
  }
}
