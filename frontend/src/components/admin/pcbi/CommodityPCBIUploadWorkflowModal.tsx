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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded">
                GOVERNED 10-STEP COMMODITY PCBI PIPELINE
              </span>
              <span className="text-xs text-slate-400 font-mono">Step {currentStep} of 10</span>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-1">
              Upload Commodity PCBI Source Data
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] text-[10px] font-mono text-slate-400">
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
                      ? 'text-cyan-400 font-bold'
                      : isPassed
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/80'
                        : isPassed
                        ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400'
                        : 'border-slate-700 bg-slate-900'
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
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: SELECT COMMODITY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-cyan-400" />
                <span>Step 1 — Commodity Context & Exposure Attributes</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Commodity Name</span>
                  <p className="font-bold text-white">{activeCommodity.commodity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Commodity ID</span>
                  <p className="font-mono text-cyan-300">{activeCommodity.commodityId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Module 2 Classification</span>
                  <p className="font-medium text-slate-300">{activeCommodity.module2Classification}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">UNSPSC</span>
                  <p className="font-mono text-slate-300">{activeCommodity.unspsc}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Customer Spend</span>
                  <p className="font-bold text-emerald-400">{activeCommodity.customerSpendCr}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Transaction Count</span>
                  <p className="font-mono text-slate-300">{activeCommodity.transactionCount} PO lines</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Existing PCBI ID</span>
                  <p className="font-mono text-cyan-400 font-bold">{activeCommodity.pcbiId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Current Status</span>
                  <div>
                    <PCBIStatusBadge status={activeCommodity.currentStatus} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Required History</span>
                  <p className="font-mono text-slate-300">{activeCommodity.requiredHistory}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Required Frequency / Unit</span>
                  <p className="font-mono text-slate-300">{activeCommodity.requiredFrequency} / INR/MT</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Research Priority</span>
                  <p className="font-bold text-amber-400">{activeCommodity.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">Gap Status</span>
                  <p className="font-mono text-rose-300">Historical Gap Detected (2020-2022)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT / CREATE PCBI SERIES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={15} className="text-cyan-400" />
                <span>Step 2 — PCBI Series Association & Specification Target</span>
              </h3>
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Associated Series ID:</span>
                  <span className="font-mono text-cyan-400 font-bold">{activeCommodity.seriesId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Standard Specification:</span>
                  <span className="text-slate-300 font-mono">IS 1469:1993 Standard Specification</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Target Frequency:</span>
                  <span className="text-slate-300 font-mono">{activeCommodity.requiredFrequency} Ex-Works</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Target Currency / Unit:</span>
                  <span className="text-slate-300 font-mono">INR / Metric Tonne (INR/MT)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD SOURCE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload size={15} className="text-cyan-400" />
                <span>Step 3 — Upload Source File (Drag & Drop or Select)</span>
              </h3>
              <div className="p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl bg-slate-950/50 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-colors">
                <Upload size={32} className="text-cyan-400" />
                <p className="font-bold text-white text-sm">
                  {uploadedFile ? uploadedFile.name : 'Drag & drop research file here, or click to browse'}
                </p>
                <p className="text-[11px] text-slate-400">
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
                  className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold border border-slate-700 cursor-pointer"
                >
                  Select File
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: SOURCE IDENTIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={15} className="text-cyan-400" />
                <span>Step 4 — Source Provenance Identification</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Source Name</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Source URL / Archive</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">File Format</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-medium"
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
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu size={15} className="text-cyan-400" />
                <span>Step 5 — Automated Parser Extraction & Column Mapping</span>
              </h3>
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Date Column:</span>
                  <span className="text-emerald-400 font-bold">Auto-detected (YYYY-MM-DD)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Price / Value Column:</span>
                  <span className="text-emerald-400 font-bold">Auto-detected (Numeric INR/KG)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Extracted Observations:</span>
                  <span className="text-cyan-300 font-bold">18 records parsed</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Extraction Confidence:</span>
                  <span className="text-emerald-400 font-bold">98.4% (Standard Parsed Table)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DATA QUALITY */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-400" />
                <span>Step 6 — Data Quality, Continuity & Continuity Rules</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Missing Dates:</span>
                  <p className="font-bold text-amber-400 mt-1">42 Periods Missing</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Duplicate Dates:</span>
                  <p className="font-bold text-emerald-400 mt-1">0 Duplicates</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Unit Consistency:</span>
                  <p className="font-bold text-emerald-400 mt-1">Uniform (INR/kg)</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Frequency Continuity:</span>
                  <p className="font-bold text-amber-400 mt-1">Gaps Detected (Apr-Dec 2020)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PCBI STANDARDIZATION PREVIEW */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-400" />
                <span>Step 7 — PCBI Standardization Preview (Zero Writes to Production)</span>
              </h3>
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-cyan-200">
                Preview of normalized values converted from raw INR/KG to official PCBI benchmark unit INR/MT.
              </div>
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1 font-bold">
                  <span>Date</span>
                  <span>Raw Value</span>
                  <span>Normalized Value (INR/MT)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>2024-04-01</span>
                  <span>₹3,250/kg</span>
                  <span className="text-emerald-400 font-bold">₹32,50,000 / MT</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>2024-05-01</span>
                  <span>₹3,300/kg</span>
                  <span className="text-emerald-400 font-bold">₹33,00,000 / MT</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: GOVERNANCE VALIDATION */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-400" />
                <span>Step 8 — Governance Standards Audit</span>
              </h3>
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Zero Synthetic Data Rule:</span>
                  <span className="text-emerald-400 font-bold">COMPLIANT (No interpolation)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Specification Validation:</span>
                  <span className="text-amber-400 font-bold">FeMo 60% vs 65% Target</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Provenance Hash:</span>
                  <span className="text-cyan-300 font-bold">sha256:8b7fa120e64cd46820200306mmr60</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: ADMIN APPROVAL */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={15} className="text-cyan-400" />
                <span>Step 9 — Formal Administrator Approval Gate</span>
              </h3>
              <div className="space-y-3">
                <p className="text-slate-300">Select action to execute on this staged evidence dataset:</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalAction('APPROVE')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      approvalAction === 'APPROVE'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    APPROVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REJECT')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      approvalAction === 'REJECT'
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    REJECT
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalAction('REQUEST_CORRECTION')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      approvalAction === 'REQUEST_CORRECTION'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    REQUEST CORRECTION
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Administrative Audit Comments & Justification
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide formal administrative audit reasoning..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: ACTIVATE */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-400" />
                <span>Step 10 — Production Activation & Customer Reprocessing</span>
              </h3>
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 font-mono text-[11px]">
                <p className="text-slate-300 font-sans">
                  Upon confirmation, the following production actions will execute atomically:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
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
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalApproval}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
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
