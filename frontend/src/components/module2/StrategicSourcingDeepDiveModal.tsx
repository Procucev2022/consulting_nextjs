'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { StrategicSourcingDeepDiveModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';
import { StrategicSourcingOpportunityWaterfall } from './StrategicSourcingOpportunityWaterfall';
import { StrategicSourcingLeverMatrixView } from './StrategicSourcingLeverMatrixView';
import { StrategicSourcingScorecardView } from './StrategicSourcingScorecardView';
import { CategorySupplierProfileTab } from './CategorySupplierProfileTab';
import { CategoryPriceDispersionTab } from './CategoryPriceDispersionTab';
import { MarketDiscoveryPanel } from './MarketDiscoveryPanel';
import { CommercialExcellencePanel } from './CommercialExcellencePanel';
import { ProcurementMaturityScorecardView } from './ProcurementMaturityScorecardView';
import { ActionRecommendationPanel } from './ActionRecommendationPanel';
import { CategoryEvidenceAuditTab } from './CategoryEvidenceAuditTab';

export const StrategicSourcingDeepDiveModal: React.FC<StrategicSourcingDeepDiveModalProps> = ({
  isOpen,
  onClose,
  profile,
  onHandoffToModule4,
  onOpenHowCalculated
}) => {
  const strings = UI_STRINGS.module2Sourcing;
  const [activeTab, setActiveTab] = useState<'profile' | 'price' | 'opportunity' | 'intelligence' | 'strategy' | 'evidence'>('profile');

  if (!isOpen || !profile) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold">
                {profile.categoryId}
              </span>
              <span className="text-xs text-slate-400 font-mono">UNSPSC: {profile.unspscCode}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Confidence: {profile.dataConfidence}
              </span>
              {profile.evidenceStateLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {profile.evidenceStateLabel}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {profile.categoryName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile.module2Classification} • Materiality: {profile.categoryMateriality} • Status:{' '}
              <span className="font-semibold text-cyan-600">{profile.statusLabel}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenHowCalculated && (
              <button
                type="button"
                onClick={() => onOpenHowCalculated(profile)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center space-x-1"
                title="View step-by-step mathematical traceability"
              >
                <span>How calculated?</span>
              </button>
            )}
            {profile.isQuantifiable && (profile.netQuantifiableOpportunityInr || 0) > 0 && (
              <button
                type="button"
                onClick={() => onHandoffToModule4?.(profile)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm transition-all"
              >
                {strings.btnHandoffToModule4}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 text-xs overflow-x-auto">
          {[
            { key: 'profile', label: '1. Category & Supplier Profile (Sec A-E)' },
            { key: 'price', label: '2. Price & Dispersion (Sec F-H)' },
            { key: 'opportunity', label: '3. Opportunity & Waterfall (Sec I-M)' },
            { key: 'intelligence', label: '4. Market Discovery & Maturity (Sec U-W)' },
            { key: 'strategy', label: '5. Strategy & Roadmap (Sec N-Q, X)' },
            { key: 'evidence', label: '6. Evidence & Audit (Sec R-T)' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && <CategorySupplierProfileTab profile={profile} />}

          {/* TAB 2: Price */}
          {activeTab === 'price' && <CategoryPriceDispersionTab profile={profile} />}

          {/* TAB 3: Opportunity & Waterfall */}
          {activeTab === 'opportunity' && (
            <div className="space-y-4">
              <StrategicSourcingOpportunityWaterfall
                stages={profile.waterfall}
                categoryName={profile.categoryName}
              />
              {profile.scenarios.isAvailable && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    {strings.sectionScenarioAnalysis}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Conservative</span>
                      <div className="text-base font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
                        ₹{((profile.scenarios.conservativeOpportunityInr || 0) / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{profile.scenarios.conservativeMethodology}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-800 ring-1 ring-cyan-500/20">
                      <span className="text-[10px] font-bold text-cyan-600 uppercase">Base Case</span>
                      <div className="text-base font-black font-mono text-cyan-600 mt-1">
                        ₹{((profile.scenarios.baseOpportunityInr || 0) / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{profile.scenarios.baseMethodology}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Stretch</span>
                      <div className="text-base font-black font-mono text-emerald-600 mt-1">
                        ₹{((profile.scenarios.stretchOpportunityInr || 0) / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{profile.scenarios.stretchMethodology}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Opportunity Intelligence V2 (Market Discovery & Maturity) */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              <MarketDiscoveryPanel marketDiscovery={profile.marketDiscovery} />
              <CommercialExcellencePanel commercialExcellence={profile.commercialExcellence} />
              <ProcurementMaturityScorecardView procurementMaturity={profile.procurementMaturity} />
            </div>
          )}

          {/* TAB 5: Strategy & Roadmap */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
              <ActionRecommendationPanel actionRecommendation={profile.actionRecommendation} />
              <StrategicSourcingScorecardView scorecard={profile.scorecard} />
              <StrategicSourcingLeverMatrixView levers={profile.levers} />
            </div>
          )}

          {/* TAB 6: Evidence & Audit */}
          {activeTab === 'evidence' && (
            <CategoryEvidenceAuditTab profile={profile} />
          )}

        </div>
      </div>
    </div>
  );
};
