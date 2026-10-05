'use client';

/**
 * Enterprise Analysis Control Center (Prompt 302, Sections 7–21, 36–40)
 * Admin-only operations hub for PCBI Quality Gates, Data Correction & Report Approvals
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileCheck2,
  Download,
  Upload,
  Send,
  Sparkles,
  ShieldCheck,
  Filter,
  CheckSquare,
  History,
  FileText,
  FileSpreadsheet,
  X,
  Ban
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { orchestrationApi } from '../../../utils/orchestrationApi';
import { EvidenceWorkbooksPanel } from './EvidenceWorkbooksPanel';
import type {
  AnalysisJob,
  AnalysisJobDetailPayload,
  AnalysisJobStatus,
  PCBIGapCategory,
  PCBIResolutionAction,
  PCBIExclusionReason,
  ReanalysisReason,
  AdminQualityGateChecklist,
  AdminOrchestrationKPIs,
  DataVersionDiffSummary
} from '../../../types/analysisOrchestration';
import { EXCLUSION_REASONS, REANALYSIS_REASONS } from '../../../constants/analysisOrchestration';

export function AnalysisControlCenter(): React.ReactElement {
  // Main Jobs State
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [kpis, setKpis] = useState<AdminOrchestrationKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Job for Detailed Workspace
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<AnalysisJobDetailPayload | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'readiness' | 'pcbiGaps' | 'dataCorrection' | 'qualityGate' | 'evidence' | 'audit'>('readiness');

  // Interactive Action Feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // PCBI Gap Resolution Modal
  const [selectedGap, setSelectedGap] = useState<PCBIGapCategory | null>(null);
  const [resolutionAction, setResolutionAction] = useState<PCBIResolutionAction>('MAP_EXISTING');
  const [targetSeries, setTargetSeries] = useState('');
  const [exclusionReason, setExclusionReason] = useState<PCBIExclusionReason>('NOT_BENCHMARKABLE');
  const [exclusionNotes, setExclusionNotes] = useState('');
  const [submittingGap, setSubmittingGap] = useState(false);

  // Data Correction Modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctedFileName, setCorrectedFileName] = useState('');
  const [reanalysisReason, setReanalysisReason] = useState<ReanalysisReason>('INCORRECT_CATEGORY_MAPPING');
  const [reanalysisNotes, setReanalysisNotes] = useState('');
  const [lastDiff, setLastDiff] = useState<DataVersionDiffSummary | null>(null);
  const [submittingUpload, setSubmittingUpload] = useState(false);

  // Quality Gate Checklist State
  const [checklist, setChecklist] = useState<AdminQualityGateChecklist>({
    dataQuality: { sourceDataValidated: true, spendReconciles: true, duplicateChecksCompleted: true, classificationReviewed: true },
    pcbi: { requiredPcbiCategoriesResolved: false, benchmarkSourcesValidated: true, exclusionsDocumented: true, pcbiCoverageAcceptable: false },
    financial: { savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true },
    report: { module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true }
  });
  const [submittingChecklist, setSubmittingChecklist] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Load KPI & Job Directory
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setActionError(null);
      const [jobsData, kpisData] = await Promise.all([
        orchestrationApi.getJobs({ status: statusFilter, search: searchTerm }),
        orchestrationApi.getAdminKPIs()
      ]);
      setJobs(jobsData);
      setKpis(kpisData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analysis control center data';
      setActionError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Detailed Workspace for Selected Job
  const loadJobWorkspace = useCallback(async (jobId: string) => {
    try {
      setLoadingDetails(true);
      setActionError(null);
      const details = await orchestrationApi.getJobDetails(jobId);
      if (details) {
        setJobDetails(details);
        if (details.checklist) {
          setChecklist(details.checklist);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load job workspace';
      setActionError(msg);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleSelectJob = (jobId: string): void => {
    setSelectedJobId(jobId);
    loadJobWorkspace(jobId);
  };

  // Resolve PCBI Gap Submit
  const handleResolveGap = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedJobId || !selectedGap) return;

    try {
      setSubmittingGap(true);
      setActionError(null);
      const res = await orchestrationApi.resolvePCBIGap(selectedJobId, selectedGap.gapId, {
        action: resolutionAction,
        targetPcbiSeries: targetSeries || undefined,
        exclusionReason: resolutionAction === 'EXCLUDE' ? exclusionReason : undefined,
        exclusionNotes: resolutionAction === 'EXCLUDE' ? exclusionNotes : undefined
      });

      if (res.success) {
        setActionSuccess(`PCBI Gap ${selectedGap.relevantClassification} resolved`);
        setSelectedGap(null);
        await loadJobWorkspace(selectedJobId);
        await loadData();
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to resolve PCBI gap');
    } finally {
      setSubmittingGap(false);
    }
  };

  // Upload Corrected Dataset Submit
  const handleUploadCorrectedData = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedJobId) return;

    try {
      setSubmittingUpload(true);
      setActionError(null);
      const res = await orchestrationApi.uploadCorrectedDataset(selectedJobId, {
        fileName: correctedFileName || 'Corrected_Spend_Analysis_v2.xlsx',
        reason: reanalysisReason,
        notes: reanalysisNotes || undefined
      });

      if (res.success) {
        setActionSuccess(res.message);
        if (res.diff) setLastDiff(res.diff);
        setIsCorrectionModalOpen(false);
        setCorrectedFileName('');
        setReanalysisNotes('');
        await loadJobWorkspace(selectedJobId);
        await loadData();
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload corrected dataset');
    } finally {
      setSubmittingUpload(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async (): Promise<void> => {
    if (!selectedJobId) return;
    try {
      setActionError(null);
      const res = await orchestrationApi.generateReport(selectedJobId);
      if (res.success) {
        setActionSuccess(res.message);
        await loadJobWorkspace(selectedJobId);
        await loadData();
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  // Confirm Quality Gate Checklist
  const handleConfirmChecklist = async (): Promise<void> => {
    if (!selectedJobId) return;
    try {
      setSubmittingChecklist(true);
      setActionError(null);
      const res = await orchestrationApi.confirmQualityGate(selectedJobId, checklist);
      if (res.success) {
        setActionSuccess(res.message);
        await loadJobWorkspace(selectedJobId);
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm checklist');
    } finally {
      setSubmittingChecklist(false);
    }
  };

  // Approve & Submit Report to Customer
  const handleApproveAndSubmit = async (reportVersionId: string): Promise<void> => {
    if (!selectedJobId) return;
    try {
      setSubmittingApproval(true);
      setActionError(null);
      const res = await orchestrationApi.approveAndSubmitReport(selectedJobId, reportVersionId);
      if (res.success) {
        setActionSuccess(res.message);
        await loadJobWorkspace(selectedJobId);
        await loadData();
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve report');
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Resend Report Notification
  const handleResendEmail = async (reportVersionId: string): Promise<void> => {
    if (!selectedJobId) return;
    try {
      const res = await orchestrationApi.resendNotification(selectedJobId, reportVersionId);
      if (res.success) {
        setActionSuccess(res.message);
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to resend notification');
    }
  };

  // Supersede Report
  const handleSupersedeReport = async (reportVersionId: string): Promise<void> => {
    if (!selectedJobId) return;
    const reason = window.prompt('Please enter the reason for superseding this report:');
    if (!reason) return;

    try {
      const res = await orchestrationApi.supersedeReport(selectedJobId, reportVersionId, reason);
      if (res.success) {
        setActionSuccess(res.message);
        await loadJobWorkspace(selectedJobId);
        await loadData();
      } else {
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to supersede report');
    }
  };

  const getStatusBadge = (status: AnalysisJobStatus): { label: string; bg: string; text: string } => {
    switch (status) {
      case 'SUBMITTED_TO_CUSTOMER':
      case 'CUSTOMER_VIEWED':
        return { label: 'SUBMITTED', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
      case 'CUSTOMER_ACKNOWLEDGED':
        return { label: 'ACKNOWLEDGED', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
      case 'ADMIN_APPROVED':
        return { label: 'READY TO SUBMIT', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' };
      case 'REPORT_GENERATED':
      case 'ADMIN_REVIEW':
        return { label: 'ADMIN REVIEW', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' };
      case 'READY_FOR_GENERATION':
        return { label: 'READY TO GENERATE', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' };
      case 'PCBI_REVIEW_REQUIRED':
      case 'PCBI_REVIEW_IN_PROGRESS':
        return { label: 'PCBI REVIEW', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
      case 'ANALYSIS_BLOCKED':
        return { label: 'BLOCKED', bg: 'bg-red-50 border-red-200', text: 'text-red-700' };
      default:
        return { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    }
  };

  return (
    <div data-testid="analysis-control-center" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE7F5] pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#0B1B33] flex items-center gap-2.5">
            <Layers size={24} className="text-[#0284C7]" />
            {UI_STRINGS.orchestration.controlCenterTitle}
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {UI_STRINGS.orchestration.controlCenterSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg border border-[#DCE7F5] bg-white text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F8FBFE] transition-colors shadow-xs"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)}><X size={14} /></button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}

      {/* SLA & KPI Metrics Bar (Prompt 302, Section 36 & 37) */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiNewAnalyses}</span>
            <span className="text-base font-extrabold text-[#0B1B33] mt-1 block">{kpis.newAnalyses}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiPcbiReviewsPending}</span>
            <span className="text-base font-extrabold text-amber-600 mt-1 block">{kpis.pcbiReviewsPending}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiDataCorrectionsPending}</span>
            <span className="text-base font-extrabold text-teal-600 mt-1 block">{kpis.dataCorrectionsPending}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiReportsPendingReview}</span>
            <span className="text-base font-extrabold text-indigo-600 mt-1 block">{kpis.reportsPendingReview}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiReportsReadyToSubmit}</span>
            <span className="text-base font-extrabold text-purple-600 mt-1 block">{kpis.reportsReadyToSubmit}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiCustomerAcksPending}</span>
            <span className="text-base font-extrabold text-blue-600 mt-1 block">{kpis.customerAcknowledgementsPending}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#DCE7F5] shadow-xs">
            <span className="text-[#64748B] block font-medium">{UI_STRINGS.orchestration.kpiBlockedAnalyses}</span>
            <span className="text-base font-extrabold text-red-600 mt-1 block">{kpis.blockedAnalyses}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#DCE7F5] shadow-xs text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={16} className="text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, job ID or tenant..."
            className="w-full bg-transparent focus:outline-hidden text-[#0B1B33]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={14} className="text-[#64748B] mr-1" />
          {[
            { id: 'ALL', label: UI_STRINGS.orchestration.filterAll },
            { id: 'PCBI_REVIEW_REQUIRED', label: UI_STRINGS.orchestration.filterPcbiReview },
            { id: 'READY_FOR_GENERATION', label: UI_STRINGS.orchestration.filterReadyToGenerate },
            { id: 'ADMIN_REVIEW', label: UI_STRINGS.orchestration.filterAdminReview },
            { id: 'SUBMITTED_TO_CUSTOMER', label: UI_STRINGS.orchestration.filterSubmitted },
            { id: 'CUSTOMER_ACKNOWLEDGED', label: UI_STRINGS.orchestration.filterAcknowledged },
            { id: 'ANALYSIS_BLOCKED', label: UI_STRINGS.orchestration.filterBlocked }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="bg-white rounded-xl border border-[#DCE7F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FBFE] text-[#64748B] border-b border-[#DCE7F5] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Spend Analysed</th>
                <th className="py-3 px-4">Data Version</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Elapsed Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#64748B]">
                    Loading analysis pipeline jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#64748B]">
                    No analysis jobs found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const badge = getStatusBadge(job.status);
                  const isSelected = selectedJobId === job.analysisJobId;

                  // Elapsed hours calculation
                  const elapsedHours = Math.max(
                    1,
                    Math.round((Date.now() - new Date(job.createdAt).getTime()) / 3600000)
                  );

                  return (
                    <tr
                      key={job.analysisJobId}
                      className={`hover:bg-[#F8FBFE] transition-colors ${isSelected ? 'bg-[#F0F7FF]' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-bold text-[#0B1B33]">
                        <span className="block">{job.customerName}</span>
                        <span className="font-mono text-[#64748B] text-[11px]">{job.analysisJobId}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">{job.analysisPeriod}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0284C7]">
                        ₹{job.totalSpendCr.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#475569]">
                        {job.currentDataVersionId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Clock size={12} />
                          {elapsedHours}h / 48h
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectJob(job.analysisJobId)}
                          className="px-3 py-1.5 rounded-md border border-[#0284C7] bg-white text-[#0284C7] hover:bg-[#0284C7] hover:text-white font-bold transition-all shadow-xs"
                        >
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Analysis Workspace Modal / Drawer */}
      {selectedJobId && jobDetails && (
        <div className="bg-white rounded-xl border border-[#DCE7F5] shadow-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE7F5] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#0284C7]/10 text-[#0284C7] font-mono text-xs font-bold">
                  {jobDetails.job.analysisJobId}
                </span>
                <h3 className="text-base font-extrabold text-[#0B1B33]">
                  {jobDetails.job.customerName}
                </h3>
                {loadingDetails && (
                  <span className="text-[11px] text-[#0284C7] font-semibold animate-pulse">
                    Updating...
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Data Version: <strong>{jobDetails.job.currentDataVersionId}</strong> • Uploaded by:{' '}
                <strong>{jobDetails.job.uploadedBy}</strong> • Total Spend:{' '}
                <strong className="text-[#0284C7]">₹{jobDetails.job.totalSpendCr.toFixed(2)} Cr</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Close Workspace"
                onClick={() => setSelectedJobId(null)}
                className="p-1.5 rounded-md text-[#64748B] hover:text-[#0B1B33]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#EEF2F6] pb-2 text-xs font-bold">
            {[
              { id: 'readiness', label: UI_STRINGS.orchestration.tabWorkflowReadiness, icon: <Sparkles size={14} /> },
              { id: 'pcbiGaps', label: UI_STRINGS.orchestration.tabPcbiGapReview, icon: <Layers size={14} /> },
              { id: 'dataCorrection', label: UI_STRINGS.orchestration.tabDataCorrection, icon: <FileCheck2 size={14} /> },
              { id: 'qualityGate', label: UI_STRINGS.orchestration.tabQualityGate, icon: <ShieldCheck size={14} /> },
              { id: 'evidence', label: UI_STRINGS.evidence.title, icon: <FileSpreadsheet size={14} /> },
              { id: 'audit', label: UI_STRINGS.orchestration.tabAuditTrail, icon: <History size={14} /> }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F8FBFE]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Readiness */}
          {activeTab === 'readiness' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] mb-3">
                  {UI_STRINGS.orchestration.readinessTitle}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                    <span className="text-[#64748B] block font-medium mb-1">
                      {UI_STRINGS.orchestration.spendCoverageLabel}
                    </span>
                    <span className="text-lg font-extrabold text-[#0284C7]">
                      {jobDetails.readiness.spendCoveragePct}%
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                    <span className="text-[#64748B] block font-medium mb-1">
                      {UI_STRINGS.orchestration.pcbiCoverageLabel}
                    </span>
                    <span className="text-lg font-extrabold text-[#0B1B33]">
                      {jobDetails.readiness.categoryCoveragePct}%
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                    <span className="text-[#64748B] block font-medium mb-1">
                      {UI_STRINGS.orchestration.categoriesRequiringReviewLabel}
                    </span>
                    <span className="text-lg font-extrabold text-amber-600">
                      {jobDetails.readiness.categoriesRequiringReview}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                    <span className="text-[#64748B] block font-medium mb-1">
                      {UI_STRINGS.orchestration.overallStatusLabel}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                        jobDetails.readiness.overallReadiness === 'READY_TO_GENERATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {jobDetails.readiness.overallReadiness === 'READY_TO_GENERATE'
                        ? UI_STRINGS.orchestration.statusReadyToGenerate
                        : UI_STRINGS.orchestration.statusActionRequired}
                    </span>
                  </div>
                </div>

                {jobDetails.readiness.blockingReasons.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
                    <span className="font-bold block mb-1">Action Items Required Before Generation:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {jobDetails.readiness.blockingReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B]">
                  Report generation compiles Module 1 through 4 under the certified financial truth.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={jobDetails.readiness.overallReadiness !== 'READY_TO_GENERATE'}
                  className="px-5 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40"
                >
                  {UI_STRINGS.orchestration.btnGenerateReport}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: PCBI Gaps */}
          {activeTab === 'pcbiGaps' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FBFE] text-[#64748B] border-b border-[#DCE7F5] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Category / Classification</th>
                      <th className="py-2.5 px-3">Spend</th>
                      <th className="py-2.5 px-3">Transactions</th>
                      <th className="py-2.5 px-3">PCBI Status</th>
                      <th className="py-2.5 px-3">Resolution</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {jobDetails.pcbiGaps.map((gap) => (
                      <tr key={gap.gapId} className="hover:bg-[#F8FBFE]">
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#0B1B33] block">{gap.itemCategory}</span>
                          <span className="text-[#64748B] text-[11px]">{gap.relevantClassification}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#0284C7]">
                          ₹{gap.customerSpendInrCr.toFixed(2)} Cr
                        </td>
                        <td className="py-3 px-3 text-[#475569]">{gap.transactionCount}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              gap.status === 'PCBI_COVERED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : gap.status === 'PCBI_REQUIRED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {gap.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {gap.resolutionStatus === 'MAPPED' ? (
                            <span className="text-emerald-700 font-mono text-[11px]">
                              {gap.existingPcbiMapping}
                            </span>
                          ) : gap.resolutionStatus === 'EXCLUDED' ? (
                            <span className="text-slate-600 italic">
                              Excluded: {gap.exclusionReason}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold">Action Required</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedGap(gap)}
                            className="px-2.5 py-1 rounded-md border border-[#0284C7] bg-white text-[#0284C7] hover:bg-[#0284C7] hover:text-white font-bold transition-all text-xs"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Data Versioning & Correction */}
          {activeTab === 'dataCorrection' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#0B1B33]">Admin Data Reanalysis & Versioning</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Original customer uploads remain strictly immutable. Corrected uploads generate verified new data versions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={orchestrationApi.getDownloadDatasetUrl(
                      jobDetails.job.analysisJobId,
                      jobDetails.job.currentDataVersionId
                    )}
                    download
                    className="px-3.5 py-2 rounded-lg border border-[#DCE7F5] bg-white hover:bg-[#F8FBFE] text-[#0B1B33] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Download size={14} className="text-[#0284C7]" />
                    <span>{UI_STRINGS.orchestration.btnDownloadForCorrection}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload size={14} />
                    <span>{UI_STRINGS.orchestration.btnUploadCorrectedData}</span>
                  </button>
                </div>
              </div>

              {lastDiff && (
                <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl space-y-2 text-xs">
                  <h5 className="font-extrabold text-[#0B1B33] uppercase tracking-wider text-[11px]">
                    DATA VERSION CHANGE ({lastDiff.previousVersionId} → {lastDiff.newVersionId})
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-2 bg-[#F8FBFE] rounded-lg">
                      <span className="text-[#64748B] block">Transactions:</span>
                      <span className="font-bold">
                        {(lastDiff.previousTransactions ?? 0).toLocaleString()} → {(lastDiff.newTransactions ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-[#F8FBFE] rounded-lg">
                      <span className="text-[#64748B] block">Suppliers:</span>
                      <span className="font-bold">
                        {lastDiff.previousSuppliers ?? 0} → {lastDiff.newSuppliers ?? 0}
                      </span>
                    </div>
                    <div className="p-2 bg-[#F8FBFE] rounded-lg">
                      <span className="text-[#64748B] block">Spend:</span>
                      <span className="font-bold text-[#0284C7]">
                        ₹{(lastDiff.previousSpendCr ?? 0).toFixed(2)} Cr → ₹{(lastDiff.newSpendCr ?? 0).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-2 bg-[#F8FBFE] rounded-lg">
                      <span className="text-[#64748B] block">Categories:</span>
                      <span className="font-bold">
                        {lastDiff.previousCategories ?? 0} → {lastDiff.newCategories ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Version History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FBFE] text-[#64748B] border-b border-[#DCE7F5] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Source & Role</th>
                      <th className="py-2.5 px-3">Transactions</th>
                      <th className="py-2.5 px-3">Spend</th>
                      <th className="py-2.5 px-3">Correction Reason</th>
                      <th className="py-2.5 px-3">Uploaded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {jobDetails.versions.map((ver) => (
                      <tr key={ver.versionId} className="hover:bg-[#F8FBFE]">
                        <td className="py-3 px-3 font-mono font-bold text-[#0284C7]">
                          {ver.versionId}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#0B1B33] block">{ver.source}</span>
                          <span className="text-[#64748B] text-[11px]">{ver.uploaderRole}</span>
                        </td>
                        <td className="py-3 px-3">{ver.transactionCount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold">₹{ver.spendInrCr.toFixed(2)} Cr</td>
                        <td className="py-3 px-3 text-[#64748B]">
                          {ver.correctionReason || 'Original baseline upload'}
                        </td>
                        <td className="py-3 px-3 text-[#64748B]">
                          {new Date(ver.uploadedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Quality Gate & Approval */}
          {activeTab === 'qualityGate' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Data Quality */}
                <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] shadow-xs space-y-2">
                  <h5 className="font-extrabold text-[#0B1B33] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#0284C7]" />
                    {UI_STRINGS.orchestration.checklistDataQualityTitle}
                  </h5>
                  {[
                    { key: 'sourceDataValidated', label: UI_STRINGS.orchestration.checkSourceData },
                    { key: 'spendReconciles', label: UI_STRINGS.orchestration.checkSpendReconciles },
                    { key: 'duplicateChecksCompleted', label: UI_STRINGS.orchestration.checkDuplicates },
                    { key: 'classificationReviewed', label: UI_STRINGS.orchestration.checkClassification }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={(checklist.dataQuality as any)[item.key]}
                        onChange={(e) =>
                          setChecklist((prev) => ({
                            ...prev,
                            dataQuality: { ...prev.dataQuality, [item.key]: e.target.checked }
                          }))
                        }
                        className="rounded-sm border-gray-300 text-[#0284C7] focus:ring-[#0284C7]"
                      />
                      <span className="text-[#334155]">{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* 2. PCBI */}
                <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] shadow-xs space-y-2">
                  <h5 className="font-extrabold text-[#0B1B33] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers size={14} className="text-[#0284C7]" />
                    {UI_STRINGS.orchestration.checklistPcbiTitle}
                  </h5>
                  {[
                    { key: 'requiredPcbiCategoriesResolved', label: UI_STRINGS.orchestration.checkPcbiCategories },
                    { key: 'benchmarkSourcesValidated', label: UI_STRINGS.orchestration.checkBenchmarkSources },
                    { key: 'exclusionsDocumented', label: UI_STRINGS.orchestration.checkExclusionsDoc },
                    { key: 'pcbiCoverageAcceptable', label: UI_STRINGS.orchestration.checkPcbiCoverage }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={(checklist.pcbi as any)[item.key]}
                        onChange={(e) =>
                          setChecklist((prev) => ({
                            ...prev,
                            pcbi: { ...prev.pcbi, [item.key]: e.target.checked }
                          }))
                        }
                        className="rounded-sm border-gray-300 text-[#0284C7] focus:ring-[#0284C7]"
                      />
                      <span className="text-[#334155]">{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* 3. Financial */}
                <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] shadow-xs space-y-2">
                  <h5 className="font-extrabold text-[#0B1B33] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#0284C7]" />
                    {UI_STRINGS.orchestration.checklistFinancialTitle}
                  </h5>
                  {[
                    { key: 'savingsCalculationsValidated', label: UI_STRINGS.orchestration.checkSavingsCalculations },
                    { key: 'noDoubleCounting', label: UI_STRINGS.orchestration.checkNoDoubleCounting },
                    { key: 'overlapsHandled', label: UI_STRINGS.orchestration.checkOverlapsHandled },
                    { key: 'exclusionsApplied', label: UI_STRINGS.orchestration.checkExclusionsApplied },
                    { key: 'totalsReconcile', label: UI_STRINGS.orchestration.checkTotalsReconcile }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={(checklist.financial as any)[item.key]}
                        onChange={(e) =>
                          setChecklist((prev) => ({
                            ...prev,
                            financial: { ...prev.financial, [item.key]: e.target.checked }
                          }))
                        }
                        className="rounded-sm border-gray-300 text-[#0284C7] focus:ring-[#0284C7]"
                      />
                      <span className="text-[#334155]">{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* 4. Report */}
                <div className="p-4 bg-white rounded-xl border border-[#DCE7F5] shadow-xs space-y-2">
                  <h5 className="font-extrabold text-[#0B1B33] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#0284C7]" />
                    {UI_STRINGS.orchestration.checklistReportTitle}
                  </h5>
                  {[
                    { key: 'module1Reviewed', label: UI_STRINGS.orchestration.checkModule1Reviewed },
                    { key: 'module2Reviewed', label: UI_STRINGS.orchestration.checkModule2Reviewed },
                    { key: 'module3Reviewed', label: UI_STRINGS.orchestration.checkModule3Reviewed },
                    { key: 'module4Reviewed', label: UI_STRINGS.orchestration.checkModule4Reviewed },
                    { key: 'executiveSummaryReviewed', label: UI_STRINGS.orchestration.checkExecutiveSummary }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={(checklist.report as any)[item.key]}
                        onChange={(e) =>
                          setChecklist((prev) => ({
                            ...prev,
                            report: { ...prev.report, [item.key]: e.target.checked }
                          }))
                        }
                        className="rounded-sm border-gray-300 text-[#0284C7] focus:ring-[#0284C7]"
                      />
                      <span className="text-[#334155]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EEF2F6]">
                <button
                  type="button"
                  onClick={handleConfirmChecklist}
                  disabled={submittingChecklist}
                  className="px-4 py-2 rounded-lg border border-[#0284C7] bg-white text-[#0284C7] hover:bg-[#F0F7FF] text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckSquare size={14} />
                  <span>{UI_STRINGS.orchestration.modalConfirmChecklist}</span>
                </button>

                {jobDetails.reports.length > 0 && (
                  <div className="flex items-center gap-2">
                    {jobDetails.reports[0].status === 'SUBMITTED' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResendEmail(jobDetails.reports[0].reportVersionId)}
                          className="px-3.5 py-2 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] hover:bg-[#F8FBFE] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Send size={14} className="text-[#0284C7]" />
                          <span>{UI_STRINGS.orchestration.btnResendNotification}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSupersedeReport(jobDetails.reports[0].reportVersionId)}
                          className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Ban size={14} />
                          <span>{UI_STRINGS.orchestration.btnSupersedeReport}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApproveAndSubmit(jobDetails.reports[0].reportVersionId)}
                        disabled={submittingApproval || !jobDetails.checklist?.confirmedAt}
                        className="px-5 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-40"
                      >
                        <CheckCircle2 size={16} />
                        <span>{UI_STRINGS.orchestration.btnApproveAndSubmit}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B33]">
                Immutable Event Audit Trail
              </h4>
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-xs space-y-2">
                <div className="font-mono text-[11px] text-[#64748B]">
                  [Audit Event] DATA_UPLOADED • Tenant: {jobDetails.job.tenantId} • File: {jobDetails.job.currentDataVersionId}
                </div>
                <div className="font-mono text-[11px] text-[#64748B]">
                  [Audit Event] MODULE1_COMPLETED • Spend Verified: ₹{jobDetails.job.totalSpendCr.toFixed(2)} Cr
                </div>
                <div className="font-mono text-[11px] text-[#64748B]">
                  [Audit Event] ANALYSIS_QUEUED • Status: {jobDetails.job.status}
                </div>
                {jobDetails.job.reportGeneratedAt && (
                  <div className="font-mono text-[11px] text-indigo-700">
                    [Audit Event] REPORT_GENERATED • Version: {jobDetails.job.reportVersionId}
                  </div>
                )}
                {jobDetails.job.approvedAt && (
                  <div className="font-mono text-[11px] text-emerald-700">
                    [Audit Event] REPORT_APPROVED & SUBMITTED • Dispatched to {jobDetails.job.uploadedBy}
                  </div>
                )}
                {jobDetails.job.acknowledgedAt && (
                  <div className="font-mono text-[11px] text-blue-700">
                    [Audit Event] REPORT_ACKNOWLEDGED • Timestamp: {jobDetails.job.acknowledgedAt}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Evidence Workbooks & Validation */}
          {activeTab === 'evidence' && (
            <EvidenceWorkbooksPanel
              jobId={jobDetails.job.analysisJobId}
              customerName={jobDetails.job.customerName}
              totalSpendCr={jobDetails.job.totalSpendCr}
            />
          )}
        </div>
      )}

      {/* PCBI Gap Resolution Modal */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 bg-[#0B1B33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#DCE7F5] shadow-xl overflow-hidden text-xs">
            <div className="px-5 py-4 bg-[#F8FBFE] border-b border-[#DCE7F5] flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[#0B1B33]">Resolve PCBI Gap</h4>
                <p className="text-[#64748B] mt-0.5">{selectedGap.relevantClassification}</p>
              </div>
              <button type="button" onClick={() => setSelectedGap(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleResolveGap} className="p-5 space-y-4">
              <div>
                <label className="block font-bold mb-1">Resolution Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="MAP_EXISTING">Map to Existing PCBI Series</option>
                  <option value="ADD_MAP_PCBI">Add / Map New PCBI Data</option>
                  <option value="EXCLUDE">Exclude from Benchmarking (Mandatory Reason)</option>
                  <option value="MARK_NOT_BENCHMARKABLE">Mark Not Benchmarkable</option>
                  <option value="MARK_SERVICE">Mark as Service / Non-Commodity</option>
                  <option value="REQUEST_RESEARCH">Request Data Research</option>
                </select>
              </div>

              {resolutionAction === 'EXCLUDE' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Mandatory Exclusion Reason</label>
                    <select
                      value={exclusionReason}
                      onChange={(e) => setExclusionReason(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      {EXCLUSION_REASONS.map((r) => (
                        <option key={r.code} value={r.code}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Explanatory Notes</label>
                    <textarea
                      value={exclusionNotes}
                      onChange={(e) => setExclusionNotes(e.target.value)}
                      rows={3}
                      placeholder="Explain justification for exclusion..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {(resolutionAction === 'MAP_EXISTING' || resolutionAction === 'ADD_MAP_PCBI') && (
                <div>
                  <label className="block font-bold mb-1">Target PCBI Series ID</label>
                  <input
                    type="text"
                    value={targetSeries}
                    onChange={(e) => setTargetSeries(e.target.value)}
                    placeholder={selectedGap.requiredPcbiSeries || 'PCBI-SERIES-...'}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGap(null)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGap}
                  className="px-4 py-1.5 bg-[#0284C7] text-white font-bold rounded-lg"
                >
                  {submittingGap ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Corrected Dataset Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1B33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#DCE7F5] shadow-xl overflow-hidden text-xs">
            <div className="px-5 py-4 bg-[#F8FBFE] border-b border-[#DCE7F5] flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[#0B1B33]">Upload Corrected Dataset</h4>
                <p className="text-[#64748B] mt-0.5">Creates a new verified data version and re-runs Module 1</p>
              </div>
              <button type="button" onClick={() => setIsCorrectionModalOpen(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleUploadCorrectedData} className="p-5 space-y-4">
              <div>
                <label className="block font-bold mb-1">File Name</label>
                <input
                  type="text"
                  value={correctedFileName}
                  onChange={(e) => setCorrectedFileName(e.target.value)}
                  placeholder="e.g. Corrected_Procurement_Data_v2.xlsx"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Reason for Reanalysis</label>
                <select
                  value={reanalysisReason}
                  onChange={(e) => setReanalysisReason(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {REANALYSIS_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Detailed Correction Notes</label>
                <textarea
                  value={reanalysisNotes}
                  onChange={(e) => setReanalysisNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe corrected items, vendor updates, or transaction modifications..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="px-4 py-1.5 bg-[#0284C7] text-white font-bold rounded-lg"
                >
                  {submittingUpload ? 'Uploading...' : 'Generate New Data Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
