import OpenAI from 'openai';
import { StandupGenerationRequest, StandupGenerationResponse } from './types';
import { STANDUP_PROMPTS, DEFAULT_PROMPT } from './prompts';

export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'openai/gpt-4o-mini', baseURL?: string) {
    // Default to OpenRouter if no baseURL provided
    const defaultBaseURL = 'https://openrouter.ai/api/v1';
    
    this.client = new OpenAI({ 
      apiKey,
      baseURL: baseURL || defaultBaseURL,
      defaultHeaders: baseURL ? {} : {
        'HTTP-Referer': 'https://morning-story.com',
        'X-Title': 'Morning Story Standup Bot'
      }
    });
    this.model = model;
  }

  async generateStandup(request: StandupGenerationRequest): Promise<StandupGenerationResponse> {
    const prompt = STANDUP_PROMPTS[request.preferences.tone] || DEFAULT_PROMPT;
    
    const userPrompt = this.buildUserPrompt(prompt?.user || '', request);
    
    // const _startTime = Date.now();
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: prompt?.system || 'You are an AI assistant that helps generate standup reports.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: this.getMaxTokensForLength(request.preferences.length),
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed);

      return {
        content,
        metadata: {
          model: this.model,
          tokensUsed,
          cost,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
    }
  }

  private buildUserPrompt(template: string, request: StandupGenerationRequest): string {
    return template
      .replace('{githubActivity}', this.formatGitHubActivity(request.githubActivity))
      .replace('{tone}', request.preferences.tone)
      .replace('{length}', request.preferences.length)
      .replace('{date}', request.date.toDateString())
      .replace('{customPrompt}', request.preferences.customPrompt || '');
  }

  private formatGitHubActivity(activity: any): string {
    if (!activity) return 'No GitHub activity found.';

    const { commits = [], pullRequests = [], issues = [] } = activity;
    
    let formatted = '';
    
    if (commits.length > 0) {
      formatted += `Commits (${commits.length}):\n`;
      commits.slice(0, 5).forEach((commit: any) => {
        formatted += `- ${commit.message} (${commit.repository})\n`;
      });
      formatted += '\n';
    }
    
    if (pullRequests.length > 0) {
      formatted += `Pull Requests (${pullRequests.length}):\n`;
      pullRequests.slice(0, 3).forEach((pr: any) => {
        formatted += `- ${pr.action}: ${pr.title} (${pr.repository})\n`;
      });
      formatted += '\n';
    }
    
    if (issues.length > 0) {
      formatted += `Issues (${issues.length}):\n`;
      issues.slice(0, 3).forEach((issue: any) => {
        formatted += `- ${issue.action}: ${issue.title} (${issue.repository})\n`;
      });
    }
    
    return formatted || 'No significant GitHub activity found.';
  }

  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'short':
        return 150;
      case 'medium':
        return 300;
      case 'long':
        return 500;
      default:
        return 300;
    }
  }

  private calculateCost(tokens: number): number {
    // OpenRouter pricing varies by model - using approximate cost for gpt-4o-mini
    // $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
    // Simplified calculation assuming 50/50 split
    const costPer1000Tokens = 0.000375; // Average of input/output costs for gpt-4o-mini
    return (tokens / 1000) * costPer1000Tokens;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}