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
# No app-specific package.json needed - using root package.json
COPY libs/shared-types/package.json ./libs/shared-types/

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
COPY libs/shared-types ./libs/shared-types

# Build frontend using NX
RUN bun nx build frontend

# ============================================
# Stage 3: Production Runtime (Nginx)
# ============================================
FROM nginx:alpine

# Build argument for port
ARG PORT=80

# Set environment variable
ENV PORT=$PORT

# Copy Nginx configuration template
COPY apps/frontend/nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Use envsubst to substitute environment variables in nginx config
RUN apk add --no-cache gettext && \
    envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/default.conf.template

# Copy built frontend from builder (NX outputs to dist/apps/frontend)
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html

# Expose port from environment variable
EXPOSE $PORT

# Health check for frontend
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

