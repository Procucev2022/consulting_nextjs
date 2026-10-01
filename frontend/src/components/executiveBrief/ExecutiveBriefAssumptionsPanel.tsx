'use client';

import React from 'react';
import { HelpCircle, CheckCircle, Info } from 'lucide-react';
import type { ExecutiveBriefAssumptionsPanelProps } from '../../types';
import { ASSUMPTION_TAXONOMY_ITEMS } from '../../constants';

export const ExecutiveBriefAssumptionsPanel: React.FC<ExecutiveBriefAssumptionsPanelProps> = ({
  onSelectAssumption
}) => {
  return (
    <section aria-labelledby="assumptions-taxonomy-heading" className="space-y-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="assumptions-taxonomy-heading" className="text-sm font-black uppercase tracking-wider text-white">
                SAVINGS ASSUMPTIONS &amp; METHODOLOGY TAXONOMY
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Audited demarcation between observed facts, analytical findings, benchmarks, planning models, and validated savings
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-semibold self-start sm:self-auto border border-slate-700">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Governance Standard
          </span>
        </div>

        {/* 6 Category Taxonomy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ASSUMPTION_TAXONOMY_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => onSelectAssumption?.(item.key)}
              className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${item.colorClass}`}>
                  {item.badge}
                </span>
                <h3 className="text-xs font-extrabold text-white mt-2 group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {item.definition}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Non-guaranteed planning distinction</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
