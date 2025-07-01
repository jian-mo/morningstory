#!/bin/bash

# Morning Story - Local Development Setup Script
set -e

echo "🚀 Setting up Morning Story local development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Pre-flight Checks ---

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available. Please install/update Docker and try again.${NC}"
    exit 1
fi

# Check if .env.dev file exists, create if not
if [ ! -f .env.dev ]; then
    echo -e "${YELLOW}⚠️  .env.dev file not found. Creating from example...${NC}"
    cp .env.dev.example .env.dev
    echo -e "${GREEN}✅ Created '.env.dev' for local development.${NC}"
    echo -e "${YELLOW}👉 You can add your OpenRouter API key to '.env.dev' for AI standup generation.${NC}"
fi

# --- Setup Process ---

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing local containers (if any)...${NC}"
docker compose down -v --remove-orphans || true

# Build and start containers (PostgreSQL, Redis and management tools)
echo -e "${YELLOW}🔨 Building and starting Docker containers (postgres, redis, pgadmin, redis-commander)...${NC}"
docker compose up -d postgres redis pgadmin redis-commander

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
while ! docker compose exec postgres pg_isready -U morning_story -d morning_story_dev > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}✅ PostgreSQL is ready!${NC}"

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
while ! docker compose exec redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}✅ Redis is ready!${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
    npm install
fi

# Generate Prisma client and run migrations
echo -e "${YELLOW}🗄️  Setting up database schema with Prisma...${NC}"
npm run prisma:generate --workspace=@morning-story/api
npm run prisma:migrate --workspace=@morning-story/api

# --- Success ---

echo -e "${GREEN}🎉 Local development environment is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 What's running:${NC}"
echo "  • PostgreSQL: localhost:5432 (morning_story_dev database)"
echo "  • Redis: localhost:6379"
echo "  • PgAdmin: http://localhost:5050 (admin@example.com / admin123)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  • Add your GitHub OAuth and OpenRouter API keys to '.env.dev' for full functionality"
echo ""
echo -e "${YELLOW}🚀 To start the API and Web app:${NC}"
echo "  # Start API server:"
echo "  cd apps/api && npm run dev"
echo "  # In another terminal, start web app:"
echo "  cd apps/web && npm run dev"
echo ""
echo -e "${YELLOW}📖 API docs will be available at:${NC}"
echo "  http://localhost:3000/api"
echo "  Health check: http://localhost:3000/health"
echo ""
echo -e "${GREEN}Happy coding! 🎯${NC}"