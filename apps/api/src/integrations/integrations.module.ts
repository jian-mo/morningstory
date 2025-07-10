import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './services/github.service';
import { GitHubAppService } from './services/github-app.service';

@Module({
  providers: [IntegrationsService, GitHubService, GitHubAppService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, GitHubService, GitHubAppService],
})
export class IntegrationsModule {}