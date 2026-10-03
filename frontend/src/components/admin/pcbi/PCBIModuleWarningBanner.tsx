'use client';

/**
 * Enterprise Module Warning Banner Component (Part D)
 * Clearly reinforces architectural separation between PCBI Master, PCBI Data Library, and Module 1.
 */

import React from 'react';
import { Database, FlaskConical, FileSpreadsheet, ArrowRight } from 'lucide-react';
import type { PCBIModuleWarningBannerProps } from '../../../types/pcbiDataLibraryComponents';

export const PCBIModuleWarningBanner: React.FC<PCBIModuleWarningBannerProps> = ({
  moduleContext,
  onNavigateAction,
  className = ''
}) => {
  if (moduleContext === 'PCBI_MASTER') {
    return (
      <aside
        aria-label="PCBI Master Scope Notice"
        className={`p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs shadow-sm ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-100 border border-sky-300 text-[#0284C7] shrink-0 mt-0.5 sm:mt-0">
              <Database size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0284C7] tracking-wider uppercase text-[11px]">
                  PCBI MASTER — SYSTEM REFERENCE DATA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-200/60 text-[#0369A1] font-bold border border-sky-300">
                  SYSTEM LEVEL
                </span>
              </div>
              <p className="text-[#475569] mt-1 leading-relaxed">
                Use this area for PCBI definitions, series metadata and system-level reference information. Commodity
                historical benchmark source data must be uploaded through{' '}
                <strong className="text-[#0B1B33] font-bold">PCBI Data Library</strong>.
              </p>
            </div>
          </div>

          {onNavigateAction && (
            <button
              type="button"
              onClick={onNavigateAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-[#0284C7] border border-sky-300 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
            >
              <span>Go to PCBI Data Library</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  if (moduleContext === 'PCBI_DATA_LIBRARY') {
    return (
      <aside
        aria-label="PCBI Data Library Scope Notice"
        className={`p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs shadow-sm ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-100 border border-teal-300 text-teal-700 shrink-0 mt-0.5 sm:mt-0">
              <FlaskConical size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-teal-800 tracking-wider uppercase text-[11px]">
                  PCBI DATA LIBRARY — COMMODITY SOURCE DATA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-200/60 text-teal-900 font-bold border border-teal-300">
                  OPERATIONAL RESEARCH
                </span>
              </div>
              <p className="text-[#475569] mt-1 leading-relaxed">
                Upload and manage historical market/reference data used to construct and maintain PCBI series.
              </p>
            </div>
          </div>

          {onNavigateAction && (
            <button
              type="button"
              onClick={onNavigateAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
            >
              <span>Go to PCBI Master</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Module 1 Customer Purchase Data Notice
  return (
    <aside
      aria-label="Module 1 Customer Data Notice"
      className={`p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 shrink-0 mt-0.5">
          <FileSpreadsheet size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-amber-800 tracking-wider uppercase text-[11px]">
              CUSTOMER PURCHASE DATA
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 font-bold border border-amber-300">
              MODULE 1 ONLY
            </span>
          </div>
          <p className="text-[#475569] mt-1 leading-relaxed">
            Customer purchase-history data must be uploaded and managed through Module 1.
          </p>
        </div>
      </div>
    </aside>
  );
};
