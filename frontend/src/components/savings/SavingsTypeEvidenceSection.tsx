'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck
} from 'lucide-react';
import type {
  SavingsTypeEvidenceSectionProps,
  CanonicalSavingsType,
  SavingsTypeEvidenceInventoryItem,
  DeclarativeDownloadPayload
} from '../../types';
import { UI_STRINGS, SAVINGS_TYPES_INVENTORY, SAVINGS_TYPE_FILENAMES } from '../../constants';
import { evidenceApi } from '../../utils/evidenceApi';
import { SavingsTypeDetailModal } from './SavingsTypeDetailModal';

export const SavingsTypeEvidenceSection: React.FC<SavingsTypeEvidenceSectionProps> = ({
  jobId = 'job-init-default-001',
  className = '',
  onViewDetails
}) => {
  const strings = UI_STRINGS.evidence.savingsTypes;
  const [selectedItem, setSelectedItem] = useState<SavingsTypeEvidenceInventoryItem | null>(null);
  const [downloadPayload, setDownloadPayload] = useState<DeclarativeDownloadPayload | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const triggerDownload = (url: string, filename: string) => {
    setDownloadPayload({ href: url, filename });
    setTimeout(() => {
      downloadLinkRef.current?.click();
    }, 50);
  };

  const handleDownloadComprehensive = () => {
    const url = evidenceApi.getWorkbookDownloadUrl(jobId, 'SAVINGS_ENGINE_EVIDENCE');
    triggerDownload(url, '04_Savings_Engine_Evidence.xlsx');
  };

  const handleDownloadSavingsType = (savingsType: CanonicalSavingsType) => {
    const url = evidenceApi.getSavingsTypeDownloadUrl(jobId, savingsType);
    const filename = SAVINGS_TYPE_FILENAMES[savingsType] || `${savingsType}_Evidence.xlsx`;
    triggerDownload(url, filename);
  };

  const handleOpenDetails = (item: SavingsTypeEvidenceInventoryItem) => {
    setSelectedItem(item);
    onViewDetails?.(item.savingsType);
  };

  return (
    <section
      data-testid="savings-type-evidence-section"
      className={`p-6 rounded-2xl bg-white border border-slate-200 glass-card space-y-6 ${className}`}
    >
      {/* Declarative virtual download anchor */}
      {downloadPayload && (
        <a
          ref={downloadLinkRef}
          href={downloadPayload.href}
          download={downloadPayload.filename}
          className="hidden"
          aria-hidden="true"
        >
          Download
        </a>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              MODULE 4 EVIDENCE
            </span>
            <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Three-Way Parity Guaranteed</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            {strings.titleSection}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {strings.subtitleSection}
          </p>
        </div>

        {/* Level 1: Comprehensive Workbook CTA */}
        <button
          type="button"
          data-testid="btn-download-savings-engine-evidence"
          onClick={handleDownloadComprehensive}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>{strings.btnDownloadComprehensive}</span>
        </button>
      </div>

      {/* Level 2: Per-Savings-Type Evidence Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            {strings.level2Title}
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            7 Canonical Types Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SAVINGS_TYPES_INVENTORY.map((item) => (
            <div
              key={item.savingsType}
              data-testid={`evidence-card-${item.savingsType}`}
              className="p-4 rounded-xl border border-slate-200/90 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span className="font-bold text-cyan-800 bg-cyan-100/70 px-1.5 py-0.2 rounded border border-cyan-200">
                    {item.initiativeId || item.savingsType}
                  </span>
                  <span>{item.sheetCount} sheets</span>
                </div>

                <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h5>

                <div className="mt-2 text-lg font-black font-mono text-emerald-600">
                  ₹{item.netAmountCr.toFixed(2)} Cr
                </div>

                {item.classificationNote && (
                  <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 italic" title={item.classificationNote}>
                    {item.classificationNote}
                  </p>
                )}
              </div>

              {/* Action Buttons: [View Details] [Evidence Excel ↓] */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  data-testid={`btn-view-details-${item.savingsType}`}
                  onClick={() => handleOpenDetails(item)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  {strings.btnViewDetails}
                </button>
                <button
                  type="button"
                  data-testid={`btn-download-evidence-${item.savingsType}`}
                  onClick={() => handleDownloadSavingsType(item.savingsType as CanonicalSavingsType)}
                  title={strings.tooltipEvidence}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-lg border border-emerald-300/80 transition-all active:scale-95"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                  <span>{strings.btnEvidenceExcelDownload}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <SavingsTypeDetailModal
        isOpen={selectedItem !== null}
        item={selectedItem}
        jobId={jobId}
        onClose={() => setSelectedItem(null)}
        onDownload={handleDownloadSavingsType}
      />
    </section>
  );
};
