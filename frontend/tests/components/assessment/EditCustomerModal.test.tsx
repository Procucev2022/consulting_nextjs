import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditCustomerModal } from '../../../src/components/assessment/EditCustomerModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { CustomerRecord } from '../../../src/types';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    updateCustomer: vi.fn()
  }
}));

const mockCustomer: CustomerRecord = {
  id: 'CUST-2026-0001',
  customerName: 'Acme Heavy Engineering Ltd',
  industry: 'Engineering & Heavy Machinery',
  businessUnit: 'Procurement Corp',
  region: 'APAC',
  baseCurrency: 'INR',
  contactPerson: 'Arun Patel',
  contactEmail: 'arun@acme.com',
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-10T10:00:00.000Z'
};

describe('EditCustomerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or customer is null', () => {
    const { container: c1 } = render(
      <EditCustomerModal isOpen={false} customer={mockCustomer} onClose={vi.fn()} onUpdated={vi.fn()} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <EditCustomerModal isOpen={true} customer={null} onClose={vi.fn()} onUpdated={vi.fn()} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders pre-filled form and updates customer metadata', async () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    const updatedCustomer: CustomerRecord = {
      ...mockCustomer,
      customerName: 'Acme Global Technologies Ltd',
      industry: 'Technology & Hardware'
    };

    (assessmentApiClient.updateCustomer as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCustomer);

    render(
      <EditCustomerModal
        isOpen={true}
        customer={mockCustomer}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    );

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.customerManagement.modalEdit.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Heavy Engineering Ltd')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineering & Heavy Machinery')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Acme Heavy Engineering Ltd'), {
      target: { value: 'Acme Global Technologies Ltd' }
    });
    fireEvent.change(screen.getByDisplayValue('Engineering & Heavy Machinery'), {
      target: { value: 'Technology & Hardware' }
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: UI_STRINGS.ASSESSMENT.customerManagement.modalEdit.btnSubmit
      })
    );

    await waitFor(() => {
      expect(assessmentApiClient.updateCustomer).toHaveBeenCalledWith(
        'CUST-2026-0001',
        expect.objectContaining({
          customerName: 'Acme Global Technologies Ltd',
          industry: 'Technology & Hardware'
        })
      );
      expect(onUpdated).toHaveBeenCalledWith(updatedCustomer);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
