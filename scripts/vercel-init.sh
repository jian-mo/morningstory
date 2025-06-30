#!/bin/bash

# Vercel Project Initialization Script
# Usage: ./scripts/vercel-init.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initializing Vercel Projects${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Function to initialize a project
init_project() {
    local name=$1
    local path=$2
    local framework=${3:-"other"}
    
    echo -e "${BLUE}🔧 Initializing $name...${NC}"
    cd "$path"
    
    # Link to existing project or create new one
    vercel --yes
    
    cd - > /dev/null
    echo -e "${GREEN}✅ $name initialized${NC}"
}

# Initialize Web App
echo -e "${YELLOW}📱 Setting up Web App...${NC}"
init_project "Web App" "apps/web" "vite"

echo ""

# Initialize API
echo -e "${YELLOW}🔧 Setting up API...${NC}"
init_project "API" "apps/api" "other"

echo ""
echo -e "${GREEN}🎉 Projects initialized successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Set up environment variables:${NC} ./scripts/setup-env.sh api"
echo -e "2. ${YELLOW}Set up web environment:${NC} ./scripts/setup-env.sh web"
echo -e "3. ${YELLOW}Deploy:${NC} ./scripts/deploy.sh all --production"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo -e "  vercel ls                  # List all deployments"
echo -e "  vercel env ls              # List environment variables"
echo -e "  vercel logs <url>          # View deployment logs"
echo -e "  vercel domains             # Manage custom domains"