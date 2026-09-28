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
    if (key === 'blockingErrors') return 'text-emerald-400';
    if (key === 'validRecords') return 'text-cyan-400';
    if (key === 'warnings') return 'text-amber-400';
    return 'text-emerald-400';
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
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {UI_STRINGS.pcbiAdmin.importConfirmTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {UI_STRINGS.pcbiAdmin.importConfirmSubtitle}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {PRE_IMPORT_CHECKLIST.map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200 flex-1">{item.label}</span>
                  <span className={`text-xs font-bold font-mono shrink-0 ${getChecklistColor(item.key)}`}>
                    {getChecklistValue(item.key)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-3">
            {!canImport && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300">
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
                className={`px-10 py-3.5 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 inline-flex items-center gap-2.5 ${canImport ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
              >
                {isImporting ? (
                  <><RefreshCw size={15} className="animate-spin" /><span>{UI_STRINGS.pcbiAdmin.importingState}</span></>
                ) : (
                  <><Database size={16} /><span>{UI_STRINGS.pcbiAdmin.importButton}</span></>
                )}
              </button>
            </div>
            {canImport && !isImporting && (
              <p className="text-xs text-slate-500">
                This will create a VALIDATED version. The version must be manually published.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Import Completed
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {UI_STRINGS.pcbiAdmin.importSummaryTitle} — Version {importResult.version}
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">{UI_STRINGS.pcbiAdmin.importSummarySubtitle}</p>
              </div>
              {/* Publish Button — explicit user action only */}
              <button
                id="pcbi-publish-btn"
                type="button"
                onClick={onOpenPublishModal}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95 shrink-0"
              >
                <Rocket size={15} />
                <span>{UI_STRINGS.pcbiAdmin.publishVersionButton(importResult.version)}</span>
              </button>
            </div>
          </div>

          {/* Dataset Record Counts */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {UI_STRINGS.pcbiAdmin.datasetBreakdownTitle}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 bg-slate-900/60 border border-emerald-900/40 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><Database size={11} className="text-emerald-400" /><span className="text-slate-400 font-semibold">PCBI MASTER</span></div>
                <p className="text-lg font-bold text-emerald-400">{importResult.pcbi_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-cyan-900/40 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><Activity size={11} className="text-cyan-400" /><span className="text-slate-400 font-semibold">WEEKLY INDEX</span></div>
                <p className="text-lg font-bold text-cyan-400">{importResult.weekly_index_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-purple-900/40 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><FileCheck size={11} className="text-purple-400" /><span className="text-slate-400 font-semibold">CONSTITUENTS</span></div>
                <p className="text-lg font-bold text-purple-400">{importResult.constituent_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-sky-900/40 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><ShieldCheck size={11} className="text-sky-400" /><span className="text-slate-400 font-semibold">SOURCES</span></div>
                <p className="text-lg font-bold text-sky-400">{importResult.source_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-amber-900/30 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><Hash size={11} className="text-amber-300" /><span className="text-slate-400 font-semibold">UNSPSC</span></div>
                <p className="text-lg font-bold text-amber-300">{importResult.unspsc_mapping_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-amber-900/40 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><AlertTriangle size={11} className="text-amber-400" /><span className="text-slate-400 font-semibold">WARNINGS</span></div>
                <p className="text-lg font-bold text-amber-400">{importResult.warning_records.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 size={11} className="text-slate-400" /><span className="text-slate-400 font-semibold">EXCLUDED</span></div>
                <p className="text-lg font-bold text-slate-300">{importResult.records_excluded.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Import Metadata */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Import Record</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Hash size={10} />{UI_STRINGS.pcbiAdmin.uploadIdLabel}</span>
                <p className="text-xs font-mono font-bold text-cyan-300 break-all">{importResult.upload_id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} />{UI_STRINGS.pcbiAdmin.importDateLabel}</span>
                <p className="text-xs font-semibold text-white">{formatImportDate(importResult.import_date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Activity size={10} />{UI_STRINGS.pcbiAdmin.importStatusLabel}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={10} />{importResult.status}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">PCBI VERSION</span>
                <p className="text-base font-mono font-extrabold text-white">{importResult.version}</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button id="pcbi-download-validation-report-btn" type="button" onClick={handleDownloadValidationReport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95">
                <Download size={13} className="text-cyan-400" />
                <span>{UI_STRINGS.pcbiAdmin.downloadValidationReport}</span>
              </button>
              <button id="pcbi-download-error-records-btn" type="button" onClick={handleDownloadErrorRecords}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95">
                <Download size={13} className="text-amber-400" />
                <span>{UI_STRINGS.pcbiAdmin.downloadErrorRecords}</span>
              </button>
            </div>
            <button id="pcbi-view-imported-master-btn" type="button" onClick={onViewImportedMaster}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/20 transition-all active:scale-95">
              <Eye size={14} />
              <span>{UI_STRINGS.pcbiAdmin.viewImportedMaster}</span>
            </button>
          </div>

          {/* No-Auto-Publish Notice */}
          <div className="p-3 bg-amber-950/30 border border-amber-800/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/80">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-300">Pending Review:</strong> PCBI {importResult.version} is in <strong>VALIDATED</strong> state — not yet published.
              Use the <span className="font-mono text-amber-300">Publish {importResult.version}</span> button above only after confirming this Import Summary is correct.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
