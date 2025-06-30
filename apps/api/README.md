# Morning Story API

Serverless Express.js API for Vercel deployment.

## Deployment

This API is designed to be deployed independently to Vercel as a serverless function.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `ENCRYPTION_KEY` - Encryption key for sensitive data

## Endpoints

- `GET /health` - Health check
- `POST /auth/test-login` - Test authentication
- `GET /auth/me` - Get current user
- `GET /integrations` - List integrations
- `POST /integrations/github/connect` - Connect GitHub
- `POST /webhooks/github` - GitHub webhook handler