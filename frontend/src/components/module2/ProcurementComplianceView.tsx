'use client';
import { apiFetch } from '../../utils/apiFetch';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Download, ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import type {
  ProcurementComplianceViewProps,
  ProcurementComplianceResult,
  ProcurementComplianceExceptionItem,
  ProcurementComplianceReviewPayload
} from '../../types/module2ProcurementCompliance';
import { COMPLIANCE_UI_STRINGS } from '../../constants/module2ProcurementCompliance';
import { ProcurementComplianceReviewModal } from './ProcurementComplianceReviewModal';
import { ProcurementComplianceTable } from './ProcurementComplianceTable';
import { logger } from '../../utils/logger';
import { authApiClient } from '../../utils/authApi';
import { useLatestRequestSequence } from '../../utils/useLatestRequestSequence';

export const ProcurementComplianceView: React.FC<ProcurementComplianceViewProps> = ({
  assessmentId = '',
  onNavigateBack
}) => {
  const [data, setData] = useState<ProcurementComplianceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!assessmentId);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'AWAITING' | 'VERIFIED' | 'DISMISSED' | 'GAPS'>('ALL');
  const [selectedException, setSelectedException] = useState<ProcurementComplianceExceptionItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
  const { beginRequest, isCurrentRequest, invalidateRequests } = useLatestRequestSequence();
  const {
    beginRequest: beginReviewRequest,
    isCurrentRequest: isCurrentReviewRequest,
    invalidateRequests: invalidateReviewRequests
  } = useLatestRequestSequence();
  const activeAssessmentIdRef = useRef(assessmentId);
  activeAssessmentIdRef.current = assessmentId;

  const loadData = useCallback(async (): Promise<void> => {
    const requestId = beginRequest();
    if (!assessmentId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const token = authApiClient.getStoredToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiFetch(`/api/module2/sourcing/procurement-compliance?assessmentId=${encodeURIComponent(assessmentId)}`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (!isCurrentRequest(requestId)) return;
      setData(json?.data ?? json);
    } catch (err) {
      if (!isCurrentRequest(requestId)) return;
      logger.error('Failed to load Lever 9 Procurement Compliance data', { assessmentId }, err);
      setError('Unable to load procurement compliance data. Please retry or contact support.');
    } finally {
      if (isCurrentRequest(requestId)) setIsLoading(false);
    }
  }, [assessmentId, beginRequest, isCurrentRequest]);

  useEffect(() => {
    setSelectedException(null);
    setIsReviewModalOpen(false);
    setIsSubmittingReview(false);
    setSearchTerm('');
    setActiveTab('ALL');
    void loadData();
    return invalidateRequests;
  }, [loadData, invalidateRequests]);

  const handleReviewSubmit = async (payload: ProcurementComplianceReviewPayload): Promise<void> => {
    const requestId = beginReviewRequest();
    const submittedAssessmentId = assessmentId;
    setIsSubmittingReview(true);
    try {
      const token = authApiClient.getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiFetch('/api/module2/sourcing/procurement-compliance/review', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, assessmentId })
      });
      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorJson?.message || `HTTP error ${res.status}`);
      }
      if (!isCurrentReviewRequest(requestId) || activeAssessmentIdRef.current !== submittedAssessmentId) return;
      setIsReviewModalOpen(false);
      await loadData();
    } catch (err) {
      logger.error('Failed to submit compliance review', {
        assessmentId: submittedAssessmentId,
        payload,
        staleRequest: !isCurrentReviewRequest(requestId) || activeAssessmentIdRef.current !== submittedAssessmentId
      }, err);
      if (!isCurrentReviewRequest(requestId) || activeAssessmentIdRef.current !== submittedAssessmentId) return;
      setError('Failed to record review decision.');
      throw err;
    } finally {
      if (isCurrentReviewRequest(requestId) && activeAssessmentIdRef.current === submittedAssessmentId) {
        setIsSubmittingReview(false);
      }
    }
  };

  useEffect(() => invalidateReviewRequests, [assessmentId, invalidateReviewRequests]);

  const handleExportExcel = async (): Promise<void> => {
    try {
      const token = authApiClient.getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiFetch(
        `/api/module2/sourcing/procurement-compliance/export-excel?assessmentId=${encodeURIComponent(assessmentId)}`,
        { headers }
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadBlobUrl(url);
      setTimeout(() => {
        downloadLinkRef.current?.click();
        window.URL.revokeObjectURL(url);
        setDownloadBlobUrl(null);
      }, 50);
    } catch (err) {
      logger.error('Failed to export compliance Excel', { assessmentId }, err);
      setError('Failed to export compliance workbook. Please verify permissions.');
    }
  };

  const filteredExceptions = useMemo(() => {
    if (!data) return [];
    return data.exceptions.filter((item) => {
      if (activeTab === 'AWAITING' && item.reviewStatus !== 'AWAITING_REVIEW') return false;
      if (activeTab === 'VERIFIED' && item.reviewStatus !== 'VERIFIED_EXCEPTION') return false;
      if (activeTab === 'DISMISSED' && item.reviewStatus !== 'NOT_AN_EXCEPTION') return false;
      if (activeTab === 'GAPS' && item.dataGapsDisclosed.length === 0) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.exceptionId.toLowerCase().includes(q) ||
          item.vendorName.toLowerCase().includes(q) ||
          item.materialDesc.toLowerCase().includes(q) ||
          item.checkTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, activeTab, searchTerm]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Loading Lever 9 Procurement Compliance & Control engine...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-xl m-4 border border-rose-200">
        <p className="font-semibold text-sm">{error || 'Data could not be retrieved.'}</p>
        <button onClick={loadData} className="mt-3 px-3 py-1.5 text-xs bg-rose-600 text-white rounded">
          {COMPLIANCE_UI_STRINGS.BTN_RETRY}
        </button>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6 w-full py-2">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title={COMPLIANCE_UI_STRINGS.BTN_BACK_TO_OVERVIEW}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {COMPLIANCE_UI_STRINGS.BADGE}
            </span>
            <span className="text-xs text-slate-500 font-mono">{assessmentId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{COMPLIANCE_UI_STRINGS.TITLE}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{COMPLIANCE_UI_STRINGS.SUBTITLE}</p>
        </div>
        <button
          type="button"
          data-testid="compliance-export-excel-btn"
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{COMPLIANCE_UI_STRINGS.BTN_EXPORT_EXCEL}</span>
        </button>
      </div>

      {/* Mandatory Governance Notice */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-amber-900 dark:text-amber-200">{data.contractComplianceNotice}</p>
          <p className="text-amber-800/90 dark:text-amber-300/80">{data.financialDisclaimer}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: COMPLIANCE_UI_STRINGS.KPI_UNIQUE_EXPENDITURE, val: `₹${(summary.uniqueExpenditureUnderReviewCr ?? summary.totalExpenditureUnderReviewCr).toFixed(2)} Cr` },
          { label: COMPLIANCE_UI_STRINGS.KPI_PRICE_VARIANCE_SIGNALS, val: `₹${(summary.priceVarianceInvestigationCr ?? 0).toFixed(2)} Cr`, sub: COMPLIANCE_UI_STRINGS.SUB_INVESTIGATION_SIGNAL, color: 'text-amber-600 dark:text-amber-400' },
          { label: COMPLIANCE_UI_STRINGS.KPI_TOTAL_AWAITING_AP, val: `₹${(summary.totalAwaitingApVerificationCr ?? 0).toFixed(2)} Cr`, sub: COMPLIANCE_UI_STRINGS.SUB_AWAITING_AP, color: 'text-rose-600 dark:text-rose-400' },
          { label: COMPLIANCE_UI_STRINGS.KPI_VERIFIED_IMPACT, val: `₹${(summary.verifiedFinancialImpactCr ?? 0).toFixed(2)} Cr`, sub: COMPLIANCE_UI_STRINGS.SUB_ZERO_LOSS_CLAIMED, color: 'text-emerald-600 dark:text-emerald-400' }
        ].map((kpi, idx) => (
          <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">{kpi.label}</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${kpi.color || 'text-slate-900 dark:text-slate-100'}`}>{kpi.val}</div>
            {kpi.sub && <div className="text-[9px] text-amber-500 font-semibold">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Control Checks Summary */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Control Checks Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.controlChecks.map((chk) => (
            <div key={chk.checkType} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={chk.checkTitle}>{chk.checkTitle}</div>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>Exceptions:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{chk.exceptionsIdentifiedCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Spend Under Review:</span>
                <span className="font-mono font-semibold">₹{chk.expenditureUnderReviewCr.toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Coverage:</span>
                <span className="font-mono">{chk.dataCoveragePct.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          {(['ALL', 'AWAITING', 'VERIFIED', 'DISMISSED', 'GAPS'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              data-testid={`compliance-tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'ALL' && `All (${data.exceptions.length})`}
              {tab === 'AWAITING' && `Awaiting (${summary.awaitingReviewCount})`}
              {tab === 'VERIFIED' && `Verified (${summary.verifiedExceptionsCount})`}
              {tab === 'DISMISSED' && `Dismissed (${summary.dismissedCount})`}
              {tab === 'GAPS' && 'Data Gaps'}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            data-testid="compliance-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search supplier, item, or ID..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Exceptions Register Table */}
      <ProcurementComplianceTable
        exceptions={filteredExceptions}
        onSelectException={(item) => {
          setSelectedException(item);
          setIsReviewModalOpen(true);
        }}
      />

      {/* Review Modal */}
      <ProcurementComplianceReviewModal
        isOpen={isReviewModalOpen}
        exceptionItem={selectedException}
        assessmentId={assessmentId}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmitReview={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
      />
      {downloadBlobUrl && (
        <a
          ref={downloadLinkRef}
          href={downloadBlobUrl}
          download={`Procurement_Compliance_${assessmentId}.xlsx`}
          className="hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
