"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("./prompts");
class OpenAIClient {
    client;
    model;
    constructor(apiKey, model = 'openai/gpt-4o-mini', baseURL) {
        const defaultBaseURL = 'https://openrouter.ai/api/v1';
        this.client = new openai_1.default({
            apiKey,
            baseURL: baseURL || defaultBaseURL,
            defaultHeaders: baseURL ? {} : {
                'HTTP-Referer': 'https://morning-story.com',
                'X-Title': 'Morning Story Standup Bot'
            }
        });
        this.model = model;
    }
    async generateStandup(request) {
        const prompt = prompts_1.STANDUP_PROMPTS[request.preferences.tone] || prompts_1.DEFAULT_PROMPT;
        const userPrompt = this.buildUserPrompt(prompt?.user || '', request);
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
        }
        catch (error) {
            throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
        }
    }
    buildUserPrompt(template, request) {
        const activityData = this.formatGitHubActivity(request.githubActivity);
        return template
            .replace('{githubActivity}', activityData)
            .replace('{activityData}', activityData)
            .replace('{sprintGoal}', request.preferences.sprintGoal || 'No specific sprint goal provided.')
            .replace('{tone}', request.preferences.tone)
            .replace('{length}', request.preferences.length)
            .replace('{date}', request.date.toDateString())
            .replace('{customPrompt}', request.preferences.customPrompt || '');
    }
    formatGitHubActivity(activity) {
        if (!activity)
            return 'No GitHub activity found.';
        const { commits = [], pullRequests = [], issues = [] } = activity;
        let formatted = '';
        if (commits.length > 0) {
            formatted += `Commits (${commits.length}):\n`;
            commits.slice(0, 5).forEach((commit) => {
                formatted += `- ${commit.message} (${commit.repository})\n`;
            });
            formatted += '\n';
        }
        if (pullRequests.length > 0) {
            formatted += `Pull Requests (${pullRequests.length}):\n`;
            pullRequests.slice(0, 3).forEach((pr) => {
                formatted += `- ${pr.action}: ${pr.title} (${pr.repository})\n`;
            });
            formatted += '\n';
        }
        if (issues.length > 0) {
            formatted += `Issues (${issues.length}):\n`;
            issues.slice(0, 3).forEach((issue) => {
                formatted += `- ${issue.action}: ${issue.title} (${issue.repository})\n`;
            });
        }
        return formatted || 'No significant GitHub activity found.';
    }
    getMaxTokensForLength(length) {
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
    calculateCost(tokens) {
        const costPer1000Tokens = 0.000375;
        return (tokens / 1000) * costPer1000Tokens;
    }
    async validateApiKey() {
        try {
            await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai.client.js.map