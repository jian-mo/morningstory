#!/bin/bash

# Environment Variables Setup Script for Vercel
# Usage: ./scripts/setup-env.sh [api|web] [--production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET="api"
ENVIRONMENT="production"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    api|web)
      TARGET="$1"
      shift
      ;;
    --production|--preview|--development)
      ENVIRONMENT="${1#--}"
      shift
      ;;
    --help)
      echo "Usage: $0 [api|web] [--production|--preview|--development]"
      echo "  api         Set up API environment variables"
      echo "  web         Set up Web app environment variables"
      echo "  --production Set for production environment (default)"
      echo "  --preview   Set for preview environment"
      echo "  --development Set for development environment"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🔧 Setting up environment variables${NC}"
echo -e "Target: ${YELLOW}$TARGET${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Function to set environment variable
set_env() {
    local name=$1
    local value=$2
    local sensitive=${3:-false}
    
    if [ "$sensitive" = true ]; then
        echo -e "${YELLOW}Setting $name (hidden)...${NC}"
    else
        echo -e "${YELLOW}Setting $name=$value${NC}"
    fi
    
    echo "$value" | vercel env add "$name" "$ENVIRONMENT" --force
}

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local default=$2
    local sensitive=${3:-false}
    
    if [ "$sensitive" = true ]; then
        read -s -p "$prompt: " input
        echo ""
    else
        read -p "$prompt${default:+ [$default]}: " input
    fi
    
    echo "${input:-$default}"
}

# Setup API environment variables
setup_api_env() {
    echo -e "${BLUE}📊 Setting up API environment variables...${NC}"
    cd apps/api
    
    echo -e "${YELLOW}🔗 Database Configuration${NC}"
    DATABASE_URL=$(prompt_input "Database URL (PostgreSQL)" "" true)
    set_env "DATABASE_URL" "$DATABASE_URL" true
    
    echo -e "${YELLOW}🔐 Security Configuration${NC}"
    JWT_SECRET=$(prompt_input "JWT Secret (32+ chars)" "$(openssl rand -base64 32)" true)
    set_env "JWT_SECRET" "$JWT_SECRET" true
    
    ENCRYPTION_KEY=$(prompt_input "Encryption Key (32 chars)" "$(openssl rand -hex 16)" true)
    set_env "ENCRYPTION_KEY" "$ENCRYPTION_KEY" true
    
    set_env "NODE_ENV" "production"
    
    echo -e "${YELLOW}🔗 GitHub Integration (Optional)${NC}"
    read -p "Setup GitHub integration? (y/n) [n]: " setup_github
    
    if [[ $setup_github =~ ^[Yy]$ ]]; then
        GITHUB_CLIENT_ID=$(prompt_input "GitHub Client ID" "")
        set_env "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
        
        GITHUB_CLIENT_SECRET=$(prompt_input "GitHub Client Secret" "" true)
        set_env "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" true
        
        read -p "Setup GitHub App? (y/n) [n]: " setup_github_app
        
        if [[ $setup_github_app =~ ^[Yy]$ ]]; then
            GITHUB_APP_ID=$(prompt_input "GitHub App ID" "")
            set_env "GITHUB_APP_ID" "$GITHUB_APP_ID"
            
            GITHUB_APP_NAME=$(prompt_input "GitHub App Name" "")
            set_env "GITHUB_APP_NAME" "$GITHUB_APP_NAME"
            
            echo "Please paste your GitHub App Private Key (press Ctrl+D when done):"
            GITHUB_APP_PRIVATE_KEY=$(cat)
            set_env "GITHUB_APP_PRIVATE_KEY" "$GITHUB_APP_PRIVATE_KEY" true
        fi
    fi
    
    cd ../..
}

# Setup Web environment variables
setup_web_env() {
    echo -e "${BLUE}🌐 Setting up Web environment variables...${NC}"
    cd apps/web
    
    VITE_API_URL=$(prompt_input "API URL" "https://your-api.vercel.app")
    set_env "VITE_API_URL" "$VITE_API_URL"
    
    cd ../..
}

# Main execution
case $TARGET in
    api)
        setup_api_env
        ;;
    web)
        setup_web_env
        ;;
esac

echo ""
echo -e "${GREEN}✅ Environment variables set successfully!${NC}"
echo -e "${BLUE}💡 Tip: Use 'vercel env ls' to see all environment variables${NC}"