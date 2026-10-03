'use client';
import React, { useState } from 'react';
import { X, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TransactionEvidenceRecord } from '../../types';

interface TransactionEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  records?: TransactionEvidenceRecord[];
}

export const TransactionEvidenceDrawer: React.FC<TransactionEvidenceDrawerProps> = ({
  isOpen,
  onClose,
  categoryName,
  records = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<TransactionEvidenceRecord | null>(null);

  if (!isOpen) return null;

  const suppliers = Array.from(new Set(records.map((r) => r.supplierName)));

  const filteredRecords = records.filter((r) => {
    const matchesSupplier = selectedSupplier === 'ALL' || r.supplierName === selectedSupplier;
    const matchesSearch = searchTerm === '' ||
      r.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSupplier && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#F8FBFE] backdrop-blur-xs">
      <div className="bg-white dark:bg-white border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#F8FBFE]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                LINE-ITEM TRANSACTION AUDIT DRAWER (SECTION 3 & 17)
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {categoryName} — Transaction Evidence Population
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#EEF4FC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-[#F8FBFE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO, Item, or Supplier..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-white border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Filter Supplier:</span>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="p-1.5 rounded-lg text-xs bg-white dark:bg-white border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="ALL">All Suppliers ({records.length})</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s} ({records.filter((r) => r.supplierName === s).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Split View: Table & Detail Inspector */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Table */}
          <div className="lg:col-span-2 overflow-y-auto max-h-[60vh] lg:max-h-full">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-white border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold z-10">
                <tr>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">Spend</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.transactionId}
                    onClick={() => setSelectedRecord(r)}
                    className={`cursor-pointer transition-colors ${
                      selectedRecord?.transactionId === r.transactionId
                        ? 'bg-cyan-50/70 dark:bg-cyan-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-[#EEF4FC]'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {r.poNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">{r.poDate}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                      {r.supplierName}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{r.quantity.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{r.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                      ₹{r.totalValue.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {r.isEligible ? (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          <AlertCircle className="w-3 h-3 mr-0.5" /> Excluded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Record Detail Inspector (24 Fields) */}
          <div className="p-4 bg-slate-50/50 dark:bg-[#F8FBFE] overflow-y-auto space-y-3 text-xs max-h-[32vh] lg:max-h-full">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 pb-2">
              Source Record Traceability Proof
            </h4>

            {selectedRecord ? (
              <div className="space-y-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 font-sans">Transaction ID:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.transactionId}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">PO Number & Date:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.poNumber} ({selectedRecord.poDate})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Supplier:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.supplierName} ({selectedRecord.supplierId})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Item & Specification:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.itemDescription}</div>
                  <div className="text-[10px] text-slate-500 font-sans">{selectedRecord.specification} | Grade: {selectedRecord.grade}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-sans">Unit Price:</span>
                    <div className="font-bold text-cyan-600">₹{selectedRecord.unitPrice.toFixed(2)}/{selectedRecord.uom}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Total Spend:</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">₹{selectedRecord.totalValue.toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Plant / Delivery:</span>
                  <div className="text-slate-700 dark:text-slate-300 font-sans">{selectedRecord.deliveryLocation}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Commercial Terms:</span>
                  <div className="text-slate-700 dark:text-slate-300 font-sans">{selectedRecord.paymentTerms} | Incoterm: {selectedRecord.incoterm}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Source Document Reference:</span>
                  <div className="text-emerald-700 dark:text-emerald-400 font-sans">
                    {selectedRecord.sourceDocument} (Row #{selectedRecord.sourceRow})
                  </div>
                </div>
                {!selectedRecord.isEligible && (
                  <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-400 font-sans">
                    Exclusion: {selectedRecord.exclusionReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 italic">
                Select any transaction row to inspect its complete 24-point source record proof.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#F8FBFE] flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRecords.length} of {records.length} transactions</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-[#EEF4FC] hover:bg-slate-300 dark:hover:bg-[#DCE7F5] text-slate-800 dark:text-slate-200 font-bold transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
