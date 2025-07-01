import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from '../Dashboard'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as AuthContext from '../../contexts/AuthContext'

// Mock fetch
global.fetch = vi.fn()

// Mock the useAuth hook
const mockUseAuth = {
  token: 'test-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  user: { id: 'test-user', email: 'test@example.com' },
  isLoading: false,
  refetch: vi.fn()
}

vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockUseAuth)

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful empty responses by default
    ;(fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    )
  })

  it('renders dashboard title and description', async () => {
    renderDashboard()
    
    expect(screen.getByText('Daily Standups')).toBeInTheDocument()
    expect(screen.getByText('Automate your daily standup preparation')).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    renderDashboard()
    
    expect(screen.getByText('Loading your standups...')).toBeInTheDocument()
  })

  it('shows empty state when no standups exist', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('No standup generated for today yet.')).toBeInTheDocument()
      expect(screen.getByText('No previous standups found.')).toBeInTheDocument()
    })
  })

  it('displays generate new button', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Generate New')).toBeInTheDocument()
    })
  })

  it('makes API calls on mount', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/standups'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/standups/today'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  it('generates new standup when button clicked', async () => {
    const mockStandup = {
      id: 'test-standup-1',
      content: '## Daily Standup\n\nTest content',
      date: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      metadata: { tone: 'professional', source: 'basic' }
    }

    // Mock the POST request for generation
    ;(fetch as any).mockImplementation((url, options) => {
      if (options?.method === 'POST' && url.toString().includes('/standups/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStandup),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    })

    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Generate New')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate New')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/standups/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('professional')
        })
      )
    })
  })

  it('displays standups list when data is available', async () => {
    const mockStandups = [
      {
        id: 'standup-1',
        content: '## Daily Standup\n\nYesterday: Fixed bugs\nToday: Write tests',
        date: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        metadata: { tone: 'professional', source: 'basic' }
      },
      {
        id: 'standup-2',
        content: '## Daily Standup\n\nYesterday: Code review\nToday: Deploy feature',
        date: new Date(Date.now() - 86400000).toISOString(), // yesterday
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        metadata: { tone: 'casual', source: 'basic' }
      }
    ]

    ;(fetch as any).mockImplementation((url) => {
      if (url.toString().includes('/standups/today')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStandups[0]),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStandups),
      } as Response)
    })

    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/Yesterday: Fixed bugs/)).toBeInTheDocument()
      expect(screen.getByText(/Yesterday: Code review/)).toBeInTheDocument()
    })
  })

  it('handles copy to clipboard', async () => {
    const mockStandup = {
      id: 'test-standup',
      content: '## Test Standup Content',
      date: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      metadata: { tone: 'professional', source: 'basic' }
    }

    ;(fetch as any).mockImplementation((url) => {
      if (url.toString().includes('/standups/today')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStandup),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockStandup]),
      } as Response)
    })

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })

    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/Test Standup Content/)).toBeInTheDocument()
    })

    // Click copy button (download icon)
    const copyButtons = screen.getAllByTitle('Copy to clipboard')
    fireEvent.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('## Test Standup Content')
  })

  it('navigates to integrations page', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Integrations')).toBeInTheDocument()
    })

    const integrationsLink = screen.getByText('Integrations')
    expect(integrationsLink.closest('a')).toHaveAttribute('href', '/integrations')
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as any).mockRejectedValue(new Error('API Error'))

    renderDashboard()
    
    // Should still render the UI even if API calls fail
    await waitFor(() => {
      expect(screen.getByText('Daily Standups')).toBeInTheDocument()
    })
  })

  it('shows detailed standup in modal', async () => {
    const mockStandup = {
      id: 'test-standup',
      content: '## Detailed Standup Content\n\nYesterday: Implemented feature X\nToday: Deploy to production',
      date: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      metadata: { tone: 'professional', source: 'basic' }
    }

    ;(fetch as any).mockImplementation((url) => {
      if (url.toString().includes('/standups/today')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStandup),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockStandup]),
      } as Response)
    })

    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/Detailed Standup Content/)).toBeInTheDocument()
    })

    // Click view details button (eye icon)
    const viewButtons = screen.getAllByTitle('View details')
    fireEvent.click(viewButtons[0])

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Standup Details/)).toBeInTheDocument()
    })
  })
})