'use client';

/**
 * Customer Analysis Status Card (Prompt 302, Sections 2 & 35)
 * Reassuring enterprise status card tracking 24-48 hour turnaround SLA
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Eye,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import { orchestrationApi } from '../../utils/orchestrationApi';
import type { AnalysisJob, AnalysisJobStatus } from '../../types/analysisOrchestration';

export interface CustomerAnalysisStatusCardProps {
  tenantId?: string;
  onViewSpendSummary?: () => void;
  onViewReport?: () => void;
}

export function CustomerAnalysisStatusCard({
  tenantId,
  onViewSpendSummary,
  onViewReport
}: CustomerAnalysisStatusCardProps): React.ReactElement {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJob = useCallback(async () => {
    try {
      const jobs = await orchestrationApi.getJobs();
      if (jobs.length > 0) {
        setJob(jobs[0]);
      }
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJob();
  }, [loadJob, tenantId]);

  const getStatusBadge = (status?: AnalysisJobStatus): { label: string; bg: string; text: string; icon: React.ReactElement } => {
    switch (status) {
      case 'SUBMITTED_TO_CUSTOMER':
      case 'CUSTOMER_VIEWED':
        return {
          label: UI_STRINGS.orchestration.statusReportReady,
          bg: 'bg-emerald-50 border-emerald-200',
          text: 'text-emerald-700',
          icon: <CheckCircle2 size={14} className="text-emerald-600" />
        };
      case 'CUSTOMER_ACKNOWLEDGED':
        return {
          label: UI_STRINGS.orchestration.statusReportAcknowledged,
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-700',
          icon: <FileCheck2 size={14} className="text-blue-600" />
        };
      case 'REPORT_GENERATED':
      case 'ADMIN_REVIEW':
      case 'ADMIN_APPROVED':
        return {
          label: UI_STRINGS.orchestration.statusReportUnderReview,
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-700',
          icon: <Clock size={14} className="text-amber-600 animate-pulse" />
        };
      case 'ANALYSIS_BLOCKED':
        return {
          label: UI_STRINGS.orchestration.statusAnalysisBlocked,
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          icon: <AlertCircle size={14} className="text-red-600" />
        };
      case 'MODULE_1_READY':
        return {
          label: UI_STRINGS.orchestration.statusModule1Ready,
          bg: 'bg-cyan-50 border-cyan-200',
          text: 'text-cyan-700',
          icon: <Layers size={14} className="text-cyan-600" />
        };
      default:
        return {
          label: UI_STRINGS.orchestration.statusAnalysisInProgress,
          bg: 'bg-sky-50 border-sky-200',
          text: 'text-sky-700',
          icon: <Clock size={14} className="text-sky-600" />
        };
    }
  };

  const statusConfig = getStatusBadge(job?.status);
  const isReportAvailable =
    job?.status === 'SUBMITTED_TO_CUSTOMER' ||
    job?.status === 'CUSTOMER_VIEWED' ||
    job?.status === 'CUSTOMER_ACKNOWLEDGED';

  const formattedUploadDate = job?.createdAt
    ? new Date(job.createdAt).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Oct 04, 2026';

  const formattedUpdatedDate = job?.lastUpdatedAt
    ? new Date(job.lastUpdatedAt).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : formattedUploadDate;

  return (
    <div
      data-testid="customer-analysis-status-card"
      className="bg-white rounded-xl border border-[#DCE7F5] shadow-xs p-5 transition-all mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EEF2F6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0B1B33]">
              {UI_STRINGS.orchestration.customerStatusCardTitle}
            </h3>
            <p className="text-xs text-[#64748B]">
              {UI_STRINGS.orchestration.customerStatusCardSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>

          <button
            type="button"
            onClick={loadJob}
            aria-label="Refresh status"
            className="p-1.5 rounded-lg border border-[#DCE7F5] text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F8FBFE] transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Narrative Banner */}
      {!isReportAvailable && (
        <div className="my-4 p-4 rounded-lg bg-gradient-to-r from-[#F0F7FF] to-[#F8FAFC] border border-[#BAE6FD]">
          <h4 className="text-xs font-bold text-[#0369A1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Clock size={14} />
            {UI_STRINGS.orchestration.detailedAnalysisInProgressTitle}
          </h4>
          <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line font-medium">
            {UI_STRINGS.orchestration.detailedAnalysisInProgressMessage}
          </p>
        </div>
      )}

      {/* Key Metrics / Period Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
        <div className="p-3 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] block font-medium mb-1">
            {UI_STRINGS.orchestration.labelUploadDate}
          </span>
          <span className="text-[#0B1B33] font-bold">{formattedUploadDate}</span>
        </div>

        <div className="p-3 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] block font-medium mb-1">
            {UI_STRINGS.orchestration.labelAnalysisPeriod}
          </span>
          <span className="text-[#0B1B33] font-bold">
            {job?.analysisPeriod || 'FY 2023 - FY 2026'}
          </span>
        </div>

        <div className="p-3 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] block font-medium mb-1">
            {UI_STRINGS.orchestration.labelReportVersion}
          </span>
          <span className="text-[#0B1B33] font-bold font-mono">
            {job?.reportVersionId || (job?.currentDataVersionId ? `Data ${job.currentDataVersionId}` : 'v1')}
          </span>
        </div>

        <div className="p-3 bg-[#F8FBFE] rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] block font-medium mb-1">
            {UI_STRINGS.orchestration.labelLastUpdated}
          </span>
          <span className="text-[#0B1B33] font-bold">{formattedUpdatedDate}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-[#EEF2F6] flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[#64748B] italic">
          {UI_STRINGS.orchestration.typicalAnalysisTime}
        </span>

        <div className="flex items-center gap-2">
          {onViewSpendSummary && (
            <button
              type="button"
              onClick={onViewSpendSummary}
              className="px-3.5 py-1.5 rounded-lg border border-[#0284C7] text-[#0284C7] bg-white hover:bg-[#F0F7FF] text-xs font-bold transition-all shadow-xs"
            >
              {UI_STRINGS.orchestration.btnViewSpendSummary}
            </button>
          )}

          {isReportAvailable && onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="px-4 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Eye size={14} />
              <span>{UI_STRINGS.orchestration.btnViewApprovedReport}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
