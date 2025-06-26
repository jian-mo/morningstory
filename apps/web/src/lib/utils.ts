import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIntegrationIcon(type: string) {
  const icons = {
    GITHUB: '🐙',
    JIRA: '🟦',
    ASANA: '🔴',
    TRELLO: '🟧',
    GITLAB: '🦊',
    SLACK: '💬',
  }
  return icons[type as keyof typeof icons] || '🔗'
}

export function getIntegrationName(type: string) {
  const names = {
    GITHUB: 'GitHub',
    JIRA: 'Jira',
    ASANA: 'Asana',
    TRELLO: 'Trello',
    GITLAB: 'GitLab',
    SLACK: 'Slack',
  }
  return names[type as keyof typeof names] || type
}