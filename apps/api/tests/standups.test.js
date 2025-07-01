const request = require('supertest');
const app = require('../index-db');

describe('Standups API - One Per Day Functionality', () => {
  let authToken;
  const testUserId = 'test-dev-user-123';
  
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
    // Clear the in-memory storage before each test
    const devStandups = require('../index-db').devStandups;
    if (devStandups) {
      devStandups.clear();
    }
  });

  describe('POST /standups/generate - One Per Day Logic', () => {
    it('should create first standup for the day', async () => {
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
      expect(response.body.metadata).not.toHaveProperty('replaced_count');
    });

    it('should replace existing standup when regenerating same day', async () => {
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

      expect(secondResponse.body.id).not.toBe(firstId);
      expect(secondResponse.body.metadata.replaced_count).toBe(1);
    });

    it('should track multiple replacements', async () => {
      // Generate first standup
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      // Generate second standup (replacement 1)
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'casual_async', length: 'short' })
        .expect(200);

      // Generate third standup (replacement 2)
      const thirdResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'long' })
        .expect(200);

      expect(thirdResponse.body.metadata.replaced_count).toBe(2);
    });
  });

  describe('GET /standups - List with One Per Day Filter', () => {
    beforeEach(async () => {
      // Set up test data: multiple standups across different days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Mock the Date object to simulate different days
      const originalDate = Date;
      
      // Create standup for two days ago
      global.Date = class extends originalDate {
        constructor() {
          return twoDaysAgo;
        }
        static now() {
          return twoDaysAgo.getTime();
        }
        toDateString() {
          return twoDaysAgo.toDateString();
        }
      };
      
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' });

      // Create standup for yesterday
      global.Date = class extends originalDate {
        constructor() {
          return yesterday;
        }
        static now() {
          return yesterday.getTime();
        }
        toDateString() {
          return yesterday.toDateString();
        }
      };
      
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'casual_async', length: 'short' });

      // Create multiple standups for today (should be replaced)
      global.Date = originalDate; // Reset to today
      
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'medium' });
        
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'detailed', length: 'long' });
    });

    it('should return only one standup per day', async () => {
      const response = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3); // 3 different days

      // Verify no duplicate dates
      const dates = response.body.map(standup => 
        new Date(standup.date).toDateString()
      );
      const uniqueDates = [...new Set(dates)];
      expect(uniqueDates).toHaveLength(3);
    });

    it('should return standups sorted by date descending', async () => {
      const response = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      
      const dates = response.body.map(standup => new Date(standup.generatedAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });

    it('should show replacement count for today\'s standup', async () => {
      const response = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Today's standup should be first (most recent)
      const todayStandup = response.body[0];
      expect(todayStandup.metadata.replaced_count).toBe(1); // Was replaced once
    });
  });

  describe('GET /standups/today - Today\'s Standup', () => {
    it('should return null when no standup generated today', async () => {
      const response = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeNull();
    });

    it('should return latest standup for today', async () => {
      // Generate multiple standups today
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' });

      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'work_focused', length: 'short' });

      const response = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).not.toBeNull();
      expect(response.body.metadata.tone).toBe('work_focused'); // Latest tone
      expect(response.body.metadata.replaced_count).toBe(1);
    });
  });

  describe('Dashboard Integration Tests', () => {
    beforeEach(async () => {
      // Create realistic test scenario: 
      // - 5 days of standups
      // - Multiple regenerations on some days
      const dates = [];
      const today = new Date();
      
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      for (let i = 0; i < dates.length; i++) {
        const testDate = dates[i];
        
        // Mock Date for this iteration
        const originalDate = Date;
        global.Date = class extends originalDate {
          constructor() {
            return testDate;
          }
          static now() {
            return testDate.getTime();
          }
          toDateString() {
            return testDate.toDateString();
          }
        };

        // Generate initial standup
        await request(app)
          .post('/standups/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ tone: 'professional', length: 'medium' });

        // Regenerate 2-3 times for recent days
        if (i >= 2) {
          await request(app)
            .post('/standups/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tone: 'work_focused', length: 'short' });
            
          if (i === 4) { // Today - regenerate multiple times
            await request(app)
              .post('/standups/generate')
              .set('Authorization', `Bearer ${authToken}`)
              .send({ tone: 'casual_async', length: 'long' });
          }
        }

        global.Date = originalDate; // Reset
      }
    });

    it('should support dashboard workflow: fetch list + today + regenerate', async () => {
      // 1. Fetch standups list (what Dashboard does on load)
      const listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(5); // 5 days
      
      // 2. Fetch today's standup
      const todayResponse = await request(app)
        .get('/standups/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(todayResponse.body).not.toBeNull();
      expect(todayResponse.body.metadata.replaced_count).toBeGreaterThan(0);

      // 3. Regenerate (what happens when user clicks "Regenerate")
      const regenerateResponse = await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'detailed', length: 'medium' })
        .expect(200);

      expect(regenerateResponse.body.metadata.replaced_count).toBeGreaterThan(1);

      // 4. Verify list still shows only 5 standups (one per day)
      const finalListResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalListResponse.body).toHaveLength(5);
      
      // Today's standup should be updated
      const updatedTodayStandup = finalListResponse.body[0];
      expect(updatedTodayStandup.metadata.tone).toBe('detailed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive regenerations', async () => {
      // Simulate user clicking regenerate multiple times quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/standups/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tone: 'professional', length: 'medium' })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should still only have one standup for today
      const listResponse = await request(app)
        .get('/standups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].metadata.replaced_count).toBeGreaterThan(0);
    });

    it('should handle different users independently', async () => {
      const user2Token = Buffer.from(JSON.stringify({
        userId: 'test-dev-user-456',
        email: 'test2@example.com',
        name: 'Test User 2',
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');

      // User 1 generates standup
      await request(app)
        .post('/standups/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tone: 'professional', length: 'medium' })
        .expect(200);

      // User 2 generates standup
      await request(app)
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
      expect(user1Standups.body[0].id).not.toBe(user2Standups.body[0].id);
    });
  });
});