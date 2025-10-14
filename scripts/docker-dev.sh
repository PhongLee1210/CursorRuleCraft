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

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
  echo -e "${YELLOW}⚠️  .env.docker not found!${NC}"
  echo -e "Creating from example..."
  cp env.docker.example .env.docker
  echo -e "${GREEN}✅ Created .env.docker${NC}"
  echo -e "${YELLOW}⚠️  Please edit .env.docker with your values before proceeding${NC}"
  exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  exit 1
fi

echo -e "${BLUE}📦 Starting PostgreSQL for development...${NC}"
docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d

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

