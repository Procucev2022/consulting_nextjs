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
import { TenantMaster, DatasetType, ClientIngestionSetupModalProps } from '../../types';
import { yahooFinanceFXRates } from '../../utils/currencyConverter';
import { UI_STRINGS, DEFAULT_TENANT_ENTERPRISE_NAME, clientIngestionSetupFormSchema } from '../../constants';
import { validateInput } from '../../utils/validation';

export type { DatasetType, ClientIngestionSetupModalProps };

export const ClientIngestionSetupModal: React.FC<ClientIngestionSetupModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  onConfirmAndUpload
}) => {
  const [clientName, setClientName] = useState(currentTenant.enterprise_name || DEFAULT_TENANT_ENTERPRISE_NAME);

  const [datasetType, setDatasetType] = useState<DatasetType>('Purchase History');
  const [spendPeriod, setSpendPeriod] = useState<string>(UI_STRINGS.modals.clientSetup.spendPeriods.months36);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>(currentTenant.base_currency || 'INR');
  const [region, setRegion] = useState<'NA' | 'EU' | 'APAC' | 'GLOBAL'>(currentTenant.region || 'GLOBAL');
  const [estimatedSpendCr, setEstimatedSpendCr] = useState<number>(
    currentTenant.total_spend_evaluated_inr || 732.41
  );

  if (!isOpen) return null;

  const datasetOptions = [
    {
      id: 'Purchase History' as DatasetType,
      title: UI_STRINGS.modals.clientSetup.datasetOptions.purchaseHistory.title,
      icon: FileSpreadsheet,
      badge: UI_STRINGS.modals.clientSetup.datasetOptions.purchaseHistory.badge,
      desc: UI_STRINGS.modals.clientSetup.datasetOptions.purchaseHistory.desc,
      color: 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400'
    },
    {
      id: 'Invoice Data' as DatasetType,
      title: UI_STRINGS.modals.clientSetup.datasetOptions.invoiceData.title,
      icon: Receipt,
      badge: UI_STRINGS.modals.clientSetup.datasetOptions.invoiceData.badge,
      desc: UI_STRINGS.modals.clientSetup.datasetOptions.invoiceData.desc,
      color: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'Trial Balance' as DatasetType,
      title: UI_STRINGS.modals.clientSetup.datasetOptions.trialBalance.title,
      icon: Scale,
      badge: UI_STRINGS.modals.clientSetup.datasetOptions.trialBalance.badge,
      desc: UI_STRINGS.modals.clientSetup.datasetOptions.trialBalance.desc,
      color: 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInput(clientIngestionSetupFormSchema, {
      clientName: clientName.trim(),
      datasetType,
      spendPeriod,
      currency,
      region,
      estimatedSpend: (estimatedSpendCr * 10000000) / 83.8
    });

    if (!validation.success) {
      return;
    }

    onConfirmAndUpload(validation.data);
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
                  {UI_STRINGS.modals.clientSetup.stepBadge}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.clientSetup.moduleBadge}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {UI_STRINGS.modals.clientSetup.title}
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
              <span>{UI_STRINGS.modals.clientSetup.enterpriseClientName}</span>
            </label>
            <input
              type="text"
              required
              placeholder={UI_STRINGS.modals.clientSetup.clientPlaceholder}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">{UI_STRINGS.modals.clientSetup.quickSelect}</span>
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
              <span>{UI_STRINGS.modals.clientSetup.selectDatasetType}</span>
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
                          {UI_STRINGS.modals.clientSetup.selectedBadge}
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
                <span>{UI_STRINGS.modals.clientSetup.historicalEvaluationWindow}</span>
              </label>
              <select
                value={spendPeriod}
                onChange={(e) => setSpendPeriod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value={UI_STRINGS.modals.clientSetup.spendPeriods.months36}>{UI_STRINGS.modals.clientSetup.spendPeriods.months36}</option>
                <option value={UI_STRINGS.modals.clientSetup.spendPeriods.months24}>{UI_STRINGS.modals.clientSetup.spendPeriods.months24}</option>
                <option value={UI_STRINGS.modals.clientSetup.spendPeriods.months12}>{UI_STRINGS.modals.clientSetup.spendPeriods.months12}</option>
              </select>
            </div>

            {/* Base Normalization Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{UI_STRINGS.modals.clientSetup.baseNormalizationCurrency}</span>
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
                    {curr === 'INR' ? UI_STRINGS.modals.clientSetup.inrButtonLabel : curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Operating Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{UI_STRINGS.modals.clientSetup.operatingRegion}</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="GLOBAL">{UI_STRINGS.modals.clientSetup.regions.global}</option>
                <option value="NA">{UI_STRINGS.modals.clientSetup.regions.na}</option>
                <option value="EU">{UI_STRINGS.modals.clientSetup.regions.eu}</option>
                <option value="APAC">{UI_STRINGS.modals.clientSetup.regions.apac}</option>
              </select>
            </div>

            {/* Estimated 3-Year Spend in Crores */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{UI_STRINGS.modals.clientSetup.estimatedSpendLabel}</span>
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
                  {UI_STRINGS.modals.clientSetup.spendFormatted(estimatedSpendCr)}
                </span>
              </div>
            </div>
          </div>

          {/* Time-Series FX Normalization Live Guarantee Note */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {UI_STRINGS.modals.clientSetup.fxGuaranteeNote}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200/60 dark:bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-950 dark:text-emerald-200">
              {UI_STRINGS.modals.clientSetup.liveFxBadge}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {UI_STRINGS.modals.clientSetup.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{UI_STRINGS.modals.clientSetup.submitBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
