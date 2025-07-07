import { StandupGenerationRequest, StandupGenerationResponse } from './types';
export declare class OpenAIClient {
    private client;
    private model;
    constructor(apiKey: string, model?: string, baseURL?: string);
    generateStandup(request: StandupGenerationRequest): Promise<StandupGenerationResponse>;
    private buildUserPrompt;
    private formatGitHubActivity;
    private getMaxTokensForLength;
    private calculateCost;
    validateApiKey(): Promise<boolean>;
}
//# sourceMappingURL=openai.client.d.ts.map