/**
 * Auth service types and interfaces
 */

/**
 * Result type for service operations
 * Follows Supabase pattern of returning { data, error }
 */
export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Options for creating a user in Supabase
 */
export interface CreateUserOptions {
  id: string; // Clerk user ID
  name: string;
  email: string;
  username: string;
  picture?: string | null;
  locale?: string;
  emailVerified?: boolean;
  provider?: 'email' | 'github' | 'google' | 'openid';
}

/**
 * Options for updating a user in Supabase
 */
export interface UpdateUserOptions {
  name?: string;
  picture?: string | null;
  username?: string;
  locale?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

/**
 * User query filters
 */
export interface UserQueryFilters {
  email?: string;
  username?: string;
  provider?: 'email' | 'github' | 'google' | 'openid';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Type guard to check if a result has an error
 */
export function hasError<T>(
  result: ServiceResult<T>
): result is ServiceResult<null> & { error: Error } {
  return result.error !== null;
}

/**
 * Type guard to check if a result has data
 */
export function hasData<T>(result: ServiceResult<T>): result is ServiceResult<T> & { data: T } {
  return result.data !== null && result.error === null;
}
