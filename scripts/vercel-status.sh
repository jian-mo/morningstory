#!/bin/bash

# Vercel Deployment Status Script
# Usage: ./scripts/vercel-status.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Vercel Deployment Status${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Please install: npm install -g vercel${NC}"
    exit 1
fi

# Function to show project status
show_project_status() {
    local name=$1
    local path=$2
    
    echo -e "${YELLOW}📋 $name Status:${NC}"
    cd "$path"
    
    # Get project info
    echo -e "${BLUE}Project:${NC}"
    vercel ls --scope $(whoami) 2>/dev/null | head -5
    
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    vercel env ls 2>/dev/null | head -10
    
    echo ""
    echo -e "${BLUE}Recent Deployments:${NC}"
    vercel ls 2>/dev/null | head -5
    
    cd - > /dev/null
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Show Web App Status
show_project_status "Web App" "apps/web"

# Show API Status
show_project_status "API" "apps/api"

echo -e "${GREEN}💡 Tips:${NC}"
echo -e "  ${YELLOW}Deploy:${NC} ./scripts/deploy.sh all --production"
echo -e "  ${YELLOW}Setup env:${NC} ./scripts/setup-env.sh api"
echo -e "  ${YELLOW}View logs:${NC} vercel logs <deployment-url>"
echo -e "  ${YELLOW}Redeploy:${NC} vercel --prod"