# CursorRuleCraft Backend

A NestJS backend server with Supabase integration (using Service Role Key) and Clerk JWT authentication.

## 🏗️ Architecture Overview

This backend implements a secure, scalable architecture with:

1. **NestJS Framework**: Progressive Node.js framework with TypeScript support
2. **Supabase Service Role Key**: Backend client that bypasses all Row Level Security (RLS) policies
3. **Clerk Authentication**: JWT-based authentication with global guard protection
4. **Type-Safe Database Access**: Using Supabase client with full database access

## 📋 Prerequisites

- Node.js 20+
- Bun (or npm/yarn/pnpm)
- Supabase project with Service Role Key
- Clerk application with API keys

## ⚙️ Environment Setup

Create a `.env` file in the **root of the monorepo** with the following variables:

```bash
# Backend Server Configuration
PORT=4000
NODE_ENV=development

# Supabase Configuration
# IMPORTANT: Use the Service Role Key (not the anon key) to bypass RLS
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Clerk Configuration
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

See [ENV.md](./ENV.md) for detailed instructions on obtaining these values.

## 🚀 Getting Started

### Install Dependencies

```bash
# From the monorepo root
bun install

# Or from the backend directory
cd apps/backend
bun install
```

### Run Development Server

```bash
# From the backend directory
bun run dev

# Or using npm/pnpm/yarn
npm run dev
```

The server will start on `http://localhost:4000` with API endpoints at `http://localhost:4000/api`.

### Build for Production

```bash
bun run build
```

### Start Production Server

```bash
bun run start
```

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── auth/                      # Authentication module
│   │   ├── clerk-auth.guard.ts    # Global JWT validation guard
│   │   └── decorators/            # Custom decorators
│   │       ├── public.decorator.ts       # @Public() - Skip auth
│   │       └── current-user.decorator.ts # @CurrentUser() - Get user
│   ├── supabase/                  # Supabase module
│   │   ├── supabase.module.ts     # Global Supabase module
│   │   └── supabase.service.ts    # Singleton client with Service Role Key
│   ├── users/                     # Example users module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts    # Protected endpoints
│   │   └── users.service.ts       # Database operations
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health check endpoint
│   ├── app.service.ts
│   └── main.ts                    # Application entry point
├── ENV.md                         # Environment variables guide
└── README.md                      # This file
```

## 🔐 Authentication

### How It Works

1. **Global Guard**: `ClerkAuthGuard` is registered globally and validates JWTs on all endpoints
2. **Token Validation**: Extracts and verifies JWT from `Authorization: Bearer <token>` header
3. **Public Routes**: Use `@Public()` decorator to bypass authentication
4. **User Data**: Access authenticated user via `@CurrentUser()` decorator

### Example: Protected Endpoint

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    return {
      userId: user.sub,
      sessionId: user.sid,
    };
  }
}
```

### Example: Public Endpoint

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
```

## 🗄️ Supabase Integration

### Service Role Key

The backend uses the **Supabase Service Role Key** which:

- ✅ **Bypasses all Row Level Security (RLS) policies**
- ✅ **Provides full database access**
- ✅ **Allows administrative operations**
- ⚠️ **Should NEVER be exposed to the frontend**

### Using the Supabase Service

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MyService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUsers() {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.from('users').select('*');

    return data;
  }
}
```

## 🛣️ API Endpoints

### Public Endpoints

| Method | Path          | Description           |
| ------ | ------------- | --------------------- |
| GET    | `/api/health` | Health check endpoint |

### Protected Endpoints (Require JWT)

| Method | Path                         | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/hello`                 | Simple authenticated greeting  |
| GET    | `/api/users/me`              | Get current authenticated user |
| GET    | `/api/users/profile/:userId` | Get user profile by ID         |
| PUT    | `/api/users/me`              | Update current user's profile  |
| GET    | `/api/users`                 | Get all users (admin)          |

### Testing with cURL

```bash
# Public endpoint (no auth required)
curl http://localhost:4000/api/health

# Protected endpoint (requires JWT)
curl -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
     http://localhost:4000/api/users/me
```

## 🧪 Testing Authentication

1. **Get a Clerk JWT Token**:
   - Sign in through your frontend application
   - The JWT token is automatically generated by Clerk
   - Extract it from the `Authorization` header or use `useAuth().getToken()`

2. **Test Protected Endpoints**:

   ```bash
   # Replace YOUR_TOKEN with actual Clerk JWT
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:4000/api/users/me
   ```

3. **Expected Response**:
   ```json
   {
     "message": "Successfully retrieved current user",
     "auth": {
       "userId": "user_123",
       "sessionId": "sess_456"
     }
   }
   ```

## 🔧 Configuration

### CORS

CORS is enabled in `main.ts` for the frontend:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

Update `FRONTEND_URL` environment variable to match your frontend URL in production.

### Global Prefix

All API endpoints are prefixed with `/api`:

```typescript
app.setGlobalPrefix('api');
```

## 📚 Key Concepts

### Guards

- **ClerkAuthGuard**: Validates JWT tokens from Clerk on every request
- Applied globally via `APP_GUARD` provider
- Can be bypassed with `@Public()` decorator

### Decorators

- **@Public()**: Mark routes as publicly accessible (no auth required)
- **@CurrentUser()**: Extract authenticated user data from request
- **@CurrentUser('sub')**: Extract specific field from user data

### Modules

- **Global Modules**: `ConfigModule` and `SupabaseModule` are global (no need to re-import)
- **Feature Modules**: `UsersModule` demonstrates protected endpoints

## 🚨 Security Best Practices

1. ✅ **Never expose Service Role Key to frontend**
2. ✅ **Always validate JWTs on the backend**
3. ✅ **Use environment variables for secrets**
4. ✅ **Add `.env` to `.gitignore`**
5. ✅ **Implement rate limiting for production**
6. ✅ **Add role-based authorization as needed**
7. ✅ **Enable HTTPS in production**

## 🐛 Troubleshooting

### "Authorization token is missing"

- Ensure you're sending the `Authorization` header
- Format: `Authorization: Bearer <token>`
- Check that the endpoint isn't marked with `@Public()`

### "Invalid or expired authentication token"

- Token might be expired (check Clerk session settings)
- Verify `CLERK_SECRET_KEY` is correct in `.env`
- Ensure token is from the correct Clerk application

### "Supabase client not initialized"

- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify the Service Role Key (not anon key) is being used
- Ensure `.env` file is in the monorepo root

## 📖 Further Reading

- [NestJS Documentation](https://docs.nestjs.com)
- [Clerk Backend API](https://clerk.com/docs/references/backend/overview)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

## 📝 License

MIT
