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

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env not found!${NC}"
  echo -e "Creating from example..."
  cp env.example .env
  echo -e "${GREEN}✅ Created .env${NC}"
  echo -e "${RED}❌ Please edit .env with your production values before proceeding${NC}"
  exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

# Parse command line arguments
COMMAND=${1:-"up"}
MODE=${2:-"combined"}  # combined (single container) or separate (docker-compose)

# Load environment variables
source .env

case $COMMAND in
  build)
    if [ "$MODE" = "combined" ]; then
      echo -e "${BLUE}📦 Building combined Docker image...${NC}"
      docker build \
        --target combined \
        --build-arg VITE_API_URL=/api \
        --build-arg VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY}" \
        -t cursorrulecraft:combined \
        .
      echo -e "${GREEN}✅ Build complete!${NC}"
    else
      echo -e "${BLUE}📦 Building Docker images with docker-compose...${NC}"
      docker-compose build
      echo -e "${GREEN}✅ Build complete!${NC}"
    fi
    ;;
  
  up)
    if [ "$MODE" = "combined" ]; then
      echo -e "${BLUE}🚀 Starting combined service...${NC}"
      docker run -d \
        --name cursorrulecraft \
        -p 80:80 \
        --env-file .env \
        cursorrulecraft:combined
      echo ""
      echo -e "${GREEN}✅ Service is starting!${NC}"
      echo ""
      echo -e "${BLUE}Access your application:${NC}"
      echo "  Frontend: http://localhost"
      echo "  Backend API: http://localhost/api"
      echo "  Health Check: http://localhost/api/health"
      echo ""
      echo -e "${YELLOW}View logs:${NC}"
      echo "  docker logs -f cursorrulecraft"
    else
      echo -e "${BLUE}🚀 Starting all services with docker-compose...${NC}"
      docker-compose up -d --build
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
    fi
    ;;
  
  down)
    if [ "$MODE" = "combined" ]; then
      echo -e "${YELLOW}🛑 Stopping combined service...${NC}"
      docker stop cursorrulecraft 2>/dev/null || true
      docker rm cursorrulecraft 2>/dev/null || true
      echo -e "${GREEN}✅ Service stopped${NC}"
    else
      echo -e "${YELLOW}🛑 Stopping all services...${NC}"
      docker-compose down
      echo -e "${GREEN}✅ All services stopped${NC}"
    fi
    ;;
  
  restart)
    if [ "$MODE" = "combined" ]; then
      echo -e "${BLUE}🔄 Restarting combined service...${NC}"
      docker restart cursorrulecraft
      echo -e "${GREEN}✅ Service restarted${NC}"
    else
      echo -e "${BLUE}🔄 Restarting all services...${NC}"
      docker-compose restart
      echo -e "${GREEN}✅ Services restarted${NC}"
    fi
    ;;
  
  logs)
    if [ "$MODE" = "combined" ]; then
      docker logs -f cursorrulecraft
    else
      docker-compose logs -f
    fi
    ;;
  
  clean)
    if [ "$MODE" = "combined" ]; then
      echo -e "${YELLOW}🧹 Cleaning up container and image...${NC}"
      docker stop cursorrulecraft 2>/dev/null || true
      docker rm cursorrulecraft 2>/dev/null || true
      docker rmi cursorrulecraft:combined 2>/dev/null || true
      echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
      echo -e "${YELLOW}🧹 Cleaning up containers and volumes...${NC}"
      docker-compose down -v
      echo -e "${GREEN}✅ Cleanup complete${NC}"
    fi
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
    echo -e "${BLUE}Modes:${NC}"
    echo "  combined  - Single container (frontend + backend) [default]"
    echo "  separate  - Separate containers via docker-compose"
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./scripts/docker-prod.sh [command] [mode]"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./scripts/docker-prod.sh up combined     # Single container"
    echo "  ./scripts/docker-prod.sh up separate     # Docker compose"
    echo "  ./scripts/docker-prod.sh build           # Build combined (default)"
    exit 1
    ;;
esac

