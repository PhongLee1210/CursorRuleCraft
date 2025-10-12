/**
 * Application-wide constants
 */

export const APP_NAME = 'CursorRulesCraft';

/**
 * Backend API base URL
 * Defaults to localhost:4000 in development
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
} as const;
