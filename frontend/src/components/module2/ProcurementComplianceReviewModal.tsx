'use client';

import React, { useState, useEffect } from 'react';
import type {
  ProcurementComplianceReviewModalProps,
  ProcurementComplianceReviewPayload,
  ProcurementComplianceStatus
} from '../../types/module2ProcurementCompliance';
import { COMPLIANCE_UI_STRINGS } from '../../constants/module2ProcurementCompliance';

export const ProcurementComplianceReviewModal: React.FC<
  ProcurementComplianceReviewModalProps
> = ({ isOpen, exceptionItem, assessmentId: _assessmentId, onClose, onSubmitReview, isSubmitting }) => {
  const [status, setStatus] = useState<ProcurementComplianceStatus>('VERIFIED_EXCEPTION');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerRole, setReviewerRole] = useState<string>('');
  const [technicalJustification, setTechnicalJustification] = useState<string>('');
  const [correctiveActionPlan, setCorrectiveActionPlan] = useState<string>('');
  const [dismissalReason, setDismissalReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (exceptionItem) {
      setStatus(
        exceptionItem.reviewStatus === 'NOT_AN_EXCEPTION'
          ? 'NOT_AN_EXCEPTION'
          : exceptionItem.reviewStatus === 'VERIFIED_EXCEPTION'
          ? 'VERIFIED_EXCEPTION'
          : 'AWAITING_REVIEW'
      );
      setReviewerName('');
      setReviewerRole('');
      setTechnicalJustification('');
      setCorrectiveActionPlan('Commercial investigation and supplier rate audit');
      setDismissalReason('');
      setFormError(null);
    }
  }, [exceptionItem]);

  if (!isOpen || !exceptionItem) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setFormError('Please provide the authorised reviewer full name.');
      return;
    }
    if (!technicalJustification.trim()) {
      setFormError('Audit justification is mandatory to record an authorized decision.');
      return;
    }
    if (status === 'NOT_AN_EXCEPTION' && !dismissalReason.trim()) {
      setFormError('Dismissal reason is strictly mandatory when exception is dismissed.');
      return;
    }

    setFormError(null);
    const payload: ProcurementComplianceReviewPayload = {
      candidateId: exceptionItem.exceptionId,
      status: status as 'VERIFIED_EXCEPTION' | 'NOT_AN_EXCEPTION' | 'AWAITING_REVIEW',
      reviewerName: reviewerName.trim(),
      reviewerRole: reviewerRole.trim() || undefined,
      technicalJustification: technicalJustification.trim(),
      correctiveActionPlan: correctiveActionPlan.trim() || undefined,
      dismissalReason: status === 'NOT_AN_EXCEPTION' ? dismissalReason.trim() : undefined
    };

    try {
      await onSubmitReview(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record review decision. Please check authorization.';
      setFormError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {exceptionItem.exceptionId}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {COMPLIANCE_UI_STRINGS.MODAL_TITLE}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {COMPLIANCE_UI_STRINGS.MODAL_SUBTITLE}
            </p>
          </div>
          <button
            type="button"
            data-testid="compliance-modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
          >
            &times;
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Check Type:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{exceptionItem.checkTitle}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Supplier:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{exceptionItem.vendorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Spend Under Review:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                ₹{exceptionItem.expenditureUnderReviewCr.toFixed(2)} Cr
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Potential Exposure:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {exceptionItem.potentialFinancialExposureCr > 0
                  ? `₹${exceptionItem.potentialFinancialExposureCr.toFixed(4)} Cr`
                  : 'N/A (Non-Quantifiable)'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 italic">{exceptionItem.methodologyDescription}</p>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Supporting Transactions Evidence ({exceptionItem.supportingTransactions.length})
          </h3>
          <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-1.5 font-semibold">PO Number</th>
                  <th className="p-1.5 font-semibold">Date</th>
                  <th className="p-1.5 font-semibold">Material</th>
                  <th className="p-1.5 font-semibold text-right">Quantity</th>
                  <th className="p-1.5 font-semibold text-right">Unit Rate</th>
                  <th className="p-1.5 font-semibold text-right">Spend (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {exceptionItem.supportingTransactions.map((tx, idx) => (
                  <tr key={`${tx.poNumber}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-1.5 font-mono text-[11px]">{tx.poNumber}</td>
                    <td className="p-1.5 text-[11px]">{tx.poDate}</td>
                    <td className="p-1.5 text-[11px] truncate max-w-[180px]" title={tx.materialDesc}>
                      {tx.materialDesc}
                    </td>
                    <td className="p-1.5 text-right font-mono text-[11px]">
                      {tx.quantity} {tx.uom}
                    </td>
                    <td className="p-1.5 text-right font-mono text-[11px]">₹{tx.unitPrice.toFixed(2)}</td>
                    <td className="p-1.5 text-right font-mono text-[11px] font-semibold">
                      ₹{tx.totalSpendInr.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          {formError && (
            <div
              data-testid="compliance-modal-error"
              className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="comp-decision" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {COMPLIANCE_UI_STRINGS.FIELD_DECISION} *
              </label>
              <select
                id="comp-decision"
                data-testid="compliance-select-decision"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProcurementComplianceStatus)}
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="VERIFIED_EXCEPTION">VERIFIED_EXCEPTION (Valid Control Anomaly)</option>
                <option value="NOT_AN_EXCEPTION">NOT_AN_EXCEPTION (Dismiss After Review)</option>
                <option value="AWAITING_REVIEW">AWAITING_REVIEW (Pending Additional Info)</option>
              </select>
            </div>
            <div>
              <label htmlFor="comp-reviewer-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {COMPLIANCE_UI_STRINGS.FIELD_REVIEWER_NAME} *
              </label>
              <input
                id="comp-reviewer-name"
                type="text"
                data-testid="compliance-input-reviewer-name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. S. Sharma"
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="comp-reviewer-role" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {COMPLIANCE_UI_STRINGS.FIELD_REVIEWER_ROLE}
              </label>
              <input
                id="comp-reviewer-role"
                type="text"
                data-testid="compliance-input-reviewer-role"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                placeholder="e.g. Internal Audit Director"
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comp-justification" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {COMPLIANCE_UI_STRINGS.FIELD_JUSTIFICATION} *
            </label>
            <textarea
              id="comp-justification"
              data-testid="compliance-input-justification"
              value={technicalJustification}
              onChange={(e) => setTechnicalJustification(e.target.value)}
              rows={2}
              placeholder="Detail investigation findings, underlying PO reconciliation, and justification..."
              className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {status === 'NOT_AN_EXCEPTION' ? (
            <div>
              <label htmlFor="comp-dismissal-reason" className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                {COMPLIANCE_UI_STRINGS.FIELD_DISMISSAL_REASON} *
              </label>
              <textarea
                id="comp-dismissal-reason"
                data-testid="compliance-input-dismissal-reason"
                value={dismissalReason}
                onChange={(e) => setDismissalReason(e.target.value)}
                rows={2}
                placeholder="Explain why this transaction does not represent an anomaly or control breach..."
                className="w-full text-xs p-2 rounded border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="comp-action-plan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {COMPLIANCE_UI_STRINGS.FIELD_ACTION_PLAN}
              </label>
              <input
                id="comp-action-plan"
                type="text"
                data-testid="compliance-input-action-plan"
                value={correctiveActionPlan}
                onChange={(e) => setCorrectiveActionPlan(e.target.value)}
                placeholder="e.g. Correct PO reference; recover price differential; supplier renegotiation"
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {COMPLIANCE_UI_STRINGS.BTN_CANCEL}
            </button>
            <button
              type="submit"
              data-testid="compliance-submit-review-btn"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow disabled:opacity-50"
            >
              {isSubmitting ? COMPLIANCE_UI_STRINGS.SUBMITTING : COMPLIANCE_UI_STRINGS.BTN_SUBMIT_REVIEW}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
