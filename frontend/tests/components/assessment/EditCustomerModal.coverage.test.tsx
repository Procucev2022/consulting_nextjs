import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditCustomerModal } from '../../../src/components/assessment/EditCustomerModal';
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
    updateCustomer: vi.fn()
  }
}));

const strings = UI_STRINGS.ASSESSMENT.customerManagement;

const fullCustomer: CustomerRecord = {
  id: 'CUST-2026-0002',
  customerName: 'ABC Textile Ltd',
  industry: 'Textiles & Apparel',
  businessUnit: 'Procurement Operations',
  region: 'APAC',
  baseCurrency: 'INR',
  companyWebsite: 'https://abctextile.example.com',
  contactPerson: 'Rajesh Kumar',
  contactEmail: 'procurement@abctextile.example.com',
  notes: 'Quarterly governance review',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z'
};

const sparseCustomer: CustomerRecord = {
  id: 'CUST-2026-0009',
  customerName: 'Sparse Co',
  industry: 'Chemicals',
  createdAt: '2026-10-12T10:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z'
};

const updatedCustomer: CustomerRecord = { ...fullCustomer, customerName: 'Renamed Textile' };

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

describe('EditCustomerModal', () => {
  const onClose = vi.fn();
  const onUpdated = vi.fn();

  const renderModal = (customer: CustomerRecord | null, isOpen = true): void => {
    render(<EditCustomerModal isOpen={isOpen} customer={customer} onClose={onClose} onUpdated={onUpdated} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    vi.mocked(assessmentApiClient.updateCustomer).mockResolvedValue(updatedCustomer);
  });

  it('renders nothing when closed or when no customer is provided', () => {
    const { container: closedContainer } = render(
      <EditCustomerModal isOpen={false} customer={fullCustomer} onClose={onClose} onUpdated={onUpdated} />
    );
    expect(closedContainer.firstChild).toBeNull();

    const { container: emptyContainer } = render(
      <EditCustomerModal isOpen customer={null} onClose={onClose} onUpdated={onUpdated} />
    );
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('pre-fills every field from the customer profile', () => {
    renderModal(fullCustomer);
    const [nameInput, industryInput, websiteInput, businessUnitInput, contactPersonInput, contactEmailInput, notesInput] =
      textFields();

    expect(screen.getByRole('heading', { name: strings.modalEdit.title })).toBeInTheDocument();
    expect(nameInput).toHaveValue(fullCustomer.customerName);
    expect(industryInput).toHaveValue(fullCustomer.industry);
    expect(websiteInput).toHaveValue(fullCustomer.companyWebsite);
    expect(businessUnitInput).toHaveValue(fullCustomer.businessUnit);
    expect(contactPersonInput).toHaveValue(fullCustomer.contactPerson);
    expect(contactEmailInput).toHaveValue(fullCustomer.contactEmail);
    expect(notesInput).toHaveValue(fullCustomer.notes);
    expect(screen.getByRole('combobox')).toHaveValue(fullCustomer.region);
  });

  it('saves every edited field for the same customer id', async () => {
    renderModal(fullCustomer);
    const [nameInput, industryInput, websiteInput, businessUnitInput, contactPersonInput, contactEmailInput, notesInput] =
      textFields();

    fireEvent.change(nameInput, { target: { value: '  Renamed Textile  ' } });
    fireEvent.change(industryInput, { target: { value: 'Textiles' } });
    fireEvent.change(websiteInput, { target: { value: 'https://renamed.example.com' } });
    fireEvent.change(businessUnitInput, { target: { value: 'Finance' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'EU' } });
    fireEvent.change(contactPersonInput, { target: { value: 'Asha Rao' } });
    fireEvent.change(contactEmailInput, { target: { value: 'asha@renamed.example.com' } });
    fireEvent.change(notesInput, { target: { value: 'Moved to annual review' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedCustomer));
    expect(assessmentApiClient.updateCustomer).toHaveBeenCalledWith(
      fullCustomer.id,
      expect.objectContaining({
        customerName: 'Renamed Textile',
        industry: 'Textiles',
        companyWebsite: 'https://renamed.example.com',
        businessUnit: 'Finance',
        region: 'EU',
        contactPerson: 'Asha Rao',
        contactEmail: 'asha@renamed.example.com',
        notes: 'Moved to annual review'
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to default values and omits blank optional fields for a sparse profile', async () => {
    renderModal(sparseCustomer);

    fireEvent.click(submitButton());

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedCustomer));
    expect(assessmentApiClient.updateCustomer).toHaveBeenCalledWith(
      sparseCustomer.id,
      expect.objectContaining({
        customerName: 'Sparse Co',
        industry: 'Chemicals',
        companyWebsite: undefined,
        businessUnit: undefined,
        contactPerson: undefined,
        contactEmail: undefined,
        notes: undefined
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('GLOBAL');
  });

  it('sends undefined for whitespace-only optional values', async () => {
    renderModal({ ...fullCustomer, baseCurrency: '   ' });
    const [, , websiteInput, businessUnitInput, contactPersonInput, contactEmailInput, notesInput] = textFields();

    fireEvent.change(websiteInput, { target: { value: '   ' } });
    fireEvent.change(businessUnitInput, { target: { value: '   ' } });
    fireEvent.change(contactPersonInput, { target: { value: '   ' } });
    fireEvent.change(contactEmailInput, { target: { value: '   ' } });
    fireEvent.change(notesInput, { target: { value: '   ' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedCustomer));
    expect(assessmentApiClient.updateCustomer).toHaveBeenCalledWith(
      fullCustomer.id,
      expect.objectContaining({
        baseCurrency: undefined,
        companyWebsite: undefined,
        businessUnit: undefined,
        region: undefined,
        contactPerson: undefined,
        contactEmail: undefined,
        notes: undefined
      })
    );
  });

  it('does not save when the name or industry is blank', () => {
    renderModal(fullCustomer);
    const [nameInput] = textFields();

    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.click(submitButton());

    expect(assessmentApiClient.updateCustomer).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the API error message and keeps the modal open', async () => {
    vi.mocked(assessmentApiClient.updateCustomer).mockRejectedValue(new Error('Customer update conflict'));
    renderModal(fullCustomer);

    fireEvent.click(submitButton());

    expect(await screen.findByText('Customer update conflict')).toBeInTheDocument();
    expect(onUpdated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-enables saving after a rejection that is not an Error', async () => {
    vi.mocked(assessmentApiClient.updateCustomer).mockRejectedValue('timeout');
    renderModal(fullCustomer);

    fireEvent.click(submitButton());

    await waitFor(() => expect(submitButton()).toBeEnabled());
    expect(onUpdated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables saving while the update is pending', async () => {
    const pending = createDeferred<CustomerRecord>();
    vi.mocked(assessmentApiClient.updateCustomer).mockReturnValue(pending.promise);
    renderModal(fullCustomer);

    fireEvent.click(submitButton());

    expect(submitButton()).toBeDisabled();
    pending.resolve(updatedCustomer);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows the website intelligence block when a profile is available', () => {
    renderModal({
      ...fullCustomer,
      websiteProfile: {
        companyWebsite: 'https://abctextile.example.com',
        businessDescription: 'Yarn and fabric manufacturer',
        sector: 'Textiles',
        mainProducts: ['Yarn'],
        operatingFootprint: 'India and Vietnam',
        revenueOrProfit: 'INR 420 Cr',
        businessPriorities: ['Cost control'],
        sourceUrls: ['https://abctextile.example.com/about'],
        reportingPeriod: 'FY25',
        retrievedAt: '2026-10-01T00:00:00.000Z'
      }
    });

    expect(screen.getByText(strings.modalEdit.websiteIntelSection)).toBeInTheDocument();
    expect(screen.getByText('Yarn and fabric manufacturer')).toBeInTheDocument();
    expect(screen.getByText('INR 420 Cr')).toBeInTheDocument();
    expect(screen.getByText('https://abctextile.example.com/about')).toBeInTheDocument();
  });

  it('renders a website profile that has no optional details', () => {
    renderModal({
      ...sparseCustomer,
      websiteProfile: {
        companyWebsite: 'https://sparse.example.com',
        businessDescription: 'Specialty chemicals distributor',
        sector: 'Chemicals',
        mainProducts: [],
        operatingFootprint: 'Single site',
        businessPriorities: [],
        sourceUrls: [],
        reportingPeriod: '',
        retrievedAt: '2026-10-01T00:00:00.000Z'
      }
    });

    expect(screen.getByText(strings.modalEdit.websiteIntelSection)).toBeInTheDocument();
    expect(screen.getByText('Specialty chemicals distributor')).toBeInTheDocument();
  });

  it('resets the form when a different customer is opened', () => {
    const { rerender } = render(
      <EditCustomerModal isOpen customer={fullCustomer} onClose={onClose} onUpdated={onUpdated} />
    );
    expect(textFields()[0]).toHaveValue(fullCustomer.customerName);

    rerender(
      <EditCustomerModal isOpen customer={sparseCustomer} onClose={onClose} onUpdated={onUpdated} />
    );

    expect(textFields()[0]).toHaveValue(sparseCustomer.customerName);
    expect(textFields()[3]).toHaveValue('');
  });

  it('closes from the cancel button and from the close icon', () => {
    renderModal(fullCustomer);

    fireEvent.click(screen.getByRole('button', { name: strings.modalEdit.btnCancel }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialogButtons()[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
