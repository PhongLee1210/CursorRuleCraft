# ================================
# Multi-Stage Dockerfile for NX Monorepo
# Builds both Frontend and Backend
# ================================

# ============================================
# Stage 1: Base Dependencies
# ============================================
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files for the entire monorepo
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy NX configuration
COPY nx.json tsconfig.base.json tsconfig.json ./

# Install ALL dependencies once (shared across frontend and backend)
RUN bun install --frozen-lockfile

# ============================================
# Stage 2: Build Stage (Uses NX)
# ============================================
FROM base AS builder

WORKDIR /app

# Build arguments for frontend (passed from docker-compose)
ARG VITE_API_URL=/api
ARG VITE_CLERK_PUBLISHABLE_KEY

# Set as environment variables for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Copy source code
COPY . .

# Note: shared-types doesn't need building (it's TypeScript source files)
# Both frontend and backend consume it directly via TypeScript

# Build backend (no special env vars needed at build time)
RUN bunx nx build backend --configuration=production

# Build frontend (uses VITE_* env vars above)
RUN bunx nx build frontend --configuration=production

# ============================================
# Stage 3: Backend Runtime
# ============================================
FROM node:20-slim AS backend

WORKDIR /app

ENV NODE_ENV=production

# Copy built backend
COPY --from=builder /app/dist/apps/backend ./

# Install only production dependencies
COPY --from=builder /app/apps/backend/package.json ./package.json
RUN npm install --omit=dev

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "main.js"]

# ============================================
# Stage 4: Frontend Runtime (Nginx)
# ============================================
FROM nginx:alpine AS frontend

# Copy Nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from builder
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Stage 5: Combined Service (Frontend + Backend)
# ============================================
FROM nginx:alpine AS combined

# Install Node.js runtime
RUN apk add --no-cache nodejs npm

WORKDIR /app

ENV NODE_ENV=production

# Copy built backend
COPY --from=builder /app/dist/apps/backend ./backend

# Install backend production dependencies
COPY --from=builder /app/apps/backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev

# Copy built frontend
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html

# Copy Nginx configuration for combined service
COPY apps/frontend/nginx.combined.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["sh", "-c", "cd /app/backend && node main.js & for i in $(seq 1 30); do wget --spider -q http://localhost:4000/api/health 2>/dev/null && break || sleep 1; done && exec nginx -g 'daemon off;'"]

