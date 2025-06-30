# CLI Deployment Guide

Complete command-line deployment setup for Morning Story using Vercel CLI.

## Prerequisites

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

## 🚀 Quick Start (3 commands)

```bash
# 1. Initialize projects
./scripts/vercel-init.sh

# 2. Setup environment variables
./scripts/setup-env.sh api
./scripts/setup-env.sh web

# 3. Deploy
./scripts/deploy.sh all --production
```

## 📝 Detailed Steps

### 1. Initialize Vercel Projects

```bash
./scripts/vercel-init.sh
```

This will:
- Install Vercel CLI if needed
- Set up both web and API projects
- Link them to your Vercel account

### 2. Environment Variables Setup

**API Environment Variables:**
```bash
./scripts/setup-env.sh api
```

You'll be prompted for:
- Database URL (PostgreSQL)
- JWT Secret (auto-generated option)
- Encryption Key (auto-generated option)
- GitHub Client ID/Secret (optional)
- GitHub App credentials (optional)

**Web Environment Variables:**
```bash
./scripts/setup-env.sh web
```

You'll be prompted for:
- API URL (your deployed API endpoint)

### 3. Deploy

**Deploy everything to production:**
```bash
./scripts/deploy.sh all --production
```

**Deploy specific components:**
```bash
./scripts/deploy.sh web --production    # Web only
./scripts/deploy.sh api --production    # API only
./scripts/deploy.sh all                 # Preview deployment
```

## 🛠️ Management Commands

**Check deployment status:**
```bash
./scripts/vercel-status.sh
```

**View all deployments:**
```bash
vercel ls
```

**View environment variables:**
```bash
cd apps/api && vercel env ls
cd apps/web && vercel env ls
```

**View deployment logs:**
```bash
vercel logs <deployment-url>
```

**Redeploy current commit:**
```bash
cd apps/web && vercel --prod
cd apps/api && vercel --prod
```

## 🔧 Manual Commands

If you prefer manual setup:

### Initialize Projects
```bash
cd apps/web
vercel

cd ../api  
vercel
```

### Set Environment Variables
```bash
cd apps/api
echo "your-database-url" | vercel env add DATABASE_URL production
echo "your-jwt-secret" | vercel env add JWT_SECRET production
echo "your-encryption-key" | vercel env add ENCRYPTION_KEY production

cd ../web
echo "https://your-api.vercel.app" | vercel env add VITE_API_URL production
```

### Deploy
```bash
cd apps/web && vercel --prod
cd apps/api && vercel --prod
```

## 📦 Database Setup

**Recommended: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Use in `DATABASE_URL` environment variable

**Format:**
```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## 🔐 Security Best Practices

- ✅ Use strong, unique secrets (32+ characters)
- ✅ Set environment-specific variables (production/preview)
- ✅ Never commit `.env` files with real secrets
- ✅ Rotate secrets periodically
- ✅ Use Vercel's encrypted storage

## 🌐 Custom Domains

```bash
# Add custom domain
vercel domains add yourdomain.com

# Add domain to project
cd apps/web
vercel --prod --domains yourdomain.com
```

## 🔄 CI/CD Integration

The scripts work great with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    ./scripts/deploy.sh all --production
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 📊 Monitoring

**View deployment status:**
```bash
vercel ls
```

**Monitor logs in real-time:**
```bash
vercel logs --follow <deployment-url>
```

**Check project details:**
```bash
vercel inspect <deployment-url>
```

## 🎯 Production Checklist

- [ ] Database configured and accessible
- [ ] All environment variables set
- [ ] Both web and API deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] GitHub App configured with production URLs
- [ ] Error monitoring set up
- [ ] Backup strategy in place

## 🆘 Troubleshooting

**Build fails:**
```bash
# Check logs
vercel logs <deployment-url>

# Redeploy with verbose logging
vercel --prod --debug
```

**Environment variables not working:**
```bash
# List all env vars
vercel env ls

# Check specific environment
vercel env ls production
```

**Database connection issues:**
```bash
# Test connection string locally
psql "your-database-url"
```

That's it! Your deployment process is now fully automated with CLI tools. 🚀