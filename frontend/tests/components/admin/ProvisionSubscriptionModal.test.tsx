import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProvisionSubscriptionModal } from '@/components/admin/ProvisionSubscriptionModal';

describe('ProvisionSubscriptionModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onProvisionSuccess: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ProvisionSubscriptionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders initial DETAILS step with form fields and handles close', () => {
    render(<ProvisionSubscriptionModal {...defaultProps} />);

    expect(screen.getByTestId('provision-modal')).toBeInTheDocument();
    expect(screen.getByText('Provision Customer Subscription')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subscription Tier')).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows error if submitted without confirming payment', async () => {
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    const proceedBtn = screen.getByTestId('request-admin-otp-btn');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Admin must confirm offline payment receipt.')).toBeInTheDocument();
    });
  });

  it('handles OTP request failure with message and non-Error throw', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Admin OTP gateway down'
      })
    } as unknown as Response);

    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('checkbox'));

    const proceedBtn = screen.getByTestId('request-admin-otp-btn');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Admin OTP gateway down')).toBeInTheDocument();
    });

    // Test non-Error throw
    global.fetch = vi.fn().mockRejectedValueOnce('Network OTP error');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Network OTP error')).toBeInTheDocument();
    });
  });

  it('navigates from DETAILS to OTP step and supports tier change', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        session_id: 'sess-otp-12345',
        otp_hint: '123456'
      })
    } as unknown as Response);

    render(<ProvisionSubscriptionModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'UltraTech' } });
    fireEvent.change(screen.getByLabelText('Customer Name'), { target: { value: 'Admin User' } });
    fireEvent.change(screen.getByLabelText('Customer Email'), { target: { value: 'admin@ultratech.com' } });
    fireEvent.change(screen.getByLabelText('Subscription Tier'), { target: { value: 'GOLD' } });
    fireEvent.change(screen.getByPlaceholderText('TNT-...'), { target: { value: 'TNT-TEST-123' } });
    fireEvent.change(screen.getByPlaceholderText('usr-...'), { target: { value: 'usr-456' } });
    fireEvent.change(screen.getByPlaceholderText('INV-2026-...'), { target: { value: 'INV-2026-001' } });

    fireEvent.click(screen.getByRole('checkbox'));

    const proceedBtn = screen.getByTestId('request-admin-otp-btn');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Admin OTP Verification')).toBeInTheDocument();
    });

    expect(screen.getByText(/Dev Hint: 123456/i)).toBeInTheDocument();
  });

  it('completes verification and provisioning on OTP submit or shows error', async () => {
    const mockSubscription = {
      tenant_id: 'TNT-TEST-123',
      tier: 'SILVER',
      status: 'PENDING_ACTIVATION'
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session_id: 'sess-otp-12345', otp_hint: '654321' })
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Invalid OTP code entered' })
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscription: mockSubscription })
      } as unknown as Response);

    render(<ProvisionSubscriptionModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox'));
    const proceedBtn = screen.getByTestId('request-admin-otp-btn');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Admin OTP Verification')).toBeInTheDocument();
    });

    const otpInput = screen.getByTestId('admin-otp-input');
    fireEvent.change(otpInput, { target: { value: '000000' } });

    const authorizeBtn = screen.getByTestId('authorize-provision-btn');
    fireEvent.submit(authorizeBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid OTP code entered')).toBeInTheDocument();
    });

    // Valid provision
    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.submit(authorizeBtn.closest('form')!);

    await waitFor(() => {
      expect(defaultProps.onProvisionSuccess).toHaveBeenCalledWith(mockSubscription);
    });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows returning from OTP step back to DETAILS step', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, session_id: 'sess-otp-12345' })
    } as unknown as Response);

    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('checkbox'));

    const proceedBtn = screen.getByTestId('request-admin-otp-btn');
    fireEvent.submit(proceedBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Admin OTP Verification')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);

    expect(screen.getByText('Provision Customer Subscription')).toBeInTheDocument();
  });
});
