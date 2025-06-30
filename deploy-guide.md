# Vercel Deployment Guide

## 1. Push to GitHub
```bash
git push origin main
```

## 2. Create Two Vercel Projects

### Web App (Frontend)
- **Import from GitHub**: `your-username/standupbot`
- **Project Name**: `morning-story-web`
- **Framework Preset**: `Vite`
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### API (Backend)  
- **Import from GitHub**: `your-username/standupbot`
- **Project Name**: `morning-story-api`
- **Framework Preset**: `Other`
- **Root Directory**: `apps/api`
- **Build Command**: `npm run build`

## 3. Environment Variables

### Web App Environment Variables
```
VITE_API_URL=https://morning-story-api.vercel.app
```

### API Environment Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars
NODE_ENV=production

# Optional: GitHub Integration (set these after creating GitHub App)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_APP_ID=your-github-app-id
GITHUB_APP_NAME=your-github-app-name
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your-private-key-here
-----END RSA PRIVATE KEY-----"
```

## 4. Database Setup
Set up a PostgreSQL database (recommend Supabase):
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Add `DATABASE_URL` to API environment variables
4. Database migrations will run automatically on first deployment

## 5. GitHub App Setup (After Deployment)
Once deployed, create GitHub App with these URLs:
- **Homepage**: `https://morning-story-web.vercel.app`
- **Callback**: `https://morning-story-api.vercel.app/auth/github/callback`
- **Webhook**: `https://morning-story-api.vercel.app/webhooks/github`

## 6. Auto-Deployment
- Push to `main` branch → Auto-deploy to production
- Create PR → Auto-deploy preview
- All branches get preview deployments

## Production URLs
After deployment, you'll get:
- **Web App**: `https://morning-story-web.vercel.app`
- **API**: `https://morning-story-api.vercel.app`

Update `VITE_API_URL` with your actual API URL after deployment.