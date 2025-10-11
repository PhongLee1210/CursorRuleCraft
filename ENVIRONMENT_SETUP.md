# Environment Variables Setup Guide

## Overview

CursorRuleCraft follows **Approach 2** architecture: `Frontend → Backend API → Supabase`

This means:

- ✅ Frontend only talks to Backend API
- ✅ Backend talks to both Clerk and Supabase
- ❌ Frontend does NOT talk to Supabase directly

## Environment Variables by Layer

### 🎨 Frontend Environment Variables

**File:** `apps/frontend/.env`

```bash
# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Frontend needs these to authenticate users and get JWT tokens
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx...

# ============================================================================
# BACKEND API
# ============================================================================
# Frontend needs to know where to call the backend API
VITE_API_BASE_URL=http://localhost:3000

# ============================================================================
# GITHUB OAUTH (Optional - for repository integration)
# ============================================================================
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback/github

# ============================================================================
# ❌ NO SUPABASE VARS NEEDED IN FRONTEND!
# ============================================================================
# Frontend doesn't talk to Supabase directly
# All database queries go through the backend API
```

**Why no Supabase vars in frontend?**

- Frontend never creates Supabase client
- Frontend never queries Supabase directly
- All data fetching goes through backend API
- Backend handles all Supabase communication

### 🔧 Backend Environment Variables

**File:** `apps/backend/.env`

```bash
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Backend needs secret key to verify JWT tokens from frontend
CLERK_SECRET_KEY=sk_test_xxxxx...

# ============================================================================
# SUPABASE DATABASE
# ============================================================================
# Backend needs these to create Supabase clients with Clerk JWT
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ IMPORTANT: Use ANON_KEY, not SERVICE_ROLE_KEY!
# With Clerk RLS integration, we use anon key + Clerk JWT to respect RLS policies
# Service Role Key would bypass RLS (only use for admin operations if needed)

# Optional: Only for admin operations that need to bypass RLS
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# GITHUB OAUTH (Optional - for repository integration)
# ============================================================================
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback/github
```

## Data Flow with Environment Variables

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│                                                             │
│  Environment Variables:                                     │
│  • VITE_CLERK_PUBLISHABLE_KEY ─┐                          │
│  • VITE_API_BASE_URL           │                          │
│                                 ▼                          │
│  [Clerk SDK] ────────────▶ Get JWT Token                  │
│        │                                                    │
│        │ JWT                                                │
│        ▼                                                    │
│  [API Client] ──────────▶ Backend API + JWT               │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP Request
                          │ Authorization: Bearer <jwt>
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                        │
│                                                             │
│  Environment Variables:                                     │
│  • CLERK_SECRET_KEY ──────────▶ Verify JWT                │
│  • SUPABASE_URL                                            │
│  • SUPABASE_ANON_KEY ─────┐                               │
│                            │                               │
│  [ClerkAuthGuard]          │                               │
│        │                   │                               │
│        │ Verified JWT      │                               │
│        ▼                   │                               │
│  [Controller]              │                               │
│        │                   │                               │
│        │ clerkToken        │                               │
│        ▼                   ▼                               │
│  [SupabaseService] ────▶ Create Client with JWT           │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ PostgreSQL Query
                          │ Authorization: Bearer <jwt>
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│                                                             │
│  [RLS Policies] ────▶ Extract user from JWT                │
│        │               auth.jwt()->>'sub'                   │
│        ▼                                                    │
│  [Filter Data] ────▶ Return only authorized rows           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Why This Setup?

### ✅ Security Benefits

1. **Credentials Isolation**
   - Frontend only has public keys (Clerk publishable key)
   - Sensitive keys (Clerk secret, Supabase anon) stay on backend
   - No database credentials exposed to browser

2. **Single Point of Authorization**
   - All data access goes through backend
   - Backend validates every request
   - RLS provides defense in depth

3. **No Secret Key Exposure**
   - Supabase anon key is safe to use with RLS
   - Clerk secret key never leaves backend
   - GitHub client secret only on backend

### ✅ Architecture Benefits

1. **Clean Separation**
   - Frontend: UI + Auth
   - Backend: Business Logic + Database
   - Database: Data + RLS

2. **Easier to Maintain**
   - Change database schema? Only update backend
   - Change business logic? Only update backend
   - Frontend just calls REST API

3. **Centralized Logic**
   - All database queries in one place
   - Consistent error handling
   - Easier to add caching, logging, etc.

## Setup Instructions

### 1. Create Frontend .env

```bash
# In: apps/frontend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Edit and add:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Create Backend .env

```bash
# In: apps/backend/.env
cp apps/backend/.env.example apps/backend/.env

# Edit and add:
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Get Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** → Frontend `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → Backend `CLERK_SECRET_KEY`

### 4. Get Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → Backend `SUPABASE_URL`
   - **anon public** key → Backend `SUPABASE_ANON_KEY`

⚠️ **Important:** Use the `anon public` key, NOT the `service_role` key!

### 5. Set Up Clerk + Supabase Integration

1. In [Clerk Dashboard](https://dashboard.clerk.com):
   - Go to **Integrations**
   - Find **Supabase**
   - Click **Activate**
   - Copy your **Clerk Domain**

2. In [Supabase Dashboard](https://supabase.com/dashboard):
   - Go to **Authentication > Sign In / Up**
   - Click **Add provider**
   - Select **Clerk**
   - Paste your **Clerk Domain**

This allows Supabase RLS policies to read Clerk JWTs!

## Verification

### ✅ Frontend Should Have:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
VITE_API_BASE_URL=...
# That's it! No Supabase vars!
```

### ✅ Backend Should Have:

```bash
CLERK_SECRET_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### ❌ Common Mistakes:

**Mistake 1: Supabase vars in frontend**

```bash
# ❌ DON'T DO THIS in frontend .env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Why wrong?** Frontend doesn't need these because it never talks to Supabase directly.

**Mistake 2: Using SERVICE_ROLE_KEY**

```bash
# ❌ DON'T USE THIS (unless for admin operations)
SUPABASE_SERVICE_ROLE_KEY=...
```

**Why wrong?** Service role key bypasses RLS policies. Use ANON_KEY + Clerk JWT instead.

**Mistake 3: Missing Clerk secret in backend**

```bash
# ❌ Backend can't verify JWT without this
# CLERK_SECRET_KEY not set
```

**Why wrong?** Backend needs secret key to verify JWT tokens from frontend.

## Testing Your Setup

### 1. Test Frontend Can Authenticate

```bash
# Start frontend
cd apps/frontend
npm run dev

# Visit http://localhost:5173
# Click "Sign In"
# You should be able to authenticate with Clerk
```

### 2. Test Backend Can Verify JWT

```bash
# Start backend
cd apps/backend
npm run dev

# Make authenticated request
curl -H "Authorization: Bearer <your-clerk-jwt>" \
  http://localhost:3000/api/workspaces

# Should return 200 OK with data
```

### 3. Test RLS Policies Work

```bash
# Sign in as User A, create workspace
# Sign out, sign in as User B
# User B should NOT see User A's workspace
```

## Troubleshooting

### Error: "Invalid Clerk token"

**Cause:** Backend can't verify JWT  
**Fix:** Check `CLERK_SECRET_KEY` is set correctly in backend

### Error: "Network request failed"

**Cause:** Frontend can't reach backend  
**Fix:** Check `VITE_API_BASE_URL` points to correct backend URL

### Error: "Unauthorized" from Supabase

**Cause:** RLS policies blocking request  
**Fix:**

1. Verify Clerk is set up as Supabase auth provider
2. Check RLS policies are created correctly
3. Verify `SUPABASE_ANON_KEY` is correct

### Error: "Missing environment variables"

**Cause:** Required env vars not set  
**Fix:** Double-check all required vars are in .env files

## Summary

✅ **Frontend Environment:**

- VITE_CLERK_PUBLISHABLE_KEY
- VITE_API_BASE_URL
- NO Supabase vars!

✅ **Backend Environment:**

- CLERK_SECRET_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY (not SERVICE_ROLE_KEY!)

✅ **Architecture:**

- Frontend → Backend API → Supabase
- Frontend never talks to Supabase directly
- All credentials properly isolated

This setup ensures security, maintainability, and follows best practices for modern full-stack applications!
