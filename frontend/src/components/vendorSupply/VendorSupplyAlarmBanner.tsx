import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import type { VendorSupplyAlarmBannerProps } from '../../types/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VendorSupplyAlarmBanner: React.FC<VendorSupplyAlarmBannerProps> = ({ alarmDetails }) => {
  const strings = UI_STRINGS.module2.vendorSupply;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700/80 shadow-md space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-rose-200 dark:border-rose-800">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                {strings.alarmBadge}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                {strings.viewAlarmBadge}
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950 dark:text-rose-100 mt-1">
              {alarmDetails.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/80">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              {strings.statHighSpendShareLabel}
            </span>
            <span className="font-mono text-xl font-black text-rose-600 dark:text-rose-400">
              {alarmDetails.high_spend_multi_pct.toFixed(1)}%
            </span>
          </div>
          <div className="h-8 w-px bg-rose-200 dark:bg-rose-800" />
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              {strings.statPotentialSavingsLabel}
            </span>
            <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{alarmDetails.potential_savings_cr.toFixed(2)} Cr
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
        {alarmDetails.observation}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs bg-rose-100/70 dark:bg-rose-900/40 p-3 rounded-xl border border-rose-300 dark:border-rose-800/60">
        <div className="flex items-center space-x-2 text-rose-900 dark:text-rose-200 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{alarmDetails.recommendation}</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 shrink-0">
          <span>
            {strings.statAffectedVendorsValue(
              alarmDetails.affected_vendor_count,
              alarmDetails.total_high_spend_vendors
            )}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
