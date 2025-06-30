#!/bin/bash

# GitHub Secrets Setup Script
# Usage: ./scripts/setup-github-secrets.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 GitHub Secrets Setup for Vercel Deployment${NC}"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}📦 Installing GitHub CLI...${NC}"
    # Installation instructions for different systems
    echo "Please install GitHub CLI first:"
    echo "macOS: brew install gh"
    echo "Ubuntu: sudo apt install gh"
    echo "Windows: winget install GitHub.CLI"
    echo "Or visit: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 Please login to GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Function to set secret
set_secret() {
    local name=$1
    local value=$2
    local sensitive=${3:-false}
    
    if [ "$sensitive" = true ]; then
        echo -e "${YELLOW}Setting secret $name (hidden)...${NC}"
    else
        echo -e "${YELLOW}Setting secret $name${NC}"
    fi
    
    echo "$value" | gh secret set "$name"
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

echo -e "${YELLOW}🚀 Vercel Configuration${NC}"
echo "First, get these values from Vercel:"
echo "1. Go to https://vercel.com/account/tokens"
echo "2. Create new token"
echo "3. Go to https://vercel.com/[username]/settings"
echo "4. Copy Team/Organization ID"
echo ""

VERCEL_TOKEN=$(prompt_input "Vercel Token" "" true)
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" true

VERCEL_ORG_ID=$(prompt_input "Vercel Organization ID" "")
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"

echo ""
echo -e "${YELLOW}📦 Project IDs${NC}"
echo "Get these from your Vercel project settings:"
echo ""

VERCEL_PROJECT_ID_API=$(prompt_input "API Project ID" "")
set_secret "VERCEL_PROJECT_ID_API" "$VERCEL_PROJECT_ID_API"

VERCEL_PROJECT_ID_WEB=$(prompt_input "Web Project ID" "")
set_secret "VERCEL_PROJECT_ID_WEB" "$VERCEL_PROJECT_ID_WEB"

echo ""
echo -e "${YELLOW}🔗 Database Configuration${NC}"
DATABASE_URL=$(prompt_input "Database URL (PostgreSQL)" "" true)
set_secret "DATABASE_URL" "$DATABASE_URL" true

echo ""
echo -e "${YELLOW}🔐 Security Configuration${NC}"
JWT_SECRET=$(prompt_input "JWT Secret (32+ chars)" "$(openssl rand -base64 32)" true)
set_secret "JWT_SECRET" "$JWT_SECRET" true

ENCRYPTION_KEY=$(prompt_input "Encryption Key (32 chars)" "$(openssl rand -hex 16)" true)
set_secret "ENCRYPTION_KEY" "$ENCRYPTION_KEY" true

echo ""
echo -e "${YELLOW}🌐 API URL${NC}"
API_URL=$(prompt_input "API URL (custom domain or leave empty for auto)" "")
if [ -n "$API_URL" ]; then
    set_secret "API_URL" "$API_URL"
fi

echo ""
echo -e "${YELLOW}🔗 GitHub Integration (Optional)${NC}"
read -p "Setup GitHub OAuth? (y/n) [n]: " setup_github

if [[ $setup_github =~ ^[Yy]$ ]]; then
    GITHUB_CLIENT_ID=$(prompt_input "GitHub Client ID" "")
    set_secret "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
    
    GITHUB_CLIENT_SECRET=$(prompt_input "GitHub Client Secret" "" true)
    set_secret "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" true
    
    read -p "Setup GitHub App? (y/n) [n]: " setup_github_app
    
    if [[ $setup_github_app =~ ^[Yy]$ ]]; then
        GITHUB_APP_ID=$(prompt_input "GitHub App ID" "")
        set_secret "GITHUB_APP_ID" "$GITHUB_APP_ID"
        
        GITHUB_APP_NAME=$(prompt_input "GitHub App Name" "")
        set_secret "GITHUB_APP_NAME" "$GITHUB_APP_NAME"
        
        echo "Please paste your GitHub App Private Key (press Ctrl+D when done):"
        GITHUB_APP_PRIVATE_KEY=$(cat)
        set_secret "GITHUB_APP_PRIVATE_KEY" "$GITHUB_APP_PRIVATE_KEY" true
    fi
fi

echo ""
echo -e "${GREEN}✅ All secrets configured successfully!${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Push your code to trigger deployment:"
echo "   git push origin main"
echo ""
echo "2. Check deployment status:"
echo "   - GitHub Actions: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/actions"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "  gh secret list                    # List all secrets"
echo "  gh secret set SECRET_NAME        # Update a secret"
echo "  gh secret delete SECRET_NAME     # Delete a secret"