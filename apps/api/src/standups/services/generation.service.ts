import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient } from '@morning-story/llm';
import { GitHubService } from '../../integrations/services/github.service';
import { StandupsService } from '../standups.service';
import { UsersService } from '../../users/users.service';
import { getYesterday, getStartOfDay, getEndOfDay } from '@morning-story/shared';

@Injectable()
export class StandupGenerationService {
  private openaiClient: OpenAIClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly githubService: GitHubService,
    private readonly standupsService: StandupsService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn('OpenAI API key not configured. Standup generation will not work.');
    } else {
      this.openaiClient = new OpenAIClient(apiKey);
    }
  }

  async generateStandup(
    userId: string,
    options: {
      tone?: 'professional' | 'casual' | 'detailed' | 'concise';
      length?: 'short' | 'medium' | 'long';
      customPrompt?: string;
      date?: Date;
    } = {}
  ) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const targetDate = options.date || getYesterday();
      const since = getStartOfDay(targetDate);
      const until = getEndOfDay(targetDate);

      // Fetch activity from GitHub
      const githubActivity = await this.githubService.fetchUserActivity(userId, since, until);

      // Check if we have any activity
      if (!githubActivity || (
        githubActivity.commits.length === 0 &&
        githubActivity.pullRequests.length === 0 &&
        githubActivity.issues.length === 0
      )) {
        return {
          content: `No activity found for ${targetDate.toDateString()}. Consider updating your integrations or checking your connected accounts.`,
          rawData: { githubActivity: null },
          metadata: { 
            generated_at: new Date(),
            tone: options.tone || 'professional',
            length: options.length || 'medium',
          }
        };
      }

      // Generate standup with OpenAI (if available)
      if (!this.openaiClient) {
        return {
          content: this.generateFallbackStandup(githubActivity, options),
          rawData: { githubActivity },
          metadata: { 
            generated_at: new Date(),
            tone: options.tone || 'professional',
            length: options.length || 'medium',
            source: 'fallback'
          }
        };
      }

      const generationResponse = await this.openaiClient.generateStandup({
        githubActivity,
        preferences: {
          tone: options.tone || 'professional',
          length: options.length || 'medium',
          customPrompt: options.customPrompt,
        },
        date: targetDate,
      });

      return {
        content: generationResponse.content,
        rawData: { githubActivity },
        metadata: {
          generated_at: new Date(),
          ...generationResponse.metadata,
          tone: options.tone,
          length: options.length,
        }
      };
    } catch (error) {
      console.error('Standup generation error:', error);
      throw new Error(`Failed to generate standup: ${error.message}`);
    }
  }

  async regenerateStandup(
    userId: string,
    standupId: string,
    options: {
      tone?: 'professional' | 'casual' | 'detailed' | 'concise';
      length?: 'short' | 'medium' | 'long';
      customPrompt?: string;
    } = {}
  ) {
    const existingStandup = await this.standupsService.findOne(userId, standupId);
    if (!existingStandup) {
      throw new Error('Standup not found');
    }

    // Use the same raw data but regenerate with new options
    const githubActivity = (existingStandup.rawData as any)?.githubActivity;

    if (!this.openaiClient) {
      return {
        content: this.generateFallbackStandup(githubActivity, options),
        rawData: existingStandup.rawData,
        metadata: { 
          generated_at: new Date(),
          tone: options.tone || 'professional',
          length: options.length || 'medium',
          source: 'fallback'
        }
      };
    }

    const generationResponse = await this.openaiClient.generateStandup({
      githubActivity,
      preferences: {
        tone: options.tone || 'professional',
        length: options.length || 'medium',
        customPrompt: options.customPrompt,
      },
      date: existingStandup.date,
    });

    return {
      content: generationResponse.content,
      rawData: existingStandup.rawData,
      metadata: {
        generated_at: new Date(),
        ...generationResponse.metadata,
        tone: options.tone,
        length: options.length,
      }
    };
  }

  private generateFallbackStandup(githubActivity: any, options: any): string {
    const parts = ['## Yesterday\'s Work'];
    
    if (githubActivity?.commits?.length > 0) {
      parts.push('\n**Commits:**');
      githubActivity.commits.slice(0, 5).forEach((commit: any) => {
        parts.push(`- ${commit.message} (${commit.repository})`);
      });
    }

    if (githubActivity?.pullRequests?.length > 0) {
      parts.push('\n**Pull Requests:**');
      githubActivity.pullRequests.slice(0, 3).forEach((pr: any) => {
        parts.push(`- ${pr.title} - ${pr.state} (${pr.repository})`);
      });
    }

    if (githubActivity?.issues?.length > 0) {
      parts.push('\n**Issues:**');
      githubActivity.issues.slice(0, 3).forEach((issue: any) => {
        parts.push(`- ${issue.title} - ${issue.state} (${issue.repository})`);
      });
    }

    parts.push('\n## Today\'s Plan');
    parts.push('- Continue working on current projects');
    parts.push('- Review and address any feedback');
    
    parts.push('\n## Blockers');
    parts.push('- None at this time');

    return parts.join('\n');
  }
}