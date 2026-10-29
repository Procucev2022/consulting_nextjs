'use client';

/**
 * Evidence Workbooks Panel Component (Prompt 305)
 * Displays available forensic evidence workbooks, download controls, and automated parity audit results.
 * Downloads are fetched with the Bearer token; unavailable workbooks are shown with their reason.
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { EVIDENCE_INVENTORY } from '../../../constants/evidenceWorkbook';
import { EVIDENCE_DOWNLOAD_KEYS, buildPackageFilename } from '../../../constants/evidenceDownload';
import { useEvidenceFileDownload } from '../../../hooks/useEvidenceFileDownload';
import { evidenceApi } from '../../../utils/evidenceApi';
import type {
  EvidenceInventoryItem,
  ParityValidationSummary
} from '../../../types/evidenceWorkbook';

export interface EvidenceWorkbooksPanelProps {
  jobId: string;
  customerName: string;
  totalSpendCr: number;
}

export const EvidenceWorkbooksPanel: React.FC<EvidenceWorkbooksPanelProps> = ({
  jobId,
  customerName,
  totalSpendCr
}) => {
  const panel = UI_STRINGS.evidence.panel;
  const [items, setItems] = useState<EvidenceInventoryItem[]>(EVIDENCE_INVENTORY);
  const [parity, setParity] = useState<ParityValidationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { downloadPayload, downloadLinkRef, downloadError, pendingKey, requestDownload } = useEvidenceFileDownload();

  useEffect(() => {
    let isMounted = true;
    const loadEvidenceData = async (): Promise<void> => {
      try {
        const [invRes, parityRes] = await Promise.allSettled([
          evidenceApi.getInventory(jobId),
          evidenceApi.getParityValidation(jobId)
        ]);

        if (isMounted) {
          if (invRes.status === 'fulfilled' && invRes.value.success) {
            setItems(invRes.value.items);
          }
          if (parityRes.status === 'fulfilled' && parityRes.value.success) {
            setParity(parityRes.value.parity);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadEvidenceData();
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const packageZipUrl = evidenceApi.getPackageDownloadUrl(jobId);
  const packageFilename = buildPackageFilename(jobId);
  const maxVariance = parity ? Math.max(0, ...parity.checks.map((check) => check.variance)) : 0;

  return (
    <div data-testid="evidence-workbooks-panel" className="space-y-6">
      {downloadPayload && (
        <a
          ref={downloadLinkRef}
          href={downloadPayload.href}
          download={downloadPayload.filename}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {downloadError && (
        <div role="alert" data-testid="evidence-download-error" className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800">
          {downloadError}
        </div>
      )}

      {/* Top Banner & Complete Package Download */}
      <div className="p-5 bg-gradient-to-r from-[#F0F7FF] via-[#F8FBFE] to-[#F0FDF4] border border-[#BFDBFE] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#0284C7]/10 text-[#0284C7]">
              <FileSpreadsheet size={18} />
            </span>
            <h4 className="text-sm font-extrabold text-[#0B1B33]">
              {UI_STRINGS.evidence.title}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} />
              {UI_STRINGS.evidence.badgeForensicProof}
            </span>
          </div>
          <p className="text-xs text-[#64748B] max-w-2xl">
            {UI_STRINGS.evidence.subtitle}
          </p>
          <div className="text-[11px] text-[#475569] font-medium pt-1">
            {panel.clientLabel} <strong>{customerName}</strong> • {panel.baselineSpendLabel}{' '}
            <strong className="text-[#0284C7]">{UI_STRINGS.common.croreAmount(totalSpendCr.toFixed(2))}</strong>
          </div>
        </div>

        <div>
          <button
            type="button"
            data-testid="btn-download-evidence-package"
            onClick={() => void requestDownload(EVIDENCE_DOWNLOAD_KEYS.PACKAGE, packageZipUrl, packageFilename)}
            disabled={pendingKey !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-60"
          >
            <Download size={15} />
            <span>{UI_STRINGS.evidence.btnDownloadPackage}</span>
          </button>
        </div>
      </div>

      {/* Automated Parity Audit Summary */}
      <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0284C7]" />
            <h5 className="text-xs font-bold text-[#0B1B33] uppercase tracking-wider">
              {panel.parityAuditTitle}
            </h5>
          </div>

          <div>
            {!loading && (parity?.overallStatus === 'PASS' ? (
              <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={13} />
                {UI_STRINGS.evidence.parityVerified}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertTriangle size={13} />
                {UI_STRINGS.evidence.parityDiscrepancy}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">{panel.evaluatedChecksLabel}</span>
            <span className="font-extrabold text-[#0B1B33]">
              {panel.verificationRules(parity?.totalChecks ?? 0)}
            </span>
          </div>
          <div className="p-2.5 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
            <span className="text-emerald-700 block text-[11px]">{panel.reconciliationStatusLabel}</span>
            <span className="font-extrabold text-emerald-700">
              {parity ? panel.passedOfTotal(parity.passedChecks, parity.totalChecks) : panel.notEvaluated}
            </span>
          </div>
          <div className="p-2.5 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">{panel.mathematicalVarianceLabel}</span>
            <span className="font-extrabold text-[#0284C7]">{UI_STRINGS.common.croreAmount(maxVariance.toFixed(4))}</span>
          </div>
          <div className="p-2.5 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">{panel.sourceAuthorityLabel}</span>
            <span className="font-extrabold text-[#0B1B33]">{panel.backendSourceOfTruth}</span>
          </div>
        </div>
      </div>

      {/* Workbooks Directory Table */}
      <div className="bg-white border border-[#DCE7F5] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#F8FBFE] border-b border-[#DCE7F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#0284C7]" />
            <h5 className="text-xs font-bold text-[#0B1B33] uppercase tracking-wider">
              {panel.directoryTitle}
            </h5>
          </div>
          <span className="text-[11px] text-[#64748B]">
            {panel.directoryNote}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F5F9] text-[#475569] font-bold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-4">{panel.colWorkbookCode}</th>
                <th className="py-2.5 px-4">{panel.colModuleOutput}</th>
                <th className="py-2.5 px-4">{panel.colDescription}</th>
                <th className="py-2.5 px-4 text-center">{panel.colSheets}</th>
                <th className="py-2.5 px-4 text-center">{panel.colAuditStatus}</th>
                <th className="py-2.5 px-4 text-right">{panel.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {items.map((item, idx) => (
                <tr key={item.type} className="hover:bg-[#F8FBFE] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0284C7]">
                    0{idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0B1B33]">{item.title}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">{item.filename}</div>
                  </td>
                  <td className="py-3 px-4 text-[#475569] max-w-md">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-[#0B1B33]">
                    {panel.sheetCount(item.sheetCount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.isAvailable ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {panel.auditPass}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {panel.unavailable}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      data-testid={`btn-download-workbook-${item.type}`}
                      onClick={() => void requestDownload(item.type, evidenceApi.getWorkbookDownloadUrl(jobId, item.type), item.filename)}
                      disabled={!item.isAvailable || pendingKey !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#0284C7] bg-white text-[#0284C7] hover:bg-[#0284C7] hover:text-white font-bold transition-all text-xs shadow-xs disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-[#0284C7]"
                    >
                      <Download size={12} />
                      <span>{panel.btnDownloadXlsx}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#F8FBFE] border-t border-[#EEF2F6] text-[11px] text-[#64748B] flex items-center justify-between">
          <span>{UI_STRINGS.evidence.disclaimerText}</span>
          <span className="font-medium text-[#0B1B33]">{panel.formatNote}</span>
        </div>
      </div>
    </div>
  );
};
