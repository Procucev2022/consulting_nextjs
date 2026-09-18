'use client';
import React, { useState } from 'react';
import { GitMerge, Check, X, AlertCircle, EyeOff } from 'lucide-react';
import type { MergeVendorModalProps } from '../../types';
import { UI_STRINGS, DEFAULT_MASTER_SUPPLIERS, mergeVendorFormSchema } from '../../constants';
import { validateInput } from '../../utils/validation';

export const MergeVendorModal: React.FC<MergeVendorModalProps & {
  masterSuppliers?: Array<{ id: string; name: string; subsidiaries: string[] }>;
}> = ({
  record,
  isOpen,
  onClose,
  onMerge,
  onIgnore,
  masterSuppliers: customMasterSuppliers
}) => {
  const masterSuppliers = (customMasterSuppliers && customMasterSuppliers.length > 0)
    ? customMasterSuppliers
    : (record?.vendor_name ? [
        {
          id: `VEN-${record.vendor_name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'MSTR'}-001`,
          name: record.vendor_name,
          subsidiaries: [`${record.vendor_name} Corporate`, `${record.vendor_name} Logistics`]
        }
      ] : (DEFAULT_MASTER_SUPPLIERS as unknown as Array<{ id: string; name: string; subsidiaries: string[] }>));

  const [selectedMaster, setSelectedMaster] = useState<string>(masterSuppliers[0]?.id || '');

  if (!isOpen || !record) return null;

  const handleConfirm = (): void => {
    const chosen = masterSuppliers.find((s) => s.id === selectedMaster) || masterSuppliers[0];
    if (!chosen) return;
    const validation = validateInput(mergeVendorFormSchema, {
      recordId: record.record_id,
      masterVendorId: chosen.id,
      masterVendorName: chosen.name
    });
    if (!validation.success) return;

    onMerge(validation.data.recordId, validation.data.masterVendorId, validation.data.masterVendorName);
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-cyan-800 dark:text-cyan-400 font-bold uppercase tracking-wider">
                {UI_STRINGS.modals.mergeVendor.entityDisambiguationBadge}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.mergeVendor.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                  {UI_STRINGS.modals.mergeVendor.incomingEntityLabel}
                </span>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                  {record.vendor_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Transaction: {record.raw_desc}
                </p>
              </div>

              <button
                type="button"
                onClick={handleIgnore}
                title={UI_STRINGS.modals.mergeVendor.ignoreButtonTooltip}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{UI_STRINGS.modals.mergeVendor.ignoreButton}</span>
              </button>
            </div>

            {/* Issue Description Area */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-start space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {UI_STRINGS.modals.mergeVendor.issueLabel}: {record.issue_flag}
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {UI_STRINGS.modals.mergeVendor.issueDescription}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {UI_STRINGS.modals.mergeVendor.selectTargetLabel}
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {masterSuppliers.map((master) => (
                <div
                  key={master.id}
                  onClick={() => setSelectedMaster(master.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMaster === master.id
                      ? 'bg-cyan-50 border-cyan-500 shadow-sm dark:bg-cyan-950/40 dark:border-cyan-500 dark:shadow-cyan-500/10'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{master.name}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400">
                      {master.id}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {master.subsidiaries.map((sub, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 border-t border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
          >
            {UI_STRINGS.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.modals.mergeVendor.confirmMerge}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
