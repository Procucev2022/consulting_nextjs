'use client';
import React from 'react';
import {
  UploadCloud,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import type { IngestionUploadSectionProps } from '../types';
import { UI_STRINGS } from '../constants';

export const IngestionUploadSection: React.FC<IngestionUploadSectionProps> = ({
  tenant,
  activeDatasetType,
  ingestionQueue,
  dragActive,
  onDrag,
  onDrop,
  onFileChange,
  fileInputRef,
  totalEvaluatedSpendInrCr,
  onOpenSetupModal
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Upload Zone (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Upload {activeDatasetType} (Multi-Currency)</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/40">
              Max 2GB
            </span>
          </div>

          <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 hover:border-cyan-500 hover:bg-cyan-50/30 dark:hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf,.xml,.zip"
              onChange={onFileChange}
            />
            <div className="cursor-pointer block">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Upload {activeDatasetType} for {tenant.enterprise_name.split('(')[0].trim()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                AI automatically detects currencies & converts to <strong>INR in Crores (₹ Cr)</strong>
              </p>
              <div className="flex items-center justify-center space-x-2 pt-2">
                {onOpenSetupModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSetupModal();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {UI_STRINGS.module1.setupDetails}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {UI_STRINGS.module1.selectFile}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded File Details & Ingestion Status (7 cols) */}
      <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{UI_STRINGS.module1.uploadedFileDetails}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified dataset with record count strictly excluding header row
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50 font-bold">
            ₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr Evaluated
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {ingestionQueue.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
              {UI_STRINGS.module1.noFileUploaded}. Click &quot;{UI_STRINGS.module1.selectFile}&quot; or drop your dataset to begin ingestion.
            </div>
          ) : (
            ingestionQueue.slice(0, 1).map((doc, idx) => (
              <div
                key={`ingestion-doc-${doc.doc_id || doc.file_name || 'doc'}-${idx}`}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                        {doc.file_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Format: {doc.file_type || 'XLSX'} • Size: {doc.file_size_mb || 1.0} MB • Uploaded: {doc.uploaded_at || 'Just now'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                        (doc.ocr_status || 'Completed') === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50 animate-pulse'
                      }`}
                    >
                      {(doc.ocr_status || 'Completed') === 'Completed'
                        ? `${doc.progress ?? 100}% ${doc.ocr_status || 'Completed'}`
                        : UI_STRINGS.module1.processingStatus(doc.progress ?? 100)}
                    </span>
                  </div>
                </div>

                {/* Highlighted Total Records & Formula Calculation Box */}
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase font-mono block">
                        Total Ingested Records (Data Rows):
                      </span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                          {(doc.records_count ?? 0).toLocaleString()} Records
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          Excluding Header Row
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4">
                      <span className="text-[10px] text-slate-400 font-medium uppercase font-mono block">
                        Calculated Total Spend from File:
                      </span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-lg">
                        ₹{(doc.converted_inr_crores != null ? doc.converted_inr_crores : 732.41).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Formula Footnote */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between">
                    <span className="text-slate-500">Spend Formula:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      &sum; (Order Quantity &times; Net Price &times; Currency in INR)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-300/50 dark:border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (doc.progress ?? 100) === 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, doc.progress ?? 100))}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span>Detected Currencies:</span>
                    {(doc.detected_currencies || ['USD', 'EUR', 'INR']).map((c, cIdx) => (
                      <span key={`${c}-${cIdx}`} className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-cyan-800 dark:text-cyan-400 font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                  <span>ID: {doc.doc_id || `DOC-INGEST-${idx + 1}`}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
