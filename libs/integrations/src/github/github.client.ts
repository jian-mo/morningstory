import { Octokit } from '@octokit/rest';
import { IntegrationClient, GitHubClientConfig } from '../types';
import { GitHubActivity, GitHubCommit, GitHubPullRequest, GitHubIssue } from '@morning-story/shared';

export class GitHubClient implements IntegrationClient {
  private octokit: Octokit;
  private username?: string;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({
      auth: config.accessToken,
    });
    this.username = config.username;
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  async fetchActivity(since: Date, until: Date = new Date()): Promise<GitHubActivity> {
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

  private async fetchCommits(since: Date, until: Date): Promise<GitHubCommit[]> {
    const commits: GitHubCommit[] = [];
    
    try {
      const { data: events } = await this.octokit.activity.listEventsForAuthenticatedUser({
        username: this.username!,
        per_page: 100,
      });

      const pushEvents = events.filter(
        (event) =>
          event.type === 'PushEvent' &&
          new Date(event.created_at) >= since &&
          new Date(event.created_at) <= until,
      );

      for (const event of pushEvents) {
        const payload = event.payload as any;
        const repoName = event.repo.name;
        
        for (const commit of payload.commits || []) {
          commits.push({
            sha: commit.sha,
            message: commit.message,
            url: `https://github.com/${repoName}/commit/${commit.sha}`,
            author: commit.author.name || this.username!,
            date: event.created_at,
            repository: repoName,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
    }

    return commits;
  }

  private async fetchPullRequests(since: Date, until: Date): Promise<GitHubPullRequest[]> {
    const pullRequests: GitHubPullRequest[] = [];
    
    try {
      const { data: search } = await this.octokit.search.issuesAndPullRequests({
        q: `is:pr author:${this.username} updated:>=${since.toISOString().split('T')[0]}`,
        sort: 'updated',
        order: 'desc',
        per_page: 100,
      });

      for (const item of search.items) {
        if (!item.pull_request) continue;
        
        const pr: GitHubPullRequest = {
          id: item.number,
          title: item.title,
          url: item.html_url,
          state: item.state as 'open' | 'closed',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          repository: item.repository_url.split('/').slice(-2).join('/'),
          action: 'opened',
        };

        if (new Date(item.created_at) >= since && new Date(item.created_at) <= until) {
          pr.action = 'opened';
        } else if (item.state === 'closed' && new Date(item.closed_at!) >= since) {
          pr.action = item.pull_request.merged_at ? 'merged' : 'closed';
        } else {
          pr.action = 'reviewed';
        }

        pullRequests.push(pr);
      }
    } catch (error) {
      console.error('Error fetching pull requests:', error);
    }

    return pullRequests;
  }

  private async fetchIssues(since: Date, until: Date): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = [];
    
    try {
      const { data: search } = await this.octokit.search.issuesAndPullRequests({
        q: `is:issue involves:${this.username} updated:>=${since.toISOString().split('T')[0]}`,
        sort: 'updated',
        order: 'desc',
        per_page: 100,
      });

      for (const item of search.items) {
        if (item.pull_request) continue;
        
        const issue: GitHubIssue = {
          id: item.number,
          title: item.title,
          url: item.html_url,
          state: item.state as 'open' | 'closed',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          repository: item.repository_url.split('/').slice(-2).join('/'),
          action: 'commented',
        };

        if (new Date(item.created_at) >= since && new Date(item.created_at) <= until) {
          issue.action = 'opened';
        } else if (item.state === 'closed' && item.closed_at && new Date(item.closed_at) >= since) {
          issue.action = 'closed';
        }

        issues.push(issue);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }

    return issues;
  }
}