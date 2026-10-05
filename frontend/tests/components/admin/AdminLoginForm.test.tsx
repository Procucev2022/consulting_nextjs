import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginForm from '../../../src/components/admin/AdminLoginForm';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';

describe('AdminLoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements and quick-fill button', () => {
    const onSuccess = vi.fn();
    render(<AdminLoginForm onSuccess={onSuccess} />);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton })).toBeInTheDocument();
  });

  it('populates default admin credentials when quick fill is clicked', () => {
    render(<AdminLoginForm onSuccess={vi.fn()} />);
    const quickFillBtn = screen.getByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton });
    fireEvent.click(quickFillBtn);

    const emailInput = screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@procucev.com');
    expect(passwordInput.value).toBe('Procucev@123');
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
      email: 'admin@procucev.com',
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
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.accessDeniedMessage)).toBeInTheDocument();
      expect(clearSessionSpy).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('displays error message on failed login', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(new Error('Invalid email or password'));
    render(<AdminLoginForm onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
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
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce('A raw string error');
    render(<AdminLoginForm onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.common.error)).toBeInTheDocument();
    });
  });
});

