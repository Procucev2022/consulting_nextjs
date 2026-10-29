import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminLoginPage from '../../../../src/app/admin/login/page';
import { apiClient } from '../../../../src/utils/api';
import frontendLogger from '../../../../src/utils/logger';
import { UI_STRINGS } from '../../../../src/constants';

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

vi.mock('next/image', async () => {
  const React = (await import('react')).default;
  return {
    default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt })
  };
});

const ADMIN_LOGIN_RESPONSE: Awaited<ReturnType<typeof apiClient.login>> = {
  token: 'jwt-admin-token-123',
  user: {
    id: 'usr-admin-001',
    name: 'System Administrator',
    email: 'admin@procucev.com',
    mobile_number: '+91 98765 43210',
    role: 'ADMIN',
    status: 'ACTIVE',
    subscription_tier: 'GOLD',
    company_name: 'Procucev Enterprise Solutions Pvt Ltd',
    created_at: '2026-01-01T00:00:00.000Z'
  }
};

const NON_ADMIN_LOGIN_RESPONSE: Awaited<ReturnType<typeof apiClient.login>> = {
  token: 'jwt-buyer-token-456',
  user: {
    ...ADMIN_LOGIN_RESPONSE.user,
    id: 'usr-buyer-001',
    name: 'Procurement Buyer',
    email: 'buyer@procucev.com',
    role: 'BUYER'
  }
};

// Stable element ids on the page; the password input has no label id of its own.
const EMAIL_INPUT_ID = '#admin-email';

const getEmailInput = (container: HTMLElement): HTMLInputElement =>
  container.querySelector(EMAIL_INPUT_ID) as HTMLInputElement;

const getPasswordToggle = (): HTMLElement => {
  const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel);
  return within(passwordInput.parentElement as HTMLElement).getByRole('button');
};

const fillLoginForm = (): void => {
  fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: 'admin@example.test' } });
  fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'typed-password' } });
};

describe('AdminLoginPage coverage', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => undefined);
    vi.spyOn(frontendLogger, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it('renders the administrator sign-in form', () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton })).toBeInTheDocument();
  });

  it('starts empty and does not expose credential quick-fill controls', () => {
    render(<AdminLoginPage />);
    expect(screen.getByLabelText(UI_STRINGS.admin.emailLabel)).toHaveValue('');
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toHaveValue('');
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton })).not.toBeInTheDocument();
  });

  it('updates the email and password fields as the administrator types', () => {
    const { container } = render(<AdminLoginPage />);

    fireEvent.change(getEmailInput(container), { target: { value: 'typed@procucev.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'typed-secret' } });

    expect(getEmailInput(container)).toHaveValue('typed@procucev.com');
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toHaveValue('typed-secret');
  });

  it('toggles password visibility with the eye control', () => {
    render(<AdminLoginPage />);
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel);

    fireEvent.click(getPasswordToggle());
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(getPasswordToggle());
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows the success notice and redirects to the admin dashboard after the delay', async () => {
    vi.useFakeTimers();
    vi.spyOn(apiClient, 'login').mockResolvedValueOnce(ADMIN_LOGIN_RESPONSE);
    render(<AdminLoginPage />);
    fillLoginForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText(UI_STRINGS.admin.loginSuccessMessage)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('denies non-administrator accounts, clears the stored session, and stays on the page', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValueOnce(NON_ADMIN_LOGIN_RESPONSE);
    render(<AdminLoginPage />);
    fillLoginForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => expect(apiClient.clearStoredSession).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton })).not.toBeDisabled();
    expect(frontendLogger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ role: 'BUYER', userId: NON_ADMIN_LOGIN_RESPONSE.user.id })
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows the message of an Error raised by a failed sign-in', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(new Error('Invalid administrator credentials'));
    render(<AdminLoginPage />);
    fillLoginForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    expect(await screen.findByText('Invalid administrator credentials')).toBeInTheDocument();
    expect(frontendLogger.warn).toHaveBeenCalledWith(expect.any(String), {
      error: 'Invalid administrator credentials'
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('uses a generic failure message when the sign-in rejects with a non-Error value', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce('network reset');
    render(<AdminLoginPage />);
    fillLoginForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(frontendLogger.warn).toHaveBeenCalledWith(expect.any(String), { error: expect.any(String) });
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
