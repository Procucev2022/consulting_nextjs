'use client';

import React from 'react';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';
import type { CategoryConsolidationProfile, SupplierSpendProfile } from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';

interface VendorConsolidationSupplierTableProps {
  category: CategoryConsolidationProfile;
  onBackToCategories: () => void;
  onSelectSupplierMaterials: (supplier?: SupplierSpendProfile) => void;
}

export const VendorConsolidationSupplierTable: React.FC<VendorConsolidationSupplierTableProps> = ({
  category,
  onBackToCategories,
  onSelectSupplierMaterials
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to Categories"
            onClick={onBackToCategories}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >

            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              {strings.breadcrumbSupplier(category.spendCategory)}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {strings.categoryDrilldownTitle(category.spendCategory)}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {strings.categoryDrilldownSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSupplierMaterials()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>View Category Materials</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Supplier Concentration Bar */}
      <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg mx-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Category Spend: </span>
          <span className="font-bold text-slate-900 dark:text-white">₹{category.totalSpendCr.toFixed(4)} Cr</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Suppliers: </span>
          <span className="font-bold text-slate-900 dark:text-white">{category.distinctSuppliersCount}</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Top 1 Share: </span>
          <span className="font-bold text-slate-900 dark:text-white">{category.top1SharePct.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">CR3 Concentration: </span>
          <span className="font-bold text-slate-900 dark:text-white">{category.top3SharePct.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">HHI Index: </span>
          <span className="font-bold text-slate-900 dark:text-white">{category.hhiIndex}</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Fragmentation: </span>
          <span className="font-bold text-slate-900 dark:text-white">{category.fragmentationLevel}</span>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">{strings.colVendorName}</th>
              <th className="py-2.5 px-3">{strings.colVendorCode}</th>
              <th className="py-2.5 px-3 text-right">{strings.colTotalSpend}</th>
              <th className="py-2.5 px-3 text-right">{strings.colSpendShare}</th>
              <th className="py-2.5 px-3 text-center">{strings.colMaterialsSupplied}</th>
              <th className="py-2.5 px-3 text-center">{strings.colPlantsServed}</th>
              <th className="py-2.5 px-3 text-center">PO Lines</th>
              <th className="py-2.5 px-3 text-center">{strings.colTailSupplier}</th>
              <th className="py-2.5 px-3 text-center">{UI_STRINGS.common.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {category.suppliers.map((s) => (
              <tr key={s.vendorCode} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  {s.vendorName}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                  {s.vendorCode}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                  ₹{s.spendCr.toFixed(4)} Cr
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {s.spendSharePct.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  {s.distinctMaterialsCount}
                </td>
                <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  {s.distinctPlantsCount}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                  {s.poCount}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {s.isTailSupplier ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                      TAIL (&lt;5%)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      CORE
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectSupplierMaterials(s)}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 mx-auto"
                  >
                    <span>Materials</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
