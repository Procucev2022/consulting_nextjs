'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { AssessmentUploadTabProps, AssessmentRecord, IngestionWorkflowState } from '../../types';
import {
  UI_STRINGS,
  ASSESSMENT_STATUS_BADGES,
  ASSESSMENT_UPLOAD_ACCEPT,
  ASSESSMENT_UPLOAD_EXTENSIONS,
  ASSESSMENT_UPLOAD_MAX_BYTES,
  ASSESSMENT_UPLOAD_MAX_MB,
  ASSESSMENT_CHECKSUM_FALLBACK_HEX,
  BASE64_ENCODE_CHUNK_BYTES,
  BYTES_PER_KB,
  BYTES_PER_MB,
  DATA_STATUSES
} from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import frontendLogger from '../../utils/logger';

const pipelineStrings = UI_STRINGS.ASSESSMENT.uploadPipeline;
const screenStrings = UI_STRINGS.ASSESSMENT.uploadScreen;

const formatFileSize = (bytes: number): string => {
  if (bytes < BYTES_PER_KB) return screenStrings.fileSizeBytes(bytes);
  if (bytes < BYTES_PER_MB) return screenStrings.fileSizeKilobytes((bytes / BYTES_PER_KB).toFixed(1));
  return screenStrings.fileSizeMegabytes((bytes / BYTES_PER_MB).toFixed(2));
};

const readFileBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const readFailureMessage = (value: unknown): string | undefined => {
  if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') {
    return value.message;
  }
  return undefined;
};

const encodeBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.byteLength; offset += BASE64_ENCODE_CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_ENCODE_CHUNK_BYTES));
  }
  return btoa(binary);
};

const fileToBase64 = async (file: File): Promise<string> => {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return encodeBase64(await file.arrayBuffer());
    } catch {
      // Fall through to the FileReader path below.
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const AssessmentUploadTab: React.FC<AssessmentUploadTabProps> = ({
  assessment,
  onUploadSuccess,
  onCancel: _onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checksum, setChecksum] = useState<string | null>(null);
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [activeDataVersionId, setActiveDataVersionId] = useState<string | null>(
    assessment.currentDataVersionId || assessment.activeDataVersionId || null
  );

  // Workflow status
  const [workflowState, setWorkflowState] = useState<IngestionWorkflowState>(() => {
    if (assessment.canonicalModule1 || (assessment.validatedSpendCr !== undefined && assessment.validatedSpendCr > 0)) {
      return 'MODULE_1_COMPLETED';
    }
    if (assessment.dataStatus === 'VALIDATED') {
      return 'VALIDATION_PASSED';
    }
    if (assessment.currentDataVersionId || assessment.dataStatus === 'RECEIVED') {
      return 'FILE_UPLOADED';
    }
    return 'NO_FILE_UPLOADED';
  });

  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  const [executionSummary, setExecutionSummary] = useState<AssessmentRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRunningModule1, setIsRunningModule1] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetDvId = activeDataVersionId || assessment.currentDataVersionId;

  useEffect(() => {
    if (assessment.canonicalModule1 || (assessment.validatedSpendCr !== undefined && assessment.validatedSpendCr > 0)) {
      setWorkflowState('MODULE_1_COMPLETED');
      setExecutionSummary(assessment);
    } else if (assessment.dataStatus === 'VALIDATED') {
      setWorkflowState('VALIDATION_PASSED');
    } else if (assessment.currentDataVersionId || assessment.dataStatus === 'RECEIVED') {
      setWorkflowState('FILE_UPLOADED');
    }
  }, [assessment]);

  const badge = ASSESSMENT_STATUS_BADGES[assessment.status] || {
    label: assessment.status,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700'
  };

  const digestFile = async (file: File): Promise<string> => {
    const buffer = await readFileBuffer(file);
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return ASSESSMENT_CHECKSUM_FALLBACK_HEX;
    }
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', uint8);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const computeSha256 = async (file: File): Promise<string> => {
    setIsComputingHash(true);
    let hex = ASSESSMENT_CHECKSUM_FALLBACK_HEX;
    try {
      hex = await digestFile(file);
    } catch (err: unknown) {
      frontendLogger.error('Failed to compute client SHA-256', { error: err });
    } finally {
      setIsComputingHash(false);
    }
    setChecksum(hex);
    return hex;
  };

  const rejectSelectedFile = (message: string): void => {
    setErrorMessage(message);
    setSelectedFile(null);
    setChecksum(null);
    setWorkflowState('NO_FILE_UPLOADED');
  };

  const validateAndSetFile = (file: File): void => {
    setErrorMessage(null);
    setValidationSummary(null);
    setExecutionSummary(null);
    const lowerName = file.name.toLowerCase();
    if (!ASSESSMENT_UPLOAD_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      rejectSelectedFile(screenStrings.invalidFileFormat);
      return;
    }
    if (file.size > ASSESSMENT_UPLOAD_MAX_BYTES) {
      rejectSelectedFile(screenStrings.fileTooLarge(ASSESSMENT_UPLOAD_MAX_MB));
      return;
    }
    if (file.size === 0) {
      rejectSelectedFile(screenStrings.emptyFile);
      return;
    }

    setSelectedFile(file);
    setWorkflowState('FILE_SELECTED');
    void computeSha256(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // STEP 1: Upload File (without automatic analysis run)
  const handleUploadFile = async (file: File, fileChecksum: string): Promise<void> => {
    try {
      setIsUploading(true);
      setErrorMessage(null);
      const base64Data = await fileToBase64(file);

      frontendLogger.info('Uploading dataset version to backend (runAnalysisImmediately=false)', {
        assessmentId: assessment.assessmentId,
        fileName: file.name,
        fileSize: file.size,
        checksum: fileChecksum
      });

      const response = await assessmentApiClient.uploadDataVersion(assessment.assessmentId, {
        fileName: file.name,
        fileSize: file.size,
        checksum: fileChecksum,
        fileBase64: base64Data,
        runAnalysisImmediately: false
      });

      const dvId = response.dataVersion?.dataVersionId || response.assessment?.activeDataVersionId || response.assessment?.currentDataVersionId;
      if (dvId) {
        setActiveDataVersionId(dvId);
      }
      setWorkflowState('FILE_UPLOADED');
      frontendLogger.info('File uploaded successfully, dataset ready for validation', { dvId });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : screenStrings.noErrorDetails;
      frontendLogger.error('Dataset upload failed', { assessmentId: assessment.assessmentId, fileName: file.name }, err);
      setErrorMessage(screenStrings.uploadFailed(reason));
    } finally {
      setIsUploading(false);
    }
  };

  // STEP 2: Validate Dataset
  const handleValidateDataset = async (dataVersionId: string): Promise<void> => {
    try {
      setIsValidating(true);
      setErrorMessage(null);
      setWorkflowState('VALIDATION_IN_PROGRESS');

      frontendLogger.info('Invoking dataset validation', { assessmentId: assessment.assessmentId, targetDvId: dataVersionId });
      const res = await assessmentApiClient.validateDataset(assessment.assessmentId, dataVersionId);

      if (res?.validationSummary) {
        const { validRowCount, excludedRowCount, anomalyRowCount } = res.validationSummary;
        setValidationSummary(
          screenStrings.validationPassed(
            (validRowCount ?? 0).toLocaleString(),
            String(excludedRowCount ?? 0),
            String(anomalyRowCount ?? 0)
          )
        );
        setWorkflowState('VALIDATION_PASSED');
      } else {
        setWorkflowState('VALIDATION_FAILED');
        setErrorMessage(screenStrings.validationFailed(readFailureMessage(res) || screenStrings.validationNoDetails));
      }
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : screenStrings.noErrorDetails;
      frontendLogger.error('Dataset validation failed', { assessmentId: assessment.assessmentId, targetDvId: dataVersionId }, err);
      setWorkflowState('VALIDATION_FAILED');
      setErrorMessage(screenStrings.validationFailed(reason));
    } finally {
      setIsValidating(false);
    }
  };

  // STEP 3: Explicitly Start Module 1 Analysis
  const handleStartModule1 = async (): Promise<void> => {
    if (!targetDvId) {
      setErrorMessage(screenStrings.noValidatedDataVersion);
      return;
    }

    try {
      setIsRunningModule1(true);
      setErrorMessage(null);
      setWorkflowState('MODULE_1_RUNNING');

      frontendLogger.info('Explicitly starting Module 1 analysis', {
        assessmentId: assessment.assessmentId,
        targetDvId
      });

      const res = await assessmentApiClient.runModule1(assessment.assessmentId, targetDvId);

      if (res?.assessment) {
        setWorkflowState('MODULE_1_COMPLETED');
        setExecutionSummary(res.assessment);
        onUploadSuccess(res.assessment);
        frontendLogger.info('Module 1 executed successfully', {
          assessmentId: res.assessment.assessmentId,
          spendCr: res.assessment.validatedSpendCr
        });
      } else {
        setWorkflowState('MODULE_1_FAILED');
        setErrorMessage(screenStrings.module1Failed(screenStrings.module1NoDetails));
      }
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : screenStrings.noErrorDetails;
      frontendLogger.error('Module 1 execution failed', { assessmentId: assessment.assessmentId, targetDvId }, err);
      setWorkflowState('MODULE_1_FAILED');
      setErrorMessage(screenStrings.module1Failed(reason));
    } finally {
      setIsRunningModule1(false);
    }
  };

  const getStateBadge = (): { label: string; bg: string; text: string; border: string } => {
    switch (workflowState) {
      case 'NO_FILE_UPLOADED':
        return { label: pipelineStrings.states.notUploaded, bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
      case 'FILE_SELECTED':
        return { label: pipelineStrings.states.fileSelected, bg: 'bg-blue-950', text: 'text-blue-400', border: 'border-blue-800' };
      case 'FILE_UPLOADED':
        return { label: pipelineStrings.states.uploaded, bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-800' };
      case 'VALIDATION_IN_PROGRESS':
        return { label: pipelineStrings.states.validating, bg: 'bg-indigo-950', text: 'text-indigo-400', border: 'border-indigo-800' };
      case 'VALIDATION_PASSED':
        return { label: pipelineStrings.states.validated, bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-800' };
      case 'VALIDATION_FAILED':
        return { label: pipelineStrings.states.validationFailed, bg: 'bg-rose-950', text: 'text-rose-400', border: 'border-rose-800' };
      case 'MODULE_1_RUNNING':
        return { label: pipelineStrings.states.module1Running, bg: 'bg-cyan-950', text: 'text-cyan-300 animate-pulse', border: 'border-cyan-700' };
      case 'MODULE_1_COMPLETED':
        return { label: pipelineStrings.states.module1Completed, bg: 'bg-teal-950', text: 'text-teal-300', border: 'border-teal-700' };
      case 'MODULE_1_FAILED':
        return { label: pipelineStrings.states.module1Failed, bg: 'bg-rose-950', text: 'text-rose-400', border: 'border-rose-800' };
    }
  };

  const stateBadge = getStateBadge();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {pipelineStrings.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {pipelineStrings.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}>
              {stateBadge.label}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Customer Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.customerHeading}</span>
            <span className="font-semibold text-slate-100 truncate block mt-0.5">
              {assessment.customerName}
            </span>
            {assessment.industry && (
              <span className="text-[10px] text-slate-400 block truncate">
                {assessment.industry}
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.assessmentIdLabel}</span>
            <span className="font-mono font-bold text-cyan-400 block mt-0.5">
              {assessment.assessmentId}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.configuredPeriodLabel}</span>
            <span className="text-slate-200 block mt-0.5">
              {screenStrings.dateRange(
                assessment.assessmentPeriodStart || screenStrings.emptyValue,
                assessment.assessmentPeriodEnd || screenStrings.emptyValue
              )}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.actualCoverageLabel}</span>
            <span className="text-cyan-300 block mt-0.5 font-semibold">
              {screenStrings.dateRange(
                assessment.actualDataCoverageStart || screenStrings.defaultCoverageStart,
                assessment.actualDataCoverageEnd || screenStrings.defaultCoverageEnd
              )}
            </span>
            <span className="text-[9px] text-slate-400 block">{screenStrings.excludedEntityBadge}</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.dataVersionLabel}</span>
            <span className="font-mono text-slate-200 block mt-0.5">
              {activeDataVersionId || assessment.currentDataVersionId || screenStrings.noDataVersion}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.ndaStatusLabel}</span>
            <span
              className={`font-semibold block mt-0.5 ${
                assessment.ndaStatus === 'SIGNED' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {assessment.ndaStatus}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">{screenStrings.datasetStatusLabel}</span>
            <span className="text-slate-200 block mt-0.5 font-mono">
              {assessment.dataStatus || DATA_STATUSES.AWAITING_DATA}
            </span>
          </div>
        </div>
      </div>

      {/* NDA Notice if Not Signed */}
      {assessment.ndaStatus !== 'SIGNED' && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚠</span>
            <span className="text-amber-200 font-medium">
              {screenStrings.ndaWarning}
            </span>
          </div>
        </div>
      )}

      {/* Upload Dropzone & Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept={ASSESSMENT_UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
          data-testid="assessment-file-input"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
          }`}
          data-testid="assessment-file-dropzone"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xl font-bold">
            ↑
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            {selectedFile ? selectedFile.name : pipelineStrings.controls.btnSelectFile}
          </h3>
          <p className="text-xs text-slate-400">
            {screenStrings.dropzoneSupported}
          </p>
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400 mr-2">{screenStrings.selectedFileLabel}</span>
                <span className="font-bold text-white font-mono">{selectedFile.name}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">{screenStrings.fileSizeLabel}</span>
                <span className="text-slate-200 font-mono">{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="text-slate-400 mr-2">{screenStrings.checksumLabel}</span>
              {isComputingHash ? (
                <span className="text-cyan-400 italic">{screenStrings.computingHash}</span>
              ) : (
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 break-all select-all">
                  {checksum}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <span>✕</span>
              <h4>{screenStrings.operationErrorTitle}</h4>
            </div>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Validation Summary Alert */}
        {validationSummary && (
          <div className="p-4 rounded-xl bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <span>✓</span>
              <h4>{screenStrings.validationCompletedTitle}</h4>
            </div>
            <p>{validationSummary}</p>
          </div>
        )}

        {/* Module 1 Results Summary Alert */}
        {executionSummary && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <span>✓</span>
              <h4>{screenStrings.module1ResultsTitle}</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-900/60 font-mono text-[11px]">
              <div>
                <span className="text-emerald-400/80 block text-[10px]">{screenStrings.validatedSpendLabel}</span>
                <span className="font-bold text-white text-xs">
                  {executionSummary.validatedSpendCr !== undefined
                    ? screenStrings.validatedSpendValue(executionSummary.validatedSpendCr.toFixed(4))
                    : screenStrings.emptyValue}
                </span>
              </div>
              <div>
                <span className="text-emerald-400/80 block text-[10px]">{screenStrings.sourceRowsLabel}</span>
                <span className="font-bold text-white text-xs">
                  {executionSummary.canonicalModule1?.sourceRowCount !== undefined
                    ? executionSummary.canonicalModule1.sourceRowCount.toLocaleString()
                    : screenStrings.emptyValue}
                </span>
              </div>
              <div>
                <span className="text-emerald-400/80 block text-[10px]">{screenStrings.materialGroupsLabel}</span>
                <span className="font-bold text-white text-xs">
                  {executionSummary.canonicalModule1?.materialGroups !== undefined
                    ? executionSummary.canonicalModule1.materialGroups
                    : screenStrings.emptyValue}
                </span>
              </div>
              <div>
                <span className="text-emerald-400/80 block text-[10px]">{screenStrings.uniqueSuppliersLabel}</span>
                <span className="font-bold text-cyan-300 text-xs truncate block">
                  {executionSummary.canonicalModule1?.uniqueVendors !== undefined
                    ? executionSummary.canonicalModule1.uniqueVendors
                    : screenStrings.emptyValue}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3 Dedicated Workflow Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isValidating || isRunningModule1}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              {pipelineStrings.controls.btnSelectFile}
            </button>

            {selectedFile && workflowState === 'FILE_SELECTED' && (
              <button
                type="button"
                onClick={() => checksum && handleUploadFile(selectedFile, checksum)}
                disabled={isUploading || isComputingHash || checksum === null}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40"
              >
                {isUploading ? screenStrings.btnUploadingDataset : screenStrings.btnUploadFile}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Control 2: Validate Dataset */}
            <button
              type="button"
              disabled={
                isValidating ||
                isRunningModule1 ||
                !targetDvId ||
                workflowState === 'NO_FILE_UPLOADED' ||
                workflowState === 'FILE_SELECTED' ||
                workflowState === 'VALIDATION_IN_PROGRESS'
              }
              onClick={() => targetDvId && handleValidateDataset(targetDvId)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isValidating || !targetDvId
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
              }`}
            >
              {isValidating ? screenStrings.btnValidating : pipelineStrings.controls.btnValidate}
            </button>

            {/* Control 3: Start Module 1 Analysis (Enabled ONLY when validation passed) */}
            <button
              type="button"
              disabled={
                isRunningModule1 ||
                isValidating ||
                (workflowState !== 'VALIDATION_PASSED' && workflowState !== 'MODULE_1_COMPLETED')
              }
              onClick={handleStartModule1}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isRunningModule1 || (workflowState !== 'VALIDATION_PASSED' && workflowState !== 'MODULE_1_COMPLETED')
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 active:scale-95'
              }`}
            >
              {isRunningModule1 ? screenStrings.btnExecutingModule1 : pipelineStrings.controls.btnStartModule1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentUploadTab;
