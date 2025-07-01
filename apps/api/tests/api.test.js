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