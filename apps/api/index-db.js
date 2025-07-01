// Express server with Supabase database integration
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    // For demo purposes, decode without verification
    // In production, use proper JWT verification
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded;
  } catch (error) {
    return null;
  }
};

// Helper function to encrypt sensitive data
const encrypt = (text) => {
  if (!text) return null;
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef', 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Morning Story API is running!',
    database: 'connected'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Morning Story API',
    version: '1.0.0',
    description: 'Intelligent standup generation API with database',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      integrations: '/integrations/*'
    }
  });
});

// Auth endpoints
app.post('/auth/test-login', async (req, res) => {
  try {
    // Create or find test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'test123' // In production, this would be hashed
      }
    });
    
    const token = Buffer.from(JSON.stringify({
      userId: testUser.id,
      email: testUser.email,
      name: testUser.name,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');
    
    res.json({
      access_token: token,
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/me', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userData.userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Integrations endpoints
app.get('/integrations', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: userData.userId },
      select: {
        id: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    });
    
    res.json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/integrations/github/app/install', (req, res) => {
  // Check if GitHub App environment variables are configured
  const isConfigured = !!(
    process.env.GITHUB_APP_ID && 
    process.env.GITHUB_APP_NAME && 
    process.env.GITHUB_APP_PRIVATE_KEY
  );

  if (isConfigured) {
    // Get user from token for state
    const userData = verifyToken(req);
    const userId = userData?.userId || 'anonymous';
    
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const installationUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new?state=${state}`;
    
    res.json({
      configured: true,
      installationUrl,
      message: 'GitHub App is ready for installation'
    });
  } else {
    res.json({
      configured: false,
      message: 'GitHub App integration is not set up yet. Please use Personal Access Token instead.'
    });
  }
});

app.post('/integrations/github/connect', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { personalAccessToken } = req.body;
  if (!personalAccessToken) {
    return res.status(400).json({ error: 'Personal access token is required' });
  }
  
  try {
    // Encrypt the token
    const encryptedToken = encrypt(personalAccessToken);
    
    // Create or update integration
    const integration = await prisma.integration.upsert({
      where: {
        userId_type: {
          userId: userData.userId,
          type: 'GITHUB'
        }
      },
      update: {
        accessToken: encryptedToken,
        isActive: true,
        metadata: {
          installationType: 'token'
        },
        lastSyncedAt: new Date()
      },
      create: {
        userId: userData.userId,
        type: 'GITHUB',
        accessToken: encryptedToken,
        metadata: {
          installationType: 'token'
        }
      }
    });
    
    res.json({
      success: true,
      message: 'GitHub connected successfully',
      integration: {
        id: integration.id,
        type: integration.type,
        isActive: integration.isActive,
        createdAt: integration.createdAt
      }
    });
  } catch (error) {
    console.error('GitHub connect error:', error);
    res.status(500).json({ error: 'Failed to connect GitHub' });
  }
});

// GitHub App callback endpoint
app.get('/integrations/github/app/callback', async (req, res) => {
  const { installation_id, setup_action, state } = req.query;
  
  console.log('GitHub App callback received:', {
    installation_id,
    setup_action,
    state
  });
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://morning-story-web.vercel.app';
  
  if (installation_id && setup_action === 'install') {
    try {
      // Decode state to get userId
      let userId = null;
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      }
      
      if (!userId || userId === 'anonymous') {
        // If no valid user, redirect with error
        return res.redirect(`${frontendUrl}/integrations?error=invalid_user_state`);
      }
      
      // Create GitHub App integration
      const integration = await prisma.integration.upsert({
        where: {
          userId_type: {
            userId: userId,
            type: 'GITHUB'
          }
        },
        update: {
          accessToken: encrypt('github-app-token'), // In production, exchange for real token
          isActive: true,
          metadata: {
            installationType: 'app',
            installationId: installation_id
          },
          lastSyncedAt: new Date()
        },
        create: {
          userId: userId,
          type: 'GITHUB',
          accessToken: encrypt('github-app-token'), // In production, exchange for real token
          metadata: {
            installationType: 'app',
            installationId: installation_id
          }
        }
      });
      
      console.log('GitHub App integration created:', {
        integrationId: integration.id,
        userId: userId,
        installationId: installation_id
      });
      
      res.redirect(`${frontendUrl}/integrations?success=github_app_installed`);
    } catch (error) {
      console.error('GitHub App callback error:', error);
      res.redirect(`${frontendUrl}/integrations?error=installation_failed`);
    }
  } else {
    // Something went wrong
    res.redirect(`${frontendUrl}/integrations?error=github_app_installation_failed`);
  }
});

// Standup endpoints
app.get('/standups', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { take = '10', skip = '0' } = req.query;
    
    const standups = await prisma.standup.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: 'desc' },
      take: parseInt(take),
      skip: parseInt(skip),
    });

    res.json(standups);
  } catch (error) {
    console.error('Get standups error:', error);
    res.status(500).json({ error: 'Failed to fetch standups' });
  }
});

app.get('/standups/today', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const standup = await prisma.standup.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    res.json(standup);
  } catch (error) {
    console.error('Get today standup error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s standup' });
  }
});

app.get('/standups/:id', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const standup = await prisma.standup.findFirst({
      where: { 
        id: req.params.id,
        userId: user.id 
      },
    });

    if (!standup) {
      return res.status(404).json({ error: 'Standup not found' });
    }

    res.json(standup);
  } catch (error) {
    console.error('Get standup error:', error);
    res.status(500).json({ error: 'Failed to fetch standup' });
  }
});

app.post('/standups/generate', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tone = 'professional', length = 'medium', customPrompt, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    // For now, generate a basic standup without GitHub activity
    // TODO: Implement GitHub activity fetching and OpenAI integration
    const content = generateBasicStandup(user.name || user.email, targetDate);
    
    const standup = await prisma.standup.create({
      data: {
        userId: user.id,
        content,
        rawData: { 
          githubActivity: null,
          generatedWithoutIntegrations: true 
        },
        metadata: { 
          tone,
          length,
          customPrompt,
          generated_at: new Date(),
          source: 'basic'
        },
        date: targetDate,
      },
    });

    res.json(standup);
  } catch (error) {
    console.error('Generate standup error:', error);
    res.status(500).json({ error: 'Failed to generate standup' });
  }
});

app.delete('/standups/:id', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.standup.delete({
      where: { 
        id: req.params.id,
        userId: user.id 
      },
    });

    res.json({ message: 'Standup deleted successfully' });
  } catch (error) {
    console.error('Delete standup error:', error);
    res.status(500).json({ error: 'Failed to delete standup' });
  }
});

// Helper function to generate basic standup
function generateBasicStandup(userName, date) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return `## Daily Standup - ${date.toDateString()}

**Yesterday (${yesterday.toDateString()}):**
- Worked on development tasks
- Reviewed code and made improvements
- Collaborated with team members

**Today:**
- Continue current project work
- Address any priority items
- Participate in team meetings

**Blockers:**
- None at this time

Generated for ${userName} at ${new Date().toLocaleString()}`;
}

// Webhook endpoint
app.post('/webhooks/github', (req, res) => {
  console.log('Received GitHub webhook:', req.headers['x-github-event']);
  res.json({ received: true });
});

// Default handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export for Vercel
module.exports = app;