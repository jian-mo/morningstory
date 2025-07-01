const request = require('supertest');
const app = require('../index-db');

describe('One Per Day Standup Functionality', () => {
  let authToken;
  const testUserId = 'test-dev-user-one-per-day';
  
  beforeAll(() => {
    // Set up test environment
    process.env.NODE_ENV = 'development';
    
    // Create mock auth token
    authToken = Buffer.from(JSON.stringify({
      userId: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');
  });

  beforeEach(() => {
    // Clear this user's data from in-memory storage
    if (app.devStandups && app.devStandups.has(testUserId)) {
      app.devStandups.delete(testUserId);
    }
  });

  afterAll(() => {
    // Clean up after all tests
    if (app.devStandups && app.devStandups.has(testUserId)) {
      app.devStandups.delete(testUserId);
    }
  });

  describe('Generate and Replace Logic', () => {
    it('should create first standup of the day', async () => {
      const response = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          length: 'medium'
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content');
      expect(response.body.metadata.replaced_count).toBe(0);
    });

    it('should replace when generating second standup same day', async () => {
      // Generate first standup
      const firstResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'professional',
          length: 'medium'
        })
        .expect(200);

      const firstId = firstResponse.body.id;

      // Generate second standup same day - should replace
      const secondResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tone: 'casual_async',
          length: 'short'
        })
        .expect(200);

      // The ID should be the same (replacement, not new)
      expect(secondResponse.body.id).toBe(firstId);
      expect(secondResponse.body.metadata.replaced_count).toBe(1);
    });

    it('should increment replacement count', async () => {
      // Generate first
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      // Generate second (replacement 1)
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'short' })
        .expect(200);

      // Generate third (replacement 2)
      const thirdResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'detailed', length: 'long' })
        .expect(200);

      expect(thirdResponse.body.metadata.replaced_count).toBe(2);
    });
  });

  describe('List and Today Endpoints', () => {
    beforeEach(async () => {
      // Generate one standup for testing
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);
    });

    it('should return only one standup in list', async () => {
      const response = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return today\'s standup', async () => {
      const response = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content');
    });

    it('should return same standup from list and today endpoints', async () => {
      const listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body[0].id).toBe(todayResponse.body.id);
      expect(listResponse.body[0].content).toBe(todayResponse.body.content);
    });
  });

  describe('Dashboard Workflow Simulation', () => {
    it('should support complete dashboard workflow', async () => {
      // 1. Initial load - should be empty
      let listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      let todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(0);
      expect(todayResponse.body).toBeNull();

      // 2. Generate first standup
      const firstGenResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      expect(firstGenResponse.body.metadata.replaced_count).toBe(0);

      // 3. Check dashboard shows one standup
      listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(todayResponse.body.id).toBe(firstGenResponse.body.id);

      // 4. Regenerate (what happens when user clicks "Regenerate")
      const regenResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'short' })
        .expect(200);

      expect(regenResponse.body.id).toBe(firstGenResponse.body.id); // Same ID
      expect(regenResponse.body.metadata.replaced_count).toBe(1);

      // 5. Check dashboard still shows only one standup, but updated
      listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(todayResponse.body.metadata.replaced_count).toBe(1);
      expect(todayResponse.body.metadata.tone).toBe('work_focused');

      // 6. Multiple regenerations should continue to replace
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'casual_async', length: 'long' })
        .expect(200);

      const finalListResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalListResponse.body).toHaveLength(1);
      expect(finalListResponse.body[0].metadata.replaced_count).toBe(2);
    });
  });

  describe('Multiple Users Independence', () => {
    it('should handle different users independently', async () => {
      const user2Token = Buffer.from(JSON.stringify({
        userId: 'test-dev-user-two',
        email: 'test2@example.com',
        name: 'Test User 2',
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');

      // User 1 generates standup
      const user1Gen = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      // User 2 generates standup
      const user2Gen = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ tone: 'casual_async', length: 'short' })
        .expect(200);

      // Each user should only see their own standups
      const user1Standups = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user2Standups = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user1Standups.body).toHaveLength(1);
      expect(user2Standups.body).toHaveLength(1);
      expect(user1Standups.body[0].id).toBe(user1Gen.body.id);
      expect(user2Standups.body[0].id).toBe(user2Gen.body.id);
      expect(user1Standups.body[0].id).not.toBe(user2Standups.body[0].id);

      // Clean up user 2
      if (app.devStandups && app.devStandups.has('test-dev-user-two')) {
        app.devStandups.delete('test-dev-user-two');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state correctly', async () => {
      const listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toEqual([]);
      expect(todayResponse.body).toBeNull();
    });

    it('should handle rapid successive generations', async () => {
      // Generate first standup
      const first = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      // Immediately generate second - should replace
      const second = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'short' })
        .expect(200);

      expect(second.body.id).toBe(first.body.id);
      expect(second.body.metadata.replaced_count).toBe(1);

      // List should still show only one
      const listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
    });
  });
});