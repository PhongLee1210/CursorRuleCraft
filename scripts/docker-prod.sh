#!/bin/bash

# Docker Production Helper Script
# Script to build and deploy production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CursorRuleCraft Docker Production Deployment${NC}"
echo ""

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
  echo -e "${YELLOW}⚠️  .env.docker not found!${NC}"
  echo -e "Creating from example..."
  cp env.docker.example .env.docker
  echo -e "${GREEN}✅ Created .env.docker${NC}"
  echo -e "${RED}❌ Please edit .env.docker with your production values before proceeding${NC}"
  exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  exit 1
fi

# Parse command line arguments
COMMAND=${1:-"up"}

case $COMMAND in
  build)
    echo -e "${BLUE}📦 Building Docker images...${NC}"
    docker-compose --env-file .env.docker build
    echo -e "${GREEN}✅ Build complete!${NC}"
    ;;
  
  up)
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    docker-compose --env-file .env.docker up -d --build
    echo ""
    echo -e "${GREEN}✅ All services are starting!${NC}"
    echo ""
    echo -e "${BLUE}Access your application:${NC}"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  Health Check: http://localhost/api/health"
    echo ""
    echo -e "${YELLOW}View logs:${NC}"
    echo "  docker-compose logs -f"
    ;;
  
  down)
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ All services stopped${NC}"
    ;;
  
  restart)
    echo -e "${BLUE}🔄 Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted${NC}"
    ;;
  
  logs)
    docker-compose logs -f
    ;;
  
  clean)
    echo -e "${YELLOW}🧹 Cleaning up containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    ;;
  
  health)
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    echo ""
    
    echo -e "Frontend:"
    if curl -f -s http://localhost/health > /dev/null; then
      echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
      echo -e "${RED}❌ Frontend is not responding${NC}"
    fi
    
    echo ""
    echo -e "Backend:"
    if curl -f -s http://localhost/api/health > /dev/null; then
      echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
      echo -e "${RED}❌ Backend is not responding${NC}"
    fi
    ;;
  
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo ""
    echo -e "${BLUE}Available commands:${NC}"
    echo "  build    - Build Docker images"
    echo "  up       - Start all services (default)"
    echo "  down     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - View logs"
    echo "  clean    - Stop and remove all containers and volumes"
    echo "  health   - Check service health"
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./scripts/docker-prod.sh [command]"
    exit 1
    ;;
esac

