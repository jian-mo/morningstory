import { IntegrationClient, GitHubClientConfig } from '../types';
import { GitHubActivity } from '@morning-story/shared';
export declare class GitHubClient implements IntegrationClient {
    private octokit;
    private username?;
    constructor(config: GitHubClientConfig);
    validateToken(): Promise<boolean>;
    fetchActivity(since: Date, until?: Date): Promise<GitHubActivity>;
    private fetchCommits;
    private fetchPullRequests;
    private fetchIssues;
}
//# sourceMappingURL=github.client.d.ts.map