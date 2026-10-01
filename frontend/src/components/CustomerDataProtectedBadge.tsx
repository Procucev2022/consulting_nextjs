'use client';

import React, { useState } from 'react';
import type { CustomerDataProtectedBadgeProps } from '../types/components';
import { UI_STRINGS } from '../constants/uiStrings';

/**
 * Enterprise Subtle Customer Data Protected Badge (Prompt 254 Section 11)
 * Used in Module 1, Module 2, Module 4 result views.
 */
export const CustomerDataProtectedBadge: React.FC<CustomerDataProtectedBadgeProps> = ({
  className = '',
  showTooltip = true
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      data-testid="customer-data-protected-badge"
    >
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 cursor-help transition-colors hover:bg-emerald-500/20"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        tabIndex={0}
        role="status"
        aria-label={UI_STRINGS.enterprisePrivacy.resultBadgeLabel}
      >
        <span>{UI_STRINGS.enterprisePrivacy.resultBadgeLabel}</span>
      </div>

      {showTooltip && isTooltipVisible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs leading-normal bg-slate-900 text-slate-200 border border-slate-700 rounded shadow-lg z-50 pointer-events-none"
        >
          {UI_STRINGS.enterprisePrivacy.resultBadgeTooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

export default CustomerDataProtectedBadge;
