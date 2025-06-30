import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { IntegrationType } from '@prisma/client';

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  const mockIntegration = {
    id: '1',
    userId: 'user1',
    type: IntegrationType.GITHUB,
    accessToken: 'encrypted-token',
    refreshToken: 'encrypted-refresh',
    isActive: true,
    metadata: { username: 'testuser' },
    createdAt: new Date(),
    updatedAt: new Date(),
    tokenExpiry: null,
    lastSyncedAt: null,
  };

  const mockPrismaService = {
    integration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return user integrations without sensitive data', async () => {
      const userId = 'user1';
      const integrations = [mockIntegration];

      mockPrismaService.integration.findMany.mockResolvedValue(integrations);

      const result = await service.findAll(userId);

      expect(result).toEqual(integrations);
      expect(mockPrismaService.integration.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          type: true,
          isActive: true,
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          metadata: true,
          tokenExpiry: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return integration with decrypted tokens', async () => {
      const userId = 'user1';
      const type = IntegrationType.GITHUB;
      const decryptedToken = 'decrypted-token';
      const decryptedRefresh = 'decrypted-refresh';

      mockPrismaService.integration.findUnique.mockResolvedValue(mockIntegration);
      mockEncryptionService.decrypt
        .mockReturnValueOnce(decryptedToken)
        .mockReturnValueOnce(decryptedRefresh);

      const result = await service.findOne(userId, type);

      expect(result).toEqual({
        ...mockIntegration,
        accessToken: decryptedToken,
        refreshToken: decryptedRefresh,
      });
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-token');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-refresh');
    });

    it('should return null when integration not found', async () => {
      mockPrismaService.integration.findUnique.mockResolvedValue(null);

      const result = await service.findOne('user1', IntegrationType.GITHUB);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create integration with encrypted tokens', async () => {
      const userId = 'user1';
      const type = IntegrationType.GITHUB;
      const data = {
        accessToken: 'plain-token',
        refreshToken: 'plain-refresh',
        metadata: { username: 'testuser' },
      };
      const encryptedToken = 'encrypted-token';
      const encryptedRefresh = 'encrypted-refresh';

      mockEncryptionService.encrypt
        .mockReturnValueOnce(encryptedToken)
        .mockReturnValueOnce(encryptedRefresh);
      mockPrismaService.integration.create.mockResolvedValue(mockIntegration);

      const result = await service.create(userId, type, data);

      expect(result).toEqual(mockIntegration);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(data.accessToken);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(data.refreshToken);
      expect(mockPrismaService.integration.create).toHaveBeenCalledWith({
        data: {
          userId,
          type,
          accessToken: encryptedToken,
          refreshToken: encryptedRefresh,
          tokenExpiry: undefined,
          metadata: data.metadata,
        },
      });
    });
  });

  describe('update', () => {
    it('should update integration with encrypted tokens', async () => {
      const userId = 'user1';
      const type = IntegrationType.GITHUB;
      const data = {
        accessToken: 'new-token',
        isActive: false,
      };
      const encryptedToken = 'encrypted-new-token';

      mockEncryptionService.encrypt.mockReturnValue(encryptedToken);
      mockPrismaService.integration.update.mockResolvedValue(mockIntegration);

      const result = await service.update(userId, type, data);

      expect(result).toEqual(mockIntegration);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(data.accessToken);
      expect(mockPrismaService.integration.update).toHaveBeenCalledWith({
        where: { userId_type: { userId, type } },
        data: {
          ...data,
          accessToken: encryptedToken,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete integration', async () => {
      const userId = 'user1';
      const type = IntegrationType.GITHUB;

      mockPrismaService.integration.delete.mockResolvedValue(mockIntegration);

      const result = await service.remove(userId, type);

      expect(result).toEqual(mockIntegration);
      expect(mockPrismaService.integration.delete).toHaveBeenCalledWith({
        where: { userId_type: { userId, type } },
      });
    });
  });

  describe('hasGitHubApp', () => {
    it('should return true when integration has installationId', async () => {
      const userId = 'user1';
      const integrationWithApp = {
        ...mockIntegration,
        metadata: { installationId: 12345, username: 'testuser' },
      };

      mockPrismaService.integration.findUnique.mockResolvedValue(integrationWithApp);
      mockEncryptionService.decrypt.mockReturnValue('decrypted-token');

      const result = await service.hasGitHubApp(userId);

      expect(result).toBe(true);
    });

    it('should return false when integration has no installationId', async () => {
      const userId = 'user1';

      mockPrismaService.integration.findUnique.mockResolvedValue(mockIntegration);
      mockEncryptionService.decrypt.mockReturnValue('decrypted-token');

      const result = await service.hasGitHubApp(userId);

      expect(result).toBe(false);
    });

    it('should return false when no integration exists', async () => {
      const userId = 'user1';

      mockPrismaService.integration.findUnique.mockResolvedValue(null);

      const result = await service.hasGitHubApp(userId);

      expect(result).toBe(false);
    });
  });

  describe('getGitHubIntegrationType', () => {
    it('should return "app" when integration has installationId', async () => {
      const userId = 'user1';
      const integrationWithApp = {
        ...mockIntegration,
        metadata: { installationId: 12345, username: 'testuser' },
      };

      mockPrismaService.integration.findUnique.mockResolvedValue(integrationWithApp);
      mockEncryptionService.decrypt.mockReturnValue('decrypted-token');

      const result = await service.getGitHubIntegrationType(userId);

      expect(result).toBe('app');
    });

    it('should return "token" when integration has no installationId', async () => {
      const userId = 'user1';

      mockPrismaService.integration.findUnique.mockResolvedValue(mockIntegration);
      mockEncryptionService.decrypt.mockReturnValue('decrypted-token');

      const result = await service.getGitHubIntegrationType(userId);

      expect(result).toBe('token');
    });

    it('should return null when no integration exists', async () => {
      const userId = 'user1';

      mockPrismaService.integration.findUnique.mockResolvedValue(null);

      const result = await service.getGitHubIntegrationType(userId);

      expect(result).toBeNull();
    });
  });
});