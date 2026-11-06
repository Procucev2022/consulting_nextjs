'use client';

import React, { useState } from 'react';
import { AlertTriangle, KeyRound, ShieldCheck, X } from 'lucide-react';
import { API_REQUEST_ID_HEADER } from '../../constants/app';
import {
  provisionSubscriptionDetailsSchema,
  provisionSubscriptionOtpRequestSchema,
  provisionSubscriptionOtpResponseSchema,
  provisionSubscriptionOtpSchema,
  provisionSubscriptionRequestSchema,
  provisionSubscriptionResponseSchema
} from '../../constants/validation';
import { UI_STRINGS } from '../../constants';
import type { ProvisionSubscriptionModalProps } from '../../types';
import { createClientRequestId } from '../../utils/requestId';
import { apiFetch } from '../../utils/apiFetch';
import { getApiBaseUrl } from '../../utils/apiBase';
import { authApiClient } from '../../utils/authApi';
import frontendLogger from '../../utils/logger';

const adminRequestHeaders = (requestId: string): Record<string, string> => {
  const token = authApiClient.getStoredToken();
  return {
    'Content-Type': 'application/json',
    [API_REQUEST_ID_HEADER]: requestId,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const responseErrorDetail = (body: unknown): string => {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return UI_STRINGS.subscription.provisionModal.serverReasonUnavailable;
  }
  return typeof body.message === 'string' && body.message.trim()
    ? body.message
    : UI_STRINGS.subscription.provisionModal.serverReasonUnavailable;
};

export const ProvisionSubscriptionModal: React.FC<ProvisionSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onProvisionSuccess
}) => {
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [tenantId, setTenantId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tier, setTier] = useState<'SILVER' | 'GOLD'>('SILVER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!paymentConfirmed) {
      setErrorMessage(UI_STRINGS.subscription.provisionModal.paymentConfirmationRequired);
      frontendLogger.warn('Subscription provisioning OTP request blocked because payment was not confirmed', {
        action: 'subscription.provision.otp.validate'
      });
      return;
    }

    const details = provisionSubscriptionDetailsSchema.safeParse({
      tenantId, customerId, customerEmail, customerName, companyName, tier, paymentReference: paymentRef
    });
    if (!details.success) {
      const detail = details.error.issues.map((issue) => issue.message).join(' ');
      setErrorMessage(UI_STRINGS.subscription.provisionModal.validationFailure(detail));
      frontendLogger.warn('Subscription provisioning details failed validation', {
        action: 'subscription.provision.details.validate',
        fields: details.error.issues.map((issue) => issue.path.join('.'))
      });
      return;
    }

    const request = provisionSubscriptionOtpRequestSchema.safeParse({
      customer_id: details.data.customerId,
      action: 'PROVISION'
    });
    if (!request.success) {
      const detail = request.error.issues.map((issue) => issue.message).join(' ');
      setErrorMessage(UI_STRINGS.subscription.provisionModal.validationFailure(detail));
      frontendLogger.warn('Subscription OTP request payload failed validation', {
        action: 'subscription.provision.otp.payload.validate',
        fields: request.error.issues.map((issue) => issue.path.join('.'))
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const requestId = createClientRequestId();
    try {
      const res = await apiFetch(`${getApiBaseUrl()}/api/subscription/admin/request-otp`, {
        method: 'POST',
        headers: adminRequestHeaders(requestId),
        body: JSON.stringify(request.data)
      });
      const correlationId = res.headers.get(API_REQUEST_ID_HEADER) || requestId;
      let body: unknown;
      try {
        body = await res.json();
      } catch (error: unknown) {
        frontendLogger.error('Subscription OTP response could not be parsed as JSON', {
          action: 'subscription.provision.otp.response.parse', statusCode: res.status, requestId: correlationId
        }, error);
        setErrorMessage(UI_STRINGS.subscription.provisionModal.invalidOtpResponse);
        return;
      }

      if (!res.ok) {
        const detail = responseErrorDetail(body);
        const message = UI_STRINGS.subscription.provisionModal.otpRequestFailed(res.status, detail, correlationId);
        setErrorMessage(message);
        const context = {
          action: 'subscription.provision.otp.request', statusCode: res.status, requestId: correlationId,
          customerId: details.data.customerId
        };
        if (res.status >= 500) frontendLogger.error('Administrator OTP request failed', context, new Error(detail));
        else frontendLogger.warn('Administrator OTP request was rejected', context, new Error(detail));
        return;
      }

      const parsed = provisionSubscriptionOtpResponseSchema.safeParse(body);
      if (!parsed.success) {
        frontendLogger.error('Subscription OTP response did not match its schema', {
          action: 'subscription.provision.otp.response.validate', statusCode: res.status,
          requestId: correlationId, fields: parsed.error.issues.map((issue) => issue.path.join('.'))
        }, parsed.error);
        setErrorMessage(UI_STRINGS.subscription.provisionModal.invalidOtpResponse);
        return;
      }
      setOtpSessionId(parsed.data.session_id);
      setOtpHint(parsed.data.otp_hint);
      setStep('OTP');
      frontendLogger.info('Administrator OTP session created for subscription provisioning', {
        action: 'subscription.provision.otp.created', statusCode: res.status, requestId: correlationId,
        customerId: details.data.customerId
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setErrorMessage(UI_STRINGS.subscription.provisionModal.networkFailure(
        UI_STRINGS.subscription.provisionModal.otpRequestOperation, detail, requestId
      ));
      frontendLogger.error('Administrator OTP request could not reach the subscription service', {
        action: 'subscription.provision.otp.request', statusCode: 0, requestId,
        customerId: details.data.customerId
      }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndProvision = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const otp = provisionSubscriptionOtpSchema.safeParse({ otpSessionId, otpCode });
    if (!otp.success) {
      const detail = otp.error.issues.map((issue) => issue.message).join(' ');
      setErrorMessage(UI_STRINGS.subscription.provisionModal.otpValidationFailure(detail));
      frontendLogger.warn('Subscription provisioning OTP failed validation', {
        action: 'subscription.provision.otp.validate',
        fields: otp.error.issues.map((issue) => issue.path.join('.'))
      });
      return;
    }

    const details = provisionSubscriptionDetailsSchema.safeParse({
      tenantId, customerId, customerEmail, customerName, companyName, tier, paymentReference: paymentRef
    });
    if (!details.success) {
      const detail = details.error.issues.map((issue) => issue.message).join(' ');
      setErrorMessage(UI_STRINGS.subscription.provisionModal.validationFailure(detail));
      frontendLogger.warn('Subscription provisioning details failed validation before OTP submission', {
        action: 'subscription.provision.details.validate',
        fields: details.error.issues.map((issue) => issue.path.join('.'))
      });
      setStep('DETAILS');
      return;
    }

    const request = provisionSubscriptionRequestSchema.safeParse({
      tenant_id: details.data.tenantId,
      customer_id: details.data.customerId,
      customer_email: details.data.customerEmail,
      customer_name: details.data.customerName,
      company_name: details.data.companyName,
      tier: details.data.tier,
      commercial_status: 'PAYMENT_RECEIVED',
      payment_reference: details.data.paymentReference,
      payment_confirmed: paymentConfirmed,
      otp_session_id: otp.data.otpSessionId,
      otp_code: otp.data.otpCode
    });
    if (!request.success) {
      const detail = request.error.issues.map((issue) => issue.message).join(' ');
      setErrorMessage(UI_STRINGS.subscription.provisionModal.validationFailure(detail));
      frontendLogger.warn('Subscription provisioning request payload failed validation', {
        action: 'subscription.provision.payload.validate',
        fields: request.error.issues.map((issue) => issue.path.join('.'))
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const requestId = createClientRequestId();
    try {
      const res = await apiFetch(`${getApiBaseUrl()}/api/subscription/admin/provision`, {
        method: 'POST',
        headers: adminRequestHeaders(requestId),
        body: JSON.stringify(request.data)
      });
      const correlationId = res.headers.get(API_REQUEST_ID_HEADER) || requestId;
      let body: unknown;
      try {
        body = await res.json();
      } catch (error: unknown) {
        frontendLogger.error('Subscription provisioning response could not be parsed as JSON', {
          action: 'subscription.provision.response.parse', statusCode: res.status, requestId: correlationId,
          tenantId: details.data.tenantId, customerId: details.data.customerId
        }, error);
        setErrorMessage(UI_STRINGS.subscription.provisionModal.invalidProvisionResponse);
        return;
      }

      if (!res.ok) {
        const detail = responseErrorDetail(body);
        const message = UI_STRINGS.subscription.provisionModal.provisioningFailed(res.status, detail, correlationId);
        setErrorMessage(message);
        const context = {
          action: 'subscription.provision.commit', statusCode: res.status, requestId: correlationId,
          tenantId: details.data.tenantId, customerId: details.data.customerId
        };
        if (res.status >= 500) frontendLogger.error('Customer subscription provisioning failed', context, new Error(detail));
        else frontendLogger.warn('Customer subscription provisioning was rejected', context, new Error(detail));
        return;
      }

      const parsed = provisionSubscriptionResponseSchema.safeParse(body);
      if (!parsed.success) {
        frontendLogger.error('Subscription provisioning response did not match its schema', {
          action: 'subscription.provision.response.validate', statusCode: res.status,
          requestId: correlationId, tenantId: details.data.tenantId, customerId: details.data.customerId,
          fields: parsed.error.issues.map((issue) => issue.path.join('.'))
        }, parsed.error);
        setErrorMessage(UI_STRINGS.subscription.provisionModal.invalidProvisionResponse);
        return;
      }

      onProvisionSuccess(parsed.data.subscription);
      frontendLogger.info('Customer subscription provisioned from administrator workflow', {
        action: 'subscription.provision.commit', statusCode: res.status, requestId: correlationId,
        subscriptionId: parsed.data.subscription.id, tenantId: parsed.data.subscription.tenant_id,
        customerId: parsed.data.subscription.customer_id
      });
      onClose();
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setErrorMessage(UI_STRINGS.subscription.provisionModal.networkFailure(
        UI_STRINGS.subscription.provisionModal.provisioningOperation, detail, requestId
      ));
      frontendLogger.error('Customer subscription provisioning could not reach the subscription service', {
        action: 'subscription.provision.commit', statusCode: 0, requestId,
        tenantId: details.data.tenantId, customerId: details.data.customerId
      }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const strings = UI_STRINGS.subscription.provisionModal;
  return (
    <div data-testid="provision-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B33]/50 backdrop-blur-xs p-4">
      <div data-testid="provision-modal" className="relative w-full max-w-lg bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl p-6 sm:p-8">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#64748B] hover:text-[#0B1B33]" title={strings.close} aria-label={strings.close}>
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-[#0284C7] flex items-center justify-center">
            {step === 'DETAILS' ? <ShieldCheck className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0B1B33]">
              {step === 'DETAILS' ? strings.detailsTitle : strings.otpTitle}
            </h3>
            <p className="text-xs text-[#64748B]">
              {step === 'DETAILS' ? strings.detailsSubtitle : UI_STRINGS.subscription.adminOtpDelivery}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'DETAILS' ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-company-name" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.companyName}</label>
                <input id="provision-company-name" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-customer-name" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.customerName}</label>
                <input id="provision-customer-name" type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-customer-email" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.customerEmail}</label>
                <input id="provision-customer-email" type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-tier" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.tier}</label>
                <select id="provision-tier" value={tier} onChange={(e) => setTier(e.target.value as 'SILVER' | 'GOLD')} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]">
                  <option value="SILVER">{strings.silverTierOption}</option>
                  <option value="GOLD">{strings.goldTierOption}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-tenant-id" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.tenantId}</label>
                <input id="provision-tenant-id" type="text" required placeholder={strings.tenantIdPlaceholder} value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-customer-id" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.customerId}</label>
                <input id="provision-customer-id" type="text" required placeholder={strings.customerIdPlaceholder} value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
            </div>

            <div>
              <label htmlFor="provision-payment-ref" className="block text-[11px] font-bold text-[#475569] mb-1">{strings.paymentReference}</label>
              <input id="provision-payment-ref" type="text" required placeholder={strings.paymentReferencePlaceholder} value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
            </div>

            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#DCE7F5] flex items-center gap-3">
              <input type="checkbox" id="payment-confirmed-check" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="w-4 h-4 rounded text-[#0284C7] focus:ring-0" />
              <label htmlFor="payment-confirmed-check" className="text-xs text-[#475569] font-medium cursor-pointer">{strings.paymentConfirmation}</label>
            </div>

            <button type="submit" data-testid="request-admin-otp-btn" disabled={isSubmitting || !paymentConfirmed} className="w-full py-2.5 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50">
              {isSubmitting ? strings.requestingOtp : strings.requestOtp}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndProvision} className="space-y-4">
            <div>
              <label htmlFor="admin-otp-input" className="block text-xs font-bold text-[#475569] mb-1.5">{UI_STRINGS.subscription.adminOtpCodeLabel}</label>
              <input id="admin-otp-input" data-testid="admin-otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder={strings.otpPlaceholder} className="w-full px-4 py-3 bg-white border border-[#DCE7F5] rounded-xl text-center font-mono font-bold tracking-widest text-[#0284C7] text-lg focus:outline-none focus:border-[#0284C7]" />
              {otpHint && <p className="text-[11px] text-[#64748B] mt-1">{strings.developmentOtpHint(otpHint)}</p>}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('DETAILS')} className="w-1/3 py-2.5 px-4 rounded-xl border border-[#DCE7F5] bg-white text-[#475569] hover:bg-[#EEF7FF] text-xs font-bold transition-colors">{strings.back}</button>
              <button type="submit" data-testid="authorize-provision-btn" disabled={isSubmitting || otpCode.length !== 6} className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors">
                {isSubmitting ? strings.authorizing : strings.authorize}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
