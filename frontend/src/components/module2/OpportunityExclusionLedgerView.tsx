'use client';
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import type { OpportunityExclusionLedgerEntry } from '../../types';

interface OpportunityExclusionLedgerViewProps {
  ledger?: OpportunityExclusionLedgerEntry[];
}

export const OpportunityExclusionLedgerView: React.FC<OpportunityExclusionLedgerViewProps> = ({ ledger = [] }) => {
  const [filterCode, setFilterCode] = useState<string>('ALL');

  const totalExcludedSpendInr = ledger.reduce((sum, item) => sum + item.spendInr, 0);
  const totalExcludedSpendCr = (totalExcludedSpendInr / 10000000).toFixed(2);

  const filteredEntries = filterCode === 'ALL'
    ? ledger
    : ledger.filter((item) => item.exclusionCode === filterCode);

  const uniqueCodes = Array.from(new Set(ledger.map((item) => item.exclusionCode)));

  if (ledger.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic text-center">
        Zero transaction exclusions. 100% of historical transactions are comparable and eligible.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-rose-700 dark:text-rose-400">
            OPPORTUNITY EXCLUSION LEDGER (SECTION 9)
          </span>
          <div className="text-sm font-black font-mono text-rose-900 dark:text-rose-200 mt-0.5">
            ₹{totalExcludedSpendCr} Cr Excluded ({ledger.length} Transactions)
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="p-1.5 rounded-lg text-xs bg-white dark:bg-white border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Exclusion Reasons ({ledger.length})</option>
            {uniqueCodes.map((code) => {
              const count = ledger.filter((item) => item.exclusionCode === code).length;
              return (
                <option key={code} value={code}>
                  {code} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-white border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold z-10">
              <tr>
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-2 text-right">Spend (₹)</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-3">Exclusion Reason</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredEntries.map((entry) => (
                <tr key={entry.transactionId} className="hover:bg-slate-50/50 dark:hover:bg-[#EEF4FC]">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                    {entry.poNumber}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[130px] truncate">
                    {entry.supplierName}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                    {entry.itemDescription}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{entry.spendInr.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                    ₹{entry.unitPrice.toFixed(2)}/{entry.uom}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                      {entry.exclusionCode}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 max-w-[200px] truncate">
                    {entry.exclusionDetail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
