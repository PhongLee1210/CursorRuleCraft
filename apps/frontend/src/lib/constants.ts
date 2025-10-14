/**
 * Application-wide constants
 */

export const APP_NAME = 'CursorRulesCraft';

/**
 * Backend API base URL
 * - In Docker/Production: Uses relative path '/api' (same domain via Nginx proxy)
 * - In Development: Uses 'http://localhost:4000/api' (proxied by Vite)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
} as const;
