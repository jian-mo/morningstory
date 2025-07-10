import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GitHubAppService } from './services/github-app.service';
import { IntegrationType } from '@prisma/client';
import { Response } from 'express';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let integrationsService: IntegrationsService;
  let githubAppService: GitHubAppService;

  const mockUser = { id: 'user-123' };
  const mockRequest = { user: mockUser };

  const mockIntegrationsService = {
    findAll: jest.fn(),
    getGitHubIntegrationType: jest.fn(),
    connectGitHubWithToken: jest.fn(),
    remove: jest.fn(),
  };

  const mockGitHubAppService = {
    isConfigured: jest.fn(),
    getInstallationUrl: jest.fn(),
    handleInstallationCallback: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        { provide: IntegrationsService, useValue: mockIntegrationsService },
        { provide: GitHubAppService, useValue: mockGitHubAppService },
      ],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);
    githubAppService = module.get<GitHubAppService>(GitHubAppService);
  });

  describe('findAll', () => {
    it('should return all user integrations', async () => {
      const mockIntegrations = [
        { id: '1', type: IntegrationType.GITHUB, isActive: true },
      ];
      mockIntegrationsService.findAll.mockResolvedValue(mockIntegrations);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockIntegrations);
      expect(mockIntegrationsService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getGitHubIntegrationType', () => {
    it('should return GitHub integration type', async () => {
      mockIntegrationsService.getGitHubIntegrationType.mockResolvedValue('app');

      const result = await controller.getGitHubIntegrationType(mockRequest);

      expect(result).toEqual({ type: 'app' });
      expect(mockIntegrationsService.getGitHubIntegrationType).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('connectGitHub', () => {
    it('should connect GitHub with personal access token', async () => {
      const body = { personalAccessToken: 'ghp_test123' };
      const mockResult = { success: true };
      mockIntegrationsService.connectGitHubWithToken.mockResolvedValue(mockResult);

      const result = await controller.connectGitHub(mockRequest, body);

      expect(result).toEqual(mockResult);
      expect(mockIntegrationsService.connectGitHubWithToken).toHaveBeenCalledWith(
        mockUser.id,
        body.personalAccessToken
      );
    });
  });

  describe('getGitHubAppInstallUrl', () => {
    it('should return installation URL when GitHub App is configured', async () => {
      mockGitHubAppService.isConfigured.mockReturnValue(true);
      mockGitHubAppService.getInstallationUrl.mockReturnValue(
        'https://github.com/apps/test-app/installations/new?state=encoded-state'
      );

      const result = await controller.getGitHubAppInstallUrl(mockRequest);

      expect(result).toEqual({
        configured: true,
        installationUrl: 'https://github.com/apps/test-app/installations/new?state=encoded-state',
      });
      expect(mockGitHubAppService.isConfigured).toHaveBeenCalled();
      expect(mockGitHubAppService.getInstallationUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^[A-Za-z0-9+/]+=*$/) // Base64 encoded state
      );
    });

    it('should return not configured message when GitHub App is not configured', async () => {
      mockGitHubAppService.isConfigured.mockReturnValue(false);

      const result = await controller.getGitHubAppInstallUrl(mockRequest);

      expect(result).toEqual({
        configured: false,
        message: 'GitHub App is not configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_NAME in your environment variables.',
      });
      expect(mockGitHubAppService.isConfigured).toHaveBeenCalled();
      expect(mockGitHubAppService.getInstallationUrl).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockGitHubAppService.isConfigured.mockReturnValue(true);
      mockGitHubAppService.getInstallationUrl.mockImplementation(() => {
        throw new Error('Custom error message');
      });

      const result = await controller.getGitHubAppInstallUrl(mockRequest);

      expect(result).toEqual({
        configured: false,
        message: 'Custom error message',
      });
    });
  });

  describe('handleGitHubAppCallback', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        redirect: jest.fn(),
      };
    });

    it('should handle successful installation callback', async () => {
      const installationId = '987654';
      const setupAction = 'install';
      const state = Buffer.from(JSON.stringify({ userId: mockUser.id })).toString('base64');

      mockGitHubAppService.handleInstallationCallback.mockResolvedValue({
        success: true,
        message: 'GitHub App installed successfully',
      });

      await controller.handleGitHubAppCallback(
        installationId,
        setupAction,
        state,
        mockResponse as Response
      );

      expect(mockGitHubAppService.handleInstallationCallback).toHaveBeenCalledWith(
        mockUser.id,
        987654,
        setupAction
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/integrations?success=github_connected'
      );
    });

    it('should handle missing state parameter', async () => {
      const installationId = '987654';
      const setupAction = 'install';
      const state = null;

      await controller.handleGitHubAppCallback(
        installationId,
        setupAction,
        state,
        mockResponse as Response
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/integrations?error=missing_state'
      );
      expect(mockGitHubAppService.handleInstallationCallback).not.toHaveBeenCalled();
    });

    it('should handle failed installation', async () => {
      const installationId = '987654';
      const setupAction = 'install';
      const state = Buffer.from(JSON.stringify({ userId: mockUser.id })).toString('base64');

      mockGitHubAppService.handleInstallationCallback.mockResolvedValue({
        success: false,
      });

      await controller.handleGitHubAppCallback(
        installationId,
        setupAction,
        state,
        mockResponse as Response
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/integrations?error=installation_failed'
      );
    });

    it('should handle callback errors', async () => {
      const installationId = '987654';
      const setupAction = 'install';
      const state = Buffer.from(JSON.stringify({ userId: mockUser.id })).toString('base64');

      mockGitHubAppService.handleInstallationCallback.mockRejectedValue(
        new Error('Installation error')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.handleGitHubAppCallback(
        installationId,
        setupAction,
        state,
        mockResponse as Response
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'GitHub App callback error:',
        expect.any(Error)
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/integrations?error=callback_error'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove an integration', async () => {
      const type = IntegrationType.GITHUB;

      await controller.remove(mockRequest, type);

      expect(mockIntegrationsService.remove).toHaveBeenCalledWith(mockUser.id, type);
    });

    it('should return success message', async () => {
      const type = IntegrationType.GITHUB;

      const result = await controller.remove(mockRequest, type);

      expect(result).toEqual({
        message: `${type} integration removed successfully`,
      });
    });
  });
});