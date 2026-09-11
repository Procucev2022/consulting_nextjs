'use client';
import React from 'react';
import { AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import type { StrategicSingleVendorCardProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicSingleVendorCard: React.FC<StrategicSingleVendorCardProps> = ({
  item,
  onSelectDetails
}) => {
  const cardStrings = UI_STRINGS.module2.strategicVendorRisk.card;
  const headerStrings = UI_STRINGS.module2.strategicVendorRisk.header;
  const isSoleSource = item.risk_level === 'SOLE_SOURCE_CRITICAL' || !item.secondary_vendor;

  return (
    <div
      data-testid={`strategic-card-${item.material_code}`}
      onClick={() => onSelectDetails(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectDetails(item);
        }
      }}
      className={`p-4 rounded-xl bg-white dark:bg-slate-950/80 border transition-all cursor-pointer group flex flex-col justify-between hover:shadow-lg ${
        isSoleSource
          ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-600'
          : 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: Material Code & Category */}
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            {item.material_code}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
            {item.core_bucket}
          </span>
        </div>

        {/* Material Description & Total Spend */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {cardStrings.totalSpendLabel}
            </span>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {cardStrings.spendCr(item.total_spend_inr_cr)}
            </span>
          </div>
          <h5
            className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
            title={item.material_desc}
          >
            {item.material_desc}
          </h5>
        </div>

        {/* Vendor Concentration Breakdown */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 space-y-2">
          {/* Primary Vendor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={item.primary_vendor.vendor_name}>
                {item.primary_vendor.vendor_name}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {cardStrings.sharePct(item.primary_vendor.share_percentage)}
              </span>
            </div>
            {/* Concentration Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${isSoleSource ? 'bg-rose-500' : 'bg-rose-500'}`}
                style={{ width: `${item.primary_vendor.share_percentage}%` }}
              />
              {item.secondary_vendor && (
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${item.secondary_vendor.share_percentage}%` }}
                />
              )}
            </div>
          </div>

          {/* Secondary Vendor Highlight */}
          {item.secondary_vendor ? (
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={item.secondary_vendor.vendor_name}>
                {item.secondary_vendor.vendor_name}
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                {cardStrings.sharePct(item.secondary_vendor.share_percentage)}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center space-x-1">
              <ShieldAlert className="w-3 h-3 text-rose-500 flex-shrink-0" />
              <span>100% Sole Source (Zero Alternate Supplier)</span>
            </div>
          )}

          {/* Single-Digit Secondary Warning Alert */}
          {item.secondary_vendor && item.secondary_vendor.is_secondary_single_digit && (
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span>{cardStrings.secondaryAlertBadge(item.secondary_vendor.share_percentage)}</span>
            </div>
          )}
        </div>

        {/* UNSPSC Taxonomy Context */}
        <div className="space-y-0.5 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-700 dark:text-cyan-400">
              {cardStrings.unspscCommodityLabel}:
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {item.unspsc_code}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 truncate font-medium" title={item.unspsc_commodity_title}>
            {item.unspsc_commodity_title}
          </p>
          <p className="text-slate-400 truncate text-[9px]" title={`${item.unspsc_class_title} | ${item.unspsc_family_title}`}>
            {item.unspsc_class_title}
          </p>
        </div>
      </div>

      {/* Bottom Footer: Risk Badge & Action CTA */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] mt-2">
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded border text-[9px] ${
            isSoleSource
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          }`}
        >
          {isSoleSource ? headerStrings.badgeSoleSourceCritical : headerStrings.badgeDominantSecondary}
        </span>
        <span className="inline-flex items-center space-x-1 font-semibold text-cyan-600 dark:text-cyan-400 group-hover:underline">
          <span>{cardStrings.actionBtn}</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </span>
      </div>
    </div>
  );
};
