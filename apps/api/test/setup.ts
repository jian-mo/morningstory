// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_morning_story';
});

// Mock external services
jest.mock('@morning-story/integrations', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    validateToken: jest.fn().mockResolvedValue(true),
    fetchActivity: jest.fn().mockResolvedValue({
      commits: [],
      pullRequests: [],
      issues: [],
    }),
  })),
}));

jest.mock('@morning-story/llm', () => ({
  OpenAIClient: jest.fn().mockImplementation(() => ({
    generateStandup: jest.fn().mockResolvedValue({
      content: 'Mocked standup content',
      metadata: {
        model: 'gpt-4',
        tokensUsed: 100,
        cost: 0.001,
        generatedAt: new Date().toISOString(),
      },
    }),
    validateApiKey: jest.fn().mockResolvedValue(true),
  })),
}));