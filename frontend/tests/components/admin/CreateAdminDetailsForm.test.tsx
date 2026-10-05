import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAdminDetailsForm from '../../../src/components/admin/CreateAdminDetailsForm';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';

describe('CreateAdminDetailsForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders creation form with all inputs and prefill button', () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.fullNameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.mobileLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.companyNameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.companyAddressLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.fillDefaultDetailsButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton })).toBeInTheDocument();
  });

  it('populates default admin details when prefill button is clicked', () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.fillDefaultDetailsButton }));

    const emailInput = screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@procucev.com');
    expect(passwordInput.value).toBe('Procucev@123');
  });

  it('provisions admin details successfully and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const mockUser = {
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      mobile_number: '+91 98765 43210',
      company_name: 'aiCEV Procucev Enterprise Inc.',
      company_address: 'Bangalore',
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
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.createSuccessMessage)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    const confirmPasswordInput = screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel);
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword@123' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('displays API error message on creation failure', async () => {
    vi.spyOn(apiClient, 'createAdminUser').mockRejectedValueOnce(new Error('Server error provisioning admin'));
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText('Server error provisioning admin')).toBeInTheDocument();
    });
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
    vi.spyOn(apiClient, 'createAdminUser').mockRejectedValueOnce('Network failure raw string');
    render(<CreateAdminDetailsForm onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.common.error)).toBeInTheDocument();
    });
  });
});

