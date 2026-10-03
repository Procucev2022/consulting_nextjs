'use client';
import React from 'react';
import { ShieldCheck, ChevronRight, Award, Lock } from 'lucide-react';
import type { ExecutiveBriefHeaderNavProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';
import { AiCevLogoLockup } from '../presentation/AiCevLogoLockup';

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
      <div className="bg-white border border-[#DCE7F5] rounded-2xl p-4 sm:p-5 text-[#0B1B33] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#DCE7F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                {clientProfile.confidentiality || strings.confidentialHeader}
              </span>
              <span
                data-testid="brief-ready-badge"
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isReady
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                {isReady ? strings.readyBadge : clientProfile.status}
              </span>
              <div className="ml-auto md:hidden">
                <AiCevLogoLockup size="sm" />
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide mt-2 text-[#0B1B33]">
              {strings.panelTitle}
            </h1>
          </div>

          {/* Quick Context Summary and Brand Lockup */}
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5]">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Client</span>
                <span className="font-bold text-[#0B1B33] truncate block max-w-[140px]" title={clientProfile.clientName}>
                  {clientProfile.clientName}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Analysis Period</span>
                <span className="font-semibold text-[#475569] block truncate" title={clientProfile.analysisPeriod}>
                  {clientProfile.analysisPeriod}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Report Version</span>
                <span className="font-mono text-[#0284C7] font-bold block">{clientProfile.reportVersion}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Security</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Tenant Isolated
                </span>
              </div>
            </div>
            <div className="hidden md:block pl-2 border-l border-[#DCE7F5]">
              <AiCevLogoLockup size="md" />
            </div>
          </div>
        </div>

        {/* Procucev Security Notice */}
        <p className="mt-2.5 text-[11px] text-[#64748B] leading-relaxed">
          {strings.dataProtectionStatement}
        </p>
      </div>

      {/* Module 1 -> 2 -> 3 -> 4 -> Executive Brief Navigation Pipeline */}
      <nav aria-label="Module Pipeline Navigation" className="overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 min-w-[700px] bg-white border border-[#DCE7F5] p-1.5 rounded-2xl shadow-xs">
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
                      ? 'bg-[#0284C7] text-white shadow-sm font-bold'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-[#0B1B33]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isCurrent ? 'bg-white text-[#0284c7]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-wider">{stage.title}</div>
                    <div className={`text-[10px] truncate ${isCurrent ? 'text-sky-100' : 'text-slate-400'}`}>
                      {stage.sub}
                    </div>
                  </div>
                </button>
                {idx < pipelineStages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-0.5" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
