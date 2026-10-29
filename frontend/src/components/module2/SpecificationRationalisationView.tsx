'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type {
  SpecificationRationalisationResult,
  SpecificationCandidateItem,
  SpecificationRationalisationReviewPayload,
  SpecificationRationalisationViewProps
} from '../../types/module2SpecificationRationalisation';
import {
  SPECIFICATION_UI_STRINGS,
  SPECIFICATION_STATUS_LABELS,
  SPECIFICATION_IDENTIFICATION_LABELS,
  SPECIFICATION_FINANCIAL_DISCLOSURES
} from '../../constants/module2SpecificationRationalisation';
import { SpecificationRationalisationReviewModal } from './SpecificationRationalisationReviewModal';
import { resolveHumanReadableCategory } from '../../utils/procurementCategoryResolver';

export const SpecificationRationalisationView: React.FC<SpecificationRationalisationViewProps> = ({
  assessmentId = '',
  onNavigateBack
}) => {
  const [data, setData] = useState<SpecificationRationalisationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(!!assessmentId);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'awaiting' | 'verified' | 'rejected' | 'dataGaps'>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<SpecificationCandidateItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!assessmentId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/module2/sourcing/specification-rationalisation?assessmentId=${encodeURIComponent(assessmentId)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load Specification Rationalisation (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Invalid API response');
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportExcel = async (): Promise<void> => {
    const url = `/api/module2/sourcing/specification-rationalisation/export-excel?assessmentId=${encodeURIComponent(
      assessmentId
    )}`;
    window.open(url, '_blank');
  };

  const handleOpenReview = (candidate: SpecificationCandidateItem): void => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (payload: SpecificationRationalisationReviewPayload): Promise<void> => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/module2/sourcing/specification-rationalisation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Review submission failed (HTTP ${res.status})`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Review submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading Lever 8 Specification Rationalisation analysis...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 font-medium">
        {error || 'Unable to load Specification Rationalisation data.'}
      </div>
    );
  }

  const { summary, candidates } = data;
  const filteredCandidates = candidates.filter((c) => {
    if (activeFilter === 'awaiting') return c.reviewStatus === 'AWAITING_TECHNICAL_REVIEW';
    if (activeFilter === 'verified') return c.reviewStatus === 'TECHNICALLY_VERIFIED';
    if (activeFilter === 'rejected') return c.reviewStatus === 'REJECTED';
    if (activeFilter === 'dataGaps') return c.hasMissingTechnicalData;
    return true;
  });

  return (
    <div className="space-y-6 w-full py-2">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {SPECIFICATION_UI_STRINGS.BADGE_PHASE_1}
            </span>
            <span className="text-xs text-slate-500 font-mono">{assessmentId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {SPECIFICATION_UI_STRINGS.TITLE}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {SPECIFICATION_UI_STRINGS.SUBTITLE}
          </p>
        </div>
        <div className="flex gap-2">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {SPECIFICATION_UI_STRINGS.BTN_BACK_TO_OVERVIEW}
            </button>
          )}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {SPECIFICATION_UI_STRINGS.BTN_EXPORT_EXCEL}
          </button>
        </div>
      </div>

      {/* Mandatory Financial Governance Banner */}
      <div className="p-3.5 rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 text-xs">
        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
          <span>FINANCIAL BENEFIT STATUS:</span>
          <span className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded">
            {summary.financialBenefitStatus}
          </span>
        </div>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {SPECIFICATION_FINANCIAL_DISCLOSURES.EXPENDITURE_UNDER_REVIEW_NOTICE}{' '}
          {SPECIFICATION_FINANCIAL_DISCLOSURES.AUTOMATED_APPROVAL_PROHIBITED}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_ASSESSED_MATERIALS}</span>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{summary.totalMaterialsAssessedCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_TOTAL_CANDIDATES}</span>
          <p className="text-xl font-bold text-blue-600">{summary.totalCandidatesIdentifiedCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_AWAITING_REVIEW}</span>
          <p className="text-xl font-bold text-amber-600">{summary.awaitingTechnicalReviewCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_VERIFIED}</span>
          <p className="text-xl font-bold text-emerald-600">{summary.technicallyVerifiedCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_REJECTED}</span>
          <p className="text-xl font-bold text-rose-600">{summary.rejectedCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_MISSING_DATA}</span>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{summary.candidatesWithMissingTechnicalDataCount}</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_EXPENDITURE_UNDER_REVIEW}</span>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">₹{summary.totalExpenditureUnderReviewCr.toFixed(2)} Cr</p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-500">{SPECIFICATION_UI_STRINGS.KPI_COMMERCIAL_SAVINGS}</span>
          <p className="text-xl font-bold text-slate-400">₹0.00 Cr</p>
          <span className="text-[10px] text-slate-400 block">{SPECIFICATION_UI_STRINGS.NOT_YET_QUANTIFIABLE}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {SPECIFICATION_UI_STRINGS.TAB_ALL_CANDIDATES} ({summary.totalCandidatesIdentifiedCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('awaiting')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
            activeFilter === 'awaiting'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {SPECIFICATION_UI_STRINGS.TAB_AWAITING_REVIEW} ({summary.awaitingTechnicalReviewCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('verified')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
            activeFilter === 'verified'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {SPECIFICATION_UI_STRINGS.TAB_VERIFIED} ({summary.technicallyVerifiedCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('dataGaps')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
            activeFilter === 'dataGaps'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {SPECIFICATION_UI_STRINGS.TAB_DATA_GAPS} ({summary.candidatesWithMissingTechnicalDataCount})
        </button>
      </div>

      {/* Candidates Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3 border-b">Candidate ID</th>
              <th className="p-3 border-b">Category / Identification</th>
              <th className="p-3 border-b">Primary Item</th>
              <th className="p-3 border-b">Comparison Item</th>
              <th className="p-3 border-b">Expenditure</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  {SPECIFICATION_UI_STRINGS.NO_CANDIDATES_FOUND}
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c) => (
                <tr key={c.candidateId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-blue-600">{c.candidateId}</td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{resolveHumanReadableCategory(c.spendCategory)}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {SPECIFICATION_IDENTIFICATION_LABELS[c.identificationType] || c.identificationType}
                    </span>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <p className="font-medium truncate text-slate-900 dark:text-slate-100" title={c.primaryItem.description}>
                      {c.primaryItem.description}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Code: {c.primaryItem.code || 'N/A'}</span>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <p className="font-medium truncate text-slate-900 dark:text-slate-100" title={c.comparisonItem.description}>
                      {c.comparisonItem.description}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Code: {c.comparisonItem.code || 'N/A'}</span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                    ₹{c.expenditureUnderReviewCr.toFixed(2)} Cr
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.reviewStatus === 'TECHNICALLY_VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : c.reviewStatus === 'AWAITING_TECHNICAL_REVIEW'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : c.reviewStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {SPECIFICATION_STATUS_LABELS[c.reviewStatus] || c.reviewStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {data.reviewWorkflowAvailable === false ? (
                      <span role="status" className="text-xs text-slate-500">
                        {SPECIFICATION_UI_STRINGS.REVIEW_WORKFLOW_UNAVAILABLE}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(c)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800"
                      >
                        {SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Technical Review Modal */}
      {data.reviewWorkflowAvailable === false ? null : (
        <SpecificationRationalisationReviewModal
          isOpen={isModalOpen}
          candidate={selectedCandidate}
          assessmentId={assessmentId}
          onClose={() => setIsModalOpen(false)}
          onSubmitReview={handleSubmitReview}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
