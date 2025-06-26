export const INTEGRATION_TYPES = {
  GITHUB: 'GITHUB',
  ASANA: 'ASANA',
  JIRA: 'JIRA',
  TRELLO: 'TRELLO',
  GITLAB: 'GITLAB',
  SLACK: 'SLACK',
} as const;

export const STANDUP_TONE = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  DETAILED: 'detailed',
  CONCISE: 'concise',
} as const;

export const STANDUP_LENGTH = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
} as const;