/**
 * Common type definitions for the application
 */

// Example: API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Example: Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Example: Common entity properties
export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

export * from './ai-messages';
export * from './cursor-rules';
export * from './repository';
export * from './workspace';
