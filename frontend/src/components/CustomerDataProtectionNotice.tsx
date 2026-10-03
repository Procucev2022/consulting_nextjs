'use client';

import React, { useState } from 'react';
import type { CustomerDataProtectionNoticeProps } from '../types/components';
import { UI_STRINGS } from '../constants/uiStrings';

/**
 * Reusable Enterprise Customer Data Confidentiality & Protection Notice
 * Provides progressive disclosure of tenant isolation, encryption, and zero-reuse guarantees.
 */
export const CustomerDataProtectionNotice: React.FC<CustomerDataProtectionNoticeProps> = ({
  moduleContext = 'module1',
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const getContextualNotice = (): string => {
    switch (moduleContext) {
      case 'module1':
        return UI_STRINGS.dataProtection.uploadNotice;
      case 'module2':
      case 'module3':
        return UI_STRINGS.dataProtection.analysisNotice;
      case 'export':
        return UI_STRINGS.dataProtection.exportNotice;
      default:
        return UI_STRINGS.dataProtection.bannerNotice;
    }
  };

  return (
    <div
      className={`rounded-lg border border-slate-700 bg-white p-4 text-slate-200 shadow-sm backdrop-blur transition-all ${className}`}
      data-testid="customer-data-protection-notice"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span role="img" aria-label="Security Shield">🛡️</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              {UI_STRINGS.dataProtection.bannerTitle}
            </h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-3xl">
              {getContextualNotice()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="self-start sm:self-center shrink-0 rounded px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-expanded={isExpanded}
          aria-controls="data-protection-details"
        >
          {isExpanded ? UI_STRINGS.dataProtection.collapseLabel : UI_STRINGS.dataProtection.expandLabel}
        </button>
      </div>

      {isExpanded && (
        <div id="data-protection-details" className="mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="rounded bg-[#F8FBFE] p-3 border border-slate-800/80 mb-4">
            <span className="font-semibold text-emerald-400 block mb-1">
              {UI_STRINGS.dataProtection.bannerTitle}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {UI_STRINGS.dataProtection.corePromise}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {UI_STRINGS.dataProtection.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="rounded border border-slate-800 bg-[#F8FBFE] p-2.5 transition-colors hover:border-slate-700"
              >
                <div className="font-medium text-slate-100">{pillar.title}</div>
                <div className="mt-1 text-slate-400 leading-normal text-[11px]">{pillar.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-800/60">
            <span>{UI_STRINGS.dataProtection.retentionNotice}</span>
            <span className="font-mono text-emerald-400/80 bg-[#F8FBFE] px-2 py-0.5 rounded border border-slate-800">
              {UI_STRINGS.dataProtection.exportConfidentialHeader}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDataProtectionNotice;
