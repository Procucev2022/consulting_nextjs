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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded">
              PCBI SOURCE COMPARISON MATRIX
            </span>
            <span className="text-xs text-slate-400 font-mono">PCBI ID: {commodity.pcbiId}</span>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-1">
            {commodity.commodity} — Multi-Source Evaluation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating {sources.length} coexisting candidate sources against required benchmark criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <GitCompare size={15} className="text-cyan-400" />
            <span>Coexisting Candidate Sources Comparison</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {sources.length} Sources Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
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
            <tbody className="divide-y divide-slate-800/80">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-mono">
                    No candidate sources currently registered for this commodity.
                  </td>
                </tr>
              ) : (
                sources.map((src: CommoditySourceEvidenceObject) => {
                  const isSelected = selectedSourceId === src.sourceId;
                  return (
                    <tr
                      key={src.sourceId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-cyan-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{src.sourceName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{src.sourceId}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <Building2 size={12} className="text-slate-500" />
                          <span>{src.publisher}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-500" />
                          <span>{src.historicalCoverage}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] border border-slate-700">
                          {src.frequency}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {src.currency}/{src.unit}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {src.geography}
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={src.gradeSpecification}>
                        {src.gradeSpecification}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          {src.validationStatus === 'VALIDATED' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              <span>PASSED</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
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
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
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
