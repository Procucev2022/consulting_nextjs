'use client';
import React, { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { X, Download, ShieldCheck, Calculator, ArrowRight, Layers } from 'lucide-react';
import type {
  EvidenceCalculationTraceModalProps,
  EvidencePackDownloadLink
} from '../../types/module2StrategicSourcingProfiles';
import { UI_STRINGS } from '../../constants/uiStrings';

export const EvidenceCalculationTraceModal: React.FC<EvidenceCalculationTraceModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  const [exportLink, setExportLink] = useState<EvidencePackDownloadLink | null>(null);
  const exportLinkRef = useRef<HTMLAnchorElement>(null);

  if (!isOpen) return null;

  const copy = UI_STRINGS.evidenceCalculationTrace;
  const trace = profile.completeCalculationTrace;
  const chain = profile.evidenceChain;
  const opportunityCr = profile.netQuantifiableOpportunityInrCr;
  const fallbackTitle = typeof opportunityCr === 'number'
    ? copy.fallbackTitle(opportunityCr.toFixed(2))
    : copy.fallbackTitleUnquantified;

  const handleExportEvidencePack = (): void => {
    const pack = {
      exportTimestamp: new Date().toISOString(),
      version: 'MODULE_2_EVIDENCE_LOGIC_V1.0',
      category: profile.categoryName,
      trace,
      chain,
      priceStatistics: profile.evidenceBackedStatistics,
      pairwiseProofs: profile.pairwisePriceProofs,
      exclusions: profile.exclusionLedger,
      transactionsCount: profile.transactionEvidenceRecords?.length || profile.transactionCount
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pack, null, 2));
    // Mount the hidden download anchor synchronously so it can be clicked, then unmount it.
    flushSync(() => {
      setExportLink({
        href: dataStr,
        fileName: `EVIDENCE_PACK_${profile.categoryId}_${Date.now()}.json`
      });
    });
    exportLinkRef.current?.click();
    setExportLink(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FBFE] backdrop-blur-xs">
      <div className="bg-white dark:bg-white border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#F8FBFE]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                {copy.badge}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {trace?.questionPrompt || fallbackTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeLabel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#EEF4FC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* 1. Mathematical Derivation Step-by-Step */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-600" /> {copy.derivationHeading}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-white border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans">{copy.baselineWap}</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {copy.rupeeAmount(chain?.referencePriceAudit.weightedAveragePrice.toFixed(2) || '0.00')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-white border border-emerald-300 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-600 font-sans font-bold">{copy.selectedReference}</span>
                <div className="font-bold text-emerald-600 mt-0.5">
                  {copy.rupeeAmount(chain?.referencePriceAudit.selectedReferencePrice.toFixed(2) || '0.00')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-white border border-cyan-300 dark:border-cyan-800">
                <span className="text-[10px] text-cyan-600 font-sans font-bold">{copy.priceDifferential}</span>
                <div className="font-bold text-cyan-600 mt-0.5">
                  {copy.rupeeAmount(chain?.priceDifference.toFixed(2) || '0.00')}
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 text-[11px] space-y-1">
              <div className="font-mono font-bold text-cyan-900 dark:text-cyan-300">
                {copy.formula(
                  chain?.referencePriceAudit.weightedAveragePrice.toFixed(2) ?? '',
                  chain?.referencePriceAudit.selectedReferencePrice.toFixed(2) ?? '',
                  chain?.addressableVolume.toLocaleString() ?? '',
                  chain?.grossOpportunityInr.toLocaleString() ?? ''
                )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[10px]">
                {chain?.referencePriceAudit.selectionRationale}
              </div>
            </div>
          </div>

          {/* 2. Analytical Range: Conservative vs Base vs Upside */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{copy.conservativeLabel}</span>
              <div className="text-base font-bold font-mono text-blue-900 dark:text-blue-200">
                {copy.lakhValue(((chain?.realisticOpportunityRange.conservativeOpportunityInr || 0) / 100000).toFixed(1))}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {copy.referenceValue(chain?.realisticOpportunityRange.conservativeRefPrice.toFixed(2) ?? '')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 space-y-1 ring-1 ring-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{copy.baseLabel}</span>
              <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {copy.lakhValue(((chain?.realisticOpportunityRange.baseOpportunityInr || 0) / 100000).toFixed(1))}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {copy.referenceValue(chain?.realisticOpportunityRange.baseRefPrice.toFixed(2) ?? '')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-1">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">{copy.upsideLabel}</span>
              <div className="text-base font-bold font-mono text-teal-900 dark:text-teal-200">
                {copy.lakhValue(((chain?.realisticOpportunityRange.upsideOpportunityInr || 0) / 100000).toFixed(1))}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {copy.referenceValue(chain?.realisticOpportunityRange.upsideRefPrice.toFixed(2) ?? '')}
              </div>
            </div>
          </div>

          {/* 3. Addressability Hierarchy */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              {copy.funnelHeading}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-1 rounded bg-white dark:bg-white border border-slate-200 dark:border-slate-800">
                {copy.funnelTotal((profile.totalSpendInr / 10000000).toFixed(2))}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-1 rounded bg-white dark:bg-white border border-slate-200 dark:border-slate-800">
                {copy.funnelComparable((profile.comparableSpendInr / 10000000).toFixed(2))}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 font-bold">
                {copy.funnelAddressable((profile.addressableSpendInr / 10000000).toFixed(2))}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-[#EEF4FC] text-slate-400">
                {copy.funnelRealized}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#F8FBFE] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{copy.confidence(chain?.evidenceConfidence || 'HIGH')}</span>
          </div>
          <button
            type="button"
            onClick={handleExportEvidencePack}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copy.exportEvidencePack}</span>
          </button>
          {exportLink && (
            <a
              ref={exportLinkRef}
              href={exportLink.href}
              download={exportLink.fileName}
              aria-hidden="true"
              className="hidden"
            />
          )}
        </div>
      </div>
    </div>
  );
};
