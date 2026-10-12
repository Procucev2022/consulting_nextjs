import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCustomerModal } from '../../../src/components/assessment/CreateCustomerModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    createCustomer: vi.fn()
  }
}));

describe('CreateCustomerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateCustomerModal isOpen={false} onClose={vi.fn()} onCreated={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal form when isOpen is true', () => {
    render(
      <CreateCustomerModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: UI_STRINGS.ASSESSMENT.customerManagement.modalCreate.title })).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    render(
      <CreateCustomerModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />
    );

    const submitBtn = screen.getByRole('button', {
      name: UI_STRINGS.ASSESSMENT.customerManagement.modalCreate.btnSubmit
    });
    fireEvent.click(submitBtn);

    expect(assessmentApiClient.createCustomer).not.toHaveBeenCalled();
  });

  it('submits valid form data and triggers onCreated callback', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    (assessmentApiClient.createCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'CUST-2026-0003',
      customerName: 'Global Logistics Corp',
      industry: 'Logistics & Supply Chain',
      region: 'GLOBAL',
      createdAt: '2026-10-11T12:00:00.000Z',
      updatedAt: '2026-10-11T12:00:00.000Z'
    });

    render(
      <CreateCustomerModal isOpen={true} onClose={onClose} onCreated={onCreated} />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. ABC Textile Ltd'), {
      target: { value: 'Global Logistics Corp' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Textile, Automotive, Chemicals'), {
      target: { value: 'Logistics & Supply Chain' }
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: UI_STRINGS.ASSESSMENT.customerManagement.modalCreate.btnSubmit
      })
    );

    await waitFor(() => {
      expect(assessmentApiClient.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Global Logistics Corp',
          industry: 'Logistics & Supply Chain'
        })
      );
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles submission error gracefully', async () => {
    (assessmentApiClient.createCustomer as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Customer with this name already exists')
    );

    render(
      <CreateCustomerModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. ABC Textile Ltd'), {
      target: { value: 'Existing Corp' }
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Textile, Automotive, Chemicals'), {
      target: { value: 'Chemicals' }
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: UI_STRINGS.ASSESSMENT.customerManagement.modalCreate.btnSubmit
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Customer with this name already exists')).toBeInTheDocument();
    });
  });
});
