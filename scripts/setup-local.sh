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

# Check if .env file exists, create if not
if [ ! -f apps/api/.env ]; then
    echo -e "${YELLOW}⚠️  .env file not found at 'apps/api/.env'. Creating from example...${NC}"
    cp apps/api/.env.example apps/api/.env
    echo -e "${GREEN}✅ Created 'apps/api/.env'.${NC}"
fi

# Check if .env is configured
if grep -q "your-password" apps/api/.env; then
    echo -e "${RED}❌ Your 'apps/api/.env' file is not configured.${NC}"
    echo -e "${YELLOW}👉 Please replace 'your-password' in the DATABASE_URL with your actual Supabase password and run the script again.${NC}"
    exit 1
fi

# --- Setup Process ---

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing local containers (if any)...${NC}"
docker compose down -v --remove-orphans || true

# Build and start containers (Redis and management tools only)
echo -e "${YELLOW}🔨 Building and starting Docker containers (redis, pgadmin, redis-commander)...${NC}"
docker compose up -d redis pgadmin redis-commander

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
echo "  • Supabase PostgreSQL: Your remote Supabase database"
echo "  • Redis: localhost:6379"
echo "  • PgAdmin: http://localhost:5050 (Login with credentials from docker-compose.yml)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  • Ensure your GitHub OAuth and OpenAI API keys are set in 'apps/api/.env'"
echo ""
echo -e "${YELLOW}🚀 To start the API and Web app:${NC}"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}📖 API docs will be available at:${NC}"
echo "  http://localhost:3000/api"
echo ""
echo -e "${GREEN}Happy coding! 🎯${NC}"