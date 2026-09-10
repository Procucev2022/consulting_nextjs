import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { VendorSupplyTableProps } from '../../types/vendorSupply';
import {
  VENDOR_SUPPLY_BADGE_STYLES,
  VENDOR_SUPPLY_THRESHOLDS
} from '../../constants/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';
import { VendorSupplyYoYBadge } from './VendorSupplyYoYBadge';

export const VendorSupplyTable: React.FC<VendorSupplyTableProps> = ({
  vendors,
  onSelectVendor,
  onViewItems,
  onResetFilters
}) => {
  const strings = UI_STRINGS.module2.vendorSupply;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900/80">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-3.5">{strings.tableHeaders.rank}</th>
              <th className="py-3 px-3.5">{strings.tableHeaders.vendor}</th>
              <th className="py-3 px-3 text-center">{strings.tableHeaders.supplyType}</th>
              <th className="py-3 px-3.5">{strings.tableHeaders.primaryCategory}</th>
              <th className="py-3 px-3.5">{strings.tableHeaders.suppliedCategories}</th>
              <th className="py-3 px-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                {strings.tableHeaders.totalSpend}
              </th>
              <th className="py-3 px-3 text-right">{strings.tableHeaders.spendYoY}</th>
              <th className="py-3 px-3 text-right">{strings.tableHeaders.quantityYoY}</th>
              <th className="py-3 px-3 text-right">{strings.tableHeaders.priceYoY}</th>
              <th className="py-3 px-3.5">{strings.tableHeaders.yoyObservationRemark}</th>
              <th className="py-3 px-3 text-center">{strings.tableHeaders.itemActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  <p className="font-semibold">{strings.noVendorsFound}</p>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 underline font-semibold"
                  >
                    {strings.resetFilters}
                  </button>
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => {
                const isMulti = vendor.category_type === 'MULTI_CATEGORY';
                const isTopRank = vendor.rank <= 3;
                const isHighSpend = vendor.total_spend_inr_cr >= VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR;
                const spendYoY = vendor.spend_yoy_pct;
                const qtyYoY = vendor.qty_yoy_pct;
                const priceYoY = vendor.price_yoy_pct;

                return (
                  <tr
                    key={vendor.master_vendor_id}
                    onClick={() => onSelectVendor(vendor)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isMulti && isHighSpend
                        ? 'bg-amber-50/30 dark:bg-amber-950/20'
                        : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3.5 font-mono">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          isTopRank
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        #{vendor.rank}
                      </span>
                    </td>

                    {/* Vendor Name & Master ID */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {vendor.vendor_name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {vendor.master_vendor_id}
                      </div>
                    </td>

                    {/* Supply Type */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isMulti
                            ? VENDOR_SUPPLY_BADGE_STYLES.MULTI_CATEGORY.badgeClass
                            : VENDOR_SUPPLY_BADGE_STYLES.SINGLE_CATEGORY.badgeClass
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isMulti
                              ? VENDOR_SUPPLY_BADGE_STYLES.MULTI_CATEGORY.indicatorClass
                              : VENDOR_SUPPLY_BADGE_STYLES.SINGLE_CATEGORY.indicatorClass
                          }`}
                        />
                        <span>{isMulti ? strings.badgeMultiCategory : strings.badgeSingleCategory}</span>
                        {isMulti && (
                          <span className="font-mono ml-0.5 text-[9px] bg-amber-200/60 dark:bg-amber-800/60 px-1 rounded">
                            {vendor.category_count}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Primary Category */}
                    <td className="py-3.5 px-3.5 max-w-[170px] truncate font-medium text-slate-800 dark:text-slate-200" title={vendor.primary_category}>
                      {vendor.primary_category}
                    </td>

                    {/* Supplied Categories */}
                    <td className="py-3.5 px-3.5 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {vendor.supplied_categories.map((cat) => {
                          const isDisparate = vendor.irrelevant_categories.includes(cat);
                          return (
                            <span
                              key={cat}
                              className={`text-[9px] px-1.5 py-0.2 rounded border font-medium truncate max-w-[180px] ${
                                isDisparate
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                              title={isDisparate ? `Disparate Cross-Supply: ${cat}` : cat}
                            >
                              {isDisparate ? `⚠️ ${cat}` : cat}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Total 3-Yr Spend */}
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      ₹{vendor.total_spend_inr_cr.toFixed(2)} Cr
                    </td>

                    {/* Spend YoY */}
                    <td className="py-3.5 px-3 text-right">
                      <VendorSupplyYoYBadge pct={spendYoY} compact />
                    </td>

                    {/* Quantity YoY */}
                    <td className="py-3.5 px-3 text-right">
                      <VendorSupplyYoYBadge pct={qtyYoY} compact />
                    </td>

                    {/* Price YoY */}
                    <td className="py-3.5 px-3 text-right">
                      <VendorSupplyYoYBadge pct={priceYoY} compact />
                    </td>

                    {/* YoY Observation / Remark */}
                    <td className="py-3.5 px-3.5 max-w-[240px]">
                      {vendor.yoy_observation_mark && (
                        <div
                          className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded px-2 py-0.5 inline-flex items-center gap-1.5 mb-1 max-w-full"
                          title={vendor.yoy_observation_mark}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 animate-pulse" />
                          <span className="truncate">⚠️ {vendor.yoy_observation_mark}</span>
                        </div>
                      )}
                      {vendor.yoy_remark && (
                        <div
                          className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded px-2 py-0.5 inline-flex items-center gap-1.5 max-w-full"
                          title={vendor.yoy_remark}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          <span className="truncate">ℹ️ {vendor.yoy_remark}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions: View Line Items */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        id={`btn-view-items-${vendor.master_vendor_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewItems(vendor);
                        }}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors"
                        title={strings.btnViewItems}
                      >
                        <span>{strings.btnViewItems}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
