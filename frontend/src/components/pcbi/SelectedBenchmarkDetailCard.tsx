'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  Building,
  ShieldAlert,
  Info
} from 'lucide-react';
import type { SelectedBenchmarkDetailCardProps } from '../../types/module3CommodityResolver';
import { UI_STRINGS } from '../../constants/uiStrings';

export const SelectedBenchmarkDetailCard: React.FC<SelectedBenchmarkDetailCardProps> = ({
  resolution,
  className = '',
  onViewGapRegister
}) => {
  const d = UI_STRINGS.module3.benchmarkDetail;
  const isPendingValidation = resolution.operationalStatus === 'OBSERVATIONS_PENDING_VALIDATION';
  const isMappingRequired = resolution.operationalStatus === 'MATERIAL_MAPPING_REQUIRED';
  const isNonBenchmarkable = resolution.operationalStatus === 'NON_BENCHMARKABLE';

  let statusBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  let statusBannerBg = 'bg-amber-50/70 border-amber-200 text-amber-900';
  let StatusIcon = Clock;

  if (isPendingValidation) {
    statusBadgeColor = 'bg-cyan-100 text-cyan-800 border-cyan-300';
    statusBannerBg = 'bg-cyan-50/70 border-cyan-200 text-cyan-900';
    StatusIcon = AlertTriangle;
  } else if (isMappingRequired) {
    statusBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    statusBannerBg = 'bg-rose-50/70 border-rose-200 text-rose-900';
    StatusIcon = ShieldAlert;
  } else if (isNonBenchmarkable) {
    statusBadgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
    statusBannerBg = 'bg-slate-50/70 border-slate-200 text-slate-800';
    StatusIcon = Info;
  }

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {resolution.pcbiSeriesId || 'PCBI-PENDING-MAPPING'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadgeColor}`}>
              {resolution.operationalStatusLabel}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">
            {resolution.benchmarkSeriesName}
          </h4>
          <p className="text-xs text-slate-500">
            {resolution.benchmarkFamily} • {resolution.materialDefinition}
          </p>
        </div>

        {onViewGapRegister && (
          <button
            type="button"
            onClick={onViewGapRegister}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 border border-indigo-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>{d.viewGapBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Mapped Spend */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>{d.mappedSpendLabel}</span>
          </span>
          <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
            ₹{resolution.canonicalSpendInrCr.toFixed(4)} Cr
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {resolution.canonicalSpendInrCr > 0 ? `${((resolution.canonicalSpendInrCr / 556.5346) * 100).toFixed(2)}% of Baseline` : '0.00%'}
          </span>
        </div>

        {/* Tile 2: Transactions & SAP Codes */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1">
            <Database className="w-3 h-3 text-slate-400" />
            <span>{d.transactionsLabel}</span>
          </span>
          <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
            {resolution.canonicalTransactionCount} Txs
          </p>
          <span className="text-[10px] text-slate-500 font-mono truncate block" title={resolution.linkedSapCodes.join(', ')}>
            SAP: {resolution.linkedSapCodes.join(', ')}
          </span>
        </div>

        {/* Tile 3: Observations & Coverage */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{d.observationsLabel}</span>
          </span>
          <p className="text-lg font-black font-mono text-rose-600 mt-0.5">
            {resolution.availableObservationsCount} Approved
          </p>
          <span className="text-[10px] text-rose-600 font-bold font-mono">
            0.00% Operational Coverage
          </span>
        </div>

        {/* Tile 4: Publisher & Price Basis */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1">
            <Building className="w-3 h-3 text-slate-400" />
            <span>{d.sourceLabel}</span>
          </span>
          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={resolution.publisherSource}>
            {resolution.publisherSource}
          </p>
          <span className="text-[10px] text-slate-500 truncate block">
            {resolution.priceBasis} ({resolution.currency}/{resolution.unit})
          </span>
        </div>
      </div>

      {/* Actionable Missing-Data State Banner */}
      <div className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${statusBannerBg}`}>
        <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">
            {resolution.displayStatusMessage}
          </span>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            <strong className="text-slate-800">{d.evidenceRequiredLabel}</strong> {resolution.missingEvidenceRequired}
          </p>
        </div>
      </div>
    </div>
  );
};
