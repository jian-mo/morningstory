# What's the Glory, Morning Story? 🤖

## Tired of the Pre-Standup Scramble? We're Building a Solution!

This is an open-source **Morning Story** designed to help you and your team automate the preparation for daily standup meetings. Spend less time digging through tasks and commits, and more time focusing on your work!

We're **building this project in public**, sharing our progress, challenges, and learnings along the way. Follow our journey!

## The Problem

Do you often find yourself:
*   Forgetting what you accomplished yesterday?
*   Scrambling through multiple platforms (GitHub, Jira, Asana, Slack, etc.) just minutes before your standup?
*   Delivering incomplete or rushed updates?

This bot aims to solve that!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Local Development Setup (2 minutes)

1. **Clone and install:**
   ```bash
   git clone https://github.com/jian-mo/morningstory.git
   cd morningstory
   npm install
   ```

2. **Start the development environment:**
   ```bash
   ./scripts/setup-local.sh
   ```

3. **Start the applications:**
   ```bash
   # Option A: Start both (recommended)
   npm run dev
   
   # Option B: Start individually
   npm run dev:api    # Backend (port 3000)
   npm run dev:web    # Frontend (port 3001)
   ```

4. **Open your browser:**
   - **Web App**: http://localhost:3001
   - **API Docs**: http://localhost:3000/api
   - **PgAdmin**: http://localhost:5050

### Production Deployment

For production deployment to Vercel, see our comprehensive guides:
- **[Complete Deployment Guide](deploy-guide.md)** - All deployment methods
- **[GitHub Actions Setup](GITHUB_ACTIONS_DEPLOYMENT.md)** - Automated CI/CD
- **[Supabase Configuration](SUPABASE_SETUP.md)** - Database setup

#### Quick Production Deploy
```bash
# 1. Setup environment variables
cp .env.production.example .env.production
# Edit with your values (Supabase, Vercel tokens, etc.)

# 2. Upload to GitHub Secrets
npm run secrets:upload

# 3. Deploy via GitHub Actions
git push origin main
```

### Getting Started

1. **Login**: Click "Get Started" on the login page
2. **Connect GitHub**: 
   - Go to Integrations page
   - Click "Connect" on GitHub card
   - Choose Personal Access Token or GitHub App method
3. **Generate Standups**: Your GitHub activity will be used to generate standups!

## 🌐 Live Demo

**🌐 Fixed Production URLs:**

- **🚀 Web App**: https://morning-story-web.vercel.app  
- **🔧 API**: https://morning-story-api.vercel.app

**Current Status**: 
- 🎉 **FIXED DOMAINS WORKING!** Both apps accessible with predictable URLs
- ✅ **Backend**: Express.js API at https://morning-story-api.vercel.app
- ✅ **Frontend**: React app at https://morning-story-web.vercel.app  
- ✅ **API Connection**: Frontend connects to fixed API domain (no localhost)
- ✅ **Environment**: Production database and secrets properly configured
- 🚀 **Public Access**: Fixed domains work publicly!

**🎯 Easy Deployment**:
Deploy with fixed, predictable URLs - no manual configuration needed:

```bash
# 1. Clone and setup
git clone https://github.com/jian-mo/morningstory.git
cd morningstory

# 2. Deploy API (gets fixed domain: morning-story-api.vercel.app)
cd apps/api
vercel --prod --yes

# 3. Deploy Web App (automatically connects to API)
cd ../web  
vercel --prod --yes
```

**🌟 Benefits of Fixed Domains**:
- ✅ **Predictable URLs**: Always know where your app is deployed
- ✅ **No Manual Config**: Frontend automatically connects to API
- ✅ **Easy Updates**: Redeploy without changing any URLs
- ✅ **Simple Sharing**: Consistent URLs for demos and documentation

## 🔐 GitHub Connection Methods

### 1. GitHub Apps (Recommended) ⭐
**One-click installation** - users just click "Install":

**Setup**: Create GitHub App at [github.com/settings/apps/new](https://github.com/settings/apps/new)
- **Webhook URL**: `https://api-avwjnzlcf-bigjos-projects.vercel.app/webhooks/github`
- **Homepage URL**: `https://web-q0qt98ier-bigjos-projects.vercel.app`
- **Permissions**: Contents (Read), Pull requests (Read), Issues (Read)

**Pros:**
- ✅ **One-click setup** - no manual token creation
- ✅ **Fine-grained permissions** - per repository
- ✅ **Automatic token refresh** - never expires
- ✅ **Higher rate limits** - 5,000 requests/hour per installation
- ✅ **Best security** - tokens are temporary and scoped

### 2. Personal Access Tokens (Alternative)
**Manual but simple** - users create their own tokens:

**How to setup:**
1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Required permissions: `repo`, `user:email`, `read:org`
3. Copy token and paste in the app

**Pros:**
- ✅ **No app setup required** - works immediately
- ✅ **User control** - they manage their own tokens
- ✅ **Simple implementation** - just API calls

## Tech Stack

### Production Stack
*   **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
*   **Backend:** Express.js (serverless) / NestJS (full-featured)
*   **Database:** Supabase PostgreSQL with Prisma ORM
*   **Authentication:** JWT with GitHub OAuth integration
*   **Deployment:** Vercel (Frontend + API) with GitHub Actions CI/CD
*   **AI:** OpenAI GPT-4 for intelligent standup generation

### Development Stack
*   **Monorepo:** Turbo for efficient builds and testing
*   **Cache/Jobs:** Redis for sessions and caching
*   **Infrastructure:** Docker containers for local development
*   **Testing:** Jest (Backend) + Vitest (Frontend) with comprehensive coverage

## Current Status - Phase 2 Complete! ✅

### ✅ **Frontend App** - Production Ready
- **⚛️ React Foundation**: Modern React 18 + TypeScript + Vite setup with Tailwind CSS
- **🎨 OAuth Integration Pages**: Complete integration management dashboard with professional UI
- **🔗 Platform Connections**: Support for GitHub, Jira, Asana, Trello, GitLab, Slack integrations
- **🔐 Authentication Context**: JWT token management with auto-refresh and error handling
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🧪 Frontend Testing**: Comprehensive test suite covering all components
- **⚡ API Integration**: Ready-to-use API client with React Query for state management

### ✅ **Backend API** - Production Ready
- **🏗️ Serverless API**: Simple Express.js API optimized for Vercel deployment
- **🗄️ Database**: PostgreSQL with Prisma ORM and comprehensive schema
- **🐳 Docker Setup**: Complete local development environment with PostgreSQL + Redis
- **🔐 Authentication**: JWT + GitHub OAuth with secure session management
- **🔗 GitHub Integration**: Complete OAuth flow and API client for fetching commits, PRs, issues
- **🔒 Security**: Secure token handling and CORS configuration
- **📋 API Documentation**: Full Swagger/OpenAPI documentation

### ✅ **Deployment & DevOps** - Production Ready
- **🚀 GitHub Actions**: Automated CI/CD with environment management
- **🔐 Secret Management**: Encrypted GitHub Secrets with local .env workflow
- **🌐 Vercel Deployment**: Optimized for serverless deployment with proper configuration
- **📊 Monitoring**: Health checks, logging, and deployment status tracking
- **🔧 Developer Experience**: One-command setup, automated testing, comprehensive documentation

## Architecture

### 🏛️ Production Deployment
```
GitHub → GitHub Actions → Vercel (API + Web)
   ↓         ↓              ↓
Secrets → Environment → Supabase Database
```

### 🛠️ Local Development
```
Docker (PostgreSQL + Redis) → API (Express/NestJS) → Web (React)
```

### 🔒 Security Features
- **Zero Trust**: All inputs validated, all outputs sanitized
- **Encryption**: Secure secret management with GitHub Secrets
- **Authentication**: JWT with refresh tokens, OAuth 2.0 flows
- **CORS**: Properly configured for frontend-backend communication

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api` - API documentation
- `POST /auth/test-login` - Test authentication
- `GET /auth/me` - Get current user profile
- `GET /integrations` - List user integrations
- `POST /webhooks/github` - GitHub webhook handler

### GitHub Integration
- `GET /integrations/github/app/install` - GitHub App installation status
- `POST /integrations/github/connect` - Connect via Personal Access Token

## Testing

### Run Tests
```bash
# Run all tests
npm run test

# Run backend tests
npm run test:api

# Run frontend tests  
npm run test:web

# Run with coverage
npm run test:coverage
```

### Test Results ✅
- **Frontend**: 48 tests with comprehensive component coverage
- **Backend**: 13 tests with security and authentication validation
- **E2E**: API endpoint testing and integration flows

## Deployment Options

### ⚡ Method 1: CLI Deployment (Recommended)
**Direct deployment using Vercel CLI - what we use for live demo**

```bash
# 1. Get Vercel token from vercel.com/account/tokens
# 2. Deploy API
cd apps/api
vercel --token YOUR_TOKEN --prod --yes

# 3. Deploy Web (with API URL)
cd apps/web
vercel env add VITE_API_URL production
vercel --token YOUR_TOKEN --prod --yes
```

**Features:**
- ✅ **Instant deployment** - deploy in minutes
- ✅ **Independent apps** - API and web deployed separately
- ✅ **Simple environment setup** - direct token authentication
- ✅ **Individual project control** - separate Vercel projects

### 🔥 Method 2: GitHub Actions
**Automated deployment with encrypted secrets**

```bash
# Setup (one-time)
cp .env.production.example .env.production
npm run secrets:upload
git push origin main
```

**Features:**
- ✅ **Local .env files** (never committed to Git)
- ✅ **Encrypted GitHub Secrets** storage
- ✅ **Auto-deploy on push** to main branch
- ✅ **Preview deployments** for PRs

### 🌐 Method 3: Dashboard Deployment
**Traditional deployment via Vercel dashboard**

Import repository from GitHub and configure via web interface.

## Development Commands

### Setup & Development
```bash
./scripts/setup-local.sh    # One-command local setup
npm run dev                 # Start both API and web
npm run dev:api             # Backend only
npm run dev:web             # Frontend only
```

### Deployment & Management
```bash
npm run deploy              # Deploy to production
npm run secrets:upload      # Upload .env to GitHub Secrets
npm run vercel:status       # Check deployment status
```

### Database & Infrastructure
```bash
npm run db:migrate          # Run database migrations
npm run db:generate         # Generate Prisma client
npm run docker:up           # Start local services
npm run docker:logs         # View service logs
```

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check deployment logs
vercel logs <deployment-url>

# Check GitHub Actions
gh run view --web
```

**Environment Variables:**
```bash
# List GitHub Secrets
gh secret list

# Verify Vercel environment
vercel env ls production
```

**Local Development:**
```bash
# Reset everything
docker compose down -v
npm run setup

# Check service status
docker compose ps
```

### Debug Commands
```bash
# Check API health
curl http://localhost:3000/health

# View database (PgAdmin)
open http://localhost:5050

# Monitor Redis
open http://localhost:8081

# API documentation
open http://localhost:3000/api
```

## Next Phase Roadmap

### 🤖 AI Standup Generation (Phase 3)
- OpenAI GPT-4 integration for intelligent standup generation
- Multiple tone options (professional, casual, detailed, concise)
- Custom prompts and personalization
- Standup history and analytics

### 🔧 Platform Integrations (Phase 4)
- Jira, Asana, Trello integration
- Slack bot for automated standup delivery
- Calendar integration for meeting scheduling
- Team collaboration features

### 📈 Analytics & Insights (Phase 5)
- Team productivity metrics
- Integration usage analytics
- Standup quality improvements
- Cost optimization recommendations

---

## Contact & Support

**Project Maintainer**: [jian@theoriax.com](mailto:jian@theoriax.com)

**Repository**: [github.com/jian-mo/morningstory](https://github.com/jian-mo/morningstory)

**Documentation**:
- [Deployment Guide](deploy-guide.md)
- [GitHub Actions Setup](GITHUB_ACTIONS_DEPLOYMENT.md)
- [Supabase Configuration](SUPABASE_SETUP.md)

---

## 🎯 Project Status Summary

### **✅ Production Ready (Phase 1 & 2)**
- **✅ Full-Stack Application**: React frontend + Express.js backend
- **✅ GitHub Integration**: OAuth flow + Personal Access Token support
- **✅ Deployment Pipeline**: GitHub Actions + Vercel with secret management
- **✅ Database**: Supabase PostgreSQL with Prisma ORM
- **✅ Authentication**: JWT + GitHub OAuth with secure token handling
- **✅ Developer Experience**: One-command setup, comprehensive testing, detailed docs
- **✅ Production Deployment**: Live on Vercel with proper monitoring

### **🚀 Ready to Use**
1. **For Developers**: Clone → Setup → Deploy in under 10 minutes
2. **For Teams**: Production-ready with proper secret management
3. **For Contributors**: Well-documented, tested, and easy to extend

**🎉 Morning Story is production-ready!** Deploy to Vercel and start automating your standups today!