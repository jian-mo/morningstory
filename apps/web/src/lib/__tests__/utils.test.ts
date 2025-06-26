import { describe, it, expect } from 'vitest'
import { cn, getIntegrationIcon, getIntegrationName } from '../utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('', null, undefined)).toBe('')
    })
  })

  describe('getIntegrationIcon', () => {
    it('returns correct icons for known integration types', () => {
      expect(getIntegrationIcon('GITHUB')).toBe('🐙')
      expect(getIntegrationIcon('JIRA')).toBe('🟦')
      expect(getIntegrationIcon('ASANA')).toBe('🔴')
      expect(getIntegrationIcon('TRELLO')).toBe('🟧')
      expect(getIntegrationIcon('GITLAB')).toBe('🦊')
      expect(getIntegrationIcon('SLACK')).toBe('💬')
    })

    it('returns default icon for unknown types', () => {
      expect(getIntegrationIcon('UNKNOWN')).toBe('🔗')
      expect(getIntegrationIcon('')).toBe('🔗')
    })

    it('is case sensitive', () => {
      expect(getIntegrationIcon('github')).toBe('🔗')
      expect(getIntegrationIcon('GitHub')).toBe('🔗')
    })
  })

  describe('getIntegrationName', () => {
    it('returns correct names for known integration types', () => {
      expect(getIntegrationName('GITHUB')).toBe('GitHub')
      expect(getIntegrationName('JIRA')).toBe('Jira')
      expect(getIntegrationName('ASANA')).toBe('Asana')
      expect(getIntegrationName('TRELLO')).toBe('Trello')
      expect(getIntegrationName('GITLAB')).toBe('GitLab')
      expect(getIntegrationName('SLACK')).toBe('Slack')
    })

    it('returns the input for unknown types', () => {
      expect(getIntegrationName('UNKNOWN')).toBe('UNKNOWN')
      expect(getIntegrationName('CUSTOM_TYPE')).toBe('CUSTOM_TYPE')
      expect(getIntegrationName('')).toBe('')
    })

    it('is case sensitive', () => {
      expect(getIntegrationName('github')).toBe('github')
      expect(getIntegrationName('GitHub')).toBe('GitHub')
    })
  })
})