import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateCustomerModal } from '../../../src/components/assessment/CreateCustomerModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { CustomerRecord } from '../../../src/types';
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
    createCustomer: vi.fn()
  }
}));

const strings = UI_STRINGS.ASSESSMENT.customerManagement.modalCreate;

const createdCustomer: CustomerRecord = {
  id: 'CUST-2026-0010',
  customerName: 'Acme Components',
  industry: 'Fasteners',
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
// name, industry, website, business unit, contact person, contact email, notes.
const textFields = (): HTMLElement[] => screen.getAllByRole('textbox');
const dialogButtons = (): HTMLElement[] => screen.getAllByRole('button');
const submitButton = (): HTMLElement => dialogButtons().at(-1) as HTMLElement;

describe('CreateCustomerModal', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  const renderModal = (): void => {
    render(<CreateCustomerModal isOpen onClose={onClose} onCreated={onCreated} />);
  };

  const fillRequiredFields = (name: string, industry: string): void => {
    const [nameInput, industryInput] = textFields();
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.change(industryInput, { target: { value: industry } });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    vi.mocked(assessmentApiClient.createCustomer).mockResolvedValue(createdCustomer);
  });

  it('renders nothing while closed', () => {
    const { container } = render(
      <CreateCustomerModal isOpen={false} onClose={onClose} onCreated={onCreated} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows the title, subtitle, and every field label', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: strings.title })).toBeInTheDocument();
    expect(screen.getByText(strings.subtitle)).toBeInTheDocument();
    [
      strings.fieldName,
      strings.fieldIndustry,
      strings.fieldCompanyWebsite,
      strings.fieldBusinessUnit,
      strings.fieldRegion,
      strings.fieldContactPerson,
      strings.fieldContactEmail,
      strings.fieldNotes
    ].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('blocks submission when the name or industry is blank and keeps the form open', () => {
    renderModal();

    fillRequiredFields('   ', 'Fasteners');
    fireEvent.click(submitButton());

    fillRequiredFields('Acme Components', '   ');
    fireEvent.click(submitButton());

    expect(assessmentApiClient.createCustomer).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits trimmed required values and leaves blank optional values out', async () => {
    renderModal();
    const [
      nameInput,
      industryInput,
      websiteInput,
      businessUnitInput,
      contactPersonInput,
      contactEmailInput,
      notesInput
    ] = textFields();

    fireEvent.change(nameInput, { target: { value: '  Acme Components  ' } });
    fireEvent.change(industryInput, { target: { value: '  Fasteners  ' } });
    fireEvent.change(websiteInput, { target: { value: '   ' } });
    fireEvent.change(businessUnitInput, { target: { value: '   ' } });
    fireEvent.change(contactPersonInput, { target: { value: '' } });
    fireEvent.change(contactEmailInput, { target: { value: '' } });
    fireEvent.change(notesInput, { target: { value: '  ' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    fireEvent.click(submitButton());

    expect(assessmentApiClient.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Acme Components',
        industry: 'Fasteners',
        companyWebsite: undefined,
        businessUnit: undefined,
        region: undefined,
        contactPerson: undefined,
        contactEmail: undefined,
        notes: undefined
      })
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdCustomer));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends every optional field when it is filled in', async () => {
    renderModal();
    const [
      nameInput,
      industryInput,
      websiteInput,
      businessUnitInput,
      contactPersonInput,
      contactEmailInput,
      notesInput
    ] = textFields();

    fireEvent.change(nameInput, { target: { value: 'Acme Components' } });
    fireEvent.change(industryInput, { target: { value: 'Fasteners' } });
    fireEvent.change(websiteInput, { target: { value: 'https://acme.example.com' } });
    fireEvent.change(businessUnitInput, { target: { value: 'Operations' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'EU' } });
    fireEvent.change(contactPersonInput, { target: { value: 'Priya Nair' } });
    fireEvent.change(contactEmailInput, { target: { value: 'procurement@acme.example.com' } });
    fireEvent.change(notesInput, { target: { value: 'Quarterly review' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdCustomer));
    expect(assessmentApiClient.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Acme Components',
        industry: 'Fasteners',
        companyWebsite: 'https://acme.example.com',
        businessUnit: 'Operations',
        region: 'EU',
        contactPerson: 'Priya Nair',
        contactEmail: 'procurement@acme.example.com',
        notes: 'Quarterly review'
      })
    );
  });

  it('shows the API error message and keeps the form open', async () => {
    vi.mocked(assessmentApiClient.createCustomer).mockRejectedValue(new Error('Customer name already exists'));
    renderModal();

    fillRequiredFields('Acme Components', 'Fasteners');
    fireEvent.click(submitButton());

    expect(await screen.findByText('Customer name already exists')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-enables submission after a rejection that is not an Error', async () => {
    vi.mocked(assessmentApiClient.createCustomer).mockRejectedValue('network down');
    renderModal();

    fillRequiredFields('Acme Components', 'Fasteners');
    fireEvent.click(submitButton());

    await waitFor(() => expect(submitButton()).toBeEnabled());
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables submission while the request is pending', async () => {
    const pending = createDeferred<CustomerRecord>();
    vi.mocked(assessmentApiClient.createCustomer).mockReturnValue(pending.promise);
    renderModal();

    fillRequiredFields('Acme Components', 'Fasteners');
    fireEvent.click(submitButton());

    expect(submitButton()).toBeDisabled();
    pending.resolve(createdCustomer);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('closes from the cancel button and from the close icon', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: strings.btnCancel }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialogButtons()[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
