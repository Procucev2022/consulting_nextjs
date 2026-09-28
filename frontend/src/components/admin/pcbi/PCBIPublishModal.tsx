'use client';

/**
 * PCBI Master Publish Confirmation Modal
 */

import React from 'react';
import {
  Rocket,
  AlertTriangle,
  X
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIPublishModalProps } from '../../../types/components';

export const PCBIPublishModal: React.FC<PCBIPublishModalProps> = ({
  isOpen,
  version,
  metrics,
  isPublishing,
  onConfirmPublish,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden space-y-5 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close publish modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Rocket size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {UI_STRINGS.pcbiAdmin.publishModalTitle}
            </h3>
            <span className="text-xs text-amber-300 font-bold">
              Target Version: {version}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {UI_STRINGS.pcbiAdmin.publishModalSubtitle}
        </p>

        {/* Version Summary Matrix */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
          <div>
            <span className="text-slate-400">Benchmarks:</span>
            <p className="text-white font-bold">{metrics?.benchmark_count.toLocaleString() || 290}</p>
          </div>
          <div>
            <span className="text-slate-400">Weekly Series Records:</span>
            <p className="text-cyan-300 font-bold">{metrics?.weekly_records_count.toLocaleString() || 95700}</p>
          </div>
          <div>
            <span className="text-slate-400">Constituent Models:</span>
            <p className="text-purple-300 font-bold">{metrics?.constituent_count.toLocaleString() || 290}</p>
          </div>
          <div>
            <span className="text-slate-400">UNSPSC Mappings:</span>
            <p className="text-amber-300 font-bold">{metrics?.unspsc_mappings_count.toLocaleString() || 73}</p>
          </div>
          <div>
            <span className="text-slate-400">Benchmark Coverage:</span>
            <p className="text-emerald-400 font-bold">{metrics?.total_benchmarkable_pct?.toFixed(1) || 75.8}%</p>
          </div>
          <div>
            <span className="text-slate-400">Quality Distribution:</span>
            <p className="text-slate-200 font-mono">
              A:{metrics?.a_quality_count || 0} B:{metrics?.b_quality_count || 0} C:{metrics?.c_quality_count || 0}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400">Historical Date Span:</span>
            <p className="text-slate-200 font-medium">
              {metrics?.date_start || '2020-04-01'} to {metrics?.date_end || '2026-07-31'}
            </p>
          </div>
        </div>

        {/* Warning Note */}
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p>{UI_STRINGS.pcbiAdmin.publishConfirmPrompt}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
          >
            {UI_STRINGS.pcbiAdmin.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
          >
            <Rocket size={14} />
            <span>{isPublishing ? 'Publishing...' : UI_STRINGS.pcbiAdmin.confirmPublish}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
