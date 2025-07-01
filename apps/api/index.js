// Simple Express server for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// Simple in-memory storage for demo purposes
// In production, this would be stored in a database
const userIntegrations = {};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Morning Story API is running!'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Morning Story API',
    version: '1.0.0',
    description: 'Intelligent standup generation API',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      integrations: '/integrations/*'
    }
  });
});

// Auth endpoints
app.post('/auth/test-login', (req, res) => {
  const token = Buffer.from(JSON.stringify({
    userId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000)
  })).toString('base64');
  
  res.json({
    access_token: token,
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    }
  });
});

app.get('/auth/me', (req, res) => {
  res.json({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Integrations endpoints
app.get('/integrations', (req, res) => {
  // Get user ID from auth header (in real app, this would be from JWT)
  const userId = 'test-user-123';
  
  // Return user's integrations
  const integrations = userIntegrations[userId] || [];
  res.json(integrations);
});

app.get('/integrations/github/app/install', (req, res) => {
  // Check if GitHub App environment variables are configured
  const isConfigured = !!(
    process.env.GITHUB_APP_ID && 
    process.env.GITHUB_APP_NAME && 
    process.env.GITHUB_APP_PRIVATE_KEY
  );

  // Debug logging
  console.log('GitHub App configuration check:', {
    GITHUB_APP_ID: !!process.env.GITHUB_APP_ID,
    GITHUB_APP_NAME: !!process.env.GITHUB_APP_NAME,
    GITHUB_APP_PRIVATE_KEY: !!process.env.GITHUB_APP_PRIVATE_KEY,
    isConfigured
  });

  if (isConfigured) {
    // Generate installation URL with user state
    const userId = 'test-user-123'; // In real implementation, get from JWT token
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
      message: 'GitHub App integration is not set up yet. Please use Personal Access Token instead.',
      debug: {
        hasAppId: !!process.env.GITHUB_APP_ID,
        hasAppName: !!process.env.GITHUB_APP_NAME,
        hasPrivateKey: !!process.env.GITHUB_APP_PRIVATE_KEY
      }
    });
  }
});

app.post('/integrations/github/connect', (req, res) => {
  const userId = 'test-user-123';
  
  // Create integration
  const integration = {
    id: 'github-pat-' + Date.now(),
    type: 'GITHUB',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      installationType: 'token'
    }
  };
  
  // Store it
  if (!userIntegrations[userId]) {
    userIntegrations[userId] = [];
  }
  userIntegrations[userId] = userIntegrations[userId].filter(i => i.type !== 'GITHUB');
  userIntegrations[userId].push(integration);
  
  res.json({
    success: true,
    message: 'GitHub connected successfully',
    integration
  });
});

// GitHub App callback endpoint
app.get('/integrations/github/app/callback', (req, res) => {
  const { installation_id, setup_action, state } = req.query;
  
  console.log('GitHub App callback received:', {
    installation_id,
    setup_action,
    state
  });
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://morning-story-web.vercel.app';
  
  if (installation_id && setup_action === 'install') {
    // Successfully installed
    const userId = 'test-user-123'; // In real app, decode from state
    
    // Create GitHub App integration
    const integration = {
      id: 'github-app-' + installation_id,
      type: 'GITHUB',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        installationType: 'app',
        installationId: installation_id
      }
    };
    
    // Store it
    if (!userIntegrations[userId]) {
      userIntegrations[userId] = [];
    }
    // Remove any existing GitHub integrations
    userIntegrations[userId] = userIntegrations[userId].filter(i => i.type !== 'GITHUB');
    userIntegrations[userId].push(integration);
    
    console.log('GitHub App installed successfully:', {
      installation_id,
      userId,
      integration
    });
    
    res.redirect(`${frontendUrl}/integrations?success=github_app_installed`);
  } else {
    // Something went wrong
    res.redirect(`${frontendUrl}/integrations?error=github_app_installation_failed`);
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

// Export for Vercel
module.exports = app;