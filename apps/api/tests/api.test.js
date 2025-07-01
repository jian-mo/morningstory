const request = require('supertest');
const app = require('../index-db');
const prisma = require('../lib/prisma');

describe('Morning Story API Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.integration.deleteMany({
      where: { user: { email: 'test@example.com' } }
    });
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.integration.deleteMany({
      where: { user: { email: 'test@example.com' } }
    });
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database', 'connected');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    it('should login test user', async () => {
      const res = await request(app)
        .post('/auth/test-login')
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');

      authToken = res.body.access_token;
      testUserId = res.body.user.id;
    });

    it('should get current user', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', testUserId);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    it('should reject unauthorized requests', async () => {
      await request(app)
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Integrations', () => {
    it('should return empty integrations initially', async () => {
      const res = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(0);
    });

    it('should check GitHub App configuration', async () => {
      const res = await request(app)
        .get('/integrations/github/app/install')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('configured');
      expect(res.body).toHaveProperty('message');
      
      if (res.body.configured) {
        expect(res.body).toHaveProperty('installationUrl');
        expect(res.body.installationUrl).toContain('github.com/apps/');
      }
    });

    it('should connect GitHub with personal access token', async () => {
      const res = await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalAccessToken: 'ghp_test_token_12345' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'GitHub connected successfully');
      expect(res.body).toHaveProperty('integration');
      expect(res.body.integration).toHaveProperty('type', 'GITHUB');
      expect(res.body.integration).toHaveProperty('isActive', true);
    });

    it('should return GitHub integration in list', async () => {
      const res = await request(app)
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('type', 'GITHUB');
      expect(res.body[0]).toHaveProperty('isActive', true);
      expect(res.body[0].metadata).toHaveProperty('installationType', 'token');
    });

    it('should reject invalid personal access token', async () => {
      const res = await request(app)
        .post('/integrations/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalAccessToken: '' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GitHub App Callback', () => {
    it('should handle successful GitHub App installation', async () => {
      const state = Buffer.from(JSON.stringify({ userId: testUserId })).toString('base64');
      
      const res = await request(app)
        .get(`/integrations/github/app/callback?installation_id=123456&setup_action=install&state=${state}`)
        .expect(302);

      expect(res.headers.location).toContain('/integrations?success=github_app_installed');
    });

    it('should reject invalid state in callback', async () => {
      const res = await request(app)
        .get('/integrations/github/app/callback?installation_id=123456&setup_action=install')
        .expect(302);

      expect(res.headers.location).toContain('/integrations?error=');
    });

    it('should handle failed installation', async () => {
      const res = await request(app)
        .get('/integrations/github/app/callback?setup_action=cancel')
        .expect(302);

      expect(res.headers.location).toContain('/integrations?error=github_app_installation_failed');
    });
  });

  describe('Standups', () => {
    let standupId;

    it('should return empty standups list initially', async () => {
      const res = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(0);
    });

    it('should return null for today\'s standup initially', async () => {
      const res = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeNull();
    });

    it('should generate a new standup', async () => {
      const res = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          length: 'medium',
          customPrompt: 'Focus on testing activities'
        })
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('content');
      expect(res.body).toHaveProperty('userId', testUserId);
      expect(res.body).toHaveProperty('rawData');
      expect(res.body).toHaveProperty('metadata');
      expect(res.body.metadata).toHaveProperty('tone', 'professional');
      expect(res.body.metadata).toHaveProperty('length', 'medium');
      expect(res.body.content).toContain('Daily Standup');

      standupId = res.body.id;
    });

    it('should return the generated standup in list', async () => {
      const res = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('id', standupId);
      expect(res.body[0]).toHaveProperty('content');
    });

    it('should return today\'s standup', async () => {
      const res = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', standupId);
      expect(res.body).toHaveProperty('content');
    });

    it('should get specific standup by id', async () => {
      const res = await request(app)
        .get(`/standups/${standupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', standupId);
      expect(res.body).toHaveProperty('content');
      expect(res.body).toHaveProperty('userId', testUserId);
    });

    it('should generate standup with custom date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const res = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'casual',
          length: 'short',
          date: yesterday.toISOString()
        })
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.metadata).toHaveProperty('tone', 'casual');
      expect(res.body.metadata).toHaveProperty('length', 'short');
      
      const standupDate = new Date(res.body.date);
      expect(standupDate.toDateString()).toBe(yesterday.toDateString());
    });

    it('should reject unauthorized requests to standups', async () => {
      await request(app)
        .get('/standups')
        .expect(401);

      await request(app)
        .post('/standups/generate')
        .send({ tone: 'professional' })
        .expect(401);
    });

    it('should return 404 for non-existent standup', async () => {
      await request(app)
        .get('/standups/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should delete standup', async () => {
      await request(app)
        .delete(`/standups/${standupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app)
        .get(`/standups/${standupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle pagination', async () => {
      // Generate multiple standups
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/standups/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ tone: 'professional' })
          .expect(200);
      }

      // Test pagination
      const res = await request(app)
        .get('/standups?take=3&skip=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);

      const res2 = await request(app)
        .get('/standups?take=3&skip=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res2.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Webhooks', () => {
    it('should accept GitHub webhooks', async () => {
      const res = await request(app)
        .post('/webhooks/github')
        .set('X-GitHub-Event', 'push')
        .send({ ref: 'refs/heads/main' })
        .expect(200);

      expect(res.body).toHaveProperty('received', true);
    });
  });
});