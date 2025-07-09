import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'

// Mock the entire supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}))

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

// Import after mocking
import { AuthCallback } from '../AuthCallback'

describe('AuthCallback Simple Tests', () => {
  it('renders loading state', () => {
    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    )

    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we redirect you.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <AuthCallback />
        </BrowserRouter>
      )
    }).not.toThrow()
  })
})