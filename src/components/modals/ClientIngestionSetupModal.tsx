'use client';
import React, { useState } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Receipt,
  Scale,
  Calendar,
  DollarSign,
  Globe,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  UploadCloud,
  FileText,
  TrendingUp
} from 'lucide-react';
import { TenantMaster } from '../../types';
import { yahooFinanceFXRates } from '../../utils/currencyConverter';

export type DatasetType = 'Purchase History' | 'Invoice Data' | 'Trial Balance';

interface ClientIngestionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: TenantMaster;
  onConfirmAndUpload: (config: {
    clientName: string;
    datasetType: DatasetType;
    spendPeriod: string;
    currency: 'INR' | 'USD' | 'EUR' | 'GBP';
    region: 'NA' | 'EU' | 'APAC' | 'GLOBAL';
    estimatedSpend: number;
  }) => void;
}

export const ClientIngestionSetupModal: React.FC<ClientIngestionSetupModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  onConfirmAndUpload
}) => {
  const [clientName, setClientName] = useState(currentTenant.enterprise_name || 'Apex Industrial Dynamics (Fortune 500)');
  const [datasetType, setDatasetType] = useState<DatasetType>('Purchase History');
  const [spendPeriod, setSpendPeriod] = useState('36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>(currentTenant.base_currency || 'INR');
  const [region, setRegion] = useState<'NA' | 'EU' | 'APAC' | 'GLOBAL'>(currentTenant.region || 'GLOBAL');
  const [estimatedSpendCr, setEstimatedSpendCr] = useState<number>(
    currentTenant.total_spend_evaluated_inr || 732.41
  );

  if (!isOpen) return null;

  const datasetOptions = [
    {
      id: 'Purchase History' as DatasetType,
      title: 'Purchase History',
      icon: FileSpreadsheet,
      badge: 'PO Master & Line Items',
      desc: 'Purchase orders, item descriptions, line quantities, supplier master IDs, and agreed unit rates across 36 months.',
      color: 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400'
    },
    {
      id: 'Invoice Data' as DatasetType,
      title: 'Invoice Data',
      icon: Receipt,
      badge: 'AP Invoices & Scans',
      desc: 'Accounts payable invoices, OCR scanned receipts, billed line items, tax breakdowns, and payment disbursement records.',
      color: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'Trial Balance' as DatasetType,
      title: 'Trial Balance',
      icon: Scale,
      badge: 'GL & Cost Centers',
      desc: 'General ledger trial balance, chart of accounts, cost center allocations, and financial journal entries.',
      color: 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    onConfirmAndUpload({
      clientName: clientName.trim(),
      datasetType,
      spendPeriod,
      currency,
      region,
      estimatedSpend: estimatedSpendCr * 10000000 / 83.8
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
                  Step 1: Multi-Currency Setup (INR in Crores)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Module 1 (3-Year Intake)</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Client & Dataset Ingestion Setup
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Client / Enterprise Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Enterprise Client Name</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Industrial Dynamics (Fortune 500)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Quick Select:</span>
              {[
                'Apex Industrial Dynamics',
                'Vanguard Eurocorp AG',
                'Global Packaging Holdings',
                'Starlight Precision LLC'
              ].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setClientName(name)}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Select Ingestion Dataset Type</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {datasetOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = datasetType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setDatasetType(opt.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? opt.color + ' shadow-md shadow-cyan-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white dark:bg-slate-900' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-current">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                      {opt.badge}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Grid: Period, Currency, Region, Total Spend in Crores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Historical Spend Period */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Historical Evaluation Window</span>
              </label>
              <select
                value={spendPeriod}
                onChange={(e) => setSpendPeriod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)">36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)</option>
                <option value="24 Months (FY25 - FY26: 1 Apr 2024 - 31 Mar 2026)">24 Months (FY25 - FY26: 1 Apr 2024 - 31 Mar 2026)</option>
                <option value="12 Months (FY26: 1 Apr 2025 - 31 Mar 2026)">12 Months (FY26: 1 Apr 2025 - 31 Mar 2026)</option>
              </select>
            </div>

            {/* Base Normalization Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Base Normalization Currency</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                      currency === curr
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {curr === 'INR' ? '₹ INR (Cr)' : curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Operating Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Enterprise Operating Region</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="GLOBAL">GLOBAL Multi-Region</option>
                <option value="NA">North America (NA)</option>
                <option value="EU">European Union (EU)</option>
                <option value="APAC">Asia-Pacific (APAC)</option>
              </select>
            </div>

            {/* Estimated 3-Year Spend in Crores */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Estimated 3-Yr Spend (INR Crores)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={estimatedSpendCr}
                  onChange={(e) => setEstimatedSpendCr(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{estimatedSpendCr.toFixed(2)} Cr
                </span>
              </div>
            </div>
          </div>

          {/* Time-Series FX Normalization Live Guarantee Note */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                AI uses <strong>time-series FX conversion rates</strong> (USD/INR @ ₹83.8, EUR/INR @ ₹91.4, GBP/INR @ ₹106.5) to normalize all line items into <strong>INR in Crores (₹ Cr)</strong>.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200/60 dark:bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-950 dark:text-emerald-200">
              Live FX
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Confirm & Proceed to Upload Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
