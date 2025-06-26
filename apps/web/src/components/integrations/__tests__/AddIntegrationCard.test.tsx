import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { AddIntegrationCard } from '../AddIntegrationCard'

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock alert
const mockAlert = vi.fn()
Object.defineProperty(window, 'alert', { value: mockAlert })

describe('AddIntegrationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('renders GitHub integration correctly', () => {
    render(
      <AddIntegrationCard
        type="GITHUB"
        description="Connect your GitHub account"
        isImplemented={true}
      />
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('🐙')).toBeInTheDocument()
    expect(screen.getByText('Connect your GitHub account')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Connect')).toBeInTheDocument()
  })

  it('renders unimplemented integration correctly', () => {
    render(
      <AddIntegrationCard
        type="JIRA"
        description="Connect your Jira account"
        isImplemented={false}
      />
    )

    expect(screen.getByText('Jira')).toBeInTheDocument()
    expect(screen.getByText('🟦')).toBeInTheDocument()
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    
    const connectButton = screen.getByText('Coming Soon')
    expect(connectButton).toBeDisabled()
  })

  it('redirects to GitHub OAuth when clicking Connect for GitHub', () => {
    render(
      <AddIntegrationCard
        type="GITHUB"
        description="Connect your GitHub account"
        isImplemented={true}
      />
    )

    fireEvent.click(screen.getByText('Connect'))
    expect(mockLocation.href).toBe('/api/auth/github')
  })

  it('shows coming soon alert for unimplemented integrations', () => {
    render(
      <AddIntegrationCard
        type="JIRA"
        description="Connect your Jira account"
        isImplemented={false}
      />
    )

    // Button should be disabled, so no click event is fired
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    // We can't click disabled buttons, so let's test if it would show alert for enabled but unsupported
  })

  it('shows coming soon alert for implemented but unsupported integrations', () => {
    render(
      <AddIntegrationCard
        type="ASANA"
        description="Connect your Asana account"
        isImplemented={true}
      />
    )

    fireEvent.click(screen.getByText('Connect'))
    expect(mockAlert).toHaveBeenCalledWith('Asana integration coming soon!')
  })

  it('renders different integration types with correct icons', () => {
    const integrationTypes = [
      { type: 'GITHUB', icon: '🐙' },
      { type: 'JIRA', icon: '🟦' },
      { type: 'ASANA', icon: '🔴' },
      { type: 'TRELLO', icon: '🟧' },
      { type: 'GITLAB', icon: '🦊' },
      { type: 'SLACK', icon: '💬' },
    ]

    integrationTypes.forEach(({ type, icon }) => {
      const { unmount } = render(
        <AddIntegrationCard
          type={type}
          description={`Connect your ${type} account`}
          isImplemented={false}
        />
      )

      expect(screen.getByText(icon)).toBeInTheDocument()
      unmount()
    })
  })

  it('has correct styling for dashed border', () => {
    const { container } = render(
      <AddIntegrationCard
        type="GITHUB"
        description="Connect your GitHub account"
        isImplemented={true}
      />
    )

    const card = container.querySelector('.border-dashed')
    expect(card).toHaveClass('border-dashed', 'border-2')
  })
})