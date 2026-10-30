import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AssessmentWorkspace } from '../../../src/components/assessment/AssessmentWorkspace';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { ASSESSMENT_STATUS_BADGES } from '../../../src/constants/assessment';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';
import type {
  AssessmentDetailWorkflowProps,
  AssessmentRecord,
  AssessmentStatus,
  CustomerManagementViewProps,
  CustomerRecord,
  NewAssessmentModalProps,
  SystemInfoModalProps
} from '../../../src/types';

// Fixtures are hoisted so the child stubs below can reference them.
const fixtures = vi.hoisted(() => {
  const timestamp = '2026-10-11T09:00:00.000Z';
  const customer: CustomerRecord = {
    id: 'CUST-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles & Apparel',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const record: AssessmentRecord = {
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
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const secondRecord: AssessmentRecord = {
    ...record,
    assessmentId: 'AIC-2026-0003',
    customerName: 'Varroc Polymers',
    industry: 'Automotive & Polymers',
    status: 'AWAITING_REVIEW',
    dataStatus: 'RECEIVED'
  };
  const createdRecord: AssessmentRecord = { ...record, assessmentId: 'AIC-2026-0004', customerName: 'New Dossier Co' };
  return { customer, record, secondRecord, createdRecord };
});

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getAssessments: vi.fn()
  }
}));

vi.mock('../../../src/components/assessment/CustomerManagementView', async () => {
  const { createElement } = await import('react');
  return {
    CustomerManagementView: (props: CustomerManagementViewProps) =>
      createElement(
        'section',
        { 'data-testid': 'customer-view' },
        createElement('span', { 'data-testid': 'selected-customer-id' }, props.selectedCustomerId ?? 'none'),
        createElement(
          'button',
          { type: 'button', onClick: () => props.onSelectCustomer(fixtures.customer) },
          'stub select customer'
        ),
        createElement(
          'button',
          { type: 'button', onClick: () => props.onCreateAssessmentForCustomer(fixtures.customer) },
          'stub create for customer'
        ),
        createElement(
          'button',
          { type: 'button', onClick: () => props.onOpenAssessmentInModule1?.(fixtures.record) },
          'stub open module 1'
        )
      )
  };
});

vi.mock('../../../src/components/assessment/NewAssessmentModal', async () => {
  const { createElement } = await import('react');
  return {
    NewAssessmentModal: (props: NewAssessmentModalProps) => {
      if (!props.isOpen) return null;
      return createElement(
        'div',
        { 'data-testid': 'new-modal' },
        createElement(
          'span',
          { 'data-testid': 'new-modal-customer' },
          props.preselectedCustomer?.customerName ?? 'none'
        ),
        createElement('button', { type: 'button', onClick: () => props.onCreated(fixtures.createdRecord) }, 'stub created'),
        createElement('button', { type: 'button', onClick: () => props.onClose() }, 'stub modal close')
      );
    }
  };
});

vi.mock('../../../src/components/assessment/SystemInfoModal', async () => {
  const { createElement } = await import('react');
  return {
    SystemInfoModal: (props: SystemInfoModalProps) => {
      if (!props.isOpen) return null;
      return createElement(
        'div',
        { 'data-testid': 'system-modal' },
        createElement('button', { type: 'button', onClick: () => props.onClose() }, 'stub system close')
      );
    }
  };
});

vi.mock('../../../src/components/assessment/AssessmentDetailWorkflow', async () => {
  const { createElement } = await import('react');
  return {
    AssessmentDetailWorkflow: (props: AssessmentDetailWorkflowProps) =>
      createElement(
        'section',
        { 'data-testid': 'detail-workflow' },
        createElement('span', { 'data-testid': 'detail-id' }, props.assessmentId),
        createElement('button', { type: 'button', onClick: () => props.onBack() }, 'stub back'),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => props.onUpdate({ ...fixtures.record, assessmentId: props.assessmentId, status: 'APPROVED' })
          },
          'stub update'
        ),
        createElement(
          'button',
          { type: 'button', onClick: () => props.onUpdate({ ...fixtures.record, assessmentId: 'AIC-OTHER' }) },
          'stub update other'
        )
      )
  };
});

const STORAGE_ACTIVE_TAB = 'aicev_workspace_active_tab';
const STORAGE_SELECTED_CUSTOMER = 'aicev_selected_customer_id';
const STORAGE_SELECTED_ASSESSMENT = 'aicev_selected_assessment_id';

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function logEntry(level: LogLevel, message: string): FrontendLogEntry {
  return { timestamp: '2026-10-11T12:00:00.000Z', level, service: 'consulting-frontend', message };
}

// Keeps logger output out of test runs while leaving the spies available for assertions.
function silenceLogger(): void {
  vi.spyOn(frontendLogger, 'debug').mockImplementation((message) => logEntry('debug', message));
  vi.spyOn(frontendLogger, 'info').mockImplementation((message) => logEntry('info', message));
  vi.spyOn(frontendLogger, 'warn').mockImplementation((message) => logEntry('warn', message));
  vi.spyOn(frontendLogger, 'error').mockImplementation((message) => logEntry('error', message));
}

const kpiCard = (label: string): HTMLElement => {
  const card = screen.getByText(label).parentElement;
  if (!card) {
    throw new Error(`KPI card ${label} was not rendered`);
  }
  return card;
};

describe('AssessmentWorkspace', () => {
  const onSelectAssessment = vi.fn();
  const onActiveAssessmentChange = vi.fn();
  const onSelectCustomer = vi.fn();
  const getAssessments = vi.mocked(assessmentApiClient.getAssessments);

  const renderWorkspace = (props: Partial<React.ComponentProps<typeof AssessmentWorkspace>> = {}): void => {
    render(
      <AssessmentWorkspace
        onSelectAssessment={onSelectAssessment}
        onActiveAssessmentChange={onActiveAssessmentChange}
        onSelectCustomer={onSelectCustomer}
        {...props}
      />
    );
  };

  const rowFor = async (customerName: string): Promise<HTMLElement> => {
    const cell = await screen.findByText(customerName, { selector: 'span' });
    const row = cell.closest('tr');
    if (!row) {
      throw new Error(`Dossier row for ${customerName} was not rendered`);
    }
    return row;
  };

  // Lets the mount-time dossier request settle inside act(), so synchronous tests do not leave pending state updates.
  const settle = async (): Promise<void> => {
    await act(async () => undefined);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    localStorage.clear();
    getAssessments.mockResolvedValue([fixtures.record, fixtures.secondRecord]);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads dossiers on mount and counts them by status', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(await screen.findByText(fixtures.record.customerName)).toBeInTheDocument();
    expect(getAssessments).toHaveBeenCalledTimes(1);
    expect(within(kpiCard(UI_STRINGS.ASSESSMENT.kpiCards.active)).getByText('2')).toBeInTheDocument();
    expect(within(kpiCard(UI_STRINGS.ASSESSMENT.kpiCards.inProgress)).getByText('1')).toBeInTheDocument();
    expect(within(kpiCard(UI_STRINGS.ASSESSMENT.kpiCards.analystReview)).getByText('1')).toBeInTheDocument();
    expect(within(kpiCard(UI_STRINGS.ASSESSMENT.kpiCards.closed)).getByText('0')).toBeInTheDocument();
  });

  it('shows the customer view by default and switches between the two views', async () => {
    renderWorkspace();
    await settle();

    expect(screen.getByTestId('customer-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.nav.assessments }));
    expect(await screen.findByRole('button', { name: UI_STRINGS.ASSESSMENT.btnNewAssessment })).toBeInTheDocument();
    expect(screen.queryByTestId('customer-view')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_ACTIVE_TAB)).toBe('assessments');

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.nav.customers }));
    expect(screen.getByTestId('customer-view')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_ACTIVE_TAB)).toBe('customers');
    expect(onActiveAssessmentChange).toHaveBeenLastCalledWith(null);
  });

  it('restores the saved customer tab and the selected customer', async () => {
    localStorage.setItem(STORAGE_ACTIVE_TAB, 'customers');
    localStorage.setItem(STORAGE_SELECTED_CUSTOMER, fixtures.customer.id);

    renderWorkspace({ initialActiveTab: 'assessments' });
    await settle();

    expect(screen.getByTestId('customer-view')).toBeInTheDocument();
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent(fixtures.customer.id);
  });

  it('restores the saved assessments tab over the initial tab', async () => {
    localStorage.setItem(STORAGE_ACTIVE_TAB, 'assessments');

    renderWorkspace({ initialActiveTab: 'customers' });

    expect(await screen.findByRole('button', { name: UI_STRINGS.ASSESSMENT.btnNewAssessment })).toBeInTheDocument();
    expect(screen.queryByTestId('customer-view')).not.toBeInTheDocument();
  });

  it('ignores an unknown saved tab and uses the initial tab', async () => {
    localStorage.setItem(STORAGE_ACTIVE_TAB, 'bogus');

    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(await screen.findByRole('button', { name: UI_STRINGS.ASSESSMENT.btnNewAssessment })).toBeInTheDocument();
  });

  it('shows the loading row while the first request is pending', async () => {
    const pending = createDeferred<AssessmentRecord[]>();
    getAssessments.mockReturnValue(pending.promise);
    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(screen.getByTestId('assessments-loading')).toBeInTheDocument();

    await act(async () => {
      pending.resolve([fixtures.record]);
    });
    expect(await screen.findByText(fixtures.record.customerName)).toBeInTheDocument();
  });

  it('shows the request error in the banner and table when the first load fails', async () => {
    getAssessments.mockRejectedValue(new Error('Gateway timeout'));
    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(await screen.findByTestId('assessments-error')).toHaveTextContent('Gateway timeout');
    expect(screen.getAllByText('Gateway timeout')).toHaveLength(2);
    expect(frontendLogger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error: 'Gateway timeout' })
    );
  });

  it('uses the service fallback message when the load fails with a non-Error value', async () => {
    getAssessments.mockRejectedValue('offline');
    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(await screen.findByTestId('assessments-error')).toHaveTextContent(UI_STRINGS.ASSESSMENT.errors.fetchFailed);
  });

  it('keeps loaded dossiers and shows the error when a later refresh fails', async () => {
    getAssessments
      .mockResolvedValueOnce([fixtures.record])
      .mockRejectedValueOnce(new Error('Refresh failed'));
    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText(fixtures.record.customerName);

    fireEvent.click(screen.getByTestId('refresh-assessments-btn'));

    expect(await screen.findByText('Refresh failed')).toBeInTheDocument();
    expect(screen.getByText(fixtures.record.customerName)).toBeInTheDocument();
    expect(screen.queryByTestId('assessments-error')).not.toBeInTheDocument();
  });

  it('disables the refresh button while a refresh is running', async () => {
    const pending = createDeferred<AssessmentRecord[]>();
    getAssessments.mockResolvedValueOnce([fixtures.record]).mockReturnValueOnce(pending.promise);
    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText(fixtures.record.customerName);
    const refreshButton = screen.getByTestId('refresh-assessments-btn');

    fireEvent.click(refreshButton);
    expect(refreshButton).toBeDisabled();

    await act(async () => {
      pending.resolve([fixtures.record]);
    });
    expect(refreshButton).toBeEnabled();
  });

  it('ignores a stale response that finishes after a newer refresh', async () => {
    const slow = createDeferred<AssessmentRecord[]>();
    const fast = createDeferred<AssessmentRecord[]>();
    getAssessments.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
    renderWorkspace({ initialActiveTab: 'assessments' });

    fireEvent.click(screen.getByTestId('refresh-assessments-btn'));
    await act(async () => {
      fast.resolve([fixtures.secondRecord]);
    });
    expect(await screen.findByText(fixtures.secondRecord.customerName)).toBeInTheDocument();

    await act(async () => {
      slow.resolve([fixtures.record]);
    });
    expect(screen.queryByText(fixtures.record.customerName)).not.toBeInTheDocument();
  });

  it('ignores a stale failure that arrives after a newer response', async () => {
    const slow = createDeferred<AssessmentRecord[]>();
    const fast = createDeferred<AssessmentRecord[]>();
    getAssessments.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
    renderWorkspace({ initialActiveTab: 'assessments' });

    fireEvent.click(screen.getByTestId('refresh-assessments-btn'));
    await act(async () => {
      fast.resolve([fixtures.secondRecord]);
    });
    expect(await screen.findByText(fixtures.secondRecord.customerName)).toBeInTheDocument();

    await act(async () => {
      slow.reject(new Error('Stale failure'));
    });
    expect(screen.queryByText('Stale failure')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assessments-error')).not.toBeInTheDocument();
  });

  it('shows the empty message when the service returns no list', async () => {
    getAssessments.mockResolvedValue(null as unknown as AssessmentRecord[]);
    renderWorkspace({ initialActiveTab: 'assessments' });

    expect(await screen.findByTestId('assessments-empty')).toHaveTextContent(
      UI_STRINGS.ASSESSMENT.table.emptyMessage
    );
  });

  it('filters dossiers by search text across identifier, customer, and industry', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText(fixtures.record.customerName);
    const search = screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.searchPlaceholder);

    fireEvent.change(search, { target: { value: 'automotive' } });
    expect(screen.queryByText(fixtures.record.customerName)).not.toBeInTheDocument();
    expect(screen.getByText(fixtures.secondRecord.customerName)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'aic-2026-0002' } });
    expect(screen.getByText(fixtures.record.customerName)).toBeInTheDocument();
    expect(screen.queryByText(fixtures.secondRecord.customerName)).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'nothing matches' } });
    expect(screen.getByTestId('assessments-empty')).toBeInTheDocument();
  });

  it('filters dossiers by status tab', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText(fixtures.record.customerName);

    // The status tab labels are hardcoded in AssessmentWorkspace, so they are matched literally here.
    fireEvent.click(screen.getByRole('button', { name: 'AWAITING REVIEW' }));
    expect(screen.queryByText(fixtures.record.customerName)).not.toBeInTheDocument();
    expect(screen.getByText(fixtures.secondRecord.customerName)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All Dossiers' }));
    expect(screen.getByText(fixtures.record.customerName)).toBeInTheDocument();
  });

  it('opens the detail workflow for a selected dossier and returns to the list', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });
    fireEvent.click(await rowFor(fixtures.record.customerName));

    expect(onSelectAssessment).toHaveBeenCalledWith(fixtures.record.assessmentId);
    expect(onActiveAssessmentChange).toHaveBeenCalledWith(fixtures.record);
    expect(screen.getByTestId('detail-id')).toHaveTextContent(fixtures.record.assessmentId);
    expect(localStorage.getItem(STORAGE_SELECTED_ASSESSMENT)).toBe(fixtures.record.assessmentId);

    fireEvent.click(screen.getByRole('button', { name: 'stub back' }));

    expect(screen.queryByTestId('detail-workflow')).not.toBeInTheDocument();
    expect(onActiveAssessmentChange).toHaveBeenLastCalledWith(null);
    expect(localStorage.getItem(STORAGE_SELECTED_ASSESSMENT)).toBeNull();
  });

  it('reports detail updates to the parent only for the dossier that is open', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });
    fireEvent.click(await rowFor(fixtures.record.customerName));
    onActiveAssessmentChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'stub update' }));
    expect(onActiveAssessmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentId: fixtures.record.assessmentId, status: 'APPROVED' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'stub update other' }));
    expect(onActiveAssessmentChange).toHaveBeenCalledTimes(1);
  });

  it('creates a dossier from the modal and opens it', async () => {
    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText(fixtures.record.customerName);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.btnNewAssessment }));
    expect(screen.getByTestId('new-modal-customer')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: 'stub created' }));

    expect(onSelectAssessment).toHaveBeenCalledWith(fixtures.createdRecord.assessmentId);
    expect(onActiveAssessmentChange).toHaveBeenCalledWith(fixtures.createdRecord);
    expect(screen.getByTestId('detail-id')).toHaveTextContent(fixtures.createdRecord.assessmentId);
  });

  it('opens the new dossier modal for a customer and closes it', async () => {
    renderWorkspace({ initialActiveTab: 'customers' });
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'stub create for customer' }));
    expect(screen.getByTestId('new-modal-customer')).toHaveTextContent(fixtures.customer.customerName);

    fireEvent.click(screen.getByRole('button', { name: 'stub modal close' }));
    expect(screen.queryByTestId('new-modal')).not.toBeInTheDocument();
  });

  it('records the selected customer and clears the active assessment', async () => {
    renderWorkspace({ initialActiveTab: 'customers' });
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'stub select customer' }));

    expect(onSelectCustomer).toHaveBeenCalledWith(fixtures.customer);
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent(fixtures.customer.id);
    expect(localStorage.getItem(STORAGE_SELECTED_CUSTOMER)).toBe(fixtures.customer.id);
    expect(onActiveAssessmentChange).toHaveBeenLastCalledWith(null);
  });

  it('opens a dossier in Module 1 from the customer view, with or without a navigation handler', async () => {
    const onNavigateToModule1 = vi.fn();
    const { unmount } = render(
      <AssessmentWorkspace initialActiveTab="customers" onNavigateToModule1={onNavigateToModule1} />
    );
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'stub open module 1' }));
    expect(onNavigateToModule1).toHaveBeenCalledWith(fixtures.record);
    expect(screen.getByTestId('detail-id')).toHaveTextContent(fixtures.record.assessmentId);
    unmount();

    render(<AssessmentWorkspace initialActiveTab="customers" />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'stub open module 1' }));
    expect(screen.getByTestId('detail-id')).toHaveTextContent(fixtures.record.assessmentId);
  });

  it('opens and closes system information from the header', async () => {
    renderWorkspace({ initialActiveTab: 'customers' });
    await settle();

    fireEvent.click(within(screen.getByRole('navigation')).getAllByRole('button')[2]);
    expect(screen.getByTestId('system-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'stub system close' }));
    expect(screen.queryByTestId('system-modal')).not.toBeInTheDocument();
  });

  it('shows financial figures only for accepted dossiers with consolidated savings', async () => {
    const accepted: AssessmentRecord = {
      ...fixtures.record,
      assessmentId: 'AIC-2026-0010',
      customerName: 'Gate Pass Co',
      status: 'ACCEPTED',
      activeDataVersionId: 'DV-10',
      activeAnalysisRunId: 'RUN-10',
      totalSpendCr: 100,
      validatedSpendCr: 90,
      netDefensibleOpportunityCr: 10,
      potentialSavingsCr: 0,
      savingsPct: 5,
      isTestData: true
    };
    const acceptedPotentialOnly: AssessmentRecord = {
      ...accepted,
      assessmentId: 'AIC-2026-0011',
      customerName: 'Potential Co',
      totalSpendCr: 120,
      validatedSpendCr: 110,
      netDefensibleOpportunityCr: undefined,
      potentialSavingsCr: 7.5,
      savingsPct: undefined,
      isTestData: false,
      dataStatus: 'AWAITING_DATA',
      dataReceivedAt: '2026-10-01T00:00:00.000Z'
    };
    const acceptedZeros: AssessmentRecord = {
      ...accepted,
      assessmentId: 'AIC-2026-0012',
      customerName: 'Zero Co',
      totalSpendCr: 0,
      validatedSpendCr: undefined,
      netDefensibleOpportunityCr: 0,
      potentialSavingsCr: 0,
      savingsPct: 0,
      isTestData: false
    };
    const notAccepted: AssessmentRecord = {
      ...accepted,
      assessmentId: 'AIC-2026-0013',
      customerName: 'Pending Co',
      status: 'IN_PROGRESS',
      totalSpendCr: 130,
      isTestData: false
    };
    const closedRecord: AssessmentRecord = {
      ...fixtures.record,
      assessmentId: 'AIC-2026-0014',
      customerName: 'Closed Co',
      status: 'CLOSED' as AssessmentStatus
    };
    getAssessments.mockResolvedValue([accepted, acceptedPotentialOnly, acceptedZeros, notAccepted, closedRecord]);

    renderWorkspace({ initialActiveTab: 'assessments' });
    await screen.findByText('Gate Pass Co');

    expect(screen.getByText('₹100.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹90.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹10.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('5.00%')).toBeInTheDocument();
    expect(screen.getByText('₹120.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹110.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹7.50 Cr')).toBeInTheDocument();
    expect(screen.queryByText('₹130.00 Cr')).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.table.badgeTestData)).toBeInTheDocument();
    expect(screen.getByText(ASSESSMENT_STATUS_BADGES.DRAFT.label)).toBeInTheDocument();
    expect(within(kpiCard(UI_STRINGS.ASSESSMENT.kpiCards.closed)).getByText('1')).toBeInTheDocument();
  });

  it('renders the initial state on the server, where window is unavailable', () => {
    vi.stubGlobal('window', undefined);
    try {
      const markup = renderToStaticMarkup(<AssessmentWorkspace initialActiveTab="assessments" />);

      expect(markup).toContain(UI_STRINGS.ASSESSMENT.btnNewAssessment);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
