/**
 * Feature Flags Configuration
 * Set to false to hide features from production
 * Set to true to enable features for testing
 */

// Check if we're in development mode
const isDev = __DEV__;

export const FEATURE_FLAGS = {
  // Categories feature on home screen
  SHOW_CATEGORIES: true, // Set to true when ready for production
  
  // Promote Business button and feature
  SHOW_PROMOTE_BUSINESS: true, // Set to true when ready for production
  
  // You can also make features dev-only:
  // SHOW_CATEGORIES: isDev,
  // SHOW_PROMOTE_BUSINESS: isDev,
};

export default FEATURE_FLAGS;
