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
*   **Database:** PostgreSQL (primary) + Redis (caching/jobs)
*   **Frontend (Web):** React 18 with TypeScript (coming soon)
*   **LLM Interaction:** OpenAI GPT-4 via LangChain.js
*   **Authentication:** JWT with Passport.js strategies
*   **Infrastructure:** Docker, Docker Compose, Kubernetes-ready
*   **Monorepo:** Turbo for efficient builds

## Current Status - MVP Progress (65% Complete)

### ✅ Completed
- **Project Foundation**: Monorepo structure with TypeScript, ESLint, Prettier
- **Docker Environment**: PostgreSQL 15 + Redis 7 with health checks
- **Database Schema**: Comprehensive Prisma models for users, integrations, standups
- **NestJS API**: Modular architecture with Swagger documentation
- **Authentication System**: JWT auth with registration/login endpoints
- **Core Services**: User management, integration storage, standup CRUD operations

### 🚧 In Progress
- **GitHub Integration**: OAuth flow and API client for fetching commits, PRs, issues

### 📋 Coming Next
- OpenAI integration for intelligent standup generation
- Encryption service for secure credential storage
- Background job processing with BullMQ
- CLI tool for easy command-line access

## Getting Started

### Prerequisites
- Node.js 20+ and npm 10+
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/jian-mo/morningstory.git
   cd morningstory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the API**
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api

### API Endpoints

- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user profile
- `GET /integrations` - List user integrations
- `GET /standups` - Get standup history
- `GET /standups/today` - Get today's standup

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature suggestions, documentation, or code, we'd love your help.

*(Contribution guidelines will be added soon. In the meantime, feel free to open an issue!)*


## Contact

If you have any questions, feedback, or just want to chat about the project, feel free to reach out to us.

- Email: [jian@theoriax.com](mailto:jian@theoriax.com)

---

Let's make standups effortless!
