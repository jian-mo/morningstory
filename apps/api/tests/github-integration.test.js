const request = require('supertest');
const app = require('../index-db');

// Load environment variables from .env.dev
require('dotenv').config({ path: '../../.env.dev' });

describe('GitHub App Integration', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup: Create a test user and get auth token
    const response = await request(app)
      .post('/auth/test-login')
      .send({
        email: 'github-test@example.com',
        name: 'GitHub Test User'
      });
    
    authToken = response.body.access_token;
  });

  describe('GET /integrations/github/app/install', () => {
    it('should return configuration status and installation URL when configured', async () => {
      const response = await request(app)
        .get('/integrations/github/app/install')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('configured');
      
      // Check if GitHub App is configured based on environment
      if (process.env.GITHUB_APP_ID && 
          process.env.GITHUB_APP_PRIVATE_KEY && 
          process.env.GITHUB_APP_NAME &&
          process.env.GITHUB_APP_ID !== 'your-github-app-id') {
        expect(response.body.configured).toBe(true);
        expect(response.body).toHaveProperty('installationUrl');
        expect(response.body.installationUrl).toMatch(/^https:\/\/github\.com\/apps\/.+\/installations\/new\?state=.+$/);
      } else {
        expect(response.body.configured).toBe(false);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/integrations/github/app/install')
        .expect(401);
    });
  });

  describe('POST /integrations/github/connect', () => {
    it('should connect GitHub with personal access token', async () => {
      const response = await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personalAccessToken: 'ghp_test123456789'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('integration');
      expect(response.body.integration.type).toBe('GITHUB');
      expect(response.body.integration.isActive).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personalAccessToken: ''
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/integrations/github/connect')
        .send({
          personalAccessToken: 'ghp_test123456789'
        })
        .expect(401);
    });
  });

  describe('GET /integrations', () => {
    it('should list user integrations', async () => {
      const response = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // If we connected GitHub in previous test, it should be listed
      const githubIntegration = response.body.find(i => i.type === 'GITHUB');
      if (githubIntegration) {
        expect(githubIntegration).toHaveProperty('id');
        expect(githubIntegration).toHaveProperty('isActive');
        expect(githubIntegration).not.toHaveProperty('accessToken'); // Should not expose token
      }
    });
  });

  describe('GET /integrations/github/type', () => {
    it('should return GitHub integration type', async () => {
      const response = await request(app)
        .get('/integrations/github/type')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('type');
      // Type can be 'app', 'token', or null
      expect(['app', 'token', null]).toContain(response.body.type);
    });
  });

  describe('DELETE /integrations/:type', () => {
    it('should remove GitHub integration', async () => {
      // First ensure we have a GitHub integration
      await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          personalAccessToken: 'ghp_test_to_delete'
        });

      // Now delete it
      const response = await request(app)
        .delete('/integrations/GITHUB')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('GITHUB integration removed successfully');

      // Verify it's deleted
      const listResponse = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const githubIntegration = listResponse.body.find(i => i.type === 'GITHUB');
      expect(githubIntegration).toBeUndefined();
    });
  });

  describe('GitHub App Callback Flow', () => {
    it('should handle missing state parameter', async () => {
      const response = await request(app)
        .get('/integrations/github/app/callback')
        .query({
          installation_id: '123456',
          setup_action: 'install'
        })
        .expect(302); // Redirect

      expect(response.headers.location).toContain('error=missing_state');
    });

    it('should handle callback with valid state', async () => {
      const state = Buffer.from(JSON.stringify({ userId: 'test-user-id' })).toString('base64');
      
      const response = await request(app)
        .get('/integrations/github/app/callback')
        .query({
          installation_id: '123456',
          setup_action: 'install',
          state: state
        })
        .expect(302); // Redirect

      // Should redirect with either success or error based on GitHub App setup
      expect(response.headers.location).toMatch(/(success|error)=/);
    });
  });
});