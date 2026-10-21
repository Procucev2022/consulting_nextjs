'use client';

import React from 'react';
import type {
  ProcurementComplianceTableProps,
  ProcurementComplianceStatus
} from '../../types/module2ProcurementCompliance';
import {
  COMPLIANCE_UI_STRINGS,
  COMPLIANCE_STATUS_LABELS,
  COMPLIANCE_TABLE_COLUMNS
} from '../../constants/module2ProcurementCompliance';

function getStatusBadgeClass(status: ProcurementComplianceStatus): string {
  if (status === 'VERIFIED_EXCEPTION') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
  }
  if (status === 'NOT_AN_EXCEPTION') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
}

export const ProcurementComplianceTable: React.FC<ProcurementComplianceTableProps> = ({
  exceptions,
  onSelectException
}) => {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <tr>
            {COMPLIANCE_TABLE_COLUMNS.map((col, idx) => (
              <th key={idx} className={`p-2.5 font-semibold ${col.align}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {exceptions.map((item) => (
            <tr key={item.exceptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="p-2.5 font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {item.exceptionId}
              </td>
              <td className="p-2.5 text-slate-700 dark:text-slate-300">{item.checkTitle}</td>
              <td className="p-2.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{item.vendorName}</div>
                <div
                  className="text-[11px] text-slate-400 truncate max-w-[200px]"
                  title={item.materialDesc}
                >
                  {item.materialDesc}
                </div>
              </td>
              <td className="p-2.5 text-right font-mono">{item.supportingTransactionsCount}</td>
              <td className="p-2.5 text-right font-mono font-semibold">
                ₹{item.expenditureUnderReviewCr.toFixed(2)} Cr
              </td>
              <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                {item.potentialFinancialExposureCr > 0
                  ? `₹${item.potentialFinancialExposureCr.toFixed(4)} Cr`
                  : COMPLIANCE_UI_STRINGS.NOT_APPLICABLE}
              </td>
              <td className="p-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadgeClass(item.reviewStatus)}`}>
                  {COMPLIANCE_STATUS_LABELS[item.reviewStatus] || item.reviewStatus}
                </span>
              </td>
              <td className="p-2.5 text-right">
                <button
                  type="button"
                  data-testid={`compliance-review-btn-${item.exceptionId}`}
                  onClick={() => onSelectException(item)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold"
                >
                  {COMPLIANCE_UI_STRINGS.BTN_AUDIT_REVIEW}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
