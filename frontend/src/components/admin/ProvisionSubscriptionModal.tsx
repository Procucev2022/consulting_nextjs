'use client';

/**
 * Admin Provision Subscription Modal (Prompt 288 §15 & §16)
 */

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import type { ProvisionSubscriptionModalProps } from '../../types';

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
      setErrorMessage('Admin must confirm offline payment receipt.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/subscription/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId || `usr-${Date.now()}`,
          action: 'PROVISION'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to request Admin OTP');
      }
      setOtpSessionId(data.session_id);
      setOtpHint(data.otp_hint);
      setStep('OTP');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndProvision = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/subscription/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId || `TNT-${Date.now()}`,
          customer_id: customerId || `usr-${Date.now()}`,
          customer_email: customerEmail,
          customer_name: customerName,
          company_name: companyName,
          tier,
          commercial_status: 'PAYMENT_RECEIVED',
          payment_reference: paymentRef,
          payment_confirmed: true,
          otp_session_id: otpSessionId,
          otp_code: otpCode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Provisioning failed');
      }
      onProvisionSuccess(data.subscription);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="provision-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B33]/50 backdrop-blur-xs p-4">
      <div data-testid="provision-modal" className="relative w-full max-w-lg bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl p-6 sm:p-8">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#64748B] hover:text-[#0B1B33]" title="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-[#0284C7] flex items-center justify-center">
            {step === 'DETAILS' ? <ShieldCheck className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0B1B33]">
              {step === 'DETAILS' ? 'Provision Customer Subscription' : 'Admin OTP Verification'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {step === 'DETAILS' ? 'Controlled offline commercial setup' : 'Enter the 6-digit OTP sent to admin registered mobile'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'DETAILS' ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-company-name" className="block text-[11px] font-bold text-[#475569] mb-1">Company Name</label>
                <input id="provision-company-name" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-customer-name" className="block text-[11px] font-bold text-[#475569] mb-1">Customer Name</label>
                <input id="provision-customer-name" type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-customer-email" className="block text-[11px] font-bold text-[#475569] mb-1">Customer Email</label>
                <input id="provision-customer-email" type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-tier" className="block text-[11px] font-bold text-[#475569] mb-1">Subscription Tier</label>
                <select id="provision-tier" value={tier} onChange={(e) => setTier(e.target.value as 'SILVER' | 'GOLD')} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]">
                  <option value="SILVER">Silver — Assess</option>
                  <option value="GOLD">Gold — Optimize</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="provision-tenant-id" className="block text-[11px] font-bold text-[#475569] mb-1">Tenant ID</label>
                <input id="provision-tenant-id" type="text" required placeholder="TNT-..." value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
              <div>
                <label htmlFor="provision-customer-id" className="block text-[11px] font-bold text-[#475569] mb-1">Customer ID</label>
                <input id="provision-customer-id" type="text" required placeholder="usr-..." value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
              </div>
            </div>

            <div>
              <label htmlFor="provision-payment-ref" className="block text-[11px] font-bold text-[#475569] mb-1">Offline Invoice / Payment Reference</label>
              <input id="provision-payment-ref" type="text" required placeholder="INV-2026-..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#DCE7F5] rounded-lg text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7]" />
            </div>

            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#DCE7F5] flex items-center gap-3">
              <input type="checkbox" id="payment-confirmed-check" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="w-4 h-4 rounded text-[#0284C7] focus:ring-0" />
              <label htmlFor="payment-confirmed-check" className="text-xs text-[#475569] font-medium cursor-pointer">
                I certify that offline payment/quotation has been verified by the commercial desk.
              </label>
            </div>

            <button
              type="submit"
              data-testid="request-admin-otp-btn"
              disabled={isSubmitting || !paymentConfirmed}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Requesting OTP...' : 'Proceed to Admin OTP Authorization'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndProvision} className="space-y-4">
            <div>
              <label htmlFor="admin-otp-input" className="block text-xs font-bold text-[#475569] mb-1.5">
                Admin 6-Digit Verification OTP
              </label>
              <input
                id="admin-otp-input"
                data-testid="admin-otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-3 bg-white border border-[#DCE7F5] rounded-xl text-center font-mono font-bold tracking-widest text-[#0284C7] text-lg focus:outline-none focus:border-[#0284C7]"
              />
              {otpHint && (
                <p className="text-[11px] text-[#64748B] mt-1">Dev Hint: {otpHint}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="w-1/3 py-2.5 px-4 rounded-xl border border-[#DCE7F5] bg-white text-[#475569] hover:bg-[#EEF7FF] text-xs font-bold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                data-testid="authorize-provision-btn"
                disabled={isSubmitting || otpCode.length !== 6}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Authorizing...' : 'Authorize & Provision'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
