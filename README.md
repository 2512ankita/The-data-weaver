# Data Weaver Dashboard

A lightweight, client-side web application that integrates two unrelated public data sources through MCP (Model Context Protocol) connectors and visualizes them together to reveal interesting patterns and insights.

## 📋 Table of Contents

- [Overview](#overview)
- [Data Sources](#data-sources)
- [The .kiro Configuration File](#the-kiro-configuration-file)
- [Local Setup Instructions](#local-setup-instructions)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Browser Compatibility](#browser-compatibility)
- [Testing](#testing)
- [License](#license)

## Overview

The Data Weaver Dashboard explores an intriguing question: **Is there a relationship between environmental conditions and cryptocurrency market behavior?**

This application combines two seemingly unrelated datasets:
- **Air Quality Index (AQI)** from OpenWeatherMap - measuring environmental pollution levels
- **Bitcoin Price** from CoinGecko - tracking cryptocurrency market movements

By visualizing these datasets together on a unified timeline, the dashboard automatically generates insights about trends, spikes, and potential correlations. The entire application runs client-side in your browser with no backend required.

### Key Features

- **Dual-Source Visualization**: Interactive charts displaying both datasets with synchronized timelines
- **Automated Insights**: AI-powered analysis detecting trends, spikes, and correlations
- **Real-Time Data**: Fetch fresh data from public APIs with configurable time ranges
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **MCP Configuration**: Declarative data source management through the .kiro file

## Data Sources

### 1. OpenWeatherMap Air Quality API

**What it provides**: Historical air quality measurements including the Air Quality Index (AQI) for any geographic location.

**Why it's interesting**: Air quality reflects environmental conditions, industrial activity, weather patterns, and human behavior. The AQI scale ranges from 1 (Good) to 5 (Very Poor).

**Default Location**: New York City (40.7128°N, 74.0060°W)

**API Documentation**: https://openweathermap.org/api/air-pollution

**Authentication**: Requires a free API key (60 requests/minute limit)

### 2. CoinGecko Cryptocurrency API

**What it provides**: Historical Bitcoin price data in USD with minute-level granularity.

**Why it's interesting**: Bitcoin is the leading cryptocurrency and often serves as a market indicator. Its price is influenced by global economic conditions, investor sentiment, and various external factors.

**API Documentation**: https://www.coingecko.com/en/api

**Authentication**: No API key required (10 requests/minute limit)

### The Relationship

While these datasets appear unrelated, exploring them together can reveal interesting patterns:
- Do cryptocurrency prices spike during periods of poor air quality?
- Are there temporal correlations between environmental conditions and market behavior?
- Do both datasets show similar trend patterns during major global events?

The dashboard helps you explore these questions visually and through automated analysis.

## The .kiro Configuration File

The `.kiro` file is the heart of the Data Weaver Dashboard's MCP (Model Context Protocol) configuration. It defines how the application connects to, fetches from, and transforms data from external APIs.

### Purpose

The .kiro file serves as a **declarative configuration** that:
- Specifies which data sources to connect to
- Defines API endpoints, authentication, and rate limits
- Describes how to transform raw API responses into normalized time series data
- Configures error handling and retry strategies

### Structure

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
      // Similar structure for CoinGecko API
    }
  },
  
  "options": {
    "defaultTimeRange": 168,  // 7 days in hours
    "cache": { "enabled": true, "ttl": 300 },
    "errorHandling": { "maxRetries": 3, "retryDelay": 1000 }
  }
}
```

### Key Sections

**dataSources**: Defines each API connection with:
- `endpoint`: The API URL
- `authentication`: How to authenticate (query param, header, or none)
- `rateLimit`: Request throttling configuration
- `transformation`: Instructions for extracting timestamps and values from responses

**options**: Global settings for:
- Default time ranges
- Caching behavior
- Error handling and retry logic

### Why MCP?

The MCP approach provides:
- **Separation of Concerns**: API configuration is separate from application logic
- **Reusability**: The same .kiro file could be used by different applications
- **Maintainability**: Changing data sources doesn't require code changes
- **Documentation**: The configuration file serves as living documentation

## Local Setup Instructions

Follow these steps to run the Data Weaver Dashboard on your local machine:

### Prerequisites

- **Node.js** version 16 or higher
- **npm** (comes with Node.js)
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)

### Step 1: Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd data-weaver-dashboard

# Or download and extract the ZIP file, then navigate to the directory
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Vite (build tool)
- Chart.js (visualization)
- TailwindCSS (styling)
- Vitest & fast-check (testing)

### Step 3: Set Up API Keys

#### Get an OpenWeatherMap API Key

1. Visit https://openweathermap.org/api
2. Click "Sign Up" and create a free account
3. Navigate to "API keys" in your account dashboard
4. Copy your API key (it may take a few minutes to activate)

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and add your API key:
   ```
   VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

3. Save the file

**Note**: The CoinGecko API does not require an API key for basic usage.

### Step 4: Run the Development Server

```bash
npm run dev
```

This starts the Vite development server. You should see output like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 5: Open in Browser

Open your browser and navigate to `http://localhost:5173/`

The dashboard should load and automatically fetch data from both APIs.

### Step 6: Run Tests (Optional)

To verify everything is working correctly:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

### Basic Usage

1. **Initial Load**: When the dashboard loads, it automatically fetches the last 7 days of data from both sources
2. **View Visualization**: The main chart displays both datasets with dual y-axes (AQI on left, Bitcoin price on right)
3. **Read Insights**: Scroll down to see automated analysis of trends, spikes, and correlations
4. **Hover for Details**: Hover over chart points to see exact values and timestamps

### Controls

**Refresh Button**: Click to fetch the latest data from both APIs

**Time Range Dropdown**: Select different time periods:
- Last 24 hours
- Last 7 days (default)
- Last 30 days

**Interactive Chart**:
- Hover over data points for detailed tooltips
- Click legend items to show/hide datasets
- Zoom and pan (if enabled)

### Understanding the Insights

The Insight Engine analyzes the data and generates observations about:

- **Trends**: Whether each dataset is increasing, decreasing, or stable
- **Spikes**: Sudden significant changes in values
- **Correlation**: Statistical relationship between the two datasets
  - Positive correlation: Both tend to move in the same direction
  - Negative correlation: They tend to move in opposite directions
  - No correlation: No apparent relationship

### Example Insights

> "Over the past 7 days, Bitcoin price shows an increasing trend while air quality remains stable. A significant spike in Bitcoin price occurred on Dec 5th with a 15% increase. The correlation coefficient of 0.23 suggests a weak positive relationship between the datasets."

## Project Structure

```
data-weaver-dashboard/
├── public/                      # Static assets
│   └── index.html              # Main HTML file with app structure
│
├── src/                        # Source code
│   ├── main.js                 # Application entry point
│   ├── MCPConfigParser.js      # Parses .kiro configuration
│   ├── DataFetcherManager.js   # Handles API requests and rate limiting
│   ├── DataNormalizer.js       # Transforms API responses to time series
│   ├── VisualizationEngine.js  # Chart.js integration and rendering
│   ├── InsightEngine.js        # Analyzes data and generates insights
│   ├── UIController.js         # Manages UI interactions and updates
│   ├── ErrorHandler.js         # Centralized error management
│   └── styles.css              # Global styles and Tailwind imports
│
├── tests/                      # Test files
│   ├── MCPConfigParser.test.js
│   └── VisualizationEngine.test.js
│
├── .kiro                       # MCP configuration file
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies and scripts
├── tailwind.config.js          # TailwindCSS configuration
├── vite.config.js              # Vite build configuration
└── README.md                   # This file
```

## Technology Stack

### Frontend

- **JavaScript (ES6+)**: Modern JavaScript with modules, async/await, and classes
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid

### Libraries & Frameworks

- **Chart.js v4.x**: Interactive data visualization
- **TailwindCSS v3.x**: Utility-first CSS framework for responsive design
- **Vite v5.x**: Fast build tool and development server

### Testing

- **Vitest**: Fast unit testing framework (Vite-native)
- **fast-check**: Property-based testing library for JavaScript
- **@vitest/ui**: Interactive test UI

### Development Tools

- **ESLint**: Code linting (optional)
- **Prettier**: Code formatting (optional)

## Browser Compatibility

The Data Weaver Dashboard is compatible with modern browsers that support ES6+ features:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 90+            | Recommended for best performance |
| Firefox | 88+            | Full support |
| Safari  | 14+            | Full support |
| Edge    | 90+            | Full support |

### Required Features

- ES6 Modules
- Async/Await
- Fetch API
- CSS Grid and Flexbox
- Canvas API (for Chart.js)

### Unsupported Browsers

- Internet Explorer (all versions)
- Older mobile browsers (pre-2020)

If you're using an unsupported browser, you'll see a message suggesting you upgrade.

## Testing

The project includes comprehensive test coverage using two complementary approaches:

### Unit Tests

Test specific functionality with concrete examples:

```bash
npm test
```

Unit tests cover:
- Configuration parsing
- Data transformation
- Error handling
- Chart initialization

### Property-Based Tests

Test universal properties across many randomly generated inputs:

```bash
npm run test:pbt
```

Property-based tests verify:
- Data normalization consistency
- Rate limit compliance
- Error resilience
- UI structure completeness

### Test Coverage

View test coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Troubleshooting

### API Key Issues

**Problem**: "Authentication failed" or "Invalid API key"

**Solution**: 
- Verify your API key is correct in `.env`
- Ensure the file is named exactly `.env` (not `.env.txt`)
- Restart the development server after changing `.env`
- Check that your API key is activated (may take 10-15 minutes after creation)

### CORS Errors

**Problem**: "CORS policy" errors in browser console

**Solution**: 
- This usually means the API is blocking browser requests
- Try using a different network (some corporate networks block API requests)
- For development, you can use a CORS proxy (not recommended for production)

### Rate Limit Errors

**Problem**: "Rate limit exceeded" messages

**Solution**: 
- Wait a few minutes before refreshing
- The dashboard automatically handles rate limits, but manual rapid refreshes can exceed limits
- Consider upgrading to a paid API tier for higher limits

### No Data Displayed

**Problem**: Chart shows but no data appears

**Solution**: 
- Check browser console for error messages
- Verify your internet connection
- Ensure API keys are configured correctly
- Try a different time range

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

---

**Built with ❤️ using MCP, Chart.js, and TailwindCSS**
