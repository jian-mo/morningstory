# GitHub App Implementation Guide

## Overview

The GitHub App integration provides the best user experience with one-click installation and automatic token management. This guide explains how the implementation works and how to set it up.

## How It Works

1. **User clicks "Install GitHub App"** in ConnectGitHub page
2. **API generates installation URL** with user state encoded
3. **User is redirected to GitHub** to select repositories and install
4. **GitHub redirects back** to our callback endpoint with installation_id
5. **API stores installation** and fetches accessible repositories
6. **User is redirected back** to frontend with success message

## API Endpoints

### GET /integrations/github/app/install
- **Purpose**: Get GitHub App installation URL with user state
- **Auth**: JWT required
- **Response**: `{ installationUrl: string }`

### GET /integrations/github/app/callback
- **Purpose**: Handle GitHub App installation callback
- **Query Params**: 
  - `installation_id`: GitHub installation ID
  - `setup_action`: GitHub action (install/update)
  - `state`: Base64 encoded user data
- **Response**: Redirects to frontend with success/error params

## Frontend Flow

```typescript
// ConnectGitHub.tsx
const handleGitHubAppConnect = async () => {
  const response = await fetch('/integrations/github/app/install', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const { installationUrl } = await response.json()
  window.location.href = installationUrl
}
```

## Environment Configuration

Add these to your `.env` file:

```bash
# GitHub App Configuration
GITHUB_APP_ID="123456"
GITHUB_APP_NAME="morning-story"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="webhook_secret"
FRONTEND_URL="http://localhost:3001"
```

## Setting Up a GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in basic information:
   - **App Name**: Morning Story
   - **Homepage URL**: Your app URL
   - **Callback URL**: `https://your-api.com/integrations/github/app/callback`

3. Set permissions:
   - **Repository permissions**:
     - Contents: Read
     - Issues: Read
     - Pull requests: Read
     - Commit statuses: Read
   - **Account permissions**:
     - Email addresses: Read

4. After creation, note down:
   - App ID
   - Private Key (download and convert to single line)
   - Client ID and Secret (for future OAuth if needed)

## Security Features

- **State Parameter**: Prevents CSRF by encoding user ID in installation URL
- **Installation Scoping**: Users can select specific repositories
- **Automatic Tokens**: No manual token management required
- **Rate Limits**: 5,000 requests/hour per installation (vs shared for OAuth)

## Error Handling

The callback endpoint handles various error scenarios:
- Missing state parameter
- Invalid installation ID
- GitHub API failures
- Database storage errors

All errors redirect to frontend with descriptive error codes.

## Testing

To test the GitHub App flow:

1. Ensure you have created a GitHub App (can be in development mode)
2. Update your `.env` with the App ID and private key
3. Start the API and frontend
4. Navigate to `/connect-github`
5. Click "Install GitHub App"
6. Complete the installation on GitHub
7. Verify you're redirected back with success message

## Benefits Over Personal Access Tokens

- ✅ **One-click setup** - no manual token creation
- ✅ **Repository selection** - users choose specific repos
- ✅ **Automatic tokens** - no expiration management
- ✅ **Higher rate limits** - per installation
- ✅ **Better security** - fine-grained permissions