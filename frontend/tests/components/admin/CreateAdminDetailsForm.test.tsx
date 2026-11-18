import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAdminDetailsForm from '../../../src/components/admin/CreateAdminDetailsForm';
import { apiClient } from '../../../src/utils/api';
import frontendLogger from '../../../src/utils/logger';
import { UI_STRINGS } from '../../../src/constants';

describe('CreateAdminDetailsForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillCreateForm = (email = 'jane@procucev.com', password = 'NewPass@123', confirm = 'NewPass@123'): void => {
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.fullNameLabel), { target: { value: 'Jane Admin' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.mobileLabel), { target: { value: '+91 99999 88888' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyNameLabel), { target: { value: 'Global Corp' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyAddressLabel), { target: { value: 'Tech Park Bengaluru' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: password } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel), { target: { value: confirm } });
  };

  it('renders an empty creation form without prefilled credentials or default-fill button', () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();
    expect((screen.getByLabelText(UI_STRINGS.admin.fullNameLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.mobileLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.companyNameLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.companyAddressLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel) as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.fillDefaultDetailsButton })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton })).toBeInTheDocument();
  });

  it('provisions admin details successfully and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const mockUser = {
      id: 'usr-admin-001',
      name: 'Jane Admin',
      email: 'jane@procucev.com',
      mobile_number: '+91 99999 88888',
      company_name: 'Global Corp',
      company_address: 'Tech Park Bengaluru',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    };

    vi.spyOn(apiClient, 'createAdminUser').mockResolvedValueOnce({
      success: true,
      message: 'Admin details created and verified successfully',
      user: mockUser
    });

    render(<CreateAdminDetailsForm onSuccess={onSuccess} />);
    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.createSuccessMessage('jane@procucev.com'))).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);
    fillCreateForm('jane@procucev.com', 'NewPass@123', 'DifferentPassword@123');

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.passwordMismatchMessage)).toBeInTheDocument();
    });
  });

  it('displays API error message on creation failure', async () => {
    const provisioningError = new Error('Server error provisioning admin');
    const warningSpy = vi.spyOn(frontendLogger, 'warn');
    vi.spyOn(apiClient, 'createAdminUser').mockRejectedValueOnce(provisioningError);
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);
    fillCreateForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText('Server error provisioning admin')).toBeInTheDocument();
    });
    expect(warningSpy).toHaveBeenCalledWith('Admin provisioning failed', { fallbackMessageUsed: false }, provisioningError);
  });

  it('triggers onSwitchToLogin callback when switch button is clicked', () => {
    const onSwitch = vi.fn();
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} onSwitchToLogin={onSwitch} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.loginTab }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('updates form state when user enters custom inputs across all fields', () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.fullNameLabel), { target: { value: 'Jane Admin' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: 'jane@procucev.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.mobileLabel), { target: { value: '+91 99999 88888' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyNameLabel), { target: { value: 'Global Corp' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyAddressLabel), { target: { value: 'Tech Park' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'NewPass@123' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel), { target: { value: 'NewPass@123' } });

    expect((screen.getByLabelText(UI_STRINGS.admin.fullNameLabel) as HTMLInputElement).value).toBe('Jane Admin');
    expect((screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement).value).toBe('jane@procucev.com');
  });

  it('handles non-Error rejection gracefully when createAdminUser rejects', async () => {
    const warningSpy = vi.spyOn(frontendLogger, 'warn');
    vi.spyOn(apiClient, 'createAdminUser').mockRejectedValueOnce('Network failure raw string');
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);
    fillCreateForm();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.provisioningFailureFallback)).toBeInTheDocument();
    });
    expect(warningSpy).toHaveBeenCalledWith(
      'Admin provisioning failed',
      { fallbackMessageUsed: true },
      'Network failure raw string'
    );
  });
});

