import { Controller, Get, Delete, Param, UseGuards, Request, Post, Body, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { IntegrationsService } from './integrations.service';
// import { GitHubAppService } from './services/github-app.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationType } from '@prisma/client';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    // private readonly githubAppService: GitHubAppService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all user integrations' })
  async findAll(@Request() req: any) {
    return this.integrationsService.findAll(req.user.id);
  }

  @Get('github/type')
  @ApiOperation({ summary: 'Get GitHub integration type (app or token)' })
  async getGitHubIntegrationType(@Request() req: any) {
    const type = await this.integrationsService.getGitHubIntegrationType(req.user.id);
    return { type };
  }

  @Post('github/connect')
  @ApiOperation({ summary: 'Connect GitHub using Personal Access Token' })
  async connectGitHub(@Request() req: any, @Body() body: { personalAccessToken: string }) {
    return this.integrationsService.connectGitHubWithToken(req.user.id, body.personalAccessToken);
  }

  @Get('github/app/install')
  @ApiOperation({ summary: 'Get GitHub App installation URL' })
  async getGitHubAppInstallUrl(@Request() req: any) {
    return {
      error: 'GitHub App not configured',
      message: 'GitHub App integration is temporarily disabled.',
      configured: false
    };
  }

  @Get('github/app/callback')
  @ApiOperation({ summary: 'Handle GitHub App installation callback' })
  @ApiQuery({ name: 'installation_id', required: true })
  @ApiQuery({ name: 'setup_action', required: true })
  @ApiQuery({ name: 'state', required: false })
  async handleGitHubAppCallback(
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      let userId: string;
      
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } else {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations?error=missing_state`);
      }

      // const result = await this.githubAppService.handleInstallationCallback(
      //   userId,
      //   parseInt(installationId),
      //   setupAction,
      // );
      const result = { success: false, error: 'GitHub App temporarily disabled' };

      if (result.success) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations?success=github_connected`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations?error=installation_failed`);
      }
    } catch (error) {
      console.error('GitHub App callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations?error=callback_error`);
    }
  }

  @Delete(':type')
  @ApiOperation({ summary: 'Remove an integration' })
  async remove(@Request() req: any, @Param('type') type: IntegrationType) {
    await this.integrationsService.remove(req.user.id, type);
    return { message: `${type} integration removed successfully` };
  }
}