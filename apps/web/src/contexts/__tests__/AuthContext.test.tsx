import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { authApi, User } from '../../lib/api'

// Mock the API
vi.mock('../../lib/api', () => ({
  authApi: {
    me: vi.fn(),
  },
}))

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

// Test component that uses the auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <button onClick={() => login('test-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = () => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('initializes with no user when no token in localStorage', () => {
    renderWithProviders()

    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('fetches user when token exists in localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token')
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    expect(authApi.me).toHaveBeenCalled()
  })

  it('handles login correctly', async () => {
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    renderWithProviders()

    act(() => {
      screen.getByText('Login').click()
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token')

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
  })

  it('handles logout correctly', async () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token')
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })

    act(() => {
      screen.getByText('Logout').click()
    })

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('handles API error gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token')
    vi.mocked(authApi.me).mockRejectedValue(new Error('Unauthorized'))

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  it('responds to localStorage changes', async () => {
    renderWithProviders()

    // Simulate localStorage change event
    mockLocalStorage.getItem.mockReturnValue('new-token')
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'authToken',
        newValue: 'new-token',
      }))
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })
  })

  it('does not fetch user when no token is present', () => {
    renderWithProviders()

    expect(authApi.me).not.toHaveBeenCalled()
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
  })

  it('shows loading state when fetching user', () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token')
    vi.mocked(authApi.me).mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithProviders()

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
  })
})