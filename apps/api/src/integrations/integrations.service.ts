import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { Integration, IntegrationType } from '@prisma/client';

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
}