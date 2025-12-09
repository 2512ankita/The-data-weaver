# Design Document

## Overview

The Data Weaver Dashboard is a client-side web application that combines two unrelated public data sources into a unified visualization platform. The system uses MCP (Model Context Protocol) configuration to manage API connections, fetches data entirely in the browser, and generates automated insights about patterns and correlations.

The application will connect to:
- **Source A**: OpenWeatherMap Air Quality API (environmental data)
- **Source B**: CoinGecko Cryptocurrency API (financial data)

These sources provide time-series data that can be normalized and compared to reveal interesting patterns between environmental conditions and cryptocurrency market behavior.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Environment                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Dashboard Application                 │    │
│  │                                                 │    │
│  │  ┌──────────────┐      ┌──────────────┐       │    │
│  │  │ MCP Config   │      │  UI Layer    │       │    │
│  │  │   Parser     │──────│  (HTML/CSS)  │       │    │
│  │  └──────────────┘      └──────────────┘       │    │
│  │         │                      │               │    │
│  │         ▼                      ▼               │    │
│  │  ┌──────────────┐      ┌──────────────┐       │    │
│  │  │ Data Fetcher │      │ Visualization│       │    │
│  │  │   Manager    │──────│   Engine     │       │    │
│  │  └──────────────┘      └──────────────┘       │    │
│  │         │                      │               │    │
│  │         ▼                      ▼               │    │
│  │  ┌──────────────┐      ┌──────────────┐       │    │
│  │  │ Data         │      │   Insight    │       │    │
│  │  │ Normalizer   │──────│   Engine     │       │    │
│  │  └──────────────┘      └──────────────┘       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│         │                              │                │
│         ▼                              ▼                │
│  ┌─────────────┐              ┌─────────────┐          │
│  │ OpenWeather │              │  CoinGecko  │          │
│  │  Air Quality│              │   Crypto    │          │
│  │     API     │              │     API     │          │
│  └─────────────┘              └─────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. Application loads and parses .kiro configuration file
2. MCP Config Parser extracts data source definitions
3. Data Fetcher Manager initiates parallel API requests
4. Data Normalizer transforms responses into unified time series
5. Visualization Engine renders chart with both datasets
6. Insight Engine analyzes data and generates observations
7. UI Layer displays all components to user

## Components and Interfaces

### 1. MCP Configuration Parser

**Purpose**: Read and validate .kiro file containing MCP connector definitions

**Interface**:
```javascript
class MCPConfigParser {
  constructor(configPath)
  async loadConfig()
  getDataSource(sourceName)
  validateConfig()
}
```

**Responsibilities**:
- Parse .kiro JSON configuration
- Validate required fields (endpoints, methods, transformations)
- Provide accessor methods for data source configurations
- Handle configuration errors gracefully

### 2. Data Fetcher Manager

**Purpose**: Execute API requests based on MCP configuration

**Interface**:
```javascript
class DataFetcherManager {
  constructor(mcpConfig)
  async fetchFromSource(sourceName, params)
  async fetchAllSources()
  handleRateLimit(source)
  retryWithBackoff(fetchFn, maxRetries)
}
```

**Responsibilities**:
- Execute HTTP requests to configured endpoints
- Apply authentication headers if specified
- Implement rate limiting and retry logic
- Handle network errors and timeouts
- Return raw API responses

### 3. Data Normalizer

**Purpose**: Transform heterogeneous API responses into unified time series format

**Interface**:
```javascript
class DataNormalizer {
  normalizeAirQuality(rawData)
  normalizeCrypto(rawData)
  createTimeSeries(data, valueKey, timestampKey)
  alignTimeSeriesByTimestamp(series1, series2)
}
```

**Responsibilities**:
- Extract relevant fields from API responses
- Convert timestamps to consistent format
- Scale values to comparable ranges
- Align data points by timestamp
- Handle missing or incomplete data

### 4. Visualization Engine

**Purpose**: Render interactive charts using Chart.js

**Interface**:
```javascript
class VisualizationEngine {
  constructor(canvasElement)
  renderDualSourceChart(series1, series2, options)
  updateChart(newData)
  configureTooltips()
  configureLegends()
  applyTransitions()
}
```

**Responsibilities**:
- Initialize Chart.js instance
- Configure chart type (line chart for time series)
- Set up dual y-axes for different value scales
- Enable interactive tooltips and legends
- Apply smooth animations on data updates
- Handle responsive resizing

### 5. Insight Engine

**Purpose**: Analyze data and generate descriptive observations

**Interface**:
```javascript
class InsightEngine {
  analyzeData(series1, series2)
  detectTrends(series)
  detectSpikes(series, threshold)
  calculateCorrelation(series1, series2)
  generateInsightText(analysis)
}
```

**Responsibilities**:
- Calculate statistical measures (mean, variance, trends)
- Identify significant spikes or drops
- Compute correlation coefficient between series
- Generate human-readable insight paragraphs
- Format insights for display

### 6. UI Controller

**Purpose**: Manage user interactions and coordinate components

**Interface**:
```javascript
class UIController {
  constructor()
  initialize()
  handleRefresh()
  handleTimeRangeChange(range)
  updateDataCards(data)
  updateInsightSection(insights)
  showLoading()
  hideLoading()
  showError(message)
}
```

**Responsibilities**:
- Initialize all components on page load
- Handle user interactions (refresh, dropdowns)
- Update UI elements with new data
- Manage loading states
- Display error messages
- Coordinate data flow between components

## Data Models

### MCP Configuration Schema

```json
{
  "mcpVersion": "1.0",
  "projectName": "data-weaver-dashboard",
  "dataSources": {
    "airQuality": {
      "name": "OpenWeather Air Quality",
      "endpoint": "http://api.openweathermap.org/data/2.5/air_pollution/history",
      "method": "GET",
      "authentication": {
        "type": "query_param",
        "key": "appid",
        "value": "${OPENWEATHER_API_KEY}"
      },
      "rateLimit": {
        "requestsPerMinute": 60,
        "strategy": "throttle"
      },
      "transformation": {
        "timestampField": "dt",
        "valueField": "list[].main.aqi",
        "normalize": true
      }
    },
    "cryptocurrency": {
      "name": "CoinGecko Bitcoin Price",
      "endpoint": "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range",
      "method": "GET",
      "authentication": {
        "type": "none"
      },
      "rateLimit": {
        "requestsPerMinute": 10,
        "strategy": "queue"
      },
      "transformation": {
        "timestampField": "prices[][0]",
        "valueField": "prices[][1]",
        "normalize": true
      }
    }
  }
}
```

### Normalized Time Series Model

```javascript
{
  sourceName: string,
  dataPoints: [
    {
      timestamp: number,      // Unix timestamp
      value: number,          // Normalized value
      originalValue: number,  // Original API value
      label: string          // Human-readable timestamp
    }
  ],
  metadata: {
    unit: string,
    min: number,
    max: number,
    mean: number
  }
}
```

### Insight Analysis Model

```javascript
{
  trends: {
    source1: "increasing" | "decreasing" | "stable",
    source2: "increasing" | "decreasing" | "stable"
  },
  spikes: [
    {
      source: string,
      timestamp: number,
      value: number,
      percentChange: number
    }
  ],
  correlation: {
    coefficient: number,
    strength: "strong" | "moderate" | "weak" | "none",
    direction: "positive" | "negative" | "none"
  },
  summary: string  // Generated insight paragraph
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dual-source data fetching

*For any* valid MCP configuration with two data sources, when the dashboard loads or refresh is triggered, the system should initiate fetch requests to both configured endpoints.

**Validates: Requirements 1.1, 4.1**

### Property 2: Data normalization consistency

*For any* pair of API responses from configured data sources, the normalization process should produce time series objects with consistent structure containing timestamps, values, and metadata fields.

**Validates: Requirements 1.2**

### Property 3: Unified chart rendering

*For any* pair of normalized time series datasets, the visualization engine should render a chart element that includes visual representations of both data sources.

**Validates: Requirements 2.1**

### Property 4: Comprehensive insight generation

*For any* pair of time series datasets, the insight engine should:
- Classify trends for both series (increasing/decreasing/stable)
- Detect spikes exceeding threshold values
- Calculate correlation coefficient and classify relationship strength
- Generate a non-empty descriptive summary text

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: MCP configuration validation

*For any* .kiro configuration file, the parser should verify that:
- Exactly two data source definitions exist
- Each source specifies endpoint, method, and transformation instructions
- Authentication configuration is present when required
- Rate limit strategies are defined when applicable

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 6: Error resilience

*For any* error condition (network failure, invalid response, timeout, malformed data), the system should display an appropriate error message and maintain application stability without crashing.

**Validates: Requirements 1.4**

### Property 7: Rate limit compliance

*For any* MCP configuration with defined rate limits, the data fetcher should respect the specified requestsPerMinute constraint by throttling or queuing requests appropriately.

**Validates: Requirements 1.5**

### Property 8: UI structure completeness

*For any* successfully loaded dashboard state, the DOM should contain all required sections: title, two data summary cards, visualization panel, and insight section.

**Validates: Requirements 1.3, 6.2**

### Property 9: Parameter-driven updates

*For any* change to visualization parameters (time range, data source selection), the system should regenerate both the chart and insights to reflect the new parameters.

**Validates: Requirements 4.3**

### Property 10: State preservation on refresh

*For any* UI state before data refresh, non-data-dependent UI elements (selected parameters, expanded sections) should maintain their state after new data loads.

**Validates: Requirements 4.5**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - Server unavailability
   - Strategy: Display user-friendly message, provide retry option, log technical details to console

2. **API Errors**
   - 4xx client errors (invalid parameters, authentication failures)
   - 5xx server errors
   - Rate limit exceeded (429)
   - Strategy: Parse error response, display specific message, implement exponential backoff for retries

3. **Data Validation Errors**
   - Missing required fields in API response
   - Invalid data types
   - Malformed JSON
   - Strategy: Log validation errors, use fallback values where safe, display data unavailable message

4. **Configuration Errors**
   - Missing .kiro file
   - Invalid JSON in .kiro file
   - Missing required configuration fields
   - Strategy: Fail fast with clear error message, provide configuration template example

5. **Visualization Errors**
   - Chart.js initialization failures
   - Invalid data format for charting
   - Canvas rendering errors
   - Strategy: Display fallback data table, log error details, provide manual refresh option

### Error Handling Patterns

```javascript
// Centralized error handler
class ErrorHandler {
  static handle(error, context) {
    const errorInfo = {
      type: this.categorizeError(error),
      message: this.getUserMessage(error),
      technical: error.message,
      context: context,
      timestamp: Date.now()
    };
    
    this.logError(errorInfo);
    this.displayError(errorInfo);
    this.reportMetrics(errorInfo);
    
    return errorInfo;
  }
  
  static categorizeError(error) {
    if (error instanceof NetworkError) return 'network';
    if (error instanceof ValidationError) return 'validation';
    if (error instanceof ConfigError) return 'configuration';
    return 'unknown';
  }
  
  static getUserMessage(error) {
    // Map technical errors to user-friendly messages
    const messageMap = {
      'NetworkError': 'Unable to connect to data source. Please check your internet connection.',
      'ValidationError': 'Received invalid data from API. Please try again later.',
      'ConfigError': 'Configuration error. Please check your .kiro file.',
      'RateLimitError': 'Rate limit exceeded. Please wait before refreshing.'
    };
    
    return messageMap[error.constructor.name] || 'An unexpected error occurred.';
  }
}
```

### Retry Strategy

- Network errors: 3 retries with exponential backoff (1s, 2s, 4s)
- Rate limit errors: Wait for rate limit window to reset
- Server errors (5xx): 2 retries with 5s delay
- Client errors (4xx): No retry, display error immediately

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests. Unit tests will cover:

1. **MCP Configuration Parser**
   - Valid configuration parsing
   - Invalid JSON handling
   - Missing required fields
   - Edge case: empty configuration

2. **Data Normalizer**
   - Timestamp conversion accuracy
   - Value extraction from nested objects
   - Handling missing data points
   - Edge case: empty API responses

3. **Insight Engine**
   - Trend classification logic
   - Spike detection with various thresholds
   - Correlation calculation accuracy
   - Edge case: identical datasets, inverse datasets

4. **Error Handler**
   - Correct error categorization
   - User message generation
   - Logging functionality

### Property-Based Testing

The application will use **fast-check** (JavaScript property-based testing library) for property tests. Each property-based test will:
- Run a minimum of 100 iterations
- Use smart generators that produce realistic test data
- Be tagged with explicit references to design document properties

**Property Test Requirements:**

1. Each property-based test MUST include a comment tag in this format:
   ```javascript
   // **Feature: data-weaver-dashboard, Property 1: Dual-source data fetching**
   ```

2. Each correctness property MUST be implemented by a SINGLE property-based test

3. Property tests will use custom generators:
   - `arbitraryMCPConfig()`: Generates valid MCP configurations
   - `arbitraryAPIResponse()`: Generates realistic API response structures
   - `arbitraryTimeSeries()`: Generates time series data with various patterns
   - `arbitraryErrorCondition()`: Generates different error scenarios

**Example Property Test Structure:**

```javascript
import fc from 'fast-check';

// **Feature: data-weaver-dashboard, Property 2: Data normalization consistency**
test('normalized data has consistent structure', () => {
  fc.assert(
    fc.property(
      arbitraryAPIResponse(),
      arbitraryAPIResponse(),
      (response1, response2) => {
        const normalized1 = normalizer.normalize(response1);
        const normalized2 = normalizer.normalize(response2);
        
        // Both should have required structure
        expect(normalized1).toHaveProperty('dataPoints');
        expect(normalized1).toHaveProperty('metadata');
        expect(normalized2).toHaveProperty('dataPoints');
        expect(normalized2).toHaveProperty('metadata');
        
        // Data points should have consistent fields
        normalized1.dataPoints.forEach(point => {
          expect(point).toHaveProperty('timestamp');
          expect(point).toHaveProperty('value');
          expect(typeof point.timestamp).toBe('number');
          expect(typeof point.value).toBe('number');
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify:
- End-to-end data flow from API fetch to visualization
- Component interaction (fetcher → normalizer → visualizer)
- UI updates in response to data changes
- Error propagation through component layers

### Manual Testing Checklist

- Visual verification of chart rendering across different screen sizes
- Tooltip and legend interaction
- Refresh button functionality
- Error message display
- Loading state transitions
- Browser compatibility (Chrome, Firefox, Safari, Edge)

## Implementation Notes

### Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6+) with modular architecture
- **CSS Framework**: TailwindCSS for responsive design
- **Charting Library**: Chart.js v4.x for data visualization
- **Testing**: Vitest for unit tests, fast-check for property-based tests
- **Build Tool**: Vite for development and bundling
- **Module System**: ES modules for clean dependency management

### Browser Compatibility

- Target: Modern browsers with ES6+ support
- Minimum versions: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Polyfills: None required for target browsers
- Fallbacks: Display message for unsupported browsers

### Performance Considerations

1. **Data Fetching**
   - Implement request caching with 5-minute TTL
   - Use AbortController for cancellable requests
   - Parallel fetch for both data sources

2. **Visualization**
   - Limit data points to 100 per series for smooth rendering
   - Use Chart.js decimation plugin for large datasets
   - Debounce window resize events (250ms)

3. **Memory Management**
   - Destroy and recreate chart on data updates to prevent memory leaks
   - Clear cached data after 10 minutes of inactivity
   - Limit stored historical data to last 24 hours

### Security Considerations

1. **API Keys**
   - Store in environment variables, never commit to repository
   - Use .env file for local development
   - Provide .env.example template

2. **Data Validation**
   - Sanitize all API responses before processing
   - Validate data types and ranges
   - Escape user-facing strings to prevent XSS

3. **CORS**
   - Use public APIs that support CORS
   - Document any proxy requirements
   - Handle CORS errors gracefully

### Deployment

- Static hosting (GitHub Pages, Netlify, Vercel)
- No server-side components required
- Environment variables injected at build time
- Single HTML file with bundled JavaScript and CSS

## Future Enhancements

1. **Additional Data Sources**
   - Support for 3+ simultaneous data sources
   - User-configurable data source selection
   - Data source marketplace/registry

2. **Advanced Analytics**
   - Machine learning-based pattern recognition
   - Predictive modeling
   - Anomaly detection algorithms

3. **Customization**
   - User-defined color schemes
   - Custom chart types (scatter, bar, area)
   - Exportable visualizations (PNG, SVG, PDF)

4. **Collaboration**
   - Shareable dashboard configurations
   - Embedded dashboard widgets
   - Real-time collaborative viewing

5. **Data Management**
   - Historical data storage
   - Data export (CSV, JSON)
   - Custom data transformations
