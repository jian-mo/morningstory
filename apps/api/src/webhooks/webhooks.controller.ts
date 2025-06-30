import { Controller, Post, Body, Headers, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGitHubWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
  ) {
    // Verify webhook signature
    const webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      
      if (signature !== digest) {
        throw new BadRequestException('Invalid signature');
      }
    }

    // Log the event
    console.log(`Received GitHub webhook event: ${event}`);
    
    // Handle different event types
    switch (event) {
      case 'push':
        await this.handlePushEvent(payload);
        break;
      case 'pull_request':
        await this.handlePullRequestEvent(payload);
        break;
      case 'issues':
        await this.handleIssuesEvent(payload);
        break;
      case 'installation':
        await this.handleInstallationEvent(payload);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return { received: true };
  }

  private async handlePushEvent(payload: any) {
    console.log(`Push to ${payload.repository.full_name} by ${payload.pusher.name}`);
    // TODO: Store push activity for standup generation
  }

  private async handlePullRequestEvent(payload: any) {
    console.log(`Pull request ${payload.action} in ${payload.repository.full_name}`);
    // TODO: Store PR activity for standup generation
  }

  private async handleIssuesEvent(payload: any) {
    console.log(`Issue ${payload.action} in ${payload.repository.full_name}`);
    // TODO: Store issue activity for standup generation
  }

  private async handleInstallationEvent(payload: any) {
    console.log(`GitHub App ${payload.action} for ${payload.installation.account.login}`);
    // TODO: Handle app installation/uninstallation
  }
}