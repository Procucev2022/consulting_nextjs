import React from 'react';
import { MODULE_GATES_LIST } from '../../constants';
import type { AssessmentChecklistTabProps } from '../../types';

export const AssessmentChecklistTab: React.FC<AssessmentChecklistTabProps> = ({ assessment }) => {
  const isApproved = assessment.status === 'APPROVED' || assessment.status === 'DELIVERED';
  const hasAnalysis = Boolean(assessment.activeAnalysisRunId);

  const modules = ['Module 1', 'Module 2', 'Module 3', 'Module 4'] as const;

  const moduleSubtitles: Record<string, string> = {
    'Module 1': 'Data Ingestion, FX Normalization & Population Reconciliation (7 Gates)',
    'Module 2': 'Strategic Sourcing Levers & Overlap Methodology (6 Gates)',
    'Module 3': 'PCBI Price Indexation & Analytical Signal Isolation (7 Gates)',
    'Module 4': 'Savings Engine Lineage & Forensic Evidence Completeness (6 Gates)'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Analyst Review Checklist — 26 Mandatory Gates
          </h3>
          <p className="text-xs text-slate-400">
            Rigorous multi-module sign-off gates required prior to executive packaging and customer delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            {hasAnalysis ? (isApproved ? '26 / 26 PASS' : '26 / 26 READY') : '0 / 26 PENDING'}
          </span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
            isApproved
              ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
              : 'bg-amber-950 border-amber-800 text-amber-400'
          }`}>
            {isApproved ? 'CERTIFIED & APPROVED' : 'ANALYST REVIEW'}
          </span>
        </div>
      </div>

      {modules.map((mod) => {
        const gates = MODULE_GATES_LIST.filter((g) => g.module === mod);
        return (
          <div key={mod} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{mod}</span>
                <h4 className="text-xs font-bold text-white">{moduleSubtitles[mod]}</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {gates.length} Gates
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {gates.map((g) => (
                <div key={g.key} className="p-3.5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${hasAnalysis ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="text-xs font-semibold text-white">{g.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard: <span className="text-slate-300">{g.standard}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">Verified Value</span>
                      <span className="text-xs font-mono font-semibold text-cyan-300">
                        {hasAnalysis ? g.verifiedValue : 'Pending Run'}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                      hasAnalysis
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                        : 'bg-amber-950/80 border-amber-800 text-amber-400'
                    }`}>
                      {hasAnalysis ? 'PASS' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
