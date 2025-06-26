#!/bin/bash

# Morning Story - Local Development Setup Script
set -e

echo "🚀 Setting up Morning Story local development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file. Please update it with your actual values.${NC}"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down -v || true

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
while ! docker-compose exec postgres pg_isready -U morning_story -d morning_story_dev > /dev/null 2>&1; do
    sleep 1
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
while ! docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

echo -e "${GREEN}✅ Redis is ready!${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Generate Prisma client and run migrations
echo -e "${YELLOW}🗄️  Setting up database schema...${NC}"
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..

echo -e "${GREEN}🎉 Local development environment is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 What's running:${NC}"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379" 
echo "  • PgAdmin: http://localhost:5050 (admin@morning-story.local / admin123)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo -e "${YELLOW}🚀 To start the API:${NC}"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}📖 To view API docs:${NC}"
echo "  http://localhost:3000/api"
echo ""
echo -e "${YELLOW}🧪 To run tests:${NC}"
echo "  npm run test"
echo "  npm run test:e2e"
echo ""
echo -e "${GREEN}Happy coding! 🎯${NC}"