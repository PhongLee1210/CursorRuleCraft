# Frontend Dockerfile for Nx monorepo
# Build the docker image with `npx nx docker:build frontend`.
#
# Run the container with `docker run -p 80:80 apps-frontend`.
#
FROM nginx:alpine

# Copy Nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from workspace dist folder
# The prune task prepares this structure at workspace root
COPY dist/apps/frontend /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check for frontend
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

