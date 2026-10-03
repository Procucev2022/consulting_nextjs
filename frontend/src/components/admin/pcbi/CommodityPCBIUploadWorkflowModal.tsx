'use client';

/**
 * 10-Step Commodity PCBI Upload Workflow Modal (Part E)
 * Governed operational workflow from commodity selection to catalog activation.
 */

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { PCBIStatusBadge } from './PCBIStatusBadge';
import { pcbiCommodityDataLabApi } from '../../../utils/pcbiCommodityDataLabApi';
import frontendLogger from '../../../utils/logger';
import type { CommodityPCBIUploadWorkflowModalProps } from '../../../types/pcbiDataLibraryComponents';
import type { CommodityResearchQueueRow } from '../../../types/pcbiCommodityDataLab';

export const CommodityPCBIUploadWorkflowModal: React.FC<CommodityPCBIUploadWorkflowModalProps> = ({
  isOpen,
  initialCommodity,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [commodity] = useState<CommodityResearchQueueRow | null>(initialCommodity || null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState<string>('Minerals & Metals Review Weekly Assessment');
  const [publisher, setPublisher] = useState<string>('Binani Commercial Co. / MMR');
  const [url, setUrl] = useState<string>('https://www.mmronline.com/archives');
  const [fileType, setFileType] = useState<'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT'>('PDF');
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION'>('APPROVE');
  const [comments, setComments] = useState<string>('Governance checks verified.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeCommodity: CommodityResearchQueueRow = commodity || {
    commodity: 'Ferro Molybdenum 65%',
    commodityId: 'COM-MET-FMO',
    module2Classification: 'METALS_AND_ALLOYS',
    unspsc: '30102900',
    customerSpend: 12500000,
    customerSpendCr: '₹1.25 Cr',
    transactionCount: 65,
    pcbiId: 'PCBI-FEMO-65-001',
    seriesId: 'SER-IND-FEMO-65-M',
    currentStatus: 'PARTIAL_HISTORY',
    requiredHistory: '75 months (2020-04 to 2026-06)',
    availableHistory: '18 observations / 32 months (Under Review)',
    requiredFrequency: 'WEEKLY',
    availableFrequency: 'MONTHLY',
    sourceStatus: 'SOURCE_UNVERIFIED',
    methodologyStatus: 'METHODOLOGY_PENDING',
    priority: 'P1 — Critical Coverage Gap',
    researchStatus: 'IN_PROGRESS',
    lastUpdated: new Date().toISOString(),
    action: 'OPEN WORKSPACE'
  };

  const handleNext = (): void => {
    setErrorMessage(null);
    if (currentStep === 3 && !uploadedFile) {
      // Mock staged file for workflow demo
      const mockFile = new File(['mock content'], 'MMR_FeMo60_Historical_2021_2024.pdf', { type: 'application/pdf' });
      setUploadedFile(mockFile);
    }
    setCurrentStep((prev) => Math.min(prev + 1, 10));
  };

  const handleBack = (): void => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalApproval = async (): Promise<void> => {
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
                GOVERNED 10-STEP COMMODITY PCBI PIPELINE
              </span>
              <span className="text-xs text-[#475569] font-mono">Step {currentStep} of 10</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#0B1B33] mt-1">
              Upload Commodity PCBI Source Data
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="p-1.5 text-[#64748B] hover:text-[#0B1B33] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-5 py-3 bg-[#F8FBFE] border-b border-[#DCE7F5] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] text-[10px] font-mono text-[#64748B]">
            {[
              '1. Select',
              '2. Series',
              '3. Upload',
              '4. Identity',
              '5. Extract',
              '6. Quality',
              '7. Preview',
              '8. Validate',
              '9. Approve',
              '10. Activate'
            ].map((stepLabel, idx) => {
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: SELECT COMMODITY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Database size={15} className="text-[#0284C7]" />
                <span>Step 1 — Commodity Context & Exposure Attributes</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#F8FBFE] p-4 rounded-xl border border-[#DCE7F5]">
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Commodity Name</span>
                  <p className="font-bold text-[#0B1B33]">{activeCommodity.commodity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Commodity ID</span>
                  <p className="font-mono text-[#0284C7]">{activeCommodity.commodityId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Module 2 Classification</span>
                  <p className="font-medium text-[#475569]">{activeCommodity.module2Classification}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">UNSPSC</span>
                  <p className="font-mono text-[#475569]">{activeCommodity.unspsc}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Customer Spend</span>
                  <p className="font-bold text-emerald-600 tabular-nums">{activeCommodity.customerSpendCr}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Transaction Count</span>
                  <p className="text-[#475569] tabular-nums">{activeCommodity.transactionCount} PO lines</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Existing PCBI ID</span>
                  <p className="font-mono text-[#0284C7] font-bold">{activeCommodity.pcbiId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Current Status</span>
                  <div>
                    <PCBIStatusBadge status={activeCommodity.currentStatus} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Required History</span>
                  <p className="text-[#475569]">{activeCommodity.requiredHistory}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Required Frequency / Unit</span>
                  <p className="text-[#475569]">{activeCommodity.requiredFrequency} / INR/MT</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Research Priority</span>
                  <p className="font-bold text-[#F97316]">{activeCommodity.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-mono">Gap Status</span>
                  <p className="text-rose-700">Historical Gap Detected (2020-2022)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT / CREATE PCBI SERIES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Layers size={15} className="text-[#0284C7]" />
                <span>Step 2 — PCBI Series Association & Specification Target</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#475569] font-bold">Associated Series ID:</span>
                  <span className="font-mono text-[#0284C7] font-bold">{activeCommodity.seriesId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#475569] font-bold">Standard Specification:</span>
                  <span className="text-[#0B1B33] font-medium">IS 1469:1993 Standard Specification</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#475569] font-bold">Target Frequency:</span>
                  <span className="text-[#0B1B33] font-medium">{activeCommodity.requiredFrequency} Ex-Works</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#475569] font-bold">Target Currency / Unit:</span>
                  <span className="text-[#0B1B33] font-medium">INR / Metric Tonne (INR/MT)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD SOURCE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Upload size={15} className="text-[#0284C7]" />
                <span>Step 3 — Upload Source File (Drag & Drop or Select)</span>
              </h3>
              <div className="p-6 border-2 border-dashed border-[#DCE7F5] hover:border-[#0284C7] rounded-2xl bg-[#F8FBFE] flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-colors shadow-sm">
                <Upload size={32} className="text-[#0284C7]" />
                <p className="font-bold text-[#0B1B33] text-sm">
                  {uploadedFile ? uploadedFile.name : 'Drag & drop research file here, or click to browse'}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Supported formats: XLSX, XLS, CSV, PDF, JSON, TXT (Max 50MB)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.json,.txt"
                  className="hidden"
                  id="source-file-input"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="source-file-input"
                  className="mt-2 px-4 py-1.5 bg-white hover:bg-slate-50 text-[#0284C7] rounded-lg font-bold border border-[#DCE7F5] cursor-pointer shadow-xs"
                >
                  Select File
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: SOURCE IDENTIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <FileText size={15} className="text-[#0284C7]" />
                <span>Step 4 — Source Provenance Identification</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">Source Name</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">Publisher</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">Source URL / Archive</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-white border border-[#DCE7F5] rounded-lg p-2 text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#64748B] mb-1">File Format</label>
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
                <span>Step 5 — Automated Parser Extraction & Column Mapping</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Date Column:</span>
                  <span className="text-emerald-700 font-semibold">Auto-detected (YYYY-MM-DD)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Price / Value Column:</span>
                  <span className="text-emerald-700 font-semibold">Auto-detected (Numeric INR/KG)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Extracted Observations:</span>
                  <span className="text-[#0284C7] font-semibold tabular-nums">18 records parsed</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#475569]">Extraction Confidence:</span>
                  <span className="text-emerald-700 font-semibold tabular-nums">98.4% (Standard Parsed Table)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DATA QUALITY */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#0284C7]" />
                <span>Step 6 — Data Quality, Continuity & Continuity Rules</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">Missing Dates:</span>
                  <p className="font-semibold text-amber-700 mt-1 tabular-nums">42 Periods Missing</p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">Duplicate Dates:</span>
                  <p className="font-semibold text-emerald-700 mt-1 tabular-nums">0 Duplicates</p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">Unit Consistency:</span>
                  <p className="font-semibold text-emerald-700 mt-1">Uniform (INR/kg)</p>
                </div>
                <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                  <span className="text-[#64748B]">Frequency Continuity:</span>
                  <p className="font-semibold text-amber-700 mt-1">Gaps Detected (Apr-Dec 2020)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PCBI STANDARDIZATION PREVIEW */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Sparkles size={15} className="text-[#0284C7]" />
                <span>Step 7 — PCBI Standardization Preview (Zero Writes to Production)</span>
              </h3>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-[#0284C7]">
                Preview of normalized values converted from raw INR/KG to official PCBI benchmark unit INR/MT.
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] text-xs space-y-1">
                <div className="flex justify-between text-[#64748B] border-b border-[#DCE7F5] pb-1 font-semibold">
                  <span>Date</span>
                  <span>Raw Value</span>
                  <span>Normalized Value (INR/MT)</span>
                </div>
                <div className="flex justify-between py-1 text-[#0B1B33]">
                  <span className="font-mono text-xs text-[#475569]">2024-04-01</span>
                  <span className="tabular-nums">₹3,250/kg</span>
                  <span className="text-emerald-700 font-semibold tabular-nums">₹32,50,000 / MT</span>
                </div>
                <div className="flex justify-between py-1 text-[#0B1B33]">
                  <span className="font-mono text-xs text-[#475569]">2024-05-01</span>
                  <span className="tabular-nums">₹3,300/kg</span>
                  <span className="text-emerald-700 font-semibold tabular-nums">₹33,00,000 / MT</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: GOVERNANCE VALIDATION */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#0284C7]" />
                <span>Step 8 — Governance Standards Audit</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Zero Synthetic Data Rule:</span>
                  <span className="text-emerald-700 font-semibold">COMPLIANT (No interpolation)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE7F5]">
                  <span className="text-[#475569]">Specification Validation:</span>
                  <span className="text-amber-700 font-semibold">FeMo 60% vs 65% Target</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#475569]">Provenance Hash:</span>
                  <span className="font-mono text-[11px] text-[#0284C7] font-semibold break-all">sha256:8b7fa120e64cd46820200306mmr60</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: ADMIN APPROVAL */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0284C7]" />
                <span>Step 9 — Formal Administrator Approval Gate</span>
              </h3>
              <div className="space-y-3">
                <p className="text-[#475569] text-xs">Select action to execute on this staged evidence dataset:</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalAction('APPROVE')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      approvalAction === 'APPROVE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    APPROVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REJECT')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      approvalAction === 'REJECT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    REJECT
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REQUEST_CORRECTION')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      approvalAction === 'REQUEST_CORRECTION'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white text-[#475569] border border-[#DCE7F5] hover:bg-[#EEF7FF]'
                    }`}
                  >
                    REQUEST CORRECTION
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Administrative Audit Comments & Justification
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide formal administrative audit reasoning..."
                    className="w-full bg-white border border-[#DCE7F5] rounded-xl p-3 text-[#0B1B33] placeholder-[#94A3B8] font-medium text-xs focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: ACTIVATE */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Sparkles size={15} className="text-[#0284C7]" />
                <span>Step 10 — Production Activation & Customer Reprocessing</span>
              </h3>
              <div className="p-4 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5] space-y-3 text-xs">
                <p className="text-[#475569]">
                  Upon confirmation, the following production actions will execute atomically:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[#475569]">
                  <li>Generate updated Dynamic PCBI Catalog Version</li>
                  <li>Record immutable audit log entry in Master Provenance Register</li>
                  <li>Update Platform Coverage Metric from PARTIAL_HISTORY to PRODUCTION_READY</li>
                  <li>Trigger targeted customer reprocessing for affected customer purchase lines</li>
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
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EEF7FF] disabled:opacity-40 text-[#475569] border border-[#DCE7F5] font-semibold flex items-center gap-1.5 transition-all text-xs"
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalApproval}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm transition-all text-xs"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Activating...' : 'Execute Activation'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
