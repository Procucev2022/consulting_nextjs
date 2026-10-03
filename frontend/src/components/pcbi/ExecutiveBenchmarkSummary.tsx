'use client';

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import type { ExecutiveBenchmarkSummaryProps } from '../../types/components';
import { UI_STRINGS } from '../../constants/uiStrings';

export const ExecutiveBenchmarkSummary: React.FC<ExecutiveBenchmarkSummaryProps> = ({
  summary,
  className = ''
}) => {
  const s = UI_STRINGS.module3.executiveBenchmarkSummary;

  const totalSpendCr = summary?.total_spend_inr_cr ?? 100.0;
  const materialSpendCr = summary?.material_spend_inr_cr ?? 92.0;
  const serviceSpendCr = summary?.service_spend_inr_cr ?? 8.0;
  const unspscMappedCr = summary?.unspsc_mapped_spend_inr_cr ?? 88.0;
  const unspscMappingPct = summary?.unspsc_mapping_percent ?? 95.7;
  const pcbiMappedCr = summary?.pcbi_mapped_spend_inr_cr ?? 88.0;
  const pcbiCoveragePct = summary?.pcbi_coverage_percent ?? 95.7;
  const benchmarkableCr = summary?.benchmarkable_spend_inr_cr ?? 70.0;
  const benchmarkabilityPct = summary?.benchmarkability_percent ?? 76.1;
  const aQualityCr = summary?.a_quality_spend_inr_cr ?? 35.0;
  const bQualityCr = summary?.b_quality_spend_inr_cr ?? 28.0;
  const cQualityCr = summary?.c_quality_spend_inr_cr ?? 7.0;
  const notBenchmarkableCr = summary?.not_benchmarkable_spend_inr_cr ?? 22.0;
  const potentialOppCr = summary?.total_opportunity_inr_cr ?? 8.2;

  const kpiItems = [
    {
      label: s.totalSpend,
      value: `₹${totalSpendCr.toFixed(2)} Cr`,
      badge: '100% Base',
      color: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-white',
      textColor: 'text-slate-900 dark:text-white',
      icon: <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />
    },
    {
      label: s.materialSpend,
      value: `₹${materialSpendCr.toFixed(2)} Cr`,
      badge: `${((materialSpendCr / totalSpendCr) * 100).toFixed(1)}%`,
      color: 'border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: <Package className="w-4 h-4 text-blue-600" />
    },
    {
      label: s.serviceSpend,
      value: `₹${serviceSpendCr.toFixed(2)} Cr`,
      badge: 'Excluded PCBI',
      color: 'border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20',
      textColor: 'text-purple-700 dark:text-purple-400',
      icon: <Layers className="w-4 h-4 text-purple-600" />
    },
    {
      label: s.unspscMappedSpend,
      value: `₹${unspscMappedCr.toFixed(2)} Cr`,
      badge: `${unspscMappingPct.toFixed(1)}% Mapped`,
      color: 'border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20',
      textColor: 'text-cyan-700 dark:text-cyan-400',
      icon: <CheckCircle className="w-4 h-4 text-cyan-600" />
    },
    {
      label: s.pcbiMappedSpend,
      value: `₹${pcbiMappedCr.toFixed(2)} Cr`,
      badge: `${pcbiCoveragePct.toFixed(1)}% Coverage`,
      color: 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      icon: <BarChart3 className="w-4 h-4 text-indigo-600" />
    },
    {
      label: s.benchmarkableSpend,
      value: `₹${benchmarkableCr.toFixed(2)} Cr`,
      badge: `${benchmarkabilityPct.toFixed(1)}% Benchmarkable`,
      color: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      icon: <Award className="w-4 h-4 text-emerald-600" />
    },
    {
      label: s.aQualitySpend,
      value: `₹${aQualityCr.toFixed(2)} Cr`,
      badge: 'Quality A',
      color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-950/40',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-700" />
    },
    {
      label: s.bQualitySpend,
      value: `₹${bQualityCr.toFixed(2)} Cr`,
      badge: 'Quality B',
      color: 'border-cyan-300 dark:border-cyan-800 bg-cyan-100/50 dark:bg-cyan-950/40',
      textColor: 'text-cyan-800 dark:text-cyan-300',
      icon: <Layers className="w-4 h-4 text-cyan-700" />
    },
    {
      label: s.cQualitySpend,
      value: `₹${cQualityCr.toFixed(2)} Cr`,
      badge: 'Quality C (Proxy)',
      color: 'border-amber-300 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-950/40',
      textColor: 'text-amber-800 dark:text-amber-300',
      icon: <HelpCircle className="w-4 h-4 text-amber-700" />
    },
    {
      label: s.notBenchmarkableSpend,
      value: `₹${notBenchmarkableCr.toFixed(2)} Cr`,
      badge: 'Excluded',
      color: 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white',
      textColor: 'text-slate-600 dark:text-slate-400',
      icon: <HelpCircle className="w-4 h-4 text-slate-400" />
    },
    {
      label: s.potentialPcbiOpportunity,
      value: `₹${potentialOppCr.toFixed(2)} Cr`,
      badge: 'Potential Gap',
      color: 'border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 col-span-2 lg:col-span-2',
      textColor: 'text-rose-600 dark:text-rose-400',
      icon: <TrendingUp className="w-4 h-4 text-rose-600" />
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{s.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {s.subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            Deterministic Engine V2.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {kpiItems.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border ${item.color} shadow-xs flex flex-col justify-between transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </span>
              {item.icon}
            </div>
            <div className={`text-lg font-black font-mono tracking-tight ${item.textColor}`}>
              {item.value}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/70 dark:bg-[#F8FBFE] text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
