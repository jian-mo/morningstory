import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { Integrations } from '../Integrations'
import { integrationsApi, Integration } from '../../lib/api'

// Mock the API
vi.mock('../../lib/api', () => ({
  integrationsApi: {
    list: vi.fn(),
  },
}))

const mockIntegrations: Integration[] = [
  {
    id: '1',
    type: 'GITHUB',
    isActive: true,
    lastSyncedAt: '2023-12-01T10:00:00Z',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    metadata: { username: 'testuser' },
  },
]

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  )
}

describe('Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    vi.mocked(integrationsApi.list).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithProviders(<Integrations />)
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('renders error state', async () => {
    vi.mocked(integrationsApi.list).mockRejectedValue(new Error('API Error'))

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('Error loading integrations')).toBeInTheDocument()
      expect(screen.getByText('Please try refreshing the page.')).toBeInTheDocument()
    })
  })

  it('renders empty integrations state', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: [] } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('Integrations')).toBeInTheDocument()
      expect(screen.getByText('0 Connected')).toBeInTheDocument()
      expect(screen.getByText('Connect Your First Platform')).toBeInTheDocument()
    })
  })

  it('renders connected integrations', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: mockIntegrations } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('1 Connected')).toBeInTheDocument()
      expect(screen.getByText('Connected Platforms')).toBeInTheDocument()
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
  })

  it('shows available integrations excluding connected ones', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: mockIntegrations } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('Add More Platforms')).toBeInTheDocument()
      
      // Should show other platforms but not GitHub (already connected)
      expect(screen.getByText('Jira')).toBeInTheDocument()
      expect(screen.getByText('Asana')).toBeInTheDocument()
      expect(screen.getByText('Trello')).toBeInTheDocument()
      expect(screen.getByText('GitLab')).toBeInTheDocument()
      expect(screen.getByText('Slack')).toBeInTheDocument()
      
      // GitHub should appear only once (in connected section)
      expect(screen.getAllByText('GitHub')).toHaveLength(1)
    })
  })

  it('displays correct badge counts', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: mockIntegrations } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('1 Connected')).toBeInTheDocument()
      expect(screen.getByText('0 Available')).toBeInTheDocument() // GitHub is connected, so 0 implemented ones available
    })
  })

  it('renders help section', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: [] } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      expect(screen.getByText('Need Help?')).toBeInTheDocument()
      expect(screen.getByText(/Integrations are used to fetch your recent activity/)).toBeInTheDocument()
      expect(screen.getByText(/Your credentials are encrypted and stored securely/)).toBeInTheDocument()
    })
  })

  it('shows correct implementation status for platforms', async () => {
    vi.mocked(integrationsApi.list).mockResolvedValue({ data: [] } as any)

    renderWithProviders(<Integrations />)

    await waitFor(() => {
      // GitHub should show as available
      const githubCard = screen.getByText('GitHub').closest('div')
      expect(githubCard).toHaveTextContent('Available')
      expect(githubCard).toHaveTextContent('Connect')

      // Others should show as coming soon
      const jiraCard = screen.getByText('Jira').closest('div')
      expect(jiraCard).toHaveTextContent('Coming Soon')
    })
  })
})