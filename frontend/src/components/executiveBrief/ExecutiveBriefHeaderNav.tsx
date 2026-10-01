'use client';
import React from 'react';
import { ShieldCheck, ChevronRight, Award, Lock } from 'lucide-react';
import type { ExecutiveBriefHeaderNavProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefHeaderNav: React.FC<ExecutiveBriefHeaderNavProps> = ({
  clientProfile,
  isReady,
  onNavigateModule,
  activeModuleKey = 'brief'
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  const pipelineStages = [
    { key: 'module1', title: strings.pipeline.module1Title, sub: strings.pipeline.module1Sub },
    { key: 'module2', title: strings.pipeline.module2Title, sub: strings.pipeline.module2Sub },
    { key: 'module3', title: strings.pipeline.module3Title, sub: strings.pipeline.module3Sub },
    { key: 'module4', title: strings.pipeline.module4Title, sub: strings.pipeline.module4Sub },
    { key: 'brief', title: strings.pipeline.briefTitle, sub: strings.pipeline.briefSub }
  ];

  return (
    <div className="space-y-4">
      {/* Top Advisory Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                {clientProfile.confidentiality || strings.confidentialHeader}
              </span>
              <span
                data-testid="brief-ready-badge"
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isReady
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                {isReady ? strings.readyBadge : clientProfile.status}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide mt-2 text-white">
              {strings.panelTitle}
            </h1>
          </div>

          {/* Quick Context Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Client</span>
              <span className="font-bold text-slate-100 truncate block max-w-[140px]" title={clientProfile.clientName}>
                {clientProfile.clientName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Analysis Period</span>
              <span className="font-semibold text-slate-200 block truncate" title={clientProfile.analysisPeriod}>
                {clientProfile.analysisPeriod}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Report Version</span>
              <span className="font-mono text-cyan-400 font-bold block">{clientProfile.reportVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Security</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Tenant Isolated
              </span>
            </div>
          </div>
        </div>

        {/* Procucev Security Notice */}
        <p className="mt-2.5 text-[11px] text-slate-400 leading-relaxed">
          {strings.dataProtectionStatement}
        </p>
      </div>

      {/* Module 1 -> 2 -> 3 -> 4 -> Executive Brief Navigation Pipeline */}
      <nav aria-label="Module Pipeline Navigation" className="overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 min-w-[700px] bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl">
          {pipelineStages.map((stage, idx) => {
            const isCurrent = activeModuleKey === stage.key;
            return (
              <React.Fragment key={stage.key}>
                <button
                  type="button"
                  data-testid={`module-nav-btn-${stage.key}`}
                  onClick={() => onNavigateModule(stage.key)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isCurrent ? 'bg-white text-cyan-900' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-wider">{stage.title}</div>
                    <div className={`text-[10px] truncate ${isCurrent ? 'text-cyan-100' : 'text-slate-400'}`}>
                      {stage.sub}
                    </div>
                  </div>
                </button>
                {idx < pipelineStages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mx-0.5" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
