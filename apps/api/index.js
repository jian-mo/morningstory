// Simple Express server for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

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
  res.json([]);
});

app.get('/integrations/github/app/install', (req, res) => {
  res.json({
    configured: false,
    message: 'GitHub App integration is not set up yet. Please use Personal Access Token instead.'
  });
});

app.post('/integrations/github/connect', (req, res) => {
  res.json({
    success: true,
    message: 'GitHub connected successfully',
    integration: {
      id: 'github-integration-123',
      type: 'GITHUB',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  });
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