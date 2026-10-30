'use client';

import React, { useState, useEffect } from 'react';
import type { NewAssessmentModalProps, NdaStatus } from '../../types';
import { UI_STRINGS } from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import frontendLogger from '../../utils/logger';

export const NewAssessmentModal: React.FC<NewAssessmentModalProps> = ({
  isOpen,
  preselectedCustomer,
  onClose,
  onCreated
}) => {
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [industry, setIndustry] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [analystEmail, setAnalystEmail] = useState('analyst@procucev.com');
  const [currency, setCurrency] = useState('INR (₹ Cr)');
  const [dataReceivedDate, setDataReceivedDate] = useState('');
  const [ndaStatus, setNdaStatus] = useState<NdaStatus>('SIGNED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
      setCustomerName(preselectedCustomer.customerName);
      setIndustry(preselectedCustomer.industry);
      setBusinessUnit(preselectedCustomer.businessUnit || '');
    } else {
      setCustomerId(undefined);
      setCustomerName('');
      setIndustry('');
      setBusinessUnit('');
    }
    setPeriodStart('');
    setPeriodEnd('');
    setNotes('');
    setErrorMsg(null);
  }, [preselectedCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !industry.trim() || !periodStart.trim() || !periodEnd.trim()) {
      setErrorMsg('Customer name, industry, and assessment period dates are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      frontendLogger.info('Submitting new assessment modal form', { customerName, customerId });
      const created = await assessmentApiClient.createAssessment({
        customerId,
        customerName: customerName.trim(),
        businessUnit: businessUnit.trim() || undefined,
        industry: industry.trim(),
        assessmentPeriodStart: periodStart.trim(),
        assessmentPeriodEnd: periodEnd.trim(),
        assignedAnalyst: analystEmail.trim(),
        assessmentOwner: analystEmail.trim(),
        currency: currency.trim() || undefined,
        dataReceivedDate: dataReceivedDate.trim() || undefined,
        ndaStatus,
        notes: notes.trim() || undefined
      });
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : UI_STRINGS.ASSESSMENT.errors.createFailed;
      frontendLogger.error('Failed to create assessment in modal', { error: msg });
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-assessment-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 id="new-assessment-modal-title" className="text-xl font-bold text-white tracking-wide">
              {UI_STRINGS.ASSESSMENT.modalNew.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {customerId ? `Linked to Customer: ${customerId} — ` : ''}
              {UI_STRINGS.ASSESSMENT.modalNew.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold px-2 py-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldCustomer}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={UI_STRINGS.ASSESSMENT.modalNew.fieldCustomerPlaceholder}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldBusinessUnit}
              </label>
              <input
                type="text"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder={UI_STRINGS.ASSESSMENT.modalNew.fieldBusinessUnitPlaceholder}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldIndustry}
              </label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={UI_STRINGS.ASSESSMENT.modalNew.fieldIndustryPlaceholder}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldNdaStatus}
              </label>
              <select
                value={ndaStatus}
                onChange={(e) => setNdaStatus(e.target.value as NdaStatus)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="NOT_REQUESTED">Not Requested</option>
                <option value="SENT">Sent to Customer</option>
                <option value="SIGNED">Signed & Executed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodStart}
              </label>
              <input
                type="text"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                placeholder={UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodStartPlaceholder}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodEnd}
              </label>
              <input
                type="text"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                placeholder={UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodEndPlaceholder}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldAnalyst}
              </label>
              <input
                type="email"
                required
                value={analystEmail}
                onChange={(e) => setAnalystEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldCurrency}
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {UI_STRINGS.ASSESSMENT.modalNew.fieldDataReceived}
              </label>
              <input
                type="date"
                value={dataReceivedDate}
                onChange={(e) => setDataReceivedDate(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              {UI_STRINGS.ASSESSMENT.modalNew.fieldNotes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal scope or ingestion guidance..."
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              {UI_STRINGS.ASSESSMENT.modalNew.btnCancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-950/40"
            >
              {isSubmitting ? 'Creating...' : UI_STRINGS.ASSESSMENT.modalNew.btnSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAssessmentModal;
