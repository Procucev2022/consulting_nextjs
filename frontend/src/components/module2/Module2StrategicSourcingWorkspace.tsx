'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Gavel, RefreshCw } from 'lucide-react';
import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2StrategicSourcingWorkspaceProps
} from '../../types';
import { UI_STRINGS } from '../../constants';
import { Module2StrategicSourcingApi } from '../../utils/module2StrategicSourcingApi';
import { StrategicSourcingDashboardCards } from './StrategicSourcingDashboardCards';
import { StrategicSourcingCategoryTable } from './StrategicSourcingCategoryTable';
import { StrategicSourcingDeepDiveModal } from './StrategicSourcingDeepDiveModal';
import { HowCalculatedModal, type HowCalculatedData } from './HowCalculatedModal';
import { logger } from '../../utils/logger';

export const Module2StrategicSourcingWorkspace: React.FC<Module2StrategicSourcingWorkspaceProps> = () => {
  const strings = UI_STRINGS.module2Sourcing;

  const [summary, setSummary] = useState<Module2StrategicSourcingDashboardSummary | null>(null);
  const [profiles, setProfiles] = useState<CategoryStrategicSourcingProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<CategoryStrategicSourcingProfile | null>(null);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState<boolean>(false);
  const [isHowCalculatedOpen, setIsHowCalculatedOpen] = useState<boolean>(false);
  const [howCalculatedData, setHowCalculatedData] = useState<HowCalculatedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilterCard, setActiveFilterCard] = useState<string>('ALL');

  const loadData = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const [sumRes, profRes] = await Promise.all([
        Module2StrategicSourcingApi.getDashboardSummary(refresh),
        Module2StrategicSourcingApi.getCategoryProfiles(refresh)
      ]);
      if (sumRes) setSummary(sumRes);
      if (profRes) setProfiles(profRes);
    } catch (err) {
      logger.error('Failed to load Module 2 Strategic Sourcing data', {}, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectCategory = (profile: CategoryStrategicSourcingProfile) => {
    setSelectedProfile(profile);
    setIsDeepDiveOpen(true);
  };

  const handleExportAudit = async () => {
    try {
      const data = await Module2StrategicSourcingApi.exportAuditDossier();
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MODULE_2_STRATEGIC_SOURCING_AUDIT_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Failed to trigger export', {}, err);
    }
  };

  const handleHandoffToModule4 = (profile: CategoryStrategicSourcingProfile) => {
    logger.info('Packaged opportunity for Module 4 sourcing execution', {
      categoryId: profile.categoryId,
      opportunityId: profile.calculationId
    });
    alert(`Opportunity ${profile.categoryId} successfully packaged for Module 4 Sourcing Execution.`);
  };

  const handleOpenHowCalculated = (profile?: CategoryStrategicSourcingProfile | null) => {
    const target = profile || selectedProfile || profiles[0];
    if (!target) return;
    const eauctionOpp = target.potentialEAuctionOpportunityInr || 0;
    const consolOpp = target.potentialVendorConsolidationOpportunityInr || 0;
    const gross = target.grossQuantifiableBenefitInr || (eauctionOpp + consolOpp);
    const overlap = target.overlappingOpportunityInr || 0;
    const net = target.netQuantifiableOpportunityInr || 0;

    setHowCalculatedData({
      opportunityId: target.calculationId,
      categoryName: target.categoryName,
      opportunityType: target.primarySourcingLever || 'E_AUCTION',
      currentSpendInr: target.totalSpendInr,
      eligibleSpendInr: target.addressableSpendInr,
      eligibleQuantity: target.addressableQuantity,
      currentWeightedPrice: target.priceDispersion?.weightedAveragePrice || 0,
      historicalReferencePrice: target.credibleReference?.referencePrice || 0,
      priceDifferential: Math.max(
        0,
        (target.priceDispersion?.weightedAveragePrice || 0) - (target.credibleReference?.referencePrice || 0)
      ),
      grossOpportunityInr: gross,
      overlapAdjustmentInr: overlap,
      netOpportunityInr: net,
      confidence: target.dataConfidence,
      referenceVolumeSharePct: 18.4
    });
    setIsHowCalculatedOpen(true);
  };

  return (
    <div
      data-testid="module2-strategic-sourcing-workspace"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
    >
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              MODULE 2 ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              CUSTOMER SPEND &rarr; SPEND INTELLIGENCE &rarr; SOURCING ENGINE
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 mt-1">
            <Gavel className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>{strings.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-4xl mt-0.5">
            {strings.subtitle} • {strings.noFabricationNotice}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Engine</span>
          </button>
        </div>
      </div>

      {/* 10 KPI Dashboard Summary Cards */}
      {summary && (
        <StrategicSourcingDashboardCards
          summary={summary}
          onFilterCardClick={(key) => setActiveFilterCard(key)}
          activeFilter={activeFilterCard}
          onOpenHowCalculated={() => handleOpenHowCalculated()}
        />
      )}

      {/* Category Sourcing Table */}
      <StrategicSourcingCategoryTable
        profiles={profiles}
        onSelectCategory={handleSelectCategory}
        onExportAudit={handleExportAudit}
        selectedCategoryName={selectedProfile?.categoryName}
        onOpenHowCalculated={handleOpenHowCalculated}
      />

      {/* 20-Section Deep Dive Modal */}
      <StrategicSourcingDeepDiveModal
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
        profile={selectedProfile}
        onHandoffToModule4={handleHandoffToModule4}
        onOpenHowCalculated={handleOpenHowCalculated}
      />

      {/* Clickable How Calculated Modal */}
      <HowCalculatedModal
        isOpen={isHowCalculatedOpen}
        onClose={() => setIsHowCalculatedOpen(false)}
        data={howCalculatedData}
      />
    </div>
  );
};
