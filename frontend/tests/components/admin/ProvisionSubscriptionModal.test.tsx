import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_REQUEST_ID_HEADER } from '@/constants/app';
import { UI_STRINGS } from '@/constants/uiStrings';
import {
  provisionSubscriptionDetailsSchema,
  provisionSubscriptionOtpRequestSchema,
  provisionSubscriptionRequestSchema
} from '@/constants/validation';
import { ProvisionSubscriptionModal } from '@/components/admin/ProvisionSubscriptionModal';
import frontendLogger from '@/utils/logger';
import { authApiClient } from '@/utils/authApi';

vi.mock('@/utils/requestId', () => ({ createClientRequestId: () => 'request-client-1' }));

const strings = UI_STRINGS.subscription.provisionModal;
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onProvisionSuccess: vi.fn()
};

const mockResponse = (status: number, body: unknown, requestId = 'request-test-1') => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => name.toLowerCase() === API_REQUEST_ID_HEADER ? requestId : null },
  json: async () => body
}) as unknown as Response;

const fillDetails = (email = 'buyer@example.com'): void => {
  fireEvent.change(screen.getByLabelText(strings.companyName), { target: { value: 'Example Company' } });
  fireEvent.change(screen.getByLabelText(strings.customerName), { target: { value: 'Buyer' } });
  fireEvent.change(screen.getByLabelText(strings.customerEmail), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(strings.tier), { target: { value: 'GOLD' } });
  fireEvent.change(screen.getByLabelText(strings.tenantId), { target: { value: 'TNT-CUSTOMER-1' } });
  fireEvent.change(screen.getByLabelText(strings.customerId), { target: { value: 'usr-customer-1' } });
  fireEvent.change(screen.getByLabelText(strings.paymentReference), { target: { value: 'INV-100' } });
};

const submitOtpRequest = (): void => {
  fireEvent.click(screen.getByLabelText(strings.paymentConfirmation));
  fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
};

const openOtpStep = async (): Promise<void> => {
  global.fetch = vi.fn().mockResolvedValue(mockResponse(200, {
    success: true, session_id: 'otp-session-1', otp_hint: '123456'
  }));
  render(<ProvisionSubscriptionModal {...defaultProps} />);
  fillDetails();
  submitOtpRequest();
  await screen.findByText(strings.otpTitle);
};

const validSubscription = {
  id: 'sub-1',
  tenant_id: 'TNT-CUSTOMER-1',
  customer_id: 'usr-customer-1',
  customer_email: 'buyer@example.com',
  customer_name: 'Buyer',
  company_name: 'Example Company',
  tier: 'GOLD',
  status: 'ACTIVE',
  commercial_status: 'COMPLETED',
  payment_confirmed: true,
  start_date: '2026-11-04T00:00:00.000Z',
  end_date: '2027-11-04T00:00:00.000Z',
  created_at: '2026-11-04T00:00:00.000Z',
  updated_at: '2026-11-04T00:00:00.000Z'
};

describe('ProvisionSubscriptionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing while closed', () => {
    const { container } = render(<ProvisionSubscriptionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders localized fields and closes on request', () => {
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    expect(screen.getByText(strings.detailsTitle)).toBeInTheDocument();
    for (const label of [strings.companyName, strings.customerName, strings.customerEmail, strings.tier, strings.tenantId, strings.customerId, strings.paymentReference]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByTitle(UI_STRINGS.common.close));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('requires payment confirmation and validates explicit tenant and customer details', async () => {
    global.fetch = vi.fn();
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent(strings.paymentConfirmationRequired);

    fillDetails('invalid-email');
    fireEvent.click(screen.getByLabelText(strings.paymentConfirmation));
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.validationFailure(
      UI_STRINGS.subscription.provisionModal.inputValidation.emailInvalid
    )));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows request-correlated service failures and logs connection failures', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockResponse(503, { success: false, message: 'OTP gateway is unavailable' }, 'otp-request-503'))
      .mockResolvedValueOnce(mockResponse(400, { success: false, message: 'Customer record was not found' }, 'otp-request-400'));
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fillDetails();
    submitOtpRequest();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      strings.otpRequestFailed(503, 'OTP gateway is unavailable', 'otp-request-503')
    ));
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      strings.otpRequestFailed(400, 'Customer record was not found', 'otp-request-400')
    ));

    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockRejectedValueOnce('Unclassified network failure');
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.networkFailure(
      strings.otpRequestOperation, 'Connection reset', 'request-client-1'
    )));
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.networkFailure(
      strings.otpRequestOperation, 'Unclassified network failure', 'request-client-1'
    )));
  });

  it('reports malformed OTP response JSON and schema mismatches', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ...mockResponse(200, {}), json: async () => { throw new SyntaxError('invalid JSON'); } })
      .mockResolvedValueOnce(mockResponse(200, { success: true, session_id: '' }));
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fillDetails();
    submitOtpRequest();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.invalidOtpResponse));
    fireEvent.submit(screen.getByTestId('request-admin-otp-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.invalidOtpResponse));
  });

  it('uses explicitly entered tenant and customer IDs when requesting OTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, {
      success: true, session_id: 'otp-session-1', otp_hint: '123456'
    }, ''));
    global.fetch = fetchMock;
    frontendLogger.clearHistory();
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('admin-token');
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fillDetails();
    submitOtpRequest();
    await screen.findByText(strings.otpTitle);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { customer_id: string };
    expect(requestBody.customer_id).toBe('usr-customer-1');
    expect(screen.getByText(strings.developmentOtpHint('123456'))).toBeInTheDocument();
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer admin-token');
    expect(frontendLogger.getHistory().at(-1)?.context?.requestId).toBe('request-client-1');
  });

  it('logs defensive form and payload schema failures before making requests', async () => {
    const invalidSchemaResult = {
      success: false,
      error: { issues: [{ message: UI_STRINGS.subscription.provisionModal.inputValidation.tenantIdRequired, path: ['tenant_id'] }] }
    } as never;
    vi.spyOn(provisionSubscriptionOtpRequestSchema, 'safeParse').mockReturnValue(invalidSchemaResult);
    global.fetch = vi.fn();
    render(<ProvisionSubscriptionModal {...defaultProps} />);
    fillDetails();
    submitOtpRequest();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.validationFailure(
      UI_STRINGS.subscription.provisionModal.inputValidation.tenantIdRequired
    )));
    expect(global.fetch).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    cleanup();
    await openOtpStep();
    vi.spyOn(provisionSubscriptionDetailsSchema, 'safeParse').mockReturnValue(invalidSchemaResult);
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.validationFailure(
      UI_STRINGS.subscription.provisionModal.inputValidation.tenantIdRequired
    )));
    expect(screen.getByText(strings.detailsTitle)).toBeInTheDocument();

    vi.restoreAllMocks();
    cleanup();
    await openOtpStep();
    vi.spyOn(provisionSubscriptionRequestSchema, 'safeParse').mockReturnValue(invalidSchemaResult);
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.validationFailure(
      UI_STRINGS.subscription.provisionModal.inputValidation.tenantIdRequired
    )));
  });

  it('rejects malformed OTP locally and can return to the details step', async () => {
    await openOtpStep();
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '12' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent(strings.otpValidationFailure(
      UI_STRINGS.subscription.provisionModal.inputValidation.otpInvalid
    ));
    fireEvent.click(screen.getByRole('button', { name: strings.back }));
    expect(screen.getByText(strings.detailsTitle)).toBeInTheDocument();
  });

  it('shows a detailed provisioning rejection and handles a missing server reason', async () => {
    await openOtpStep();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse(400, { success: false, message: 'Invalid OTP code entered' }, 'provision-400'))
      .mockResolvedValueOnce(mockResponse(409, { success: false }, 'provision-409'))
      .mockResolvedValueOnce(mockResponse(503, { success: false, message: 42 }, 'provision-503'));
    global.fetch = fetchMock;
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '111111' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      strings.provisioningFailed(400, 'Invalid OTP code entered', 'provision-400')
    ));
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      strings.provisioningFailed(409, strings.serverReasonUnavailable, 'provision-409')
    ));
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      strings.provisioningFailed(503, strings.serverReasonUnavailable, 'provision-503')
    ));
  });

  it('reports malformed provisioning JSON and invalid success payloads', async () => {
    await openOtpStep();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ...mockResponse(201, {}), json: async () => { throw new SyntaxError('invalid JSON'); } })
      .mockResolvedValueOnce(mockResponse(201, { success: true, subscription: { tenant_id: '' } }));
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.invalidProvisionResponse));
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.invalidProvisionResponse));
  });

  it('logs provisioning network failures with the correlation reference', async () => {
    await openOtpStep();
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Provisioning connection timed out'))
      .mockRejectedValueOnce('Unexpected transport failure');
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.networkFailure(
      strings.provisioningOperation, 'Provisioning connection timed out', 'request-client-1'
    )));
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(strings.networkFailure(
      strings.provisioningOperation, 'Unexpected transport failure', 'request-client-1'
    )));
  });

  it('completes provisioning and returns the validated subscription', async () => {
    await openOtpStep();
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(201, { success: true, subscription: validSubscription }, ''));
    global.fetch = fetchMock;
    fireEvent.change(screen.getByTestId('admin-otp-input'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByTestId('authorize-provision-btn').closest('form')!);
    await waitFor(() => expect(defaultProps.onProvisionSuccess).toHaveBeenCalledWith(validSubscription));
    expect(defaultProps.onClose).toHaveBeenCalled();
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(requestBody.tenant_id).toBe('TNT-CUSTOMER-1');
    expect(requestBody.customer_id).toBe('usr-customer-1');
  });
});
