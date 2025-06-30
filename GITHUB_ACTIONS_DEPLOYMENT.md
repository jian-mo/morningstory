# GitHub Actions Deployment Guide

Deploy to Vercel using GitHub Actions with environment variables stored as encrypted GitHub Secrets (never in Git).

## 🚀 Quick Start

**Option 1: From Local .env File**
```bash
# 1. Create local .env file (never committed)
cp .env.production.example .env.production
# Edit .env.production with your values

# 2. Convert to GitHub Secrets
./scripts/local-env-to-secrets.sh

# 3. Push to deploy
git push origin main
```

**Option 2: Manual GitHub Secrets Setup**
```bash
# Setup secrets interactively
./scripts/setup-github-secrets.sh

# Push to deploy
git push origin main
```

## 📋 How It Works

1. **Local .env** → Your sensitive values (never committed to Git)
2. **GitHub Secrets** → Encrypted storage in GitHub (secure)
3. **GitHub Actions** → Reads secrets and deploys to Vercel
4. **Vercel** → Receives environment variables during deployment

## 🔐 Security Benefits

✅ **No secrets in Git** - Environment variables never touch your repository  
✅ **Encrypted storage** - GitHub encrypts all secrets at rest  
✅ **Team collaboration** - Share deployment without sharing secrets  
✅ **Audit trail** - GitHub logs all secret access  
✅ **Branch protection** - Different secrets for different environments  

## 📝 Step-by-Step Setup

### Step 1: Get Vercel Information

**Vercel Token:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token
3. Copy the token value

**Organization ID:**
1. Go to [vercel.com/teams/settings](https://vercel.com/teams/settings)
2. Copy Team ID / Organization ID

**Project IDs:**
1. Go to your API project settings on Vercel
2. Copy Project ID
3. Repeat for web project

### Step 2: Create Local Environment File

```bash
# Copy example file
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

# Security
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long
ENCRYPTION_KEY=1234567890abcdef1234567890abcdef

# Optional: Custom API domain
API_URL=https://api.yourdomain.com

# Optional: GitHub Integration
GITHUB_CLIENT_ID=abc123def456
GITHUB_CLIENT_SECRET=secret_abc123def456xyz789
```

### Step 3: Upload to GitHub Secrets

**Automated (Recommended):**
```bash
./scripts/local-env-to-secrets.sh .env.production
```

**Manual:**
```bash
./scripts/setup-github-secrets.sh
```

### Step 4: Deploy

```bash
# Push to main branch triggers production deployment
git push origin main

# Push to feature branch triggers preview deployment
git checkout -b feature/new-feature
git push origin feature/new-feature
```

## 🔄 Deployment Flow

```mermaid
graph LR
    A[Push to GitHub] --> B[GitHub Actions]
    B --> C[Read Secrets]
    C --> D[Set Vercel Env Vars]
    D --> E[Deploy to Vercel]
    E --> F[Production Live]
```

**What Happens:**
1. **Code Push** → Triggers GitHub Actions workflow
2. **Secrets Retrieved** → GitHub Actions reads encrypted secrets
3. **Environment Setup** → Secrets pushed to Vercel as environment variables
4. **Deployment** → Vercel builds and deploys with environment variables
5. **Live** → Production deployment with all secrets properly configured

## 🌊 Branch-Based Deployments

- **`main` branch** → Production deployment
- **Feature branches** → Preview deployments
- **Pull requests** → Automatic preview with comment containing URLs

## 📊 Monitoring Deployments

**GitHub Actions:**
```bash
# View workflow runs
gh run list

# View specific run logs
gh run view <run-id>
```

**Vercel:**
```bash
# List deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>
```

## 🛠️ Managing Secrets

**List all secrets:**
```bash
gh secret list
```

**Update a secret:**
```bash
echo "new-value" | gh secret set SECRET_NAME
```

**Delete a secret:**
```bash
gh secret delete SECRET_NAME
```

**Update from .env file:**
```bash
# After updating .env.production
./scripts/local-env-to-secrets.sh .env.production
```

## 🔧 Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

- ✅ Installs dependencies and Vercel CLI
- ✅ Sets environment variables from GitHub Secrets
- ✅ Deploys API and Web apps
- ✅ Handles production vs preview deployments
- ✅ Comments on PRs with deployment URLs

## 🆘 Troubleshooting

**Deployment fails:**
```bash
# Check workflow logs
gh run view --web

# Check Vercel deployment logs
vercel logs <deployment-url>
```

**Environment variables not working:**
```bash
# Verify secrets are set
gh secret list

# Check if secrets are reaching Vercel
vercel env ls production
```

**Common issues:**
- **Missing secrets**: Run `./scripts/local-env-to-secrets.sh` again
- **Wrong project IDs**: Verify project IDs in Vercel dashboard
- **Database connection**: Check DATABASE_URL format and firewall settings
- **Vercel token expired**: Generate new token and update secret

## 🎯 Production Checklist

- [ ] Local .env.production file created (not committed)
- [ ] All secrets uploaded to GitHub Secrets
- [ ] Database accessible from Vercel
- [ ] Vercel projects configured correctly
- [ ] GitHub Actions workflow enabled
- [ ] Test deployment successful
- [ ] Custom domains configured (optional)
- [ ] Monitoring/alerting set up

## 🔄 Team Workflow

**For team members:**
1. Get access to GitHub repository
2. Create their own local `.env.production` file
3. Run `./scripts/local-env-to-secrets.sh` (only if they have admin access)
4. Push code → automatic deployment

**For secret management:**
- Only repository admins can view/edit secrets
- Use environment-specific secrets for different stages
- Rotate secrets regularly
- Document secret ownership and purpose

This approach gives you the best of both worlds: the convenience of local .env files for development, with the security of encrypted GitHub Secrets for deployment! 🚀