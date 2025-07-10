import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GitHubAppService } from './github-app.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');
jest.mock('@octokit/auth-app');

describe('GitHubAppService', () => {
  let service: GitHubAppService;
  let configService: ConfigService;
  let integrationsService: IntegrationsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockIntegrationsService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOctokit = {
    rest: {
      apps: {
        getInstallation: jest.fn(),
        listReposAccessibleToInstallation: jest.fn(),
      },
      repos: {
        listCommits: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubAppService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: IntegrationsService, useValue: mockIntegrationsService },
      ],
    }).compile();

    service = module.get<GitHubAppService>(GitHubAppService);
    configService = module.get<ConfigService>(ConfigService);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);
  });

  describe('isConfigured', () => {
    it('should return true when all required config is present', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key];
      });

      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when app ID is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: undefined,
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key];
      });

      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when private key contains placeholder', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nyour-private-key-here\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key];
      });

      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when app ID is placeholder', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: 'your-github-app-id',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key];
      });

      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('getInstallationUrl', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key] || defaultValue;
      });
    });

    it('should return installation URL without state', () => {
      const url = service.getInstallationUrl();
      expect(url).toBe('https://github.com/apps/test-app/installations/new');
    });

    it('should return installation URL with state', () => {
      const state = 'test-state-123';
      const url = service.getInstallationUrl(state);
      expect(url).toBe(`https://github.com/apps/test-app/installations/new?state=${state}`);
    });

    it('should throw error when not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);
      
      expect(() => service.getInstallationUrl()).toThrow(
        'GitHub App is not configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_NAME in your environment variables.'
      );
    });

    it('should use default app name when not configured', () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
        };
        return config[key] || defaultValue;
      });

      const url = service.getInstallationUrl();
      expect(url).toBe('https://github.com/apps/morning-story/installations/new');
    });
  });

  describe('handleInstallationCallback', () => {
    const userId = 'user-123';
    const installationId = 987654;
    const setupAction = 'install';

    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
          GITHUB_APP_NAME: 'test-app',
        };
        return config[key];
      });
    });

    it('should successfully handle installation callback', async () => {
      const mockInstallation = {
        data: {
          id: installationId,
          account: {
            type: 'User',
            login: 'testuser',
          },
        },
      };

      const mockRepos = {
        data: {
          repositories: [
            {
              id: 1,
              name: 'repo1',
              full_name: 'testuser/repo1',
              owner: { login: 'testuser' },
            },
            {
              id: 2,
              name: 'repo2',
              full_name: 'testuser/repo2',
              owner: { login: 'testuser' },
            },
          ],
        },
      };

      mockOctokit.rest.apps.getInstallation.mockResolvedValue(mockInstallation);
      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue(mockRepos);
      mockIntegrationsService.create.mockResolvedValue({});

      const result = await service.handleInstallationCallback(userId, installationId, setupAction);

      expect(result).toEqual({
        success: true,
        message: 'GitHub App installed successfully',
        installation: {
          id: installationId,
          account: 'testuser',
          repositories: 2,
        },
      });

      expect(mockIntegrationsService.create).toHaveBeenCalledWith(
        userId,
        IntegrationType.GITHUB,
        {
          accessToken: '',
          metadata: {
            installationId,
            accountType: 'User',
            accountLogin: 'testuser',
            repositories: [
              { id: 1, name: 'repo1', fullName: 'testuser/repo1' },
              { id: 2, name: 'repo2', fullName: 'testuser/repo2' },
            ],
          },
        }
      );
    });

    it('should handle organization installations', async () => {
      const mockInstallation = {
        data: {
          id: installationId,
          account: {
            type: 'Organization',
            login: 'test-org',
            name: 'Test Organization',
          },
        },
      };

      const mockRepos = {
        data: {
          repositories: [],
        },
      };

      mockOctokit.rest.apps.getInstallation.mockResolvedValue(mockInstallation);
      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue(mockRepos);
      mockIntegrationsService.create.mockResolvedValue({});

      const result = await service.handleInstallationCallback(userId, installationId, setupAction);

      expect(result.installation.account).toBe('test-org');
      expect(mockIntegrationsService.create).toHaveBeenCalledWith(
        userId,
        IntegrationType.GITHUB,
        expect.objectContaining({
          metadata: expect.objectContaining({
            accountType: 'Organization',
            accountLogin: 'test-org',
          }),
        })
      );
    });

    it('should throw error when installation fails', async () => {
      mockOctokit.rest.apps.getInstallation.mockRejectedValue(new Error('API Error'));

      await expect(
        service.handleInstallationCallback(userId, installationId, setupAction)
      ).rejects.toThrow('Failed to handle GitHub App installation: API Error');
    });
  });

  describe('getInstallationClient', () => {
    const userId = 'user-123';
    const installationId = 987654;

    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
        };
        return config[key];
      });
    });

    it('should return Octokit client for valid installation', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId },
      });

      const client = await service.getInstallationClient(userId);

      expect(client).toBeDefined();
      expect(Octokit).toHaveBeenCalledWith({
        authStrategy: expect.any(Function),
        auth: {
          appId: '123456',
          privateKey: expect.stringContaining('actual-key'),
          installationId,
        },
      });
    });

    it('should return null when no integration exists', async () => {
      mockIntegrationsService.findOne.mockResolvedValue(null);

      const client = await service.getInstallationClient(userId);

      expect(client).toBeNull();
    });

    it('should return null when integration has no installationId', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: {},
      });

      const client = await service.getInstallationClient(userId);

      expect(client).toBeNull();
    });

    it('should return null and log error on Octokit creation failure', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => {
        throw new Error('Auth error');
      });

      const client = await service.getInstallationClient(userId);

      expect(client).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get installation client:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('fetchActivityWithApp', () => {
    const userId = 'user-123';
    const since = new Date('2024-01-01');
    const until = new Date('2024-01-07');

    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GITHUB_APP_ID: '123456',
          GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nactual-key\n-----END RSA PRIVATE KEY-----',
        };
        return config[key];
      });
    });

    it('should fetch activity from accessible repositories', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId: 987654 },
      });

      const mockRepos = {
        repositories: [
          {
            name: 'repo1',
            full_name: 'user/repo1',
            owner: { login: 'user' },
          },
        ],
      };

      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'Test commit',
            author: { name: 'Test User', date: '2024-01-02T00:00:00Z' },
          },
          author: { login: 'testuser' },
          html_url: 'https://github.com/user/repo1/commit/abc123',
        },
      ];

      const mockPRs = [
        {
          number: 1,
          title: 'Test PR',
          html_url: 'https://github.com/user/repo1/pull/1',
          state: 'open',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue({ data: mockRepos });
      mockOctokit.rest.repos.listCommits.mockResolvedValue({ data: mockCommits });
      mockOctokit.rest.pulls.list.mockResolvedValue({ data: mockPRs });

      const activity = await service.fetchActivityWithApp(userId, since, until);

      expect(activity).toEqual({
        commits: [
          {
            sha: 'abc123',
            message: 'Test commit',
            url: 'https://github.com/user/repo1/commit/abc123',
            author: 'testuser',
            date: '2024-01-02T00:00:00Z',
            repository: 'user/repo1',
          },
        ],
        pullRequests: [
          {
            id: 1,
            title: 'Test PR',
            url: 'https://github.com/user/repo1/pull/1',
            state: 'open',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-03T00:00:00Z',
            repository: 'user/repo1',
            action: 'opened',
          },
        ],
        issues: [],
      });
    });

    it('should return null when no installation client available', async () => {
      mockIntegrationsService.findOne.mockResolvedValue(null);

      const activity = await service.fetchActivityWithApp(userId, since, until);

      expect(activity).toBeNull();
    });

    it('should handle errors gracefully and continue with other repos', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId: 987654 },
      });

      const mockRepos = {
        repositories: [
          {
            name: 'repo1',
            full_name: 'user/repo1',
            owner: { login: 'user' },
          },
          {
            name: 'repo2',
            full_name: 'user/repo2',
            owner: { login: 'user' },
          },
        ],
      };

      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue({ data: mockRepos });
      
      mockOctokit.rest.repos.listCommits
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: [] });
      
      mockOctokit.rest.pulls.list.mockResolvedValue({ data: [] });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const activity = await service.fetchActivityWithApp(userId, since, until);

      expect(activity).toEqual({
        commits: [],
        pullRequests: [],
        issues: [],
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching activity for user/repo1:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should filter pull requests by date range', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId: 987654 },
      });

      const mockRepos = {
        repositories: [
          {
            name: 'repo1',
            full_name: 'user/repo1',
            owner: { login: 'user' },
          },
        ],
      };

      const mockPRs = [
        {
          number: 1,
          title: 'Within range',
          html_url: 'https://github.com/user/repo1/pull/1',
          state: 'open',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
        {
          number: 2,
          title: 'Outside range',
          html_url: 'https://github.com/user/repo1/pull/2',
          state: 'open',
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-15T00:00:00Z',
        },
      ];

      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue({ data: mockRepos });
      mockOctokit.rest.repos.listCommits.mockResolvedValue({ data: [] });
      mockOctokit.rest.pulls.list.mockResolvedValue({ data: mockPRs });

      const activity = await service.fetchActivityWithApp(userId, since, until);

      expect(activity.pullRequests).toHaveLength(1);
      expect(activity.pullRequests[0].title).toBe('Within range');
    });

    it('should handle closed pull requests correctly', async () => {
      mockIntegrationsService.findOne.mockResolvedValue({
        metadata: { installationId: 987654 },
      });

      const mockRepos = {
        repositories: [
          {
            name: 'repo1',
            full_name: 'user/repo1',
            owner: { login: 'user' },
          },
        ],
      };

      const mockPRs = [
        {
          number: 1,
          title: 'Closed PR',
          html_url: 'https://github.com/user/repo1/pull/1',
          state: 'closed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue({ data: mockRepos });
      mockOctokit.rest.repos.listCommits.mockResolvedValue({ data: [] });
      mockOctokit.rest.pulls.list.mockResolvedValue({ data: mockPRs });

      const activity = await service.fetchActivityWithApp(userId, since, until);

      expect(activity.pullRequests[0].action).toBe('closed');
    });
  });
});