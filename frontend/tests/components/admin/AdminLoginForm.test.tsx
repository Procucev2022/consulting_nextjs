import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginForm from '../../../src/components/admin/AdminLoginForm';
import { apiClient } from '../../../src/utils/api';
import frontendLogger from '../../../src/utils/logger';
import { UI_STRINGS } from '../../../src/constants';

describe('AdminLoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillCredentials = (email = 'admin@company.test', password = 'TestAdminPassword123'): void => {
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: password } });
  };

  it('renders an empty login form without embedded credentials or quick-fill button', () => {
    const onSuccess = vi.fn();
    render(<AdminLoginForm onSuccess={onSuccess} />);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement;
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton })).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(<AdminLoginForm onSuccess={vi.fn()} />);
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('authenticates admin successfully and triggers onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const mockUser = {
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@company.test',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    };

    vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'admin-jwt-token-123',
      user: mockUser,
      success: true,
      message: 'Login success'
    });

    render(<AdminLoginForm onSuccess={onSuccess} />);
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.loginSuccessMessage)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('rejects non-admin role with access denied message', async () => {
    const onSuccess = vi.fn();
    const clearSessionSpy = vi.spyOn(apiClient, 'clearStoredSession');
    vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'user-jwt-token-123',
      user: {
        id: 'usr-buyer-001',
        name: 'Regular Buyer',
        email: 'buyer@procucev.com',
        role: 'USER',
        status: 'ACTIVE',
        subscription_tier: 'BRONZE'
      },
      success: true,
      message: 'Login success'
    });

    render(<AdminLoginForm onSuccess={onSuccess} />);
    fillCredentials('buyer@procucev.com', 'BuyerPass123');
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.accessDeniedMessage)).toBeInTheDocument();
      expect(clearSessionSpy).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('displays error message on failed login', async () => {
    const loginError = new Error('Invalid email or password');
    const warningSpy = vi.spyOn(frontendLogger, 'warn');
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(loginError);
    render(<AdminLoginForm onSuccess={vi.fn()} />);
    fillCredentials();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    expect(warningSpy).toHaveBeenCalledWith('Admin login failed', { fallbackMessageUsed: false }, loginError);
  });

  it('triggers onSwitchToCreate callback when link is clicked', () => {
    const onSwitch = vi.fn();
    render(<AdminLoginForm onSuccess={vi.fn()} onSwitchToCreate={onSwitch} />);

    const switchBtn = screen.getByRole('button', { name: UI_STRINGS.admin.createTab });
    fireEvent.click(switchBtn);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('updates email and password state when user types in inputs', () => {
    render(<AdminLoginForm onSuccess={vi.fn()} />);

    const emailInput = screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'custom-admin@procucev.com' } });
    fireEvent.change(passwordInput, { target: { value: 'CustomPassword123' } });

    expect(emailInput.value).toBe('custom-admin@procucev.com');
    expect(passwordInput.value).toBe('CustomPassword123');
  });

  it('handles non-Error rejection gracefully during login failure', async () => {
    const warningSpy = vi.spyOn(frontendLogger, 'warn');
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce('A raw string error');
    render(<AdminLoginForm onSuccess={vi.fn()} />);
    fillCredentials();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.loginFailureFallback)).toBeInTheDocument();
    });
    expect(warningSpy).toHaveBeenCalledWith('Admin login failed', { fallbackMessageUsed: true }, 'A raw string error');
  });
});

