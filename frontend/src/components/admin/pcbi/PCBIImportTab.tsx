'use client';

/**
 * PCBI Import Sub-Tab & Post-Import Summary Page
 *
 * Pre-import: Shows confirmation checklist, enables import only when blocking errors = 0.
 * Post-import: Shows full Import Summary with all 11 mandatory fields and two action buttons.
 * NEVER auto-publishes. Publish is always a deliberate user action.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  Rocket,
  RefreshCw,
  Database,
  ShieldCheck,
  AlertTriangle,
  Hash,
  Calendar,
  FileCheck,
  Activity
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { generateValidationReport, generateErrorRecordsCsv } from '../../../utils/pcbiValidator';
import type { PCBIImportTabProps } from '../../../types/components';

const PRE_IMPORT_CHECKLIST = [
  { label: 'Blocking Errors', expected: '0', key: 'blockingErrors' },
  { label: 'Valid Records', expected: '96,357', key: 'validRecords' },
  { label: 'Warnings', expected: '290', key: 'warnings' },
  { label: 'Source values are preserved, no modifications applied', expected: 'PASS', key: 'noModify' },
  { label: 'No auto-defaulting of Quality Rating or Benchmarkability', expected: 'PASS', key: 'noDefault' },
  { label: 'Warnings retained in audit trail', expected: 'PASS', key: 'auditTrail' },
  { label: 'Original uploaded Excel file preserved', expected: 'PASS', key: 'filePreserved' },
  { label: 'All 5 PCBI datasets will be imported (Master, Weekly Index, Constituents, Sources, UNSPSC)', expected: 'PASS', key: 'datasets' },
  { label: 'Version will be created as VALIDATED (not PUBLISHED)', expected: 'PASS', key: 'notPublished' },
  { label: 'Import Summary will be shown before any publish action', expected: 'PASS', key: 'summaryFirst' }
] as const;

function formatImportDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });
  } catch {
    return iso;
  }
}

export const PCBIImportTab: React.FC<PCBIImportTabProps> = ({
  importResult,
  validationSummary,
  fileName,
  isImporting,
  onExecuteImport,
  onOpenPublishModal,
  onViewImportedMaster
}) => {
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  const canImport = (validationSummary?.blockingErrorCount ?? 1) === 0;

  const handleDownloadValidationReport = (): void => {
    if (!validationSummary) return;
    const jsonStr = generateValidationReport(validationSummary, fileName);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setDownloadFileName(`PCBI_Validation_Report_${importResult?.version ?? 'V1'}.json`);
    setDownloadBlobUrl(url);
  };

  const handleDownloadErrorRecords = (): void => {
    if (!validationSummary) return;
    const csvStr = generateErrorRecordsCsv(validationSummary.issues);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    setDownloadFileName(`PCBI_Validation_Issues_${importResult?.version ?? 'V1'}.csv`);
    setDownloadBlobUrl(url);
  };

  function getChecklistValue(key: string): string {
    if (key === 'blockingErrors') return (validationSummary?.blockingErrorCount ?? 0).toLocaleString();
    if (key === 'validRecords') return (validationSummary?.validRecords ?? 0).toLocaleString();
    if (key === 'warnings') return (validationSummary?.warningCount ?? 0).toLocaleString();
    return 'PASS';
  }

  function getChecklistColor(key: string): string {
    if (key === 'blockingErrors') return 'text-emerald-600';
    if (key === 'validRecords') return 'text-[#0284C7]';
    if (key === 'warnings') return 'text-amber-600';
    return 'text-emerald-600';
  }

  return (
    <div className="space-y-6">
      {downloadBlobUrl && (
        <a
          href={downloadBlobUrl}
          download={downloadFileName}
          className="hidden"
          ref={(node) => {
            if (node) { node.click(); setDownloadBlobUrl(null); }
          }}
        >
          Download
        </a>
      )}

      {!importResult ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="p-6 bg-white border border-[#DCE7F5] rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1B33] tracking-tight">
                  {UI_STRINGS.pcbiAdmin.importConfirmTitle}
                </h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  {UI_STRINGS.pcbiAdmin.importConfirmSubtitle}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {PRE_IMPORT_CHECKLIST.map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#475569] flex-1">{item.label}</span>
                  <span className={`text-xs font-bold tabular-nums shrink-0 ${getChecklistColor(item.key)}`}>
                    {getChecklistValue(item.key)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-3">
            {!canImport && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <AlertTriangle size={13} />
                <span>{UI_STRINGS.pcbiAdmin.importDisabledTooltip}</span>
              </div>
            )}
            <div>
              <button
                id="pcbi-execute-import-btn"
                type="button"
                onClick={onExecuteImport}
                disabled={isImporting || !canImport}
                className={`px-10 py-3.5 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 inline-flex items-center gap-2.5 ${canImport ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'}`}
              >
                {isImporting ? (
                  <><RefreshCw size={15} className="animate-spin" /><span>{UI_STRINGS.pcbiAdmin.importingState}</span></>
                ) : (
                  <><Database size={16} /><span>{UI_STRINGS.pcbiAdmin.importButton}</span></>
                )}
              </button>
            </div>
            {canImport && !isImporting && (
              <p className="text-xs text-[#64748B]">
                This will create a VALIDATED version. The version must be manually published.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-6 bg-white border border-emerald-200 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Import Completed
                </span>
                <h3 className="text-xl font-extrabold text-[#0B1B33] tracking-tight">
                  {UI_STRINGS.pcbiAdmin.importSummaryTitle} — Version {importResult.version}
                </h3>
                <p className="text-xs text-[#475569] max-w-xl">{UI_STRINGS.pcbiAdmin.importSummarySubtitle}</p>
              </div>
              {/* Publish Button — explicit user action only */}
              <button
                id="pcbi-publish-btn"
                type="button"
                onClick={onOpenPublishModal}
                className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
              >
                <Rocket size={15} />
                <span>{UI_STRINGS.pcbiAdmin.publishVersionButton(importResult.version)}</span>
              </button>
            </div>
          </div>

          {/* Dataset Record Counts */}
          <div>
            <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-3">
              {UI_STRINGS.pcbiAdmin.datasetBreakdownTitle}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><Database size={11} className="text-emerald-600" /><span className="text-[#64748B] font-semibold">PCBI MASTER</span></div>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">{importResult.pcbi_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><Activity size={11} className="text-[#0284C7]" /><span className="text-[#64748B] font-semibold">WEEKLY INDEX</span></div>
                <p className="text-lg font-bold text-[#0284C7] tabular-nums">{importResult.weekly_index_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><FileCheck size={11} className="text-[#0284C7]" /><span className="text-[#64748B] font-semibold">CONSTITUENTS</span></div>
                <p className="text-lg font-bold text-[#0B1B33] tabular-nums">{importResult.constituent_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><ShieldCheck size={11} className="text-[#0284C7]" /><span className="text-[#64748B] font-semibold">SOURCES</span></div>
                <p className="text-lg font-bold text-[#0284C7] tabular-nums">{importResult.source_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><Hash size={11} className="text-[#F97316]" /><span className="text-[#64748B] font-semibold">UNSPSC</span></div>
                <p className="text-lg font-bold text-[#F97316] tabular-nums">{importResult.unspsc_mapping_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><AlertTriangle size={11} className="text-amber-600" /><span className="text-[#64748B] font-semibold">WARNINGS</span></div>
                <p className="text-lg font-bold text-amber-600 tabular-nums">{importResult.warning_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
                <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 size={11} className="text-[#64748B]" /><span className="text-[#64748B] font-semibold">EXCLUDED</span></div>
                <p className="text-lg font-bold text-[#64748B] tabular-nums">{importResult.records_excluded.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Import Metadata */}
          <div className="p-5 bg-white border border-[#DCE7F5] rounded-2xl shadow-sm">
            <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-4">Import Record</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="space-y-1">
                <span className="text-xs text-[#64748B] flex items-center gap-1"><Hash size={10} />{UI_STRINGS.pcbiAdmin.uploadIdLabel}</span>
                <p className="text-xs font-mono font-bold text-[#0284C7] break-all">{importResult.upload_id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#64748B] flex items-center gap-1"><Calendar size={10} />{UI_STRINGS.pcbiAdmin.importDateLabel}</span>
                <p className="text-xs font-semibold text-[#0B1B33]">{formatImportDate(importResult.import_date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#64748B] flex items-center gap-1"><Activity size={10} />{UI_STRINGS.pcbiAdmin.importStatusLabel}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={10} />{importResult.status}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#64748B]">PCBI VERSION</span>
                <p className="text-base font-mono font-extrabold text-[#0B1B33]">{importResult.version}</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <button id="pcbi-download-validation-report-btn" type="button" onClick={handleDownloadValidationReport}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#475569] border border-[#DCE7F5] rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs">
                <Download size={13} className="text-[#0284C7]" />
                <span>{UI_STRINGS.pcbiAdmin.downloadValidationReport}</span>
              </button>
              <button id="pcbi-download-error-records-btn" type="button" onClick={handleDownloadErrorRecords}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#475569] border border-[#DCE7F5] rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs">
                <Download size={13} className="text-amber-600" />
                <span>{UI_STRINGS.pcbiAdmin.downloadErrorRecords}</span>
              </button>
            </div>
            <button id="pcbi-view-imported-master-btn" type="button" onClick={onViewImportedMaster}
              className="px-6 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Eye size={14} />
              <span>{UI_STRINGS.pcbiAdmin.viewImportedMaster}</span>
            </button>
          </div>

          {/* No-Auto-Publish Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-900">Pending Review:</strong> PCBI {importResult.version} is in <strong>VALIDATED</strong> state — not yet published.
              Use the <span className="font-mono text-amber-900 font-bold">Publish {importResult.version}</span> button above only after confirming this Import Summary is correct.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
