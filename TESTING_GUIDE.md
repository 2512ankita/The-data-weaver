# Manual Testing Guide - Data Weaver Dashboard

## Overview
This guide provides comprehensive manual testing procedures for the Data Weaver Dashboard across different browsers and devices.

## Browser Testing Checklist

### Chrome Testing
- [ ] **Initial Load**
  - Dashboard loads without errors
  - All UI elements render correctly
  - Loading spinner appears and disappears appropriately
  - Data cards populate with values
  - Chart renders with both data sources
  - Insights section displays analysis

- [ ] **Responsive Layout**
  - Desktop (1920x1080): All elements properly spaced
  - Laptop (1366x768): Layout adapts correctly
  - Tablet (768x1024): Cards stack vertically, chart remains readable
  - Mobile (375x667): Single column layout, all controls accessible

- [ ] **User Interactions**
  - Refresh button: Triggers data reload, shows loading state
  - Time range dropdown: Changes data range (24h, 7d, 30d)
  - Chart tooltips: Display on hover with correct values
  - Chart legend: Toggles dataset visibility on click
  - Error close button: Dismisses error messages

- [ ] **Error Handling**
  - Network error: Displays user-friendly message
  - Invalid API response: Shows appropriate error
  - Rate limit exceeded: Displays rate limit message
  - Configuration error: Shows configuration error message

### Firefox Testing
- [ ] **Initial Load**
  - Dashboard loads without errors
  - CSS styling renders correctly (Tailwind)
  - Chart.js renders properly
  - All fonts and icons display

- [ ] **Responsive Layout**
  - Test same breakpoints as Chrome
  - Verify flexbox/grid layouts work correctly
  - Check for any Firefox-specific rendering issues

- [ ] **User Interactions**
  - All interactive elements work
  - Hover states display correctly
  - Click events fire properly
  - Dropdown menus function

- [ ] **Performance**
  - Page load time acceptable
  - Chart animations smooth
  - No lag during interactions

### Safari Testing (if available)
- [ ] **Initial Load**
  - Dashboard loads without errors
  - ES6 modules load correctly
  - Fetch API works properly
  - Chart renders correctly

- [ ] **Responsive Layout**
  - iOS Safari (iPhone): Touch interactions work
  - iOS Safari (iPad): Tablet layout displays
  - macOS Safari: Desktop layout correct

- [ ] **User Interactions**
  - Touch events work on mobile
  - Pinch-to-zoom disabled on chart
  - Dropdown menus accessible
  - Buttons have proper touch targets

### Edge Testing
- [ ] **Initial Load**
  - Dashboard loads without errors
  - All modern features work
  - Chart.js compatibility verified

- [ ] **Responsive Layout**
  - Same breakpoint testing as Chrome
  - Verify Chromium-based rendering

- [ ] **User Interactions**
  - All controls functional
  - No Edge-specific issues

## Detailed Test Scenarios

### Scenario 1: First-Time User Experience
1. Open dashboard in browser
2. Verify loading spinner appears
3. Wait for data to load
4. Confirm all sections populate:
   - Air Quality card shows metrics
   - Bitcoin Price card shows metrics
   - Chart displays both datasets
   - Insights section shows analysis
5. Check that no errors appear in console

### Scenario 2: Data Refresh
1. Click "Refresh Data" button
2. Verify loading spinner appears
3. Confirm button is disabled during load
4. Wait for refresh to complete
5. Verify all data updates:
   - Card values may change
   - Chart updates with animation
   - Insights regenerate
6. Confirm button re-enables

### Scenario 3: Time Range Changes
1. Select "Last 24 Hours" from dropdown
2. Wait for data to load
3. Note the data range in chart
4. Select "Last 7 Days"
5. Verify chart shows more data points
6. Select "Last 30 Days"
7. Verify chart shows extended range
8. Confirm insights update for each range

### Scenario 4: Chart Interactions
1. Hover over chart data points
2. Verify tooltip appears with:
   - Timestamp
   - Both data source values
   - Correct units
3. Click legend items to toggle datasets
4. Verify datasets hide/show correctly
5. Verify chart rescales appropriately

### Scenario 5: Error Handling
1. Disconnect network (or use DevTools offline mode)
2. Click refresh button
3. Verify error message displays
4. Verify error is user-friendly
5. Click error close button
6. Verify error dismisses
7. Reconnect network
8. Verify refresh works again

### Scenario 6: Responsive Behavior
1. Start at desktop size (1920x1080)
2. Slowly resize browser window
3. Verify layout adapts at breakpoints:
   - 1024px: Tablet layout
   - 768px: Mobile layout
4. Verify no horizontal scrolling
5. Verify all content remains accessible
6. Verify chart remains readable at all sizes

## Performance Testing Checklist

### Load Time Testing
- [ ] Measure initial page load time
- [ ] Verify loads in under 3 seconds on good connection
- [ ] Check bundle size is reasonable
- [ ] Verify lazy loading of Chart.js

### Runtime Performance
- [ ] Monitor memory usage during operation
- [ ] Verify no memory leaks after multiple refreshes
- [ ] Check CPU usage during chart animations
- [ ] Verify smooth scrolling

### Data Handling
- [ ] Test with maximum data points (100 per series)
- [ ] Verify chart remains responsive
- [ ] Check for any lag during updates
- [ ] Verify data caching works

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Test Enter/Space on buttons
- [ ] Test arrow keys on dropdown

### Screen Reader Testing (if available)
- [ ] Verify semantic HTML structure
- [ ] Check ARIA labels present
- [ ] Test with NVDA/JAWS/VoiceOver
- [ ] Verify chart has text alternative

### Color Contrast
- [ ] Verify text meets WCAG AA standards
- [ ] Check chart colors distinguishable
- [ ] Test with color blindness simulator

## Known Issues to Watch For

### Potential Issues
1. **CORS Errors**: If APIs don't support CORS, requests will fail
2. **API Rate Limits**: Frequent refreshes may hit rate limits
3. **Missing API Keys**: Environment variables not set
4. **Chart Memory Leaks**: Old charts not properly destroyed
5. **Mobile Touch Events**: May not work on all devices

### Browser-Specific Issues
- **Safari**: May have issues with ES6 modules
- **Firefox**: Flexbox rendering may differ slightly
- **Edge**: Should work like Chrome (Chromium-based)
- **Mobile Browsers**: Touch targets may be too small

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________ Version: ___________
OS: ___________ Version: ___________
Screen Size: ___________

Initial Load: PASS / FAIL
Notes: ___________

Responsive Layout: PASS / FAIL
Notes: ___________

User Interactions: PASS / FAIL
Notes: ___________

Error Handling: PASS / FAIL
Notes: ___________

Performance: PASS / FAIL
Notes: ___________

Overall: PASS / FAIL
Critical Issues: ___________
Minor Issues: ___________
```

## Automated Testing Support

While this is a manual testing guide, consider these automated checks:
- Run `npm test` to execute unit tests
- Check browser console for errors
- Use Lighthouse for performance audit
- Use axe DevTools for accessibility scan

## Next Steps After Testing

1. Document all issues found
2. Prioritize by severity
3. Create bug reports
4. Implement fixes
5. Retest affected areas
6. Update this guide with new findings
