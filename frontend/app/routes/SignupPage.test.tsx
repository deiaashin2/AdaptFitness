import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router';
import SignupPage from './SignupPage';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

describe('SignupPage Test', () => {
  it('loads without crashing', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    });
  });

  it('displays signup form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/enter your information/i)).toBeInTheDocument();
    });
  });

  it('displays create account button', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  // ─── PR: auth form polish — toggles, live rules, match indicator ─────────

  it('hides the password rules checklist while the password field is empty', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    // No rule rows should render until the user starts typing — keeps the
    // form quiet on first paint.
    expect(screen.queryByTestId('password-rule-length')).not.toBeInTheDocument();
    expect(screen.queryByTestId('password-rule-letter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('password-rule-number')).not.toBeInTheDocument();
  });

  it('flips each password rule from failing to passing as the user types a stronger password', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const password = await screen.findByLabelText(/^password$/i) as HTMLInputElement;

    // "abc" — has a letter but no number, length < 6.
    fireEvent.change(password, { target: { value: 'abc' } });
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-passed', 'false');
    expect(screen.getByTestId('password-rule-letter')).toHaveAttribute('data-passed', 'true');
    expect(screen.getByTestId('password-rule-number')).toHaveAttribute('data-passed', 'false');

    // "abc12345" — all three rules pass.
    fireEvent.change(password, { target: { value: 'abc12345' } });
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-passed', 'true');
    expect(screen.getByTestId('password-rule-letter')).toHaveAttribute('data-passed', 'true');
    expect(screen.getByTestId('password-rule-number')).toHaveAttribute('data-passed', 'true');
  });

  it('shows the eye toggles independently on Password and Confirm Password', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const password = await screen.findByLabelText(/^password$/i) as HTMLInputElement;
    const confirm = screen.getByLabelText(/^confirm password$/i) as HTMLInputElement;

    expect(password.type).toBe('password');
    expect(confirm.type).toBe('password');

    const toggles = screen.getAllByRole('button', { name: /show password/i });
    expect(toggles).toHaveLength(2);

    // Toggling the first one (Password) should NOT toggle the second (Confirm).
    fireEvent.click(toggles[0]);
    expect(password.type).toBe('text');
    expect(confirm.type).toBe('password');

    // And toggling Confirm only should leave Password's revealed state intact.
    const confirmToggle = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(confirmToggle);
    expect(password.type).toBe('text');
    expect(confirm.type).toBe('text');
  });

  it('shows a passwords-match indicator that flips based on confirm input', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const password = await screen.findByLabelText(/^password$/i) as HTMLInputElement;
    const confirm = screen.getByLabelText(/^confirm password$/i) as HTMLInputElement;

    fireEvent.change(password, { target: { value: 'abc12345' } });

    // No indicator yet — Confirm Password is still empty.
    expect(screen.queryByTestId('confirm-password-status')).not.toBeInTheDocument();

    // Mismatched value → red "do not match".
    fireEvent.change(confirm, { target: { value: 'abc' } });
    const status = screen.getByTestId('confirm-password-status');
    expect(status).toHaveAttribute('data-match', 'false');
    expect(status).toHaveTextContent(/do not match/i);

    // Matched → green "match".
    fireEvent.change(confirm, { target: { value: 'abc12345' } });
    expect(screen.getByTestId('confirm-password-status')).toHaveAttribute('data-match', 'true');
    expect(screen.getByTestId('confirm-password-status')).toHaveTextContent(/^passwords match$/i);
  });
});