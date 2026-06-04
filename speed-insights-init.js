// Initialize Vercel Speed Insights
import { injectSpeedInsights } from './node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights with default configuration
// This will automatically track Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
injectSpeedInsights({
  debug: false, // Set to true for development debugging
});

console.log('[Speed Insights] Initialized successfully');
