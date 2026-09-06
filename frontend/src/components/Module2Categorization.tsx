'use client';
import React, { useState } from 'react';
import {
  Cpu,
  Boxes,
  Package,
  Wrench,
  Truck,
  CheckCircle2,
  Edit3,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Zap,
  Info,
  BookOpen,
  FileSpreadsheet,
  Layers,
  Check,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { LineItemMapping, SpendCategorySummary, CategoryYearDetail } from '../types';
import { searchUNSPSCTaxonomy, UNSPSCCommodityRecord, unspscOfficialDictionary } from '../data/unspscTaxonomy';
import { categoryYearWiseDetails } from '../data/mockData';
import { formatINRAmount } from '../utils/currencyConverter';

interface Module2CategorizationProps {
  categories: SpendCategorySummary[];
  lineItems: LineItemMapping[];
  onConfirmMapping: (mappingId: string) => void;
  onReassignMapping: (item: LineItemMapping) => void;
  onProceedToTrend: () => void;
}

export const Module2Categorization: React.FC<Module2CategorizationProps> = ({
  categories,
  lineItems,
  onConfirmMapping,
  onReassignMapping,
  onProceedToTrend
}) => {
  const [selectedModel, setSelectedModel] = useState<'Enterprise QUA AI' | 'Public QUA AI'>('Enterprise QUA AI');
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // UNSPSC Column L Live Explorer State
  const [explorerSearch, setExplorerSearch] = useState<string>('');
  const [explorerBucketFilter, setExplorerBucketFilter] = useState<string>('ALL');

  const filteredItems = lineItems.filter((item) => {
    if (selectedBucket !== 'ALL' && item.core_bucket !== selectedBucket) return false;
    if (selectedYearFilter !== 'ALL' && String(item.spend_year) !== selectedYearFilter) return false;
    if (item.ai_confidence < minConfidence) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.raw_desc.toLowerCase().includes(q) ||
        item.vendor_identified.toLowerCase().includes(q) ||
        item.unspsc_code.includes(q) ||
        item.unspsc_category_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const explorerResults = searchUNSPSCTaxonomy(explorerSearch, explorerBucketFilter).slice(0, 8);

  const totalEvaluatedSpendInrCr = categoryYearWiseDetails.reduce(
    (sum, item) => sum + item.total_3yr_spend_inr_cr,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              Module 2: AI Categorization & Taxonomy Mapping (FR-CAT-01, FR-CAT-02)
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
              INR in Crores (₹ Cr) & Column L Taxonomy
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            AI Taxonomy Classification & Spend Year Valuation (INR Crores)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Multi-year spend categorization by value based on <strong>Column L (Commodity Codes)</strong> from official UNSPSC English file v260801.1 normalized via time-series FX conversion rates.
          </p>
        </div>

        {/* Model Selector Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setSelectedModel('Enterprise QUA AI')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedModel === 'Enterprise QUA AI'
                ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise QUA AI</span>
          </button>
          <button
            onClick={() => setSelectedModel('Public QUA AI')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedModel === 'Public QUA AI'
                ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Public QUA AI</span>
          </button>
        </div>
      </div>

      {/* Year-Wise Category Spend Valuation Matrix in INR Crores */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Year-Wise Category Spend Matrix & Column L Benchmarks (INR in Crores)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Annual spend progression in INR Crores (Fiscal Year: 1st April to 31st March), line item counts, and target reduction % mapped to Column L taxonomy.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
            Total Evaluated: ₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr
          </span>
        </div>

        {/* Year-Wise Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Procurement Category</th>
                <th className="py-3 px-4">Column L Code Range</th>
                <th className="py-3 px-4 text-right" title="1st April 2023 – 31st March 2024">FY24 (₹ Cr)</th>
                <th className="py-3 px-4 text-right" title="1st April 2024 – 31st March 2025">FY25 (₹ Cr)</th>
                <th className="py-3 px-4 text-right" title="1st April 2025 – 31st March 2026">FY26 (₹ Cr)</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">Total (FY24-FY26)</th>
                <th className="py-3 px-4 text-center">YoY Trend</th>
                <th className="py-3 px-4 text-right">Target Savings (₹ Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
              {categoryYearWiseDetails.map((cat) => {
                const targetSavingsRate =
                  cat.core_bucket === 'Direct Materials'
                    ? 0.185
                    : cat.core_bucket === 'Packaging Materials'
                    ? 0.161
                    : cat.core_bucket === 'Logistics & Freight'
                    ? 0.12
                    : cat.core_bucket === 'Other Balance'
                    ? 0.08
                    : 0.142;

                const targetSavingsInrCr = cat.total_3yr_spend_inr_cr * targetSavingsRate;
                const fy24 = cat.spend_fy24_cr || cat.spend_inr_2023_cr;
                const fy25 = cat.spend_fy25_cr || cat.spend_inr_2024_cr;
                const fy26 = cat.spend_fy26_cr || cat.spend_inr_2025_26_cr;

                return (
                  <tr
                    key={cat.id || cat.category}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      cat.is_balance_category
                        ? 'bg-slate-50/80 dark:bg-slate-900/60 font-semibold'
                        : 'bg-white dark:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
                      <span className={`w-6 h-5 rounded px-1 text-[10px] font-mono font-bold flex items-center justify-center ${
                        cat.rank && cat.rank <= 3
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {cat.rank ? `#${cat.rank}` : '•'}
                      </span>
                      <span className="truncate max-w-[260px]" title={cat.category}>{cat.category}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                        Col L: {cat.sample_column_l_code.split(',')[0]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                      ₹{fy24.toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                      ₹{fy25.toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                      ₹{fy26.toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{cat.total_3yr_spend_inr_cr.toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        <span>+{cat.yoy_growth_pct}%</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{targetSavingsInrCr.toFixed(2)} Cr
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official UNSPSC English File Column L Live Taxonomy Engine & Search */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  UNSPSC Official File Catalog (Column L: Commodity Engine)
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                  158,476 Catalog Records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live lookup across 4-level taxonomy: Segment (Col C) ➔ Family (Col F) ➔ Class (Col I) ➔ <strong>Commodity (Column L)</strong>.
              </p>
            </div>
          </div>

          {/* Explorer Search & Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Column L code or commodity..."
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
              />
            </div>
            <select
              value={explorerBucketFilter}
              onChange={(e) => setExplorerBucketFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Packaging Materials">Packaging</option>
              <option value="Direct Materials">Direct Materials</option>
              <option value="Indirect & MRO">Indirect & MRO</option>
              <option value="Logistics & Freight">Logistics & Freight</option>
            </select>
          </div>
        </div>

        {/* Live Search Results from Column L */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {explorerResults.map((item) => (
            <div
              key={item.commodityCode}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5 hover:border-cyan-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                  Col L: {item.commodityCode}
                </span>
                <span className="text-[10px] text-slate-500 font-sans font-semibold">
                  {item.coreBucket}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {item.commodityTitle}
              </h5>
              <div className="text-[10px] text-slate-500 space-y-0.5 font-mono">
                <div className="truncate">Class: {item.classTitle} ({item.classCode})</div>
                <div className="truncate">Family: {item.familyTitle} ({item.familyCode})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Learning Line Item Review Workbench */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Machine Learning Line Item Review & Column L Validation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review and confirm QUA AI 8-digit commodity taxonomy predictions converted to <strong>INR in Crores (₹ Cr)</strong>.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 mr-1.5" />
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Years</option>
                <option value="2023">2023 (Yr 1)</option>
                <option value="2024">2024 (Yr 2)</option>
                <option value="2025">2025 (Yr 3)</option>
                <option value="2026">2026 (Yr 3)</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Direct Materials">Direct Materials</option>
              <option value="Packaging Materials">Packaging Materials</option>
              <option value="Indirect & MRO">Indirect & MRO</option>
              <option value="Logistics & Freight">Logistics & Freight</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search description, PO, Col L..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Line Item & Year</th>
                  <th className="py-3 px-4">PO & Item Description</th>
                  <th className="py-3 px-4">Vendor Entity</th>
                  <th className="py-3 px-4">UNSPSC Col L Code & Commodity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Spend Value (₹ Cr)</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4 text-right">Taxonomy Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredItems.map((item) => (
                  <tr
                    key={item.mapping_id}
                    className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan-700 dark:text-cyan-400 block font-mono">
                        {item.line_item_id}
                      </span>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.spend_year || 2024}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-mono text-xs text-slate-400 block">{item.po_number}</span>
                      <span className="text-slate-900 dark:text-white text-xs font-medium">
                        {item.raw_desc}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-200 font-medium">
                      {item.vendor_identified}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                          Col L: {item.unspsc_code}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-sans block mt-0.5 line-clamp-1">
                        {item.unspsc_category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.core_bucket === 'Packaging Materials'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border border-blue-300 dark:border-blue-800/40'
                            : item.core_bucket === 'Direct Materials'
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40'
                            : item.core_bucket === 'Logistics & Freight'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800/40'
                        }`}
                      >
                        {item.core_bucket}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="text-emerald-700 dark:text-emerald-400 font-black">
                        ₹{(item.inr_crores || (item.total_spend / 10000000)).toFixed(2)} Cr
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({formatINRAmount(item.amount_inr || item.total_spend)})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.ai_confidence > 90
                                ? 'bg-emerald-500'
                                : item.ai_confidence > 80
                                ? 'bg-cyan-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.ai_confidence}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.ai_confidence > 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.ai_confidence > 80
                              ? 'text-cyan-600 dark:text-cyan-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.ai_confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status === 'Confirmed' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onConfirmMapping(item.mapping_id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-xs active:scale-95"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => onReassignMapping(item)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-300 dark:border-slate-700 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Re-Assign</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA to Module 3 */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Multi-Year Spend Taxonomy verified against Column L UNSPSC catalog</span>
          </div>
          <button
            onClick={onProceedToTrend}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-md shadow-cyan-600/20 transition-all transform active:scale-95 group"
          >
            <span>Proceed to 36-Month Volatility Analytics</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
