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
        className={`p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs shadow-md ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
              <Database size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-cyan-300 font-mono tracking-wider uppercase text-[11px]">
                  PCBI MASTER — SYSTEM REFERENCE DATA
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                  SYSTEM LEVEL
                </span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Use this area for PCBI definitions, series metadata and system-level reference information. Commodity
                historical benchmark source data must be uploaded through{' '}
                <strong className="text-cyan-200 font-bold">PCBI Data Library</strong>.
              </p>
            </div>
          </div>

          {onNavigateAction && (
            <button
              type="button"
              onClick={onNavigateAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-600/40 rounded-lg text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
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
        className={`p-4 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs shadow-md ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-950/80 border border-teal-600/40 text-teal-400 shrink-0 mt-0.5 sm:mt-0">
              <FlaskConical size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-teal-300 font-mono tracking-wider uppercase text-[11px]">
                  PCBI DATA LIBRARY — COMMODITY SOURCE DATA
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-teal-900/60 text-teal-200 border border-teal-700/50">
                  OPERATIONAL RESEARCH
                </span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Upload and manage historical market/reference data used to construct and maintain PCBI series.
              </p>
            </div>
          </div>

          {onNavigateAction && (
            <button
              type="button"
              onClick={onNavigateAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-600/40 rounded-lg text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
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
      className={`p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-400 shrink-0 mt-0.5">
          <FileSpreadsheet size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-amber-300 font-mono tracking-wider uppercase text-[11px]">
              CUSTOMER PURCHASE DATA
            </span>
            <span className="text-[10px] px-2 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50">
              MODULE 1 ONLY
            </span>
          </div>
          <p className="text-slate-300 mt-1 leading-relaxed">
            Customer purchase-history data must be uploaded and managed through Module 1.
          </p>
        </div>
      </div>
    </aside>
  );
};
