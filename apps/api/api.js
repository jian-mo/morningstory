// Simplified API for Vercel deployment
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3002', 
      'http://localhost:5173', // Vite default port
      'https://morning-story-web.vercel.app',
      'https://web-odekgvyzl-bigjos-projects.vercel.app'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true
}));
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Morning Story API', status: 'running', version: '2.0' });
});

// Mock auth endpoints
app.post('/auth/test-login', (req, res) => {
  res.json({ 
    success: true, 
    token: 'test-token-' + Date.now(),
    user: { id: 1, name: 'Test User' }
  });
});

app.get('/auth/me', (req, res) => {
  res.json({ 
    id: 1, 
    name: 'Test User', 
    email: 'test@example.com' 
  });
});

// Mock integrations endpoints
app.get('/integrations', (req, res) => {
  res.json([
    {
      id: 1,
      type: 'github',
      name: 'GitHub Integration',
      status: 'connected',
      lastSync: new Date().toISOString()
    }
  ]);
});

app.post('/integrations/github/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'GitHub connection test successful',
    data: { repos: 5, user: 'testuser' }
  });
});

// Mock standups endpoints
app.get('/standups', (req, res) => {
  res.json([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      summary: 'Sample standup report',
      highlights: ['Completed feature X', 'Fixed bug Y'],
      tasks: ['Review PR #123', 'Deploy to staging']
    }
  ]);
});

app.post('/standups/generate', (req, res) => {
  res.json({
    success: true,
    standup: {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      summary: 'Generated standup based on recent activity',
      highlights: ['Mock highlight 1', 'Mock highlight 2'],
      tasks: ['Mock task 1', 'Mock task 2']
    }
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  res.json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /auth/test-login',
      'GET /auth/me',
      'GET /integrations',
      'POST /integrations/github/test',
      'GET /standups',
      'POST /standups/generate'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = app;