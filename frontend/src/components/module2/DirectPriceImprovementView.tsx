'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCw,
  AlertCircle,
  Download,
  ArrowLeft,
  FolderTree
} from 'lucide-react';
import type {
  DirectPriceImprovementViewProps,
  DirectPriceImprovementResult,
  DirectPriceCategorySummary,
  DirectPriceItemOpportunity
} from '../../types';
import { UI_STRINGS } from '../../constants';
import { Module2StrategicSourcingApi } from '../../utils/module2StrategicSourcingApi';
import { assessmentApiClient } from '../../utils/assessmentApi';
import type { AssessmentRecord } from '../../types/assessment';
import { logger } from '../../utils/logger';
import { DirectPriceCards } from './DirectPriceCards';
import { DirectPriceCategoryTable } from './DirectPriceCategoryTable';
import { DirectPriceTable } from './DirectPriceTable';
import { DirectPriceItemDrillDownModal } from './DirectPriceItemDrillDownModal';

export const DirectPriceImprovementView: React.FC<DirectPriceImprovementViewProps> = ({
  assessmentId,
  onCustomerChange
}) => {
  const strings = UI_STRINGS.module2DirectPrice;
  const [effectiveAssessmentId, setEffectiveAssessmentId] = useState<string>(
    assessmentId || ''
  );
  const [result, setResult] = useState<DirectPriceImprovementResult | null>(null);
  const [selectedFy, setSelectedFy] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<DirectPriceCategorySummary | null>(null);
  const [selectedItem, setSelectedItem] = useState<DirectPriceItemOpportunity | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentRecord[]>([]);
  const [assessmentListError, setAssessmentListError] = useState(false);
  const latestRequestRef = useRef(0);

  const lastAssessmentIdRef = useRef(assessmentId);

  useEffect(() => {
    let isCurrent = true;
    assessmentApiClient.getAssessments()
      .then((records) => {
        if (isCurrent) setAvailableAssessments(Array.isArray(records) ? records.filter((record) => record.assessmentId) : []);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setAssessmentListError(true);
        logger.warn('Direct price assessment choices failed to load', {}, error);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    // Follow the parent only when its assessmentId prop changes. Re-syncing whenever the internal
    // selection changes would revert a customer picked here when the parent does not pass it back.
    if (assessmentId !== undefined && assessmentId !== lastAssessmentIdRef.current) {
      lastAssessmentIdRef.current = assessmentId;
      setEffectiveAssessmentId(assessmentId);
      setSelectedFy('ALL');
      setSelectedCategory(null);
    }
  }, [assessmentId]);

  const fetchDirectPriceData = useCallback(async (cId: string, fy: string): Promise<void> => {
    // Responses from superseded requests are ignored, so a slow earlier request for another
    // financial year or customer cannot overwrite the dataset the user is currently viewing.
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    const isLatestRequest = (): boolean => requestId === latestRequestRef.current;
    if (!cId) {
      setResult(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await Module2StrategicSourcingApi.getDirectPriceImprovement(cId, {
        financialYear: fy !== 'ALL' ? fy : undefined
      });
      if (!isLatestRequest()) return;
      if (!data) {
        throw new Error(strings.loadFailedError);
      }
      setResult(data);
    } catch (err: unknown) {
      if (!isLatestRequest()) return;
      const msg = err instanceof Error ? err.message : strings.unknownError;
      setErrorMessage(msg);
    } finally {
      if (isLatestRequest()) {
        setIsLoading(false);
      }
    }
  }, [strings]);

  useEffect(() => {
    void fetchDirectPriceData(effectiveAssessmentId, selectedFy);
  }, [fetchDirectPriceData, effectiveAssessmentId, selectedFy]);

  const handleSelectCustomer = (newAssessmentId: string): void => {
    setEffectiveAssessmentId(newAssessmentId);
    setSelectedFy('ALL');
    setSelectedCategory(null);
    if (onCustomerChange) {
      onCustomerChange(newAssessmentId);
    }
  };

  const handleSelectFy = (fy: string): void => {
    setSelectedFy(fy);
    setSelectedCategory(null);
  };

  const handleSelectCategory = (category: DirectPriceCategorySummary): void => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = (): void => {
    setSelectedCategory(null);
  };

  const handleViewEvidence = (item: DirectPriceItemOpportunity): void => {
    setSelectedItem(item);
    setIsDrilldownOpen(true);
  };

  const handleCloseDrilldown = (): void => {
    setIsDrilldownOpen(false);
    setSelectedItem(null);
  };

  const handleDownloadExcel = (): void => {
    const url = Module2StrategicSourcingApi.getDirectPriceExcelDownloadUrl(effectiveAssessmentId, selectedFy);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 w-full py-2">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              LEVER 1
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {effectiveAssessmentId}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {strings.pageTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            {strings.pageSubtitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Dataset Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {strings.filterCustomer}:
            </span>
            <select
              aria-label={strings.filterCustomer}
              value={effectiveAssessmentId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {!effectiveAssessmentId && <option value="">{strings.selectAssessmentPlaceholder}</option>}
              {effectiveAssessmentId && !availableAssessments.some((record) => record.assessmentId === effectiveAssessmentId) && (
                <option value={effectiveAssessmentId}>{effectiveAssessmentId}</option>
              )}
              {availableAssessments.map((record) => (
                <option key={record.assessmentId} value={record.assessmentId}>
                  {strings.assessmentOptionLabel(record.customerName, record.assessmentId)}
                </option>
              ))}
            </select>
          </div>
          {assessmentListError && <span role="status">{strings.assessmentListFailed}</span>}

          {/* Financial Year Filter */}
          {result?.availableFinancialYears && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {strings.filterFy}:
              </span>
              <select
                aria-label="Financial Year Filter"
                value={selectedFy}
                onChange={(e) => handleSelectFy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {result.availableFinancialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy === 'ALL' ? strings.allFys : fy}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Download Excel Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{strings.btnDownloadExcel}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => void fetchDirectPriceData(effectiveAssessmentId, selectedFy)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {strings.btnRefresh}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !result && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      )}

      {/* Main Content */}
      {result && (
        <>
          <DirectPriceCards result={result} />

          {selectedCategory ? (
            /* Category Drill-Down: Material-Level Analysis */
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    aria-label={strings.btnBackToCategories}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {strings.drilldownCategoryTitle(selectedCategory.unspscCategory)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {selectedCategory.spendCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {strings.drilldownCategorySubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-500">Materials:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100 font-bold">
                      {selectedCategory.distinctMaterialCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Spend:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100 font-bold">
                      ₹{selectedCategory.actualPurchaseCostCr.toFixed(4)} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Lost Opp: ₹{selectedCategory.historicalLostOpportunityCr.toFixed(4)} Cr
                    </span>
                  </div>
                </div>
              </div>

              <DirectPriceTable
                items={selectedCategory.materials}
                availableFinancialYears={result.availableFinancialYears}
                selectedFinancialYear={selectedFy}
                onSelectFinancialYear={handleSelectFy}
                onViewEvidence={handleViewEvidence}
              />
            </div>
          ) : (
            /* Primary Default View: UNSPSC Category-wise Summary */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    UNSPSC Category-wise Spend & Opportunity Register
                  </h2>
                </div>
                <div className="text-xs text-slate-500">
                  Sorted by eligible spend descending • Click any category to view material details
                </div>
              </div>

              <DirectPriceCategoryTable
                categories={result.categorySummaries}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          )}

          <DirectPriceItemDrillDownModal
            isOpen={isDrilldownOpen}
            onClose={handleCloseDrilldown}
            item={selectedItem}
          />
        </>
      )}
    </div>
  );
};
