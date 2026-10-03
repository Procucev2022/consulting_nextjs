'use client';
import React from 'react';
import {
  UploadCloud,
  Cpu,
  LineChart,
  Target,
  ArrowRight,
  Lock
} from 'lucide-react';
import type { PipelineBarProps, PipelineActiveTab } from '../types';
import { UI_STRINGS } from '../constants';

export const PipelineBar: React.FC<PipelineBarProps> = ({
  activeTab,
  onSelectTab,
  tenant,
  opportunities,
  ingestionQueue,
  totalSpendCr,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  unlockedTabs,
  onLockedTabClick
}) => {
  const hasData = Boolean(ingestionQueue && ingestionQueue.length > 0);
  const isStep1Done = isStep1Complete !== undefined
    ? isStep1Complete
    : Boolean(hasData || (totalSpendCr && totalSpendCr > 0) || (tenant?.total_spend_evaluated_inr && tenant.total_spend_evaluated_inr > 0));

  const isStep2Done = isStep2Complete !== undefined
    ? isStep2Complete
    : isStep1Done;

  const isStep3Done = isStep3Complete !== undefined
    ? isStep3Complete
    : isStep2Done;

  const isStep4Done = isStep4Complete !== undefined
    ? isStep4Complete
    : isStep3Done;

  const isStageLocked = (stageId: PipelineActiveTab): boolean => {
    // If explicitly listed in unlockedTabs, it is unlocked (development mode per Prompt 99)
    if (unlockedTabs?.includes(stageId)) {
      return false;
    }
    if (stageId === 'module1') return false;
    if (stageId === 'module2') return !isStep1Done;
    if (stageId === 'module3') return !isStep2Done;
    if (stageId === 'module4') return !isStep3Done;
    if (stageId === 'module5') return !isStep4Done;
    return false;
  };

  const dynamicTotalSavings = opportunities && opportunities.length > 0
    ? (hasData ? opportunities.reduce((sum, o) => sum + (o.est_savings_inr_cr || 0), 0) : 0)
    : (hasData ? 119.67 : 0);

  const totalRecords = hasData && ingestionQueue
    ? ingestionQueue.reduce((sum, doc) => sum + (doc.records_count || 0), 0)
    : 0;

  const evaluatedSpend = hasData ? (totalSpendCr || tenant?.total_spend_evaluated_inr || 0) : 0;

  const kpis = [
    {
      label: UI_STRINGS.pipeline.kpis.historicalIngestion.label,
      value: hasData ? UI_STRINGS.pipeline.kpis.historicalIngestion.value : '0 Mo',
      sub: hasData && totalRecords > 0
        ? `${totalRecords.toLocaleString()} Verified Records Ingested`
        : 'Awaiting File Ingestion',
      color: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-500/30'
    },
    {
      label: UI_STRINGS.pipeline.kpis.realTimeProcessing.label,
      value: hasData ? UI_STRINGS.pipeline.kpis.realTimeProcessing.value : 'Ready',
      sub: hasData ? UI_STRINGS.pipeline.kpis.realTimeProcessing.sub : 'Upload File to Ingest',
      color: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30'
    },
    {
      label: UI_STRINGS.pipeline.kpis.avgIdentifiedSavings.label,
      value: hasData ? `₹${dynamicTotalSavings.toFixed(2)} Cr` : '₹0.00 Cr',
      sub: hasData && evaluatedSpend && evaluatedSpend > 0
        ? `Evaluated on ₹${evaluatedSpend.toFixed(2)} Cr baseline`
        : 'Awaiting Ingestion Baseline',
      color: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30'
    },
    {
      label: UI_STRINGS.pipeline.kpis.fasterConversion.label,
      value: hasData ? UI_STRINGS.pipeline.kpis.fasterConversion.value : 'Ready',
      sub: hasData ? UI_STRINGS.pipeline.kpis.fasterConversion.sub : 'Pipeline Ready',
      color: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30'
    }
  ];

  const stages = [
    {
      id: 'module1' as const,
      step: '1',
      title: UI_STRINGS.pipeline.navStages.step1.title,
      desc: UI_STRINGS.pipeline.navStages.step1.desc,
      icon: UploadCloud
    },
    {
      id: 'module2' as const,
      step: '2',
      title: UI_STRINGS.pipeline.navStages.step2.title,
      desc: UI_STRINGS.pipeline.navStages.step2.desc,
      icon: Cpu
    },
    {
      id: 'module3' as const,
      step: '3',
      title: UI_STRINGS.pipeline.navStages.step3.title,
      desc: UI_STRINGS.pipeline.navStages.step3.desc,
      icon: LineChart
    },
    {
      id: 'module4' as const,
      step: '4',
      title: UI_STRINGS.pipeline.navStages.step4.title,
      desc: UI_STRINGS.pipeline.navStages.step4.desc,
      icon: Target
    }
  ];

  const isModule5Locked = isStageLocked('module5');

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary & Strategic System Vision - KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="ent-kpi-card group"
          >
            <div className="relative z-10 flex flex-col">
              <span className="ent-kpi-label">{kpi.label}</span>
              <div className={`ent-kpi-value ${kpi.color} mt-1.5`}>
                {kpi.value}
              </div>
              <span className="ent-kpi-sub">{kpi.sub}</span>
            </div>
            {/* Decorative accent line at top */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${kpi.border.replace('border-', 'bg-').replace('/30', '/60')}`} />
            <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full opacity-40 blur-2xl pointer-events-none bg-current" />
          </div>
        ))}
      </div>

      {/* 2. End-to-End Data Pipeline Architecture & Step Navigator */}
      <div className="rounded-2xl bg-white/98 dark:bg-[#0a0f1c]/95 border border-slate-200/80 dark:border-slate-800/60 shadow-sm overflow-hidden">
        {/* Navigator Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-[#080d1a] dark:to-[#0c1220] border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" style={{boxShadow: '0 0 0 3px rgba(14,165,233,0.20)', animation: 'pulse-dot 2s infinite'}} />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300">
              {UI_STRINGS.pipeline.endToEndArchitecture}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="/executive-brief"
              data-testid="pipeline-executive-brief-btn"
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined') window.location.href = '/executive-brief';
              }}
              className="ent-btn-primary text-[11px] px-3 py-1.5"
            >
              <span>{UI_STRINGS.header.executiveBrief}</span>
              <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded">CEO/CFO</span>
            </a>
            <a
              href="#module5"
              onClick={(e) => {
                e.preventDefault();
                if (isModule5Locked) {
                  if (onLockedTabClick) {
                    onLockedTabClick('module5');
                  } else {
                    onSelectTab('module5');
                  }
                  return;
                }
                onSelectTab('module5');
                if (typeof window !== 'undefined') window.location.hash = 'module5';
              }}
              className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1 ${
                isModule5Locked
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-[#EEF4FC] text-slate-400 border border-slate-200 dark:border-slate-700'
                  : activeTab === 'module5'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20 border border-purple-500 cursor-pointer'
                  : 'bg-slate-100 dark:bg-[#EEF4FC] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer'
              }`}
            >
              {UI_STRINGS.pipeline.conversionMatrixTab}
            </a>
          </div>
        </div>

        {/* 4 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 p-3 gap-2.5">
          {stages.map((stage, stageIdx) => {
            const Icon = stage.icon;
            const isActive = activeTab === stage.id;
            const isLocked = isStageLocked(stage.id);
            const isDone = [isStep1Done, isStep2Done, isStep3Done, isStep4Done][stageIdx];

            return (
              <a
                key={stage.id}
                href={`#${stage.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (isLocked) {
                    if (onLockedTabClick) {
                      onLockedTabClick(stage.id);
                    }
                    return;
                  }
                  onSelectTab(stage.id);
                  if (typeof window !== 'undefined') window.location.hash = stage.id;
                }}
                className={`group relative text-left p-3.5 rounded-xl transition-all duration-200 border flex flex-col justify-between no-underline block overflow-hidden ${
                  isLocked
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-[#F8FBFE] border-slate-200 dark:border-slate-800/50'
                    : isActive
                    ? 'cursor-pointer bg-gradient-to-b from-sky-50 to-white dark:from-[#001a2e] dark:to-[#0a1020] border-sky-400 dark:border-cyan-600/70 shadow-md'
                    : 'cursor-pointer bg-slate-50/60 dark:bg-[#F8FBFE] border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-white'
                }`}
              >
                {/* Active accent stripe */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400" />
                )}
                {/* Completed accent stripe */}
                {isDone && !isActive && !isLocked && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-70" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                          isLocked
                            ? 'bg-slate-100 dark:bg-[#EEF4FC] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                            : isActive
                            ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                            : isDone
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-[#EEF4FC] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {stage.step}
                      </span>
                      {isLocked && (
                        <span className="flex items-center space-x-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{UI_STRINGS.pipeline.stepLockedBadge}</span>
                        </span>
                      )}
                      {isDone && !isActive && !isLocked && (
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                          Done
                        </span>
                      )}
                    </div>
                    <Icon
                      className={`w-4 h-4 ${
                        isLocked
                          ? 'text-slate-300 dark:text-slate-600'
                          : isActive
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : isDone
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                      }`}
                    />
                  </div>
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      isLocked
                        ? 'text-slate-400 dark:text-slate-500'
                        : isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50 text-[10px]">
                  <span
                    className={
                      isLocked
                        ? 'text-amber-600 dark:text-amber-500 font-medium'
                        : isActive
                        ? 'text-cyan-700 dark:text-cyan-400 font-semibold'
                        : isDone
                        ? 'text-emerald-700 dark:text-emerald-500 font-medium'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  >
                    {isLocked
                      ? UI_STRINGS.pipeline.lockedStage
                      : isActive
                      ? UI_STRINGS.pipeline.currentActiveView
                      : isDone
                      ? 'Completed'
                      : UI_STRINGS.pipeline.exploreModule}
                  </span>
                  {isLocked ? (
                    <Lock className="w-3 h-3 text-amber-500/80" />
                  ) : (
                    <ArrowRight
                      className={`w-3 h-3 transition-transform ${
                        isActive ? 'text-cyan-600 dark:text-cyan-400 translate-x-0.5' : 'text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5'
                      }`}
                    />
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
