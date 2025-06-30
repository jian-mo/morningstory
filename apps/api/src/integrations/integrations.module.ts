import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './services/github.service';
// import { GitHubAppService } from './services/github-app.service';

@Module({
  providers: [IntegrationsService, GitHubService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, GitHubService],
})
export class IntegrationsModule {}