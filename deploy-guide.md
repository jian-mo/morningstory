# Vercel Deployment Guide

Choose your preferred deployment method:

## 🔥 Method 1: GitHub Actions with Local .env (Recommended)

**Best approach**: Use local .env files (never committed) + GitHub Actions for automated deployment.

### Why This Method?
✅ **Developer-friendly** - Edit local .env files  
✅ **Secure** - Secrets never committed to Git  
✅ **Automated** - Push to deploy  
✅ **Team-friendly** - Easy collaboration without sharing secrets  
✅ **Branch-based** - Production & preview deployments  

### Quick Start (3 Steps)
```bash
# 1. Create local environment file
cp .env.production.example .env.production
# Edit with your real values

# 2. Upload to GitHub Secrets
npm run secrets:upload

# 3. Push to deploy
git push origin main
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

## 🚀 Method 2: CLI-Based Deployment

Fast, direct deployment using Vercel CLI.

### Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel
vercel login
```

### Quick Start
```bash
# 1. Initialize projects
npm run vercel:init

# 2. Setup environment variables
npm run vercel:env api
npm run vercel:env web

# 3. Deploy
npm run deploy
```

### CLI Commands
```bash
# Management
npm run vercel:status       # Check deployment status
npm run deploy:web          # Deploy web only
npm run deploy:api          # Deploy API only
npm run deploy:preview      # Preview deployment

# Environment variables
cd apps/api && vercel env ls
cd apps/web && vercel env ls
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

## 🔄 Automated Deployment Comparison

| Feature | GitHub Actions | CLI | Dashboard |
|---------|---------------|-----|-----------|
| **Setup Time** | 5 minutes | 2 minutes | 10 minutes |
| **Local .env** | ✅ Yes | ❌ No | ❌ No |
| **Auto Deploy** | ✅ On push | ❌ Manual | ✅ On push |
| **Preview PRs** | ✅ Automatic | ❌ Manual | ✅ Automatic |
| **Team Friendly** | ✅ Best | ⚠️ Good | ✅ Good |
| **Secret Security** | ✅ Encrypted | ⚠️ CLI only | ✅ Dashboard |

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

**🔥 For Development Teams**: GitHub Actions with local .env (Method 1)
- Best developer experience
- Secure secret management
- Automated workflows

**⚡ For Quick Setup**: CLI-based deployment (Method 2)
- Fastest to get started
- Direct control
- Good for prototypes

**🌐 For Simple Projects**: GitHub integration (Method 3)
- No CLI setup required
- Visual dashboard management
- Good for non-technical users

**🏢 For Production**: Always use Method 1 (GitHub Actions)
- Most secure
- Best collaboration
- Professional workflows

Choose the method that best fits your workflow! 🚀