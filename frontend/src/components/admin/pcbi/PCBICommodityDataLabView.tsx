'use client';

/**
 * Enterprise Admin Portal — PCBI Data Library / Commodity Data Lab View
 * Supports the 9 sub-navigation views specified in Part C:
 * 1. Coverage Dashboard
 * 2. Research Queue
 * 3. Commodity PCBI
 * 4. Source Library
 * 5. Upload PCBI Data (10-Step Workflow)
 * 6. Validation Queue
 * 7. Pending Approval
 * 8. Active PCBI Series
 * 9. Version History
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  UploadCloud,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { pcbiCommodityDataLabApi } from '../../../utils/pcbiCommodityDataLabApi';
import frontendLogger from '../../../utils/logger';
import { CommodityWorkspaceModal } from './CommodityWorkspaceModal';
import { PCBICommodityResearchQueueTable } from './PCBICommodityResearchQueueTable';
import { PCBISourceLibraryView } from './PCBISourceLibraryView';
import { CommodityPCBIUploadWorkflowModal } from './CommodityPCBIUploadWorkflowModal';
import { PCBIBreadcrumb } from './PCBIBreadcrumb';
import { PCBIModuleWarningBanner } from './PCBIModuleWarningBanner';
import type { PCBICommodityDataLabViewProps } from '../../../types/components';
import type {
  CommodityResearchQueueRow,
  PCBIResearchDashboardMetrics,
  CommoditySourceEvidenceObject,
  PCBIDataLibrarySubTab
} from '../../../types/pcbiCommodityDataLab';

export const PCBICommodityDataLabView: React.FC<PCBICommodityDataLabViewProps> = ({
  onNavigateToMaster
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PCBIDataLibrarySubTab>('COVERAGE_DASHBOARD');
  const [metrics, setMetrics] = useState<PCBIResearchDashboardMetrics | null>(null);
  const [queue, setQueue] = useState<CommodityResearchQueueRow[]>([]);
  const [allSources, setAllSources] = useState<CommoditySourceEvidenceObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals State
  const [selectedCommodityPcbiId, setSelectedCommodityPcbiId] = useState<string | null>(null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [isUploadWorkflowModalOpen, setIsUploadWorkflowModalOpen] = useState<boolean>(false);
  const [selectedUploadCommodity, setSelectedUploadCommodity] = useState<CommodityResearchQueueRow | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, queueRes] = await Promise.all([
        pcbiCommodityDataLabApi.getDashboard(),
        pcbiCommodityDataLabApi.getQueue()
      ]);

      if (dashRes.success && dashRes.metrics) {
        setMetrics(dashRes.metrics);
      }
      if (queueRes.success && Array.isArray(queueRes.queue)) {
        setQueue(queueRes.queue);
      }

      // Collect sample sources from primary queue commodities
      const fmoWorkspace = await pcbiCommodityDataLabApi.getCommodityWorkspace('PCBI-FEMO-65-001').catch(() => null);
      if (fmoWorkspace?.workspace?.sources) {
        setAllSources(fmoWorkspace.workspace.sources);
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to load Commodity Data Lab dashboard and queue', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenWorkspace = (pcbiId: string): void => {
    setSelectedCommodityPcbiId(pcbiId);
    setIsWorkspaceModalOpen(true);
  };

  const handleOpenUploadWorkflow = (commodity?: CommodityResearchQueueRow): void => {
    setSelectedUploadCommodity(commodity || queue[0] || null);
    setIsUploadWorkflowModalOpen(true);
  };

  const handleDataChanged = (): void => {
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation (Part P) */}
      <PCBIBreadcrumb
        items={[
          { label: 'Admin', href: '/admin/pcbi' },
          { label: 'PCBI Data Library', isCurrent: activeSubTab === 'COVERAGE_DASHBOARD' },
          ...(activeSubTab !== 'COVERAGE_DASHBOARD'
            ? [{ label: activeSubTab.replace(/_/g, ' '), isCurrent: true }]
            : [])
        ]}
      />

      {/* Part D Clear User Warning for PCBI Data Library */}
      <PCBIModuleWarningBanner
        moduleContext="PCBI_DATA_LIBRARY"
        onNavigateAction={onNavigateToMaster}
      />

      {/* Top Header & Prominent Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono tracking-widest uppercase bg-teal-950/80 text-teal-400 border border-teal-800/60 px-2.5 py-0.5 rounded">
              ADMIN → PCBI DATA LIBRARY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              PROCUCEV ENTERPRISE SUITE
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">
            PCBI Data Library — Commodity Research Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational repository for multi-source market evidence, empirical observations, and PCBI series population.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Part Q: Explicit Label */}
          <button
            type="button"
            onClick={() => handleOpenUploadWorkflow(queue[0])}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <UploadCloud size={15} />
            <span>Upload Commodity PCBI Source Data</span>
          </button>
        </div>
      </div>

      {/* Part C: 9 Sub-Navigation Views for PCBI Data Library */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'COVERAGE_DASHBOARD', label: 'Coverage Dashboard', icon: Layers },
          { key: 'RESEARCH_QUEUE', label: 'Research Queue', icon: FileSpreadsheet },
          { key: 'COMMODITY_PCBI', label: 'Commodity PCBI', icon: Database },
          { key: 'SOURCE_LIBRARY', label: 'Source Library', icon: Building2 },
          { key: 'UPLOAD_PCBI_DATA', label: 'Upload PCBI Data', icon: UploadCloud },
          { key: 'VALIDATION_QUEUE', label: 'Validation Queue', icon: FileCheck },
          { key: 'PENDING_APPROVAL', label: 'Pending Approval', icon: Clock },
          { key: 'ACTIVE_PCBI_SERIES', label: 'Active PCBI Series', icon: CheckCircle2 },
          { key: 'VERSION_HISTORY', label: 'Version History', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === 'UPLOAD_PCBI_DATA') {
                  handleOpenUploadWorkflow(queue[0]);
                } else {
                  setActiveSubTab(tab.key as PCBIDataLibrarySubTab);
                }
              }}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: COVERAGE DASHBOARD (Section A Metrics + Priority Queue) */}
      {(activeSubTab === 'COVERAGE_DASHBOARD' || activeSubTab === 'RESEARCH_QUEUE') && (
        <div className="space-y-6">
          {/* SECTION A: RESEARCH DASHBOARD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                <span>{UI_STRINGS.pcbiCommodityDataLab.researchDashboardTitle}</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {metrics?.totalCommodities || 0} Total Commodities in Scope
              </span>
            </div>

            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricTotalCommodities}</div>
                  <div className="text-lg font-extrabold text-white mt-1">{metrics.totalCommodities}</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">100% Tracked</div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-emerald-900/40 rounded-xl">
                  <div className="text-[10px] text-emerald-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricProductionReady}</div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-1">{metrics.productionReadyCount}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Catalog Active</div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-amber-900/40 rounded-xl">
                  <div className="text-[10px] text-amber-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricPartialHistory}</div>
                  <div className="text-lg font-extrabold text-amber-400 mt-1">{metrics.partialHistoryCount}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Under Review</div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-rose-900/40 rounded-xl">
                  <div className="text-[10px] text-rose-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricNoHistory}</div>
                  <div className="text-lg font-extrabold text-rose-400 mt-1">{metrics.noHistoryCount}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Queue Critical</div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricMethodologyPending}</div>
                  <div className="text-lg font-extrabold text-purple-400 mt-1">{metrics.methodologyPendingCount}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Review Required</div>
                </div>

                <div className="p-3.5 bg-slate-900/80 border border-rose-900/60 rounded-xl bg-rose-950/10">
                  <div className="text-[10px] text-rose-400 uppercase font-mono">{UI_STRINGS.pcbiCommodityDataLab.metricHighImpactGaps}</div>
                  <div className="text-lg font-extrabold text-rose-300 mt-1">{metrics.highImpactGapsCount}</div>
                  <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">P1 Priority</div>
                </div>
              </div>
            )}

            {/* Priority Sub-bar */}
            {metrics && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs font-mono">
                <span className="text-slate-400 uppercase text-[10px]">Queue by Priority:</span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/50">
                  {UI_STRINGS.pcbiCommodityDataLab.metricP1Critical}: {metrics.queueByPriority.p1Critical}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/50">
                  {UI_STRINGS.pcbiCommodityDataLab.metricP2High}: {metrics.queueByPriority.p2High}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/50">
                  {UI_STRINGS.pcbiCommodityDataLab.metricP3Medium}: {metrics.queueByPriority.p3Medium}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {UI_STRINGS.pcbiCommodityDataLab.metricP4Low}: {metrics.queueByPriority.p4Low}
                </span>
              </div>
            )}
          </div>

          {/* SECTION B: COMMODITY RESEARCH QUEUE TABLE */}
          <PCBICommodityResearchQueueTable
            queue={queue}
            onOpenWorkspace={handleOpenWorkspace}
            onUploadSource={handleOpenUploadWorkflow}
          />
        </div>
      )}

      {/* VIEW 2: SOURCE LIBRARY (Part I Searchable Multi-Source Repository) */}
      {activeSubTab === 'SOURCE_LIBRARY' && (
        <PCBISourceLibraryView
          sources={allSources}
          queue={queue}
          onOpenWorkspace={handleOpenWorkspace}
          onSelectCommodityUpload={(commId) => {
            const item = queue.find((q) => q.commodityId === commId);
            handleOpenUploadWorkflow(item);
          }}
        />
      )}

      {/* VIEW 3: COMMODITY PCBI (Drilldown / Workspace) */}
      {activeSubTab === 'COMMODITY_PCBI' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">Select Commodity to Open Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose any tracked commodity to inspect its 12-tab workspace and evidence registry.
              </p>
            </div>
          </div>
          <PCBICommodityResearchQueueTable
            queue={queue}
            onOpenWorkspace={handleOpenWorkspace}
            onUploadSource={handleOpenUploadWorkflow}
          />
        </div>
      )}

      {/* VIEW 4: VALIDATION QUEUE (Filtered Queue) */}
      {activeSubTab === 'VALIDATION_QUEUE' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
            Displaying commodities with pending validations, continuity audits, or active research gaps.
          </div>
          <PCBICommodityResearchQueueTable
            queue={queue.filter((q) => q.currentStatus !== 'PRODUCTION_READY')}
            onOpenWorkspace={handleOpenWorkspace}
            onUploadSource={handleOpenUploadWorkflow}
          />
        </div>
      )}

      {/* VIEW 5: PENDING APPROVAL (Filtered Queue) */}
      {activeSubTab === 'PENDING_APPROVAL' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
            Displaying commodities where source observations have been staged and await Admin governance sign-off.
          </div>
          <PCBICommodityResearchQueueTable
            queue={queue.filter((q) => q.researchStatus === 'IN_PROGRESS' || q.sourceStatus === 'SOURCE_VERIFIED')}
            onOpenWorkspace={handleOpenWorkspace}
            onUploadSource={handleOpenUploadWorkflow}
          />
        </div>
      )}

      {/* VIEW 6: ACTIVE PCBI SERIES (Filtered Queue) */}
      {activeSubTab === 'ACTIVE_PCBI_SERIES' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
            Displaying active production-ready PCBI series promoted to the Dynamic PCBI Catalog.
          </div>
          <PCBICommodityResearchQueueTable
            queue={queue.filter((q) => q.currentStatus === 'PRODUCTION_READY')}
            onOpenWorkspace={handleOpenWorkspace}
            onUploadSource={handleOpenUploadWorkflow}
          />
        </div>
      )}

      {/* VIEW 7: VERSION HISTORY (Audit Trail) */}
      {activeSubTab === 'VERSION_HISTORY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400" />
              <span className="font-extrabold text-white text-sm font-sans">PCBI Data Library — Promotion Audit Trail</span>
            </div>
            <span className="text-slate-400">Master Authority V1.0 Intact</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-300 font-bold">
                <span>Dynamic Catalog Promotion: COM-CHM-CSL</span>
                <span className="text-emerald-400">V1.7-APPROVED</span>
              </div>
              <p className="text-slate-400 text-[11px]">Caustic Soda Lye 48% promoted by Sriman Admin with 75 verified monthly observations.</p>
              <div className="text-[10px] text-slate-500 pt-1">Timestamp: 2026-09-28T12:00:00.000Z</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-300 font-bold">
                <span>Dynamic Catalog Promotion: COM-STEEL-HRC</span>
                <span className="text-emerald-400">V1.7-APPROVED</span>
              </div>
              <p className="text-slate-400 text-[11px]">Hot Rolled Steel Coils IS 2062 promoted by Sriman Admin with 75 verified weekly observations.</p>
              <div className="text-[10px] text-slate-500 pt-1">Timestamp: 2026-09-28T12:00:00.000Z</div>
            </div>
          </div>
        </div>
      )}

      {/* 12-Tab Commodity PCBI Workspace Modal */}
      <CommodityWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        pcbiId={selectedCommodityPcbiId}
        onClose={() => {
          setIsWorkspaceModalOpen(false);
          setSelectedCommodityPcbiId(null);
        }}
        onSourceUploaded={handleDataChanged}
        onDataApproved={handleDataChanged}
      />

      {/* Governed 10-Step Commodity PCBI Upload Workflow Modal */}
      <CommodityPCBIUploadWorkflowModal
        isOpen={isUploadWorkflowModalOpen}
        initialCommodity={selectedUploadCommodity}
        onClose={() => {
          setIsUploadWorkflowModalOpen(false);
          setSelectedUploadCommodity(null);
        }}
        onComplete={handleDataChanged}
      />
    </div>
  );
};

export const PCBIDataLibraryView = PCBICommodityDataLabView;
