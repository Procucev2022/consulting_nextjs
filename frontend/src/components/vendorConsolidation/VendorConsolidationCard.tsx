'use client';
import React from 'react';
import { Repeat, ArrowRight, Gavel, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { VendorConsolidationCardProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const getCategoryBadgeClass = (category: string): string => {
  switch (category) {
    case 'Packaging Materials':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'Indirect & MRO':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'Logistics & Freight':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'Direct Materials':
    default:
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
  }
};

export const VendorConsolidationCard: React.FC<VendorConsolidationCardProps> = ({
  item,
  onInitiateConsolidation
}) => {
  const strings = UI_STRINGS.vendorConsolidation;
  const badgeClass = getCategoryBadgeClass(item.category);

  return (
    <div
      data-testid={`consolidation-card-${item.id}`}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-cyan-500/50 transition-all flex flex-col justify-between group space-y-4"
    >
      {/* Top Header: Category, Cadence Badge, Vendor Count */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
              {item.category}
            </span>
            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-cyan-800 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/80">
              <Repeat className="w-3 h-3 text-cyan-600 dark:text-cyan-400 animate-spin-slow" />
              <span>{strings.recurringCadenceBadge}</span>
            </span>
          </div>

          {/* Vendors Count Warning Badge */}
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
            <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{strings.vendorCountBadge(item.vendor_count)}</span>
          </span>
        </div>

        {/* Item Title & Codes */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1" title={item.item_group_title}>
            {item.item_group_title}
          </h4>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {item.item_group_code}
            </span>
            <span className="truncate">UNSPSC: {item.unspsc_family}</span>
          </div>
        </div>

        {/* Financial & Cadence Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/70 dark:border-slate-800/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Annual Spend
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">
              ₹{item.total_spend_inr_cr.toFixed(2)} Cr
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/70 dark:border-slate-800/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Order Velocity
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1 mt-0.5">
              <span>{strings.monthlyPoBadge(item.monthly_po_avg)}</span>
            </span>
          </div>
        </div>

        {/* Price Dispersion & Target Roster Callout */}
        <div className="space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{strings.priceVarianceLabel}</span>
            </span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">
              {strings.priceVarianceValue(item.price_variance_pct)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-600" />
              <span>{strings.targetConsolidationLabel}:</span>
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {strings.targetConsolidationValue(item.target_consolidated_vendors)}
            </span>
          </div>
        </div>

        {/* e-Auction Volume Savings Box */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              {strings.volumeBenefitLabel}
            </span>
            <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-300">
              {strings.volumeBenefitValue(item.est_volume_savings_cr, item.est_volume_savings_pct)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block font-mono">
              {strings.auctionPlatformLabel(item.auction_platform)}
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <button
        type="button"
        onClick={() => onInitiateConsolidation(item)}
        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 group-hover:scale-[1.01]"
      >
        <Gavel className="w-3.5 h-3.5" />
        <span>{strings.initiateConsolidationBtn}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
