/**
 * Application-wide constants
 */

export const APP_NAME = 'CursorRulesCraft';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
} as const;

export const QUERY_KEYS = {
  example: ['example'],
  users: ['users'],
  posts: ['posts'],
  instruments: ['instruments'],
} as const;
