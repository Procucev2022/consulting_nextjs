import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerManagementView } from '../../../src/components/assessment/CustomerManagementView';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { CustomerRecord, AssessmentRecord } from '../../../src/types';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getCustomers: vi.fn(),
    getAssessments: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn()
  }
}));

const mockCustomers: CustomerRecord[] = [
  {
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
  },
  {
    id: 'CUST-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles & Apparel',
    region: 'GLOBAL',
    baseCurrency: 'INR',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z'
  }
];

const mockAssessments: AssessmentRecord[] = [
  {
    assessmentId: 'AIC-2026-0002',
    customerId: 'CUST-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles & Apparel',
    assessmentPeriodStart: '2024-01-01',
    assessmentPeriodEnd: '2024-12-31',
    ndaStatus: 'SIGNED',
    status: 'IN_PROGRESS',
    dataStatus: 'VALIDATED',
    currentDataVersionId: 'DV-001',
    activeAnalysisRunId: 'RUN-001',
    validatedSpendCr: 605.8385,
    assignedAnalyst: 'analyst@procucev.com',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z'
  }
];

describe('CustomerManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (assessmentApiClient.getCustomers as ReturnType<typeof vi.fn>).mockResolvedValue(mockCustomers);
    (assessmentApiClient.getAssessments as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssessments);
  });

  it('renders Customer Directory table without any analytical spend or opportunity metrics', async () => {
    render(
      <CustomerManagementView
        onSelectCustomer={vi.fn()}
        onCreateAssessmentForCustomer={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Heavy Engineering Ltd')).toBeInTheDocument();
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
      expect(screen.getByText('CUST-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('CUST-2026-0002')).toBeInTheDocument();
    });

    // Ensure NO analytical spend metrics (e.g. validated spend, savings %) are rendered as customer attributes
    expect(screen.queryByText('Validated spend')).not.toBeInTheDocument();
    expect(screen.queryByText('Gross opportunity')).not.toBeInTheDocument();
    expect(screen.queryByText('Net opportunity')).not.toBeInTheDocument();
  });

  it('selects a customer and displays their assessment dossiers and action buttons', async () => {
    const onSelectCustomer = vi.fn();
    render(
      <CustomerManagementView
        onSelectCustomer={onSelectCustomer}
        onCreateAssessmentForCustomer={vi.fn()}
        onOpenAssessmentInModule1={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    // Select ABC Textile Ltd
    const selectButtons = screen.getAllByText(UI_STRINGS.ASSESSMENT.customerManagement.table.selectAction);
    fireEvent.click(selectButtons[1]); // ABC Textile

    await waitFor(() => {
      expect(onSelectCustomer).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'CUST-2026-0002', customerName: 'ABC Textile Ltd' })
      );
      // Selected customer banner appears
      expect(screen.getByText('ACTIVE CUSTOMER')).toBeInTheDocument();
      // Assessments for ABC Textile appear
      expect(screen.getByText('Assessments for ABC Textile Ltd')).toBeInTheDocument();
      expect(screen.getByText('AIC-2026-0002')).toBeInTheDocument();
      expect(screen.getByText('Open Module 1 →')).toBeInTheDocument();
    });
  });

  it('filters customers using search input', async () => {
    render(
      <CustomerManagementView
        onSelectCustomer={vi.fn()}
        onCreateAssessmentForCustomer={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Heavy Engineering Ltd')).toBeInTheDocument();
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.customerManagement.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Textile' } });

    expect(screen.queryByText('Acme Heavy Engineering Ltd')).not.toBeInTheDocument();
    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
  });

  it('displays empty state when no customers are found', async () => {
    (assessmentApiClient.getCustomers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(
      <CustomerManagementView
        onSelectCustomer={vi.fn()}
        onCreateAssessmentForCustomer={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.customerManagement.emptyNoCustomers)).toBeInTheDocument();
    });
  });
});
