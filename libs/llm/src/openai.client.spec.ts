import { OpenAIClient } from './openai.client';
import { StandupGenerationRequest } from './types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
    })),
  };
});

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  let mockOpenAI: any;

  beforeEach(() => {
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
    client = new OpenAIClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStandup', () => {
    const mockRequest: StandupGenerationRequest = {
      githubActivity: {
        commits: [
          {
            sha: 'abc123',
            message: 'Add new feature',
            url: 'https://github.com/repo/commit/abc123',
            author: 'testuser',
            date: '2024-01-15T10:00:00Z',
            repository: 'test/repo',
          },
        ],
        pullRequests: [],
        issues: [],
      },
      preferences: {
        tone: 'professional',
        length: 'medium',
      },
      date: new Date('2024-01-15'),
    };

    it('should generate standup successfully', async () => {
      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Yesterday I accomplished:\n- Added new feature\n\nToday I plan to:\n- Continue development\n\nBlockers:\n- None',
            },
          },
        ],
        usage: {
          total_tokens: 150,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await client.generateStandup(mockRequest);

      expect(result).toEqual({
        content: mockCompletion.choices[0].message.content,
        metadata: {
          model: 'gpt-4',
          tokensUsed: 150,
          cost: 0.00675, // 150 tokens * 0.045 / 1000
          generatedAt: expect.any(String),
        },
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('professional daily standup updates'),
          },
          {
            role: 'user',
            content: expect.stringContaining('Add new feature'),
          },
        ],
        temperature: 0.7,
        max_tokens: 300, // medium length
      });
    });

    it('should handle different tone preferences', async () => {
      const casualRequest = {
        ...mockRequest,
        preferences: { ...mockRequest.preferences, tone: 'casual' },
      };

      const mockCompletion = {
        choices: [{ message: { content: 'Casual standup content' } }],
        usage: { total_tokens: 100 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await client.generateStandup(casualRequest);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content: expect.stringContaining('casual, conversational standup'),
            },
            expect.any(Object),
          ],
        }),
      );
    });

    it('should handle different length preferences', async () => {
      const shortRequest = {
        ...mockRequest,
        preferences: { ...mockRequest.preferences, length: 'short' },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Short content' } }],
        usage: { total_tokens: 50 },
      });

      await client.generateStandup(shortRequest);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 150, // short length
        }),
      );
    });

    it('should throw error when API call fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(client.generateStandup(mockRequest)).rejects.toThrow('OpenAI API error: API Error');
    });
  });

  describe('validateApiKey', () => {
    it('should return true when API key is valid', async () => {
      mockOpenAI.models.list.mockResolvedValue({});

      const result = await client.validateApiKey();

      expect(result).toBe(true);
      expect(mockOpenAI.models.list).toHaveBeenCalled();
    });

    it('should return false when API key is invalid', async () => {
      mockOpenAI.models.list.mockRejectedValue(new Error('Unauthorized'));

      const result = await client.validateApiKey();

      expect(result).toBe(false);
    });
  });
});