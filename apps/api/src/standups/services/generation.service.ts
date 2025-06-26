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
    private configService: ConfigService,
    private githubService: GitHubService,
    private standupsService: StandupsService,
    private usersService: UsersService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY must be configured');
    }
    this.openaiClient = new OpenAIClient(apiKey);
  }

  async generateDailyStandup(userId: string, date: Date = new Date()) {
    // Get user preferences
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if standup already exists for this date
    const existingStandup = await this.standupsService.findByDate(userId, date);
    if (existingStandup) {
      return existingStandup;
    }

    // Fetch activity data from integrations
    const yesterday = getYesterday();
    const startOfYesterday = getStartOfDay(yesterday);
    const endOfYesterday = getEndOfDay(yesterday);

    const githubActivity = await this.githubService.fetchUserActivity(
      userId,
      startOfYesterday,
      endOfYesterday,
    );

    // Get user preferences (will implement UserPreferences later)
    const preferences = {
      tone: 'professional',
      length: 'medium',
      customPrompt: undefined,
    };

    // Generate standup using OpenAI
    const generationResponse = await this.openaiClient.generateStandup({
      githubActivity,
      preferences,
      date,
    });

    // Save the generated standup
    const standup = await this.standupsService.create(userId, {
      content: generationResponse.content,
      rawData: {
        githubActivity,
        preferences,
      },
      metadata: generationResponse.metadata,
      date,
    });

    return standup;
  }

  async regenerateStandup(userId: string, standupId: string, preferences?: any) {
    const existingStandup = await this.standupsService.findOne(standupId, userId);
    if (!existingStandup) {
      throw new Error('Standup not found');
    }

    const rawData = existingStandup.rawData as any;
    const updatedPreferences = preferences || rawData.preferences;

    const generationResponse = await this.openaiClient.generateStandup({
      githubActivity: rawData.githubActivity,
      preferences: updatedPreferences,
      date: existingStandup.date,
    });

    // Update the existing standup
    const updatedStandup = await this.standupsService.create(userId, {
      content: generationResponse.content,
      rawData: {
        ...rawData,
        preferences: updatedPreferences,
      },
      metadata: generationResponse.metadata,
      date: existingStandup.date,
    });

    return updatedStandup;
  }
}