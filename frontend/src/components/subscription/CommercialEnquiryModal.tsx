'use client';

/**
 * Commercial Enquiry / Upgrade Request Modal (Prompt 288 §13)
 * Offline commercial workflow dialog for requesting tier upgrades without online payment.
 */

import React, { useState } from 'react';
import { Mail, CheckCircle, X, ShieldCheck } from 'lucide-react';
import type { CommercialEnquiryModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const CommercialEnquiryModal: React.FC<CommercialEnquiryModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  customerName = '',
  customerEmail = '',
  companyName = ''
}) => {
  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [company, setCompany] = useState(companyName);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/upgrade/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          company_name: company,
          current_tier: currentTier,
          requested_tier: targetTier,
          requirements_note: notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit enquiry');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="commercial-enquiry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FBFE] backdrop-blur-md p-4"
    >
      <div
        data-testid="commercial-enquiry-modal"
        className="relative w-full max-w-lg bg-white border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {UI_STRINGS.subscription.commercialEnquiryTitle}
            </h3>
            <p className="text-xs text-slate-400">
              Upgrade request from {currentTier} to {targetTier} Tier
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div
            data-testid="enquiry-success"
            className="py-8 flex flex-col items-center text-center space-y-3"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Commercial Request Dispatched</h4>
            <p className="text-xs text-slate-300 max-w-sm">
              Our Procucev enterprise engagement director will contact you with the proposal and quotation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="enquiry-name" className="block text-[11px] font-bold text-slate-400 mb-1">Your Name</label>
                <input
                  id="enquiry-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFE] border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label htmlFor="enquiry-company" className="block text-[11px] font-bold text-slate-400 mb-1">Company Name</label>
                <input
                  id="enquiry-company"
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFE] border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="enquiry-email" className="block text-[11px] font-bold text-slate-400 mb-1">Corporate Email</label>
                <input
                  id="enquiry-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFE] border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label htmlFor="enquiry-phone" className="block text-[11px] font-bold text-slate-400 mb-1">Phone Number</label>
                <input
                  id="enquiry-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-3 py-2 bg-[#F8FBFE] border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="enquiry-notes" className="block text-[11px] font-bold text-slate-400 mb-1">Specific Requirements (Optional)</label>
              <textarea
                id="enquiry-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Number of spend categories, custom taxonomy, ERP source..."
                className="w-full px-3 py-2 bg-[#F8FBFE] border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8FBFE] border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Offline Commercial Model: Quotations and tax invoices are issued offline. No payment details required online.
              </span>
            </div>

            <button
              type="submit"
              data-testid="submit-commercial-enquiry-btn"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : UI_STRINGS.subscription.talkToProcucev}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
