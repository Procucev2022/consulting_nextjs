import React, { useState } from 'react';
import { UI_STRINGS } from '../../constants';

interface AssessmentApproveModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (analystEmail: string, comment: string) => void;
}

export const AssessmentApproveModal: React.FC<AssessmentApproveModalProps> = ({
  isOpen,
  isProcessing,
  onClose,
  onConfirm
}) => {
  const [email, setEmail] = useState('analyst@procucev.com');
  const [comment, setComment] = useState('Reconciled and certified for executive presentation.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onConfirm(email, comment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">{UI_STRINGS.ASSESSMENT.modalApprove.title}</h2>
        <p className="text-xs text-slate-400 mb-4">{UI_STRINGS.ASSESSMENT.modalApprove.subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {UI_STRINGS.ASSESSMENT.modalApprove.fieldAnalystEmail}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {UI_STRINGS.ASSESSMENT.modalApprove.fieldComment}
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              {UI_STRINGS.ASSESSMENT.modalApprove.btnCancel}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              {UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
