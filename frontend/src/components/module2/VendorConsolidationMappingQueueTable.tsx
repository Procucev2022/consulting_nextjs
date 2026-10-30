'use client';

import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import type { MaterialMappingEntry, UpdateMaterialMappingPayload } from '../../types/module2MaterialMapping';
import type { VendorConsolidationMappingQueueTableProps } from '../../types/module2VendorConsolidation';
import { UI_STRINGS, VENDOR_CONSOLIDATION_CONFIG, VENDOR_CONSOLIDATION_UI_CONFIG } from '../../constants';
import { logger } from '../../utils/logger';
import { authApiClient } from '../../utils/authApi';

function matchesSearchQuery(entry: MaterialMappingEntry, query: string): boolean {
  return (
    entry.sourceMaterialId.toLowerCase().includes(query) ||
    entry.sourceDescription.toLowerCase().includes(query) ||
    entry.sourceCategory.toLowerCase().includes(query) ||
    entry.reviewReason?.toLowerCase().includes(query)
  );
}

export const VendorConsolidationMappingQueueTable: React.FC<VendorConsolidationMappingQueueTableProps> = ({
  assessmentId,
  exceptions,
  onMappingUpdated
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [mappingCodes, setMappingCodes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return exceptions.filter((entry) => {
      if (!searchTerm) return true;
      return matchesSearchQuery(entry, searchTerm.toLowerCase());
    });
  }, [exceptions, searchTerm]);

  const handleApprove = async (entry: MaterialMappingEntry): Promise<void> => {
    const unspscCode = mappingCodes[entry.sourceMaterialId] ?? (
      entry.assignedUnspscCode === VENDOR_CONSOLIDATION_CONFIG.UNMAPPED_UNSPSC_CODE
        ? '' : entry.assignedUnspscCode
    );
    if (!/^\d{8}$/.test(unspscCode)) {
      setApprovalError(strings.mappingCodeRequired);
      return;
    }
    setUpdatingId(entry.sourceMaterialId);
    setApprovalError(null);
    try {
      const payload: UpdateMaterialMappingPayload = {
        assessmentId,
        sourceMaterialId: entry.sourceMaterialId,
        unspscCode,
        reviewStatus: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_APPROVAL_STATUS,
        auditNotes: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_APPROVAL_AUDIT_NOTE
      };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = authApiClient.getStoredToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_UPDATE_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        logger.error('Vendor consolidation mapping approval was rejected by the server', {
          sourceMaterialId: entry.sourceMaterialId,
          httpStatus: response.status
        });
        setApprovalError(strings.mappingApproveFailedHttp(entry.sourceMaterialId, response.status));
        return;
      }
      onMappingUpdated?.();
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : strings.mappingApproveUnknownReason;
      logger.error(
        'Vendor consolidation mapping approval request failed',
        { sourceMaterialId: entry.sourceMaterialId },
        error
      );
      setApprovalError(strings.mappingApproveFailedNetwork(entry.sourceMaterialId, reason));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {approvalError && (
        <div
          role="alert"
          className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 flex items-start gap-2 text-xs text-red-800 dark:text-red-300"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
          <span>{approvalError}</span>
        </div>
      )}

      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {strings.mappingQueueTitle}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{strings.mappingQueuePendingCount(exceptions.length)}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {strings.mappingQueueSubtitle}
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={strings.mappingQueueSearchPlaceholder}
            className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">{strings.colMaterialIdDescription}</th>
              <th className="px-4 py-3">{strings.colClientGroup}</th>
              <th className="px-4 py-3">{strings.colAssignedUnspsc}</th>
              <th className="px-4 py-3 text-right">{strings.colSpendCr}</th>
              <th className="px-4 py-3 text-center">{strings.colPoCount}</th>
              <th className="px-4 py-3 text-center">{strings.colDistinctSuppliers}</th>
              <th className="px-4 py-3">{strings.colReviewReasonStatus}</th>
              <th className="px-4 py-3 text-right">{UI_STRINGS.common.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_QUEUE_ROW_LIMIT).map((entry) => {
              const isUpdating = updatingId === entry.sourceMaterialId;
              return (
                <tr key={entry.sourceMaterialId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {entry.sourceMaterialId || UI_STRINGS.common.notAvailable}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {entry.sourceDescription}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {entry.sourceCategory}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.assignedUnspscCode}
                    <input
                      aria-label={strings.mappingCodeInputLabel(entry.sourceMaterialId)}
                      inputMode="numeric"
                      maxLength={8}
                      placeholder={strings.mappingCodeInputPlaceholder}
                      value={mappingCodes[entry.sourceMaterialId] ?? (
                        entry.assignedUnspscCode === VENDOR_CONSOLIDATION_CONFIG.UNMAPPED_UNSPSC_CODE
                          ? '' : entry.assignedUnspscCode
                      )}
                      onChange={(event) => setMappingCodes((current) => ({
                        ...current, [entry.sourceMaterialId]: event.target.value.replace(/\D/g, '').slice(0, 8)
                      }))}
                      className="mt-1 block w-40 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {strings.formatRupees(entry.totalSpendCr.toFixed(4))}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                    {entry.transactionCount}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                    {entry.qualifyingSuppliersCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="line-clamp-1">{entry.reviewReason || strings.pendingReviewFallback}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleApprove(entry)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isUpdating ? strings.btnSavingMapping : strings.btnApproveMapping}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_QUEUE_ROW_LIMIT && (
        <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          {strings.mappingQueueTruncationNotice(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_QUEUE_ROW_LIMIT, filtered.length)}
        </div>
      )}
    </div>
  );
};
