import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { CustomerManagementView } from '../../../src/components/assessment/CustomerManagementView';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';
import type {
  AssessmentRecord,
  CreateCustomerModalProps,
  CustomerRecord,
  EditCustomerModalProps
} from '../../../src/types';

// Fixtures are hoisted so the modal stubs below can reference them.
const fixtures = vi.hoisted(() => {
  const timestamp = '2026-10-11T10:00:00.000Z';
  const acme = {
    id: 'CUST-2026-0001',
    customerName: 'Acme Components',
    industry: 'Fasteners',
    businessUnit: 'Operations',
    region: 'EU',
    companyWebsite: 'https://acme.example.com',
    contactPerson: 'Priya Nair',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  return {
    acme,
    globex: {
      id: 'CUST-2026-0002',
      customerName: 'Globex Logistics',
      industry: 'Logistics',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    renamedAcme: { ...acme, customerName: 'Acme Components Renamed' },
    newCustomer: {
      id: 'CUST-2026-0500',
      customerName: 'Initech Systems',
      industry: 'Software',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
});

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getCustomers: vi.fn(),
    getAssessments: vi.fn()
  }
}));

vi.mock('../../../src/components/assessment/CreateCustomerModal', async () => {
  const { createElement } = await import('react');
  return {
    CreateCustomerModal: (props: CreateCustomerModalProps) => {
      if (!props.isOpen) return null;
      return createElement(
        'div',
        { 'data-testid': 'create-modal' },
        createElement(
          'button',
          { type: 'button', onClick: () => props.onCreated(fixtures.newCustomer) },
          'stub create'
        ),
        createElement('button', { type: 'button', onClick: () => props.onClose() }, 'stub create close')
      );
    }
  };
});

vi.mock('../../../src/components/assessment/EditCustomerModal', async () => {
  const { createElement } = await import('react');
  return {
    EditCustomerModal: (props: EditCustomerModalProps) => {
      if (!props.isOpen || !props.customer) return null;
      return createElement(
        'div',
        { 'data-testid': 'edit-modal' },
        createElement('span', null, props.customer.customerName),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              props.onUpdated({ ...props.customer, customerName: `${props.customer.customerName} Renamed` })
          },
          'stub update'
        ),
        createElement('button', { type: 'button', onClick: () => props.onClose() }, 'stub edit close')
      );
    }
  };
});

const strings = UI_STRINGS.ASSESSMENT.customerManagement;

const dossierForAcme: AssessmentRecord = {
  assessmentId: 'AIC-2026-0100',
  customerId: 'CUST-2026-0001',
  customerName: 'Acme Components',
  industry: 'Fasteners',
  assessmentPeriod: 'FY25',
  assessmentPeriodStart: 'April 2024',
  assessmentPeriodEnd: 'March 2025',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  currentDataVersionId: 'DV-100',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'AWAITING_REVIEW',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z'
};

// Matched to Acme by customer name only, with optional display fields missing.
const dossierByNameOnly: AssessmentRecord = {
  ...dossierForAcme,
  assessmentId: 'AIC-2026-0101',
  customerId: undefined,
  assessmentPeriod: undefined,
  dataStatus: undefined,
  currentDataVersionId: undefined,
  status: 'DRAFT'
};

// Has no assessment ID, so its legacy record ID is shown instead.
const legacyGlobexDossier: AssessmentRecord = {
  ...dossierForAcme,
  assessmentId: '',
  id: 'LEGACY-1',
  customerId: undefined,
  customerName: 'Globex Logistics',
  status: 'DRAFT'
};

const otherCustomerDossier: AssessmentRecord = {
  ...dossierForAcme,
  assessmentId: 'AIC-2026-0200',
  customerId: 'CUST-2026-9999',
  customerName: 'Other Co'
};

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

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('CustomerManagementView', () => {
  const onSelectCustomer = vi.fn();
  const onCreateAssessmentForCustomer = vi.fn();
  const onOpenAssessmentInModule1 = vi.fn();

  type ViewProps = React.ComponentProps<typeof CustomerManagementView>;

  const viewElement = (props: Partial<ViewProps> = {}): React.ReactElement => (
    <CustomerManagementView
      onSelectCustomer={onSelectCustomer}
      onCreateAssessmentForCustomer={onCreateAssessmentForCustomer}
      onOpenAssessmentInModule1={onOpenAssessmentInModule1}
      selectedCustomerId={null}
      {...props}
    />
  );

  const renderView = (props: Partial<ViewProps> = {}): ReturnType<typeof render> => render(viewElement(props));

  const rowFor = async (customerName: string): Promise<HTMLElement> => {
    const cell = await screen.findByText(customerName, { selector: 'span' });
    const row = cell.closest('tr');
    if (!row) {
      throw new Error(`Directory row for ${customerName} was not rendered`);
    }
    return row;
  };

  const selectCustomer = async (customerName: string): Promise<void> => {
    const row = await rowFor(customerName);
    fireEvent.click(within(row).getByRole('button', { name: strings.table.selectAction }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    vi.mocked(assessmentApiClient.getCustomers).mockResolvedValue([fixtures.acme, fixtures.globex]);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([
      dossierForAcme,
      dossierByNameOnly,
      legacyGlobexDossier,
      otherCustomerDossier
    ]);
  });

  it('lists customers with the number of assessments linked to each', async () => {
    renderView();

    const acmeRow = await rowFor(fixtures.acme.customerName);
    expect(within(acmeRow).getByText('2')).toBeInTheDocument();

    const globexRow = await rowFor(fixtures.globex.customerName);
    expect(within(globexRow).getByText('1')).toBeInTheDocument();
  });

  it('shows a loading state until the customer list resolves', async () => {
    const pending = createDeferred<CustomerRecord[]>();
    vi.mocked(assessmentApiClient.getCustomers).mockReturnValue(pending.promise);
    renderView();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await act(async () => {
      pending.resolve([fixtures.acme]);
    });
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('filters the directory by name, identifier, industry, business unit, and region', async () => {
    renderView();
    await rowFor(fixtures.acme.customerName);
    const search = screen.getByPlaceholderText(strings.searchPlaceholder);

    fireEvent.change(search, { target: { value: 'logistics' } });
    expect(screen.getByText(fixtures.globex.customerName)).toBeInTheDocument();
    expect(screen.queryByText(fixtures.acme.customerName)).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'cust-2026-0001' } });
    expect(screen.getByText(fixtures.acme.customerName)).toBeInTheDocument();
    expect(screen.queryByText(fixtures.globex.customerName)).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'operations' } });
    expect(screen.getByText(fixtures.acme.customerName)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'eu' } });
    expect(screen.getByText(fixtures.acme.customerName)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: '   ' } });
    expect(screen.getByText(fixtures.acme.customerName)).toBeInTheDocument();
    expect(screen.getByText(fixtures.globex.customerName)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'no such customer' } });
    expect(screen.getByText(strings.emptyNoCustomers)).toBeInTheDocument();
  });

  it('opens the create dialog from the empty directory state', async () => {
    vi.mocked(assessmentApiClient.getCustomers).mockResolvedValue([]);
    renderView();

    expect(await screen.findByText(strings.emptyNoCustomers)).toBeInTheDocument();
    const createButtons = screen.getAllByRole('button', { name: strings.btnCreateCustomer });
    fireEvent.click(createButtons[createButtons.length - 1]);

    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });

  it('selects a customer and lists the assessments linked to it', async () => {
    renderView();

    await selectCustomer(fixtures.acme.customerName);

    expect(onSelectCustomer).toHaveBeenCalledWith(fixtures.acme);
    expect(screen.getByRole('button', { name: strings.btnEditCustomer })).toBeInTheDocument();
    expect(screen.getByText(dossierForAcme.assessmentId)).toBeInTheDocument();
    expect(screen.getByText(dossierByNameOnly.assessmentId)).toBeInTheDocument();
    expect(screen.queryByText(otherCustomerDossier.assessmentId)).not.toBeInTheDocument();
  });

  it('uses the legacy record id when a dossier has no assessment id', async () => {
    renderView();

    await selectCustomer(fixtures.globex.customerName);

    expect(screen.getByText('LEGACY-1')).toBeInTheDocument();
  });

  it('shows the spotlight for the customer named by selectedCustomerId', async () => {
    renderView({ selectedCustomerId: fixtures.acme.id });

    expect(await screen.findByRole('button', { name: strings.clearSelection })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: strings.btnEditCustomer }));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent(fixtures.acme.customerName);
  });

  it('follows changes to selectedCustomerId after the list has loaded', async () => {
    const { rerender } = renderView({ selectedCustomerId: fixtures.globex.id });
    fireEvent.click(await screen.findByRole('button', { name: strings.btnEditCustomer }));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent(fixtures.globex.customerName);
    fireEvent.click(screen.getByRole('button', { name: 'stub edit close' }));

    rerender(viewElement({ selectedCustomerId: fixtures.acme.id }));

    fireEvent.click(screen.getByRole('button', { name: strings.btnEditCustomer }));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent(fixtures.acme.customerName);
  });

  it('shows the empty selection message for a selectedCustomerId that is not in the directory', async () => {
    renderView({ selectedCustomerId: 'CUST-MISSING' });

    expect(await screen.findByText(strings.emptyNoSelection)).toBeInTheDocument();
  });

  it('clears the selection from the spotlight', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    fireEvent.click(screen.getByRole('button', { name: strings.clearSelection }));

    expect(screen.getByText(strings.emptyNoSelection)).toBeInTheDocument();
  });

  it('sends assessment creation requests from the spotlight and the dossier header', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    fireEvent.click(screen.getByRole('button', { name: strings.btnCreateAssessment }));
    expect(onCreateAssessmentForCustomer).toHaveBeenLastCalledWith(fixtures.acme);

    fireEvent.click(screen.getByRole('button', { name: '+ Create Assessment' }));
    expect(onCreateAssessmentForCustomer).toHaveBeenCalledTimes(2);
  });

  it('opens an assessment in Module 1 from the dossier table', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    const dossierTable = screen.getAllByRole('table')[0];
    fireEvent.click(within(dossierTable).getAllByRole('button')[0]);

    expect(onOpenAssessmentInModule1).toHaveBeenCalledWith(dossierForAcme);
  });

  it('hides the Module 1 action when no handler is supplied', async () => {
    renderView({ onOpenAssessmentInModule1: undefined });
    await selectCustomer(fixtures.acme.customerName);

    const dossierTable = screen.getAllByRole('table')[0];
    expect(within(dossierTable).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an empty dossier with a create link when the customer has no assessments', async () => {
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([]);
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    expect(screen.getAllByRole('table')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Create first assessment/ }));

    expect(onCreateAssessmentForCustomer).toHaveBeenCalledWith(fixtures.acme);
  });

  it('opens the edit dialog from the spotlight and shows the updated name', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    fireEvent.click(screen.getByRole('button', { name: strings.btnEditCustomer }));
    const modal = screen.getByTestId('edit-modal');
    expect(within(modal).getByText(fixtures.acme.customerName)).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole('button', { name: 'stub update' }));

    expect(await screen.findAllByText(fixtures.renamedAcme.customerName)).not.toHaveLength(0);
  });

  it('edits another customer from the directory without changing the selection', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    const globexRow = await rowFor(fixtures.globex.customerName);
    fireEvent.click(within(globexRow).getByRole('button', { name: strings.table.editAction }));
    fireEvent.click(within(screen.getByTestId('edit-modal')).getByRole('button', { name: 'stub update' }));

    expect(await screen.findAllByText('Globex Logistics Renamed')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: strings.clearSelection })).toBeInTheDocument();
    expect(screen.getByText(strings.btnEditCustomer, { exact: true })).toBeInTheDocument();
  });

  it('adds a customer created from the header and selects it', async () => {
    renderView();
    await rowFor(fixtures.acme.customerName);

    fireEvent.click(screen.getAllByRole('button', { name: strings.btnCreateCustomer })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'stub create' }));

    expect(onSelectCustomer).toHaveBeenCalledWith(fixtures.newCustomer);
    expect(await screen.findAllByText(fixtures.newCustomer.customerName)).not.toHaveLength(0);
  });

  it('closes the create and edit dialogs through their close callbacks', async () => {
    renderView();
    await selectCustomer(fixtures.acme.customerName);

    fireEvent.click(screen.getAllByRole('button', { name: strings.btnCreateCustomer })[0]);
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'stub create close' }));
    expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: strings.btnEditCustomer }));
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'stub edit close' }));
    expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
  });

  it('logs a failed customer load and leaves the directory empty', async () => {
    vi.mocked(assessmentApiClient.getCustomers).mockRejectedValue(new Error('Gateway timeout'));
    renderView();

    expect(await screen.findByText(strings.emptyNoCustomers)).toBeInTheDocument();
    expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'Gateway timeout' });
  });

  it('records a failed load that is not an Error as text', async () => {
    vi.mocked(assessmentApiClient.getAssessments).mockRejectedValue('offline');
    renderView();

    await screen.findByText(strings.emptyNoCustomers);
    expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'offline' });
  });

  it('ignores a stale customer list when StrictMode restarts the load', async () => {
    const stale = createDeferred<CustomerRecord[]>();
    vi.mocked(assessmentApiClient.getCustomers)
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce([fixtures.globex]);

    render(
      <React.StrictMode>
        {viewElement()}
      </React.StrictMode>
    );

    expect(await screen.findByText(fixtures.globex.customerName)).toBeInTheDocument();
    await act(async () => {
      stale.resolve([fixtures.acme]);
    });

    expect(screen.queryByText(fixtures.acme.customerName)).not.toBeInTheDocument();
    expect(screen.getByText(fixtures.globex.customerName)).toBeInTheDocument();
  });
});
