'use client';

/**
 * Customer Report Acknowledgement & Correction Request Section (Prompt 302, Sections 24 & 25)
 */

import React, { useState } from 'react';
import { CheckCircle2, MessageSquarePlus, ShieldCheck, X, FileText, Send } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import { orchestrationApi } from '../../utils/orchestrationApi';
import type { CustomerReportAcknowledgement } from '../../types/analysisOrchestration';

export interface ReportAcknowledgementSectionProps {
  jobId: string;
  reportVersionId: string;
  initialAcknowledgement?: CustomerReportAcknowledgement;
  onAcknowledgementSuccess?: (ack: CustomerReportAcknowledgement) => void;
}

export function ReportAcknowledgementSection({
  jobId,
  reportVersionId,
  initialAcknowledgement,
  onAcknowledgementSuccess
}: ReportAcknowledgementSectionProps): React.ReactElement {
  const [acknowledgement, setAcknowledgement] = useState<CustomerReportAcknowledgement | undefined>(
    initialAcknowledgement
  );
  const [submittingAck, setSubmittingAck] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);

  // Correction Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [category, setCategory] = useState('Data Classification');
  const [description, setDescription] = useState('');
  const [supportingFile, setSupportingFile] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const handleAcknowledge = async (): Promise<void> => {
    try {
      setSubmittingAck(true);
      setAckError(null);
      const res = await orchestrationApi.acknowledgeReport(jobId, reportVersionId);
      if (res.success && res.acknowledgement) {
        setAcknowledgement(res.acknowledgement);
        if (onAcknowledgementSuccess) onAcknowledgementSuccess(res.acknowledgement);
      } else {
        setAckError(res.message || 'Failed to record acknowledgement');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error acknowledging report';
      setAckError(msg);
    } finally {
      setSubmittingAck(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!description.trim()) {
      setCorrectionError('Please provide specific observations or requirements for correction.');
      return;
    }

    try {
      setSubmittingCorrection(true);
      setCorrectionError(null);
      setCorrectionSuccess(null);
      const res = await orchestrationApi.requestCorrection(jobId, {
        category,
        description,
        supportingFileName: supportingFile || undefined
      });

      if (res.success) {
        setCorrectionSuccess('Your correction request has been transmitted to Procucev Operations.');
        setDescription('');
        setSupportingFile('');
        setTimeout(() => {
          setIsCorrectionModalOpen(false);
          setCorrectionSuccess(null);
        }, 2000);
      } else {
        setCorrectionError(res.message || 'Failed to submit correction request');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting correction';
      setCorrectionError(msg);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  return (
    <div
      data-testid="report-acknowledgement-section"
      className="bg-white rounded-xl border border-[#DCE7F5] shadow-xs p-6 my-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEF2F6] pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#0B1B33] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0284C7]" />
            {UI_STRINGS.orchestration.acknowledgementTitle}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            {UI_STRINGS.orchestration.acknowledgementSubtitle}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-md">
            {reportVersionId}
          </span>
        </div>
      </div>

      {ackError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {ackError}
        </div>
      )}

      {/* Already Acknowledged Banner */}
      {acknowledgement ? (
        <div className="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-emerald-800 block">
              {UI_STRINGS.orchestration.acknowledgementSuccess}
            </span>
            <span className="text-emerald-700">
              Acknowledged by: <strong>{acknowledgement.userName}</strong> on{' '}
              {new Date(acknowledgement.acknowledgedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={submittingAck}
            className="px-5 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>
              {submittingAck ? 'Recording...' : UI_STRINGS.orchestration.btnAcknowledgeReport}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCorrectionModalOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-[#DCE7F5] bg-white hover:bg-[#F8FBFE] text-[#0B1B33] text-xs font-bold transition-all flex items-center gap-2"
          >
            <MessageSquarePlus size={16} className="text-[#0284C7]" />
            <span>{UI_STRINGS.orchestration.btnRequestCorrection}</span>
          </button>
        </div>
      )}

      {/* Customer Correction Request Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1B33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#DCE7F5] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#F8FBFE] border-b border-[#DCE7F5] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-[#0B1B33]">
                  {UI_STRINGS.orchestration.correctionModalTitle}
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {UI_STRINGS.orchestration.correctionModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1 rounded-md text-[#64748B] hover:text-[#0B1B33]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="p-5 space-y-4 text-xs">
              {correctionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {correctionError}
                </div>
              )}
              {correctionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                  {correctionSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold text-[#0B1B33] mb-1.5">
                  {UI_STRINGS.orchestration.fieldCorrectionCategory}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] font-medium focus:ring-2 focus:ring-[#0284C7]/20 focus:outline-hidden"
                >
                  <option value="Data Classification">Commodity / UNSPSC Classification</option>
                  <option value="Supplier Mapping">Supplier / Vendor Mapping</option>
                  <option value="Material Description">Material Description & Specifications</option>
                  <option value="Quantity & Pricing">Quantity / Price Normalization</option>
                  <option value="Currency Conversion">Historical Currency Exchange Rate</option>
                  <option value="Other">Other / General Clarification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B1B33] mb-1.5">
                  {UI_STRINGS.orchestration.fieldDescription}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="State the observed variance, affected items, or required revision in detail..."
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] focus:ring-2 focus:ring-[#0284C7]/20 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B1B33] mb-1.5">
                  {UI_STRINGS.orchestration.fieldSupportingFile}
                </label>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#64748B]" />
                  <input
                    type="text"
                    value={supportingFile}
                    onChange={(e) => setSupportingFile(e.target.value)}
                    placeholder="e.g. Revised_Master_Data_Oct2026.xlsx"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] focus:ring-2 focus:ring-[#0284C7]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EEF2F6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#DCE7F5] text-[#64748B] hover:text-[#0B1B33] font-bold"
                >
                  {UI_STRINGS.orchestration.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>
                    {submittingCorrection
                      ? 'Submitting...'
                      : UI_STRINGS.orchestration.btnSubmitCorrection}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
