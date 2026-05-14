import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

describe('LoginPage Test', () => {
  it('loads without crashing', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });

  it('displays email and password input fields', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('displays login form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();
    });
  });

  // ─── PR: auth form polish — password show/hide toggle ────────────────────

  it('renders the password field masked by default with a Show password toggle', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const password = await screen.findByLabelText(/^password$/i) as HTMLInputElement;
    expect(password.type).toBe('password');

    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles the password input between hidden and visible when the eye button is clicked', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const password = await screen.findByLabelText(/^password$/i) as HTMLInputElement;
    const showBtn = screen.getByRole('button', { name: /show password/i });

    fireEvent.click(showBtn);
    expect(password.type).toBe('text');
    // After toggling, the same button now exposes the "Hide password" affordance.
    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    expect(hideBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(hideBtn);
    expect(password.type).toBe('password');
  });
});