# Supabase Setup Guide

Complete guide to set up Supabase database and configure environment variables for production deployment.

## 🚀 Supabase Database Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project:
   - **Organization**: Your organization or personal
   - **Name**: `morning-story-db` (or your preferred name)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)

### Step 2: Get Connection Information
Once your project is created:

1. **Go to Settings → Database**
2. **Copy Connection String**:
   - Look for "Connection string" section
   - Copy the "URI" format (not the individual parameters)
   - It looks like: `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

### Step 3: Configure Database Access
1. **Go to Settings → API**
2. **Note your Project URL**: `https://abcdefgh.supabase.co`
3. **Copy anon/public key** (for future frontend use if needed)

## 📝 .env.production Configuration

Here's how to set up your `.env.production` file with real Supabase values:

```bash
# Copy the example file
cp .env.production.example .env.production
```

### Complete .env.production Example

```env
# Vercel Configuration (get these from Vercel dashboard)
VERCEL_TOKEN=vercel_abc123def456ghi789jkl012mno345pqr678
VERCEL_ORG_ID=team_abc123def456
VERCEL_PROJECT_ID_API=prj_abc123def456ghi789jkl012
VERCEL_PROJECT_ID_WEB=prj_xyz789abc123def456ghi012

# Supabase Database
# Format: postgresql://postgres.PROJECT_ID:[PASSWORD]@HOST:5432/postgres
DATABASE_URL=postgresql://postgres.abcdefghijklmn:MyStr0ngP@ssw0rd123@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Security Configuration (generate these)
JWT_SECRET=super-secret-jwt-key-for-production-minimum-32-characters-long
ENCRYPTION_KEY=1234567890abcdef1234567890abcdef

# Frontend URL - Your deployed web app URL
# This is used by API for CORS, OAuth redirects, etc.
FRONTEND_URL=https://morning-story-web.vercel.app

# API URL (optional - for custom domains)
# If not set, web app will use default Vercel URL
API_URL=https://morning-story-api.vercel.app

# GitHub OAuth (optional - for GitHub integration)
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

# GitHub App (optional - for advanced GitHub integration)
GITHUB_APP_ID=123456
GITHUB_APP_NAME=morning-story-standup-bot
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef...
[Your full private key here]
-----END RSA PRIVATE KEY-----"
```

## 🔍 URL Configuration Explained

### FRONTEND_URL
**What it is**: The URL where your web application is deployed
**Used for**: 
- CORS configuration in API
- OAuth callback URLs
- Email links and redirects

**Examples**:
```env
# Vercel default domain
FRONTEND_URL=https://morning-story-web.vercel.app

# Custom domain
FRONTEND_URL=https://app.yourdomain.com

# Development/staging
FRONTEND_URL=https://morning-story-web-git-staging-yourteam.vercel.app
```

### API_URL (Optional)
**What it is**: The URL where your API is deployed
**Used for**: Frontend to know where to make API calls

**Examples**:
```env
# Vercel default domain (auto-detected if not set)
API_URL=https://morning-story-api.vercel.app

# Custom domain
API_URL=https://api.yourdomain.com

# If not set, web app uses: VITE_API_URL from Vercel environment
```

### DATABASE_URL
**What it is**: PostgreSQL connection string from Supabase
**Format**: `postgresql://postgres.PROJECT_ID:PASSWORD@HOST:PORT/DATABASE`

**From Supabase**:
1. Settings → Database → Connection string → URI
2. Replace `[YOUR-PASSWORD]` with your actual database password

## 🛠️ Step-by-Step Setup

### 1. Get Vercel Information
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login and get your info
vercel login

# Deploy once to get project IDs
cd apps/web && vercel --yes
cd ../api && vercel --yes

# Get your organization ID
vercel teams ls

# Get project IDs from project settings in Vercel dashboard
```

### 2. Generate Security Secrets
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32
# Output: abc123def456ghi789jkl012mno345pqr678stu901vwx234

# Generate encryption key (exactly 32 characters)
openssl rand -hex 16  
# Output: 1234567890abcdef1234567890abcdef
```

### 3. Create .env.production
```bash
# Copy example
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

### 4. Upload to GitHub Secrets
```bash
npm run secrets:upload
```

### 5. Deploy
```bash
git push origin main
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] **Database Connection**: API can connect to Supabase
- [ ] **Frontend Access**: Web app loads correctly
- [ ] **API Communication**: Frontend can call API endpoints
- [ ] **CORS Working**: No CORS errors in browser console
- [ ] **Environment Variables**: All secrets loaded in Vercel

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection locally
psql "postgresql://postgres.abcdefgh:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Common issues:
# 1. Wrong password - check Supabase settings
# 2. Network restrictions - check Supabase IP whitelist
# 3. SSL required - ensure connection string includes SSL params
```

### CORS Issues
```bash
# Check FRONTEND_URL matches your deployed web app URL exactly
# Common issues:
# 1. HTTP vs HTTPS mismatch
# 2. Wrong subdomain
# 3. Missing trailing slash sensitivity
```

### Environment Variables Not Loading
```bash
# Check GitHub Secrets
gh secret list

# Check Vercel received them
vercel env ls production

# Re-upload if needed
npm run secrets:upload
```

## 🌐 Custom Domain Setup

If you want to use custom domains:

### 1. Configure Domains in Vercel
```bash
# Add domains
vercel domains add yourdomain.com
vercel domains add api.yourdomain.com

# Assign to projects
cd apps/web && vercel --prod --domains yourdomain.com
cd apps/api && vercel --prod --domains api.yourdomain.com
```

### 2. Update Environment Variables
```env
# Update .env.production
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Upload updated secrets
npm run secrets:upload
```

### 3. Update DNS
Configure your DNS provider:
- `yourdomain.com` → CNAME to `cname.vercel-dns.com`
- `api.yourdomain.com` → CNAME to `cname.vercel-dns.com`

## 🔐 Security Best Practices

1. **Database Password**: Use strong, unique password
2. **IP Restrictions**: Configure Supabase IP whitelist if needed
3. **SSL/TLS**: Always use SSL connections (included in Supabase URLs)
4. **Secrets Rotation**: Rotate JWT_SECRET and ENCRYPTION_KEY periodically
5. **Environment Isolation**: Use different databases for staging/production

## 📊 Example Production Setup

Here's what a real production setup looks like:

```env
# Real Supabase connection
DATABASE_URL=postgresql://postgres.xyzabc123def456:MyV3ryStr0ngP@ssw0rd789@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Production web app URL
FRONTEND_URL=https://standupbot.vercel.app

# Custom API domain
API_URL=https://api-standupbot.vercel.app

# Generated secrets
JWT_SECRET=VGhpc0lzQVJlYWxKV1RTZWNyZXRGb3JQcm9kdWN0aW9uVXNl
ENCRYPTION_KEY=abcdef1234567890fedcba0987654321
```

This setup ensures your application is secure, scalable, and production-ready! 🚀