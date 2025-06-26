"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
const rest_1 = require("@octokit/rest");
class GitHubClient {
    octokit;
    username;
    constructor(config) {
        this.octokit = new rest_1.Octokit({
            auth: config.accessToken,
        });
        this.username = config.username;
    }
    async validateToken() {
        try {
            await this.octokit.users.getAuthenticated();
            return true;
        }
        catch {
            return false;
        }
    }
    async fetchActivity(since, until = new Date()) {
        if (!this.username) {
            const { data: user } = await this.octokit.users.getAuthenticated();
            this.username = user.login;
        }
        const [commits, pullRequests, issues] = await Promise.all([
            this.fetchCommits(since, until),
            this.fetchPullRequests(since, until),
            this.fetchIssues(since, until),
        ]);
        return {
            commits,
            pullRequests,
            issues,
        };
    }
    async fetchCommits(since, until) {
        const commits = [];
        try {
            const { data: events } = await this.octokit.activity.listEventsForAuthenticatedUser({
                username: this.username,
                per_page: 100,
            });
            const pushEvents = events.filter((event) => event.type === 'PushEvent' &&
                new Date(event.created_at) >= since &&
                new Date(event.created_at) <= until);
            for (const event of pushEvents) {
                const payload = event.payload;
                const repoName = event.repo.name;
                for (const commit of payload.commits || []) {
                    commits.push({
                        sha: commit.sha,
                        message: commit.message,
                        url: `https://github.com/${repoName}/commit/${commit.sha}`,
                        author: commit.author.name || this.username,
                        date: event.created_at,
                        repository: repoName,
                    });
                }
            }
        }
        catch (error) {
            console.error('Error fetching commits:', error);
        }
        return commits;
    }
    async fetchPullRequests(since, until) {
        const pullRequests = [];
        try {
            const { data: search } = await this.octokit.search.issuesAndPullRequests({
                q: `is:pr author:${this.username} updated:>=${since.toISOString().split('T')[0]}`,
                sort: 'updated',
                order: 'desc',
                per_page: 100,
            });
            for (const item of search.items) {
                if (!item.pull_request)
                    continue;
                const pr = {
                    id: item.number,
                    title: item.title,
                    url: item.html_url,
                    state: item.state,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    repository: item.repository_url.split('/').slice(-2).join('/'),
                    action: 'opened',
                };
                if (new Date(item.created_at) >= since && new Date(item.created_at) <= until) {
                    pr.action = 'opened';
                }
                else if (item.state === 'closed' && new Date(item.closed_at) >= since) {
                    pr.action = item.pull_request.merged_at ? 'merged' : 'closed';
                }
                else {
                    pr.action = 'reviewed';
                }
                pullRequests.push(pr);
            }
        }
        catch (error) {
            console.error('Error fetching pull requests:', error);
        }
        return pullRequests;
    }
    async fetchIssues(since, until) {
        const issues = [];
        try {
            const { data: search } = await this.octokit.search.issuesAndPullRequests({
                q: `is:issue involves:${this.username} updated:>=${since.toISOString().split('T')[0]}`,
                sort: 'updated',
                order: 'desc',
                per_page: 100,
            });
            for (const item of search.items) {
                if (item.pull_request)
                    continue;
                const issue = {
                    id: item.number,
                    title: item.title,
                    url: item.html_url,
                    state: item.state,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    repository: item.repository_url.split('/').slice(-2).join('/'),
                    action: 'commented',
                };
                if (new Date(item.created_at) >= since && new Date(item.created_at) <= until) {
                    issue.action = 'opened';
                }
                else if (item.state === 'closed' && item.closed_at && new Date(item.closed_at) >= since) {
                    issue.action = 'closed';
                }
                issues.push(issue);
            }
        }
        catch (error) {
            console.error('Error fetching issues:', error);
        }
        return issues;
    }
}
exports.GitHubClient = GitHubClient;
//# sourceMappingURL=github.client.js.map