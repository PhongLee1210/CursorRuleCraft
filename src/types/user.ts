import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3)
  .max(255)
  .regex(/^[\w.-]+$/, {
    message: 'Usernames can only contain letters, numbers, periods, hyphens, and underscores.',
  })
  .transform((value) => value.toLowerCase());

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  picture: z.literal('').or(z.null()).or(z.string().url()),
  username: usernameSchema,
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  locale: z.string().default('en-US'),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  provider: z.enum(['email', 'github', 'google', 'openid']).default('email'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserDto = z.infer<typeof userSchema>;
