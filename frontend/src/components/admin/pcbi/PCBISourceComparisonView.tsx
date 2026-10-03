'use client';

/**
 * Enterprise Source Comparison View Component (Part H)
 * Multi-source comparison matrix for selecting and validating candidate sources.
 */

import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  Clock,
  Building2,
  Calendar
} from 'lucide-react';
import { PCBIStatusBadge } from './PCBIStatusBadge';
import type { PCBISourceComparisonViewProps } from '../../../types/pcbiDataLibraryComponents';
import type { CommoditySourceEvidenceObject } from '../../../types/pcbiCommodityDataLab';

export const PCBISourceComparisonView: React.FC<PCBISourceComparisonViewProps> = ({
  commodity,
  sources,
  onSelectPrimarySource,
  onClose
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sources[0]?.sourceId || '');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Commodity Spec Summary */}
      <div className="bg-white border border-[#DCE7F5] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-sky-50 text-[#0284C7] border border-sky-200 px-2 py-0.5 rounded">
              PCBI SOURCE COMPARISON MATRIX
            </span>
            <span className="text-xs text-[#475569] font-mono">PCBI ID: {commodity.pcbiId}</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#0B1B33] mt-1">
            {commodity.commodity} — Multi-Source Evaluation
          </h3>
          <p className="text-xs text-[#475569] mt-0.5">
            Evaluating {sources.length} coexisting candidate sources against required benchmark criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#475569] border border-[#DCE7F5] rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-[#DCE7F5] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#DCE7F5] flex items-center justify-between bg-[#F8FBFE]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1B33]">
            <GitCompare size={15} className="text-[#0284C7]" />
            <span>Coexisting Candidate Sources Comparison</span>
          </div>
          <span className="text-[11px] text-[#475569] font-medium tabular-nums">
            {sources.length} Sources Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FBFE] border-b border-[#DCE7F5] text-[#475569] text-[11px]">
                <th className="py-3 px-4 font-bold">Source ID & Name</th>
                <th className="py-3 px-4 font-bold">Publisher</th>
                <th className="py-3 px-4 font-bold">Coverage Period</th>
                <th className="py-3 px-4 font-bold">Frequency</th>
                <th className="py-3 px-4 font-bold">Unit / Currency</th>
                <th className="py-3 px-4 font-bold">Geography</th>
                <th className="py-3 px-4 font-bold">Specification</th>
                <th className="py-3 px-4 font-bold">Validation Result</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7F5]">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#64748B]">
                    No candidate sources currently registered for this commodity.
                  </td>
                </tr>
              ) : (
                sources.map((src: CommoditySourceEvidenceObject) => {
                  const isSelected = selectedSourceId === src.sourceId;
                  return (
                    <tr
                      key={src.sourceId}
                      className={`hover:bg-[#EEF7FF] transition-colors ${
                        isSelected ? 'bg-sky-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0B1B33] flex items-center gap-1.5">
                          <span>{src.sourceName}</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] font-mono">{src.sourceId}</span>
                      </td>

                      <td className="py-3 px-4 text-[#475569] font-medium">
                        <div className="flex items-center gap-1">
                          <Building2 size={12} className="text-[#64748B]" />
                          <span>{src.publisher}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#475569] text-[11px] tabular-nums">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#64748B]" />
                          <span>{src.historicalCoverage}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#475569]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] border border-slate-200">
                          {src.frequency}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#475569]">
                        {src.currency}/{src.unit}
                      </td>

                      <td className="py-3 px-4 text-[#475569]">
                        {src.geography}
                      </td>

                      <td className="py-3 px-4 text-[#475569] max-w-xs truncate" title={src.gradeSpecification}>
                        {src.gradeSpecification}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px]">
                          {src.validationStatus === 'VALIDATED' ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              <span>PASSED</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                              <Clock size={13} />
                              <span>PENDING</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <PCBIStatusBadge status={src.approvalStatus} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSourceId(src.sourceId);
                            if (onSelectPrimarySource) {
                              onSelectPrimarySource(src.sourceId);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#0284C7] text-white shadow-xs'
                              : 'bg-white text-[#475569] hover:bg-slate-50 border border-[#DCE7F5]'
                          }`}
                        >
                          {isSelected ? 'Primary' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
