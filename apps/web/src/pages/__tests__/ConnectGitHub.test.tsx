import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectGitHub } from '../ConnectGitHub'
import { api } from '../../lib/api'

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    request: vi.fn(),
  },
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('ConnectGitHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('renders GitHub connection options', async () => {
    // Mock GitHub App check response
    vi.mocked(api.request).mockResolvedValueOnce({
      configured: true,
    })

    render(<ConnectGitHub />)

    await waitFor(() => {
      expect(screen.getByText('Connect GitHub')).toBeInTheDocument()
      expect(screen.getByText('GitHub App')).toBeInTheDocument()
      expect(screen.getByText('Personal Access Token')).toBeInTheDocument()
    })
  })

  it('defaults to token method when GitHub App is not configured', async () => {
    // Mock GitHub App check response - not configured
    vi.mocked(api.request).mockResolvedValueOnce({
      configured: false,
    })

    render(<ConnectGitHub />)

    await waitFor(() => {
      expect(screen.getByText('Not Set Up')).toBeInTheDocument()
    })
  })

  it('handles Personal Access Token connection', async () => {
    // Mock GitHub App check response
    vi.mocked(api.request).mockResolvedValueOnce({
      configured: false,
    })

    // Mock successful token connection
    vi.mocked(api.request).mockResolvedValueOnce({})

    render(<ConnectGitHub />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Personal Access Token')).toBeInTheDocument()
    })

    // Click on Personal Access Token method
    const tokenCard = screen.getByText('Personal Access Token').closest('div')
    if (tokenCard) {
      fireEvent.click(tokenCard)
    }

    // Enter a token
    const tokenInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx')
    fireEvent.change(tokenInput, { target: { value: 'ghp_test123456789' } })

    // Click connect button
    const connectButton = screen.getByText('Connect GitHub')
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(vi.mocked(api.request)).toHaveBeenCalledWith(
        expect.stringContaining('/integrations/github/connect'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ personalAccessToken: 'ghp_test123456789' }),
        })
      )
    })
  })

  it('handles GitHub App installation when configured', async () => {
    // Mock GitHub App check response - configured
    vi.mocked(api.request)
      .mockResolvedValueOnce({
        configured: true,
      })
      .mockResolvedValueOnce({
        configured: true,
        installationUrl: 'https://github.com/apps/test-app/installations/new',
      })

    render(<ConnectGitHub />)

    await waitFor(() => {
      expect(screen.getByText('GitHub App')).toBeInTheDocument()
    })

    // Click Install GitHub App button
    const installButton = screen.getByText('Install GitHub App')
    fireEvent.click(installButton)

    await waitFor(() => {
      expect(vi.mocked(api.request)).toHaveBeenCalledWith(
        expect.stringContaining('/integrations/github/app/install')
      )
      expect(mockLocation.href).toBe('https://github.com/apps/test-app/installations/new')
    })
  })

  it('shows error message when GitHub App is not configured', async () => {
    // Mock GitHub App check response - not configured
    vi.mocked(api.request)
      .mockResolvedValueOnce({
        configured: false,
      })
      .mockResolvedValueOnce({
        configured: false,
        message: 'GitHub App integration is not set up yet.',
      })

    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<ConnectGitHub />)

    await waitFor(() => {
      expect(screen.getByText('GitHub App')).toBeInTheDocument()
    })

    // Force selection of GitHub App method
    const appCard = screen.getByText('GitHub App').closest('div')
    if (appCard) {
      fireEvent.click(appCard)
    }

    // Try to click Install GitHub App button (should show alert)
    const installButton = screen.getByText('Install GitHub App')
    fireEvent.click(installButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'GitHub App integration is not set up yet. Please use Personal Access Token instead.'
      )
    })

    alertSpy.mockRestore()
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    vi.mocked(api.request).mockRejectedValueOnce(new Error('Network error'))

    render(<ConnectGitHub />)

    await waitFor(() => {
      // Should default to token method when API fails
      expect(screen.getByText('Personal Access Token')).toBeInTheDocument()
    })
  })

  it('disables connect button when token is empty', async () => {
    // Mock GitHub App check response
    vi.mocked(api.request).mockResolvedValueOnce({
      configured: false,
    })

    render(<ConnectGitHub />)

    await waitFor(() => {
      const connectButton = screen.getByText('Connect GitHub')
      expect(connectButton).toBeDisabled()
    })
  })

  it('shows validation states for token connection', async () => {
    // Mock GitHub App check response
    vi.mocked(api.request).mockResolvedValueOnce({
      configured: false,
    })

    // Mock successful token connection
    vi.mocked(api.request).mockResolvedValueOnce({})

    render(<ConnectGitHub />)

    // Enter a token
    const tokenInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx')
    fireEvent.change(tokenInput, { target: { value: 'ghp_test123456789' } })

    // Click connect button
    const connectButton = screen.getByText('Connect GitHub')
    fireEvent.click(connectButton)

    // Should show validating state
    expect(screen.getByText('Validating...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Successfully connected! Redirecting...')).toBeInTheDocument()
    })
  })
})