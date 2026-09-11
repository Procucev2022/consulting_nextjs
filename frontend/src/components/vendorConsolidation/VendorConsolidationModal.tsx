'use client';
import React, { useState } from 'react';
import { X, Gavel, CheckCircle2, Users, Repeat, Layers } from 'lucide-react';
import type { VendorConsolidationModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const getSupplierTierBadgeClass = (status: string): string => {
  if (status === 'Primary') {
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400';
  }
  if (status === 'Incumbent') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

export const VendorConsolidationModal: React.FC<VendorConsolidationModalProps> = ({
  item,
  isOpen,
  onClose
}) => {
  const [isEventScheduled, setIsEventScheduled] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const strings = UI_STRINGS.vendorConsolidation;

  const handleLaunchAuction = () => {
    setIsEventScheduled(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col glass-panel-glow my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-xs">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                {strings.modalBadge}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {strings.modalTitle(item.item_group_title)}
              </h3>
            </div>
          </div>
          <button
            type="button"
            aria-label={strings.closeModalBtn}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Success Banner if Event Scheduled */}
          {isEventScheduled && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="font-semibold text-xs">{strings.auctionSuccessMessage}</div>
            </div>
          )}

          {/* Item Metrics Snapshot Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Category</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs">{item.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Annual Spend</span>
              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                ₹{item.total_spend_inr_cr.toFixed(2)} Cr
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Active Suppliers</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                {item.vendor_count} Vendors (&gt; 5)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Replenishment Cadence</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                <Repeat className="w-3 h-3 text-cyan-600" />
                <span>{item.procurement_cadence}</span>
              </span>
            </div>
          </div>

          {/* Supplier Fragmentation Alert Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold">
              <Users className="w-4 h-4" />
              <span>{strings.fragmentationAlertTitle}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {strings.fragmentationAlertBody(item.vendor_count, item.price_variance_pct)}
            </p>
          </div>

          {/* Current Supplier Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Current Supplier Fragmentation Breakdown ({item.suppliers.length} Vendors)</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">{strings.tableHeaderVendor}</th>
                    <th className="py-2.5 px-3 text-right">{strings.tableHeaderSpend}</th>
                    <th className="py-2.5 px-3 text-right">{strings.tableHeaderShare}</th>
                    <th className="py-2.5 px-3 text-right">{strings.tableHeaderRateIndex}</th>
                    <th className="py-2.5 px-3 text-right">{strings.tableHeaderPOs}</th>
                    <th className="py-2.5 px-3 text-right">{strings.tableHeaderStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {item.suppliers.map((sup, idx) => (
                    <tr
                      key={sup.vendor_id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                        <div className="font-semibold">{sup.vendor_name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{sup.vendor_id}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₹{sup.annual_spend_inr_cr.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {sup.spend_share_pct.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            sup.unit_rate_index > 110
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {sup.unit_rate_index.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {sup.monthly_po_count}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSupplierTierBadgeClass(sup.status)}`}>
                          {sup.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Section: Target Allocation & e-Auction Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Strategic Allocation */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span>{strings.targetAllocationTitle}</span>
              </h5>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60">
                  <div className="font-bold text-cyan-900 dark:text-cyan-300 text-xs">
                    {strings.targetAllocationPrimary}
                  </div>
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-400 font-mono mt-0.5">
                    Est. Value: ₹{(item.total_spend_inr_cr * 0.7).toFixed(2)} Cr / Year
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                  <div className="font-bold text-blue-900 dark:text-blue-300 text-xs">
                    {strings.targetAllocationSecondary}
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 font-mono mt-0.5">
                    Est. Value: ₹{(item.total_spend_inr_cr * 0.3).toFixed(2)} Cr / Year
                  </div>
                </div>
              </div>
            </div>

            {/* Reverse e-Auction Execution Parameters */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Gavel className="w-3.5 h-3.5 text-cyan-600" />
                <span>{strings.auctionStrategyTitle}</span>
              </h5>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">{strings.auctionTypeLabel}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.recommended_auction_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">{strings.auctionCeilingLabel}</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{strings.auctionCeilingVal}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">{strings.auctionRoundsLabel}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{strings.auctionRoundsVal}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{strings.auctionVolumeCommitmentLabel}</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{strings.auctionVolumeCommitmentVal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Realization Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                {strings.projectedSavingsTitle}
              </span>
              <div className="text-xl font-black font-mono mt-0.5">
                ₹{item.est_volume_savings_cr.toFixed(2)} Cr ({item.est_volume_savings_pct.toFixed(1)}% Net Savings)
              </div>
              <p className="text-[11px] opacity-90 mt-0.5">
                Aggregating predictable 12-month recurring volume guarantees minimum 12–16% margin compression.
              </p>
            </div>
            <button
              type="button"
              disabled={isEventScheduled}
              onClick={handleLaunchAuction}
              className="py-2.5 px-5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center space-x-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gavel className="w-4 h-4 text-cyan-600" />
              <span>{isEventScheduled ? 'Event Scheduled' : strings.launchAuctionBtn}</span>
            </button>
          </div>

          {/* Consolidation Roadmap Steps */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Execution Roadmap &amp; Supplier Engagement Plan
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.consolidation_roadmap.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 flex items-start space-x-2"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {strings.closeModalBtn}
          </button>
          <button
            type="button"
            disabled={isEventScheduled}
            onClick={handleLaunchAuction}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>{isEventScheduled ? 'Auction Initialized' : strings.launchAuctionBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
