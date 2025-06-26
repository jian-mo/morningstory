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
*   **Database:** AWS RDS PostgreSQL with Prisma ORM
*   **Cache/Jobs:** AWS ElastiCache Redis
*   **Frontend (Web):** React 18 with TypeScript (coming soon)
*   **LLM:** OpenAI GPT-4 for intelligent standup generation
*   **Authentication:** JWT with GitHub OAuth integration
*   **Deployment:** AWS ECS (API) + Vercel (Frontend)
*   **Infrastructure:** Docker containers, GitHub Actions CI/CD
*   **Monorepo:** Turbo for efficient builds and testing

## Current Status - MVP Progress (95% Complete)

### ✅ Completed
- **Project Foundation**: Monorepo structure with TypeScript, ESLint, Prettier  
- **Database**: AWS RDS PostgreSQL with Prisma ORM and comprehensive schema
- **Docker Setup**: Complete local development environment with PostgreSQL + Redis
- **NestJS API**: Modular architecture with Swagger documentation
- **Authentication**: JWT + GitHub OAuth with secure token management
- **GitHub Integration**: Full OAuth flow and API client for activity fetching
- **OpenAI Integration**: Intelligent standup generation with customizable prompts
- **Security**: AES-256 encryption for credential storage
- **Testing**: Comprehensive unit and e2e test suite
- **AWS Infrastructure**: RDS, ElastiCache, ECS configuration with deployment scripts

### 📋 Final Steps
- React frontend with Vercel deployment
- Background job processing with BullMQ
- CLI tool for command-line usage

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

### Production Deployment (AWS)

1. **Configure AWS CLI**
   ```bash
   aws configure
   # or
   aws sso login
   ```

2. **Set environment variables**
   ```bash
   export AWS_ACCOUNT_ID=your-account-id
   export AWS_REGION=us-west-2
   ```

3. **Deploy to AWS**
   ```bash
   ./scripts/deploy-aws.sh
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
# Run unit tests
npm run test

# Run e2e tests  
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature suggestions, documentation, or code, we'd love your help.

*(Contribution guidelines will be added soon. In the meantime, feel free to open an issue!)*


## Contact

If you have any questions, feedback, or just want to chat about the project, feel free to reach out to us.

- Email: [jian@theoriax.com](mailto:jian@theoriax.com)

---

Let's make standups effortless!
