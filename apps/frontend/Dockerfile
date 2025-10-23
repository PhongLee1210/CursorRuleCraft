# Multi-stage Dockerfile for React Frontend
# This file is self-contained and includes the build process
# Render will run this directly without external build commands
#
# ============================================
# Stage 1: Base Dependencies
# ============================================
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy NX configuration
COPY nx.json tsconfig.base.json tsconfig.json ./

# Install dependencies
RUN bun install

# ============================================
# Stage 2: Build
# ============================================
FROM base AS builder

WORKDIR /app

# Build arguments for Vite
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

# Set as environment variables for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Copy source code
COPY apps/frontend ./apps/frontend
COPY packages/shared-types ./packages/shared-types

# Build frontend
RUN cd apps/frontend && bun run build

# ============================================
# Stage 3: Production Runtime (Nginx)
# ============================================
FROM nginx:alpine

# Build argument for port
ARG PORT=80

# Set environment variable
ENV PORT=$PORT

# Copy Nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from builder (Vite outputs to ../../dist/apps/frontend)
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html

# Expose port from environment variable
EXPOSE $PORT

# Health check for frontend
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80}/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

