import React from 'react';
import type { VendorSupplyYoYBadgeProps } from '../../types/vendorSupply';
import { VENDOR_SUPPLY_YOY_STYLES } from '../../constants/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VendorSupplyYoYBadge: React.FC<VendorSupplyYoYBadgeProps> = ({
  pct = 0,
  label,
  observationMark,
  remark,
  compact = false
}) => {
  const strings = UI_STRINGS.module2.vendorSupply;
  const safePct = typeof pct === 'number' && !isNaN(pct) ? pct : 0;
  const isIncrease = safePct > 0;
  const isDecrease = safePct < 0;

  const style = isIncrease
    ? VENDOR_SUPPLY_YOY_STYLES.INCREASE
    : isDecrease
    ? VENDOR_SUPPLY_YOY_STYLES.DECREASE
    : VENDOR_SUPPLY_YOY_STYLES.NEUTRAL;

  const sign = isIncrease ? '+' : '';
  const formattedPct = `${sign}${safePct.toFixed(1)}%`;

  return (
    <div className="inline-flex flex-col items-end space-y-1">
      <div className="inline-flex items-center space-x-1.5">
        {label && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{label}:</span>}
        <span className={`font-mono text-xs ${style.textClass}`}>
          {formattedPct}
        </span>
        {isIncrease && (
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wide ${style.tagClass}`}
            title={observationMark || strings.yoyLegendObservation}
          >
            <span className="w-1 h-1 rounded-full bg-rose-500 mr-1 animate-pulse" />
            {strings.observationBadgeTag}
          </span>
        )}
        {isDecrease && (
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wide ${style.tagClass}`}
            title={remark || strings.yoyLegendRemark}
          >
            <span className="w-1 h-1 rounded-full bg-blue-500 mr-1" />
            {strings.remarkBadgeTag}
          </span>
        )}
      </div>

      {!compact && isIncrease && observationMark && (
        <p className="text-[10px] text-rose-700 dark:text-rose-300 max-w-[200px] text-right truncate" title={observationMark}>
          {observationMark}
        </p>
      )}
      {!compact && isDecrease && remark && (
        <p className="text-[10px] text-blue-700 dark:text-blue-300 max-w-[200px] text-right truncate" title={remark}>
          {remark}
        </p>
      )}
    </div>
  );
};
