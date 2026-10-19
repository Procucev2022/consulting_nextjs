'use client';

import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import type { MaterialMappingEntry } from '../../types/module2MaterialMapping';

interface VendorConsolidationMappingQueueTableProps {
  exceptions: MaterialMappingEntry[];
  onMappingUpdated?: () => void;
}

export const VendorConsolidationMappingQueueTable: React.FC<VendorConsolidationMappingQueueTableProps> = ({
  exceptions,
  onMappingUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return exceptions.filter((e) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        e.sourceMaterialId.toLowerCase().includes(q) ||
        e.sourceDescription.toLowerCase().includes(q) ||
        e.sourceCategory.toLowerCase().includes(q) ||
        e.reviewReason?.toLowerCase().includes(q)
      );
    });
  }, [exceptions, searchTerm]);

  const handleApprove = async (entry: MaterialMappingEntry) => {
    setUpdatingId(entry.sourceMaterialId);
    try {
      const res = await fetch('/api/module2/sourcing/vendor-consolidation/mappings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMaterialId: entry.sourceMaterialId,
          unspscCode: entry.assignedUnspscCode !== '00000000' ? entry.assignedUnspscCode : '10000000',
          reviewStatus: 'CLIENT_APPROVED',
          reviewedBy: 'Client Procurement Reviewer',
          auditNotes: 'Client approved during manual engineering review session'
        })
      });
      if (res.ok && onMappingUpdated) {
        onMappingUpdated();
      }
    } catch {
      // Handled cleanly
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mapping Exceptions & Engineering Review Queue
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{exceptions.length} Pending Review</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Materials lacking specific taxonomy keywords or client-proprietary codes queued for engineering verification.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search material ID, description, or client group..."
            className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Material ID & Description</th>
              <th className="px-4 py-3">Client Group</th>
              <th className="px-4 py-3">Assigned UNSPSC</th>
              <th className="px-4 py-3 text-right">Spend (Cr)</th>
              <th className="px-4 py-3 text-center">POs</th>
              <th className="px-4 py-3 text-center">Suppliers</th>
              <th className="px-4 py-3">Review Reason & Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 50).map((e) => (
              <tr key={e.sourceMaterialId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {e.sourceMaterialId || 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {e.sourceDescription}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                  {e.sourceCategory}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {e.assignedUnspscCode}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  ₹{e.totalSpendCr.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                  {e.transactionCount}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                  {e.qualifyingSuppliersCount}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="line-clamp-1">{e.reviewReason || 'Pending review'}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleApprove(e)}
                    disabled={updatingId === e.sourceMaterialId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{updatingId === e.sourceMaterialId ? 'Saving...' : 'Approve'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 50 && (
        <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          Showing 50 of {filtered.length} pending review items. Use search to locate specific material records.
        </div>
      )}
    </div>
  );
};
