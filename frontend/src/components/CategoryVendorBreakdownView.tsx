'use client';
import React, { useState } from 'react';
import {
  Layers,
  Building2,
  Award,
  ListOrdered,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type {
  CategoryVendorBreakdownViewProps,
  CategoryYearDetail,
  VendorYearDetail
} from '../types';
import { categoryYearWiseDetails, vendorYearWiseDetails } from '../data/mockData';
import { CategoryTopItemsModal } from './modals/CategoryTopItemsModal';
import { VendorTopItemsModal } from './modals/VendorTopItemsModal';
import { UI_STRINGS, resolveUNSPSCCategoryDisplay } from '../constants';
import type { UNSPSCFilterMode } from '../constants';

export const CategoryVendorBreakdownView: React.FC<CategoryVendorBreakdownViewProps> = ({
  tenant,
  categories: propCategories
}) => {
  const categoriesList: CategoryYearDetail[] = React.useMemo(() => {
    if (!propCategories || propCategories.length === 0) {
      return categoryYearWiseDetails;
    }
    return propCategories.map((c: any, idx: number) => {
      const spend = Number(
        (c.total_3yr_spend_inr_cr ?? c.spend_inr_crores ?? (c.spend_fy24_cr || 0) + (c.spend_fy25_cr || 0) + (c.spend_fy26_cr || 0) ?? 10).toFixed(2)
      );
      const fy24 = Number((c.spend_fy24_cr ?? c.spend_inr_2023_cr ?? (spend * 0.28)).toFixed(2));
      const fy25 = Number((c.spend_fy25_cr ?? c.spend_inr_2024_cr ?? (spend * 0.34)).toFixed(2));
      const fy26 = Number((c.spend_fy26_cr ?? c.spend_inr_2025_26_cr ?? (spend * 0.38)).toFixed(2));
      return {
        id: c.id || `CAT-${idx + 1}`,
        category: c.category || c.name || 'Direct Materials Category',
        core_bucket: c.core_bucket || 'Direct Materials',
        sample_column_l_code: c.sample_column_l_code || c.unspsc_code || '12352200',
        spend_fy24_cr: fy24,
        spend_fy25_cr: fy25,
        spend_fy26_cr: fy26,
        total_3yr_spend_inr_cr: spend,
        spend_share_pct: c.spend_share_pct ?? 10,
        yoy_growth_pct: c.yoy_growth_pct ?? 12.0,
        vendor_count: c.vendor_count ?? 5,
        item_count: c.item_count ?? 10,
        top_items: c.top_items ?? [],
        balance_items: c.balance_items,
        sample_column_l_title: c.sample_column_l_title,
        is_balance_category: Boolean(c.is_balance_category),
        rank: c.rank ?? idx + 1
      };
    });
  }, [propCategories]);

  const [selectedYearView, setSelectedYearView] = useState<'ALL' | 'FY24' | 'FY25' | 'FY26'>('ALL');
  const [breakdownMode, setBreakdownMode] = useState<'CATEGORY' | 'VENDOR'>('CATEGORY');
  const [unspscFilterMode, setUnspscFilterMode] = useState<UNSPSCFilterMode>('AUTO');
  const [isBalanceExpanded, setIsBalanceExpanded] = useState<boolean>(false);
  const [isVendorBalanceExpanded, setIsVendorBalanceExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryYearDetail | null>(categoriesList[0]);
  const [selectedVendor, setSelectedVendor] = useState<VendorYearDetail | null>(vendorYearWiseDetails[0]);
  const [isTopItemsModalOpen, setIsTopItemsModalOpen] = useState<boolean>(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);

  const totalEvaluatedSpendInrCr = categoriesList.reduce(
    (sum, item) => sum + (item.total_3yr_spend_inr_cr ?? 0),
    0
  );

  const getYearSpend = (
    item: { spend_fy24_cr?: number; spend_fy25_cr?: number; spend_fy26_cr?: number; total_3yr_spend_inr_cr?: number },
    year: 'ALL' | 'FY24' | 'FY25' | 'FY26'
  ): number => {
    if (!item) return 0;
    switch (year) {
      case 'FY24':
        return item.spend_fy24_cr ?? 0;
      case 'FY25':
        return item.spend_fy25_cr ?? 0;
      case 'FY26':
        return item.spend_fy26_cr ?? 0;
      default:
        return item.total_3yr_spend_inr_cr ?? 0;
    }
  };

  const sortedCategories = [...categoriesList].sort((a, b) => {
    if (a.is_balance_category) return 1;
    if (b.is_balance_category) return -1;
    return getYearSpend(b, selectedYearView) - getYearSpend(a, selectedYearView);
  });

  const sortedVendors = [...vendorYearWiseDetails].sort((a, b) => {
    if (a.is_balance_vendor) return 1;
    if (b.is_balance_vendor) return -1;
    return getYearSpend(b, selectedYearView) - getYearSpend(a, selectedYearView);
  });

  const enterpriseName = tenant?.enterprise_name || 'Apex Industrial Dynamics (Fortune 500)';

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-5">
      {/* Header with Dimension Switcher and Year Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800/80 shrink-0">
              {UI_STRINGS.module2.breakdown.inrValuation}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {breakdownMode === 'CATEGORY'
                ? UI_STRINGS.module2.breakdown.categorySpendBreakdown
                : UI_STRINGS.module2.breakdown.vendorSpendBreakdown}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {UI_STRINGS.module2.breakdown.fiscalYearPrefix}
            <strong className="text-slate-800 dark:text-slate-200">{enterpriseName}</strong>
            {tenant?.major_sector && (
              <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                {tenant.major_sector} › {tenant.minor_sector}
              </span>
            )}
            {': '}
            <strong className="text-emerald-700 dark:text-emerald-400">
              ₹{totalEvaluatedSpendInrCr.toFixed(2)} Crores
            </strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher: By Categories vs By Vendors */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shrink-0 shadow-xs">
            <button
              onClick={() => setBreakdownMode('CATEGORY')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                breakdownMode === 'CATEGORY'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.module2.breakdown.byCategories}</span>
            </button>
            <button
              onClick={() => setBreakdownMode('VENDOR')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                breakdownMode === 'VENDOR'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.module2.breakdown.byVendors}</span>
            </button>
          </div>

          {/* Fiscal Year Switcher Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shrink-0 shadow-xs">
            <button
              onClick={() => setSelectedYearView('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedYearView === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.allFy}
            </button>
            <button
              onClick={() => setSelectedYearView('FY24')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedYearView === 'FY24'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.fy24}
            </button>
            <button
              onClick={() => setSelectedYearView('FY25')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedYearView === 'FY25'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.fy25}
            </button>
            <button
              onClick={() => setSelectedYearView('FY26')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedYearView === 'FY26'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.fy26}
            </button>
          </div>
        </div>
      </div>

      {/* Spend Rank & UNSPSC Hierarchy Filter Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800 flex items-center space-x-1">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.module2.breakdown.spendRankOrder}</span>
          </span>
          <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
            {UI_STRINGS.module2.breakdown.unspscMatchEngine}
          </span>
        </div>

        {/* UNSPSC Hierarchy Level Selector */}
        {breakdownMode === 'CATEGORY' && (
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-[11px] font-mono shrink-0 shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-1.5 hidden lg:inline">
              {UI_STRINGS.module2.breakdown.unspscLevelFilter.label}
            </span>
            <button
              type="button"
              onClick={() => setUnspscFilterMode('AUTO')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                unspscFilterMode === 'AUTO'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.unspscLevelFilter.auto}
            </button>
            <button
              type="button"
              onClick={() => setUnspscFilterMode('COMMODITY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                unspscFilterMode === 'COMMODITY'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.unspscLevelFilter.commodity}
            </button>
            <button
              type="button"
              onClick={() => setUnspscFilterMode('CLASS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                unspscFilterMode === 'CLASS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.module2.breakdown.unspscLevelFilter.class}
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: CATEGORY SPEND BREAKDOWN */}
      {breakdownMode === 'CATEGORY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {sortedCategories.filter((c) => !c.is_balance_category).slice(0, 10).map((cat, idx) => {
              const currentSpendCr = getYearSpend(cat, selectedYearView);

              const fy24 = cat.spend_fy24_cr ?? 0;
              const fy25 = cat.spend_fy25_cr ?? 0;
              const fy26 = cat.spend_fy26_cr ?? 0;

              const sharePct = (
                (currentSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                100
              ).toFixed(1);

              const resolvedUNSPSC = resolveUNSPSCCategoryDisplay(
                cat.sample_column_l_code,
                cat.sample_column_l_title,
                currentSpendCr,
                unspscFilterMode
              );

              // Aggregate major vendors in this segment
              const vendorSpendMap = new Map<string, number>();
              cat.top_items?.forEach((item) => {
                const current = vendorSpendMap.get(item.vendor_name) || 0;
                vendorSpendMap.set(item.vendor_name, current + item.total_spend_inr_cr);
              });
              const topVendors = Array.from(vendorSpendMap.entries())
                .map(([name, spendCr]) => ({ name, spendCr }))
                .sort((a, b) => b.spendCr - a.spendCr);

              const isSelected = selectedCategory?.category === cat.category;

              return (
                <button
                  key={cat.id || cat.category}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsTopItemsModalOpen(true);
                  }}
                  className={`p-3.5 rounded-xl text-left border space-y-2.5 transition-all flex flex-col justify-between cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 shadow-lg bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 border border-slate-700 shadow-xs flex items-center space-x-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>Rank #{idx + 1}</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            resolvedUNSPSC.isCommodity
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {resolvedUNSPSC.isCommodity
                            ? UI_STRINGS.module2.breakdown.unspscCommodityBadge
                            : UI_STRINGS.module2.breakdown.unspscClassBadge}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                          {sharePct}%
                        </span>
                      </div>
                    </div>

                    <h4
                      className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[32px] leading-tight"
                      title={resolvedUNSPSC.displayTitle}
                    >
                      {resolvedUNSPSC.displayTitle}
                    </h4>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">
                      {selectedYearView === 'ALL' ? UI_STRINGS.module2.breakdown.evaluatedSpendLabel : `${selectedYearView} Spend`}
                    </span>
                    <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      ₹{currentSpendCr.toFixed(2)} Cr
                    </p>
                  </div>

                  {/* UNSPSC Taxonomy Context Box */}
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-medium">
                        {resolvedUNSPSC.isCommodity
                          ? UI_STRINGS.module2.breakdown.classLabel
                          : UI_STRINGS.module2.breakdown.commodityLabel}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-200 dark:border-cyan-800">
                        {cat.sample_column_l_code}
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-slate-600 dark:text-slate-400 truncate"
                      title={resolvedUNSPSC.isCommodity ? resolvedUNSPSC.classTitle : resolvedUNSPSC.commodityTitle}
                    >
                      {resolvedUNSPSC.isCommodity ? resolvedUNSPSC.classTitle : resolvedUNSPSC.commodityTitle}
                    </p>
                  </div>

                  {/* Major Spend Vendors in this Segment (Clean, Compact) */}
                  <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1 w-full text-left">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1 font-bold text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>{UI_STRINGS.module2.breakdown.keyVendorsLabel}</span>
                      </span>
                      <span>{UI_STRINGS.module2.breakdown.activeVendorsCount(topVendors.length || 1)}</span>
                    </div>
                    <div className="space-y-0.5">
                      {topVendors.length > 0 ? (
                        topVendors.slice(0, 2).map((v) => (
                          <div key={v.name} className="flex items-center justify-between text-[10px]">
                            <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300 font-medium" title={v.name}>
                              {v.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0 ml-1">
                              ₹{v.spendCr.toFixed(1)} Cr
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {UI_STRINGS.module2.breakdown.noVendorsAvailable}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] font-mono space-y-1 w-full">
                    <div className="flex justify-between text-slate-500">
                      <span>FY24: <strong>₹{fy24.toFixed(1)}</strong></span>
                      <span>FY25: <strong>₹{fy25.toFixed(1)}</strong></span>
                      <span>FY26: <strong>₹{fy26.toFixed(1)}</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                      <div className="bg-sky-400 h-full" style={{ width: `${(fy24 / Math.max(1, cat.total_3yr_spend_inr_cr)) * 100}%` }} />
                      <div className="bg-blue-500 h-full" style={{ width: `${(fy25 / Math.max(1, cat.total_3yr_spend_inr_cr)) * 100}%` }} />
                      <div className="bg-indigo-600 h-full" style={{ width: `${(fy26 / Math.max(1, cat.total_3yr_spend_inr_cr)) * 100}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Balance Categories Drawer */}
          {(() => {
            const balanceCat = sortedCategories.find((c) => c.is_balance_category) ?? sortedCategories[sortedCategories.length - 1];
            const balSpendCr = getYearSpend(balanceCat, selectedYearView);

            const balSharePct = (
              (balSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
              100
            ).toFixed(1);

            const resolvedBalanceUNSPSC = resolveUNSPSCCategoryDisplay(
              balanceCat.sample_column_l_code,
              balanceCat.sample_column_l_title,
              balSpendCr,
              unspscFilterMode
            );

            return (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Rank #11 (Tail Segments)
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {resolvedBalanceUNSPSC.isCommodity
                          ? UI_STRINGS.module2.breakdown.unspscCommodityBadge
                          : UI_STRINGS.module2.breakdown.unspscClassBadge}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {balSharePct}% Share
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {resolvedBalanceUNSPSC.displayTitle}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                      ₹{balSpendCr.toFixed(2)} Cr
                    </p>
                    <button
                      onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>
                        {isBalanceExpanded
                          ? UI_STRINGS.module2.breakdown.hideBalanceCategories(balanceCat.balance_items ? balanceCat.balance_items.length : 7)
                          : UI_STRINGS.module2.breakdown.viewBalanceCategories(balanceCat.balance_items ? balanceCat.balance_items.length : 7)}
                      </span>
                      {isBalanceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isBalanceExpanded && balanceCat.balance_items && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Tail Segment / Category Name</th>
                            <th className="py-2.5 px-3">UNSPSC Col L</th>
                            <th className="py-2.5 px-3 text-right">3-Yr Spend (₹ Cr)</th>
                            <th className="py-2.5 px-3 text-right">Spend Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                          {balanceCat.balance_items.map((item) => (
                            <tr key={item.name} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                              <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold">
                                  {item.column_l_code}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                ₹{item.spend_inr_cr.toFixed(2)} Cr
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500">
                                {item.share_pct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODE 2: VENDOR SPEND BREAKDOWN */}
      {breakdownMode === 'VENDOR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {sortedVendors.filter((v) => !v.is_balance_vendor).slice(0, 10).map((vnd, idx) => {
              const currentSpendCr = getYearSpend(vnd, selectedYearView);

              const fy24 = vnd.spend_fy24_cr;
              const fy25 = vnd.spend_fy25_cr;
              const fy26 = vnd.spend_fy26_cr;

              const sharePct = (
                (currentSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                100
              ).toFixed(1);

              const isSelected = selectedVendor?.vendor_name === vnd.vendor_name;

              return (
                <button
                  key={vnd.id || vnd.vendor_name}
                  onClick={() => {
                    setSelectedVendor(vnd);
                    setIsVendorModalOpen(true);
                  }}
                  className={`p-3.5 rounded-xl text-left border space-y-2.5 transition-all flex flex-col justify-between cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 shadow-lg bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 border border-slate-700 shadow-xs flex items-center space-x-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>Rank #{idx + 1}</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        {isSelected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white animate-pulse">
                            {UI_STRINGS.module2.breakdown.popupReady}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                          {sharePct}%
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[32px] leading-tight" title={vnd.vendor_name}>
                      {vnd.vendor_name}
                    </h4>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">
                      {selectedYearView === 'ALL' ? UI_STRINGS.module2.breakdown.evaluatedSpendLabel : `${selectedYearView} Spend`}
                    </span>
                    <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      ₹{currentSpendCr.toFixed(2)} Cr
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-medium">{UI_STRINGS.module2.breakdown.masterId}</span>
                      <span className="font-mono text-[9px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-200 dark:border-cyan-800">
                        {vnd.master_vendor_id}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={vnd.primary_category}>
                      {vnd.primary_category}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] font-mono space-y-1 w-full">
                    <div className="flex justify-between text-slate-500">
                      <span>FY24: <strong>₹{fy24.toFixed(1)}</strong></span>
                      <span>FY25: <strong>₹{fy25.toFixed(1)}</strong></span>
                      <span>FY26: <strong>₹{fy26.toFixed(1)}</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                      <div className="bg-sky-400 h-full" style={{ width: `${(fy24 / vnd.total_3yr_spend_inr_cr) * 100}%` }} />
                      <div className="bg-blue-500 h-full" style={{ width: `${(fy25 / vnd.total_3yr_spend_inr_cr) * 100}%` }} />
                      <div className="bg-indigo-600 h-full" style={{ width: `${(fy26 / vnd.total_3yr_spend_inr_cr) * 100}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Balance Vendors Drawer */}
          {(() => {
            const balanceVnd = sortedVendors.find((v) => v.is_balance_vendor) ?? sortedVendors[sortedVendors.length - 1];
            const balSpendCr = getYearSpend(balanceVnd, selectedYearView);

            const balSharePct = (
              (balSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
              100
            ).toFixed(1);

            return (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Tail Suppliers (Rank #11 - #52)
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {balSharePct}% Share
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {balanceVnd.vendor_name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                      ₹{balSpendCr.toFixed(2)} Cr
                    </p>
                    <button
                      onClick={() => setIsVendorBalanceExpanded(!isVendorBalanceExpanded)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isVendorBalanceExpanded ? 'Hide' : 'View'} 7 Balance Suppliers</span>
                      {isVendorBalanceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isVendorBalanceExpanded && balanceVnd.balance_vendors && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Tail Vendor / Supplier Name</th>
                            <th className="py-2.5 px-3">Primary Segment</th>
                            <th className="py-2.5 px-3">UNSPSC Col L</th>
                            <th className="py-2.5 px-3 text-right">3-Yr Spend (₹ Cr)</th>
                            <th className="py-2.5 px-3 text-right">Spend Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                          {balanceVnd.balance_vendors.map((item) => (
                            <tr key={item.vendor_name} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                              <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                                {item.vendor_name}
                              </td>
                              <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                                {item.category}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold">
                                  {item.column_l_code}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                ₹{item.spend_inr_cr.toFixed(2)} Cr
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500">
                                {item.share_pct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Interactive Top Items Modals */}
      {selectedCategory && (
        <CategoryTopItemsModal
          isOpen={isTopItemsModalOpen}
          onClose={() => setIsTopItemsModalOpen(false)}
          category={selectedCategory}
          totalEvaluatedSpendInrCr={totalEvaluatedSpendInrCr}
        />
      )}

      {selectedVendor && (
        <VendorTopItemsModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          vendor={selectedVendor}
          totalEvaluatedSpendInrCr={totalEvaluatedSpendInrCr}
        />
      )}
    </div>
  );
};
