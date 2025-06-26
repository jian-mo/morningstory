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

## What We're Building (Core Features - Planned)

*   **Smart Integrations:** Connects to your favorite Project Management tools (Asana, Jira, Trello, etc.) and Git hosting services (GitHub, GitLab).
*   **Activity Aggregation:** Automatically fetches your relevant activity – completed tasks, in-progress items, commits, pull requests, and blockers.
*   **LLM-Powered Summaries:** Uses Large Language Models (LLMs) to intelligently synthesize your activity into a concise draft for your standup, covering:
    *   What you did yesterday.
    *   What you plan to do today.
    *   Any blockers you're facing.
*   **Customizable Output:** Tailor the tone and format of your standup notes.
*   **Multiple Interfaces:** Access through a CLI, a web interface, and potentially chat bots (Slack, Teams).

## Tech Stack

*   **Backend:** TypeScript with NestJS (enterprise-grade, modular architecture)
*   **Database:** Supabase PostgreSQL with Prisma ORM
*   **Cache/Jobs:** Redis for sessions and caching
*   **Frontend (Web):** React 18 with TypeScript (coming soon)
*   **LLM:** OpenAI GPT-4 for intelligent standup generation
*   **Authentication:** JWT with GitHub OAuth integration
*   **Deployment:** Vercel (Frontend + API) 
*   **Infrastructure:** Docker containers, GitHub Actions CI/CD
*   **Monorepo:** Turbo for efficient builds and testing

## Current Status - MVP Complete! (100% ✅)

### ✅ MVP Features Complete
- **🏗️ Project Foundation**: Monorepo structure with TypeScript, ESLint, Prettier, Husky
- **🗄️ Database**: Supabase PostgreSQL with Prisma ORM and comprehensive schema  
- **🐳 Docker Setup**: Complete local development environment with Redis + PgAdmin + Redis Commander
- **🚀 NestJS API**: Modular architecture with Swagger documentation at `/api`
- **🔐 Authentication**: JWT + GitHub OAuth with secure session management
- **🔗 GitHub Integration**: Complete OAuth flow and API client for fetching commits, PRs, issues
- **🤖 OpenAI Integration**: Intelligent standup generation with 4 customizable tones (professional, casual, detailed, concise)
- **🔒 Security**: AES-256-GCM encryption for credential storage, secure token handling
- **🧪 Testing**: Comprehensive unit tests (13 tests, 100% auth coverage) + e2e framework
- **☁️ Supabase Integration**: Free tier PostgreSQL with production-ready configuration
- **📋 API Documentation**: Full Swagger/OpenAPI documentation with examples

### 🎯 Production Ready Features
- **Health Checks**: `/health` endpoint for monitoring
- **Rate Limiting**: 100 requests/minute per user
- **Error Handling**: Comprehensive error responses and logging
- **Validation**: Input validation with class-validator
- **CORS**: Configured for frontend integration
- **Environment**: Development, testing, and production configurations

## Getting Started

### Prerequisites
- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git

### Quick Start (Local Development)

1. **Clone and setup**
   ```bash
   git clone https://github.com/jian-mo/morningstory.git
   cd morningstory
   ```

2. **Run setup script**
   ```bash
   chmod +x scripts/setup-local.sh
   ./scripts/setup-local.sh
   ```

3. **Start the API**
   ```bash
   npm run dev
   ```

4. **Access services**
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api
   - PgAdmin: http://localhost:5050 (admin@morning-story.local / admin123)
   - Redis Commander: http://localhost:8081

### Production Deployment (Vercel)

1. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your database connection string
   - Run migrations: `npm run prisma:migrate`

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

### API Endpoints

#### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with email/password  
- `GET /auth/github` - Start GitHub OAuth flow
- `GET /auth/me` - Get current user profile

#### Integrations
- `GET /integrations` - List user integrations
- `DELETE /integrations/:type` - Remove integration

#### Standups
- `GET /standups` - Get standup history
- `GET /standups/today` - Get today's standup
- `POST /standups/generate` - Generate new standup
- `POST /standups/:id/regenerate` - Regenerate with new preferences
- `DELETE /standups/:id` - Delete standup

### Testing

```bash
# Run all unit tests (13 tests passing)
npm run test

# Run tests with coverage report
npm run test -- --coverage

# Run tests with verbose output
npm run test -- --verbose

# Run e2e tests (requires database)
npm run test:e2e
```

#### Test Results ✅
- **13 unit tests passing** across 2 test suites
- **100% coverage** on AuthService (authentication & JWT)
- **95.65% coverage** on IntegrationsService (encryption & storage)
- **Full security validation** for password hashing, encryption, and token management

## Core Features

### 🔐 Authentication System
- **Email/Password Registration**: Secure user accounts with bcrypt hashing
- **GitHub OAuth**: Complete OAuth 2.0 flow for GitHub integration
- **JWT Tokens**: Secure session management with configurable expiration
- **Rate Limiting**: Protection against brute force attacks

### 🔗 GitHub Integration
- **OAuth Flow**: `/auth/github` → automatic GitHub account linking
- **Activity Fetching**: Commits, pull requests, and issues from last 24 hours
- **Secure Storage**: Encrypted GitHub tokens with AES-256-GCM
- **Real-time Sync**: Automatic token refresh and validation

### 🤖 AI-Powered Standup Generation
- **OpenAI GPT-4**: Advanced language model for natural speech generation
- **4 Tone Options**: Professional, casual, detailed, or concise
- **3 Length Options**: Short (150 tokens), medium (300), long (500)
- **Custom Prompts**: User-defined additional instructions
- **Smart Context**: Automatically formats GitHub activity into readable updates

### 🗄️ Data Management
- **Supabase PostgreSQL**: Managed database with free tier + enterprise features
- **Redis**: High-performance caching and session storage
- **Encryption**: All sensitive data encrypted at rest
- **Backup Ready**: Database migrations and seeding configured

## Development Workflow

### 🛠️ Local Development
```bash
# One-command setup
./scripts/setup-local.sh

# Start development
npm run dev

# View logs
npm run docker:logs

# Reset database
npm run db:reset
```

### 🚀 Production Deployment
```bash
# Configure Supabase database
npm run prisma:migrate

# Deploy to Vercel
vercel --prod
```

### 📊 Monitoring & Debugging
```bash
# Check API health
curl http://localhost:3000/health

# View database (PgAdmin - connects to Supabase)
open http://localhost:5050

# Monitor Redis (Redis Commander)  
open http://localhost:8081

# API documentation
open http://localhost:3000/api
```

## Architecture Highlights

### 🏛️ Modular Design
- **Separation of Concerns**: Each module (auth, integrations, standups) is self-contained
- **Dependency Injection**: Clean, testable service architecture
- **Type Safety**: Full TypeScript coverage with strict configuration

### 🔒 Security First
- **Zero Trust**: All inputs validated, all outputs sanitized
- **Encryption**: AES-256-GCM for data at rest, HTTPS for data in transit
- **Authentication**: JWT with refresh tokens, OAuth 2.0 flows
- **Rate Limiting**: Protection against abuse and attacks

### ⚡ Performance Optimized
- **Caching**: Redis for session storage and API response caching
- **Connection Pooling**: Efficient database connection management
- **Async Operations**: Non-blocking I/O for external API calls
- **Monitoring**: Health checks and performance metrics ready

## Next Phase Roadmap

### 🎨 Frontend (Phase 2)
- React 18 application with TypeScript
- Modern UI with shadcn/ui components  
- Real-time standup preview
- Integration management dashboard
- Vercel deployment pipeline

### 🔧 CLI Tool (Phase 3)
- Command-line interface for power users
- Offline standup generation
- Configuration management
- CI/CD integration capabilities

### 📈 Analytics & Insights (Phase 4)
- Standup history and trends
- Team productivity metrics
- Integration usage analytics
- Cost optimization recommendations

---

## Contact & Support

**Project Maintainer**: [jian@theoriax.com](mailto:jian@theoriax.com)

**Repository**: [github.com/jian-mo/morningstory](https://github.com/jian-mo/morningstory)

---

**🎯 Morning Story MVP is production-ready!** Start generating intelligent standups today!
