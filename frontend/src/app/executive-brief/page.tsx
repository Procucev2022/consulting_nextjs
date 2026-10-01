'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ExecutiveBriefHeaderNav } from '@/components/executiveBrief/ExecutiveBriefHeaderNav';
import { ExecutiveBriefSummaryCards } from '@/components/executiveBrief/ExecutiveBriefSummaryCards';
import { ExecutiveBriefFormatCards } from '@/components/executiveBrief/ExecutiveBriefFormatCards';
import { ExecutiveBriefSlidePreview } from '@/components/executiveBrief/ExecutiveBriefSlidePreview';
import { ExecutiveBriefOpportunityTable } from '@/components/executiveBrief/ExecutiveBriefOpportunityTable';
import { ExecutiveBriefStructureAccordion } from '@/components/executiveBrief/ExecutiveBriefStructureAccordion';
import { ExecutiveBriefTraceabilityModal } from '@/components/executiveBrief/ExecutiveBriefTraceabilityModal';
import { ExecutiveBriefAuditValidationPanel } from '@/components/executiveBrief/ExecutiveBriefAuditValidationPanel';
import { ExecutiveBriefRegenerateConfirmModal } from '@/components/executiveBrief/ExecutiveBriefRegenerateConfirmModal';
import { mockTenant } from '@/data/mockData';
import { frontendLogger } from '@/utils/logger';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '@/constants/executiveBriefExportStrings';
import type {
  ExecutiveBriefReportData,
  ExecutiveBriefSummaryCardItem,
  ExecutiveBriefTraceabilityItem,
  ExecutiveBriefArtifactItem,
  HeaderCurrency
} from '@/types';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

const NOOP = (): void => {};

export default function ExecutiveBriefPage() {
  const router = useRouter();
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  const [reportData, setReportData] = useState<ExecutiveBriefReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(['01', '03']);
  const [expandedDeepDives, setExpandedDeepDives] = useState<string[]>([]);
  const [isTraceabilityOpen, setIsTraceabilityOpen] = useState<boolean>(false);
  const [activeTraceItem, setActiveTraceItem] = useState<ExecutiveBriefTraceabilityItem | null>(null);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);

  const [downloadPayload, setDownloadPayload] = useState<{ url: string; filename: string } | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const fetchReport = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/reports/executive-brief/report');
      if (!res.ok) {
        throw new Error(`Failed to fetch executive brief report data (${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      } else {
        throw new Error(json.message || strings.errors.fetchReportFailed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      frontendLogger.error('Executive brief data fetch error', { error: msg });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [strings.errors.fetchReportFailed]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const triggerDeclarativeDownload = (url: string, filename: string): void => {
    setDownloadPayload({ url, filename });
    setTimeout(() => {
      if (downloadLinkRef.current) {
        downloadLinkRef.current.click();
      }
    }, 50);
  };

  const handleDownload = async (format: 'pdf' | 'pptx'): Promise<void> => {
    try {
      setIsGeneratingDownload(true);
      const res = await fetch(`/api/reports/executive-brief/download/${format}`);
      if (!res.ok) {
        throw new Error(`Download failed with status ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `Procucev_Executive_Brief_${reportData?.clientProfile.clientName || 'Client'}.${format}`;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) filename = match[1];

      const blobUrl = window.URL.createObjectURL(blob);
      triggerDeclarativeDownload(blobUrl, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      frontendLogger.error('Export download error', { format, error: msg });
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  const handleDownloadArtifact = async (artifact: ExecutiveBriefArtifactItem): Promise<void> => {
    if (artifact.endpoint.includes('/download/')) {
      const format = artifact.endpoint.endsWith('pdf') ? 'pdf' : 'pptx';
      await handleDownload(format);
      return;
    }
    try {
      const res = await fetch(artifact.endpoint);
      if (!res.ok) throw new Error(`Artifact HTTP ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
      const blobUrl = window.URL.createObjectURL(blob);
      triggerDeclarativeDownload(blobUrl, artifact.filename);
    } catch (err: unknown) {
      frontendLogger.warn('Artifact download failure', { error: String(err) });
    }
  };

  const handleRegenerate = async (): Promise<void> => {
    try {
      setIsRegenerating(true);
      const res = await fetch('/api/reports/executive-brief/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: reportData?.clientProfile.clientName })
      });
      if (!res.ok) throw new Error(`Regeneration failed (${res.status})`);
      setIsRegenerateModalOpen(false);
      await fetchReport();
    } catch (err: unknown) {
      frontendLogger.error('Regeneration error', { error: String(err) });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleViewEvidence = (card: ExecutiveBriefSummaryCardItem): void => {
    const matched = reportData?.traceabilityLineage.find((t) => t.module === card.module) || null;
    setActiveTraceItem(matched);
    setIsTraceabilityOpen(true);
  };

  const handleDrillEvidence = (findingId: string): void => {
    const matched = reportData?.traceabilityLineage.find((t) => t.findingId === findingId) || null;
    setActiveTraceItem(matched);
    setIsTraceabilityOpen(true);
  };

  const toggleGroup = (groupId: string): void => {
    setExpandedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleDeepDive = (deepDiveId: string): void => {
    setExpandedDeepDives((prev) =>
      prev.includes(deepDiveId) ? prev.filter((id) => id !== deepDiveId) : [...prev, deepDiveId]
    );
  };

  const handleNavigateModule = (moduleKey: string): void => {
    if (moduleKey === 'brief') return;
    router.push(`/?tab=${moduleKey}`);
  };

  const handleReturnToPipeline = (): void => router.push('/');
  const handleOpenRegenerate = (): void => setIsRegenerateModalOpen(true);
  const handleCloseRegenerate = (): void => setIsRegenerateModalOpen(false);
  const handleCloseTraceability = (): void => setIsTraceabilityOpen(false);
  const handleDownloadPdf = (): void => { void handleDownload('pdf'); };
  const handleOpenFullReport = (): void => setSelectedSlideIndex(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-400 font-mono tracking-wide">Loading Certified Executive Brief...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <h2 className="text-base font-bold">{strings.emptyState.notReadyTitle}</h2>
        <p className="text-xs text-slate-400 text-center max-w-md">{strings.emptyState.notReadyDesc}</p>
        <button
          type="button"
          onClick={handleReturnToPipeline}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{strings.emptyState.returnToPipeline}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {downloadPayload && (
        <a
          ref={downloadLinkRef}
          href={downloadPayload.url}
          download={downloadPayload.filename}
          className="hidden"
          aria-hidden="true"
        >
          Download Target
        </a>
      )}

      <Header
        tenant={mockTenant}
        onSelectTenant={NOOP}
        currency={'INR' as HeaderCurrency}
        onSelectCurrency={NOOP}
        onOpenReport={NOOP}
        theme="dark"
        onSelectTheme={NOOP}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full flex-1">
        <ExecutiveBriefHeaderNav
          clientProfile={reportData.clientProfile}
          isReady={reportData.validationChecklist.financialReconciliation}
          onNavigateModule={handleNavigateModule}
          activeModuleKey="brief"
        />

        <ExecutiveBriefSummaryCards cards={reportData.summaryCards} onViewEvidence={handleViewEvidence} />

        <ExecutiveBriefFormatCards
          clientName={reportData.clientProfile.clientName}
          pdfAvailable
          pptxAvailable
          isGenerating={isGeneratingDownload}
          onDownload={handleDownload}
          onOpenRegenerateModal={handleOpenRegenerate}
        />

        <ExecutiveBriefSlidePreview
          selectedSlideIndex={selectedSlideIndex}
          onSelectSlideIndex={setSelectedSlideIndex}
          onDownloadPdf={handleDownloadPdf}
          onOpenFullReport={handleOpenFullReport}
        />

        <ExecutiveBriefOpportunityTable />

        <ExecutiveBriefStructureAccordion
          sections={reportData.sections}
          expandedGroupIds={expandedGroupIds}
          onToggleGroup={toggleGroup}
          expandedDeepDives={expandedDeepDives}
          onToggleDeepDive={toggleDeepDive}
          onDrillEvidence={handleDrillEvidence}
        />

        <ExecutiveBriefAuditValidationPanel
          checklist={reportData.validationChecklist}
          artifacts={reportData.artifacts}
          onDownloadArtifact={handleDownloadArtifact}
        />
      </main>

      <ExecutiveBriefTraceabilityModal
        isOpen={isTraceabilityOpen}
        onClose={handleCloseTraceability}
        activeItem={activeTraceItem}
        items={reportData.traceabilityLineage}
      />

      <ExecutiveBriefRegenerateConfirmModal
        isOpen={isRegenerateModalOpen}
        onClose={handleCloseRegenerate}
        onConfirm={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}
