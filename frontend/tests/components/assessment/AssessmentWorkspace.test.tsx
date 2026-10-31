import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentWorkspace } from '../../../src/components/assessment/AssessmentWorkspace';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getCustomers: vi.fn(),
    getAssessments: vi.fn(),
    listAssessments: vi.fn(),
    createAssessment: vi.fn(),
    getAssessmentById: vi.fn(),
    getReviewGates: vi.fn(),
    getAuditLogs: vi.fn()
  },
  assessmentApi: {
    getCustomers: vi.fn(),
    getAssessments: vi.fn(),
    listAssessments: vi.fn(),
    createAssessment: vi.fn(),
    getAssessmentById: vi.fn(),
    getReviewGates: vi.fn(),
    getAuditLogs: vi.fn()
  }
}));

const mockCustomers = [
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

const mockAssessments = [
  {
    assessmentId: 'AIC-2026-0002',
    customerId: 'CUST-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles & Apparel',
    assessmentPeriodStart: 'April 2021',
    assessmentPeriodEnd: 'January 2022',
    ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'IN_PROGRESS',
    activeDataVersionId: 'DV-001',
    activeAnalysisRunId: 'RUN-001',
    totalSpendCr: 605.8385,
    validatedSpendCr: 605.8385,
    potentialSavingsCr: 55.4,
    savingsPct: 9.14,
    createdAt: '2026-10-11T09:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z'
  }
];

describe('AssessmentWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (assessmentApiClient.getCustomers as ReturnType<typeof vi.fn>).mockResolvedValue(mockCustomers);
    (assessmentApiClient.getAssessments as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssessments);
    (assessmentApiClient.listAssessments as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssessments);
    (assessmentApiClient.getAssessmentById as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssessments[0]);
    (assessmentApiClient.getReviewGates as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (assessmentApiClient.getAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('renders Customer Management by default with directory and customer creation action', async () => {
    render(<AssessmentWorkspace initialActiveTab="customers" />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.customerManagement.title)).toBeInTheDocument();
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.customerManagement.btnCreateCustomer)).toBeInTheDocument();
  });

  it('switches to Assessment Centre view and displays dossiers table', async () => {
    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('Assessment Centre')).toBeInTheDocument();
      expect(screen.getByText('AIC-2026-0002')).toBeInTheDocument();
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });
  });

  it('filters assessments using search input in Assessment Centre', async () => {
    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    expect(screen.queryByText('ABC Textile Ltd')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Textile' } });
    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
  });

  it('selects an assessment and opens detail workflow', async () => {
    const onSelectMock = vi.fn();
    const onActiveChangeMock = vi.fn();

    render(
      <AssessmentWorkspace
        initialActiveTab="assessments"
        onSelectAssessment={onSelectMock}
        onActiveAssessmentChange={onActiveChangeMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    const row = screen.getByText('ABC Textile Ltd').closest('tr');
    expect(row).toBeInTheDocument();
    if (row) fireEvent.click(row);

    expect(onSelectMock).toHaveBeenCalledWith('AIC-2026-0002');

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.btnBack)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.ASSESSMENT.btnBack));
    await waitFor(() => {
      expect(screen.getByText('Assessment Centre')).toBeInTheDocument();
    });
  });
});
