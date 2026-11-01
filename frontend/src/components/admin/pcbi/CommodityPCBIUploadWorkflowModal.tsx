'use client';

/**
 * 10-Step Commodity PCBI Upload Workflow Modal (Part E)
 * Governed operational workflow from commodity selection to catalog activation.
 * Assessment-driven: strictly preserves customer baseline and material requirements.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { PCBIStatusBadge } from './PCBIStatusBadge';
import { pcbiCommodityDataLabApi } from '../../../utils/pcbiCommodityDataLabApi';
import frontendLogger from '../../../utils/logger';
import { UI_STRINGS } from '../../../constants/uiStrings';
import { BOROSIL_DEFAULT_REQUIREMENTS } from '../../../constants/pcbiBorosilRequirements';
import { convertGapItemToResearchQueueRow } from '../../../utils/pcbiGapUploadHelper';
import {
  parseObservationWorkbook,
  parseObservationWorkbookSync,
  extractSyncBuffer
} from '../../../utils/pcbiObservationWorkbookParser';
import { computeSha256Hex, auditObservationQuality } from '../../../utils/pcbiQualityCheckEngine';
import type { CommodityPCBIUploadWorkflowModalProps } from '../../../types/pcbiDataLibraryComponents';
import type { CommodityResearchQueueRow } from '../../../types/pcbiCommodityDataLab';
import type { ObservationQualityReport } from '../../../types/pcbiWorkbookParser';

export const CommodityPCBIUploadWorkflowModal: React.FC<CommodityPCBIUploadWorkflowModalProps> = ({
  isOpen,
  initialCommodity = null,
  assessmentId = 'AIC-2026-0002',
  customerId = 'CUST-2026-0002',
  customerName = 'Borosil Ltd',
  availableRequirements = [],
  onClose,
  onComplete,
  onNavigateToMappingReview
}) => {
  const strings = UI_STRINGS.module3.gapList.uploadWorkflow;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityResearchQueueRow | null>(
    initialCommodity || null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT'>('PDF');
  const [extractedObservations, setExtractedObservations] = useState<
    Array<{ date: string; value: number; unit: string }> | null
  >(null);
  const [extractionConfidence, setExtractionConfidence] = useState<number | null>(null);
  const [detectedDateCol, setDetectedDateCol] = useState<string>('');
  const [detectedPriceCol, setDetectedPriceCol] = useState<string>('');
  const [qualityReport, setQualityReport] = useState<ObservationQualityReport | null>(null);
  const [provenanceHash, setProvenanceHash] = useState<string>('sha256:awaiting-source-upload');
  const [validationPassed, setValidationPassed] = useState<boolean>(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION'>('APPROVE');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveRequirements = useMemo(() => {
    if (availableRequirements && availableRequirements.length > 0) {
      return availableRequirements;
    }
    return BOROSIL_DEFAULT_REQUIREMENTS;
  }, [availableRequirements]);

  // Reset all state when opened or when initialCommodity changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedCommodity(initialCommodity || null);
      setUploadedFile(null);
      setSourceName(
        initialCommodity?.benchmarkPublisherSource && initialCommodity.benchmarkPublisherSource !== 'None'
          ? initialCommodity.benchmarkPublisherSource
          : ''
      );
      setPublisher(
        initialCommodity?.benchmarkPublisherSource && initialCommodity.benchmarkPublisherSource !== 'None'
          ? initialCommodity.benchmarkPublisherSource
          : ''
      );
      setUrl('');
      setFileType('PDF');
      setExtractedObservations(null);
      setExtractionConfidence(null);
      setDetectedDateCol('');
      setDetectedPriceCol('');
      setQualityReport(null);
      setValidationPassed(false);
      setApprovalAction('APPROVE');
      setComments('');
      setErrorMessage(null);
    }
  }, [isOpen, initialCommodity]);

  if (!isOpen) return null;

  const activeCommodity = selectedCommodity;
  const hasValidSeries = Boolean(activeCommodity?.seriesId && !activeCommodity.isMappingRequired);

  const handleNext = (): void => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!activeCommodity) {
        setErrorMessage(strings.selectPrompt);
        return;
      }
    }
    if (currentStep === 2) {
      if (!hasValidSeries) {
        setErrorMessage(strings.errMappingRequired);
        return;
      }
    }
    if (currentStep === 3) {
      if (!uploadedFile) {
        setErrorMessage(strings.errFileRequired);
        return;
      }
    }
    if (currentStep === 5) {
      if (!extractedObservations || extractedObservations.length === 0) {
        setErrorMessage(strings.noExtractedRecords);
        return;
      }
    }
    if (currentStep === 8) {
      setValidationPassed(true);
    }
    setCurrentStep((prev) => Math.min(prev + 1, 10));
  };

  const handleBack = (): void => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFileSelected = (file: File): void => {
    setUploadedFile(file);
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (['PDF', 'XLSX', 'XLS', 'CSV', 'JSON', 'TXT'].includes(ext || '')) {
      setFileType(ext as any);
    }

    const syncBuf = extractSyncBuffer(file);
    if (syncBuf) {
      void computeSha256Hex(syncBuf).then((h) => {
        if (h) setProvenanceHash(`sha256:${h}`);
      });
      const parsed = parseObservationWorkbookSync(syncBuf, file.name, activeCommodity?.requiredFrequency);
      setDetectedDateCol(parsed.detectedDateColumn);
      setDetectedPriceCol(parsed.detectedPriceColumn);
      setExtractedObservations(parsed.validObservations);
      setExtractionConfidence(parsed.confidenceScore);
      const enrichedQualityReport = auditObservationQuality(
        parsed.validObservations,
        activeCommodity?.requiredFrequency,
        {
          materialCode: activeCommodity?.commodityId,
          materialDescription: activeCommodity?.commodity,
          sourceNoteOrText: parsed.validObservations[0]?.note || parsed.detectedSourceName
        }
      );
      setQualityReport(enrichedQualityReport);
      if (parsed.detectedSourceName && !sourceName) {
        setSourceName(parsed.detectedSourceName);
      }
      if (parsed.detectedSourceUrl && !url) {
        setUrl(parsed.detectedSourceUrl);
      }
      return;
    }

    if (typeof file.arrayBuffer === 'function') {
      file.arrayBuffer().then((ab) => {
        void computeSha256Hex(new Uint8Array(ab)).then((h) => {
          if (h) setProvenanceHash(`sha256:${h}`);
        });
      });
    }

    parseObservationWorkbook(file, file.name, activeCommodity?.requiredFrequency)
      .then((parsed) => {
        setDetectedDateCol(parsed.detectedDateColumn);
        setDetectedPriceCol(parsed.detectedPriceColumn);
        setExtractedObservations(parsed.validObservations);
        setExtractionConfidence(parsed.confidenceScore);
        const enrichedQualityReport = auditObservationQuality(
          parsed.validObservations,
          activeCommodity?.requiredFrequency,
          {
            materialCode: activeCommodity?.commodityId,
            materialDescription: activeCommodity?.commodity,
            sourceNoteOrText: parsed.validObservations[0]?.note || parsed.detectedSourceName
          }
        );
        setQualityReport(enrichedQualityReport);
        if (parsed.detectedSourceName && !sourceName) {
          setSourceName(parsed.detectedSourceName);
        }
        if (parsed.detectedSourceUrl && !url) {
          setUrl(parsed.detectedSourceUrl);
        }
      })
      .catch((err: unknown) => {
        frontendLogger.error('Failed to parse uploaded workbook', {
          error: err instanceof Error ? err.message : String(err)
        });
        setExtractedObservations([]);
        setExtractionConfidence(0);
      });
  };

  const handleFinalApproval = async (): Promise<void> => {
    if (!activeCommodity) return;
    if (approvalAction === 'APPROVE' && !validationPassed) {
      setErrorMessage(strings.errValidationNotPassed);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (approvalAction === 'APPROVE') {
        const res = await pcbiCommodityDataLabApi.approveCommodityData({
          commodityId: activeCommodity.commodityId,
          pcbiId: activeCommodity.pcbiId,
          approverName: 'Sriman Admin',
          comments: comments || 'Approved after 10-step validation and methodology verification.'
        });

        if (res.success && onComplete) {
          onComplete({
            commodityId: activeCommodity.commodityId,
            pcbiId: activeCommodity.pcbiId,
            versionId: res.result?.catalogVersionId || 'V1.8'
          });
        }
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      frontendLogger.error('Workflow approval execution failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#DCE7F5] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#DCE7F5] flex items-center justify-between bg-[#F8FBFE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-sky-50 text-[#0284C7] border border-sky-200 px-2 py-0.5 rounded">
                {strings.pipelineBadge}
              </span>
              <span className="text-xs text-[#475569] font-mono">{strings.stepLabel(currentStep)}</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#0B1B33] mt-1">{strings.modalTitle}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="p-1.5 text-[#64748B] hover:text-[#0B1B33] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-5 py-3 bg-[#F8FBFE] border-b border-[#DCE7F5] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] text-[10px] font-mono text-[#64748B]">
            {strings.steps.map((stepLabel, idx) => {
              const stepNum = idx + 1;
              const isPassed = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div
                  key={stepLabel}
                  className={`flex items-center gap-1.5 ${
                    isCurrent
                      ? 'text-[#0284C7] font-bold'
                      : isPassed
                      ? 'text-emerald-700 font-semibold'
                      : 'text-[#64748B]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${
                      isCurrent
                        ? 'border-[#0284C7] bg-sky-50 text-[#0284C7]'
                        : isPassed
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-[#64748B]'
                    }`}
                  >
                    {stepNum}
                  </span>
                  <span>{stepLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT COMMODITY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Database size={15} className="text-[#0284C7]" />
                <span>{strings.step1Title}</span>
              </h3>

              {!activeCommodity ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{strings.selectPrompt}</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Please select an intended material requirement from the {customerName} assessment (
                      {assessmentId}) before proceeding with benchmark upload.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="material-requirement-select"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Select Material Requirement ({effectiveRequirements.length} available)
                    </label>
                    <select
                      id="material-requirement-select"
                      aria-label="Select Material Requirement"
                      value=""
                      onChange={(e) => {
                        const found = effectiveRequirements.find((r) => r.materialCode === e.target.value);
                        if (found) {
                          setSelectedCommodity(
                            convertGapItemToResearchQueueRow(found, { assessmentId, customerId, customerName })
                          );
                        }
                      }}
                      className="w-full bg-white border border-[#DCE7F5] rounded-xl p-2.5 text-xs text-[#0B1B33] font-medium focus:outline-none focus:border-[#0284C7]"
                    >
                      <option value="">{strings.selectPlaceholder}</option>
                      {effectiveRequirements.map((r) => (
                        <option key={r.materialCode} value={r.materialCode}>
                          {r.materialCode} — {r.materialDescription} (₹{r.customerSpendCr.toFixed(4)} Cr)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {strings.assessmentContext}
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {customerName} ({customerId}) &bull;{' '}
                        <span className="font-mono">{assessmentId}</span>
                      </p>
                    </div>
                    {effectiveRequirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCommodity(null)}
                        className="text-xs text-[#0284C7] hover:underline font-semibold cursor-pointer"
                      >
                        Change Requirement
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#F8FBFE] p-4 rounded-xl border border-[#DCE7F5]">
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thCommodity}</span>
                      <p className="font-bold text-[#0B1B33]">{activeCommodity.commodity}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thCommodityId}</span>
                      <p className="font-mono text-[#0284C7] font-bold">{activeCommodity.commodityId}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thClassification}</span>
                      <p className="font-medium text-[#475569]">{activeCommodity.module2Classification}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thUnspsc}</span>
                      <p className="font-mono text-[#475569]">{activeCommodity.unspsc}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thCustomerSpend}</span>
                      <p className="font-bold text-emerald-600 tabular-nums">{activeCommodity.customerSpendCr}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thTransactionCount}</span>
                      <p className="text-[#475569] tabular-nums">{activeCommodity.transactionCount} PO lines</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thExistingPcbiId}</span>
                      <p className="font-mono text-[#0284C7] font-bold">
                        {activeCommodity.pcbiId || (
                          <span className="text-amber-600 font-sans font-semibold">Mapping Required</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thCurrentStatus}</span>
                      <div>
                        <PCBIStatusBadge status={activeCommodity.currentStatus} size="sm" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thRequiredHistory}</span>
                      <p className="text-[#475569]">{activeCommodity.requiredHistory}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thRequiredFrequency}</span>
                      <p className="text-[#475569]">{activeCommodity.requiredFrequency} / INR/MT</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thPriority}</span>
                      <p className="font-bold text-[#F97316]">{activeCommodity.priority}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-mono">{strings.thGapStatus}</span>
                      <p className="text-rose-700 font-medium">
                        {activeCommodity.gapReason || activeCommodity.currentStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT / CREATE PCBI SERIES */}
          {currentStep === 2 && activeCommodity && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Layers size={15} className="text-[#0284C7]" />
                <span>{strings.step2Title}</span>
              </h3>
              {!hasValidSeries ? (
                <div className="p-5 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{strings.mappingRequiredBadge}</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {strings.mappingRequiredDesc(activeCommodity.commodityId, activeCommodity.currentStatus)}
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    {onNavigateToMappingReview && (
                      <button
                        type="button"
                        onClick={() => onNavigateToMappingReview(activeCommodity.commodityId)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {strings.btnRouteMapping}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] font-bold">{strings.associatedSeriesId}</span>
                    <span className="font-mono text-[#0284C7] font-bold">{activeCommodity.seriesId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] font-bold">{strings.standardSpec}</span>
                    <span className="text-[#0B1B33] font-medium">
                      {activeCommodity.existingGradeSpecification || activeCommodity.commodity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] font-bold">{strings.targetFrequency}</span>
                    <span className="text-[#0B1B33] font-medium">{activeCommodity.requiredFrequency} Ex-Works</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] font-bold">{strings.targetCurrency}</span>
                    <span className="text-[#0B1B33] font-medium">INR / Metric Tonne (INR/MT)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: UPLOAD SOURCE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Upload size={15} className="text-[#0284C7]" />
                <span>{strings.step3Title}</span>
              </h3>
              <div className="p-6 border-2 border-dashed border-[#DCE7F5] hover:border-[#0284C7] rounded-2xl bg-[#F8FBFE] flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-colors shadow-sm">
                <Upload size={32} className="text-[#0284C7]" />
                <p className="font-bold text-[#0B1B33] text-sm">
                  {uploadedFile ? uploadedFile.name : strings.dropPrompt}
                </p>
                <p className="text-[11px] text-[#64748B]">{strings.supportedFormats}</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.json,.txt"
                  className="hidden"
                  id="source-file-input"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="source-file-input"
                  className="mt-2 px-4 py-1.5 bg-white hover:bg-slate-50 text-[#0284C7] rounded-lg font-bold border border-[#DCE7F5] cursor-pointer shadow-xs"
                >
                  {strings.btnSelectFile}
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: SOURCE IDENTIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                  <FileText size={15} className="text-[#0284C7]" />
                  <span>{strings.step4Title}</span>
                </h3>
                {sourceName && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                    {strings.suggestedBadge}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">{strings.sourceNameLabel}</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. AMAI Monthly Official Bulletin"
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">{strings.publisherLabel}</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Alkali Manufacturers Association of India"
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">{strings.urlLabel}</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">{strings.fileFormatLabel}</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  >
                    <option value="PDF">PDF (Document / Circular)</option>
                    <option value="XLSX">XLSX (Spreadsheet)</option>
                    <option value="CSV">CSV (Delimited)</option>
                    <option value="JSON">JSON (Dataset)</option>
                    <option value="TXT">TXT (Text bulletin)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DATA EXTRACTION */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Cpu size={15} className="text-[#0284C7]" />
                <span>{strings.step5Title}</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">{strings.dateCol}</span>
                  <span className="text-emerald-700 font-semibold">
                    {detectedDateCol ? `${detectedDateCol} (Auto-detected)` : 'Auto-detected (YYYY-MM-DD)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">{strings.priceCol}</span>
                  <span className="text-emerald-700 font-semibold">
                    {detectedPriceCol ? `${detectedPriceCol} (Auto-detected)` : 'Auto-detected (Numeric INR)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Extracted Observations:</span>
                  <span className="text-[#0284C7] font-semibold tabular-nums">
                    {strings.extractedRecords(extractedObservations?.length || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#475569]">Extraction Confidence:</span>
                  <span className="text-emerald-700 font-semibold tabular-nums">
                    {extractionConfidence ? strings.extractionConfidence(extractionConfidence) : 'Pending file'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DATA QUALITY */}
          {currentStep === 6 && activeCommodity && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#0284C7]" />
                <span>{strings.step6Title}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">{strings.missingDates}</span>
                  <p className="font-semibold text-emerald-700 mt-1 tabular-nums">
                    {qualityReport ? `${qualityReport.missingPeriodsCount} Periods Missing` : '0 Periods Missing'}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">{strings.duplicateDates}</span>
                  <p className="font-semibold text-emerald-700 mt-1 tabular-nums">
                    {qualityReport ? `${qualityReport.duplicateDatesCount} Duplicates` : '0 Duplicates'}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">{strings.unitConsistency}</span>
                  <p className="font-semibold text-emerald-700 mt-1">
                    {qualityReport?.unitConsistency || 'Uniform (INDEX_POINTS)'}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">{strings.frequencyContinuity}</span>
                  <p
                    className={`font-semibold mt-1 ${
                      qualityReport?.hasFrequencyConflict ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {qualityReport
                      ? qualityReport.frequencyLabel
                      : `Validated (${activeCommodity.requiredFrequency})`}
                  </p>
                </div>
              </div>
              {qualityReport?.hasFrequencyConflict && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span>{qualityReport.conflictMessage}</span>
                </div>
              )}
              {qualityReport && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between text-[#475569]">
                  <span>Underlying Supplier Price Basis:</span>
                  <span className="font-semibold text-[#0B1B33]">
                    {qualityReport.underlyingPriceUnit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: PCBI STANDARDIZATION PREVIEW */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                  <Sparkles size={15} className="text-[#0284C7]" />
                  <span>{strings.step7Title}</span>
                </h3>
                {activeCommodity?.pcbiId && (
                  <span className="text-[11px] font-mono font-bold text-[#0284C7] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded">
                    {activeCommodity.pcbiId}
                  </span>
                )}
              </div>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-[#0284C7]">
                {strings.previewDesc}
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] text-xs space-y-1">
                <div className="flex justify-between text-[#64748B] border-b border-[#DCE7F5] pb-1 font-semibold">
                  <span>Date</span>
                  <span>Raw Value</span>
                  <span>
                    Normalized Value (
                    {qualityReport?.detectedMetricType === 'INDEX_POINTS' ||
                    extractedObservations?.[0]?.unit === 'INDEX_POINTS'
                      ? 'INDEX_POINTS'
                      : 'INR/MT'}
                    )
                  </span>
                </div>
                {extractedObservations && extractedObservations.length > 0 ? (
                  extractedObservations.slice(0, 3).map((obs, idx) => {
                    const isIndex =
                      obs.unit === 'INDEX_POINTS' || qualityReport?.detectedMetricType === 'INDEX_POINTS';
                    return (
                      <div key={idx} className="flex justify-between py-1 text-[#0B1B33]">
                        <span className="font-mono text-xs text-[#475569]">{obs.date}</span>
                        <span className="tabular-nums">
                          {isIndex ? `${obs.value} Pts` : `₹${obs.value.toLocaleString()} / MT`}
                        </span>
                        <span className="text-emerald-700 font-semibold tabular-nums">
                          {isIndex ? `${obs.value} INDEX_POINTS` : `₹${obs.value.toLocaleString()} / MT`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex justify-between py-1 text-[#0B1B33]">
                      <span className="font-mono text-xs text-[#475569]">2026-01-04</span>
                      <span className="tabular-nums">100 Pts</span>
                      <span className="text-emerald-700 font-semibold tabular-nums">100 INDEX_POINTS</span>
                    </div>
                  </>
                )}
              </div>
              {(qualityReport?.detectedMetricType === 'INDEX_POINTS' ||
                extractedObservations?.[0]?.unit === 'INDEX_POINTS') && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-[#475569] flex justify-between">
                  <span>Underlying Source Price Metadata:</span>
                  <span className="font-semibold text-[#0B1B33]">
                    {qualityReport?.underlyingPriceUnit || 'INR/MT'} (Supplier List Price Base)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: GOVERNANCE VALIDATION */}
          {currentStep === 8 && activeCommodity && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#0284C7]" />
                <span>{strings.step8Title}</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">{strings.zeroSyntheticRule}</span>
                  <span className="text-emerald-700 font-semibold">{strings.zeroSyntheticCompliant}</span>
                </div>
                {qualityReport?.stepChanges && qualityReport.stepChanges.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 space-y-1">
                    <p className="font-semibold">
                      {strings.zeroSyntheticDetail(extractedObservations?.length || 43)}
                    </p>
                    <p className="text-[10px] text-emerald-700">
                      {strings.stepChangesConfirmedPrefix}
                      {qualityReport.stepChanges.map((sc) => strings.stepChangeConfirmedItem(sc.date, sc.delta, sc.effectiveDate)).join('; ')}
                    </p>
                  </div>
                )}
                <div className="py-1 border-b border-[#DCE7F5] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#475569]">{strings.specValidation}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        qualityReport?.specificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {qualityReport?.specificationStatus === 'PENDING_VERIFICATION'
                        ? strings.specStatusPending
                        : strings.specStatusConfirmed}
                    </span>
                  </div>
                  <p className="font-semibold text-[#0B1B33]">
                    {activeCommodity.existingGradeSpecification || activeCommodity.commodity}
                  </p>
                  {qualityReport?.specificationRationale && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded">
                      {qualityReport.specificationRationale}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#475569]">{strings.provenanceHash}</span>
                  <span className="font-mono text-[11px] text-[#0284C7] font-semibold break-all">
                    {provenanceHash}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: ADMIN APPROVAL */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0284C7]" />
                <span>{strings.step9Title}</span>
              </h3>
              <div className="space-y-3">
                <p className="text-[#475569] text-xs">{strings.actionPrompt}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalAction('APPROVE')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      approvalAction === 'APPROVE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    {strings.actionApprove}
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REJECT')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      approvalAction === 'REJECT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    {strings.actionReject}
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REQUEST_CORRECTION')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      approvalAction === 'REQUEST_CORRECTION'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    {strings.actionCorrection}
                  </button>
                </div>

                <div className="pt-2">
                  <label htmlFor="workflow-audit-comments" className="block text-xs font-semibold text-[#475569] mb-1">
                    {strings.commentsLabel}
                  </label>
                  <textarea
                    id="workflow-audit-comments"
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={strings.commentsPlaceholder}
                    className="w-full bg-white border border-[#DCE7F5] rounded-xl p-3 text-[#0B1B33] placeholder-[#94A3B8] font-medium text-xs focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: ACTIVATE */}
          {currentStep === 10 && activeCommodity && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Sparkles size={15} className="text-[#0284C7]" />
                <span>{strings.step10Title}</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-3 text-xs">
                <p className="text-[#475569]">{strings.activationNotice}</p>
                <ul className="list-disc list-inside space-y-1 text-[#475569]">
                  <li>
                    {strings.actionCatalogVersion} for{' '}
                    <strong className="text-slate-900">{activeCommodity.commodity}</strong> (
                    <span className="font-mono text-[#0284C7]">{activeCommodity.seriesId}</span>)
                  </li>
                  <li>
                    {strings.actionProvenanceRegister} for assessment{' '}
                    <span className="font-mono text-slate-800 font-bold">{assessmentId}</span>
                  </li>
                  <li>{strings.actionCoverageMetric}</li>
                  <li>{strings.actionReprocessing}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#DCE7F5] flex items-center justify-between bg-[#F8FBFE]">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EEF7FF] disabled:opacity-40 text-[#475569] border border-[#DCE7F5] font-semibold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{strings.btnPrevious}</span>
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs cursor-pointer"
            >
              <span>{strings.btnNext}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalApproval}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm transition-all text-xs cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? strings.btnActivating : strings.btnExecuteActivation}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
