import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { IntegrationCard } from '../IntegrationCard'
import { integrationsApi, Integration } from '../../../lib/api'

// Mock the API
vi.mock('../../../lib/api', () => ({
  integrationsApi: {
    remove: vi.fn(),
  },
}))

const mockIntegration: Integration = {
  id: '1',
  type: 'GITHUB',
  isActive: true,
  lastSyncedAt: '2023-12-01T10:00:00Z',
  createdAt: '2023-11-01T10:00:00Z',
  updatedAt: '2023-12-01T10:00:00Z',
  metadata: { username: 'testuser' },
}

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

describe('IntegrationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders integration information correctly', () => {
    renderWithProviders(<IntegrationCard integration={mockIntegration} />)

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Username: testuser')).toBeInTheDocument()
    expect(screen.getByText('12/1/2023')).toBeInTheDocument() // Last sync date
  })

  it('displays correct icon for GitHub', () => {
    renderWithProviders(<IntegrationCard integration={mockIntegration} />)
    expect(screen.getByText('🐙')).toBeInTheDocument()
  })

  it('shows View Profile button for GitHub integration', () => {
    renderWithProviders(<IntegrationCard integration={mockIntegration} />)
    expect(screen.getByText('View Profile')).toBeInTheDocument()
  })

  it('opens GitHub profile when View Profile is clicked', () => {
    const mockOpen = vi.fn()
    Object.defineProperty(window, 'open', { value: mockOpen })

    renderWithProviders(<IntegrationCard integration={mockIntegration} />)
    
    fireEvent.click(screen.getByText('View Profile'))
    expect(mockOpen).toHaveBeenCalledWith('https://github.com/testuser', '_blank')
  })

  it('handles remove integration with confirmation', async () => {
    const mockConfirm = vi.fn(() => true)
    Object.defineProperty(window, 'confirm', { value: mockConfirm })

    vi.mocked(integrationsApi.remove).mockResolvedValue({ data: {} } as any)

    renderWithProviders(<IntegrationCard integration={mockIntegration} />)
    
    const removeButton = screen.getByRole('button', { name: '' }) // Trash icon button
    fireEvent.click(removeButton)

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to disconnect GitHub?')
    
    await waitFor(() => {
      expect(integrationsApi.remove).toHaveBeenCalledWith('GITHUB')
    })
  })

  it('cancels remove when confirmation is rejected', () => {
    const mockConfirm = vi.fn(() => false)
    Object.defineProperty(window, 'confirm', { value: mockConfirm })

    renderWithProviders(<IntegrationCard integration={mockIntegration} />)
    
    const removeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(removeButton)

    expect(mockConfirm).toHaveBeenCalled()
    expect(integrationsApi.remove).not.toHaveBeenCalled()
  })

  it('renders inactive integration correctly', () => {
    const inactiveIntegration = { ...mockIntegration, isActive: false }
    renderWithProviders(<IntegrationCard integration={inactiveIntegration} />)

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders integration without metadata', () => {
    const integrationWithoutMetadata = { ...mockIntegration, metadata: undefined }
    renderWithProviders(<IntegrationCard integration={integrationWithoutMetadata} />)

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByText('Username:')).not.toBeInTheDocument()
    expect(screen.queryByText('View Profile')).not.toBeInTheDocument()
  })
})