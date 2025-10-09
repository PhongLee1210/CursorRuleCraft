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
├── nx.json              # Nx workspace configuration
└── package.json         # Root workspace scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Bun** - Fast JavaScript runtime and package manager
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

```bash
# Install dependencies
bun install
```

### Supabase Setup

1. Create a Supabase project at [database.new](https://database.new)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials to `.env.local`
4. Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Backend API Setup

The backend is a **NestJS** server with **Clerk authentication** and **Supabase integration** (using Service Role Key).

1. Create a `.env` file in the monorepo root with:

   ```bash
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # NOT anon key!
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

2. Start the backend server:

   ```bash
   cd apps/backend
   bun run dev
   ```

3. The API will be available at `http://localhost:4000/api`

**📖 Backend Documentation:**

- [Backend README](./apps/backend/README.md) - Complete documentation
- [Quick Start Guide](./apps/backend/QUICKSTART.md) - 5-minute setup
- [Environment Variables](./apps/backend/ENV.md) - Configuration guide
- [Setup Complete](./apps/backend/SETUP_COMPLETE.md) - Architecture overview
- **[Frontend-Backend Integration](./FRONTEND_BACKEND_INTEGRATION.md) - How frontend calls the backend API** ⭐

**Key Features:**

- ✅ Global JWT authentication via Clerk
- ✅ Supabase Service Role Key (bypasses RLS)
- ✅ Protected & public endpoints
- ✅ Type-safe with TypeScript
- ✅ Hot reload in development
- ✅ Frontend integrates with backend API (no direct Supabase access)

### Development

```bash
# Start development server (with hot reload)
bun run dev

# Open http://localhost:3000 in your browser
```

### Building

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Code Quality

```bash
# Run ESLint
bun run lint

# Format code with Prettier
bun run format

# Check formatting
bun run format:check

# Type check
bun run type-check
```

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
