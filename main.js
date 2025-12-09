/**
 * Main Application Entry Point
 * 
 * This file initializes all components and starts the Data Weaver Dashboard application.
 * It handles the application startup sequence, error handling, and component coordination.
 * 
 * Requirements: 1.1, 4.1, 5.6
 */

import { UIController } from './UIController.js';
import { ErrorHandler } from './ErrorHandler.js';

/**
 * Application class that manages the dashboard lifecycle
 * 
 * @example
 * const dashboard = new DataWeaverDashboard();
 * await dashboard.initialize();
 */
class DataWeaverDashboard {
  /**
   * Creates a new DataWeaverDashboard instance
   */
  constructor() {
    this.uiController = null;
    this.isInitialized = false;
  }

  /**
   * Initializes the application
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Data Weaver Dashboard - Initializing...');

      // Create UI controller with configuration
      // Add cache-busting parameter to force reload
      this.uiController = new UIController({
        configPath: `/config.json?v=${Date.now()}`,
        canvasId: 'chart-canvas'
      });

      // Set up custom DOM element mapping to match HTML structure
      this.setupDOMMapping();

      // Initialize the UI controller (loads config, fetches data, renders UI)
      await this.uiController.initialize();

      this.isInitialized = true;
      console.log('Data Weaver Dashboard - Initialization complete');

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      
      // Handle initialization errors
      const errorInfo = ErrorHandler.handle(error, 'application-startup');
      this.displayInitializationError(errorInfo);
      
      throw error;
    }
  }

  /**
   * Sets up custom DOM element mapping to match the HTML structure
   * This overrides the default element IDs expected by UIController
   * @private
   */
  setupDOMMapping() {
    // Map HTML element IDs to what UIController expects
    const elementMapping = {
      'refresh-btn': 'refresh-button',
      'time-range': 'time-range-select',
      'air-quality-card': 'data-card-1',
      'crypto-card': 'data-card-2',
      'insight-content': 'insight-section',
      'loading-spinner': 'loading-indicator',
      'error-message': 'error-container'
    };

    // Create aliases for elements that don't match expected IDs
    for (const [actualId, expectedId] of Object.entries(elementMapping)) {
      const element = document.getElementById(actualId);
      if (element && !document.getElementById(expectedId)) {
        // Clone the element with the expected ID
        element.id = expectedId;
      }
    }
  }

  /**
   * Displays an initialization error to the user
   * @param {Object} errorInfo - Error information from ErrorHandler
   * @private
   */
  displayInitializationError(errorInfo) {
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorContainer && errorText) {
      errorText.textContent = errorInfo.message;
      errorContainer.classList.remove('hidden');
      
      // Set up close button
      const closeButton = document.getElementById('error-close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          errorContainer.classList.add('hidden');
        });
      }
    } else {
      // Fallback: display error in console and alert
      console.error('Error container not found. Error:', errorInfo.message);
      alert(`Failed to initialize dashboard: ${errorInfo.message}`);
    }
  }

  /**
   * Cleans up resources and destroys the application
   */
  destroy() {
    if (this.uiController) {
      this.uiController.destroy();
      this.uiController = null;
    }
    this.isInitialized = false;
    console.log('Data Weaver Dashboard - Destroyed');
  }
}

/**
 * Application startup
 * Waits for DOM to be ready, then initializes the dashboard
 */
async function startApplication() {
  try {
    // Create dashboard instance
    const dashboard = new DataWeaverDashboard();
    
    // Initialize the dashboard
    await dashboard.initialize();
    
    // Make dashboard instance available globally for debugging
    window.dashboard = dashboard;
    
  } catch (error) {
    console.error('Application startup failed:', error);
    // Error is already displayed by the dashboard initialization
  }
}

// Wait for DOM to be fully loaded before starting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  // DOM is already loaded
  startApplication();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.dashboard) {
    window.dashboard.destroy();
  }
});
