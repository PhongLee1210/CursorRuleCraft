# CursorRulesCraft

A modern React application built with TypeScript, Vite, TailwindCSS, Radix UI, and Tanstack Query.

## ✨ Features

- ⚡️ **Vite** - Lightning fast HMR and build times
- ⚛️ **React 19** - Latest React features
- 🔷 **TypeScript** - Type safety and better DX
- 🎨 **TailwindCSS** - Utility-first CSS framework
- 🧩 **Radix UI** - Accessible, unstyled UI primitives
- 🔄 **Tanstack Query** - Powerful data synchronization
- 🗄️ **Supabase** - Open source Firebase alternative
- 🛠️ **tailwind-merge** - Merge Tailwind classes without conflicts
- 💅 **Prettier** - Code formatting with Tailwind plugin
- 📦 **Bun** - Fast JavaScript runtime and package manager

---

## 🛠️ Technology Stack

### Core

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Bun** - Package manager

### Styling

- **TailwindCSS** - Utility-first CSS
- **PostCSS** - CSS processing
- **tailwind-merge** - Merge Tailwind classes
- **clsx** - Conditional class names

### UI Components

- **Radix UI** - Accessible primitives
  - Dialog
  - Dropdown Menu
  - Tabs
  - Select
  - Tooltip
  - Toast
  - Slot

### Data Fetching

- **Tanstack Query** - Server state management
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Row Level Security

### Code Quality

- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

---

## 📁 Project Structure

This is an **Nx monorepo** with the following structure:

```
CursorRulesCraft/
├── apps/
│   ├── frontend/        # Main React application
│   └── backend/         # NestJS API server with Clerk auth & Supabase
├── packages/
│   └── shared-types/    # Shared TypeScript types
├── supabase/            # Supabase configuration
├── .env                 # ⚠️ SINGLE unified environment file (gitignored)
├── .env.template        # Template with all required variables
├── nx.json              # Nx workspace configuration
└── package.json         # Root workspace scripts
```

### Environment Configuration

**This monorepo uses a unified environment variable approach:**

- ✅ **Single `.env` file** at the root for all apps
- ✅ **Frontend (Vite)**: Reads from root via `envDir: '../../'`
- ✅ **Backend (NestJS)**: Reads from root via `envFilePath: '../../.env'`
- ✅ **NX**: Tracks `.env` as shared global input
- ❌ **Do NOT** create `.env` files in `apps/frontend/` or `apps/backend/`

---

## 🚀 Quick Start

### Prerequisites

Install these tools before starting:

- **Node.js v22+** - Required runtime version

  ```bash
  # Using nvm (recommended)
  nvm install 22
  nvm use 22

  # Or using fnm
  fnm install 22
  fnm use 22

  # Verify version
  node --version  # Should show v22.x.x
  ```

  _Note: The project includes `.nvmrc` and `.node-version` files for automatic version switching._

- **Bun** - Fast JavaScript runtime: `curl -fsSL https://bun.sh/install | bash`
- **Docker** - Required for local Supabase: [Install Docker](https://docs.docker.com/get-docker/)
- **Supabase CLI** - Database management:

  ```bash
  # macOS
  brew install supabase/tap/supabase

  # Or via npm
  npm install -g supabase
  ```

### Setup Steps

**1. Clone and Install**

```bash
git clone https://github.com/your-username/CursorRulesCraft.git
cd CursorRulesCraft
bun install
```

**2. Start Supabase (Important!)**

```bash
supabase start
```

This will:

- Start local PostgreSQL database on port 54322
- Start Supabase Studio on http://127.0.0.1:54323
- Apply all migrations from `supabase/migrations/`
- Output your local credentials (**keep this!**)

You'll see output like:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbG...
service_role key: eyJhbG...
```

**3. Create `.env` File**

Copy the example environment file and fill in your values:

```bash
cp env.example .env
```

Or manually create a `.env` file in the project root with these values:

```bash
# Backend API
PORT=4000
FRONTEND_URL=http://localhost:3000

# Supabase (from supabase start output)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<paste anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role key from supabase start>

# Clerk (get from https://dashboard.clerk.com)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# GitHub OAuth (optional - get from https://github.com/settings/apps)
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour_key\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:4000/api/auth/github/callback

# Frontend (VITE_* prefix required)
VITE_API_URL=/api
VITE_SUPABASE_URL=http://127.0.0.1:54321
```

**Important Notes**:

- The monorepo uses **ONE unified `.env` file at the root** - both apps read from it
- See `env.example` for all available variables
- Frontend vars MUST have `VITE_` prefix to be accessible
- Without the `.env` file, the backend will crash with error 500!

**4. Run the Application**

```bash
bun run dev:all
```

This starts:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Supabase Studio: http://127.0.0.1:54323

### Common Commands

```bash
# Development
bun run dev:all          # Run frontend + backend
bun run dev:frontend     # Frontend only
bun run dev:backend      # Backend only

# Supabase
bun run supabase:start   # Start local Supabase
bun run supabase:stop    # Stop local Supabase
bun run supabase:status  # Check status
bun run supabase:studio  # Open Studio UI
bun run supabase:reset   # Reset database (WARNING: destroys data)

# Build
bun run build:frontend   # Build frontend
bun run build:backend    # Build backend
```

### Database Migrations

All migrations are in `supabase/migrations/`:

- `000_create_users.sql` - User table for Clerk authentication
- `001_create_workspaces.sql` - Workspace and member tables
- `002_create_repositories.sql` - Repository and Git integration tables

**Create a new migration:**

```bash
supabase db diff -f migration_name
```

**Apply migrations manually:**

```bash
supabase db reset
```

### Getting API Keys

**Clerk (Authentication):**

1. Go to https://dashboard.clerk.com
2. Create/select your app → API Keys
3. Copy Secret Key and Publishable Key

**GitHub OAuth (Repository Integration):**

1. Go to https://github.com/settings/developers
2. New OAuth App:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/auth/callback/github`
3. Copy Client ID and generate Client Secret

### Troubleshooting

**Error 500: Cannot read properties of undefined**

- ✅ Make sure `.env` file exists in project root
- ✅ Verify all Supabase variables are set
- ✅ Run `supabase status` to check if Supabase is running

**Backend won't start:**

```bash
# Check if Supabase is running
supabase status

# If not, start it
supabase start

# Verify .env file exists
ls -la .env
```

**Port already in use:**

```bash
# Check what's using the port
lsof -i :54321

# Stop Supabase and restart
supabase stop
supabase start
```

### Deploying to Production

**1. Login to Supabase CLI**

```bash
supabase login
```

**2. Link Your Project**

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**3. Push Migrations**

```bash
supabase db push
```

⚠️ **Warning**: This modifies your production database. Review migrations first!

**4. Update Production `.env`**
Replace local Supabase credentials with production values from https://app.supabase.com (Project Settings → API)

---

## 🎨 Component Examples

### Button Component

```tsx
import { Button } from '@/components/Button';

function Example() {
  return (
    <>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>

      <Button size="default">Default</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🎨</Button>
    </>
  );
}
```

### Dialog Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog';
import { Button } from '@/components/Button';

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        {/* Content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Using Tanstack Query with Supabase

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function Example() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('instruments').select('*');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

### Creating Custom Hooks

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useInstruments() {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('instruments').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('instruments').insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
  });
}
```

---

## 🎯 Best Practices

### File Organization

- Place reusable components in `src/components/`
- Create custom hooks in `src/hooks/`
- Keep utility functions in `src/lib/`
- Define types in `src/types/`
- Use providers for global state in `src/providers/`

### TypeScript

- Always define proper types/interfaces
- Avoid using `any` - use `unknown` if needed
- Use type inference where possible
- Export types that are used across files

### Styling

- Use the `cn()` utility for conditional classes
- Follow Tailwind CSS conventions
- Use CSS variables for theming (defined in `index.css`)
- Prefer composition over customization

### Components

- Keep components small and focused
- Use Radix UI primitives for accessibility
- Export components individually
- Use `forwardRef` for components that need refs

### Data Fetching

- Use Tanstack Query for server state
- Define query keys in constants
- Handle loading and error states
- Use proper TypeScript types for API responses

---

## 📚 Useful Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/primitives)
- [Tanstack Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Bun Documentation](https://bun.sh/docs)

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coding! 🚀**
