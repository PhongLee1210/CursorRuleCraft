import type { Database } from '@/types/database';
import type { UserDto } from '@/types/user';

/**
 * Helper method to map database row to UserDto
 */
export function mapToUserDto(user: Database['public']['Tables']['users']['Row']): UserDto {
  return {
    id: user.id,
    name: user.name,
    picture: user.picture ?? '',
    username: user.username,
    email: user.email,
    locale: user.locale,
    emailVerified: user.email_verified,
    twoFactorEnabled: user.two_factor_enabled,
    provider: user.provider,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  };
}
