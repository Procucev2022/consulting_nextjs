'use client';

import React, { useState } from 'react';
import { FileText, FileSearch } from 'lucide-react';
import type { PCBIMissingIndexGapItem, PCBIMissingIndexTableProps } from '../../types/module3GapList';
import { UI_STRINGS } from '../../constants';
import { PCBIMaterialAuditModal } from './PCBIMaterialAuditModal';

export const PCBIMissingIndexTable: React.FC<PCBIMissingIndexTableProps> = ({
  items,
  onSelectRequirement,
  onUploadBenchmark,
  onNavigateToMappingReview
}) => {
  const [selectedItem, setSelectedItem] = useState<PCBIMissingIndexGapItem | null>(null);
  const strings = UI_STRINGS.module3.gapList;
  const headers = strings.tableHeaders;

  const handleRowClick = (item: PCBIMissingIndexGapItem): void => {
    setSelectedItem(item);
    if (onSelectRequirement) {
      onSelectRequirement(item);
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'VERIFIED OBSERVATIONS AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BENCHMARK DEFINED — OBSERVATIONS MISSING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SOURCE IDENTIFIED — DATA NOT ACQUIRED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'LICENSE REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'MAPPING / SPECIFICATION REVIEW REQUIRED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NO SUITABLE BENCHMARK IDENTIFIED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'UNMAPPED — RESEARCH REQUIRED':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            {strings.tableTitle}
          </h4>
          <p className="text-[11px] text-slate-500">{strings.tableSubtitle}</p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          {items.length === 22 ? strings.showingAllMaterialsCount(22, 8976) : strings.showingRequirements(items.length)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200 tracking-wider">
            <tr>
              <th className="py-3 px-3.5">{headers.material}</th>
              <th className="py-3 px-3">{headers.classification}</th>
              <th className="py-3 px-3 text-right">{headers.spend}</th>
              <th className="py-3 px-3">{headers.series}</th>
              <th className="py-3 px-3">{headers.source}</th>
              <th className="py-3 px-3">{headers.observations}</th>
              <th className="py-3 px-3">{headers.gapStatus}</th>
              <th className="py-3 px-3">{headers.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                  {strings.emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                >
                  {/* Material with audit icon and clickable description */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        data-testid={`audit-icon-${item.materialCode}`}
                        aria-label={strings.auditRowIconTitle(item.materialDescription)}
                        title={strings.auditRowIconTitle(item.materialDescription)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                        className="mt-0.5 p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer shrink-0 border border-transparent hover:border-indigo-200"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <button
                          type="button"
                          data-testid={`material-name-btn-${item.materialCode}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-left cursor-pointer hover:underline block truncate"
                        >
                          {item.materialDescription}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.materialCode}
                          </span>
                          {item.unspscCode && item.unspscCode !== 'N/A' && (
                            <span className="font-mono text-[9px] text-slate-400">UNSPSC: {item.unspscCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Classification */}
                  <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[180px]">
                    <div className="truncate font-medium">{item.commodityClassification}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.existingGradeSpecification}</div>
                  </td>

                  {/* Spend & Txs */}
                  <td className="py-3 px-3 text-right font-mono">
                    <div className="font-black text-slate-900">
                      ₹{item.customerSpendCr.toFixed(4)} <span className="text-[10px] text-slate-500 font-sans">Cr</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.transactionCount} txs ({item.spendSharePct.toFixed(2)}%)
                    </div>
                  </td>

                  {/* PCBI Series ID */}
                  <td className="py-3 px-3">
                    {item.pcbiSeriesId ? (
                      <span className="font-mono text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded font-bold">
                        {item.pcbiSeriesId}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 italic">UNMAPPED</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-3 px-3 text-[11px] max-w-[160px]">
                    <div className="font-semibold text-slate-800 truncate">{item.benchmarkPublisherSource}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.sourceStatus}</div>
                  </td>

                  {/* Observation Coverage */}
                  <td className="py-3 px-3 text-[11px] max-w-[170px]">
                    <div className="text-slate-700 truncate">{item.observationCoverage}</div>
                    {item.latestObservationDate && (
                      <div className="text-[10px] font-mono text-slate-400">Latest: {item.latestObservationDate}</div>
                    )}
                  </td>

                  {/* Gap Status & Reason */}
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(item.gapStatus)}`}>
                      {item.gapStatus}
                    </span>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">{item.gapReason}</div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-[11px] text-indigo-700 font-medium max-w-[220px]">
                    <div className="line-clamp-2">{item.nextActionRequired}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Material Requirement Forensic Audit Popup Modal */}
      <PCBIMaterialAuditModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUploadBenchmark={onUploadBenchmark}
        onNavigateToMappingReview={onNavigateToMappingReview}
      />
    </div>
  );
};
