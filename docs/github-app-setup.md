# GitHub App Setup Guide

## Why GitHub Apps?

GitHub Apps are the recommended way to integrate with GitHub:
- ✅ Users just click "Install" - no token management
- ✅ Fine-grained permissions per repository
- ✅ Automatic token refresh
- ✅ Higher rate limits (5,000 requests/hour)
- ✅ Works for both personal and organization accounts

## How It Works

```mermaid
sequenceDiagram
    participant User
    participant MorningStory
    participant GitHub
    
    User->>MorningStory: Clicks "Connect GitHub"
    MorningStory->>GitHub: Redirects to App Installation
    GitHub->>User: "Install Morning Story on repositories?"
    User->>GitHub: Selects repos and clicks Install
    GitHub->>MorningStory: Installation complete + Installation ID
    MorningStory->>GitHub: Requests Installation Token
    GitHub->>MorningStory: Returns temporary access token
    MorningStory->>User: ✅ Connected!
```

## Implementation Steps

### 1. Create a GitHub App

Go to https://github.com/settings/apps/new

**Basic Information:**
- **GitHub App name**: Morning Story
- **Homepage URL**: https://your-app.com
- **Webhook URL**: https://your-app.com/api/webhooks/github (optional)

**Permissions:**
- **Repository permissions:**
  - Contents: Read
  - Issues: Read  
  - Pull requests: Read
  - Commit statuses: Read
- **Account permissions:**
  - Email addresses: Read

**Where can this GitHub App be installed?**
- Any account (for public app)

### 2. After Creation

You'll receive:
- **App ID**: Public identifier
- **Client ID**: For OAuth flow
- **Client Secret**: For OAuth flow
- **Private Key**: For generating JWT tokens

### 3. Environment Variables

```bash
# GitHub App Configuration
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_CLIENT_ID="Iv1.abc123"
GITHUB_APP_CLIENT_SECRET="secret123"
GITHUB_APP_WEBHOOK_SECRET="webhook_secret"
```

### 4. Installation Flow

Users will:
1. Click "Connect GitHub" in your app
2. Get redirected to: `https://github.com/apps/your-app-name/installations/new`
3. Choose repositories to grant access
4. Get redirected back to your app
5. You receive an `installation_id` to fetch data

## Benefits Over Personal Access Tokens

| Feature | Personal Access Token | GitHub App |
|---------|---------------------|------------|
| Setup | Manual token creation | One-click install |
| Permissions | All or nothing | Per-repository |
| Token Management | User manages | Automatic |
| Rate Limits | 5,000/hour (shared) | 5,000/hour per installation |
| Expiration | Manual renewal | Auto-refresh |
| Repository Access | All user repos | Selected repos only |