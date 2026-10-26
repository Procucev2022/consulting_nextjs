'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  AssessmentRecord,
  AssessmentStatus,
  AssessmentWorkspaceProps,
  CustomerRecord
} from '../../types';
import { UI_STRINGS, ASSESSMENT_STATUS_BADGES } from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import { NewAssessmentModal } from './NewAssessmentModal';
import { SystemInfoModal } from './SystemInfoModal';
import { AssessmentDetailWorkflow } from './AssessmentDetailWorkflow';
import { CustomerManagementView } from './CustomerManagementView';
import { DesktopUpdateBanner } from './DesktopUpdateBanner';
import { isAssessmentFinancialDisplayEligible } from '../../utils/assessmentFinancialDisplayGate';
import frontendLogger from '../../utils/logger';

const STORAGE_KEYS = {
  ACTIVE_TAB: 'aicev_workspace_active_tab',
  SELECTED_CUSTOMER_ID: 'aicev_selected_customer_id',
  SELECTED_ASSESSMENT_ID: 'aicev_selected_assessment_id'
};

export const AssessmentWorkspace: React.FC<AssessmentWorkspaceProps> = ({
  onSelectAssessment,
  onActiveAssessmentChange,
  onSelectCustomer,
  onNavigateToModule1,
  initialActiveTab = 'customers'
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'customers' | 'assessments'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (stored === 'customers' || stored === 'assessments') return stored;
    }
    return initialActiveTab;
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_CUSTOMER_ID);
    }
    return null;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AssessmentStatus>('ALL');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequestIdRef = useRef<number>(0);
  const hasLoadedRef = useRef<boolean>(false);
  const onActiveAssessmentChangeRef = useRef(onActiveAssessmentChange);

  useEffect(() => {
    onActiveAssessmentChangeRef.current = onActiveAssessmentChange;
  }, [onActiveAssessmentChange]);

  const fetchAssessments = useCallback(async (isManualRefresh: boolean = false): Promise<void> => {
    const requestId = ++fetchRequestIdRef.current;
    try {
      if (isManualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
      setErrorMsg(null);
      frontendLogger.debug('Loading assessment dossiers in AssessmentWorkspace', { requestId, isManualRefresh });
      const data = await assessmentApiClient.getAssessments();

      // Prevent obsolete asynchronous responses from overwriting newer state (Prompt 371 Phase 2)
      if (requestId !== fetchRequestIdRef.current) {
        frontendLogger.debug('Discarding superseded assessment fetch response', { requestId, latest: fetchRequestIdRef.current });
        return;
      }

      const list = Array.isArray(data) ? data : [];
      setAssessments(list);
      hasLoadedRef.current = true;
    } catch (err: unknown) {
      if (requestId !== fetchRequestIdRef.current) return;
      const msg = err instanceof Error ? err.message : UI_STRINGS.ASSESSMENT.errors.fetchFailed;
      frontendLogger.error('Failed to load assessments', { error: msg, requestId });
      setErrorMsg(msg);
      // Retain previously loaded records if present (Prompt 371 Phase 2 Requirement 8)
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchAssessments(false);
  }, [fetchAssessments]);

  // Ensure active assessment is cleared when on customers tab
  useEffect(() => {
    if (workspaceTab === 'customers') {
      onActiveAssessmentChangeRef.current?.(null);
    }
  }, [workspaceTab]);

  // Persist tab changes
  const handleTabChange = (tab: 'customers' | 'assessments'): void => {
    setWorkspaceTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    }
    if (tab === 'customers') {
      setSelectedAssessmentId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_ASSESSMENT_ID);
      }
      onActiveAssessmentChangeRef.current?.(null);
    }
  };

  const handleCustomerSelected = (cust: CustomerRecord | null): void => {
    setSelectedCustomer(cust);
    setSelectedCustomerId(cust ? cust.id : null);
    setSelectedAssessmentId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ASSESSMENT_ID);
      if (cust) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CUSTOMER_ID, cust.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CUSTOMER_ID);
      }
    }
    onSelectCustomer?.(cust);
    onActiveAssessmentChangeRef.current?.(null);
  };

  const safeAssessments = useMemo(() => {
    return Array.isArray(assessments) ? assessments : [];
  }, [assessments]);

  const counts = useMemo(() => {
    return {
      active: safeAssessments.filter((a) => !['DELIVERED', 'BLOCKED', 'CLOSED'].includes(a.status as any)).length,
      dataReceived: safeAssessments.filter((a) => a.dataStatus !== 'AWAITING_DATA' || Boolean(a.dataReceivedAt)).length,
      inProgress: safeAssessments.filter((a) => a.status === 'IN_PROGRESS').length,
      pcbiReview: safeAssessments.filter((a) => a.status === 'PCBI_REVIEW').length,
      analystReview: safeAssessments.filter((a) => a.status === 'AWAITING_REVIEW').length,
      approved: safeAssessments.filter((a) => a.status === 'APPROVED').length,
      delivered: safeAssessments.filter((a) => a.status === 'DELIVERED').length,
      closed: safeAssessments.filter((a) => (a.status as any) === 'CLOSED').length
    };
  }, [safeAssessments]);

  const filteredAssessments = useMemo(() => {
    return safeAssessments.filter((item) => {
      const matchesSearch =
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assessmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeAssessments, searchQuery, statusFilter]);

  const handleAssessmentCreated = (newAssessment: AssessmentRecord): void => {
    setAssessments((prev) => [newAssessment, ...prev]);
    setSelectedAssessmentId(newAssessment.assessmentId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ASSESSMENT_ID, newAssessment.assessmentId);
    }
    onSelectAssessment?.(newAssessment.assessmentId);
    onActiveAssessmentChangeRef.current?.(newAssessment);
  };

  const handleAssessmentUpdated = (updated: AssessmentRecord): void => {
    setAssessments((prev) =>
      prev.map((item) => (item.assessmentId === updated.assessmentId ? updated : item))
    );
    if (selectedAssessmentId === updated.assessmentId) {
      onActiveAssessmentChangeRef.current?.(updated);
    }
  };

  const handleSelectRecord = (record: AssessmentRecord): void => {
    setSelectedAssessmentId(record.assessmentId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ASSESSMENT_ID, record.assessmentId);
    }
    onSelectAssessment?.(record.assessmentId);
    onActiveAssessmentChangeRef.current?.(record);
  };

  const handleBackToAssessments = (): void => {
    setSelectedAssessmentId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ASSESSMENT_ID);
    }
    onActiveAssessmentChangeRef.current?.(null);
  };

  const handleCreateAssessmentForCustomer = (cust: CustomerRecord): void => {
    setSelectedCustomer(cust);
    setSelectedCustomerId(cust.id);
    setIsModalOpen(true);
  };

  const handleOpenAssessmentInModule1 = (record: AssessmentRecord): void => {
    handleSelectRecord(record);
    onNavigateToModule1?.(record);
  };

  if (selectedAssessmentId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <AssessmentDetailWorkflow
          assessmentId={selectedAssessmentId}
          onBack={handleBackToAssessments}
          onUpdate={handleAssessmentUpdated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <DesktopUpdateBanner />

      {/* Top Navigation Bar */}
      <nav aria-label="Assessment Navigation" className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="font-mono font-bold text-cyan-400 mr-2 text-sm">aiCEV</span>
          <button
            type="button"
            onClick={() => handleTabChange('customers')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              workspaceTab === 'customers'
                ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {UI_STRINGS.ASSESSMENT.nav.customers}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('assessments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              workspaceTab === 'assessments'
                ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {UI_STRINGS.ASSESSMENT.nav.assessments}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSystemInfoOpen(true)}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            E2E-003-CERTIFIED · 2378cd0
          </button>
        </div>
      </nav>

      {/* Operational Status Strip */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold text-[11px]">
            {UI_STRINGS.ASSESSMENT.statusStrip.mode}
          </span>
          <span className="text-slate-300 font-medium">{UI_STRINGS.ASSESSMENT.statusStrip.environment}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{UI_STRINGS.ASSESSMENT.statusStrip.phase}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold text-[10px]">
            M1 · M2 · M3 · M4 CERTIFIED
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* VIEW 1: CUSTOMER MANAGEMENT ONLY (Internal Command Centre) */}
      {workspaceTab === 'customers' && (
        <CustomerManagementView
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleCustomerSelected}
          onCreateAssessmentForCustomer={handleCreateAssessmentForCustomer}
          onOpenAssessmentInModule1={handleOpenAssessmentInModule1}
        />
      )}

      {/* VIEW 2: ASSESSMENT CENTRE (Assessments records & workflow statuses) */}
      {workspaceTab === 'assessments' && (
        <div className="space-y-6">
          {/* Title & Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {UI_STRINGS.ASSESSMENT.phaseBadge}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">
                Assessment Centre
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {UI_STRINGS.ASSESSMENT.internalNoticeDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                data-testid="refresh-assessments-btn"
                onClick={() => void fetchAssessments(true)}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Refresh Assessment Dossiers"
              >
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-2 cursor-pointer"
              >
                {UI_STRINGS.ASSESSMENT.btnNewAssessment}
              </button>
            </div>
          </div>

          {/* KPI Cards (8 items) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-slate-400">{UI_STRINGS.ASSESSMENT.kpiCards.active}</span>
              <p className="text-lg font-bold text-white mt-1">{counts.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-amber-400">{UI_STRINGS.ASSESSMENT.kpiCards.dataReceived}</span>
              <p className="text-lg font-bold text-amber-300 mt-1">{counts.dataReceived}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-blue-400">{UI_STRINGS.ASSESSMENT.kpiCards.inProgress}</span>
              <p className="text-lg font-bold text-blue-300 mt-1">{counts.inProgress}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-purple-400">{UI_STRINGS.ASSESSMENT.kpiCards.pcbiReview}</span>
              <p className="text-lg font-bold text-purple-300 mt-1">{counts.pcbiReview}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-yellow-400">{UI_STRINGS.ASSESSMENT.kpiCards.analystReview}</span>
              <p className="text-lg font-bold text-yellow-300 mt-1">{counts.analystReview}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-emerald-400">{UI_STRINGS.ASSESSMENT.kpiCards.approved}</span>
              <p className="text-lg font-bold text-emerald-300 mt-1">{counts.approved}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-teal-400">{UI_STRINGS.ASSESSMENT.kpiCards.delivered}</span>
              <p className="text-lg font-bold text-teal-300 mt-1">{counts.delivered}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-semibold uppercase text-slate-400">{UI_STRINGS.ASSESSMENT.kpiCards.closed}</span>
              <p className="text-lg font-bold text-slate-300 mt-1">{counts.closed}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={UI_STRINGS.ASSESSMENT.searchPlaceholder}
              className="w-full sm:w-80 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'AWAITING_REVIEW', 'APPROVED', 'DELIVERED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab as 'ALL' | AssessmentStatus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === tab
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Dossiers' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Assessments Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{UI_STRINGS.ASSESSMENT.table.colId}</th>
                    <th className="py-3 px-4">{UI_STRINGS.ASSESSMENT.table.colCustomer}</th>
                    <th className="py-3 px-4">{UI_STRINGS.ASSESSMENT.table.colIndustry}</th>
                    <th className="py-3 px-4">{UI_STRINGS.ASSESSMENT.table.colPeriod}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.ASSESSMENT.table.colTotalSpend}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.ASSESSMENT.table.colValidatedSpend}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.ASSESSMENT.table.colPotentialSavings}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.ASSESSMENT.table.colSavingsPct}</th>
                    <th className="py-3 px-4 text-center">{UI_STRINGS.ASSESSMENT.table.colStatus}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.ASSESSMENT.table.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {isInitialLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500" data-testid="assessments-loading">
                        Loading assessments...
                      </td>
                    </tr>
                  ) : errorMsg && safeAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-rose-400 font-medium" data-testid="assessments-error">
                        {errorMsg}
                      </td>
                    </tr>
                  ) : filteredAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500" data-testid="assessments-empty">
                        {UI_STRINGS.ASSESSMENT.table.emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    filteredAssessments.map((item) => {
                      const badge = ASSESSMENT_STATUS_BADGES[item.status] || ASSESSMENT_STATUS_BADGES.DRAFT;
                      const isEligibleForFinancialDisplay = isAssessmentFinancialDisplayEligible(item);

                      return (
                        <tr
                          key={item.assessmentId}
                          onClick={() => handleSelectRecord(item)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-white">{item.assessmentId}</td>
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span>{item.customerName}</span>
                              {item.isTestData && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  {UI_STRINGS.ASSESSMENT.table.badgeTestData}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{item.industry}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {item.assessmentPeriodStart} – {item.assessmentPeriodEnd}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-white">
                            {isEligibleForFinancialDisplay && item.totalSpendCr !== undefined && item.totalSpendCr > 0
                              ? `₹${item.totalSpendCr.toFixed(2)} Cr`
                              : UI_STRINGS.ASSESSMENT.financial.emptyValue}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">
                            {isEligibleForFinancialDisplay && item.validatedSpendCr !== undefined && item.validatedSpendCr > 0
                              ? `₹${item.validatedSpendCr.toFixed(2)} Cr`
                              : UI_STRINGS.ASSESSMENT.financial.emptyValue}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-cyan-400">
                            {isEligibleForFinancialDisplay && (
                              (item.netDefensibleOpportunityCr !== undefined && item.netDefensibleOpportunityCr > 0) ||
                              (item.potentialSavingsCr !== undefined && item.potentialSavingsCr > 0)
                            )
                              ? `₹${((item.netDefensibleOpportunityCr ?? item.potentialSavingsCr) ?? 0).toFixed(2)} Cr`
                              : UI_STRINGS.ASSESSMENT.financial.emptyValue}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-400">
                            {isEligibleForFinancialDisplay && item.savingsPct !== undefined && item.savingsPct > 0
                              ? `${item.savingsPct.toFixed(2)}%`
                              : UI_STRINGS.ASSESSMENT.financial.emptyValue}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs">
                              {UI_STRINGS.ASSESSMENT.table.viewWorkflow}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <NewAssessmentModal
        isOpen={isModalOpen}
        preselectedCustomer={selectedCustomer}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleAssessmentCreated}
      />

      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
};

export default AssessmentWorkspace;
