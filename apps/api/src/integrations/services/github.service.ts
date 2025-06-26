import { Injectable } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';
import { GitHubClient } from '@morning-story/integrations';
import { GitHubActivity } from '@morning-story/shared';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class GitHubService {
  constructor(private integrationsService: IntegrationsService) {}

  async fetchUserActivity(userId: string, since: Date, until?: Date): Promise<GitHubActivity | null> {
    const integration = await this.integrationsService.findOne(userId, IntegrationType.GITHUB);
    
    if (!integration || !integration.isActive) {
      return null;
    }

    const client = new GitHubClient({
      accessToken: integration.accessToken,
      username: integration.metadata?.username,
    });

    const isValid = await client.validateToken();
    if (!isValid) {
      await this.integrationsService.update(userId, IntegrationType.GITHUB, {
        isActive: false,
      });
      return null;
    }

    const activity = await client.fetchActivity(since, until);
    
    await this.integrationsService.update(userId, IntegrationType.GITHUB, {
      lastSyncedAt: new Date(),
    });

    return activity;
  }
}