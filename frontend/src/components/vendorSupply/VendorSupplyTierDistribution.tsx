import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { VendorSupplyTierDistributionProps } from '../../types/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VendorSupplyTierDistribution: React.FC<VendorSupplyTierDistributionProps> = ({ tiers }) => {
  const strings = UI_STRINGS.module2.vendorSupply;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {strings.spendTierTrendTitle}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {strings.spendTierTrendSubtitle}
        </p>
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => (
          <div key={tier.tier_id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{tier.tier_name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  ({tier.spend_range_label} • {tier.vendor_count} vendors • ₹{tier.total_spend_cr.toFixed(1)} Cr)
                </span>
                {tier.alarm_triggered && (
                  <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-700 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Alarm: Multi Dominant</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono font-semibold">
                <span className="text-amber-700 dark:text-amber-400">
                  {strings.multiShareLabel(tier.multi_category_spend_pct, tier.multi_category_spend_cr)}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {strings.singleShareLabel(tier.single_category_spend_pct, tier.single_category_spend_cr)}
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
              <div
                style={{ width: `${tier.multi_category_spend_pct}%` }}
                className={`h-full transition-all duration-500 ${
                  tier.alarm_triggered
                    ? 'bg-rose-500 dark:bg-rose-600'
                    : 'bg-amber-500 dark:bg-amber-600'
                }`}
                title={`Multi-Category: ${tier.multi_category_spend_pct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${tier.single_category_spend_pct}%` }}
                className="h-full bg-emerald-500 dark:bg-emerald-600 transition-all duration-500"
                title={`Single-Category: ${tier.single_category_spend_pct.toFixed(1)}%`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
