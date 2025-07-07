export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
}
export interface GitHubActivity {
    commits: GitHubCommit[];
    pullRequests: GitHubPullRequest[];
    issues: GitHubIssue[];
}
export interface GitHubCommit {
    sha: string;
    message: string;
    url: string;
    author: string;
    date: string;
    repository: string;
}
export interface GitHubPullRequest {
    id: number;
    title: string;
    url: string;
    state: 'open' | 'closed' | 'merged';
    createdAt: string;
    updatedAt: string;
    repository: string;
    action: 'opened' | 'reviewed' | 'merged' | 'closed';
}
export interface GitHubIssue {
    id: number;
    title: string;
    url: string;
    state: 'open' | 'closed';
    createdAt: string;
    updatedAt: string;
    repository: string;
    action: 'opened' | 'closed' | 'commented';
}
//# sourceMappingURL=index.d.ts.map