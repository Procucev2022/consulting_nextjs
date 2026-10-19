'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { SameMaterialOpportunity } from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';

interface VendorConsolidationTransactionTableProps {
  opportunity: SameMaterialOpportunity;
  onBackToMaterials: () => void;
}

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
            aria-label="Back to Materials"
            onClick={onBackToMaterials}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >

            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              {strings.breadcrumbMaterial(opportunity.materialCode)} &rarr; {strings.breadcrumbTxs}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {strings.transactionDrilldownTitle(opportunity.materialCode)}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {opportunity.materialDesc} • {transactions.length} supporting transaction records
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
              <th className="py-2.5 px-3">Line</th>
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
                  No transaction records available for this material.
                </td>
              </tr>
            ) : (
              transactions.map((t, idx) => (
                <tr key={`${t.po_number || idx}-${t.po_line || idx}`} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white">
                    {t.po_number || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {t.po_line || '1'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {t.po_date || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {t.vendor_name || t.vendor_code || 'Unknown Vendor'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {t.plant || 'HQ'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {(t.quantity || 0).toLocaleString()} {t.uom || 'EA'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{(t.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    ₹{(t.total_spend_inr || 0).toLocaleString()}
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
