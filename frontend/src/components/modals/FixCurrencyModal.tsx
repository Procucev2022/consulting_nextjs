'use client';
import React, { useState } from 'react';
import { DollarSign, Check, X, RefreshCw, Globe, TrendingUp, Sparkles } from 'lucide-react';
import { ValidationPreCheckRecord, FixCurrencyModalProps } from '../../types';
import { yahooFinanceFXRates, convertToINR, formatINRAmount } from '../../utils/currencyConverter';
import { UI_STRINGS, INR_CRORES_DIVISOR, fixCurrencyFormSchema } from '../../constants';
import { validateInput } from '../../utils/validation';

export const FixCurrencyModal: React.FC<FixCurrencyModalProps> = ({
  record,
  isOpen,
  onClose,
  onFix
}) => {
  const initialCurrency = record?.raw_currency && yahooFinanceFXRates[record.raw_currency] ? record.raw_currency : 'USD';
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);
  const [customRate, setCustomRate] = useState<number>(yahooFinanceFXRates[initialCurrency].currentRate);

  if (!isOpen || !record) return null;

  const year = record.spend_year || 2024;
  const activeRate = customRate;
  const conversionResult = convertToINR(record.amount, selectedCurrency, year);
  const calculatedINR = Math.round(record.amount * activeRate);
  const calculatedCrores = (calculatedINR / INR_CRORES_DIVISOR).toFixed(4);

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    setCustomRate(yahooFinanceFXRates[curr].currentRate);
  };

  const handleSubmit = () => {
    const validation = validateInput(fixCurrencyFormSchema, {
      recordId: record.record_id,
      selectedCurrency: selectedCurrency as any,
      convertedAmountINR: calculatedINR
    });
    if (!validation.success) return;

    onFix(validation.data.recordId, validation.data.selectedCurrency, validation.data.convertedAmountINR);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  {UI_STRINGS.modals.fixCurrency.fxEngineBadge}
                </span>
                <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  {selectedCurrency} / INR
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.fixCurrency.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.recordIdLabel}</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{record.record_id} ({year})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.poNumberLabel}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{record.po_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.vendorCategoryLabel}</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{record.vendor_name} ({record.core_category || 'Direct'})</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.rawAmountLabel}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {selectedCurrency} {record.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Original Currency Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {UI_STRINGS.modals.fixCurrency.detectedCurrencyLabel}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {(['USD', 'EUR', 'GBP', 'AED', 'JPY', 'SGD'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleCurrencyChange(curr)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                    selectedCurrency === curr
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Time-Series FX Conversion Detail */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-medium">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{UI_STRINGS.modals.fixCurrency.conversionRateLabel}</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                1 {selectedCurrency} = ₹{activeRate.toFixed(2)} INR
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{UI_STRINGS.modals.fixCurrency.convertedValueLabel}</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base">
                ₹{calculatedCrores} Cr
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono text-right">
              ({formatINRAmount(calculatedINR)} Indian Rupees)
            </div>
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
            onClick={handleSubmit}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.modals.fixCurrency.applyConversion}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
