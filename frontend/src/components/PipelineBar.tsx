'use client';
import React from 'react';
import {
  UploadCloud,
  Cpu,
  LineChart,
  Target,
  Sparkles,
  Layers,
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';
import { PipelineBarProps } from '../types';
import { UI_STRINGS } from '../constants';


export const PipelineBar: React.FC<PipelineBarProps> = ({
  activeTab,
  onSelectTab
}) => {
  const kpis = [
    { label: UI_STRINGS.pipeline.kpis.historicalIngestion.label, value: UI_STRINGS.pipeline.kpis.historicalIngestion.value, sub: UI_STRINGS.pipeline.kpis.historicalIngestion.sub, color: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500/30' },
    { label: UI_STRINGS.pipeline.kpis.realTimeProcessing.label, value: UI_STRINGS.pipeline.kpis.realTimeProcessing.value, sub: UI_STRINGS.pipeline.kpis.realTimeProcessing.sub, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/30' },
    { label: UI_STRINGS.pipeline.kpis.avgIdentifiedSavings.label, value: UI_STRINGS.pipeline.kpis.avgIdentifiedSavings.value, sub: UI_STRINGS.pipeline.kpis.avgIdentifiedSavings.sub, color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' },
    { label: UI_STRINGS.pipeline.kpis.fasterConversion.label, value: UI_STRINGS.pipeline.kpis.fasterConversion.value, sub: UI_STRINGS.pipeline.kpis.fasterConversion.sub, color: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/30' }
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

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary & Strategic System Vision - KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-4 transition-all duration-300 hover:border-cyan-500/40 glass-card"
          >
            <div className="relative z-10 flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className={`text-3xl font-black font-mono tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5">{kpi.sub}</span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/30 blur-xl pointer-events-none" />
          </div>
        ))}
      </div>

      {/* 2. End-to-End Data Pipeline Architecture & Step Navigator */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 glass-panel">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {UI_STRINGS.pipeline.endToEndArchitecture}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectTab('module5')}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'module5'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 border border-purple-500'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {UI_STRINGS.pipeline.conversionMatrixTab}
            </button>
            <button
              onClick={() => onSelectTab('schema')}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                activeTab === 'schema'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-500'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.pipeline.dataArchitectureTab}</span>
            </button>
          </div>
        </div>

        {/* 4 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isActive = activeTab === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectTab(stage.id)}
                className={`group relative text-left p-3.5 rounded-xl transition-all duration-200 border flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-50 to-white dark:from-cyan-950/80 dark:to-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10 dark:shadow-cyan-500/15'
                    : 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                        isActive
                          ? 'bg-cyan-600 dark:bg-cyan-400 text-white dark:text-slate-950 border-cyan-500 dark:border-cyan-300 shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                      }`}
                    />
                  </div>
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                  <span
                    className={isActive ? 'text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}
                  >
                    {isActive ? UI_STRINGS.pipeline.currentActiveView : UI_STRINGS.pipeline.exploreModule}
                  </span>
                  <ArrowRight
                    className={`w-3 h-3 transition-transform ${
                      isActive ? 'text-cyan-600 dark:text-cyan-400 translate-x-0.5' : 'text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
