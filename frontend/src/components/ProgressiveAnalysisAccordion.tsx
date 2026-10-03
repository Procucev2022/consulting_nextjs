'use client';

import React, { useState } from 'react';
import type { ProgressiveAnalysisAccordionProps } from '../types/components';
import { UI_STRINGS } from '../constants/uiStrings';

/**
 * Progressive Disclosure Accordion for Long Analytical Details (Prompt 254 Section 16)
 * Keeps default screen executive and clean; expands on user action.
 */
export const ProgressiveAnalysisAccordion: React.FC<ProgressiveAnalysisAccordionProps> = ({
  title,
  defaultExpanded = false,
  children,
  summaryCount,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const displayTitle = title || (isExpanded
    ? UI_STRINGS.enterprisePrivacy.hideDetailedAnalysis
    : UI_STRINGS.enterprisePrivacy.viewDetailedAnalysis);

  return (
    <div
      className={`rounded-lg border border-slate-800 bg-white transition-all ${className}`}
      data-testid="progressive-analysis-accordion"
    >
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 focus:outline-none"
          aria-expanded={isExpanded}
        >
          <span>{displayTitle}</span>
          {typeof summaryCount === 'number' && (
            <span className="rounded-full bg-[#EEF4FC] px-2 py-0.5 text-[10px] text-slate-300 font-mono">
              {summaryCount}
            </span>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-800/80 p-3.5 text-xs text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProgressiveAnalysisAccordion;
