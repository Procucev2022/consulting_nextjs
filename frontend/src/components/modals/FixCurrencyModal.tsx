import React, { useEffect, useState } from 'react';
import { Check, X, Globe, TrendingUp } from 'lucide-react';
import type { D1CurrencyConversionResponse, D1CurrencyRate, FixCurrencyFormInput, FixCurrencyModalProps } from '../../types';
import { apiClient } from '../../utils/api';
import { formatINRAmount, formatINRInCrores } from '../../utils/currencyConverter';
import { UI_STRINGS, fixCurrencyFormSchema } from '../../constants';
import { validateInput } from '../../utils/validation';
import frontendLogger from '../../utils/logger';

export const FixCurrencyModal: React.FC<FixCurrencyModalProps> = ({ record, isOpen, onClose, onFix }) => {
  const [rates, setRates] = useState<Record<string, D1CurrencyRate>>({});
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [conversion, setConversion] = useState<D1CurrencyConversionResponse['data'] | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingRates(true);
    setRateError(null);
    setConversion(null);
    apiClient.getCurrencyRates()
      .then((catalog) => {
        if (!isMounted) return;
        setRates(catalog);
        const requestedCurrency = record?.raw_currency?.trim().toUpperCase();
        setSelectedCurrency(requestedCurrency && catalog[requestedCurrency]
          ? requestedCurrency
          : catalog.INR ? 'INR' : Object.keys(catalog).sort()[0] || '');
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        frontendLogger.error('Unable to load D1 currency options for correction', { recordId: record?.record_id }, error);
        setRates({});
        setSelectedCurrency('');
        setRateError(error instanceof Error ? error.message : UI_STRINGS.module1.fxReferenceUnavailable);
      })
      .finally(() => { if (isMounted) setIsLoadingRates(false); });
    return () => { isMounted = false; };
  }, [isOpen, record]);

  useEffect(() => {
    if (!isOpen || !record || !selectedCurrency) return;
    let isMounted = true;
    setIsLoadingConversion(true);
    setRateError(null);
    setConversion(null);
    apiClient.getCurrencyConversion(
      selectedCurrency,
      Number(record.amount || 0),
      record.transaction_date || record.spend_year
    )
      .then((result) => { if (isMounted) setConversion(result); })
      .catch((error: unknown) => {
        if (!isMounted) return;
        frontendLogger.error('Unable to load historical D1 currency conversion', {
          recordId: record.record_id,
          currency: selectedCurrency
        }, error);
        setRateError(error instanceof Error ? error.message : UI_STRINGS.module1.fxReferenceUnavailable);
      })
      .finally(() => { if (isMounted) setIsLoadingConversion(false); });
    return () => { isMounted = false; };
  }, [isOpen, record, selectedCurrency]);

  if (!isOpen || !record) return null;

  const shownYear = record.spend_year ?? UI_STRINGS.modals.fixCurrency.unknownYear;
  const rate = conversion?.exchangeRate ?? 0;
  const amountINR = conversion?.amountINR ?? 0;
  const currencies = Object.keys(rates).sort();

  const handleSubmit = (): void => {
    if (!conversion || isLoadingRates || isLoadingConversion) return;
    const validation = validateInput(fixCurrencyFormSchema, {
      recordId: record.record_id,
      selectedCurrency: selectedCurrency as FixCurrencyFormInput['selectedCurrency'],
      convertedAmountINR: amountINR
    });
    if (!validation.success) return;
    onFix(validation.data.recordId, validation.data.selectedCurrency, validation.data.convertedAmountINR);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-white border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-[#F8FBFE]">
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
                  {selectedCurrency || UI_STRINGS.modals.fixCurrency.currencyUnavailable} / INR
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.fixCurrency.title}</h3>
            </div>
          </div>
          <button onClick={onClose} aria-label={UI_STRINGS.common.close} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.recordIdLabel}</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{record.record_id} ({shownYear})</span>
            </div>
            {record.transaction_date && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.transactionDateLabel}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{record.transaction_date}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.poNumberLabel}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{record.po_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.vendorCategoryLabel}</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{record.vendor_name} ({record.core_category || UI_STRINGS.modals.fixCurrency.directCategory})</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.fixCurrency.rawAmountLabel}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {selectedCurrency} {record.amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {UI_STRINGS.modals.fixCurrency.detectedCurrencyLabel}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  disabled={isLoadingRates || isLoadingConversion}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                    selectedCurrency === currency
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#F8FBFE] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-medium">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{UI_STRINGS.modals.fixCurrency.conversionRateLabel}</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {isLoadingConversion ? UI_STRINGS.module1.fxReferenceLoading : `1 ${selectedCurrency} = ₹${rate.toFixed(4)} INR`}
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
              {conversion?.rateDate
                ? UI_STRINGS.modals.fixCurrency.asOnDateFromD1(conversion.rateDate)
                : UI_STRINGS.modals.fixCurrency.d1SourceUnavailable}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{UI_STRINGS.modals.fixCurrency.convertedValueLabel}</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base">
                {formatINRInCrores(amountINR, 4)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono text-right">
              ({formatINRAmount(amountINR)} {UI_STRINGS.modals.fixCurrency.indianRupees})
            </div>
            {rateError && <p role="alert" className="text-xs text-red-700">{rateError}</p>}
            {isLoadingRates && <p role="status" className="text-xs text-slate-600">{UI_STRINGS.module1.fxReferenceLoading}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 border-t border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-[#F8FBFE]">
          <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
            {UI_STRINGS.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!conversion || isLoadingRates || isLoadingConversion}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.modals.fixCurrency.applyConversion}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
