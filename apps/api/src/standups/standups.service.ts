import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Standup } from '@prisma/client';

@Injectable()
export class StandupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    content: string;
    rawData: any;
    metadata?: any;
    date?: Date;
  }): Promise<Standup> {
    return this.prisma.standup.create({
      data: {
        userId,
        content: data.content,
        rawData: data.rawData,
        metadata: data.metadata,
        date: data.date || new Date(),
      },
    });
  }

  async findAll(userId: string, take = 10, skip = 0): Promise<Standup[]> {
    return this.prisma.standup.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take,
      skip,
    });
  }

  async findOne(id: string, userId: string): Promise<Standup | null> {
    return this.prisma.standup.findFirst({
      where: { id, userId },
    });
  }

  async findByDate(userId: string, date: Date): Promise<Standup | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.standup.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async remove(id: string, userId: string): Promise<Standup> {
    return this.prisma.standup.delete({
      where: { id, userId },
    });
  }
}