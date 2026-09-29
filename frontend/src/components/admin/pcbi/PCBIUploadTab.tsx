'use client';

/**
 * PCBI Master Upload Sub-Tab — File Ingestion, Worksheet Detection & Column Mapping
 */

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import {
  detectWorksheets,
  autoMapColumns
} from '../../../utils/pcbiParser';
import { pcbiCommodityDataLabApi } from '../../../utils/pcbiCommodityDataLabApi';
import frontendLogger from '../../../utils/logger';
import { PCBIWorksheetDetectionSection } from './PCBIWorksheetDetectionSection';
import { PCBIColumnMappingSection } from './PCBIColumnMappingSection';
import type { PCBIUploadTabProps } from '../../../types/components';

export const PCBIUploadTab: React.FC<PCBIUploadTabProps> = ({
  uploadedFile,
  fileMetadata,
  worksheets,
  mappings,
  onFileUpload,
  onOverrideWorksheet,
  onOverrideColumnMapping,
  onProceedToValidate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedSheetForMapping, setSelectedSheetForMapping] = useState<string>('PCBI_MASTER');
  const [domainError, setDomainError] = useState<{ title: string; message: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDomainError(null);

    // Protection against accidental wrong uploads (Prompt 218 Section 10)
    try {
      const domainCheck = await pcbiCommodityDataLabApi.detectUploadDomain(
        file.name,
        '',
        'PCBI_MASTER'
      );
      if (domainCheck?.detection && !domainCheck.detection.isAllowedInTarget) {
        const title = domainCheck.detection.errorMessage || (
          domainCheck.detection.detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
            ? 'CUSTOMER DATA DETECTED'
            : 'COMMODITY RESEARCH DATA DETECTED'
        );
        const message = domainCheck.detection.guidanceMessage || (
          domainCheck.detection.detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
            ? 'Customer purchase history must be uploaded through Module 1.'
            : 'This file belongs in PCBI Commodity Data Lab.'
        );
        setDomainError({
          title,
          message
        });
        frontendLogger.warn('Wrong file domain rejected in PCBI Master Upload', {
          fileName: file.name,
          detectedDomain: domainCheck.detection.detectedDomain
        });
        return;
      }
    } catch (err: unknown) {
      frontendLogger.warn('Domain check warning', {
        error: err instanceof Error ? err.message : String(err)
      });
    }

    try {
      setIsParsing(true);
      frontendLogger.info('Parsing uploaded PCBI master file', { name: file.name, size: file.size });

      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetDataMap: Record<string, Record<string, unknown>[]> = {};
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        sheetDataMap[sheetName] = (XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]) || [];
      }

      const detected = detectWorksheets(workbook.SheetNames, sheetDataMap);
      const datasetMap: Record<string, Record<string, unknown>[]> = {};
      const mappingMap: Record<string, import('../../../types/pcbiAdmin').PCBIColumnMapping[]> = {};

      for (const ws of detected) {
        if (ws.detectedType !== 'IGNORE' && ws.detectedType !== 'OTHER') {
          const rows = sheetDataMap[ws.sheetName] || [];
          datasetMap[ws.detectedType] = rows;
          mappingMap[ws.detectedType] = autoMapColumns(ws.detectedType, ws.headers || [], rows);
        }
      }

      onFileUpload(file, detected, datasetMap, mappingMap);
      const firstType = detected.find((w) => w.detectedType !== 'IGNORE')?.detectedType || 'PCBI_MASTER';
      setSelectedSheetForMapping(firstType);
    } catch (err: unknown) {
      frontendLogger.error('Failed to parse uploaded PCBI Excel', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Domain Error Banner (Accidental Wrong Upload Protection) */}
      {domainError && (
        <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-2xl flex items-start space-x-3 text-rose-200">
          <ShieldAlert size={20} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-white">{domainError.title}</div>
            <div className="text-xs text-rose-300 mt-1">{domainError.message}</div>
          </div>
        </div>
      )}

      {/* File Dropzone / Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer text-center space-y-4 transition-all duration-200"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="pcbi-master-file-input"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <UploadCloud size={32} />
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {UI_STRINGS.pcbiAdmin.uploadScreenTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {UI_STRINGS.pcbiAdmin.dropzonePrompt}
          </p>
        </div>

        <button
          type="button"
          disabled={isParsing}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all active:scale-95"
        >
          <FileSpreadsheet size={15} />
          {isParsing ? 'Parsing Datasets...' : UI_STRINGS.pcbiAdmin.uploadButton}
        </button>
      </div>

      {/* Metadata, Detected Worksheets, and Column Mappings */}
      {uploadedFile && fileMetadata && (
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.fileNameLabel}:</span>
              <p className="text-white font-bold truncate">{fileMetadata.name}</p>
            </div>
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.fileSizeLabel}:</span>
              <p className="text-cyan-300 font-bold">{fileMetadata.sizeMb.toFixed(2)} MB</p>
            </div>
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.uploadDateLabel}:</span>
              <p className="text-slate-200">{new Date(fileMetadata.uploadDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.uploadedByLabel}:</span>
              <p className="text-slate-200 font-medium">{fileMetadata.uploadedBy}</p>
            </div>
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.worksheetsCountLabel}:</span>
              <p className="text-emerald-400 font-bold">{fileMetadata.worksheetCount}</p>
            </div>
            <div>
              <span className="text-slate-400">{UI_STRINGS.pcbiAdmin.recordsCountLabel}:</span>
              <p className="text-purple-400 font-bold">{fileMetadata.totalRecords.toLocaleString()}</p>
            </div>
          </div>

          {/* Worksheet Detection Table */}
          <PCBIWorksheetDetectionSection
            worksheets={worksheets}
            onOverrideWorksheet={onOverrideWorksheet}
          />

          {/* Column Mapping Section */}
          <PCBIColumnMappingSection
            mappings={mappings}
            selectedSheetForMapping={selectedSheetForMapping}
            onSelectSheetForMapping={setSelectedSheetForMapping}
            onOverrideColumnMapping={onOverrideColumnMapping}
          />

          {/* Action to Proceed */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onProceedToValidate}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
            >
              <span>{UI_STRINGS.common.proceed} to {UI_STRINGS.pcbiAdmin.tabValidate}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
