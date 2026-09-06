'use client';
import React, { useState } from 'react';
import { Tag, Check, X, Search, Sparkles, FileSpreadsheet } from 'lucide-react';
import { LineItemMapping, ReassignModalProps, UNSPSCCommodityRecord } from '../../types';
import { searchUNSPSCTaxonomy } from '../../data/unspscTaxonomy';
import { UI_STRINGS } from '../../constants';

export const ReassignModal: React.FC<ReassignModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [search, setSearch] = useState('');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<UNSPSCCommodityRecord | null>(null);

  if (!isOpen || !item) return null;

  const searchResults = searchUNSPSCTaxonomy(search, selectedBucketFilter).slice(0, 15);

  const handleConfirm = () => {
    if (selectedRecord) {
      onSave(
        item.mapping_id,
        selectedRecord.commodityCode,
        `${selectedRecord.coreBucket} (${selectedRecord.commodityTitle})`,
        selectedRecord.coreBucket || 'Direct Materials'
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-cyan-800 dark:text-cyan-400 font-bold uppercase tracking-wider">
                  {UI_STRINGS.modals.reassign.catalogBadge}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                  {UI_STRINGS.modals.reassign.recordsCountBadge}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.reassign.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.reassign.targetLineItemLabel}</span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.raw_desc}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>Vendor: {item.vendor_identified}</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">${item.total_spend.toLocaleString()} Spend</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={UI_STRINGS.modals.reassign.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={selectedBucketFilter}
              onChange={(e) => setSelectedBucketFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Core Buckets</option>
              <option value="Packaging Materials">Packaging</option>
              <option value="Direct Materials">Direct Materials</option>
              <option value="Indirect & MRO">Indirect & MRO</option>
              <option value="Logistics & Freight">Logistics & Freight</option>
            </select>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {searchResults.map((rec) => {
              const isSelected = selectedRecord?.commodityCode === rec.commodityCode;
              return (
                <div
                  key={rec.commodityCode}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-500 shadow-sm dark:bg-cyan-950/40 dark:border-cyan-500 dark:shadow-cyan-500/10'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                      {rec.commodityCode}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {rec.coreBucket}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                    {rec.commodityTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {rec.segmentTitle} &gt; {rec.familyTitle} &gt; {rec.classTitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 border-t border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
          >
            {UI_STRINGS.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedRecord}
            className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs ${
              selectedRecord
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.modals.reassign.saveMapping}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
