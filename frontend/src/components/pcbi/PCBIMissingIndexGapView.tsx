'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Download, AlertCircle, RefreshCw, Upload, ExternalLink } from 'lucide-react';
import { pcbiApiClient } from '../../utils/pcbiApi';
import frontendLogger from '../../utils/logger';
import type {
  PCBIMissingIndexGapReport,
  PCBIGapStatus,
  PCBIMissingIndexGapItem,
  PCBIMissingIndexGapViewProps
} from '../../types/module3GapList';
import type { CommodityResearchQueueRow } from '../../types/pcbiCommodityDataLab';
import { UI_STRINGS } from '../../constants';
import { PCBIMissingIndexStatusCards } from './PCBIMissingIndexStatusCards';
import { PCBIMissingIndexTable } from './PCBIMissingIndexTable';
import { CommodityPCBIUploadWorkflowModal } from '../admin/pcbi/CommodityPCBIUploadWorkflowModal';
import { PCBIMasterMappingReviewModal } from './PCBIMasterMappingReviewModal';
import { convertGapItemToResearchQueueRow } from '../../utils/pcbiGapUploadHelper';

export const PCBIMissingIndexGapView: React.FC<PCBIMissingIndexGapViewProps> = ({
  assessmentId = 'AIC-2026-0002',
  onSelectRequirement
}) => {
  const [report, setReport] = useState<PCBIMissingIndexGapReport | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PCBIGapStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedCommodityForUpload, setSelectedCommodityForUpload] = useState<CommodityResearchQueueRow | null>(null);

  // Mapping Review Navigation State
  const [isMappingReviewOpen, setIsMappingReviewOpen] = useState<boolean>(false);
  const [selectedMappingRequirement, setSelectedMappingRequirement] = useState<PCBIMissingIndexGapItem | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const strings = UI_STRINGS.module3.gapList;
  const reviewStrings = UI_STRINGS.module3.mappingReview;

  const fetchGapReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      frontendLogger.info('Fetching PCBI missing-index gap report', { assessmentId });
      const res = await pcbiApiClient.getPCBIMissingIndexGapList(assessmentId);
      if (res?.success && res?.report) {
        setReport(res.report as PCBIMissingIndexGapReport);
      } else {
        setErrorMessage('Failed to load authoritative missing-index report from server.');
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to fetch PCBI missing-index report', { error: String(err) });
      setErrorMessage('Network or backend service unavailable when retrieving gap list.');
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchGapReport();
  }, [fetchGapReport]);

  const handleExportCsv = () => {
    const exportUrl = pcbiApiClient.getPCBIMissingIndexGapListExportUrl(assessmentId);
    if (typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = exportUrl;
      link.setAttribute('download', `Borosil_PCBI_Missing_Index_Gap_List_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenUploadForRequirement = (item: PCBIMissingIndexGapItem) => {
    frontendLogger.info('Opening PCBI benchmark upload workflow for requirement', {
      materialCode: item.materialCode,
      pcbiSeriesId: item.pcbiSeriesId
    });
    setSelectedCommodityForUpload(
      convertGapItemToResearchQueueRow(item, {
        assessmentId,
        customerId: report?.customerId || 'CUST-2026-0002',
        customerName: report?.customerName || 'Borosil Ltd'
      })
    );
    setIsUploadModalOpen(true);
  };

  const handleOpenGeneralUpload = () => {
    frontendLogger.info('Opening general PCBI benchmark upload workflow');
    setSelectedCommodityForUpload(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    frontendLogger.info('PCBI benchmark upload completed, refreshing gap list');
    fetchGapReport();
  };

  const handleNavigateToMappingReview = useCallback(
    (materialCode: string) => {
      setIsUploadModalOpen(false);
      setSelectedCommodityForUpload(null);

      if (!materialCode || !report) {
        frontendLogger.warn('Navigation to mapping review aborted: missing context', { materialCode, assessmentId });
        setNavigationError(reviewStrings.navFailureNoAssessment);
        return;
      }

      const target = report.items.find(
        (i) => i.materialCode.trim().toUpperCase() === materialCode.trim().toUpperCase()
      );

      if (!target) {
        frontendLogger.warn('Navigation to mapping review failed: requirement not found', { materialCode });
        setNavigationError(reviewStrings.navFailureNotFound(materialCode));
        return;
      }

      frontendLogger.info('Navigating to PCBI Master Mapping Review interface', {
        materialCode: target.materialCode,
        assessmentId
      });
      setNavigationError(null);
      setSelectedMappingRequirement(target);
      setIsMappingReviewOpen(true);
      if (onSelectRequirement) {
        onSelectRequirement(target);
      }
    },
    [report, assessmentId, onSelectRequirement, reviewStrings]
  );

  const handleReturnFromMappingReview = useCallback(
    (updatedItem: PCBIMissingIndexGapItem) => {
      frontendLogger.info('Returning from mapping review to upload workflow', {
        materialCode: updatedItem.materialCode,
        gapStatus: updatedItem.gapStatus,
        pcbiSeriesId: updatedItem.pcbiSeriesId
      });
      setIsMappingReviewOpen(false);
      setSelectedMappingRequirement(null);

      if (report) {
        setReport({
          ...report,
          items: report.items.map((i) =>
            i.materialCode === updatedItem.materialCode ? updatedItem : i
          )
        });
      }

      const convertedRow = convertGapItemToResearchQueueRow(updatedItem, {
        assessmentId,
        customerId: report?.customerId || 'CUST-2026-0002',
        customerName: report?.customerName || 'Borosil Ltd'
      });
      setSelectedCommodityForUpload(convertedRow);
      setIsUploadModalOpen(true);
      fetchGapReport();
    },
    [report, assessmentId, fetchGapReport]
  );

  const filteredItems = useMemo(() => {
    if (!report) return [];
    if (selectedStatus === 'ALL') return report.items;
    return report.items.filter((item) => item.gapStatus === selectedStatus);
  }, [report, selectedStatus]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-700">Loading authoritative Borosil PCBI gap catalog...</p>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="bg-rose-50 rounded-xl p-6 border border-rose-200 text-rose-800 text-xs">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Error Loading Gap List</span>
        </div>
        <p>{errorMessage || 'No report data available.'}</p>
        <button
          type="button"
          onClick={fetchGapReport}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 cursor-pointer text-xs"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Navigation Failure Notice */}
      {navigationError && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-900 flex items-start justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">{reviewStrings.navFailureTitle}</span>
              <p className="text-rose-700 mt-0.5">{navigationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNavigationError(null)}
            className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            {reviewStrings.navFailureDismiss}
          </button>
        </div>
      )}

      {/* View Header with Badges and Actions */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
              {strings.badgeReadiness}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {strings.badgeBaseline}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">{strings.viewTitle}</h3>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">{strings.viewSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleOpenGeneralUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{strings.btnUploadBenchmark}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{strings.btnExportCsv}</span>
          </button>

          <Link
            href="/admin/pcbi"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            title="Open PCBI Master Lab & Research Queue"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.btnOpenAdminMaster}</span>
          </Link>
        </div>
      </div>

      {/* KPI & Status Filter Cards */}
      <PCBIMissingIndexStatusCards
        report={report}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      {/* Missing-Index Requirements Table */}
      <PCBIMissingIndexTable
        items={filteredItems}
        onSelectRequirement={onSelectRequirement}
        onUploadBenchmark={handleOpenUploadForRequirement}
        onNavigateToMappingReview={handleNavigateToMappingReview}
      />

      {/* Governed 10-Step Commodity PCBI Benchmark Upload Workflow Modal */}
      <CommodityPCBIUploadWorkflowModal
        isOpen={isUploadModalOpen}
        initialCommodity={selectedCommodityForUpload}
        assessmentId={assessmentId}
        customerId={report?.customerId || 'CUST-2026-0002'}
        customerName={report?.customerName || 'Borosil Ltd'}
        availableRequirements={report?.items || []}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedCommodityForUpload(null);
        }}
        onComplete={handleUploadComplete}
        onNavigateToMappingReview={handleNavigateToMappingReview}
      />

      {/* Governed PCBI Master Mapping Review & Benchmark Governance Modal */}
      <PCBIMasterMappingReviewModal
        isOpen={isMappingReviewOpen}
        requirement={selectedMappingRequirement}
        assessmentId={assessmentId}
        customerId={report?.customerId || 'CUST-2026-0002'}
        customerName={report?.customerName || 'Borosil Ltd'}
        onClose={() => {
          setIsMappingReviewOpen(false);
          setSelectedMappingRequirement(null);
        }}
        onReturnToUpload={handleReturnFromMappingReview}
        onMappingApproved={() => fetchGapReport()}
      />
    </div>
  );
};

