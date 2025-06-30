#!/bin/bash

# Convert Local .env to GitHub Secrets
# Usage: ./scripts/local-env-to-secrets.sh [env-file]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENV_FILE=${1:-".env.production"}

echo -e "${BLUE}🔄 Converting Local .env to GitHub Secrets${NC}"
echo -e "Reading from: ${YELLOW}$ENV_FILE${NC}"
echo ""

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ File $ENV_FILE not found${NC}"
    echo ""
    echo "Please create a local .env file with your production values:"
    echo "Example .env.production:"
    echo ""
    cat << 'EOF'
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID_API=your-api-project-id
VERCEL_PROJECT_ID_WEB=your-web-project-id
API_URL=https://your-custom-api-domain.com
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_APP_ID=your-github-app-id
GITHUB_APP_NAME=your-github-app-name
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your-private-key-here
-----END RSA PRIVATE KEY-----"
EOF
    echo ""
    echo -e "${YELLOW}⚠️  Important: Add $ENV_FILE to .gitignore to avoid committing secrets${NC}"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Please install it first.${NC}"
    echo "Visit: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 Please login to GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Add to .gitignore if not already there
if [ ! -f ".gitignore" ] || ! grep -q "$ENV_FILE" .gitignore; then
    echo -e "${YELLOW}📝 Adding $ENV_FILE to .gitignore...${NC}"
    echo "$ENV_FILE" >> .gitignore
fi

# Function to set secret from env file
set_secret_from_env() {
    local var_name=$1
    local value=$(grep "^$var_name=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    
    if [ -n "$value" ]; then
        echo -e "${YELLOW}Setting $var_name...${NC}"
        echo "$value" | gh secret set "$var_name"
    else
        echo -e "${BLUE}⏭️  Skipping $var_name (not found in $ENV_FILE)${NC}"
    fi
}

# Required secrets
echo -e "${BLUE}🔐 Setting required secrets...${NC}"
set_secret_from_env "VERCEL_TOKEN"
set_secret_from_env "VERCEL_ORG_ID"
set_secret_from_env "VERCEL_PROJECT_ID_API"
set_secret_from_env "VERCEL_PROJECT_ID_WEB"
set_secret_from_env "DATABASE_URL"
set_secret_from_env "JWT_SECRET"
set_secret_from_env "ENCRYPTION_KEY"

# Optional secrets
echo ""
echo -e "${BLUE}🔗 Setting optional secrets...${NC}"
set_secret_from_env "FRONTEND_URL"
set_secret_from_env "API_URL"
set_secret_from_env "GITHUB_CLIENT_ID"
set_secret_from_env "GITHUB_CLIENT_SECRET"
set_secret_from_env "GITHUB_APP_ID"
set_secret_from_env "GITHUB_APP_NAME"
set_secret_from_env "GITHUB_WEBHOOK_SECRET"
set_secret_from_env "GITHUB_APP_PRIVATE_KEY"

echo ""
echo -e "${GREEN}✅ Environment variables converted to GitHub Secrets!${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Verify secrets were set:"
echo "   gh secret list"
echo ""
echo "2. Push your code to trigger deployment:"
echo "   git add . && git commit -m 'Setup GitHub Actions deployment'"
echo "   git push origin main"
echo ""
echo "3. Monitor deployment:"
echo "   - GitHub Actions: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/actions"
echo ""
echo -e "${YELLOW}⚠️  Security reminder: $ENV_FILE contains sensitive data. Keep it secure and never commit it.${NC}"