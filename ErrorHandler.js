/**
 * ErrorHandler - Centralized error management for the dashboard
 * 
 * This class provides centralized error handling, categorization,
 * user-friendly message generation, and logging functionality.
 * 
 * @example
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const errorInfo = ErrorHandler.handle(error, 'data-fetch');
 *   console.log(errorInfo.type); // 'network'
 *   console.log(errorInfo.message); // User-friendly message
 *   displayError(errorInfo.message);
 * }
 * 
 * @example
 * // Check if an error is retryable
 * if (ErrorHandler.isRetryable(error)) {
 *   await retryOperation();
 * }
 */

// Import custom error classes from DataFetcherManager
import { NetworkError, ServerError, ClientError, RateLimitError } from './DataFetcherManager.js';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for configuration errors
 */
export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Custom error class for visualization errors
 */
export class VisualizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VisualizationError';
  }
}

/**
 * ErrorHandler class for centralized error management
 */
export class ErrorHandler {
  /**
   * Handles an error by categorizing, logging, and formatting it
   * @param {Error} error - The error to handle
   * @param {string} context - Context where the error occurred (e.g., 'data-fetch', 'visualization')
   * @returns {Object} Error information object with type, message, technical details, context, and timestamp
   */
  static handle(error, context = 'unknown') {
    const errorInfo = {
      type: this.categorizeError(error),
      message: this.getUserMessage(error),
      technical: error.message,
      context: context,
      timestamp: Date.now()
    };
    
    this.logError(errorInfo);
    
    return errorInfo;
  }

  /**
   * Categorizes an error into a specific type
   * @param {Error} error - The error to categorize
   * @returns {string} Error category ('network', 'server', 'client', 'rate-limit', 'validation', 'configuration', 'visualization', 'unknown')
   */
  static categorizeError(error) {
    if (error instanceof NetworkError) {
      return 'network';
    }
    if (error instanceof ServerError) {
      return 'server';
    }
    if (error instanceof RateLimitError) {
      return 'rate-limit';
    }
    if (error instanceof ClientError) {
      return 'client';
    }
    if (error instanceof ValidationError) {
      return 'validation';
    }
    if (error instanceof ConfigError) {
      return 'configuration';
    }
    if (error instanceof VisualizationError) {
      return 'visualization';
    }
    
    // Check error message patterns for additional categorization
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('config') || message.includes('configuration')) {
      return 'configuration';
    }
    if (message.includes('invalid') || message.includes('validation') || message.includes('missing')) {
      return 'validation';
    }
    if (message.includes('chart') || message.includes('visualization') || message.includes('canvas')) {
      return 'visualization';
    }
    
    return 'unknown';
  }

  /**
   * Generates a user-friendly error message
   * @param {Error} error - The error to generate a message for
   * @returns {string} User-friendly error message
   */
  static getUserMessage(error) {
    // Map error types to user-friendly messages
    const messageMap = {
      'NetworkError': 'Unable to connect to data source. Please check your internet connection.',
      'ServerError': 'The data service is temporarily unavailable. Please try again later.',
      'ClientError': 'There was a problem with the request. Please check your settings.',
      'RateLimitError': 'Rate limit exceeded. Please wait a moment before refreshing.',
      'ValidationError': 'Received invalid data from the API. Please try again later.',
      'ConfigError': 'Configuration error. Please check your .kiro file.',
      'VisualizationError': 'Unable to display the chart. Please refresh the page.'
    };
    
    // Try to get message by error constructor name
    const userMessage = messageMap[error.constructor.name];
    if (userMessage) {
      return userMessage;
    }
    
    // Fallback to message pattern matching
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'Unable to connect to data source. Please check your internet connection.';
    }
    if (message.includes('rate limit')) {
      return 'Rate limit exceeded. Please wait a moment before refreshing.';
    }
    if (message.includes('config')) {
      return 'Configuration error. Please check your .kiro file.';
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return 'Received invalid data. Please try again later.';
    }
    if (message.includes('chart') || message.includes('canvas')) {
      return 'Unable to display the chart. Please refresh the page.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    // Generic fallback message
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Logs error information to the console
   * @param {Object} errorInfo - Error information object
   * @private
   */
  static logError(errorInfo) {
    const logMessage = [
      `[${new Date(errorInfo.timestamp).toISOString()}]`,
      `[${errorInfo.type.toUpperCase()}]`,
      `[${errorInfo.context}]`,
      errorInfo.technical
    ].join(' ');
    
    console.error(logMessage);
    
    // Log full error info object for debugging
    console.error('Error details:', errorInfo);
  }

  /**
   * Formats an error for display in the UI
   * @param {Object} errorInfo - Error information object from handle()
   * @returns {string} Formatted HTML string for display
   */
  static formatForDisplay(errorInfo) {
    return `
      <div class="error-message">
        <strong>Error:</strong> ${this.escapeHtml(errorInfo.message)}
      </div>
    `;
  }

  /**
   * Escapes HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Checks if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} True if the error is retryable
   */
  static isRetryable(error) {
    // Network errors and server errors are retryable
    if (error instanceof NetworkError || error instanceof ServerError) {
      return true;
    }
    
    // Rate limit errors are retryable after waiting
    if (error instanceof RateLimitError) {
      return true;
    }
    
    // Client errors (except rate limit) are not retryable
    if (error instanceof ClientError) {
      return false;
    }
    
    // Configuration and validation errors are not retryable
    if (error instanceof ConfigError || error instanceof ValidationError) {
      return false;
    }
    
    // Check message patterns
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('network')) {
      return true;
    }
    
    // Default to not retryable
    return false;
  }

  /**
   * Creates a standardized error response object
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(type, message, details = {}) {
    return {
      success: false,
      error: {
        type,
        message,
        details,
        timestamp: Date.now()
      }
    };
  }
}

// Export error classes for use in other modules
export { NetworkError, ServerError, ClientError, RateLimitError };
