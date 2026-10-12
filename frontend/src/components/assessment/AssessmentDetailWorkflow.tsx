'use client';

import React, { useState, useEffect } from 'react';
import type {
  AssessmentRecord,
  AssessmentAnalysisRun,
  AssessmentDetailWorkflowProps,
  DeliveryPackageResult,
  AssessmentAuditLog,
  NdaStatus,
  DataStatus
} from '../../types';
import { UI_STRINGS, ASSESSMENT_STATUS_BADGES } from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import frontendLogger from '../../utils/logger';
import { AssessmentPipelineTab } from './AssessmentPipelineTab';
import { AssessmentChecklistTab } from './AssessmentChecklistTab';
import { AssessmentDeliveryTab } from './AssessmentDeliveryTab';
import { AssessmentAuditTab } from './AssessmentAuditTab';
import { AssessmentApproveModal } from './AssessmentApproveModal';
import { AssessmentUploadTab } from './AssessmentUploadTab';

export const AssessmentDetailWorkflow: React.FC<AssessmentDetailWorkflowProps> = ({
  assessmentId,
  onBack,
  onUpdate
}) => {
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [runs, setRuns] = useState<AssessmentAnalysisRun[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'pipeline' | 'checklist' | 'delivery' | 'audit'>('pipeline');
  const [deliveryPackage, setDeliveryPackage] = useState<DeliveryPackageResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<AssessmentAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData(): Promise<void> {
      try {
        setIsLoading(true);
        const rawData: any = await assessmentApiClient.getAssessmentById(assessmentId);
        const record = rawData?.assessment || rawData;
        if (isMounted) {
          setAssessment(record);
          setRuns(rawData?.runs || []);
          if (record && (!record.activeDataVersionId || record.dataStatus === 'AWAITING_DATA')) {
            setActiveTab('upload');
          }
        }

        const logs = rawData?.auditLogs || (await assessmentApiClient.getAuditLogs(assessmentId));
        if (isMounted) setAuditLogs(logs);

        if (record && (record.status === 'APPROVED' || record.status === 'DELIVERED')) {
          const pkg = await assessmentApiClient.generateDeliveryPackage(assessmentId);
          if (isMounted) setDeliveryPackage(pkg);
        }
      } catch (err: unknown) {
        frontendLogger.error('Failed to load assessment details', { error: err, assessmentId });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadData();
    return () => { isMounted = false; };
  }, [assessmentId]);

  if (isLoading || !assessment) {
    return <div className="p-8 text-center text-slate-400 text-xs font-mono">{UI_STRINGS.common.loading}</div>;
  }

  const badge = ASSESSMENT_STATUS_BADGES[assessment.status] || {
    label: assessment.status,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700'
  };

  const handleNdaChange = async (status: NdaStatus): Promise<void> => {
    try {
      setIsProcessing(true);
      const updated = await assessmentApiClient.updateNdaStatus(assessmentId, status);
      setAssessment(updated);
      onUpdate(updated);
      const logs = await assessmentApiClient.getAuditLogs(assessmentId);
      setAuditLogs(logs);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update NDA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataStatusChange = async (status: DataStatus): Promise<void> => {
    try {
      setIsProcessing(true);
      const updated = await assessmentApiClient.updateDataStatus(assessmentId, status);
      setAssessment(updated);
      onUpdate(updated);
      const logs = await assessmentApiClient.getAuditLogs(assessmentId);
      setAuditLogs(logs);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update Data Status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAnalysis = async (): Promise<void> => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await assessmentApiClient.runAnalysis(assessmentId);
      const rawRefreshed: any = await assessmentApiClient.getAssessmentById(assessmentId);
      const refreshed = rawRefreshed?.assessment || rawRefreshed;
      setAssessment(refreshed);
      setRuns(rawRefreshed?.runs || []);
      onUpdate(refreshed);
      const logs = await assessmentApiClient.getAuditLogs(assessmentId);
      setAuditLogs(logs);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Analysis execution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApproval = async (email: string, comment: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setActionError(null);
      const approved = await assessmentApiClient.approveAssessment(assessmentId, {
        approvedBy: email,
        approvalComment: comment
      });
      setAssessment(approved);
      onUpdate(approved);
      setShowApproveModal(false);

      const pkg = await assessmentApiClient.generateDeliveryPackage(assessmentId);
      setDeliveryPackage(pkg);
      setActiveTab('delivery');
      const logs = await assessmentApiClient.getAuditLogs(assessmentId);
      setAuditLogs(logs);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePackage = async (): Promise<void> => {
    try {
      setIsProcessing(true);
      setActionError(null);
      const pkg = await assessmentApiClient.generateDeliveryPackage(assessmentId);
      setDeliveryPackage(pkg);
      setActiveTab('delivery');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Package generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeRun = runs.find((r) => r.analysisRunId === assessment.activeAnalysisRunId && !r.isSuperseded) || null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-2 inline-flex items-center gap-1"
          >
            {UI_STRINGS.ASSESSMENT.btnBack}
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {assessment.assessmentId}
            </span>
            <h1 className="text-2xl font-bold text-white tracking-wide">{assessment.customerName}</h1>
            {assessment.isTestData && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {UI_STRINGS.ASSESSMENT.table.badgeTestData}
              </span>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {assessment.industry} • Period: {assessment.assessmentPeriodStart} – {assessment.assessmentPeriodEnd} • Analyst: {assessment.assignedAnalyst}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {assessment.status === 'AWAITING_REVIEW' && (
            <button
              type="button"
              onClick={() => setShowApproveModal(true)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-950/40"
            >
              {UI_STRINGS.ASSESSMENT.detail.btnApprove}
            </button>
          )}
          {(assessment.status === 'APPROVED' || assessment.status === 'DELIVERED') && (
            <button
              type="button"
              onClick={handleGeneratePackage}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-lg shadow-cyan-950/40"
            >
              {UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
          {actionError}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 transition-colors ${activeTab === 'upload' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {UI_STRINGS.ASSESSMENT.detail.tabs.upload}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 transition-colors ${activeTab === 'pipeline' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {UI_STRINGS.ASSESSMENT.detail.tabs.workflow}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 transition-colors ${activeTab === 'checklist' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {UI_STRINGS.ASSESSMENT.detail.tabs.reviewChecklist} (26 Gates)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`pb-3 transition-colors ${activeTab === 'delivery' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {UI_STRINGS.ASSESSMENT.detail.tabs.deliveryPackage}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 transition-colors ${activeTab === 'audit' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {UI_STRINGS.ASSESSMENT.detail.tabs.auditTrail} ({auditLogs.length})
        </button>
      </div>

      {/* Tab 0: Module 1 Upload & Ingestion */}
      {activeTab === 'upload' && (
        <AssessmentUploadTab
          assessment={assessment}
          onUploadSuccess={async (updated) => {
            setAssessment(updated);
            onUpdate(updated);
            try {
              const rawRefreshed: any = await assessmentApiClient.getAssessmentById(assessmentId);
              setRuns(rawRefreshed?.runs || []);
              const logs = await assessmentApiClient.getAuditLogs(assessmentId);
              setAuditLogs(logs);
            } catch (err) {
              frontendLogger.error('Failed to refresh assessment runs after upload', { err });
            }
            setActiveTab('pipeline');
          }}
          onCancel={onBack}
        />
      )}

      {/* Tab 1: Execution Pipeline */}
      {activeTab === 'pipeline' && (
        <AssessmentPipelineTab
          assessment={assessment}
          activeRun={activeRun}
          isProcessing={isProcessing}
          onNdaChange={handleNdaChange}
          onDataStatusChange={handleDataStatusChange}
          onRunAnalysis={handleRunAnalysis}
        />
      )}

      {activeTab === 'checklist' && <AssessmentChecklistTab assessment={assessment} />}
      {activeTab === 'delivery' && <AssessmentDeliveryTab deliveryPackage={deliveryPackage} />}
      {activeTab === 'audit' && <AssessmentAuditTab auditLogs={auditLogs} />}

      <AssessmentApproveModal
        isOpen={showApproveModal}
        isProcessing={isProcessing}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
};

export default AssessmentDetailWorkflow;
