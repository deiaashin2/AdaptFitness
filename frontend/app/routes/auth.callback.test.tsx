import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router';
import AuthCallback from './auth.callback';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('AuthCallback Test', () => {
  it('renders without crashing', async () => {
    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/completing sign in/i)).toBeInTheDocument();
    });
  });

  it('displays loading message', async () => {
    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/please wait while we log you in/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard when session exists', async () => {
    const { supabase } = await import('../lib/supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: '123' } } as any },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
