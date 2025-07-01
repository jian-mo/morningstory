/**
 * Integration tests for the complete standup flow
 * Tests the entire user journey from login to standup generation
 */

const request = require('supertest');

// Mock environment variables for testing without real database
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.ENCRYPTION_KEY = '1234567890abcdef1234567890abcdef';

// Test with the database version but mock Prisma
const app = require('../index-db');

describe('Standup Bot Integration Tests', () => {
  let authToken;
  
  describe('Complete User Journey', () => {
    it('should complete the full standup flow', async () => {
      // 1. Health check
      const healthRes = await request(app)
        .get('/health')
        .expect(200);
      
      expect(healthRes.body.status).toBe('ok');
      
      // 2. User login (test login)
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      expect(loginRes.body).toHaveProperty('access_token');
      expect(loginRes.body.user).toHaveProperty('email');
      
      authToken = loginRes.body.access_token;
      
      // 3. Check integrations (should be empty initially)
      const integrationsRes = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(integrationsRes.body).toBeInstanceOf(Array);
      
      // 4. Check GitHub App status
      const githubAppRes = await request(app)
        .get('/integrations/github/app/install')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(githubAppRes.body).toHaveProperty('configured');
      
      // 5. Check standups (should be empty initially)
      const standupsRes = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(standupsRes.body).toBeInstanceOf(Array);
      expect(standupsRes.body).toHaveLength(0);
      
      // 6. Generate a standup
      const generateRes = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          length: 'medium'
        })
        .expect(200);
      
      expect(generateRes.body).toHaveProperty('id');
      expect(generateRes.body).toHaveProperty('content');
      expect(generateRes.body.content).toContain('Daily Standup');
      expect(generateRes.body.metadata.tone).toBe('professional');
      
      const standupId = generateRes.body.id;
      
      // 7. Verify standup appears in list
      const updatedStandupsRes = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(updatedStandupsRes.body).toHaveLength(1);
      expect(updatedStandupsRes.body[0].id).toBe(standupId);
      
      // 8. Get today's standup
      const todayRes = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(todayRes.body).toHaveProperty('id', standupId);
      
      // 9. Get specific standup
      const specificRes = await request(app)
        .get(`/standups/${standupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(specificRes.body).toHaveProperty('id', standupId);
      expect(specificRes.body).toHaveProperty('content');
    });
    
    it('should handle GitHub integration flow', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      authToken = loginRes.body.access_token;
      const userId = loginRes.body.user.id;
      
      // Connect GitHub with personal access token
      const connectRes = await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalAccessToken: 'ghp_test_token_12345' })
        .expect(200);
      
      expect(connectRes.body.success).toBe(true);
      expect(connectRes.body.integration.type).toBe('GITHUB');
      
      // Verify integration appears in list
      const integrationsRes = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(integrationsRes.body).toHaveLength(1);
      expect(integrationsRes.body[0].type).toBe('GITHUB');
      
      // Test GitHub App installation callback
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      const callbackRes = await request(app)
        .get(`/integrations/github/app/callback?installation_id=12345&setup_action=install&state=${state}`)
        .expect(302);
      
      expect(callbackRes.headers.location).toContain('success=github_app_installed');
    });
    
    it('should handle error scenarios gracefully', async () => {
      // Test unauthorized access
      await request(app)
        .get('/standups')
        .expect(401);
      
      await request(app)
        .post('/standups/generate')
        .send({ tone: 'professional' })
        .expect(401);
      
      await request(app)
        .get('/integrations')
        .expect(401);
      
      // Login for authenticated error tests
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      authToken = loginRes.body.access_token;
      
      // Test non-existent standup
      await request(app)
        .get('/standups/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Test invalid GitHub token
      await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalAccessToken: '' })
        .expect(400);
      
      // Test GitHub App callback with invalid state
      await request(app)
        .get('/integrations/github/app/callback?installation_id=12345&setup_action=install')
        .expect(302);
    });
    
    it('should handle different standup configurations', async () => {
      // Login
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      authToken = loginRes.body.access_token;
      
      // Test different tones and lengths
      const configs = [
        { tone: 'casual', length: 'short' },
        { tone: 'detailed', length: 'long' },
        { tone: 'concise', length: 'medium' }
      ];
      
      for (const config of configs) {
        const res = await request(app)
          .post('/standups/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(config)
          .expect(200);
        
        expect(res.body.metadata.tone).toBe(config.tone);
        expect(res.body.metadata.length).toBe(config.length);
        expect(res.body.content).toContain('Daily Standup');
      }
      
      // Test with custom prompt
      const customRes = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          length: 'medium',
          customPrompt: 'Focus on testing and QA activities'
        })
        .expect(200);
      
      expect(customRes.body.metadata.customPrompt).toContain('testing and QA');
      
      // Test with custom date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dateRes = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          date: yesterday.toISOString()
        })
        .expect(200);
      
      const standupDate = new Date(dateRes.body.date);
      expect(standupDate.toDateString()).toBe(yesterday.toDateString());
    });
  });
  
  describe('API Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      // Login
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      authToken = loginRes.body.access_token;
      
      // Make concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/standups/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tone: 'professional' })
        );
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
      });
      
      // All should have unique IDs
      const ids = results.map(res => res.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
    
    it('should handle pagination correctly', async () => {
      // Login and generate multiple standups
      const loginRes = await request(app)
        .post('/auth/test-login')
        .expect(200);
      
      authToken = loginRes.body.access_token;
      
      // Generate 7 standups
      for (let i = 0; i < 7; i++) {
        await request(app)
          .post('/standups/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ tone: 'professional' })
          .expect(200);
      }
      
      // Test pagination
      const page1 = await request(app)
        .get('/standups?take=3&skip=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page1.body).toHaveLength(3);
      
      const page2 = await request(app)
        .get('/standups?take=3&skip=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page2.body).toHaveLength(3);
      
      const page3 = await request(app)
        .get('/standups?take=3&skip=6')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page3.body.length).toBeGreaterThanOrEqual(1);
      
      // Verify no duplicates across pages
      const allIds = [
        ...page1.body.map(s => s.id),
        ...page2.body.map(s => s.id),
        ...page3.body.map(s => s.id)
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });
});