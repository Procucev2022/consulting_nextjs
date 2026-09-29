'use client';

/**
 * Enterprise 17-Column Commodity Research Queue Table Component (Part F & M)
 * Fully searchable, filterable, and actionable operational research queue.
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { PCBIStatusBadge } from './PCBIStatusBadge';
import { UI_STRINGS } from '../../../constants';
import type { CommodityResearchQueueRow } from '../../../types/pcbiCommodityDataLab';

export interface PCBICommodityResearchQueueTableProps {
  queue: CommodityResearchQueueRow[];
  onOpenWorkspace: (pcbiId: string) => void;
  onUploadSource?: (commodity: CommodityResearchQueueRow) => void;
}

export function getQueueContextualAction(currentStatus: string): {
  label: string;
  actionType: 'RESEARCH' | 'UPLOAD' | 'VERIFY' | 'REVIEW' | 'CREATE_DEFINITION' | 'OPEN';
} {
  switch (currentStatus) {
    case 'NO_HISTORY':
      return { label: 'Research', actionType: 'RESEARCH' };
    case 'PARTIAL_HISTORY':
      return { label: 'Upload', actionType: 'UPLOAD' };
    case 'SOURCE_UNVERIFIED':
      return { label: 'Verify', actionType: 'VERIFY' };
    case 'SPECIFICATION_MISMATCH':
    case 'FREQUENCY_MISMATCH':
    case 'METHODOLOGY_PENDING':
      return { label: 'Review', actionType: 'REVIEW' };
    case 'MISSING':
      return { label: 'Create Definition', actionType: 'CREATE_DEFINITION' };
    default:
      return { label: 'Open Workspace', actionType: 'OPEN' };
  }
}

export const PCBICommodityResearchQueueTable: React.FC<PCBICommodityResearchQueueTableProps> = ({
  queue,
  onOpenWorkspace,
  onUploadSource
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pcbiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unspsc.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || item.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by commodity name, PCBI ID, or UNSPSC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 font-medium focus:border-cyan-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRODUCTION_READY">Production Ready</option>
            <option value="PARTIAL_HISTORY">Partial History</option>
            <option value="NO_HISTORY">No History</option>
            <option value="MISSING">Missing</option>
            <option value="SOURCE_UNVERIFIED">Source Unverified</option>
            <option value="METHODOLOGY_PENDING">Methodology Pending</option>
            <option value="SPECIFICATION_MISMATCH">Specification Mismatch</option>
            <option value="FREQUENCY_MISMATCH">Frequency Mismatch</option>
          </select>
        </div>
      </div>

      {/* 17-Column Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-cyan-400" />
            <h3 className="font-extrabold text-white text-xs tracking-wide uppercase">
              {UI_STRINGS.pcbiCommodityDataLab.researchQueueTitle}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredQueue.length} of {queue.length} Commodities
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400 z-10">
              <tr>
                <th className="py-3 px-3 font-bold whitespace-nowrap">#</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thCommodity}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">Commodity ID</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thModule2Classification}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thUnspsc}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thCustomerSpend}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thTxnCount}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thPcbiId}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">Series ID</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thCurrentStatus}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thRequiredHistory}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thAvailableHistory}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thRequiredFrequency}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thAvailableFrequency}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thSourceStatus}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thMethodologyStatus}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">{UI_STRINGS.pcbiCommodityDataLab.thPriority}</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap text-right">{UI_STRINGS.pcbiCommodityDataLab.thAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No commodities match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((row, idx) => {
                  const contextualAction = getQueueContextualAction(row.currentStatus);
                  return (
                    <tr
                      key={row.commodityId}
                      onClick={() => onOpenWorkspace(row.pcbiId)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">{row.commodity}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-cyan-400">{row.commodityId}</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">{row.module2Classification}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{row.unspsc}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400 font-mono whitespace-nowrap">{row.customerSpendCr}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{row.transactionCount}</td>
                      <td className="py-3 px-3 font-mono text-cyan-300 font-bold whitespace-nowrap">{row.pcbiId}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">{row.seriesId}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <PCBIStatusBadge status={row.currentStatus} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">{row.requiredHistory}</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">{row.availableHistory}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{row.requiredFrequency}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{row.availableFrequency}</td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">{row.sourceStatus}</td>
                      <td className="py-3 px-3 text-[11px] font-mono text-purple-400 whitespace-nowrap">{row.methodologyStatus}</td>
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            row.priority.startsWith('P1')
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {contextualAction.actionType === 'UPLOAD' && onUploadSource && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUploadSource(row);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 shadow-xs"
                            >
                              <UploadCloud size={10} />
                              <span>Upload</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWorkspace(row.pcbiId);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-bold transition-all inline-flex items-center gap-1"
                          >
                            <span>{contextualAction.label}</span>
                            <ExternalLink size={11} />
                          </button>
                        </div>
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
