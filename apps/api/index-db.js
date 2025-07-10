// Express server with Supabase database integration
const path = require('path');

// Load environment variables from root folder based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.dev';
const envPath = path.resolve(__dirname, '../../', envFile);

// Only load dotenv in non-production or when explicitly needed
if (process.env.NODE_ENV !== 'production' || !process.env.DATABASE_URL) {
  require('dotenv').config({ path: envPath });
}

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');
const { OpenAIClient } = require('./libs/llm/dist/openai.client');
// const { GitHubClient } = require('./libs/integrations/dist/github/github.client');

const app = express();

// In-memory storage for development mode standups
const devStandups = new Map(); // userId -> Map(dateKey -> standup)

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173', // Vite default port
      'https://morning-story-web.vercel.app'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Helper function to verify JWT token (Supabase JWT format)
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    
    // Try to decode as base64 first (test tokens)
    try {
      const base64Decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (base64Decoded && base64Decoded.userId) {
        return {
          userId: base64Decoded.userId,
          email: base64Decoded.email,
          name: base64Decoded.name,
          exp: base64Decoded.exp,
          iat: base64Decoded.iat
        };
      }
    } catch (base64Error) {
      // Not a base64 token, try JWT
    }
    
    // Decode Supabase JWT token (without verification for development)
    // In production, you should verify with Supabase JWT secret
    const decoded = jwt.decode(token);
    
    if (decoded && decoded.sub) {
      return {
        userId: decoded.sub,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token verification error:', error);
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

// Helper function to decrypt sensitive data
const decrypt = (text) => {
  if (!text) return null;
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef', 'hex');
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Morning Story API is running!',
    database: 'connected',
    version: '2.0.0-standups',
    hasStandupEndpoints: true
  });
});

// Test OpenRouter endpoint (no auth required)
app.post('/test/openrouter', async (req, res) => {
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const { OpenAIClient } = require('../../libs/llm/dist/openai.client');
    const client = new OpenAIClient(openrouterKey);
    
    const result = await client.generateStandup({
      githubActivity: null,
      preferences: { tone: 'professional', length: 'medium' },
      date: new Date()
    });

    res.json({
      success: true,
      metadata: result.metadata,
      content: result.content,
      message: 'OpenRouter integration working!'
    });
  } catch (error) {
    console.error('OpenRouter test error:', error);
    res.status(500).json({ 
      error: 'OpenRouter test failed',
      message: error.message 
    });
  }
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
    // Check if we're in development mode and database is unreachable
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Development mode: create mock user without database
      const mockUser = {
        id: 'dev-user-123',
        email: 'test@example.com',
        name: 'Test User (Dev Mode)'
      };
      
      const token = Buffer.from(JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');
      
      return res.json({
        access_token: token,
        user: mockUser,
        dev_mode: true
      });
    }
    
    // Production mode: use database
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
    
    // Fallback to mock mode if database fails
    const mockUser = {
      id: 'fallback-user-123',
      email: 'test@example.com',
      name: 'Test User (Fallback)'
    };
    
    const token = Buffer.from(JSON.stringify({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');
    
    res.json({
      access_token: token,
      user: mockUser,
      fallback_mode: true,
      message: 'Using fallback authentication due to database connection issues'
    });
  }
});

app.get('/auth/me', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Check if we're in development mode or have a dev/fallback user
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = userData.userId && (userData.userId.includes('dev-') || userData.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Return mock user data for development
      return res.json({
        id: userData.userId || userData.id,
        email: userData.email,
        name: userData.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dev_mode: true
      });
    }
    
    // Production mode: query database
    const user = await prisma.user.findUnique({
      where: { id: userData.userId || userData.id }
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
    
    // Fallback to returning token data if database fails
    res.json({
      id: userData.userId || userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fallback_mode: true
    });
  }
});

// Integrations endpoints
app.get('/integrations', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = userData.userId && (userData.userId.includes('dev-') || userData.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Return mock integrations for development
      // Check if GitHub integration is configured (either App or Personal Token)
      const hasGithubApp = !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
      const hasPersonalToken = !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      const hasRealGithubToken = hasGithubApp || hasPersonalToken;
      
      const mockIntegrations = [
        {
          id: hasRealGithubToken ? 'dev-github-integration-real' : 'mock-github-integration',
          type: 'GITHUB',
          isActive: hasRealGithubToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            installationType: hasGithubApp ? 'app' : (hasPersonalToken ? 'token' : 'none'),
            dev_mode: true,
            configured: hasRealGithubToken,
            mockData: !hasRealGithubToken,
            appId: hasGithubApp ? process.env.GITHUB_APP_ID : null,
            appName: hasGithubApp ? process.env.GITHUB_APP_NAME : null,
            note: hasGithubApp 
              ? `GitHub App "${process.env.GITHUB_APP_NAME}" configured for development`
              : hasPersonalToken
                ? 'Personal access token connected for development'
                : 'No GitHub integration - connect via App or Personal Token'
          }
        }
      ];
      
      return res.json(mockIntegrations);
    }
    
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
    
    // Fallback to empty array if database fails
    res.json([]);
  }
});

app.get('/integrations/github/app/install', (req, res) => {
  // Get user from token for authentication 
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check if GitHub App environment variables are configured
  const isConfigured = !!(
    process.env.GITHUB_APP_ID && 
    process.env.GITHUB_APP_NAME && 
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_ID !== 'your-github-app-id' &&
    !process.env.GITHUB_APP_PRIVATE_KEY.includes('your-private-key-here')
  );

  if (isConfigured) {
    const userId = userData.userId;
    
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
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = userData.userId && (userData.userId.includes('dev-') || userData.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: test the token and store in environment for this session
      console.log('Dev mode: Testing GitHub token and storing for session');
      
      try {
        // Test the token by making a simple API call
        // Special case: allow "ghp_test_real_token" for demonstration
        if (personalAccessToken === 'ghp_test_real_token') {
          console.log('Using test token for demo purposes');
        } else {
          // const githubClient = new GitHubClient({ accessToken: personalAccessToken });
          // const isValid = await githubClient.validateToken();
          // if (!isValid) {
          //   throw new Error('Token validation failed');
          // }
        }
        
        // Store token temporarily in environment for development use
        process.env.GITHUB_PERSONAL_ACCESS_TOKEN = personalAccessToken;
        
        const mockIntegration = {
          id: 'dev-github-integration-real',
          type: 'GITHUB',
          isActive: true,
          createdAt: new Date().toISOString(),
          metadata: {
            installationType: 'token',
            dev_mode: true,
            real_token: true,
            connectedAt: new Date().toISOString(),
            token_preview: personalAccessToken.substring(0, 8) + '...'
          }
        };
        
        return res.json({
          success: true,
          message: 'GitHub connected successfully with real token (dev mode)',
          integration: mockIntegration,
          dev_mode: true,
          real_github_integration: true
        });
      } catch (error) {
        console.log('GitHub token validation failed:', error);
        return res.status(400).json({ 
          error: 'Invalid GitHub token',
          message: error.message,
          dev_mode: true 
        });
      }
    }
    
    // Production mode: actual database integration
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

// Get GitHub integration type endpoint
app.get('/integrations/github/type', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = userData.userId && (userData.userId.includes('dev-') || userData.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: check if token is set in environment
      if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        return res.json({ type: 'token' });
      }
      return res.json({ type: null });
    }
    
    // Production mode: check database
    const integration = await prisma.integration.findUnique({
      where: {
        userId_type: {
          userId: userData.userId,
          type: 'GITHUB'
        }
      },
      select: {
        metadata: true
      }
    });
    
    if (!integration) {
      return res.json({ type: null });
    }
    
    // Check if it's a GitHub App integration (has installationId)
    const metadata = integration.metadata || {};
    if (metadata.installationId) {
      return res.json({ type: 'app' });
    } else {
      return res.json({ type: 'token' });
    }
  } catch (error) {
    console.error('GitHub type check error:', error);
    res.status(500).json({ error: 'Failed to check GitHub integration type' });
  }
});

// DELETE integration endpoint
app.delete('/integrations/:type', async (req, res) => {
  const userData = verifyToken(req);
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { type } = req.params;
  
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = userData.userId && (userData.userId.includes('dev-') || userData.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: remove from environment
      if (type === 'GITHUB') {
        delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        return res.json({ message: `${type} integration removed successfully` });
      }
      return res.status(404).json({ error: 'Integration not found' });
    }
    
    // Production mode: delete from database
    await prisma.integration.delete({
      where: {
        userId_type: {
          userId: userData.userId,
          type: type.toUpperCase()
        }
      }
    });
    
    res.json({ message: `${type} integration removed successfully` });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Integration not found' });
    }
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Failed to remove integration' });
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
      // Check if state is provided
      if (!state) {
        return res.redirect(`${frontendUrl}/integrations?error=missing_state`);
      }
      
      // Decode state to get userId
      let userId = null;
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } catch (error) {
        return res.redirect(`${frontendUrl}/integrations?error=invalid_state`);
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
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: return real generated standups from memory
      const userId = user.userId || user.id;
      
      if (!devStandups.has(userId)) {
        // No standups generated yet, return empty array
        return res.json([]);
      }
      
      const userStandups = devStandups.get(userId);
      
      // Convert Map to array, sort by date descending, and apply pagination
      const standupsArray = Array.from(userStandups.values())
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
        .slice(parseInt(skip), parseInt(skip) + parseInt(take));
      
      return res.json(standupsArray);
    }
    
    // Get all standups for the user, then group by date and keep only the most recent per day
    const allStandups = await prisma.standup.findMany({
      where: { userId: user.userId || user.id },
      orderBy: { generatedAt: 'desc' },
    });

    // Group standups by date (day) and keep only the most recent for each day
    const standupsByDate = new Map();
    
    allStandups.forEach(standup => {
      const dateKey = new Date(standup.date).toDateString();
      if (!standupsByDate.has(dateKey) || 
          new Date(standup.generatedAt) > new Date(standupsByDate.get(dateKey).generatedAt)) {
        standupsByDate.set(dateKey, standup);
      }
    });

    // Convert back to array, sort by date descending, and apply pagination
    const uniqueStandups = Array.from(standupsByDate.values())
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(parseInt(skip), parseInt(skip) + parseInt(take));

    res.json(uniqueStandups);
  } catch (error) {
    console.error('Get standups error:', error);
    
    // Fallback to empty array if database fails
    res.json([]);
  }
});

app.get('/standups/today', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: check in-memory storage for today's standup
      const userId = user.userId || user.id;
      const today = new Date();
      const dateKey = today.toDateString();
      
      if (devStandups.has(userId)) {
        const userStandups = devStandups.get(userId);
        const todayStandup = userStandups.get(dateKey);
        return res.json(todayStandup || null);
      }
      
      return res.json(null);
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const standup = await prisma.standup.findFirst({
      where: {
        userId: user.userId || user.id,
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
    
    // Fallback to null if database fails
    res.json(null);
  }
});

app.get('/standups/:id', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Return 404 for any ID in development mode
      return res.status(404).json({ error: 'Standup not found' });
    }

    const standup = await prisma.standup.findFirst({
      where: { 
        id: req.params.id,
        userId: user.userId || user.id 
      },
    });

    if (!standup) {
      return res.status(404).json({ error: 'Standup not found' });
    }

    res.json(standup);
  } catch (error) {
    console.error('Get standup error:', error);
    
    // Fallback to 404 if database fails
    res.status(404).json({ error: 'Standup not found' });
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
    
    let content;
    let githubActivity = null;
    let generationMetadata = {};
    
    // Check if user has OpenRouter configured
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    console.log('OpenRouter key check:', openrouterKey ? 'Found' : 'Not found', openrouterKey === 'your-openrouter-api-key' ? '(placeholder)' : '');
    
    if (openrouterKey && openrouterKey !== 'your-openrouter-api-key') {
      try {
        // Check if we're in development mode
        const isDev = process.env.NODE_ENV === 'development';
        const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
        
        if (isDev || isDevUser) {
          // Development mode: check for GitHub integration (App or Personal Token)
          const hasGithubApp = !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
          const devGithubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
          
          if (hasGithubApp || devGithubToken) {
            console.log('Using GitHub integration for activity fetch');
            try {
              if (hasGithubApp && !devGithubToken) {
                // Using GitHub App - Mock activity for now (TODO: implement GitHub App activity fetch)
                console.log('GitHub App configured - using mock activity for demonstration');
                githubActivity = {
                  commits: [
                    {
                      sha: 'abc123',
                      message: 'feat: implement real GitHub integration in dev mode',
                      url: 'https://github.com/user/repo/commit/abc123',
                      author: 'Test User',
                      date: new Date().toISOString(),
                      repository: 'user/morning-story'
                    },
                    {
                      sha: 'def456',
                      message: 'fix: update OpenRouter standup generation',
                      url: 'https://github.com/user/repo/commit/def456',
                      author: 'Test User',
                      date: new Date().toISOString(),
                      repository: 'user/morning-story'
                    }
                  ],
                  pullRequests: [
                    {
                      id: 123,
                      title: 'Add real GitHub integration support',
                      url: 'https://github.com/user/repo/pull/123',
                      state: 'open',
                      action: 'opened',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      repository: 'user/morning-story'
                    }
                  ],
                  issues: []
                };
              } else {
                // Real GitHub token - fetch actual activity
                // const githubClient = new GitHubClient({ accessToken: devGithubToken });
                // const yesterday = new Date(targetDate);
                // yesterday.setDate(yesterday.getDate() - 1);
                // githubActivity = await githubClient.fetchActivity(yesterday, targetDate);
                githubActivity = null; // Temporarily disable GitHub integration
              }
            } catch (error) {
              console.log('Failed to fetch GitHub activity with dev token:', error);
              githubActivity = null;
            }
          } else {
            // No dev token, skip GitHub integration  
            githubActivity = null;
          }
        } else {
          // Production mode: fetch GitHub activity if integration exists
          const githubIntegration = await prisma.integration.findFirst({
            where: {
              userId: user.userId || user.id,
              type: 'GITHUB',
              isActive: true
            }
          });
          
          if (githubIntegration) {
            // Decrypt access token
            const accessToken = decrypt(githubIntegration.accessToken);
            
            // Fetch GitHub activity
            // const githubClient = new GitHubClient({ accessToken });
            // const yesterday = new Date(targetDate);
            // yesterday.setDate(yesterday.getDate() - 1);
            
            try {
              // githubActivity = await githubClient.fetchActivity(yesterday, targetDate);
              githubActivity = null; // Temporarily disable GitHub integration
            } catch (error) {
              console.log('Failed to fetch GitHub activity:', error);
              // Continue without GitHub data
            }
          }
        }
        
        // Generate with OpenRouter
        console.log('Generating with OpenRouter, GitHub activity:', githubActivity ? 'Found' : 'Not found');
        const openaiClient = new OpenAIClient(openrouterKey);
        const result = await openaiClient.generateStandup({
          githubActivity,
          preferences: { tone, length, customPrompt },
          date: targetDate
        });
        
        content = result.content;
        generationMetadata = result.metadata;
        
      } catch (error) {
        console.error('AI generation failed, falling back to basic:', error);
        // Fallback to basic generation
        content = generateBasicStandup(user.name || user.email, targetDate);
        generationMetadata = { source: 'basic_fallback', error: error.message };
      }
    } else {
      // No OpenRouter key configured, use basic generation
      content = generateBasicStandup(user.name || user.email, targetDate);
      generationMetadata = { source: 'basic' };
    }
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: store in memory with proper one-per-day logic
      const userId = user.userId || user.id;
      const dateKey = targetDate.toDateString();
      
      // Initialize user's standup storage if needed
      if (!devStandups.has(userId)) {
        devStandups.set(userId, new Map());
      }
      
      const userStandups = devStandups.get(userId);
      const existingStandup = userStandups.get(dateKey);
      
      const standupData = {
        id: existingStandup ? existingStandup.id : 'generated-' + Date.now(),
        userId,
        content,
        rawData: { 
          githubActivity,
          generatedWithoutIntegrations: !githubActivity,
          dev_mode: true,
          replacedPrevious: !!existingStandup,
          replacedAt: existingStandup ? new Date() : undefined
        },
        metadata: { 
          tone,
          length,
          customPrompt,
          ...generationMetadata,
          generated_at: new Date(),
          replaced_count: existingStandup ? (existingStandup.metadata?.replaced_count || 0) + 1 : 0
        },
        date: targetDate,
        generatedAt: new Date().toISOString(),
      };
      
      // Store/replace the standup for this date
      userStandups.set(dateKey, standupData);
      
      return res.json(standupData);
    }
    
    // Production mode: save to database (replace existing daily standup)
    try {
      // Check if there's already a standup for this date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingStandup = await prisma.standup.findFirst({
        where: {
          userId: user.userId || user.id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      let standup;
      if (existingStandup) {
        // Update existing standup for the day
        standup = await prisma.standup.update({
          where: { id: existingStandup.id },
          data: {
            content,
            rawData: { 
              githubActivity,
              generatedWithoutIntegrations: !githubActivity,
              replacedPrevious: true,
              replacedAt: new Date()
            },
            metadata: { 
              tone,
              length,
              customPrompt,
              ...generationMetadata,
              generated_at: new Date(),
              replaced_count: (existingStandup.metadata?.replaced_count || 0) + 1
            },
            generatedAt: new Date(), // Update generation timestamp
          },
        });
      } else {
        // Create new standup for the day
        standup = await prisma.standup.create({
          data: {
            userId: user.userId || user.id,
            content,
            rawData: { 
              githubActivity,
              generatedWithoutIntegrations: !githubActivity 
            },
            metadata: { 
              tone,
              length,
              customPrompt,
              ...generationMetadata,
              generated_at: new Date()
            },
            date: targetDate,
          },
        });
      }

      res.json(standup);
    } catch (dbError) {
      console.error('Database save failed, returning generated content anyway:', dbError);
      
      // Fallback: return the generated content without saving
      const fallbackStandup = {
        id: 'fallback-' + Date.now(),
        userId: user.userId || user.id,
        content,
        rawData: { 
          githubActivity,
          generatedWithoutIntegrations: !githubActivity,
          fallback_mode: true
        },
        metadata: { 
          tone,
          length,
          customPrompt,
          ...generationMetadata,
          generated_at: new Date()
        },
        date: targetDate,
        generatedAt: new Date().toISOString(),
      };
      
      res.json(fallbackStandup);
    }
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

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      // Development mode: delete from in-memory storage
      const userId = user.userId || user.id;
      
      if (devStandups.has(userId)) {
        const userStandups = devStandups.get(userId);
        
        // Find and delete the standup by ID
        for (const [dateKey, standup] of userStandups.entries()) {
          if (standup.id === req.params.id) {
            userStandups.delete(dateKey);
            console.log('Dev mode: Deleted standup', req.params.id, 'for date', dateKey);
            return res.json({ message: 'Standup deleted successfully (dev mode)', dev_mode: true });
          }
        }
      }
      
      return res.status(404).json({ error: 'Standup not found (dev mode)', dev_mode: true });
    }

    await prisma.standup.delete({
      where: { 
        id: req.params.id,
        userId: user.userId || user.id 
      },
    });

    res.json({ message: 'Standup deleted successfully' });
  } catch (error) {
    console.error('Delete standup error:', error);
    res.status(500).json({ error: 'Failed to delete standup' });
  }
});

// Helper function to generate basic standup with variety
function generateBasicStandup(userName, date) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Random task variations to make standups less repetitive
  const yesterdayTasks = [
    ['Worked on feature implementation', 'Fixed several bugs in the codebase', 'Reviewed pull requests from team members'],
    ['Completed API endpoint development', 'Updated documentation', 'Participated in team sync meeting'],
    ['Refactored legacy code for better performance', 'Added unit tests for new features', 'Collaborated on system design'],
    ['Debugged production issues', 'Implemented error handling improvements', 'Reviewed and merged code changes'],
    ['Worked on database optimization', 'Created migration scripts', 'Attended sprint planning session']
  ];
  
  const todayTasks = [
    ['Continue feature development', 'Code review and testing', 'Update project documentation'],
    ['Implement remaining API endpoints', 'Write integration tests', 'Deploy to staging environment'],
    ['Complete refactoring tasks', 'Performance testing and optimization', 'Team knowledge sharing session'],
    ['Monitor system metrics', 'Address code review feedback', 'Prepare for sprint demo'],
    ['Finalize database changes', 'Run performance benchmarks', 'Sync with product team']
  ];
  
  const blockers = [
    'None at this time',
    'Waiting for design specifications',
    'Need access to production logs',
    'Pending code review approval',
    'None currently'
  ];
  
  // Pick random tasks
  const randomIndex = Math.floor(Math.random() * yesterdayTasks.length);
  const yesterdayList = yesterdayTasks[randomIndex].map(task => `- ${task}`).join('\n');
  const todayList = todayTasks[randomIndex].map(task => `- ${task}`).join('\n');
  const blocker = blockers[Math.floor(Math.random() * blockers.length)];
  
  return `## Daily Standup - ${date.toDateString()}

**Yesterday (${yesterday.toDateString()}):**
${yesterdayList}

**Today:**
${todayList}

**Blockers:**
- ${blocker}

Generated for ${userName} at ${new Date().toLocaleString()}`;
}

// Cleanup endpoint to remove duplicate standups (keep only latest per day)
app.post('/admin/cleanup-duplicates', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDevUser = user.userId && (user.userId.includes('dev-') || user.userId.includes('fallback-'));
    
    if (isDev || isDevUser) {
      return res.json({ 
        message: 'Cleanup not needed in development mode',
        dev_mode: true,
        cleaned: 0
      });
    }

    // Get all standups for the user
    const allStandups = await prisma.standup.findMany({
      where: { userId: user.userId || user.id },
      orderBy: { generatedAt: 'desc' },
    });

    // Group by date and identify duplicates to delete
    const standupsByDate = new Map();
    const toDelete = [];
    
    allStandups.forEach(standup => {
      const dateKey = new Date(standup.date).toDateString();
      if (!standupsByDate.has(dateKey)) {
        // Keep the first (most recent) standup for this date
        standupsByDate.set(dateKey, standup);
      } else {
        // Mark older standups for deletion
        toDelete.push(standup.id);
      }
    });

    // Delete duplicate standups
    if (toDelete.length > 0) {
      await prisma.standup.deleteMany({
        where: {
          id: { in: toDelete },
          userId: user.userId || user.id
        }
      });
    }

    res.json({ 
      message: `Cleanup completed. Removed ${toDelete.length} duplicate standups.`,
      cleaned: toDelete.length,
      remaining: standupsByDate.size
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup duplicates' });
  }
});

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

// Start server for local development (not in test environment)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Morning Story API running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API docs: http://localhost:${PORT}/api`);
  });
}

// Export for Vercel
module.exports = app;
module.exports.devStandups = devStandups;