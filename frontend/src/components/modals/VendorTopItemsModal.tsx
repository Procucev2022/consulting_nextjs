'use client';
import React, { useState } from 'react';
import {
  X,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Download,
  Building2,
  Tag,
  Boxes,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { VendorYearDetail, CategoryTopItem } from '../../types';
import { UI_STRINGS } from '../../constants/uiStrings';

interface VendorTopItemsModalProps {
  vendor: VendorYearDetail | null;
  isOpen: boolean;
  onClose: () => void;
  totalEvaluatedSpendInrCr: number;
}

export const VendorTopItemsModal: React.FC<VendorTopItemsModalProps> = ({
  vendor,
  isOpen,
  onClose,
  totalEvaluatedSpendInrCr
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendFilter, setTrendFilter] = useState<'ALL' | 'HIGH_CREEP' | 'STEADY'>('ALL');

  if (!isOpen || !vendor) return null;

  const rawItems = vendor.top_items || [];

  const filteredItems = rawItems.filter((item) => {
    const matchesSearch =
      item.item_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.column_l_code.includes(searchQuery) ||
      item.item_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.po_number.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (trendFilter === 'HIGH_CREEP') return item.price_change_pct >= 15;
    if (trendFilter === 'STEADY') return item.price_change_pct < 10;
    return true;
  });

  const vendorSpendCr = vendor.total_3yr_spend_inr_cr || 0;
  const sharePct = ((vendorSpendCr / totalEvaluatedSpendInrCr) * 100).toFixed(1);
  const highCreepCount = rawItems.filter((i) => i.price_change_pct >= 15).length;
  const totalPotentialLakhs = rawItems.reduce((acc, i) => acc + (i.opportunity_potential_inr_lakhs || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Item ID',
      'Item Description',
      'UNSPSC Column L Code',
      'PO Number',
      'Annual Order Qty',
      'UoM',
      'Currency',
      'FY24 Price (1 Apr 2023 - 31 Mar 2024)',
      'FY25 Price (1 Apr 2024 - 31 Mar 2025)',
      'FY26 Price (1 Apr 2025 - 31 Mar 2026)',
      'Price Variance %',
      '3-Yr Total Spend (INR Cr)',
      'Savings Potential (INR Lakhs)'
    ];

    const rows = rawItems.map((item, idx) => [
      idx + 1,
      item.item_id,
      `"${item.item_desc}"`,
      item.column_l_code,
      item.po_number,
      item.order_qty_annual,
      item.unit_of_measure,
      item.raw_currency,
      item.price_fy24,
      item.price_fy25,
      item.price_fy26,
      `${item.price_change_pct}%`,
      item.total_spend_inr_cr,
      item.opportunity_potential_inr_lakhs || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${vendor.vendor_name.replace(/[^a-zA-Z0-9]/g, '_')}_Top_Items_3Yr_Price_Trend.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col glass-panel">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-amber-300 border border-slate-700 flex items-center space-x-1 shadow-xs">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{UI_STRINGS.modals.topItems.vendorRank(vendor.rank || 1)}</span>
              </span>
              <span className="text-[11px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                {UI_STRINGS.modals.topItems.masterVendorId(vendor.master_vendor_id)}
              </span>
              <span className="text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
                {UI_STRINGS.modals.topItems.spendShareVendor(sharePct)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 inline" />
              <span>{UI_STRINGS.modals.topItems.vendorTitle(vendor.vendor_name)}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.modals.topItems.vendorFiscalYearNote(vendor.primary_category, vendor.sample_column_l_code)}
            </p>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{UI_STRINGS.modals.topItems.exportCSV}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 shrink-0 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{UI_STRINGS.modals.topItems.totalVendorSpend}</span>
            <p className="text-base font-black text-slate-900 dark:text-white">
              ₹{vendorSpendCr.toFixed(2)} Cr
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{UI_STRINGS.modals.topItems.contractedItems}</span>
            <p className="text-base font-black text-cyan-700 dark:text-cyan-400">
              {UI_STRINGS.modals.topItems.lineItemsCount(vendor.line_items_count)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{UI_STRINGS.modals.topItems.priceCreepRiskItems}</span>
            <p className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center space-x-1">
              <span>{UI_STRINGS.modals.topItems.itemsCount(highCreepCount)}</span>
              <span className="text-[10px] font-normal text-rose-500">{UI_STRINGS.modals.topItems.highCreepBadge}</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{UI_STRINGS.modals.topItems.negotiationOpportunity}</span>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
              ₹{(totalPotentialLakhs / 100).toFixed(2)} Cr
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={UI_STRINGS.modals.topItems.searchPlaceholderVendor}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px] font-sans">{UI_STRINGS.modals.topItems.trendFilter}</span>
            <button
              onClick={() => setTrendFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                trendFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.modals.topItems.filterAllItems}
            </button>
            <button
              onClick={() => setTrendFilter('HIGH_CREEP')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                trendFilter === 'HIGH_CREEP'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.modals.topItems.filterHighCreep}
            </button>
            <button
              onClick={() => setTrendFilter('STEADY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                trendFilter === 'STEADY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.modals.topItems.filterSteady}
            </button>
          </div>
        </div>

        {/* Pop-up Table Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3">{UI_STRINGS.modals.topItems.tableHeaders.itemId}</th>
                    <th className="py-3 px-3">{UI_STRINGS.modals.topItems.tableHeaders.description}</th>
                    <th className="py-3 px-3">{UI_STRINGS.modals.topItems.tableHeaders.poRef}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.modals.topItems.tableHeaders.annualQty}</th>
                    <th className="py-3 px-3 text-right" title={UI_STRINGS.modals.topItems.tableHeaders.fy24Title}>{UI_STRINGS.modals.topItems.tableHeaders.fy24Price}</th>
                    <th className="py-3 px-3 text-right" title={UI_STRINGS.modals.topItems.tableHeaders.fy25Title}>{UI_STRINGS.modals.topItems.tableHeaders.fy25Price}</th>
                    <th className="py-3 px-3 text-right" title={UI_STRINGS.modals.topItems.tableHeaders.fy26Title}>{UI_STRINGS.modals.topItems.tableHeaders.fy26Price}</th>
                    <th className="py-3 px-3 text-center">{UI_STRINGS.modals.topItems.tableHeaders.priceTrend3Yr}</th>
                    <th className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{UI_STRINGS.modals.topItems.tableHeaders.spend3Yr}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.modals.topItems.tableHeaders.savingsOpportunity}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                        {UI_STRINGS.modals.topItems.noItemsMatch}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, itemIdx) => {
                      const curr = item.raw_currency || 'USD';
                      return (
                        <tr
                          key={item.item_id || itemIdx}
                          className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="py-3 px-3 font-bold text-cyan-700 dark:text-cyan-400">
                            #{itemIdx + 1}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {item.item_id}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans max-w-[260px]">
                            <span className="text-slate-900 dark:text-white font-semibold block">
                              {item.item_desc}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-200 dark:border-cyan-800 inline-block mt-0.5">
                              {UI_STRINGS.modals.topItems.unspscColL(item.column_l_code)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                            <span className="font-bold">{item.po_number}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {item.order_qty_annual.toLocaleString()} {item.unit_of_measure}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {curr} {item.price_fy24.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {curr} {item.price_fy25.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {curr} {item.price_fy26.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.price_change_pct >= 15
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                                  : item.price_change_pct > 0
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              }`}
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>+{item.price_change_pct}%</span>
                            </span>
                            {item.leakage_flag && (
                              <span className="text-[9px] text-rose-600 dark:text-rose-400 font-sans block mt-0.5 font-semibold">
                                {item.leakage_flag}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm block">
                              ₹{item.total_spend_inr_cr.toFixed(2)} Cr
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              &sum;(Q &times; P &times; FX)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {item.opportunity_potential_inr_lakhs ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 text-[10px]">
                                {UI_STRINGS.modals.topItems.lakhsVal(item.opportunity_potential_inr_lakhs)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">{UI_STRINGS.modals.topItems.standardOpportunity}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Footnote */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>{UI_STRINGS.modals.topItems.vendorSpendFormulaNote}</span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {UI_STRINGS.modals.topItems.baseNormalizationNote}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            {UI_STRINGS.modals.topItems.showingVendorItems(filteredItems.length, rawItems.length, vendor.vendor_name)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {UI_STRINGS.modals.topItems.closePopUp}
          </button>
        </div>
      </div>
    </div>
  );
};
