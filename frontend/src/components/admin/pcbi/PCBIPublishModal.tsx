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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl overflow-hidden space-y-5 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close publish modal"
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0B1B33] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Rocket size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1B33] tracking-tight">
              {UI_STRINGS.pcbiAdmin.publishModalTitle}
            </h3>
            <span className="text-xs text-amber-600 font-bold">
              Target Version: {version}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          {UI_STRINGS.pcbiAdmin.publishModalSubtitle}
        </p>

        {/* Version Summary Matrix */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-xs">
          <div>
            <span className="text-[#64748B]">Benchmarks:</span>
            <p className="text-[#0B1B33] font-bold tabular-nums">{metrics?.benchmark_count.toLocaleString() || 290}</p>
          </div>
          <div>
            <span className="text-[#64748B]">Weekly Series Records:</span>
            <p className="text-[#0284C7] font-bold tabular-nums">{metrics?.weekly_records_count.toLocaleString() || 95700}</p>
          </div>
          <div>
            <span className="text-[#64748B]">Constituent Models:</span>
            <p className="text-[#0B1B33] font-bold tabular-nums">{metrics?.constituent_count.toLocaleString() || 290}</p>
          </div>
          <div>
            <span className="text-[#64748B]">UNSPSC Mappings:</span>
            <p className="text-[#F97316] font-bold tabular-nums">{metrics?.unspsc_mappings_count.toLocaleString() || 73}</p>
          </div>
          <div>
            <span className="text-[#64748B]">Benchmark Coverage:</span>
            <p className="text-emerald-600 font-bold tabular-nums">{metrics?.total_benchmarkable_pct?.toFixed(1) || 75.8}%</p>
          </div>
          <div>
            <span className="text-[#64748B]">Quality Distribution:</span>
            <p className="text-[#0B1B33] font-medium tabular-nums">
              A:{metrics?.a_quality_count || 0} B:{metrics?.b_quality_count || 0} C:{metrics?.c_quality_count || 0}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B]">Historical Date Span:</span>
            <p className="text-[#0B1B33] font-medium">
              {metrics?.date_start || '2020-04-01'} to {metrics?.date_end || '2026-07-31'}
            </p>
          </div>
        </div>

        {/* Warning Note */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p>{UI_STRINGS.pcbiAdmin.publishConfirmPrompt}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-[#475569] border border-[#DCE7F5] rounded-xl text-xs font-semibold transition-all"
          >
            {UI_STRINGS.pcbiAdmin.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing}
            className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Rocket size={14} />
            <span>{isPublishing ? 'Publishing...' : UI_STRINGS.pcbiAdmin.confirmPublish}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
