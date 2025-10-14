# Docker Setup Documentation

## Architecture: Single Dockerfile for NX Monorepo ✅

This project uses a **single multi-stage Dockerfile** at the root level that properly leverages NX monorepo capabilities.

### Docker Compose Files

- **`docker-compose.yml`** - Production deployment (Frontend + Backend + PostgreSQL)
- **`docker-compose.dev.yml`** - Development (PostgreSQL only, run apps locally)

### Why Single Dockerfile?

**✅ Advantages:**

- Leverages NX's build system and caching
- Shared `node_modules` across builds (installed once)
- Uses NX dependency graph for optimal builds
- Single source of truth
- Smaller build contexts
- Follows monorepo best practices
- Better CI/CD integration

**❌ Alternative (Separate Dockerfiles):**

- Redundant dependency installations
- Doesn't leverage NX optimizations
- Harder to maintain
- Only suitable for multi-repo setups

## Build Stages Explained

```dockerfile
┌─────────────────────────────────────────────┐
│  Stage 1: Base Dependencies                 │
│  - Install all workspace dependencies once  │
│  - Copy NX configuration                    │
│  - Shared by both frontend and backend      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│  Stage 2: Builder (Uses NX)                 │
│  - Build shared-types (dependency)          │
│  - Build backend using `nx build backend`   │
│  - Build frontend using `nx build frontend` │
│  - NX handles incremental builds            │
└─────────────────────────────────────────────┘
         ↓                         ↓
┌─────────────────────┐   ┌─────────────────────┐
│ Stage 3: Backend    │   │ Stage 4: Frontend   │
│ - Node.js runtime   │   │ - Nginx runtime     │
│ - Copy built files  │   │ - Copy built files  │
│ - Production deps   │   │ - Serve static      │
└─────────────────────┘   └─────────────────────┘
```

## Docker Compose Targets

The single Dockerfile uses **multi-stage build targets**:

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: backend # ← Builds only up to backend stage

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: frontend # ← Builds only up to frontend stage
```

## Quick Start

### 1. Setup Environment

```bash
cp env.docker.example .env.docker
# Edit with your credentials
```

### 2. Build and Run

```bash
# Using npm scripts (recommended)
bun run docker:prod

# Or using Docker Compose directly
docker-compose --env-file .env.docker up -d --build

# Or using helper script
./scripts/docker-prod.sh
```

### 3. Access

- Frontend: http://localhost
- Backend: http://localhost/api
- Health: http://localhost/api/health

## Development Workflow

### Local Development (Recommended)

Run only the database in Docker, frontend/backend locally:

```bash
# Start PostgreSQL
bun run docker:dev

# Run apps with hot-reload
bun run dev:all
```

### Full Docker Development

```bash
# Watch mode with NX
docker-compose -f docker-compose.dev.yml up
```

## NX Integration Benefits

### 1. **Dependency Graph Awareness**

NX knows that frontend/backend depend on `shared-types`:

```bash
# NX automatically builds shared-types first
bunx nx build backend  # Builds shared-types → backend
bunx nx build frontend # Builds shared-types → frontend
```

### 2. **Incremental Builds**

NX only rebuilds what changed:

```bash
# If shared-types didn't change, uses cache
bunx nx build backend --skip-nx-cache=false
```

### 3. **Affected Builds**

Only build what's affected by changes:

```bash
# Build only changed apps
bunx nx affected:build
```

## Build Optimization

### Layer Caching Strategy

```dockerfile
# 1. Copy package files first (rarely change)
COPY package.json bun.lock* ./

# 2. Install dependencies (cached if package.json unchanged)
RUN bun install --frozen-lockfile

# 3. Copy source code (changes frequently)
COPY . .

# 4. Build (uses NX cache when possible)
RUN bunx nx build backend
```

### NX Cache in Docker

To use NX cache between builds:

```dockerfile
# Optional: Mount NX cache
volumes:
  - nx-cache:/app/.nx/cache
```

## Production Deployment

### Build for Production

```bash
# Build optimized images
docker-compose --env-file .env.docker build --no-cache

# Tag for registry
docker tag cursorrulecraft-frontend:latest your-registry/cursorrulecraft-frontend:v1.0.0
docker tag cursorrulecraft-backend:latest your-registry/cursorrulecraft-backend:v1.0.0

# Push to registry
docker push your-registry/cursorrulecraft-frontend:v1.0.0
docker push your-registry/cursorrulecraft-backend:v1.0.0
```

### Deploy

```bash
# On production server
docker-compose --env-file .env.docker up -d
```

## Nginx Configuration

Frontend container runs Nginx as reverse proxy:

```nginx
location / {
    # Serve React app
    try_files $uri /index.html;
}

location /api/ {
    # Proxy to backend container
    proxy_pass http://backend:4000/api/;
}
```

**Benefits:**

- Single domain (no CORS)
- Frontend at `/`
- Backend at `/api`
- Static asset caching
- Gzip compression

## Environment Variables

### Build-time (Frontend)

Injected during `docker build`:

```yaml
build:
  args:
    VITE_API_URL: /api
    VITE_CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}
```

### Runtime (Backend)

Injected when container starts:

```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}
  CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
```

## Troubleshooting

### Build fails with NX error

```bash
# Clear NX cache
rm -rf .nx/cache

# Rebuild
docker-compose build --no-cache
```

### Dependencies not found

```bash
# Ensure workspace packages are linked
bun install

# Check NX graph
bunx nx graph
```

### Frontend can't connect to backend

1. Check backend health: `curl http://localhost/api/health`
2. Check Nginx logs: `docker-compose logs frontend`
3. Verify Nginx config: `docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`

## Advanced Usage

### Custom Build Commands

```dockerfile
# Use NX affected builds
RUN bunx nx affected:build --base=main

# Build with specific configuration
RUN bunx nx build backend --configuration=staging
```

### Multi-architecture Builds

```bash
# Build for ARM and AMD
docker buildx build --platform linux/amd64,linux/arm64 -t cursorrulecraft .
```

### Build with BuildKit

```bash
# Enable BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build
```

## Comparison: Single vs Multiple Dockerfiles

| Aspect                 | Single Dockerfile (✅) | Multiple Dockerfiles (❌) |
| ---------------------- | ---------------------- | ------------------------- |
| NX Integration         | Full support           | Limited                   |
| Build Speed            | Fast (shared layers)   | Slower (duplicate work)   |
| Cache Efficiency       | High                   | Low                       |
| Maintenance            | Easy (1 file)          | Hard (N files)            |
| Build Context          | Optimal                | Redundant                 |
| Monorepo Best Practice | Yes                    | No                        |

## References

- [NX Docker Documentation](https://nx.dev/recipes/deployment/node-docker)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Reactive Resume](https://github.com/AmruthPillai/Reactive-Resume) - Inspiration
