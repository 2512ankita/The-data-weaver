/**
 * MCPConfigParser - Parses and validates MCP configuration files
 * 
 * This class is responsible for loading the .kiro configuration file,
 * validating its structure, and providing access to data source configurations.
 * 
 * @example
 * const parser = new MCPConfigParser('/.kiro');
 * await parser.loadConfig();
 * const airQualityConfig = parser.getDataSource('airQuality');
 * console.log(airQualityConfig.endpoint);
 */
export class MCPConfigParser {
  /**
   * Creates a new MCPConfigParser instance
   * @param {string} configPath - Path to the .kiro configuration file
   */
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
  }

  /**
   * Loads and parses the MCP configuration file
   * @returns {Promise<Object>} The parsed configuration object
   * @throws {Error} If the file cannot be loaded or parsed
   */
  async loadConfig() {
    try {
      const response = await fetch(this.configPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load config file: ${response.status} ${response.statusText}`);
      }
      
      const configText = await response.text();
      
      // Remove comments from JSON (since .kiro file contains comments)
      const cleanedConfig = this.removeComments(configText);
      
      // Parse the JSON
      this.config = JSON.parse(cleanedConfig);
      
      // Validate the configuration
      this.validateConfig();
      
      return this.config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Removes comments from JSON text
   * @param {string} text - JSON text with comments
   * @returns {string} JSON text without comments
   * @private
   */
  removeComments(text) {
    // Remove single-line comments (// ...)
    let cleaned = text.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments (/* ... */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return cleaned;
  }

  /**
   * Gets a specific data source configuration by name
   * @param {string} sourceName - Name of the data source (e.g., 'airQuality', 'cryptocurrency')
   * @returns {Object|null} The data source configuration or null if not found
   */
  getDataSource(sourceName) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    
    if (!this.config.dataSources || !this.config.dataSources[sourceName]) {
      return null;
    }
    
    return this.config.dataSources[sourceName];
  }

  /**
   * Validates the loaded configuration structure
   * @throws {Error} If the configuration is invalid
   */
  validateConfig() {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    // Check for required top-level fields
    if (!this.config.mcpVersion) {
      throw new Error('Missing required field: mcpVersion');
    }

    if (!this.config.projectName) {
      throw new Error('Missing required field: projectName');
    }

    if (!this.config.dataSources) {
      throw new Error('Missing required field: dataSources');
    }

    // Validate that we have at least one data source
    const sourceNames = Object.keys(this.config.dataSources);
    if (sourceNames.length === 0) {
      throw new Error('Configuration must contain at least one data source');
    }

    // Validate each data source
    for (const sourceName of sourceNames) {
      this.validateDataSource(sourceName, this.config.dataSources[sourceName]);
    }
  }

  /**
   * Validates a single data source configuration
   * @param {string} sourceName - Name of the data source
   * @param {Object} source - Data source configuration object
   * @throws {Error} If the data source configuration is invalid
   * @private
   */
  validateDataSource(sourceName, source) {
    const requiredFields = ['name', 'endpoint', 'method', 'transformation'];
    
    for (const field of requiredFields) {
      if (!source[field]) {
        throw new Error(`Data source '${sourceName}' missing required field: ${field}`);
      }
    }

    // Validate method is a valid HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(source.method.toUpperCase())) {
      throw new Error(`Data source '${sourceName}' has invalid method: ${source.method}`);
    }

    // Validate transformation object
    if (!source.transformation.timestampField) {
      throw new Error(`Data source '${sourceName}' transformation missing required field: timestampField`);
    }

    if (!source.transformation.valueField) {
      throw new Error(`Data source '${sourceName}' transformation missing required field: valueField`);
    }

    // Validate authentication if present
    if (source.authentication) {
      if (!source.authentication.type) {
        throw new Error(`Data source '${sourceName}' authentication missing required field: type`);
      }
    }

    // Validate rate limit if present
    if (source.rateLimit) {
      if (!source.rateLimit.requestsPerMinute) {
        throw new Error(`Data source '${sourceName}' rateLimit missing required field: requestsPerMinute`);
      }
      
      if (!source.rateLimit.strategy) {
        throw new Error(`Data source '${sourceName}' rateLimit missing required field: strategy`);
      }

      const validStrategies = ['throttle', 'queue'];
      if (!validStrategies.includes(source.rateLimit.strategy)) {
        throw new Error(`Data source '${sourceName}' rateLimit has invalid strategy: ${source.rateLimit.strategy}`);
      }
    }
  }

  /**
   * Gets all data source names
   * @returns {string[]} Array of data source names
   */
  getDataSourceNames() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    
    return Object.keys(this.config.dataSources || {});
  }

  /**
   * Gets the entire configuration object
   * @returns {Object|null} The configuration object or null if not loaded
   */
  getConfig() {
    return this.config;
  }
}
