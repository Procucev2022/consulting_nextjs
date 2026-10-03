'use client';

/**
 * Enterprise Admin Portal — Commodity PCBI Workspace Modal
 * 12-Tab Continuous Commodity Research & Multi-Source Evidence Workspace
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  CheckCircle,
  Layers,
  ShieldAlert,
  CheckSquare
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { COMMODITY_WORKSPACE_TABS, COMMODITY_DATA_UPLOAD_BANNER } from '../../../constants/pcbiCommodityDataLab';
import { pcbiCommodityDataLabApi } from '../../../utils/pcbiCommodityDataLabApi';
import frontendLogger from '../../../utils/logger';
import type { CommodityWorkspaceModalProps } from '../../../types/components';
import type {
  CommodityWorkspaceDetail,
  CommodityWorkspaceTabKey
} from '../../../types/pcbiCommodityDataLab';

export const CommodityWorkspaceModal: React.FC<CommodityWorkspaceModalProps> = ({
  isOpen,
  pcbiId,
  onClose,
  onSourceUploaded,
  onDataApproved
}) => {
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<CommodityWorkspaceTabKey>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(true);
  const [workspace, setWorkspace] = useState<CommodityWorkspaceDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<{ title: string; message: string } | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (tabToLoad: CommodityWorkspaceTabKey = 'OVERVIEW') => {
    if (!pcbiId) return;
    setLoading(true);
    setUploadError(null);
    try {
      const res = await pcbiCommodityDataLabApi.getCommodityWorkspace(pcbiId, tabToLoad);
      if (res.success && res.workspace) {
        setWorkspace(res.workspace);
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to load Commodity Workspace detail', {
        pcbiId,
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setLoading(false);
    }
  }, [pcbiId]);

  useEffect(() => {
    if (isOpen && pcbiId) {
      loadWorkspace('OVERVIEW');
      setActiveTab('OVERVIEW');
      setSelectedFile(null);
      setUploadError(null);
      setUploadSuccess(null);
      setApprovalMessage(null);
    }
  }, [isOpen, pcbiId, loadWorkspace]);

  if (!isOpen || !pcbiId) return null;

  const handleTabClick = (tabKey: CommodityWorkspaceTabKey): void => {
    setActiveTab(tabKey);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(null);

    // Pre-flight domain check
    try {
      const res = await pcbiCommodityDataLabApi.detectUploadDomain(
        file.name,
        '',
        'COMMODITY_DATA_LAB'
      );
      if (res?.detection && !res.detection.isAllowedInTarget) {
        const title = res.detection.errorMessage || (
          res.detection.detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
            ? 'CUSTOMER DATA DETECTED'
            : 'COMMODITY RESEARCH DATA DETECTED'
        );
        const message = res.detection.guidanceMessage || (
          res.detection.detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
            ? 'Customer purchase history must be uploaded through Module 1.'
            : 'This file belongs in PCBI Commodity Data Lab.'
        );
        setUploadError({
          title,
          message
        });
      }
    } catch (err: unknown) {
      frontendLogger.warn('Pre-flight domain detection call failed', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleExecuteUpload = async (): Promise<void> => {
    if (!selectedFile || !workspace) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const ext = selectedFile.name.split('.').pop()?.toUpperCase() || 'CSV';
    const validExts = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;
    const fileType = validExts.includes(ext as (typeof validExts)[number])
      ? (ext as (typeof validExts)[number])
      : 'CSV';

    try {
      const res = await pcbiCommodityDataLabApi.uploadCommoditySource({
        commodityId: workspace.overview.commodityId,
        pcbiId: workspace.overview.pcbiId,
        seriesId: workspace.overview.seriesId,
        sourceName: `${workspace.overview.commodityName} Primary Evidence Pack`,
        publisher: 'Staged Commodity Research Source',
        documentName: selectedFile.name,
        fileType,
        geography: workspace.overview.requiredGeography,
        unit: workspace.overview.requiredUnit,
        currency: workspace.overview.requiredCurrency,
        frequency: workspace.overview.requiredFrequency
      });

      if (res.success) {
        setUploadSuccess(
          `Evidence Object ${res.source.sourceId} (${res.source.documentName}) successfully staged in Commodity Data Lab.`
        );
        setSelectedFile(null);
        await loadWorkspace('SOURCE_REGISTER');
        setActiveTab('SOURCE_REGISTER');
        onSourceUploaded?.();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('CUSTOMER DATA DETECTED')) {
        setUploadError({
          title: UI_STRINGS.pcbiCommodityDataLab.customerDataDetectedTitle,
          message: UI_STRINGS.pcbiCommodityDataLab.customerDataDetectedMsg
        });
      } else if (errMsg.includes('PCBI MASTER DATA DETECTED')) {
        setUploadError({
          title: UI_STRINGS.pcbiCommodityDataLab.masterDataDetectedTitle,
          message: UI_STRINGS.pcbiCommodityDataLab.masterDataDetectedMsg
        });
      } else {
        setUploadError({
          title: 'UPLOAD FAILED',
          message: errMsg
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdminApproval = async (): Promise<void> => {
    if (!workspace) return;
    setIsApproving(true);
    try {
      const res = await pcbiCommodityDataLabApi.approveCommodityData({
        commodityId: workspace.overview.commodityId,
        pcbiId: workspace.overview.pcbiId,
        approverName: 'Sriman Lead Admin',
        comments: 'Verified multi-source evidence and research pack methodology'
      });

      if (res.success) {
        setApprovalMessage(res.result.message);
        await loadWorkspace('APPROVAL');
        onDataApproved?.(res.result.catalogVersionId);
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to approve commodity data', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B33]/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#DCE7F5] rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-[#F8FBFE] border-b border-[#DCE7F5] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7]">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-sky-100 text-[#0284C7] border border-sky-200 px-2 py-0.5 rounded font-bold">
                  {UI_STRINGS.pcbiCommodityDataLab.commodityWorkspaceTitle}
                </span>
                <span className="text-xs text-[#64748B] font-mono font-medium">
                  {workspace?.overview.pcbiId || pcbiId}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#0B1B33] tracking-tight mt-0.5">
                {workspace?.overview.commodityName || 'Commodity Research Workspace'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close workspace modal"
            className="w-8 h-8 rounded-lg bg-white hover:bg-[#EEF7FF] text-[#64748B] hover:text-[#0B1B33] border border-[#DCE7F5] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prominent Upload Banner: COMMODITY DATA UPLOAD — NOT PCBI MASTER */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-amber-800 font-bold tracking-wide">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>{COMMODITY_DATA_UPLOAD_BANNER}</span>
          </div>
          <div className="text-[11px] text-[#475569] font-mono flex items-center gap-2">
            <span>Workflow: UPLOAD → EXTRACT → STANDARDIZE → VALIDATE → COMPARE → METHODOLOGY → APPROVAL</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Zero Production Writes Before Approval
            </span>
          </div>
        </div>

        {/* 12 Tabs Navigation Bar */}
        <div className="bg-white border-b border-[#DCE7F5] px-6 overflow-x-auto scrollbar-thin">
          <nav className="flex space-x-1 py-2 text-xs font-semibold whitespace-nowrap">
            {COMMODITY_WORKSPACE_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabClick(tab.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-sky-50 text-[#0284C7] border border-sky-200 shadow-xs font-semibold'
                      : 'text-[#64748B] hover:text-[#0B1B33] hover:bg-[#EEF7FF]'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Modal Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#EEF7FF] text-xs">
          {loading && !workspace ? (
            <div className="flex items-center justify-center py-16 text-[#0284C7] font-medium font-mono">
              Loading Commodity PCBI Workspace Details...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'OVERVIEW' && workspace && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white border border-[#DCE7F5] shadow-xs rounded-xl">
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Commodity</div>
                      <div className="text-sm font-bold text-[#0B1B33] mt-1">{workspace.overview.commodityName}</div>
                      <div className="text-[10px] text-[#0284C7] font-mono mt-0.5 font-semibold">{workspace.overview.commodityId}</div>
                    </div>
                    <div className="p-3 bg-white border border-[#DCE7F5] shadow-xs rounded-xl">
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Module 2 Classification</div>
                      <div className="text-sm font-bold text-[#0B1B33] mt-1">{workspace.overview.module2Classification}</div>
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5">UNSPSC: {workspace.overview.unspsc}</div>
                    </div>
                    <div className="p-3 bg-white border border-[#DCE7F5] shadow-xs rounded-xl">
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Customer Spend</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1 tabular-nums">{workspace.overview.customerSpendCr}</div>
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5 tabular-nums">{workspace.overview.transactionCount} transactions</div>
                    </div>
                    <div className="p-3 bg-white border border-[#DCE7F5] shadow-xs rounded-xl">
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Current Status</div>
                      <div className="text-xs font-bold mt-1 text-amber-700">{workspace.overview.currentStatus}</div>
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5">{workspace.overview.priority}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl space-y-2 shadow-xs">
                    <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Governance & Coverage Requirements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[#475569]">
                      <div><span className="text-[#64748B]">Required Period:</span> {workspace.overview.requiredStartDate} to {workspace.overview.requiredEndDate}</div>
                      <div><span className="text-[#64748B]">Required Frequency:</span> {workspace.overview.requiredFrequency}</div>
                      <div><span className="text-[#64748B]">Required Unit/Curr:</span> {workspace.overview.requiredUnit} ({workspace.overview.requiredCurrency})</div>
                      <div><span className="text-[#64748B]">Geography:</span> {workspace.overview.requiredGeography}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RESEARCH QUEUE */}
              {activeTab === 'RESEARCH_QUEUE' && workspace && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[#0B1B33] font-bold">Research Backlog Priority: {workspace.overview.priority}</div>
                      <div className="text-[#64748B] text-[11px] mt-0.5">Status: {workspace.overview.researchStatus} | Last Updated: {workspace.overview.lastUpdated}</div>
                    </div>
                    <span className="px-3 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px] font-semibold">
                      HIGH IMPACT QUEUE ITEM
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOAD DATA */}
              {activeTab === 'UPLOAD_DATA' && workspace && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <div className="text-amber-800 font-bold text-xs">{COMMODITY_DATA_UPLOAD_BANNER}</div>
                    <div className="text-[11px] text-[#475569] mt-1">
                      Uploads in this workspace are strictly staged as research evidence and automatically linked to{' '}
                      <span className="font-mono text-[#0284C7] font-semibold">{workspace.overview.pcbiId}</span>.
                    </div>
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800">
                      <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-rose-900">{uploadError.title}</div>
                        <div className="text-[11px] mt-0.5 text-rose-700">{uploadError.message}</div>
                      </div>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs font-semibold">{uploadSuccess}</div>
                    </div>
                  )}

                  <div className="p-6 bg-white border-2 border-dashed border-[#DCE7F5] hover:border-[#0284C7] rounded-2xl text-center transition-all shadow-xs">
                    <Upload size={32} className="mx-auto text-[#64748B] mb-2" />
                    <div className="text-[#0B1B33] font-bold text-sm">Select Commodity Research File</div>
                    <div className="text-[#64748B] text-xs mt-1">
                      Accepts XLSX, XLS, CSV, PDF, JSON, TXT
                    </div>
                    <input
                      id={fileInputId}
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf,.json,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor={fileInputId}
                      className="mt-4 inline-block px-4 py-2 bg-white hover:bg-[#EEF7FF] text-[#0284C7] border border-[#DCE7F5] rounded-xl font-semibold cursor-pointer transition-all shadow-xs"
                    >
                      Browse Files
                    </label>
                    {selectedFile && (
                      <div className="mt-3 text-[#0284C7] font-mono text-xs font-semibold">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!selectedFile || isUploading}
                    onClick={handleExecuteUpload}
                    className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Upload size={14} />
                    <span>{isUploading ? 'Staging Evidence Object...' : 'Upload & Stage Evidence Object'}</span>
                  </button>
                </div>
              )}

              {/* TAB 4: SOURCE REGISTER */}
              {activeTab === 'SOURCE_REGISTER' && workspace && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-mono">
                      {workspace.sources.length} Coexisting Sources Registered
                    </span>
                    <span className="text-amber-700 font-mono text-[11px] font-semibold">
                      {UI_STRINGS.pcbiCommodityDataLab.sourcesCoexistenceNotice}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#DCE7F5] rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FBFE] text-[#64748B] font-mono text-[10px] uppercase border-b border-[#DCE7F5]">
                        <tr>
                          <th className="py-2.5 px-3">Source ID</th>
                          <th className="py-2.5 px-3">Source Name / Publisher</th>
                          <th className="py-2.5 px-3">Document / Type</th>
                          <th className="py-2.5 px-3">Specification / Unit</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Coverage</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE7F5] font-sans">
                        {workspace.sources.map((src) => (
                          <tr key={src.sourceId} className="hover:bg-[#EEF7FF]">
                            <td className="py-2.5 px-3 font-mono text-[#0284C7] font-semibold">{src.sourceId}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#0B1B33]">{src.sourceName}</div>
                              <div className="text-[10px] text-[#64748B]">{src.publisher}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-[#0B1B33] font-mono text-[11px] truncate max-w-xs">{src.documentName}</div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-[#DCE7F5]">{src.fileType}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-[#475569]">{src.gradeSpecification}</div>
                              <div className="text-[10px] text-[#64748B] font-mono">{src.unit} ({src.currency})</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#475569]">{src.frequency}</td>
                            <td className="py-2.5 px-3 text-[#64748B] text-[11px]">{src.historicalCoverage}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                src.approvalStatus === 'ADMIN_APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {src.approvalStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: EXTRACTED OBSERVATIONS */}
              {activeTab === 'EXTRACTED_OBSERVATIONS' && workspace && (
                <div className="space-y-4">
                  <div className="text-[#64748B] text-xs font-mono">
                    {workspace.extractedObservations.length} Extracted Raw Data Points
                  </div>
                  <div className="overflow-x-auto border border-[#DCE7F5] rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FBFE] text-[#64748B] font-mono text-[10px] uppercase border-b border-[#DCE7F5]">
                        <tr>
                          <th className="py-2.5 px-3">Obs ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Raw Value</th>
                          <th className="py-2.5 px-3">Normalized Value</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE7F5] font-sans">
                        {workspace.extractedObservations.map((obs) => (
                          <tr key={obs.observationId} className="hover:bg-[#EEF7FF]">
                            <td className="py-2.5 px-3 font-mono text-[#0284C7] font-semibold">{obs.observationId}</td>
                            <td className="py-2.5 px-3 font-mono text-[#475569]">{obs.sourceDate}</td>
                            <td className="py-2.5 px-3 text-[#475569] tabular-nums">{obs.rawValue} {obs.rawUnit}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">{obs.normalizedValue.toLocaleString()} {obs.normalizedUnit}</td>
                            <td className="py-2.5 px-3 font-mono text-[#64748B]">{obs.frequency}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px]">
                                {obs.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: STANDARDIZATION PREVIEW */}
              {activeTab === 'STANDARDIZATION_PREVIEW' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Harmonization & Transformation Pipeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] font-mono text-[10px]">Unit Conversion</div>
                      <div className="font-bold text-[#0B1B33] mt-1">INR/KG → INR/MT (×1000)</div>
                    </div>
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] font-mono text-[10px]">Currency Alignment</div>
                      <div className="font-bold text-[#0B1B33] mt-1">Direct Domestic INR (Ex-Works)</div>
                    </div>
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] font-mono text-[10px]">Frequency Mapping</div>
                      <div className="font-bold text-[#0B1B33] mt-1">Weekly Step-Harmonization</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SOURCE COMPARISON */}
              {activeTab === 'SOURCE_COMPARISON' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Multi-Source Cross-Publisher Correlation</h3>
                  <div className="text-[#64748B] text-xs">
                    Comparison across {workspace.sources.length} active coexisting sources:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workspace.sources.map((s) => (
                      <div key={s.sourceId} className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                        <div className="font-bold text-[#0284C7]">{s.sourceName}</div>
                        <div className="text-[11px] text-[#64748B] mt-1">Publisher: {s.publisher}</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">Coverage: {s.historicalCoverage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: METHODOLOGY */}
              {activeTab === 'METHODOLOGY' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">{workspace.methodologyDetails.title}</h3>
                  <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg text-[#475569] text-xs">
                    <div><span className="text-[#64748B]">Methodology ID:</span> {workspace.methodologyDetails.methodologyId}</div>
                    <div className="mt-1"><span className="text-[#64748B]">Conversion Rule:</span> {workspace.methodologyDetails.conversionRule}</div>
                    <div className="mt-1"><span className="text-[#64748B]">Governance:</span> {workspace.methodologyDetails.governanceNotes}</div>
                  </div>
                </div>
              )}

              {/* TAB 9: VALIDATION */}
              {activeTab === 'VALIDATION' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Data Lab Quality & Validation Check</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] text-[10px]">Total Observations</div>
                      <div className="font-bold text-[#0B1B33] mt-1 tabular-nums">{workspace.validationSummary.totalObservations}</div>
                    </div>
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] text-[10px]">Valid Observations</div>
                      <div className="font-bold text-emerald-700 mt-1 tabular-nums">{workspace.validationSummary.validObservations}</div>
                    </div>
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] text-[10px]">Missing Periods</div>
                      <div className="font-bold text-amber-700 mt-1 tabular-nums">{workspace.validationSummary.missingPeriods.length}</div>
                    </div>
                    <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg">
                      <div className="text-[#64748B] text-[10px]">Critical Errors</div>
                      <div className="font-bold text-rose-700 mt-1 tabular-nums">{workspace.validationSummary.criticalErrorsCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10: APPROVAL */}
              {activeTab === 'APPROVAL' && workspace && (
                <div className="space-y-4 max-w-xl mx-auto p-6 bg-white border border-[#DCE7F5] rounded-2xl text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7] mx-auto">
                    <CheckSquare size={24} />
                  </div>
                  <h3 className="font-bold text-[#0B1B33] text-base">Admin Governance Approval Gate</h3>
                  <p className="text-[#64748B] text-xs">
                    {UI_STRINGS.pcbiCommodityDataLab.zeroProductionWritesNotice}
                  </p>

                  <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-left text-xs space-y-1">
                    <div><span className="text-[#64748B]">Gate Status:</span> <span className="font-mono text-[#0284C7] font-bold">{workspace.approvalPackage.approvalGateStatus}</span></div>
                    <div><span className="text-[#64748B]">Catalog Write Authorized:</span> <span className="font-bold text-[#0B1B33]">{workspace.approvalPackage.canWriteToCatalog ? 'YES' : 'NO'}</span></div>
                    {workspace.approvalPackage.approverName && (
                      <div><span className="text-[#64748B]">Approved By:</span> <span className="text-[#0B1B33] font-medium">{workspace.approvalPackage.approverName} ({workspace.approvalPackage.approvedAt})</span></div>
                    )}
                  </div>

                  {approvalMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                      {approvalMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={handleAdminApproval}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={14} />
                    <span>{isApproving ? 'Promoting to PCBI Catalog...' : UI_STRINGS.pcbiCommodityDataLab.adminApproveButton}</span>
                  </button>
                </div>
              )}

              {/* TAB 11: VERSION HISTORY */}
              {activeTab === 'VERSION_HISTORY' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Staged Research Iteration History</h3>
                  <div className="text-[#64748B] text-xs">
                    Audit trail of all evidence file uploads, extraction runs, and methodology revisions for this commodity series.
                  </div>
                </div>
              )}

              {/* TAB 12: PCBI HISTORY */}
              {activeTab === 'PCBI_HISTORY' && workspace && (
                <div className="space-y-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-xs">
                  <h3 className="font-bold text-[#0B1B33] text-xs uppercase tracking-wide">Historical Index Trajectory</h3>
                  <div className="text-[#64748B] text-xs">
                    Baseline index series for {workspace.overview.commodityName} ({workspace.overview.pcbiId}).
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
