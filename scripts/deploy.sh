#!/bin/bash

# Morning Story Deployment Script
# Usage: ./scripts/deploy.sh [web|api|all] [--production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET="all"
ENVIRONMENT="preview"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    web|api|all)
      TARGET="$1"
      shift
      ;;
    --production)
      ENVIRONMENT="production"
      shift
      ;;
    --help)
      echo "Usage: $0 [web|api|all] [--production]"
      echo "  web         Deploy only web app"
      echo "  api         Deploy only API"
      echo "  all         Deploy both (default)"
      echo "  --production Deploy to production (default: preview)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 Morning Story Deployment${NC}"
echo -e "Target: ${YELLOW}$TARGET${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Function to deploy web app
deploy_web() {
    echo -e "${BLUE}📱 Deploying Web App...${NC}"
    cd apps/web
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    cd ../..
    echo -e "${GREEN}✅ Web app deployed successfully${NC}"
}

# Function to deploy API
deploy_api() {
    echo -e "${BLUE}🔧 Deploying API...${NC}"
    cd apps/api
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    cd ../..
    echo -e "${GREEN}✅ API deployed successfully${NC}"
}

# Deploy based on target
case $TARGET in
    web)
        deploy_web
        ;;
    api)
        deploy_api
        ;;
    all)
        deploy_web
        deploy_api
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}💡 Tip: Use 'vercel ls' to see all deployments${NC}"