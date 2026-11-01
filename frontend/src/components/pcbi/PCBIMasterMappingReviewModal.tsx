'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  X,
  Layers,
  FileText,
  Tag,
  Info
} from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import {
  getCandidateSeriesForRequirement,
  getBenchmarkFamilyForCategory,
  getSpendCategoryForRequirement
} from '../../constants/pcbiMappingMaster';
import { pcbiApiClient } from '../../utils/pcbiApi';
import frontendLogger from '../../utils/logger';
import type {
  PCBIMasterMappingReviewModalProps,
  MaterialBenchmarkMappingRecord,
  CandidateBenchmarkSeries
} from '../../types/module3PcbiMapping';
import type { PCBIMissingIndexGapItem } from '../../types/module3GapList';

export const PCBIMasterMappingReviewModal: React.FC<PCBIMasterMappingReviewModalProps> = ({
  isOpen,
  requirement,
  assessmentId = 'AIC-2026-0002',
  customerId = 'CUST-2026-0002',
  customerName = 'Borosil Ltd',
  onClose,
  onReturnToUpload,
  onMappingApproved
}) => {
  const strings = UI_STRINGS.module3.mappingReview;
  const [currentMapping, setCurrentMapping] = useState<MaterialBenchmarkMappingRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [actionType, setActionType] = useState<
    'PROPOSE_CANDIDATE' | 'NO_SUITABLE_BENCHMARK' | 'NEW_SERIES_REQUIRED'
  >('PROPOSE_CANDIDATE');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [rationale, setRationale] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Sriman Auditor');

  const candidates: CandidateBenchmarkSeries[] = useMemo(() => {
    if (!requirement) return [];
    return getCandidateSeriesForRequirement(requirement);
  }, [requirement]);

  const spendCategory = useMemo(() => {
    if (!requirement) return '';
    return getSpendCategoryForRequirement(requirement);
  }, [requirement]);

  const benchmarkFamily = useMemo(() => {
    if (!requirement) return '';
    return getBenchmarkFamilyForCategory(undefined, requirement.commodityClassification);
  }, [requirement]);

  const loadMappingData = useCallback(async () => {
    if (!requirement) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      frontendLogger.info('Loading material benchmark mapping record', {
        materialCode: requirement.materialCode,
        assessmentId
      });
      const res = await pcbiApiClient.getMaterialMappings(assessmentId);
      if (res.success && Array.isArray(res.mappings)) {
        const found = (res.mappings as MaterialBenchmarkMappingRecord[]).find(
          (m) => m.materialCode.trim().toUpperCase() === requirement.materialCode.trim().toUpperCase()
        );
        if (found) {
          setCurrentMapping(found);
          if (found.benchmarkSeriesId && found.benchmarkSeriesId !== 'NONE') {
            setSelectedSeriesId(found.benchmarkSeriesId);
          }
          if (found.evidenceRationale) {
            setRationale(found.evidenceRationale);
          }
          if (found.mappingStatus === 'NO_SUITABLE_BENCHMARK_IDENTIFIED') {
            setActionType('NO_SUITABLE_BENCHMARK');
          } else if (found.mappingStatus === 'NEW_BENCHMARK_SERIES_REQUIRED') {
            setActionType('NEW_SERIES_REQUIRED');
          } else {
            setActionType('PROPOSE_CANDIDATE');
          }
        } else {
          setCurrentMapping(null);
          if (candidates.length > 0) {
            setSelectedSeriesId(candidates[0].seriesId);
            setActionType('PROPOSE_CANDIDATE');
          } else {
            setSelectedSeriesId('');
            setActionType('NO_SUITABLE_BENCHMARK');
          }
        }
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to load mapping record', { error: String(err) });
      setErrorMessage('Failed to load authoritative mapping record from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [requirement, assessmentId, candidates]);

  useEffect(() => {
    if (isOpen && requirement) {
      loadMappingData();
      setSuccessMessage(null);
    }
  }, [isOpen, requirement, loadMappingData]);

  if (!isOpen || !requirement) return null;

  const handleProposeOrSave = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const selectedCandidate = candidates.find((c) => c.seriesId === selectedSeriesId);
      const payload = {
        assessmentId,
        materialCode: requirement.materialCode,
        materialDescription: requirement.materialDescription,
        commodityClassification: requirement.commodityClassification,
        spendCategory,
        unspscCode: requirement.unspscCode,
        historicalSpendCr: requirement.customerSpendCr,
        transactionCount: requirement.transactionCount,
        benchmarkSeriesId: actionType === 'PROPOSE_CANDIDATE' ? selectedCandidate?.seriesId : undefined,
        benchmarkSeriesName: actionType === 'PROPOSE_CANDIDATE' ? selectedCandidate?.seriesName : undefined,
        benchmarkPublisher: actionType === 'PROPOSE_CANDIDATE' ? selectedCandidate?.publisher : undefined,
        specificationComparability: selectedCandidate?.specificationComparability || 'IDENTICAL_GRADE',
        actionType,
        actor: reviewerName,
        rationale: rationale || 'Mapping proposed via PCBI Master Mapping Review interface.'
      };

      const res = await pcbiApiClient.proposeMaterialMapping(payload);
      if (res.success && res.mapping) {
        const updated = res.mapping as MaterialBenchmarkMappingRecord;
        setCurrentMapping(updated);
        setSuccessMessage('Mapping successfully recorded and staged for governance approval.');
        frontendLogger.info('Mapping proposal submitted successfully', { mappingId: updated.id });
      } else {
        setErrorMessage('Failed to submit proposed mapping. Server rejected payload.');
      }
    } catch (err: unknown) {
      frontendLogger.error('Error submitting mapping proposal', { error: String(err) });
      setErrorMessage('Network or server error while proposing benchmark mapping.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalDecision = async (decision: 'APPROVED' | 'REJECTED'): Promise<void> => {
    if (!currentMapping) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await pcbiApiClient.updateMappingApproval(
        currentMapping.id,
        decision,
        reviewerName,
        rationale || `Formal mapping ${decision.toLowerCase()} by ${reviewerName}`
      );
      if (res.success && res.mapping) {
        const updated = res.mapping as MaterialBenchmarkMappingRecord;
        setCurrentMapping(updated);
        setSuccessMessage(
          decision === 'APPROVED' ? strings.alertApproved : 'Mapping has been rejected by reviewer.'
        );
        frontendLogger.info('Mapping approval updated successfully', {
          mappingId: updated.id,
          decision
        });
        if (decision === 'APPROVED' && onMappingApproved) {
          onMappingApproved(buildUpdatedGapItem(updated));
        }
      } else {
        setErrorMessage(`Failed to update mapping approval to ${decision}.`);
      }
    } catch (err: unknown) {
      frontendLogger.error('Error updating mapping approval', { error: String(err) });
      setErrorMessage('Server error encountered while updating approval decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildUpdatedGapItem = (mapping: MaterialBenchmarkMappingRecord | null): PCBIMissingIndexGapItem => {
    const isApproved = mapping?.approvalStatus === 'APPROVED';
    return {
      ...requirement,
      pcbiSeriesId: isApproved && mapping?.benchmarkSeriesId !== 'NONE'
        ? mapping?.benchmarkSeriesId || requirement.pcbiSeriesId
        : requirement.pcbiSeriesId,
      benchmarkSeriesName: isApproved && mapping?.benchmarkSeriesName
        ? mapping.benchmarkSeriesName
        : requirement.benchmarkSeriesName,
      benchmarkPublisherSource: isApproved && mapping?.benchmarkPublisher
        ? mapping.benchmarkPublisher
        : requirement.benchmarkPublisherSource,
      gapStatus: isApproved
        ? mapping?.mappingStatus === 'NO_SUITABLE_BENCHMARK_IDENTIFIED'
          ? 'NO SUITABLE BENCHMARK IDENTIFIED'
          : 'BENCHMARK DEFINED — OBSERVATIONS MISSING'
        : requirement.gapStatus
    };
  };

  const handleReturnToUpload = (): void => {
    onReturnToUpload(buildUpdatedGapItem(currentMapping));
  };

  const isApproved = currentMapping?.approvalStatus === 'APPROVED';
  const isPending = currentMapping?.approvalStatus === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {customerName} ({customerId})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {assessmentId}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {strings.badgeAuditReady}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                {strings.badgeBaselineReconciled}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>{strings.modalTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{strings.modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title={strings.btnClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
              <span>Loading existing mapping records...</span>
            </div>
          )}

          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Context Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                {strings.lblMaterialDetails}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {customerId} • {assessmentId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblMaterialCode}</span>
                <span className="font-bold font-mono text-slate-900">{requirement.materialCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblMaterialDesc}</span>
                <span className="font-semibold text-slate-800 truncate block">{requirement.materialDescription}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblSpendCategory}</span>
                <span className="font-semibold text-slate-800">{spendCategory}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblBenchmarkFamily}</span>
                <span className="font-bold text-indigo-700">{benchmarkFamily}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblExistingSpec}</span>
                <span className="text-slate-700">{requirement.existingGradeSpecification}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblCustomerSpend}</span>
                <span className="font-bold font-mono text-slate-900">
                  ₹{requirement.customerSpendCr.toFixed(4)} Cr ({requirement.transactionCount} txns)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">{strings.lblCurrentStatus}</span>
                <span className="font-bold text-amber-700">{currentMapping?.mappingStatus || requirement.gapStatus}</span>
              </div>
            </div>
          </div>

          {/* Candidate Series Section */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              {strings.lblCandidateSeries}
            </span>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {candidates.map((cand) => (
                  <label
                    key={cand.seriesId}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      selectedSeriesId === cand.seriesId && actionType === 'PROPOSE_CANDIDATE'
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="candidateSeries"
                      checked={selectedSeriesId === cand.seriesId && actionType === 'PROPOSE_CANDIDATE'}
                      onChange={() => {
                        setSelectedSeriesId(cand.seriesId);
                        setActionType('PROPOSE_CANDIDATE');
                      }}
                      className="mt-1 text-indigo-600 cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-slate-900">{cand.seriesName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            {cand.seriesId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              cand.specificationComparability === 'IDENTICAL_GRADE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cand.specificationComparability === 'IDENTICAL_GRADE'
                              ? strings.tagDirectMatch
                              : strings.tagProxyMatch}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px]">{cand.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Publisher: {cand.publisher} • Delivery: {cand.deliveryTermCompatibility} • Unit: {cand.defaultUom} ({cand.defaultCurrency})
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>{strings.tagNoBenchmark}</span>
                </div>
                <p className="text-xs text-amber-800">{strings.lblNoCandidates}</p>
              </div>
            )}
          </div>

          {/* Governance Action Options */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-900">{strings.lblGovernanceDecision}</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={candidates.length === 0}
                onClick={() => setActionType('PROPOSE_CANDIDATE')}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  actionType === 'PROPOSE_CANDIDATE'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {strings.optProposeCandidate}
              </button>
              <button
                type="button"
                onClick={() => setActionType('NO_SUITABLE_BENCHMARK')}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  actionType === 'NO_SUITABLE_BENCHMARK'
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {strings.optNoSuitableBenchmark}
              </button>
              <button
                type="button"
                onClick={() => setActionType('NEW_SERIES_REQUIRED')}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  actionType === 'NEW_SERIES_REQUIRED'
                    ? 'border-sky-600 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {strings.optNewSeriesRequired}
              </button>
            </div>

            {/* Rationale & Reviewer inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">{strings.lblReviewerName}</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">{strings.lblReviewerRationale}</label>
                <input
                  type="text"
                  value={rationale}
                  placeholder={strings.lblRationalePlaceholder}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Proposal / Save Trigger */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProposeOrSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : strings.btnProposeMapping}
              </button>
            </div>
          </div>

          {/* Formal Approval Gate */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Governance Approval Status</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isPending
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentMapping?.approvalStatus || strings.statusUnmapped}
              </span>
            </div>

            {isPending && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
                {strings.alertPendingApproval}
              </div>
            )}
            {isApproved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] leading-relaxed">
                {strings.alertApproved}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting || !currentMapping || isApproved}
                onClick={() => handleApprovalDecision('APPROVED')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{strings.btnApproveMapping}</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !currentMapping}
                onClick={() => handleApprovalDecision('REJECTED')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{strings.btnRejectMapping}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold rounded-lg border border-slate-300 hover:bg-white transition-colors cursor-pointer"
          >
            {strings.btnClose}
          </button>

          <button
            type="button"
            onClick={handleReturnToUpload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{strings.btnReturnToUpload}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
