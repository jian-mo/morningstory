export interface IntegrationClient {
  validateToken(): Promise<boolean>;
  fetchActivity(since: Date, until?: Date): Promise<any>;
}

export interface GitHubClientConfig {
  accessToken: string;
  username?: string;
}