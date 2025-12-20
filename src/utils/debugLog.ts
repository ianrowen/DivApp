// src/utils/debugLog.ts
/**
 * Debug logging utility
 * Automatically disabled in production builds to prevent crashes
 * Compatible with static exports and all build environments
 */

// Check if we're in development mode
// Use try-catch to handle cases where __DEV__ is not available (e.g., during static export)
let isDevelopment = false;
try {
  // @ts-ignore - __DEV__ is a React Native global that may not be available during static export
  if (typeof __DEV__ !== 'undefined') {
    isDevelopment = __DEV__;
  } else if (typeof process !== 'undefined' && process.env) {
    isDevelopment = process.env.NODE_ENV === 'development';
  }
} catch {
  // If neither is available, default to false (production mode)
  isDevelopment = false;
}

// Debug logging endpoint (only used in development)
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d';

/**
 * Safe debug logging function that only runs in development
 * In production builds, this is a no-op to prevent crashes
 * Compatible with static exports and server-side rendering
 */
export function debugLog(
  location: string,
  message: string,
  data?: Record<string, any>,
  hypothesisId?: string
): void {
  // Only log in development mode
  if (!isDevelopment) {
    return;
  }

  // Check if fetch is available (not available in all environments)
  if (typeof fetch === 'undefined') {
    return;
  }

  // Wrap in try-catch to prevent any errors from crashing the app
  try {
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        message,
        data: data || {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: hypothesisId || '',
      }),
    }).catch(() => {
      // Silently fail - don't log errors from debug logging
    });
  } catch (error) {
    // Silently fail - don't let debug logging crash the app
  }
}

