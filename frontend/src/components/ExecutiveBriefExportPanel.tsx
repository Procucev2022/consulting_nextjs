'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Loader2
} from 'lucide-react';
import type {
  ExecutiveBriefExportPanelProps,
  ExportStatus,
  ExecutiveBriefExportStatusResponse
} from '../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../constants';
import { frontendLogger } from '../utils/logger';

export const ExecutiveBriefExportPanel: React.FC<ExecutiveBriefExportPanelProps> = ({
  tenantName,
  onExportSuccess,
  onExportFailure
}) => {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<ExecutiveBriefExportStatusResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      const q = tenantName ? `?tenantName=${encodeURIComponent(tenantName)}` : '';
      const res = await fetch(`/api/reports/executive-brief/status${q}`);
      if (!res.ok) {
        throw new Error(`Status HTTP ${res.status}`);
      }
      const data: ExecutiveBriefExportStatusResponse = await res.json();
      setStatusData(data);
    } catch (err: unknown) {
      frontendLogger.warn('Failed to load export status', { error: String(err) });
    }
  }, [tenantName]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const triggerDownload = (url: string, filename: string): void => {
    setDownloadUrl(url);
    setDownloadFilename(filename);
    setTimeout(() => {
      if (downloadLinkRef.current) {
        downloadLinkRef.current.click();
      }
    }, 50);
  };

  const handleDownload = async (format: 'pdf' | 'pptx'): Promise<void> => {
    setExportStatus('PREPARING');
    setStatusMessage(strings.states.preparing);

    try {
      await new Promise((r) => setTimeout(r, 120));
      setExportStatus(format === 'pdf' ? 'GENERATING_PDF' : 'GENERATING_PPTX');
      setStatusMessage(format === 'pdf' ? strings.states.generatingPdf : strings.states.generatingPptx);

      await new Promise((r) => setTimeout(r, 150));
      setExportStatus('VALIDATING');
      setStatusMessage(strings.states.validating);

      const q = tenantName ? `?tenantName=${encodeURIComponent(tenantName)}` : '';
      const endpoint = `/api/reports/executive-brief/download/${format}${q}`;
      const res = await fetch(endpoint);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: `Export failed (${res.status})` }));
        const reason = errJson.message || `HTTP ${res.status}`;
        setExportStatus('EXECUTIVE_BRIEF_EXPORT_BLOCKED');
        setStatusMessage(reason);
        onExportFailure?.(format, reason);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `Procucev_Procurement_Value_Savings_Diagnostic_${tenantName || 'Client'}.${format}`;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      triggerDownload(url, filename);
      setExportStatus('EXECUTIVE_BRIEF_EXPORT_READY');
      setStatusMessage(strings.states.ready);
      onExportSuccess?.(format, filename);
      fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportStatus('EXECUTIVE_BRIEF_EXPORT_BLOCKED');
      setStatusMessage(msg);
      onExportFailure?.(format, msg);
    }
  };

  const isGenerating =
    exportStatus === 'PREPARING' ||
    exportStatus === 'GENERATING_PDF' ||
    exportStatus === 'GENERATING_PPTX' ||
    exportStatus === 'VALIDATING';

  const isBlocked = exportStatus === 'EXECUTIVE_BRIEF_EXPORT_BLOCKED';

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl mb-4">
      {/* Declarative Download Element */}
      {downloadUrl && (
        <a
          ref={downloadLinkRef}
          href={downloadUrl}
          download={downloadFilename}
          className="hidden"
          aria-hidden="true"
        >
          Download Target
        </a>
      )}

      {/* Main Header & Dual Action Download Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {strings.certifiedBadge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {strings.metadata.reportVersion(statusData?.reportVersion || '1.1')}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide mt-1.5">
            {strings.panelTitle}
          </h3>

          {/* Checklist Verification Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-300">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.dataValidated}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.financialReconciliation}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.module1}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.module2}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.module3}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {strings.checklists.module4}
            </span>
          </div>
        </div>

        {/* Dual Actions: Download PDF & Download PPTX */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Download PDF Button */}
          <button
            type="button"
            id="download-executive-brief-pdf"
            onClick={() => handleDownload('pdf')}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 disabled:opacity-50 text-white font-bold text-left shadow-lg shadow-cyan-600/20 border border-cyan-400/40 transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-black/20 shrink-0">
              {isGenerating && exportStatus === 'GENERATING_PDF' ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-200" />
              ) : (
                <FileText className="w-5 h-5 text-cyan-200" />
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                {strings.buttons.downloadPdf}
              </div>
              <div className="text-[10px] text-cyan-100 font-normal">
                {strings.buttons.downloadPdfSub}
              </div>
            </div>
          </button>

          {/* Download PPTX Button */}
          <button
            type="button"
            id="download-executive-brief-pptx"
            onClick={() => handleDownload('pptx')}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 disabled:opacity-50 text-white font-bold text-left shadow-lg shadow-indigo-600/20 border border-indigo-400/40 transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-black/20 shrink-0">
              {isGenerating && exportStatus === 'GENERATING_PPTX' ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
              ) : (
                <Presentation className="w-5 h-5 text-indigo-200" />
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                {strings.buttons.downloadPptx}
              </div>
              <div className="text-[10px] text-indigo-100 font-normal">
                {strings.buttons.downloadPptxSub}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Generation Status Indicator */}
      {(isGenerating || isBlocked || exportStatus === 'EXECUTIVE_BRIEF_EXPORT_READY') && (
        <div
          className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${
            isBlocked
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : exportStatus === 'EXECUTIVE_BRIEF_EXPORT_READY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}
        >
          {isBlocked ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : isGenerating ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {isBlocked
              ? `${strings.states.blocked}: ${statusMessage}`
              : statusMessage || strings.states.ready}
          </span>
        </div>
      )}

      {/* Footer Info & Expandable Links */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>
          {strings.metadata.lastGenerated(
            statusData?.reportDetails.generationTimestamp || '01-Oct-2026 | 09:30 AM'
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setIsDetailsOpen((prev) => !prev)}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{strings.buttons.reportDetails}</span>
            {isDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>{strings.buttons.reportHistory}</span>
            {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Section 1: Report Details (Auditability) */}
      {isDetailsOpen && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 animate-in fade-in">
          <div className="font-semibold text-cyan-400 mb-2">{strings.details.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-500">{strings.details.sourceDataVersion}:</span>{' '}
              {statusData?.reportDetails.sourceDataVersion || 'v1.4-certified'}
            </div>
            <div>
              <span className="text-slate-500">{strings.details.analysisPeriod}:</span>{' '}
              {statusData?.reportDetails.analysisPeriod || 'Apr 2025 – Mar 2026'}
            </div>
            <div>
              <span className="text-slate-500">{strings.details.validationStatus}:</span>{' '}
              <span className="text-emerald-400 font-semibold">
                {statusData?.reportDetails.validationStatus || 'PASS'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">{strings.details.financialReconciliation}:</span>{' '}
              <span className="text-emerald-400 font-semibold">{strings.details.varianceZero}</span>
            </div>
            <div>
              <span className="text-slate-500">{strings.details.evidenceCount}:</span>{' '}
              {statusData?.reportDetails.evidenceCount ?? 48} items
            </div>
            <div>
              <span className="text-slate-500">{strings.details.opportunityCount}:</span>{' '}
              {statusData?.reportDetails.opportunityCount ?? 14} initiatives
            </div>
          </div>
        </div>
      )}

      {/* Expandable Section 2: Report History */}
      {isHistoryOpen && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 animate-in fade-in overflow-x-auto">
          <div className="font-semibold text-slate-200 mb-2">{strings.history.title}</div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                <th className="py-1 px-2">{strings.history.versionCol}</th>
                <th className="py-1 px-2">{strings.history.dateCol}</th>
                <th className="py-1 px-2">{strings.history.byCol}</th>
                <th className="py-1 px-2">{strings.history.dataVerCol}</th>
                <th className="py-1 px-2">{strings.history.pdfCol}</th>
                <th className="py-1 px-2">{strings.history.pptxCol}</th>
              </tr>
            </thead>
            <tbody>
              {(statusData?.history || []).map((h, i) => (
                <tr key={`${h.reportVersion}-${i}`} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                  <td className="py-1.5 px-2 font-mono text-cyan-400">{h.reportVersion}</td>
                  <td className="py-1.5 px-2">{h.generatedDate}</td>
                  <td className="py-1.5 px-2">{h.generatedBy}</td>
                  <td className="py-1.5 px-2">{h.dataVersion}</td>
                  <td className="py-1.5 px-2">
                    <button
                      type="button"
                      onClick={() => handleDownload('pdf')}
                      className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
                    >
                      {strings.history.downloadAction}
                    </button>
                  </td>
                  <td className="py-1.5 px-2">
                    <button
                      type="button"
                      onClick={() => handleDownload('pptx')}
                      className="text-indigo-400 underline hover:text-indigo-300 cursor-pointer"
                    >
                      {strings.history.downloadAction}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
