'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  AlertCircle,
  Download,
  ArrowLeft,
  FolderTree,
  ShieldAlert
} from 'lucide-react';
import type {
  EAuctionDynamicBiddingViewProps,
  EAuctionResult,
  EAuctionCategoryCandidate
} from '../../types/module2EAuction';
import { UI_STRINGS } from '../../constants';
import { Module2StrategicSourcingApi } from '../../utils/module2StrategicSourcingApi';
import { EAuctionKpiCards } from './EAuctionKpiCards';
import { EAuctionCategoryTable } from './EAuctionCategoryTable';
import { EAuctionMaterialTable } from './EAuctionMaterialTable';

export const EAuctionDynamicBiddingView: React.FC<EAuctionDynamicBiddingViewProps> = ({
  assessmentId,
  onCustomerChange,
  onBackToOverview
}) => {
  const strings = UI_STRINGS.module2EAuction;
  const [effectiveAssessmentId, setEffectiveAssessmentId] = useState<string>(
    assessmentId || ''
  );
  const [result, setResult] = useState<EAuctionResult | null>(null);
  const [selectedFy, setSelectedFy] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<EAuctionCategoryCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId !== undefined && assessmentId !== effectiveAssessmentId) {
      setEffectiveAssessmentId(assessmentId);
      setSelectedFy('ALL');
      setSelectedCategory(null);
    }
  }, [assessmentId, effectiveAssessmentId]);

  const fetchEAuctionData = useCallback(async (cId: string, fy: string): Promise<void> => {
    if (!cId) {
      setResult(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await Module2StrategicSourcingApi.getEAuctionDynamicBidding(cId, {
        financialYear: fy !== 'ALL' ? fy : undefined
      });
      if (!data) {
        throw new Error('Failed to load E-Auction dynamic bidding candidates from sourcing engine');
      }
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEAuctionData(effectiveAssessmentId, selectedFy);
  }, [fetchEAuctionData, effectiveAssessmentId, selectedFy]);

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

  const handleDownloadExcel = (): void => {
    const url = Module2StrategicSourcingApi.getEAuctionExcelDownloadUrl(effectiveAssessmentId, selectedFy);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 w-full py-2">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              LEVER 2
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
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{strings.btnBackToOverview}</span>
            </button>
          )}

          {/* Customer Dataset Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Customer:
            </span>
            <select
              aria-label="Customer Dataset Filter"
              value={effectiveAssessmentId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="AIC-2026-0002">ABC Textile Ltd (AIC-2026-0002)</option>
              <option value="AIC-2026-0003">PQR Cement Ltd (AIC-2026-0003)</option>
            </select>
          </div>

          {/* Financial Year Selector */}
          {result?.availableFinancialYears && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                FY:
              </span>
              <select
                aria-label="Financial Year Filter"
                value={selectedFy}
                onChange={(e) => handleSelectFy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {result.availableFinancialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy === 'ALL' ? 'All Financial Years' : fy}
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
            onClick={() => void fetchEAuctionData(effectiveAssessmentId, selectedFy)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/60 rounded-lg text-purple-700 dark:text-purple-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900 dark:text-purple-200 text-sm tracking-wide">
                {strings.certificationNotice}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
                FEASIBILITY SCREENING ONLY
              </span>
            </div>
            <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-0.5">
              {strings.disclaimer}
            </p>
          </div>
        </div>
        <div className="text-xs text-purple-900 dark:text-purple-200 font-medium px-3 py-1.5 bg-purple-100/80 dark:bg-purple-900/40 rounded-md border border-purple-200 dark:border-purple-800 whitespace-nowrap">
          {strings.badge}
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
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      )}

      {/* Main Content */}
      {result && (
        <>
          {/* Top KPI Cards */}
          <EAuctionKpiCards result={result} />

          {selectedCategory ? (
            /* Material-Level Candidate Breakdown Drill-Down */
            <EAuctionMaterialTable
              materials={selectedCategory.materials}
              categoryName={selectedCategory.spendCategory}
              onBack={() => setSelectedCategory(null)}
            />
          ) : (
            /* Category-Wise Candidate Analysis Primary Table */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    UNSPSC Category-wise E-Auction Candidate Register
                  </h2>
                </div>
                <div className="text-xs text-slate-500">
                  Sorted by spend descending • Click any category to view material candidate breakdown
                </div>
              </div>

              <EAuctionCategoryTable
                categories={result.categories}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
