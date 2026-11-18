'use client';
import React from 'react';
import { CheckCircle2, Database, FileSpreadsheet, Play, Trash2 } from 'lucide-react';
import type { SavedIngestionDatasetsPanelProps } from '../types';
import { UI_STRINGS } from '../constants';

export const SavedIngestionDatasetsPanel: React.FC<SavedIngestionDatasetsPanelProps> = ({
  savedDocuments,
  activeDocumentId,
  savedDataVersions = [],
  onSelectSavedDocument,
  onDeleteDocument,
  isLoadingSavedDocument = false
}) => {
  const hasAdditionalSavedDocument = savedDocuments.some(
    (doc) => !activeDocumentId || doc.doc_id !== activeDocumentId
  );
  if (!hasAdditionalSavedDocument && savedDataVersions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="saved-ingestion-datasets-panel"
      className="p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 glass-card space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{UI_STRINGS.module1.savedDatasetsHeading}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {UI_STRINGS.module1.savedDatasetsSubtitle}
          </p>
        </div>
        {hasAdditionalSavedDocument && (
          <span className="text-xs font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 font-bold shrink-0">
            {UI_STRINGS.module1.savedDatasetsCount(savedDocuments.length)}
          </span>
        )}
      </div>

      {hasAdditionalSavedDocument && (
        <div className="space-y-2.5">
          {savedDocuments.map((doc, idx) => {
            const docId = doc.doc_id ? String(doc.doc_id) : '';
            const isActive = Boolean(activeDocumentId && docId && activeDocumentId === docId);
            const currencies = Array.isArray(doc.detected_currencies)
              ? doc.detected_currencies.filter((currency): currency is string => typeof currency === 'string' && currency.trim().length > 0)
              : [];
            return (
              <div
                key={docId || `${doc.file_name || 'doc'}-${idx}`}
                data-testid={docId ? `saved-dataset-row-${docId}` : undefined}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-[#F8FBFE] border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">
                        {doc.file_name || UI_STRINGS.module1.fileNameUnavailable}
                      </span>
                      {doc.ocr_status && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {doc.ocr_status}
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{UI_STRINGS.module1.activeDatasetBadge}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {UI_STRINGS.module1.uploadMetadata(
                        doc.file_type || UI_STRINGS.module1.fileTypeUnavailable,
                        doc.file_size_mb === undefined || doc.file_size_mb === null
                          ? UI_STRINGS.module1.fileSizeUnavailable
                          : UI_STRINGS.module1.fileSizeMb(doc.file_size_mb),
                        doc.uploaded_at || UI_STRINGS.module1.uploadTimeUnavailable
                      )}
                      {' • '}
                      {UI_STRINGS.module1.documentIdLabel} {docId || UI_STRINGS.module1.documentIdUnavailable}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <span>
                        {doc.records_count === undefined || doc.records_count === null
                          ? UI_STRINGS.module1.recordCountUnavailable
                          : UI_STRINGS.module1.recordCount(doc.records_count)}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {UI_STRINGS.module1.spendFromFile(doc.converted_inr_crores)}
                      </span>
                      {currencies.length > 0 && (
                        <span>
                          {UI_STRINGS.module1.detectedCurrenciesLabel} {currencies.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {onSelectSavedDocument && docId && !isActive && (
                    <button
                      type="button"
                      onClick={() => onSelectSavedDocument(doc)}
                      disabled={isLoadingSavedDocument}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {isLoadingSavedDocument ? UI_STRINGS.module1.loadingSavedDataset : UI_STRINGS.module1.loadSavedDataset}
                      </span>
                    </button>
                  )}
                  {onDeleteDocument && docId && (
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(docId)}
                      aria-label={UI_STRINGS.profile.deleteDocument}
                      title={UI_STRINGS.profile.deleteDocumentTitle}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {savedDataVersions.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {UI_STRINGS.module1.savedDataVersionsHeading}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {savedDataVersions.map((version) => {
              const isCurrent = activeDocumentId === version.dataVersionId || !version.isSuperseded;
              return (
                <div
                  key={version.dataVersionId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                        {UI_STRINGS.module1.assessmentVersionBadge(version.versionNumber)}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white truncate">
                        {version.fileName}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {UI_STRINGS.module1.assessmentVersionMeta(
                        version.dataVersionId,
                        version.uploadedAt || UI_STRINGS.module1.uploadTimeUnavailable,
                        version.recordCount ?? 0
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCurrent
                      ? UI_STRINGS.module1.assessmentVersionActiveBadge
                      : UI_STRINGS.module1.assessmentVersionSupersededBadge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
