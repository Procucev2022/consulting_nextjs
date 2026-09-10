import React from 'react';
import { X, Package } from 'lucide-react';
import type { VendorSupplyItemDetailsModalProps } from '../../types/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';
import { VendorSupplyYoYBadge } from './VendorSupplyYoYBadge';

export const VendorSupplyItemDetailsModal: React.FC<VendorSupplyItemDetailsModalProps> = ({
  vendor,
  isOpen,
  onClose
}) => {
  if (!isOpen || !vendor) return null;

  const strings = UI_STRINGS.module2.vendorSupply;
  const items = vendor.top_items || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-item-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                #{vendor.rank}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {vendor.master_vendor_id}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  vendor.category_type === 'MULTI_CATEGORY'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {vendor.category_type === 'MULTI_CATEGORY' ? strings.badgeMultiCategory : strings.badgeSingleCategory}
              </span>
            </div>
            <h3 id="vendor-item-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {strings.itemsModalTitle(vendor.vendor_name)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {strings.itemsModalSubtitle}
            </p>
          </div>

          <button
            type="button"
            id="btn-close-vendor-item-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={strings.modalCloseBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendor Summary Bar */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                {strings.tableHeaders.totalSpend}
              </span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                ₹{vendor.total_spend_inr_cr.toFixed(2)} Cr
              </span>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                {strings.tableHeaders.primaryCategory}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {vendor.primary_category}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>{strings.itemCountBadge(items.length)}</span>
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-y-auto p-5 space-y-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">{strings.itemHeaders.materialCode}</th>
                <th className="py-2.5 px-3">{strings.itemHeaders.materialDescription}</th>
                <th className="py-2.5 px-3">{strings.itemHeaders.poNumber}</th>
                <th className="py-2.5 px-3">{strings.itemHeaders.unspsc}</th>
                <th className="py-2.5 px-3 text-right">{strings.itemHeaders.spendYoY}</th>
                <th className="py-2.5 px-3 text-right">{strings.itemHeaders.qtyYoY}</th>
                <th className="py-2.5 px-3 text-right">{strings.itemHeaders.priceYoY}</th>
                <th className="py-2.5 px-3">{strings.itemHeaders.observationRemark}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300 font-mono">
              {items.map((item) => (
                <tr key={`${item.material_code}-${item.po_number}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.material_code}
                  </td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate" title={item.material_description}>
                    {item.material_description}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    {item.po_number}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400 max-w-[160px] truncate text-[11px]" title={item.unspsc_title}>
                    {item.unspsc_title}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <VendorSupplyYoYBadge pct={item.spend_yoy_pct} compact />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <VendorSupplyYoYBadge pct={item.qty_yoy_pct} compact />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <VendorSupplyYoYBadge pct={item.price_yoy_pct} compact />
                  </td>
                  <td className="py-3 px-3 font-sans max-w-[200px]">
                    {item.observation_mark && (
                      <span className="block text-[10px] text-rose-700 dark:text-rose-300 font-medium truncate" title={item.observation_mark}>
                        ⚠️ {item.observation_mark}
                      </span>
                    )}
                    {item.remark && (
                      <span className="block text-[10px] text-blue-700 dark:text-blue-300 font-medium truncate" title={item.remark}>
                        ℹ️ {item.remark}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            type="button"
            id="btn-dismiss-vendor-item-modal"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            {strings.modalCloseBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
