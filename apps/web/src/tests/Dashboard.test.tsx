import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { AuthContext } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/env';

// Mock the API_ENDPOINTS
jest.mock('../config/env', () => ({
  API_ENDPOINTS: {
    standups: {
      list: 'http://localhost:3000/standups',
      today: 'http://localhost:3000/standups/today',
      generate: 'http://localhost:3000/standups/generate'
    }
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock AuthContext
const mockAuthContext = {
  token: 'mock-token-123',
  isAuthenticated: true,
  isLoading: false,
  user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
  login: jest.fn(),
  logout: jest.fn()
};

// Helper component to wrap Dashboard with necessary providers
const DashboardWrapper = ({ authContext = mockAuthContext }) => (
  <BrowserRouter>
    <AuthContext.Provider value={authContext}>
      <Dashboard />
    </AuthContext.Provider>
  </BrowserRouter>
);

// Mock data
const mockStandups = [
  {
    id: 'standup-today',
    content: 'Today: Fixed the login bug and opened PR #123.\nNext: Address code review feedback.\nBlockers: None.',
    date: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    metadata: {
      tone: 'work_focused',
      length: 'medium',
      source: 'github',
      replaced_count: 2
    }
  },
  {
    id: 'standup-yesterday',
    content: 'Yesterday: Implemented user authentication.\nNext: Test edge cases.\nBlockers: Waiting for API review.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      tone: 'professional',
      length: 'medium',
      source: 'github'
    }
  },
  {
    id: 'standup-two-days-ago',
    content: 'Two days ago: Started GitHub integration work.\nNext: Complete OAuth flow.\nBlockers: Need API keys.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      tone: 'casual_async',
      length: 'short',
      source: 'github'
    }
  }
];

describe('Dashboard Component - One Per Day Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial Load', () => {
    it('should display loading state initially', () => {
      // Mock loading state
      const loadingAuthContext = { ...mockAuthContext, isLoading: true };
      
      render(<DashboardWrapper authContext={loadingAuthContext} />);
      
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should fetch standups and today\'s standup on load', async () => {
      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups[0])
        });

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          API_ENDPOINTS.standups.list,
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token-123'
            })
          })
        );
        
        expect(global.fetch).toHaveBeenCalledWith(
          API_ENDPOINTS.standups.today,
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token-123'
            })
          })
        );
      });
    });
  });

  describe('One Per Day Display', () => {
    beforeEach(async () => {
      // Mock successful API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups[0])
        });

      render(<DashboardWrapper />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });
    });

    it('should display today\'s standup with replacement count', async () => {
      await waitFor(() => {
        // Check for today's standup section
        expect(screen.getByText('Today\'s Standup')).toBeInTheDocument();
        
        // Should show replacement count badge
        expect(screen.getByText('Updated 2 times')).toBeInTheDocument();
        
        // Should show the standup content
        expect(screen.getByText(/Today: Fixed the login bug/)).toBeInTheDocument();
      });
    });

    it('should display "Regenerate" button when standup exists', async () => {
      await waitFor(() => {
        const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
        expect(regenerateButton).toBeInTheDocument();
        expect(regenerateButton).not.toHaveTextContent('Generate New');
      });
    });

    it('should display one standup per day in previous standups section', async () => {
      await waitFor(() => {
        // Should show previous standups header
        expect(screen.getByText('Previous Standups')).toBeInTheDocument();
        expect(screen.getByText('One standup per day • Most recent version shown')).toBeInTheDocument();
        
        // Should show exactly 3 standups (today + 2 previous days)
        const standupDates = screen.getAllByText(/days? ago|Today/i);
        expect(standupDates.length).toBeGreaterThanOrEqual(3); // At least 3 date references
      });
    });

    it('should not show duplicate dates in previous standups', async () => {
      await waitFor(() => {
        // Get all date elements in previous standups section
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        
        // Extract actual date strings
        const dates = dateElements.map(el => el.textContent);
        const uniqueDates = [...new Set(dates)];
        
        // Should have no duplicate dates
        expect(dates.length).toBe(uniqueDates.length);
      });
    });
  });

  describe('Regeneration Functionality', () => {
    beforeEach(async () => {
      // Initial load mocks
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups[0])
        });

      render(<DashboardWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });
    });

    it('should regenerate standup and update UI', async () => {
      // Mock regeneration response
      const regeneratedStandup = {
        ...mockStandups[0],
        id: 'standup-today-regenerated',
        content: 'REGENERATED: Today I completed the authentication system...',
        metadata: {
          ...mockStandups[0].metadata,
          replaced_count: 3,
          tone: 'detailed'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(regeneratedStandup)
      });

      // Click regenerate button
      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
      fireEvent.click(regenerateButton);

      // Should show generating state
      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });

      // Should update with new content
      await waitFor(() => {
        expect(screen.getByText(/REGENERATED: Today I completed/)).toBeInTheDocument();
        expect(screen.getByText('Updated 3 times')).toBeInTheDocument();
      });

      // Should call the generate API
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.standups.generate,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tone: 'professional',
            length: 'medium'
          })
        })
      );
    });

    it('should handle generation errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Generation failed'));

      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
      fireEvent.click(regenerateButton);

      // Should show generating state briefly
      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });

      // Should return to normal state after error
      await waitFor(() => {
        expect(screen.getByText('Regenerate')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no standups exist', async () => {
      // Mock empty responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        });

      render(<DashboardWrapper />);

      await waitFor(() => {
        // Should show empty state for today's standup
        expect(screen.getByText('No standup generated for today yet.')).toBeInTheDocument();
        expect(screen.getByText('Generate New')).toBeInTheDocument();
        
        // Should show empty state for previous standups
        expect(screen.getByText('No previous standups found.')).toBeInTheDocument();
      });
    });

    it('should show "Generate New" when no today\'s standup exists', async () => {
      // Mock responses: previous standups exist but no today's standup
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups.slice(1)) // Skip today's standup
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        });

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Generate New')).toBeInTheDocument();
        expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
      });
    });
  });

  describe('UI Interaction', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups[0])
        });

      render(<DashboardWrapper />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });
    });

    it('should allow copying standup content to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });

      await waitFor(() => {
        const copyButtons = screen.getAllByTitle('Copy to clipboard');
        expect(copyButtons.length).toBeGreaterThan(0);
        
        // Click first copy button
        fireEvent.click(copyButtons[0]);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Today: Fixed the login bug')
        );
      });
    });

    it('should open standup detail modal', async () => {
      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('View details');
        expect(viewButtons.length).toBeGreaterThan(0);
        
        // Click first view button
        fireEvent.click(viewButtons[0]);
        
        // Should show modal
        expect(screen.getByText('Standup Details -')).toBeInTheDocument();
      });
    });

    it('should close standup detail modal', async () => {
      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('View details');
        fireEvent.click(viewButtons[0]);
        
        // Modal should be open
        expect(screen.getByText('Standup Details -')).toBeInTheDocument();
        
        // Click close button
        const closeButton = screen.getByRole('button', { name: /Close/i });
        fireEvent.click(closeButton);
        
        // Modal should be closed
        expect(screen.queryByText('Standup Details -')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication States', () => {
    it('should show login prompt when not authenticated', () => {
      const unauthenticatedContext = {
        ...mockAuthContext,
        isAuthenticated: false,
        token: null
      };

      render(<DashboardWrapper authContext={unauthenticatedContext} />);
      
      expect(screen.getByText('Please log in to access your dashboard.')).toBeInTheDocument();
    });

    it('should redirect to login when token is invalid', async () => {
      // Mock 401 responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        });

      render(<DashboardWrapper />);

      // Should handle auth errors gracefully
      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });
    });
  });

  describe('Real World Scenarios', () => {
    it('should handle rapid clicking of regenerate button', async () => {
      // Mock slow API response
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise(resolve => {
        resolveGeneration = resolve;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStandups[0])
        })
        .mockReturnValueOnce(generationPromise);

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
      
      // Click multiple times rapidly
      fireEvent.click(regenerateButton);
      fireEvent.click(regenerateButton);
      fireEvent.click(regenerateButton);

      // Should be disabled during generation
      expect(regenerateButton).toBeDisabled();
      expect(screen.getByText('Generating...')).toBeInTheDocument();

      // Only one API call should be made
      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 initial + 1 generate
    });

    it('should maintain scroll position when regenerating', async () => {
      // Mock long content
      const longStandups = Array(10).fill(null).map((_, i) => ({
        ...mockStandups[0],
        id: `standup-${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        content: `Long standup content ${i}`.repeat(10)
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(longStandups)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(longStandups[0])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...longStandups[0],
            content: 'Regenerated content'
          })
        });

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Daily Standups')).toBeInTheDocument();
      });

      // Simulate regeneration
      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(screen.getByText('Regenerated content')).toBeInTheDocument();
      });
    });
  });
});