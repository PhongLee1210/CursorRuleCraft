# Multi-stage Dockerfile for NestJS Backend
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
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy NX configuration
COPY nx.json tsconfig.base.json tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================
# Stage 2: Build
# ============================================
FROM base AS builder

WORKDIR /app

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# Build backend using TypeScript
RUN cd apps/backend && bunx tsc

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM docker.io/node:lts-alpine

# Install curl for health checks
RUN apk add --no-cache curl jq

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

WORKDIR /app

# Copy built backend from builder
COPY --from=builder /app/apps/backend/dist ./

# Copy shared-types source (needed for module-alias at runtime)
COPY --from=builder /app/packages/shared-types ./packages/shared-types

# Copy package.json and clean workspace dependencies
COPY --from=builder /app/apps/backend/package.json ./package.json
RUN jq 'del(.dependencies["@cursorrulecraft/shared-types"])' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    npm install --omit=dev

EXPOSE 4000

# Health check - pings the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD [ "node", "apps/backend/src/main.js" ]
