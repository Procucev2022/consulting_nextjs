import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewAssessmentModal } from '../../../src/components/assessment/NewAssessmentModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { AssessmentRecord, CustomerRecord } from '../../../src/types';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';

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

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    createAssessment: vi.fn()
  }
}));

const strings = UI_STRINGS.ASSESSMENT.modalNew;

const preselectedCustomer: CustomerRecord = {
  id: 'CUST-2026-0002',
  customerName: 'ABC Textile Ltd',
  industry: 'Textiles & Apparel',
  businessUnit: 'Procurement Operations',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z'
};

const createdAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0011',
  customerName: 'ABC Textile Ltd',
  industry: 'Textiles & Apparel',
  assessmentPeriodStart: 'April 2025',
  assessmentPeriodEnd: 'March 2026',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'DRAFT',
  createdAt: '2026-10-11T12:00:00.000Z',
  updatedAt: '2026-10-11T12:00:00.000Z'
};

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

// Inputs have no accessible names, so they are addressed in DOM order:
// customer, business unit, industry, period start, period end, analyst email, currency, notes.
const textFields = (): HTMLElement[] => screen.getAllByRole('textbox');
const dialogButtons = (): HTMLElement[] => screen.getAllByRole('button');
const submitButton = (): HTMLElement => dialogButtons().at(-1) as HTMLElement;

const findDateInput = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>('input[type="date"]');
  if (!input) {
    throw new Error('Data received date input was not rendered');
  }
  return input;
};

describe('NewAssessmentModal', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  const renderModal = (
    props: { isOpen?: boolean; preselectedCustomer?: CustomerRecord | null } = {}
  ): ReturnType<typeof render> =>
    render(
      <NewAssessmentModal
        isOpen={props.isOpen ?? true}
        preselectedCustomer={props.preselectedCustomer}
        onClose={onClose}
        onCreated={onCreated}
      />
    );

  const fillPeriod = (start: string, end: string): void => {
    const [, , , periodStartInput, periodEndInput] = textFields();
    fireEvent.change(periodStartInput, { target: { value: start } });
    fireEvent.change(periodEndInput, { target: { value: end } });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    vi.mocked(assessmentApiClient.createAssessment).mockResolvedValue(createdAssessment);
  });

  it('renders nothing while closed', () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.firstChild).toBeNull();
  });

  it('links the dossier to a preselected customer and prefills its details', () => {
    renderModal({ preselectedCustomer });
    const [customerInput, businessUnitInput, industryInput] = textFields();

    expect(screen.getByText(new RegExp(preselectedCustomer.id))).toBeInTheDocument();
    expect(customerInput).toHaveValue(preselectedCustomer.customerName);
    expect(businessUnitInput).toHaveValue(preselectedCustomer.businessUnit);
    expect(industryInput).toHaveValue(preselectedCustomer.industry);
  });

  it('submits the linked customer with the entered assessment period', async () => {
    renderModal({ preselectedCustomer });
    fillPeriod('April 2025', 'March 2026');
    const analystValue = (textFields()[5] as HTMLInputElement).value;

    fireEvent.click(submitButton());

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdAssessment));
    expect(assessmentApiClient.createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: preselectedCustomer.id,
        customerName: preselectedCustomer.customerName,
        businessUnit: preselectedCustomer.businessUnit,
        industry: preselectedCustomer.industry,
        assessmentPeriodStart: 'April 2025',
        assessmentPeriodEnd: 'March 2026',
        assignedAnalyst: analystValue,
        assessmentOwner: analystValue,
        dataReceivedDate: undefined,
        notes: undefined
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates a free-form dossier with optional values when no customer is linked', async () => {
    const { container } = renderModal();
    const [customerInput, businessUnitInput, industryInput, , , , currencyInput, notesInput] = textFields();

    fireEvent.change(customerInput, { target: { value: 'Walk-in Client' } });
    fireEvent.change(businessUnitInput, { target: { value: 'Finance' } });
    fireEvent.change(industryInput, { target: { value: 'Logistics' } });
    fillPeriod('July 2025', 'June 2026');
    fireEvent.change(currencyInput, { target: { value: '   ' } });
    fireEvent.change(findDateInput(container), { target: { value: '2026-10-01' } });
    fireEvent.change(notesInput, { target: { value: 'Scope note' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdAssessment));
    expect(assessmentApiClient.createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: undefined,
        customerName: 'Walk-in Client',
        businessUnit: 'Finance',
        industry: 'Logistics',
        currency: undefined,
        dataReceivedDate: '2026-10-01',
        notes: 'Scope note'
      })
    );
  });

  it.each([
    ['customer name', 0],
    ['industry', 2],
    ['period start', 3],
    ['period end', 4]
  ])('blocks submission when the %s is blank', (_label, blankIndex) => {
    renderModal();
    const fields = textFields();
    const values = ['ABC Textile Ltd', 'Procurement', 'Textiles', 'April 2025', 'March 2026'];
    const inputIndexes = [0, 2, 3, 4];

    inputIndexes.forEach((fieldIndex, position) => {
      const value = fieldIndex === blankIndex ? '   ' : values[position];
      fireEvent.change(fields[fieldIndex], { target: { value } });
    });
    fireEvent.click(submitButton());

    expect(assessmentApiClient.createAssessment).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('shows the API error message and keeps the dialog open', async () => {
    vi.mocked(assessmentApiClient.createAssessment).mockRejectedValue(
      new Error('Customer already has an open dossier')
    );
    renderModal({ preselectedCustomer });
    fillPeriod('April 2025', 'March 2026');

    fireEvent.click(submitButton());

    expect(await screen.findByText('Customer already has an open dossier')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-enables submission after a rejection that is not an Error', async () => {
    vi.mocked(assessmentApiClient.createAssessment).mockRejectedValue('server offline');
    renderModal({ preselectedCustomer });
    fillPeriod('April 2025', 'March 2026');

    fireEvent.click(submitButton());

    await waitFor(() => expect(submitButton()).toBeEnabled());
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables submission while the dossier is being created', async () => {
    const pending = createDeferred<AssessmentRecord>();
    vi.mocked(assessmentApiClient.createAssessment).mockReturnValue(pending.promise);
    renderModal({ preselectedCustomer });
    fillPeriod('April 2025', 'March 2026');

    fireEvent.click(submitButton());

    expect(submitButton()).toBeDisabled();
    pending.resolve(createdAssessment);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('updates the NDA status, analyst, and currency before submitting', async () => {
    renderModal({ preselectedCustomer });
    fillPeriod('April 2025', 'March 2026');
    const [, , , , , analystInput, currencyInput] = textFields();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SENT' } });
    fireEvent.change(analystInput, { target: { value: 'lead@procucev.com' } });
    fireEvent.change(currencyInput, { target: { value: 'USD' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdAssessment));
    expect(assessmentApiClient.createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        ndaStatus: 'SENT',
        assignedAnalyst: 'lead@procucev.com',
        assessmentOwner: 'lead@procucev.com',
        currency: 'USD'
      })
    );
  });

  it('clears the form when the preselected customer is removed or lacks a business unit', () => {
    const { rerender } = renderModal({ preselectedCustomer });
    expect(textFields()[0]).toHaveValue(preselectedCustomer.customerName);

    rerender(
      <NewAssessmentModal isOpen preselectedCustomer={null} onClose={onClose} onCreated={onCreated} />
    );
    expect(textFields()[0]).toHaveValue('');
    expect(screen.queryByText(new RegExp(preselectedCustomer.id))).not.toBeInTheDocument();

    rerender(
      <NewAssessmentModal
        isOpen
        preselectedCustomer={{ ...preselectedCustomer, businessUnit: undefined }}
        onClose={onClose}
        onCreated={onCreated}
      />
    );
    expect(textFields()[1]).toHaveValue('');
  });

  it('closes from the cancel button and from the close icon', () => {
    renderModal({ preselectedCustomer });

    fireEvent.click(screen.getByRole('button', { name: strings.btnCancel }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialogButtons()[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
