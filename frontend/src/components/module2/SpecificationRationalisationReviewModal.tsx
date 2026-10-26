'use client';

import React, { useState, useEffect } from 'react';
import type {
  SpecificationRationalisationReviewModalProps,
  SpecificationRationalisationReviewPayload,
  SpecificationRationalisationReviewStatus
} from '../../types/module2SpecificationRationalisation';
import { SPECIFICATION_UI_STRINGS } from '../../constants/module2SpecificationRationalisation';

export const SpecificationRationalisationReviewModal: React.FC<
  SpecificationRationalisationReviewModalProps
> = ({ isOpen, candidate, assessmentId, onClose, onSubmitReview, isSubmitting }) => {
  const [status, setStatus] = useState<SpecificationRationalisationReviewStatus>('TECHNICALLY_VERIFIED');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerRole, setReviewerRole] = useState<string>('');
  const [technicalJustification, setTechnicalJustification] = useState<string>('');
  const [proposedStandard, setProposedStandard] = useState<string>('');
  const [applicationScope, setApplicationScope] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (candidate) {
      setStatus(
        candidate.reviewStatus === 'REJECTED'
          ? 'REJECTED'
          : candidate.reviewStatus === 'TECHNICALLY_VERIFIED'
          ? 'TECHNICALLY_VERIFIED'
          : 'AWAITING_TECHNICAL_REVIEW'
      );
      setReviewerName('');
      setReviewerRole('');
      setTechnicalJustification('');
      setProposedStandard(candidate.primaryItem.description);
      setApplicationScope('General production facilities across operating plants');
      setRejectionReason('');
      setFormError(null);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setFormError('Please provide the authorised reviewer full name.');
      return;
    }
    if (!technicalJustification.trim()) {
      setFormError('Technical justification is mandatory to record an authorised decision.');
      return;
    }
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setFormError('Rejection reason must be recorded when candidate is rejected.');
      return;
    }

    setFormError(null);
    const payload: SpecificationRationalisationReviewPayload = {
      assessmentId,
      candidateId: candidate.candidateId,
      status: status as 'TECHNICALLY_VERIFIED' | 'REJECTED' | 'AWAITING_TECHNICAL_REVIEW',
      reviewerName: reviewerName.trim(),
      reviewerRole: reviewerRole.trim() || undefined,
      technicalJustification: technicalJustification.trim(),
      proposedStandard: proposedStandard.trim() || undefined,
      applicationScope: applicationScope.trim() || undefined,
      rejectionReason: status === 'REJECTED' ? rejectionReason.trim() : undefined
    };

    await onSubmitReview(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {candidate.candidateId}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {SPECIFICATION_UI_STRINGS.MODAL_TITLE}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {SPECIFICATION_UI_STRINGS.MODAL_SUBTITLE}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
          >
            &times;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Primary Material Item</span>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{candidate.primaryItem.description}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">Code: {candidate.primaryItem.code || 'N/A'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Plant: {candidate.primaryItem.plant || 'All'} | Spend: ₹{(candidate.primaryItem.totalSpendInr / 100000).toFixed(2)} L | Qty: {candidate.primaryItem.totalQuantity} {candidate.primaryItem.uom}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Comparison Material Item</span>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{candidate.comparisonItem.description}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">Code: {candidate.comparisonItem.code || 'N/A'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Plant: {candidate.comparisonItem.plant || 'All'} | Spend: ₹{(candidate.comparisonItem.totalSpendInr / 100000).toFixed(2)} L | Qty: {candidate.comparisonItem.totalQuantity} {candidate.comparisonItem.uom}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Technical Attribute Comparison Matrix
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2 border-b">{SPECIFICATION_UI_STRINGS.ATTR_NAME}</th>
                  <th className="p-2 border-b">{SPECIFICATION_UI_STRINGS.ATTR_PRIMARY}</th>
                  <th className="p-2 border-b">{SPECIFICATION_UI_STRINGS.ATTR_COMPARISON}</th>
                  <th className="p-2 border-b">{SPECIFICATION_UI_STRINGS.ATTR_STATUS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {candidate.technicalAttributes.map((attr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 font-medium">
                      {attr.attributeName}
                      {attr.isCritical && (
                        <span className="ml-1 text-[10px] text-amber-600 font-semibold">(Critical)</span>
                      )}
                    </td>
                    <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{attr.sourceValue || 'Missing'}</td>
                    <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{attr.candidateValue || 'Missing'}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        attr.matchStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : attr.matchStatus === 'DIFFERENT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {attr.matchStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {candidate.missingAttributesDisclosed.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
            <span className="font-bold">Missing Technical Data Disclosed:</span>
            <ul className="list-disc list-inside mt-1">
              {candidate.missingAttributesDisclosed.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Record Authorised Engineering Decision
          </h3>

          {formError && (
            <div className="p-2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {SPECIFICATION_UI_STRINGS.FIELD_REVIEWER_NAME} *
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Dr. A. Sharma (Lead Process Engineer)"
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {SPECIFICATION_UI_STRINGS.FIELD_REVIEWER_ROLE}
              </label>
              <input
                type="text"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                placeholder="e.g. Chief Metallurgist / Plant Technical Head"
                className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {SPECIFICATION_UI_STRINGS.FIELD_DECISION} *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SpecificationRationalisationReviewStatus)}
              className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="TECHNICALLY_VERIFIED">TECHNICALLY_VERIFIED — Approved Specification Equivalence</option>
              <option value="AWAITING_TECHNICAL_REVIEW">AWAITING_TECHNICAL_REVIEW — Requires Additional Trials</option>
              <option value="REJECTED">REJECTED — Incompatible Specifications</option>
            </select>
          </div>

          {status === 'REJECTED' && (
            <div>
              <label className="block text-xs font-medium text-rose-700 dark:text-rose-400 mb-1">
                {SPECIFICATION_UI_STRINGS.FIELD_REJECTION_REASON} *
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for technical rejection (e.g. High thermal tolerance required at Plant B)"
                className="w-full text-xs p-2 rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {SPECIFICATION_UI_STRINGS.FIELD_JUSTIFICATION} *
            </label>
            <textarea
              rows={2}
              value={technicalJustification}
              onChange={(e) => setTechnicalJustification(e.target.value)}
              placeholder="State engineering basis for equivalence, tolerance variance evaluation, or risk assessment"
              className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {SPECIFICATION_UI_STRINGS.BTN_CANCEL}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? SPECIFICATION_UI_STRINGS.SUBMITTING : SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
