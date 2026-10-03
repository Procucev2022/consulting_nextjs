import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommercialEnquiryModal } from '@/components/subscription/CommercialEnquiryModal';

describe('CommercialEnquiryModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentTier: 'BRONZE' as const,
    targetTier: 'SILVER' as const,
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    companyName: 'Acme Cement'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CommercialEnquiryModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content and handles user editing all form fields', () => {
    render(
      <CommercialEnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        currentTier="BRONZE"
        targetTier="GOLD"
      />
    );

    const nameInput = screen.getByLabelText('Your Name');
    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });
    expect(nameInput).toHaveValue('Alice Smith');

    const companyInput = screen.getByLabelText('Company Name');
    fireEvent.change(companyInput, { target: { value: 'Ultra Corp' } });
    expect(companyInput).toHaveValue('Ultra Corp');

    const emailInput = screen.getByLabelText('Corporate Email');
    fireEvent.change(emailInput, { target: { value: 'alice@ultracorp.com' } });
    expect(emailInput).toHaveValue('alice@ultracorp.com');

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '+91 99999 88888' } });
    expect(phoneInput).toHaveValue('+91 99999 88888');

    const notesInput = screen.getByLabelText('Specific Requirements (Optional)');
    fireEvent.change(notesInput, { target: { value: 'Need enterprise SAP integration' } });
    expect(notesInput).toHaveValue('Need enterprise SAP integration');
  });

  it('calls onClose when close button is clicked', () => {
    render(<CommercialEnquiryModal {...defaultProps} />);
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('submits upgrade request successfully and triggers timer close', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Commercial request dispatched'
      })
    } as unknown as Response);

    render(<CommercialEnquiryModal {...defaultProps} />);

    const submitBtn = screen.getByTestId('submit-commercial-enquiry-btn');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('enquiry-success')).toBeInTheDocument();
    });

    expect(screen.getByText(/Commercial Request Dispatched/i)).toBeInTheDocument();
  });

  it('displays error message when upgrade API request fails or throws non-Error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Commercial desk temporarily unavailable'
      })
    } as unknown as Response);

    render(<CommercialEnquiryModal {...defaultProps} />);

    const submitBtn = screen.getByTestId('submit-commercial-enquiry-btn');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Commercial desk temporarily unavailable')).toBeInTheDocument();
    });

    // Test non-Error throw
    global.fetch = vi.fn().mockRejectedValueOnce('Network drop exception');
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Network drop exception')).toBeInTheDocument();
    });
  });
});
