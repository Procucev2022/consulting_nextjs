import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivationModal } from '@/components/subscription/ActivationModal';
import { UI_STRINGS } from '@/constants';

describe('ActivationModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    customerEmail: 'test@example.com',
    onActivationSuccess: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ActivationModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content correctly when open', () => {
    render(<ActivationModal {...defaultProps} />);

    expect(screen.getByTestId('activation-modal')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.activationModalTitle)).toBeInTheDocument();
    expect(screen.getByTestId('activation-code-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-activation-btn')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ActivationModal {...defaultProps} />);
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message if submitted with empty code', async () => {
    render(<ActivationModal {...defaultProps} />);
    const submitBtn = screen.getByTestId('submit-activation-btn');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('activation-error')).toHaveTextContent('Activation code is required');
    });
  });

  it('handles successful activation and notifies parent', async () => {
    const mockSubscription = {
      tenant_id: 'TNT-123',
      tier: 'SILVER',
      status: 'ACTIVE'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Activated',
        subscription: mockSubscription
      })
    } as unknown as Response);

    render(<ActivationModal {...defaultProps} />);

    const input = screen.getByTestId('activation-code-input');
    fireEvent.change(input, { target: { value: 'pcv-abcd-1234-efgh' } });
    expect(input).toHaveValue('PCV-ABCD-1234-EFGH');

    const submitBtn = screen.getByTestId('submit-activation-btn');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('activation-success')).toHaveTextContent(
        UI_STRINGS.subscription.activationSuccess
      );
    });

    expect(defaultProps.onActivationSuccess).toHaveBeenCalledWith(mockSubscription);
  });

  it('handles API activation failure with error message or non-Error throw', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Invalid or expired activation code'
      })
    } as unknown as Response);

    render(<ActivationModal {...defaultProps} />);

    const input = screen.getByTestId('activation-code-input');
    fireEvent.change(input, { target: { value: 'PCV-0000-0000-0000' } });

    const submitBtn = screen.getByTestId('submit-activation-btn');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('activation-error')).toHaveTextContent(
        'Invalid or expired activation code'
      );
    });

    // Test non-Error throw
    global.fetch = vi.fn().mockRejectedValueOnce('Network connection failed');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('activation-error')).toHaveTextContent(
        'Network connection failed'
      );
    });

    // Test fallback when data.message is missing
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false
      })
    } as unknown as Response);
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('activation-error')).toHaveTextContent('Activation failed');
    });
  });
});
