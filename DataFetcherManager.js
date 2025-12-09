/**
 * DataFetcherManager - Manages API requests to configured data sources
 * 
 * This class handles fetching data from multiple sources with rate limiting,
 * retry logic, and error handling.
 * 
 * @example
 * const fetcher = new DataFetcherManager(mcpConfigParser);
 * 
 * // Fetch from a single source
 * const airQualityData = await fetcher.fetchFromSource('airQuality', {
 *   lat: '40.7128',
 *   lon: '-74.0060',
 *   start: 1638316800,
 *   end: 1638403200
 * });
 * 
 * // Fetch from all sources in parallel
 * const allData = await fetcher.fetchAllSources({
 *   start: 1638316800,
 *   end: 1638403200
 * });
 */
export class DataFetcherManager {
  /**
   * Creates a new DataFetcherManager instance
   * @param {MCPConfigParser} mcpConfig - The MCP configuration parser instance
   */
  constructor(mcpConfig) {
    this.mcpConfig = mcpConfig;
    this.requestTimestamps = {}; // Track request timestamps per source for rate limiting
    this.requestQueues = {}; // Queue for pending requests per source
  }

  /**
   * Fetches data from a single data source
   * @param {string} sourceName - Name of the data source (e.g., 'airQuality', 'cryptocurrency')
   * @param {Object} params - Additional query parameters for the request
   * @returns {Promise<Object>} The API response data
   * @throws {Error} If the request fails after retries
   */
  async fetchFromSource(sourceName, params = {}) {
    const sourceConfig = this.mcpConfig.getDataSource(sourceName);
    
    if (!sourceConfig) {
      throw new Error(`Data source '${sourceName}' not found in configuration`);
    }

    // Handle rate limiting before making the request
    await this.handleRateLimit(sourceName);

    // Get global error handling config
    const config = this.mcpConfig.getConfig();
    const errorConfig = config.options?.errorHandling || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };

    // Create fetch function with retry logic
    const fetchFn = async () => {
      // Build URL with query parameters
      const url = this.buildUrl(sourceConfig, params);
      
      // Build request options
      const options = this.buildRequestOptions(sourceConfig);

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          // Handle specific HTTP errors
          if (response.status === 429) {
            throw new RateLimitError(`Rate limit exceeded for ${sourceName}`);
          } else if (response.status >= 500) {
            throw new ServerError(`Server error (${response.status}) for ${sourceName}`);
          } else if (response.status >= 400) {
            throw new ClientError(`Client error (${response.status}) for ${sourceName}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Record successful request timestamp
        this.recordRequestTimestamp(sourceName);
        
        return data;
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new NetworkError(`Network error while fetching from ${sourceName}: ${error.message}`);
        }
        throw error;
      }
    };

    // Execute with retry logic
    return await this.retryWithBackoff(
      fetchFn,
      errorConfig.maxRetries,
      errorConfig.retryDelay,
      errorConfig.backoffMultiplier
    );
  }

  /**
   * Fetches data from all configured data sources in parallel
   * @param {Object} params - Query parameters to apply to all sources
   * @returns {Promise<Object>} Object with source names as keys and response data as values
   */
  async fetchAllSources(params = {}) {
    const sourceNames = this.mcpConfig.getDataSourceNames();
    
    if (sourceNames.length === 0) {
      throw new Error('No data sources configured');
    }

    // Create fetch promises for all sources
    const fetchPromises = sourceNames.map(async (sourceName) => {
      try {
        const data = await this.fetchFromSource(sourceName, params);
        return { sourceName, data, error: null };
      } catch (error) {
        return { sourceName, data: null, error };
      }
    });

    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises);

    // Transform results into object format
    const resultObject = {};
    for (const result of results) {
      resultObject[result.sourceName] = {
        data: result.data,
        error: result.error
      };
    }

    return resultObject;
  }

  /**
   * Handles rate limiting for a data source
   * @param {string} sourceName - Name of the data source
   * @returns {Promise<void>} Resolves when the request can proceed
   * @private
   */
  async handleRateLimit(sourceName) {
    const sourceConfig = this.mcpConfig.getDataSource(sourceName);
    
    if (!sourceConfig.rateLimit) {
      return; // No rate limiting configured
    }

    const { requestsPerMinute, strategy } = sourceConfig.rateLimit;
    const windowMs = 60000; // 1 minute in milliseconds

    // Initialize tracking for this source if needed
    if (!this.requestTimestamps[sourceName]) {
      this.requestTimestamps[sourceName] = [];
    }

    // Clean up old timestamps outside the window
    const now = Date.now();
    this.requestTimestamps[sourceName] = this.requestTimestamps[sourceName].filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if we're at the rate limit
    if (this.requestTimestamps[sourceName].length >= requestsPerMinute) {
      if (strategy === 'throttle') {
        // Throttle: wait until the oldest request falls outside the window
        const oldestTimestamp = this.requestTimestamps[sourceName][0];
        const waitTime = windowMs - (now - oldestTimestamp);
        
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
        
        // Clean up again after waiting
        const newNow = Date.now();
        this.requestTimestamps[sourceName] = this.requestTimestamps[sourceName].filter(
          timestamp => newNow - timestamp < windowMs
        );
      } else if (strategy === 'queue') {
        // Queue: wait for a slot to become available
        const oldestTimestamp = this.requestTimestamps[sourceName][0];
        const waitTime = windowMs - (now - oldestTimestamp) + 100; // Add small buffer
        
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
        
        // Clean up again after waiting
        const newNow = Date.now();
        this.requestTimestamps[sourceName] = this.requestTimestamps[sourceName].filter(
          timestamp => newNow - timestamp < windowMs
        );
      }
    }
  }

  /**
   * Records a request timestamp for rate limiting
   * @param {string} sourceName - Name of the data source
   * @private
   */
  recordRequestTimestamp(sourceName) {
    if (!this.requestTimestamps[sourceName]) {
      this.requestTimestamps[sourceName] = [];
    }
    this.requestTimestamps[sourceName].push(Date.now());
  }

  /**
   * Retries a function with exponential backoff
   * @param {Function} fn - The async function to retry
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} initialDelay - Initial delay in milliseconds
   * @param {number} backoffMultiplier - Multiplier for exponential backoff
   * @returns {Promise<any>} The result of the function
   * @throws {Error} If all retries fail
   */
  async retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000, backoffMultiplier = 2) {
    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except rate limit
        if (error instanceof ClientError && !(error instanceof RateLimitError)) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        await this.sleep(delay);
        
        // Increase delay for next attempt (exponential backoff)
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Builds the complete URL with query parameters
   * @param {Object} sourceConfig - Data source configuration
   * @param {Object} params - Additional query parameters
   * @returns {string} The complete URL
   * @private
   */
  buildUrl(sourceConfig, params) {
    const url = new URL(sourceConfig.endpoint);
    
    // Merge default params with provided params
    const allParams = {
      ...sourceConfig.defaultParams,
      ...params
    };

    // Add query parameters
    for (const [key, value] of Object.entries(allParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    }

    // Handle authentication if it's a query parameter
    if (sourceConfig.authentication?.type === 'query_param') {
      const authKey = sourceConfig.authentication.key;
      let authValue = sourceConfig.authentication.value;
      
      // Replace environment variable placeholders
      if (authValue && authValue.startsWith('${') && authValue.endsWith('}')) {
        const envVar = authValue.slice(2, -1);
        authValue = this.getEnvVariable(envVar);
      }
      
      if (authValue) {
        url.searchParams.append(authKey, authValue);
      }
    }

    return url.toString();
  }

  /**
   * Builds request options including headers
   * @param {Object} sourceConfig - Data source configuration
   * @returns {Object} Fetch options object
   * @private
   */
  buildRequestOptions(sourceConfig) {
    const options = {
      method: sourceConfig.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Handle header-based authentication
    if (sourceConfig.authentication?.type === 'header') {
      const authKey = sourceConfig.authentication.key;
      let authValue = sourceConfig.authentication.value;
      
      // Replace environment variable placeholders
      if (authValue && authValue.startsWith('${') && authValue.endsWith('}')) {
        const envVar = authValue.slice(2, -1);
        authValue = this.getEnvVariable(envVar);
      }
      
      if (authValue) {
        options.headers[authKey] = authValue;
      }
    }

    return options;
  }

  /**
   * Gets an environment variable value
   * @param {string} name - Environment variable name
   * @returns {string|undefined} The environment variable value
   * @private
   */
  getEnvVariable(name) {
    // In browser environment, check window object or import.meta.env
    if (typeof window !== 'undefined' && window.ENV) {
      return window.ENV[name];
    }
    
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // Try with VITE_ prefix first (Vite convention)
      const viteKey = `VITE_${name}`;
      if (import.meta.env[viteKey]) {
        return import.meta.env[viteKey];
      }
      // Try without prefix
      return import.meta.env[name];
    }
    
    return undefined;
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Custom error classes for better error handling
export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServerError';
  }
}

export class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClientError';
  }
}

export class RateLimitError extends ClientError {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}
