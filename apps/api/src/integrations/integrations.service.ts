import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { Integration, IntegrationType } from '@prisma/client';
import { Octokit } from '@octokit/rest';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findAll(userId: string): Promise<Omit<Integration, 'accessToken' | 'refreshToken'>[]> {
    return this.prisma.integration.findMany({
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
  }

  async findOne(userId: string, type: IntegrationType): Promise<Integration | null> {
    const integration = await this.prisma.integration.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    if (integration) {
      // Decrypt tokens for use
      integration.accessToken = this.encryptionService.decrypt(integration.accessToken);
      if (integration.refreshToken) {
        integration.refreshToken = this.encryptionService.decrypt(integration.refreshToken);
      }
    }

    return integration;
  }

  async create(userId: string, type: IntegrationType, data: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    metadata?: any;
  }): Promise<Integration> {
    return this.prisma.integration.create({
      data: {
        userId,
        type,
        accessToken: this.encryptionService.encrypt(data.accessToken),
        refreshToken: data.refreshToken ? this.encryptionService.encrypt(data.refreshToken) : null,
        tokenExpiry: data.tokenExpiry,
        metadata: data.metadata,
      },
    });
  }

  async update(userId: string, type: IntegrationType, data: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    metadata?: any;
    isActive?: boolean;
    lastSyncedAt?: Date;
  }): Promise<Integration> {
    const updateData: any = { ...data };
    
    if (data.accessToken) {
      updateData.accessToken = this.encryptionService.encrypt(data.accessToken);
    }
    
    if (data.refreshToken) {
      updateData.refreshToken = this.encryptionService.encrypt(data.refreshToken);
    }
    
    return this.prisma.integration.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data: updateData,
    });
  }

  async remove(userId: string, type: IntegrationType): Promise<Integration> {
    return this.prisma.integration.delete({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });
  }

  /**
   * Check if user has GitHub App integration (vs Personal Access Token)
   */
  async hasGitHubApp(userId: string): Promise<boolean> {
    const integration = await this.findOne(userId, IntegrationType.GITHUB);
    const metadata = integration?.metadata as any;
    return metadata?.installationId !== undefined;
  }

  /**
   * Get GitHub integration type for display purposes
   */
  async getGitHubIntegrationType(userId: string): Promise<'app' | 'token' | null> {
    const integration = await this.findOne(userId, IntegrationType.GITHUB);
    if (!integration) return null;
    const metadata = integration.metadata as any;
    return metadata?.installationId ? 'app' : 'token';
  }

  async connectGitHubWithToken(userId: string, personalAccessToken: string) {
    // Validate the token by making a test API call
    const octokit = new Octokit({ auth: personalAccessToken });
    
    try {
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Check if integration already exists
      const existingIntegration = await this.findOne(userId, IntegrationType.GITHUB);
      
      const integrationData = {
        accessToken: personalAccessToken,
        metadata: {
          githubId: user.id,
          username: user.login,
          profileUrl: user.html_url,
          avatarUrl: user.avatar_url,
        },
        lastSyncedAt: new Date(),
      };
      
      if (existingIntegration) {
        // Update existing integration
        await this.update(userId, IntegrationType.GITHUB, integrationData);
      } else {
        // Create new integration
        await this.create(userId, IntegrationType.GITHUB, integrationData);
      }
      
      return {
        success: true,
        message: 'GitHub integration connected successfully',
        user: {
          username: user.login,
          profileUrl: user.html_url,
          avatarUrl: user.avatar_url,
        },
      };
    } catch (error) {
      throw new Error('Invalid GitHub Personal Access Token');
    }
  }
}