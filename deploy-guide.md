# Vercel Deployment Guide

Choose your preferred deployment method:

## 🚀 Method 1: CLI-Based Deployment (Recommended)

Fast, automated, and developer-friendly deployment using command line tools.

### Prerequisites
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Quick Start (3 Commands)
```bash
# 1. Initialize Vercel projects
npm run vercel:init

# 2. Setup environment variables
npm run vercel:env api
npm run vercel:env web

# 3. Deploy to production
npm run deploy
```

### Detailed CLI Setup

**Step 1: Initialize Projects**
```bash
npm run vercel:init
```
This will:
- Install Vercel CLI if needed
- Create and link both web and API projects
- Set up proper project configuration

**Step 2: Environment Variables Setup**

**For API:**
```bash
npm run vercel:env api
```
You'll be prompted for:
- **Database URL**: PostgreSQL connection string
- **JWT Secret**: Auto-generated or custom (32+ chars)
- **Encryption Key**: Auto-generated or custom (32 chars)
- **GitHub Integration**: Client ID, Secret, App credentials (optional)

**For Web App:**
```bash
npm run vercel:env web
```
You'll be prompted for:
- **API URL**: Your deployed API endpoint

**Step 3: Deploy**
```bash
# Deploy everything to production
npm run deploy

# Or deploy specific components
npm run deploy:web      # Web app only
npm run deploy:api      # API only
npm run deploy:preview  # Preview deployment
```

### CLI Management Commands
```bash
# Check deployment status
npm run vercel:status

# View all deployments
vercel ls

# View environment variables
cd apps/api && vercel env ls
cd apps/web && vercel env ls

# View deployment logs
vercel logs <deployment-url>

# Redeploy
vercel --prod
```

### Environment Variables Storage
- **Location**: Vercel's encrypted cloud storage
- **Access**: Via CLI commands (not local files)
- **Security**: Never stored in Git or local .env files
- **Scope**: Environment-specific (production/preview/development)

---

## 🌐 Method 2: GitHub Integration (Dashboard)

Traditional deployment using Vercel dashboard with GitHub integration.

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Create Two Vercel Projects

**Web App (Frontend):**
- Import from GitHub: `your-username/standupbot`
- Project Name: `morning-story-web`
- Framework Preset: `Vite`
- Root Directory: `apps/web`
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)

**API (Backend):**
- Import from GitHub: `your-username/standupbot`
- Project Name: `morning-story-api`
- Framework Preset: `Other`
- Root Directory: `apps/api`
- Build Command: `npm run build`

### 3. Environment Variables (Dashboard)

**Web App Environment Variables:**
```
VITE_API_URL=https://morning-story-api.vercel.app
```

**API Environment Variables:**
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars
NODE_ENV=production

# Optional: GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_APP_ID=your-github-app-id
GITHUB_APP_NAME=your-github-app-name
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your-private-key-here
-----END RSA PRIVATE KEY-----"
```

**Environment Scope:**
- **Production** - Live deployment
- **Preview** - Branch previews
- **Development** - Local development

---

## 📦 Database Setup (Both Methods)

**Recommended: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Use in `DATABASE_URL` environment variable

**Connection String Format:**
```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Alternative: Railway, PlanetScale, or other PostgreSQL providers**

---

## 🔐 Security Configuration

**Generate Secure Secrets:**
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (32 characters)
openssl rand -hex 16
```

**Security Best Practices:**
- ✅ Never commit `.env` files with real secrets to Git
- ✅ Use environment-specific variables (production/preview/development)
- ✅ Rotate secrets periodically
- ✅ Use strong, unique passwords for database
- ✅ Verify SSL connections for database

---

## 🌍 Custom Domains (Optional)

**CLI Method:**
```bash
# Add domain
vercel domains add yourdomain.com

# Assign to project
cd apps/web
vercel --prod --domains yourdomain.com
```

**Dashboard Method:**
- Go to project settings
- Add custom domain
- Configure DNS records

---

## 🔄 Automated Deployment

**GitHub Actions Integration:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g vercel
      - run: ./scripts/deploy.sh all --production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring & Management

**Deployment Status:**
```bash
npm run vercel:status    # CLI method
# or visit Vercel dashboard
```

**View Logs:**
```bash
vercel logs <deployment-url>
vercel logs --follow <deployment-url>  # Real-time
```

**Environment Variables:**
```bash
vercel env ls            # List all
vercel env ls production # Production only
```

---

## 🆘 Troubleshooting

**Build Failures:**
```bash
# Check build logs
vercel logs <deployment-url>

# Redeploy with debug info
vercel --prod --debug
```

**Environment Variable Issues:**
```bash
# Verify variables are set
vercel env ls production

# Test database connection
psql "your-database-url"
```

**Common Issues:**
- Build fails: Check TypeScript errors and dependencies
- 404 on API: Verify API deployment and routing
- Database connection: Check connection string and firewall
- Environment variables not loading: Verify scope (production/preview)

---

## 🎯 Production Checklist

- [ ] Database configured and accessible
- [ ] All environment variables set for production
- [ ] Both web and API deployed successfully
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] GitHub App configured with production URLs
- [ ] Error monitoring configured
- [ ] Backup strategy implemented
- [ ] Team access configured

---

## 📈 Production URLs

After deployment, you'll get:
- **Web App**: `https://morning-story-web.vercel.app`
- **API**: `https://morning-story-api.vercel.app`

Update `VITE_API_URL` with your actual API URL after deployment.

---

## 💡 Recommendations

**For Development Teams**: Use CLI-based deployment for faster iteration
**For Simple Projects**: GitHub integration works great
**For Production**: Always use environment-specific variables
**For Scaling**: Consider custom domains and monitoring

Choose the method that best fits your workflow! 🚀