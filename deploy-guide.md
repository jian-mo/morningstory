# Vercel Deployment Guide

Choose your preferred deployment method:

## ⚡ Method 1: CLI Deployment (Recommended)

**Best approach**: Direct deployment using Vercel CLI - simple, fast, and reliable.

**🌐 Live Demo**: See it in action at:
- **Web**: https://web-q0qt98ier-bigjos-projects.vercel.app  
- **API**: https://api-avwjnzlcf-bigjos-projects.vercel.app

### Why This Method?
✅ **Instant deployment** - Deploy in under 5 minutes  
✅ **Independent apps** - API and web deployed separately  
✅ **Simple setup** - Just need a Vercel token  
✅ **Direct control** - Deploy exactly when you want  
✅ **Environment isolation** - Each app has its own settings  

### Quick Start (4 Steps)
```bash
# 1. Get Vercel token from vercel.com/account/tokens

# 2. Deploy API (replace YOUR_TOKEN)
cd apps/api
vercel --token YOUR_TOKEN --prod --yes

# 3. Deploy Web App with API URL
cd apps/web
echo "https://your-api-url.vercel.app" | vercel env add VITE_API_URL production --force --token YOUR_TOKEN
vercel --token YOUR_TOKEN --prod --yes

# 4. Make projects public (optional, for demos)
# Visit vercel.com → Project Settings → Make public
```

### Detailed Setup

**Step 1: Get Required Information**

**Vercel Configuration:**
- **Token**: [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create new token
- **Org ID**: [vercel.com/teams/settings](https://vercel.com/teams/settings) → Copy Team/Organization ID
- **Project IDs**: Go to each project settings → Copy Project ID

**Database:**
- **Supabase** (recommended): [supabase.com](https://supabase.com) → Create project → Get connection string

**Step 2: Create Local Environment File**
```bash
# Copy example
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Example .env.production:**
```env
# Vercel Configuration
VERCEL_TOKEN=vercel_1a2b3c4d5e6f...
VERCEL_ORG_ID=team_abc123def456
VERCEL_PROJECT_ID_API=prj_abc123def456ghi789
VERCEL_PROJECT_ID_WEB=prj_xyz789abc123def456

# Database
DATABASE_URL=postgresql://postgres.xyz:pass@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Security (auto-generated with openssl)
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long
ENCRYPTION_KEY=1234567890abcdef1234567890abcdef

# Optional: Custom API domain
API_URL=https://api.yourdomain.com

# Optional: GitHub Integration
GITHUB_CLIENT_ID=abc123def456
GITHUB_CLIENT_SECRET=secret_abc123def456xyz789
```

**Step 3: Upload to GitHub Secrets**
```bash
# Automated upload
npm run secrets:upload

# Or interactive setup
npm run secrets:setup
```

**Step 4: Deploy**
```bash
# Production deployment
git push origin main

# Preview deployment
git checkout -b feature/new-feature
git push origin feature/new-feature
```

### Deployment Flow
```
Local .env → GitHub Secrets → GitHub Actions → Vercel
```

1. **Local .env** → Your sensitive values (never committed)
2. **GitHub Secrets** → Encrypted storage in GitHub
3. **GitHub Actions** → Reads secrets, deploys to Vercel
4. **Vercel** → Live with environment variables

### Management Commands
```bash
# Secrets management
npm run secrets:upload      # Upload .env to GitHub Secrets
npm run secrets:setup       # Interactive secrets setup

# Deployment monitoring
gh run list                 # View GitHub Actions runs
gh secret list              # List GitHub Secrets
vercel logs <url>           # View deployment logs

# Update secrets
# Edit .env.production, then:
npm run secrets:upload
```

---

## 🔥 Method 2: GitHub Actions with Local .env

Automated deployment with encrypted secrets - great for teams.

### Why This Method?
✅ **Automated** - Push to deploy  
✅ **Team-friendly** - Easy collaboration without sharing secrets  
✅ **Branch-based** - Production & preview deployments  
✅ **Secure** - Secrets encrypted in GitHub  

### Quick Start
```bash
# 1. Create local environment file
cp .env.production.example .env.production
# Edit with your real values

# 2. Upload to GitHub Secrets
npm run secrets:upload

# 3. Push to deploy
git push origin main
```

### Management Commands
```bash
# Secrets management
npm run secrets:upload      # Upload .env to GitHub Secrets
npm run secrets:setup       # Interactive secrets setup

# Deployment monitoring
gh run list                 # View GitHub Actions runs
gh secret list              # List GitHub Secrets
```

---

## 🌐 Method 3: GitHub Integration (Dashboard)

Traditional approach using Vercel dashboard with GitHub integration.

### Setup
1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import Projects**
   - Go to [vercel.com](https://vercel.com)
   - Import repository twice (web & API)
   - Configure root directories and build settings

3. **Environment Variables**
   - Set via Vercel dashboard
   - Add for production/preview/development scopes

---

## 📦 Database Setup (All Methods)

**Recommended: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Settings → Database → Copy connection string
4. Use in `DATABASE_URL`

**Connection String Format:**
```
postgresql://postgres.xyz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Alternatives:** Railway, PlanetScale, Neon, or any PostgreSQL provider

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
- ✅ Never commit `.env.production` to Git
- ✅ Use environment-specific variables
- ✅ Rotate secrets periodically
- ✅ Use strong database passwords
- ✅ Verify SSL connections

---

## 🌍 Custom Domains (Optional)

**CLI Method:**
```bash
vercel domains add yourdomain.com
cd apps/web && vercel --prod --domains yourdomain.com
```

**Dashboard Method:**
- Project settings → Domains → Add custom domain

---

## 🔄 Deployment Method Comparison

| Feature | CLI | GitHub Actions | Dashboard |
|---------|-----|---------------|-----------|
| **Setup Time** | 2 minutes | 5 minutes | 10 minutes |
| **Simplicity** | ✅ Easiest | ⚠️ Medium | ⚠️ Complex |
| **Auto Deploy** | ❌ Manual | ✅ On push | ✅ On push |
| **Preview PRs** | ❌ Manual | ✅ Automatic | ✅ Automatic |
| **Team Friendly** | ⚠️ Good | ✅ Best | ✅ Good |
| **Control** | ✅ Direct | ⚠️ Automated | ⚠️ Dashboard |

---

## 📊 Monitoring & Management

**GitHub Actions (Method 1):**
```bash
gh run list                    # View deployments
gh run view <id>               # View specific run
gh secret list                # List secrets
```

**Vercel (All Methods):**
```bash
vercel ls                      # List deployments
vercel logs <url>              # View logs
vercel env ls production       # List env vars
```

---

## 🆘 Troubleshooting

**Build Failures:**
```bash
# GitHub Actions
gh run view --web

# Vercel
vercel logs <deployment-url>
```

**Environment Issues:**
```bash
# Check secrets
gh secret list

# Verify Vercel received them
vercel env ls production

# Test database connection
psql "your-database-url"
```

**Common Issues:**
- **Missing secrets**: Re-run `npm run secrets:upload`
- **Wrong project IDs**: Check Vercel project settings
- **Database connection**: Verify URL format and firewall
- **GitHub CLI**: Install with `brew install gh` (macOS) or visit [cli.github.com](https://cli.github.com)

---

## 🎯 Production Checklist

**GitHub Actions Method:**
- [ ] `.env.production` created locally (not committed)
- [ ] GitHub Secrets uploaded
- [ ] Database accessible from Vercel
- [ ] GitHub Actions workflow enabled
- [ ] Test deployment successful

**CLI Method:**
- [ ] Vercel CLI installed and authenticated
- [ ] Projects initialized
- [ ] Environment variables set via CLI
- [ ] Test deployment successful

**Dashboard Method:**
- [ ] Projects imported from GitHub
- [ ] Environment variables set in dashboard
- [ ] Build settings configured
- [ ] Test deployment successful

**All Methods:**
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active
- [ ] Error monitoring configured
- [ ] Team access configured

---

## 📈 Production URLs

After deployment, you'll get:
- **Web App**: `https://morning-story-web.vercel.app`
- **API**: `https://morning-story-api.vercel.app`

Update `VITE_API_URL` with your actual API URL.

---

## 💡 Recommendations

**⚡ For Quick Setup & Solo Development**: CLI deployment (Method 1)
- Fastest to get started (2 minutes)
- Direct control over deployments
- Perfect for prototypes and demos
- **Best for**: Individual developers, quick testing

**🔥 For Development Teams**: GitHub Actions (Method 2)
- Best collaboration experience
- Secure secret management
- Automated workflows
- **Best for**: Team projects, production apps

**🌐 For Simple Projects**: Dashboard integration (Method 3)
- No CLI setup required
- Visual dashboard management
- **Best for**: Non-technical users, simple projects

**🎯 Current Live Demo**: Uses CLI deployment (Method 1)
- Deployed in under 5 minutes
- Independent API and web deployments
- Ready for immediate testing

## 🎯 What Works Now (Production Ready)

### ✅ **Fully Functional API**
- Express.js serverless API optimized for Vercel deployment
- All endpoints working: `/health`, `/auth/*`, `/integrations/*`, `/webhooks/github`
- CORS properly configured for frontend communication
- GitHub webhook endpoint ready for GitHub App integration
- Secure authentication with JWT token management

### ✅ **Complete Frontend Application**
- React 18 + TypeScript + Tailwind CSS with responsive design
- Authentication flow with JWT token management and auto-refresh
- Integration management dashboard with professional UI
- GitHub connection support (Personal Access Token + GitHub App)
- Mobile-first design that works on all devices

### ✅ **Production Deployment Pipeline**
- GitHub Actions CI/CD with automated deployments
- Encrypted secret management using GitHub Secrets
- Automated deployments on push to main branch
- Preview deployments for pull requests with automatic URLs
- Vercel serverless deployment optimized for performance

### ✅ **Database & Infrastructure**
- Supabase PostgreSQL integration ready for production
- Local development environment with Docker (PostgreSQL + Redis)
- Prisma ORM for type-safe database operations
- Environment variable management with proper security

## 🚀 Post-Deployment Steps

### 1. **Verify Deployment**
Test your deployed API endpoints:
```bash
curl https://your-api.vercel.app/health
curl https://your-api.vercel.app/auth/test-login -X POST
curl https://your-api.vercel.app/integrations
```

### 2. **Test the Full Application**
1. Visit your deployed web app: `https://your-web.vercel.app`
2. Click "Get Started" to test the authentication flow
3. Navigate to the Integrations page
4. Test GitHub connection using Personal Access Token

### 3. **Set Up GitHub App** (Optional)
For the best user experience:
1. Create GitHub App at [github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Configure webhook URL: `https://your-api.vercel.app/webhooks/github`
3. Set homepage URL: `https://your-web.vercel.app`
4. Add GitHub App credentials to your environment variables
5. Redeploy to activate GitHub App integration

### 4. **Monitor and Maintain**
- Check deployment logs: `vercel logs <deployment-url>`
- Monitor GitHub Actions: Visit repository Actions tab
- Update secrets: `npm run secrets:upload` after editing `.env.production`

## 💡 Final Recommendations

### 🔥 **Recommended for All Production Deployments**
**Use GitHub Actions (Method 1) because:**
- ✅ **Security**: Secrets encrypted, never in Git
- ✅ **Team Collaboration**: Multiple developers can deploy safely
- ✅ **Automation**: Hands-free deployment on every push
- ✅ **Professional**: Industry-standard CI/CD practices
- ✅ **Scalable**: Easy to add staging/testing environments

### ⚡ **Quick Alternative: CLI Deployment**
Use Method 2 for:
- Solo development and prototyping
- Direct deployment control
- Learning the deployment process

### 🌐 **Beginner-Friendly: Dashboard Deployment**
Use Method 3 for:
- Non-technical team members
- Simple projects without CI/CD needs
- Visual interface preference

---

## 🎉 Congratulations!

Your Morning Story application is now **production-ready** with:

✅ **Secure deployment pipeline** with encrypted secrets  
✅ **Working API and frontend** tested and verified  
✅ **GitHub integration ready** for immediate use  
✅ **Scalable serverless architecture** on Vercel  
✅ **Professional DevOps practices** with automated CI/CD  

**Start automating your standups today!** 🚀

Visit your deployed application and begin connecting your GitHub account to generate intelligent standup reports.