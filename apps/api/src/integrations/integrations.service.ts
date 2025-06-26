import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Integration, IntegrationType } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<Integration[]> {
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
        accessToken: false,
        refreshToken: false,
        metadata: true,
        tokenExpiry: true,
      },
    });
  }

  async findOne(userId: string, type: IntegrationType): Promise<Integration | null> {
    return this.prisma.integration.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });
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
        ...data,
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
    return this.prisma.integration.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data,
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