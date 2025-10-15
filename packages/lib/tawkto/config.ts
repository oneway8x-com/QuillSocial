import { TawkToConfig } from './types';

/**
 * Tawk.to configuration utility
 * Handles environment variables and provides configuration objects
 */

export const TAWK_TO_CONFIG = {
  propertyId: process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID || '',
  widgetId: process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID || '',
  secureMode: process.env.NEXT_PUBLIC_TAWK_TO_SECURE_MODE === 'true',
  apiKey: process.env.TAWK_TO_API_KEY || '',
} as const;

/**
 * Check if Tawk.to is properly configured
 */
export function isTawkToConfigured(): boolean {
  return !!(TAWK_TO_CONFIG.propertyId && TAWK_TO_CONFIG.widgetId);
}

/**
 * Get Tawk.to embed script URL
 */
export function getTawkToScriptUrl(propertyId: string, widgetId: string): string {
  return `https://embed.tawk.to/${propertyId}/${widgetId}`;
}

/**
 * Create default Tawk.to configuration
 */
export function createTawkToConfig(overrides?: Partial<TawkToConfig>): TawkToConfig {
  return {
    propertyId: TAWK_TO_CONFIG.propertyId,
    widgetId: TAWK_TO_CONFIG.widgetId,
    autoStart: true,
    secureMode: TAWK_TO_CONFIG.secureMode,
    ...overrides,
  };
}

/**
 * Generate HMAC SHA256 hash for secure mode
 * Note: This should be done on the server-side for security
 */
export function generateTawkToHash(email: string, apiKey: string): string {
  if (typeof window !== 'undefined') {
    // Hash generation should be done server-side for security
    return '';
  }

  const crypto = require('crypto');
  return crypto.createHmac('sha256', apiKey).update(email).digest('hex');
}
