'use client';

import React, { useState } from 'react';
import { X, Building2, Factory, FileText, ShieldCheck } from 'lucide-react';
import type { DirectPriceItemDrillDownModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const DirectPriceItemDrillDownModal: React.FC<DirectPriceItemDrillDownModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const strings = UI_STRINGS.module2DirectPrice;
  const [activeTab, setActiveTab] = useState<'suppliers' | 'plants' | 'transactions'>('suppliers');

  if (!isOpen || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                {item.materialCode}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-medium">{item.spendCategory}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-medium">UOM: {item.uom}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {item.materialDesc}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Benchmark Unit Price:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{item.lowestUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span>•</span>
              <div>
                <span className="text-slate-400">Benchmark PO:</span>{' '}
                <span className="font-mono font-medium">{item.benchmarkPoNumber}</span> ({item.benchmarkSupplierName})
              </div>
              <span>•</span>
              <div>
                <span className="text-slate-400">Historical Lost Opp:</span>{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{item.historicalLostOpportunityCr.toFixed(3)} Cr
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'suppliers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {strings.tabSuppliers} ({item.suppliers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plants')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'plants'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Factory className="w-4 h-4" />
            {strings.tabPlants} ({item.plants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            {strings.tabTransactions} ({item.transactions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'suppliers' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Name & Code</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Spend (INR)</th>
                    <th className="py-2.5 px-3 text-right">Min Price</th>
                    <th className="py-2.5 px-3 text-right">Weighted Avg</th>
                    <th className="py-2.5 px-3 text-right">Max Price</th>
                    <th className="py-2.5 px-3 text-right">Lost Opp (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {item.suppliers.map((s) => (
                    <tr key={s.supplierCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{s.supplierName}</span>
                          {s.isLowestPriceSupplier && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              BENCHMARK
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.supplierCode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">{s.transactionCount}</td>
                      <td className="py-2.5 px-3 text-right">{s.totalQuantity.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₹{s.totalSpendInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-600">₹{s.lowestUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">₹{s.weightedAveragePrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">₹{s.highestUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        ₹{s.historicalLostOpportunityInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'plants' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Plant Location</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Spend (INR)</th>
                    <th className="py-2.5 px-3 text-right">Lowest Paid</th>
                    <th className="py-2.5 px-3 text-right">Weighted Avg</th>
                    <th className="py-2.5 px-3 text-right">Lost Opp (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {item.plants.map((p) => (
                    <tr key={p.plantCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                        Plant {p.plantCode}
                      </td>
                      <td className="py-2.5 px-3 text-right">{p.transactionCount}</td>
                      <td className="py-2.5 px-3 text-right">{p.totalQuantity.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₹{p.totalSpendInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-600">₹{p.lowestUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">₹{p.weightedAveragePrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        ₹{p.historicalLostOpportunityInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">PO Number & Date</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Plant</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Paid Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Benchmark Price</th>
                    <th className="py-2.5 px-3 text-right">Total Spend</th>
                    <th className="py-2.5 px-3 text-right">Variance Opp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {item.transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={
                        tx.isBenchmarkTransaction
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-medium'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.poNumber}</span>
                          {tx.isBenchmarkTransaction && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[9px] font-bold">
                              BENCHMARK PO
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[10px]">{tx.poDate}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate" title={tx.supplierName}>
                        {tx.supplierName}
                      </td>
                      <td className="py-2.5 px-3">{tx.plantCode}</td>
                      <td className="py-2.5 px-3 text-right">{tx.quantity.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-medium">₹{tx.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">₹{tx.benchmarkUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">₹{tx.totalSpendInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {tx.historicalLostOpportunityInr > 0
                          ? `₹${tx.historicalLostOpportunityInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-[11px] text-slate-500">
            {strings.disclaimer}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            {strings.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
};
