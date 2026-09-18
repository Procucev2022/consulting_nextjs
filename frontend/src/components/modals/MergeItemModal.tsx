'use client';
import React, { useState } from 'react';
import { Package, X, AlertCircle, EyeOff } from 'lucide-react';
import type { MergeItemModalProps } from '../../types';
import { UI_STRINGS, DEFAULT_MASTER_ITEMS, mergeItemFormSchema } from '../../constants';
import { validateInput } from '../../utils/validation';

export const MergeItemModal: React.FC<MergeItemModalProps & {
  masterItems?: Array<{
    code: string;
    name: string;
    category: string;
    column_l_code: string;
    aliases: string[];
  }>;
}> = ({
  record,
  isOpen,
  onClose,
  onMerge,
  onIgnore,
  masterItems: customMasterItems
}) => {
  const masterItems = (customMasterItems && customMasterItems.length > 0)
    ? customMasterItems
    : (record?.raw_desc ? [
        {
          code: `ITM-${record.column_l_code || '101'}`,
          name: record.raw_desc,
          category: record.core_category || 'Direct Materials',
          column_l_code: record.column_l_code || '13101502',
          aliases: [record.raw_desc]
        }
      ] : (DEFAULT_MASTER_ITEMS as unknown as Array<{
        code: string;
        name: string;
        category: string;
        column_l_code: string;
        aliases: string[];
      }>));

  const [selectedCode, setSelectedCode] = useState<string>(masterItems[0]?.code || '');

  if (!isOpen || !record) return null;

  const handleConfirm = (): void => {
    const chosen = masterItems.find((i) => i.code === selectedCode) || masterItems[0];
    if (!chosen) return;
    const validation = validateInput(mergeItemFormSchema, {
      recordId: record.record_id,
      masterItemCode: chosen.code,
      masterItemName: chosen.name
    });
    if (!validation.success) return;

    onMerge(validation.data.recordId, validation.data.masterItemCode, validation.data.masterItemName);
    onClose();
  };

  const handleIgnore = (): void => {
    if (onIgnore) {
      onIgnore(record.record_id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-indigo-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-indigo-800 dark:text-indigo-400 font-bold uppercase tracking-wider">
                {UI_STRINGS.modals.mergeItem.itemDisambiguationBadge}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {UI_STRINGS.modals.mergeItem.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                  {UI_STRINGS.modals.mergeItem.incomingItemLabel}
                </span>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                  {record.raw_desc}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>PO: <strong className="font-mono">{record.po_number}</strong></span>
                  <span>•</span>
                  <span>Qty: <strong className="font-mono">{record.order_quantity?.toLocaleString() || 1000}</strong></span>
                  <span>•</span>
                  <span>Spend: <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{record.inr_crores?.toFixed(2)} Cr</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleIgnore}
                title={UI_STRINGS.modals.mergeItem.ignoreButtonTooltip}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{UI_STRINGS.modals.mergeItem.ignoreButton}</span>
              </button>
            </div>

            {/* Issue Description Area */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-start space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {UI_STRINGS.modals.mergeItem.issueLabel}: {record.issue_flag}
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {UI_STRINGS.modals.mergeItem.issueDescription}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {UI_STRINGS.modals.mergeItem.selectTargetLabel}
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {masterItems.map((master) => {
                const isSelected = selectedCode === master.code;
                return (
                  <div
                    key={master.code}
                    onClick={() => setSelectedCode(master.code)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 shadow-sm dark:bg-indigo-950/40 dark:border-indigo-500 dark:shadow-indigo-500/10'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {master.name}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-800 dark:text-indigo-400">
                        {master.code}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{master.category}</span>
                      <span>•</span>
                      <span>Col L: {master.column_l_code}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {master.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded"
                        >
                          {alias}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {UI_STRINGS.modals.mergeItem.canonicalHint}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 border-t border-slate-100 dark:border-indigo-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
          >
            {UI_STRINGS.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>{UI_STRINGS.modals.mergeItem.confirmMerge}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
