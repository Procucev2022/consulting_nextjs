'use client';
import React from 'react';
import type { CategoryStrategicSourcingProfile } from '../../types';

export interface CategorySupplierProfileTabProps {
  profile: CategoryStrategicSourcingProfile;
}

export const CategorySupplierProfileTab: React.FC<CategorySupplierProfileTabProps> = ({ profile }) => {
  return (
    <div className="space-y-5">
      {/* Overview & Purchase Cadence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Spend</div>
          <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
            ₹{profile.totalSpendInrCr.toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {profile.transactionCount} transactions
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Cadence</div>
          <div className="text-base font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {profile.activeMonthsCount} Active Months
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ₹{(profile.averageMonthlySpendInr / 100000).toFixed(2)}L / month
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-400">Supplier HHI</div>
          <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
            {profile.hhiScore}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {profile.hhiInterpretation}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-400">Fragmentation</div>
          <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">
            {profile.fragmentationLevel.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {profile.activeSuppliersCount} total suppliers
          </div>
        </div>
      </div>

      {/* Supplier Structure & Concentration Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-100 dark:bg-[#F8FBFE] font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Supplier Structure & Concentration Matrix</span>
          <span className="text-[10px] font-normal text-slate-500">
            Top Supplier: {profile.topSupplierSharePct}% • Top 3: {profile.top3SupplierSharePct}% • Long Tail: {profile.longTailSupplierSharePct}%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3 text-right">Spend (INR)</th>
                <th className="py-2.5 px-2 text-right">Share %</th>
                <th className="py-2.5 px-2 text-right">Volume</th>
                <th className="py-2.5 px-2 text-right">WAP</th>
                <th className="py-2.5 px-3">Price Position</th>
                <th className="py-2.5 px-3">Consolidation Relevance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {profile.suppliers.map((s) => (
                <tr key={s.supplierId} className="hover:bg-slate-50/50 dark:hover:bg-[#EEF4FC]">
                  <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                    {s.supplierName}
                    {s.isTopSupplier && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                        Top
                      </span>
                    )}
                    {s.isTailSupplier && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        Tail
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-medium">₹{(s.totalSpendInr / 100000).toFixed(2)}L</td>
                  <td className="py-2 px-2 text-right font-mono">{s.spendSharePct.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-right font-mono">{s.totalQuantity.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">₹{s.weightedAveragePrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-[11px] font-semibold">
                    <span
                      className={
                        s.pricePositionVsComparable === 'BELOW_AVERAGE'
                          ? 'text-emerald-600'
                          : s.pricePositionVsComparable === 'ABOVE_AVERAGE'
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }
                    >
                      {s.pricePositionVsComparable.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">{s.potentialConsolidationRelevance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
