import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class GitHubAppService {
  private appId: string;
  private privateKey: string;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly integrationsService: IntegrationsService,
  ) {
    this.appId = this.configService.get<string>('GITHUB_APP_ID');
    this.privateKey = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');
  }

  /**
   * Check if GitHub App is configured
   */
  isConfigured(): boolean {
    const appId = this.configService.get<string>('GITHUB_APP_ID');
    const privateKey = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');
    const appName = this.configService.get<string>('GITHUB_APP_NAME');
    
    return !!(appId && privateKey && appName && 
             appId !== 'your-github-app-id' && 
             !privateKey.includes('your-private-key-here'));
  }

  /**
   * Get the installation URL for users to install the GitHub App
   */
  getInstallationUrl(state?: string): string {
    if (!this.isConfigured()) {
      throw new Error('GitHub App is not configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_NAME in your environment variables.');
    }
    
    const appName = this.configService.get<string>('GITHUB_APP_NAME', 'morning-story');
    const stateParam = state ? `?state=${state}` : '';
    return `https://github.com/apps/${appName}/installations/new${stateParam}`;
  }

  /**
   * Handle the callback after user installs the app
   */
  async handleInstallationCallback(
    userId: string,
    installationId: number,
    setupAction: string,
  ) {
    try {
      // Create app-authenticated Octokit
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.appId,
          privateKey: this.privateKey,
        },
      });

      // Get installation details
      const installation = await appOctokit.rest.apps.getInstallation({
        installation_id: installationId,
      });

      // Create an authenticated client for this installation
      const installationOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.appId,
          privateKey: this.privateKey,
          installationId,
        },
      });
      
      // Get the authenticated user
      const { data: repos } = await installationOctokit.rest.apps.listReposAccessibleToInstallation();
      
      // Store the installation
      await this.integrationsService.create(userId, IntegrationType.GITHUB, {
        accessToken: '', // No personal token needed!
        metadata: {
          installationId,
          accountType: 'type' in installation.data.account ? installation.data.account.type : 'organization',
          accountLogin: 'login' in installation.data.account ? installation.data.account.login : installation.data.account.name,
          repositories: repos.repositories.map(r => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
          })),
        },
      });

      return {
        success: true,
        message: 'GitHub App installed successfully',
        installation: {
          id: installationId,
          account: 'login' in installation.data.account ? installation.data.account.login : installation.data.account.name,
          repositories: repos.repositories.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to handle GitHub App installation: ${error.message}`);
    }
  }

  /**
   * Get an authenticated Octokit instance for a user's installation
   */
  async getInstallationClient(userId: string): Promise<Octokit | null> {
    const integration = await this.integrationsService.findOne(
      userId,
      IntegrationType.GITHUB,
    );

    const metadata = integration?.metadata as any;
    if (!metadata?.installationId) {
      return null;
    }

    try {
      return new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.appId,
          privateKey: this.privateKey,
          installationId: metadata.installationId as number,
        },
      });
    } catch (error) {
      console.error('Failed to get installation client:', error);
      return null;
    }
  }

  /**
   * Fetch user activity using GitHub App installation
   */
  async fetchActivityWithApp(userId: string, since: Date, until: Date) {
    const octokit = await this.getInstallationClient(userId);
    
    if (!octokit) {
      return null;
    }

    // Use the same logic as before, but with the installation-authenticated client
    const { data: repos } = await octokit.rest.apps.listReposAccessibleToInstallation();
    
    const activity = {
      commits: [],
      pullRequests: [],
      issues: [],
    };

    // Fetch activity from each repository
    for (const repo of repos.repositories) {
      try {
        // Get commits
        const { data: commits } = await octokit.rest.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          since: since.toISOString(),
          until: until.toISOString(),
        });
        
        activity.commits.push(...commits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          url: commit.html_url,
          author: commit.author?.login || commit.commit.author.name,
          date: commit.commit.author.date,
          repository: repo.full_name,
        })));

        // Get pull requests
        const { data: prs } = await octokit.rest.pulls.list({
          owner: repo.owner.login,
          repo: repo.name,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
        });

        activity.pullRequests.push(...prs
          .filter(pr => new Date(pr.updated_at) >= since && new Date(pr.updated_at) <= until)
          .map(pr => ({
            id: pr.number,
            title: pr.title,
            url: pr.html_url,
            state: pr.state,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            repository: repo.full_name,
            action: pr.state === 'closed' ? 'closed' : 'opened',
          }))
        );
      } catch (error) {
        console.error(`Error fetching activity for ${repo.full_name}:`, error);
      }
    }

    return activity;
  }
}