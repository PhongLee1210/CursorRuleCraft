#!/bin/bash

# Docker Development Helper Script
# Quick script to start development environment with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CursorRuleCraft Docker Development Setup${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env not found!${NC}"
  echo -e "Creating from example..."
  cp env.example .env
  echo -e "${GREEN}✅ Created .env${NC}"
  echo -e "${YELLOW}⚠️  Please edit .env with your values before proceeding${NC}"
  exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Parse command line arguments
MODE=${1:-"combined"}  # combined (single container) or database (postgres only)

# Load environment variables
source .env

if [ "$MODE" = "database" ]; then
  # Only start PostgreSQL for local development (if using docker-compose.dev.yml)
  if [ ! -f docker-compose.dev.yml ]; then
    echo -e "${RED}❌ docker-compose.dev.yml not found${NC}"
    echo "Database-only mode requires docker-compose.dev.yml"
    exit 1
  fi
  
  echo -e "${BLUE}📦 Starting PostgreSQL for development...${NC}"
  docker-compose -f docker-compose.dev.yml up -d
  
  echo ""
  echo -e "${GREEN}✅ PostgreSQL is running!${NC}"
  echo ""
  echo -e "${BLUE}Database connection details:${NC}"
  echo "  Host: localhost"
  echo "  Port: 5432"
  echo "  Database: cursorrulecraft_dev"
  echo "  User: postgres"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Update your .env file with the database URL"
  echo "  2. Run: ${GREEN}bun run dev:all${NC}"
  echo ""
  echo -e "${BLUE}To stop PostgreSQL:${NC}"
  echo "  docker-compose -f docker-compose.dev.yml down"
else
  # Combined mode - build and run single container for testing
  echo -e "${BLUE}📦 Building combined Docker image...${NC}"
  docker build \
    --target combined \
    --build-arg VITE_API_URL=/api \
    --build-arg VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY}" \
    -t cursorrulecraft:dev \
    .
  
  echo ""
  echo -e "${BLUE}🚀 Starting combined service...${NC}"
  docker run -d \
    --name cursorrulecraft-dev \
    -p 8080:80 \
    --env-file .env \
    cursorrulecraft:dev
  
  echo ""
  echo -e "${GREEN}✅ Service is starting!${NC}"
  echo ""
  echo -e "${BLUE}Access your application:${NC}"
  echo "  Frontend: http://localhost:8080"
  echo "  Backend API: http://localhost:8080/api"
  echo "  Health Check: http://localhost:8080/api/health"
  echo ""
  echo -e "${YELLOW}View logs:${NC}"
  echo "  docker logs -f cursorrulecraft-dev"
  echo ""
  echo -e "${BLUE}To stop:${NC}"
  echo "  docker stop cursorrulecraft-dev && docker rm cursorrulecraft-dev"
fi

