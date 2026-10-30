'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { VendorConsolidationTransactionTableProps } from '../../types/module2VendorConsolidation';
import { UI_STRINGS, VENDOR_CONSOLIDATION_UI_CONFIG } from '../../constants';

export const VendorConsolidationTransactionTable: React.FC<VendorConsolidationTransactionTableProps> = ({
  opportunity,
  onBackToMaterials
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const transactions = opportunity.transactions || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Header & Breadcrumb */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={strings.ariaBackToMaterials}
            onClick={onBackToMaterials}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              {strings.breadcrumbTrail(strings.breadcrumbMaterial(opportunity.materialCode), strings.breadcrumbTxs)}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {strings.transactionDrilldownTitle(opportunity.materialCode)}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {strings.transactionSubtitle(opportunity.materialDesc, transactions.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">{strings.colPoNumber}</th>
              <th className="py-2.5 px-3">{strings.colPoLine}</th>
              <th className="py-2.5 px-3">{strings.colPoDate}</th>
              <th className="py-2.5 px-3">{strings.colVendorName}</th>
              <th className="py-2.5 px-3">{strings.colPlantCount}</th>
              <th className="py-2.5 px-3 text-right">{strings.colQuantity}</th>
              <th className="py-2.5 px-3 text-right">{strings.colUnitPrice}</th>
              <th className="py-2.5 px-3 text-right">{strings.colLineSpend}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  {strings.noTransactionRecords}
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr
                  key={`${transaction.po_number || index}-${transaction.po_line || index}`}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white">
                    {transaction.po_number || UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {transaction.po_line || VENDOR_CONSOLIDATION_UI_CONFIG.DEFAULT_PO_LINE}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {transaction.po_date || UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {transaction.vendor_name || transaction.vendor_code || strings.unknownVendor}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {transaction.plant || strings.defaultPlantLabel}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {(transaction.quantity || 0).toLocaleString()}{' '}
                    {transaction.uom || VENDOR_CONSOLIDATION_UI_CONFIG.DEFAULT_UOM}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {strings.formatRupees((transaction.unit_price || 0).toFixed(2))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    {strings.formatRupees((transaction.total_spend_inr || 0).toLocaleString())}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
