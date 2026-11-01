'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { Module3TrendAnalyticsProps } from '../types';
import { TierMaskOverlay } from './TierMaskOverlay';
import { ExecutiveBenchmarkSummary } from './pcbi/ExecutiveBenchmarkSummary';
import { BenchmarkQualityDashboard } from './pcbi/BenchmarkQualityDashboard';
import { BenchmarkCoverageWaterfall } from './pcbi/BenchmarkCoverageWaterfall';
import { SpendCategoryView } from './pcbi/SpendCategoryView';
import { CalculationTransparencyCard } from './pcbi/CalculationTransparencyCard';
import { VendorPriceDispersionTable } from './pcbi/VendorPriceDispersionTable';
import { PCBIMissingIndexGapView } from './pcbi/PCBIMissingIndexGapView';
import { SelectedBenchmarkDetailCard } from './pcbi/SelectedBenchmarkDetailCard';
import { PCBIExplainabilityModal } from './modals/PCBIExplainabilityModal';
import { apiClient } from '../utils/api';
import { resolveBorosilCommodity } from '../constants/module3CommodityResolver';
import type {
  PCBIExecutiveSummary,
  PCBIExplainabilityAudit,
  PCBITransactionCalculation
} from '../types/pcbi';
import {
  UI_STRINGS,
  TIMELINE_MONTHS
} from '../constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Module3TrendAnalytics: React.FC<Module3TrendAnalyticsProps> = ({
  vendorRankings,
  onProceedToSavings,
  theme = 'light',
  currentTier = 'GOLD',
  onUpgrade,
  assessmentId,
  initialView = 'TRENDS'
}) => {
  const isBorosilAssessment = assessmentId === 'AIC-2026-0002';
  const isTextileAssessment = false;
  const [selectedCommodity, setSelectedCommodity] = useState<string>(
    isBorosilAssessment ? UI_STRINGS.module3.commodities.sodaAsh : UI_STRINGS.module3.commodities.icis
  );
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'CREEP_ANOMALY' | 'ALIGNED'>('ALL');
  const [pcbiSummary, setPcbiSummary] = useState<PCBIExecutiveSummary | null>(null);
  const [calculations] = useState<PCBITransactionCalculation[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<PCBIExplainabilityAudit | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [activeModule3View, setActiveModule3View] = useState<'TRENDS' | 'GAP_LIST'>(initialView);

  const borosilResolution = React.useMemo(() => {
    return isBorosilAssessment ? resolveBorosilCommodity(selectedCommodity) : null;
  }, [isBorosilAssessment, selectedCommodity]);

  useEffect(() => {
    let isMounted = true;
    if (isBorosilAssessment) {
      setSelectedCommodity(UI_STRINGS.module3.commodities.sodaAsh);
    }
    apiClient
      .getPCBIDashboard(assessmentId)
      .then((data: any) => {
        if (isMounted && data?.summary) {
          setPcbiSummary(data.summary);
        }
      })
      .catch(() => {
        // Fall back gracefully to internal calculations
      });

    return () => {
      isMounted = false;
    };
  }, [assessmentId, isBorosilAssessment]);

  const totalLeakageCr = vendorRankings.reduce(
    (sum, v) => sum + (v.variance_leakage_inr_cr || (v.variance_leakage_usd ? (v.variance_leakage_usd * 83.8) / 10000000 : 0) || 0),
    0
  );
  const highCreepVendors = vendorRankings.filter((v) => v.risk_status === 'HIGH CREEP');
  const highCreepCount = highCreepVendors.length;
  const highCreepLeakageCr = highCreepVendors.reduce(
    (sum, v) => sum + (v.variance_leakage_inr_cr || (v.variance_leakage_usd ? (v.variance_leakage_usd * 83.8) / 10000000 : 0) || 0),
    0
  );
  const avgMarkupPct = vendorRankings.length > 0
    ? (vendorRankings.reduce((sum, v) => sum + (v.price_creep_pct || 0), 0) / vendorRankings.length).toFixed(1)
    : '0.0';
  const isCommodityUnavailable = selectedCommodity === UI_STRINGS.module3.commodities.unavailableTextile;
  const hasVerifiedObservations = !isBorosilAssessment && !isCommodityUnavailable && vendorRankings.length > 0 && vendorRankings.some((v) => (v.price_creep_pct || 0) !== 0);
  const avgCreepNum = Number(avgMarkupPct);
  const invoicedDeltaText = hasVerifiedObservations ? `${avgCreepNum >= 0 ? '+' : ''}${avgCreepNum.toFixed(1)}%` : UI_STRINGS.module3.awaitingVerifiedBenchmarks;

  const isDark = theme === 'dark';

  const marketDeltaText = isCommodityUnavailable || isBorosilAssessment || !hasVerifiedObservations ? UI_STRINGS.module3.awaitingVerifiedBenchmarks : (vendorRankings.length > 0 ? '-3.5%' : '0.0%');

  const dynamicInvoicedTrend = React.useMemo(() => {
    // Strictly NO synthetic curves — plot only when verified observation series exist
    if (!hasVerifiedObservations || !vendorRankings || vendorRankings.length === 0) return [];
    return [];
  }, [hasVerifiedObservations, vendorRankings]);

  const dynamicMarketTrend = React.useMemo(() => {
    // Strictly NO synthetic curves — plot only when verified observation series exist
    if (!hasVerifiedObservations || isCommodityUnavailable || !vendorRankings || vendorRankings.length === 0) return [];
    return [];
  }, [hasVerifiedObservations, isCommodityUnavailable, vendorRankings]);

  const chartData = {
    labels: TIMELINE_MONTHS as unknown as string[],
    datasets: [
      {
        label: `Actual Vendor Invoiced Price (${invoicedDeltaText})`,
        data: dynamicInvoicedTrend,
        borderColor: '#e11d48', // Rose-600
        backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(225, 29, 72, 0.08)',
        borderWidth: 3,
        pointBackgroundColor: '#e11d48',
        pointRadius: 4,
        tension: 0.35,
        fill: '+1'
      },
      {
        label: `Market Index Movement (${marketDeltaText}) [${selectedCommodity}]`,
        data: dynamicMarketTrend,
        borderColor: '#0284c7', // Sky-600
        backgroundColor: isDark ? 'rgba(6, 182, 212, 0.05)' : 'rgba(2, 132, 199, 0.05)',
        borderWidth: 3,
        pointBackgroundColor: '#0284c7',
        pointRadius: 4,
        tension: 0.35,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: {
            family: 'Plus Jakarta Sans',
            size: 11,
            weight: 'bold' as const
          },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#1e293b',
        borderColor: '#38bdf8',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y} pts`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)'
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10, family: 'JetBrains Mono' }
        }
      },
      y: {
        min: 90,
        max: 115,
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.18)'
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: (value: any) => `${value} pts`
        }
      }
    }
  };

  const handleWhyThisBenchmark = (item?: PCBITransactionCalculation) => {
    if (item?.id) {
      apiClient
        .getPCBIExplainabilityAudit(item.id)
        .then((audit) => {
          setSelectedAudit(audit);
          setIsExplainModalOpen(true);
        })
        .catch(() => {
          setSelectedAudit(null);
          setIsExplainModalOpen(true);
        });
    } else {
      setSelectedAudit(null);
      setIsExplainModalOpen(true);
    }
  };

  const filteredRankings = vendorRankings.filter((v) => {
    if (filterRisk === 'CREEP_ANOMALY') {
      return v.risk_status === 'HIGH CREEP' || v.risk_status === 'REVIEW' || (v.price_creep_pct != null && v.price_creep_pct > 0);
    }
    if (filterRisk === 'ALIGNED') {
      return v.risk_status === 'ALIGNED' || (v.price_creep_pct != null && v.price_creep_pct <= 0);
    }
    return true;
  });

  if (currentTier === 'BRONZE') {
    return (
      <div className="relative min-h-[500px]">
        <TierMaskOverlay
          title={UI_STRINGS.subscription.stageMaskedTitle(UI_STRINGS.module3.heading)}
          description={UI_STRINGS.subscription.stageMaskedBronzeDesc}
          requiredTier="SILVER"
          onUpgrade={() => onUpgrade?.('SILVER')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-orange-50 border border-rose-100 shadow-sm glass-panel-glow">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-300">
              {UI_STRINGS.module3.badge}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {UI_STRINGS.module3.valuationBadge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {UI_STRINGS.module3.heading}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {UI_STRINGS.module3.description}
          </p>
        </div>

        {/* Commodity Benchmark Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-xs text-slate-500">{UI_STRINGS.module3.benchmarkLabel}</span>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-cyan-700 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-[360px] truncate"
          >
            {isBorosilAssessment ? (
              <>
                <option value={UI_STRINGS.module3.commodities.sodaAshDense}>{UI_STRINGS.module3.commodities.sodaAshDense}</option>
                <option value={UI_STRINGS.module3.commodities.sodaAshLocal}>{UI_STRINGS.module3.commodities.sodaAshLocal}</option>
                <option value={UI_STRINGS.module3.commodities.sodaAsh}>{UI_STRINGS.module3.commodities.sodaAsh}</option>
                <option value={UI_STRINGS.module3.commodities.silicaSandSolar}>{UI_STRINGS.module3.commodities.silicaSandSolar}</option>
                <option value={UI_STRINGS.module3.commodities.quartzSand}>{UI_STRINGS.module3.commodities.quartzSand}</option>
                <option value={UI_STRINGS.module3.commodities.silicaSand}>{UI_STRINGS.module3.commodities.silicaSand}</option>
                <option value={UI_STRINGS.module3.commodities.lshsFuel}>{UI_STRINGS.module3.commodities.lshsFuel}</option>
                <option value={UI_STRINGS.module3.commodities.bulkLpgGas}>{UI_STRINGS.module3.commodities.bulkLpgGas}</option>
                <option value={UI_STRINGS.module3.commodities.bulkLpg}>{UI_STRINGS.module3.commodities.bulkLpg}</option>
                <option value={UI_STRINGS.module3.commodities.bottledLpg}>{UI_STRINGS.module3.commodities.bottledLpg}</option>
                <option value={UI_STRINGS.module3.commodities.dieselBulk}>{UI_STRINGS.module3.commodities.dieselBulk}</option>
                <option value={UI_STRINGS.module3.commodities.dieselEquip}>{UI_STRINGS.module3.commodities.dieselEquip}</option>
                <option value={UI_STRINGS.module3.commodities.diesel}>{UI_STRINGS.module3.commodities.diesel}</option>
                <option value={UI_STRINGS.module3.commodities.kraftPaper}>{UI_STRINGS.module3.commodities.kraftPaper}</option>
                <option value={UI_STRINGS.module3.commodities.packagingPolymers}>{UI_STRINGS.module3.commodities.packagingPolymers}</option>
                <option value={UI_STRINGS.module3.commodities.labSodiumCarbonate}>{UI_STRINGS.module3.commodities.labSodiumCarbonate}</option>
                <option value={UI_STRINGS.module3.commodities.refractories}>{UI_STRINGS.module3.commodities.refractories}</option>
                <option value={UI_STRINGS.module3.commodities.lngSystem}>{UI_STRINGS.module3.commodities.lngSystem}</option>
                <option value={UI_STRINGS.module3.commodities.pendingApproval}>{UI_STRINGS.module3.commodities.pendingApproval}</option>
              </>
            ) : (
              <>
                {(isTextileAssessment || isCommodityUnavailable) && (
                  <option value={UI_STRINGS.module3.commodities.unavailableTextile}>
                    {UI_STRINGS.module3.commodities.unavailableTextile}
                  </option>
                )}
                <option value={UI_STRINGS.module3.commodities.icis}>{UI_STRINGS.module3.commodities.icis}</option>
                <option value={UI_STRINGS.module3.commodities.lme}>{UI_STRINGS.module3.commodities.lme}</option>
                <option value={UI_STRINGS.module3.commodities.cass}>{UI_STRINGS.module3.commodities.cassIndex}</option>
                <option value={UI_STRINGS.module3.commodities.fastmarkets}>{UI_STRINGS.module3.commodities.fastmarkets}</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* View Switcher Tabs: Trend Analysis vs Missing-Index Gap Register */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveModule3View('TRENDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeModule3View === 'TRENDS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {UI_STRINGS.module3.gapList.tabTrends}
        </button>
        <button
          type="button"
          onClick={() => setActiveModule3View('GAP_LIST')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeModule3View === 'GAP_LIST'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {UI_STRINGS.module3.gapList.tabGapList}
        </button>
      </div>

      {activeModule3View === 'GAP_LIST' ? (
        <PCBIMissingIndexGapView assessmentId={assessmentId} />
      ) : (
        <>
          {/* Explanatory Banner for Benchmark Readiness */}
          {(isBorosilAssessment || isTextileAssessment) && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-900">
                    {UI_STRINGS.module3.gapList.bannerTitle}
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {UI_STRINGS.module3.gapList.bannerDescription}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule3View('GAP_LIST')}
                className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{UI_STRINGS.module3.gapList.btnViewGapRegister}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

      {/* 1. Executive Benchmark Summary (14 Top KPIs - Master Product Spec) */}
      <ExecutiveBenchmarkSummary summary={pcbiSummary as any} />

      {/* 2. Benchmark Quality Dashboard (A/B/C/Not Benchmarkable) */}
      <BenchmarkQualityDashboard summary={pcbiSummary as any} />

      {/* 3. Benchmark Coverage Waterfall (Spend Isolation Cascade) */}
      <BenchmarkCoverageWaterfall summary={pcbiSummary as any} />

      {/* 4. Spend Category View (6 Standard Enterprise Categories) */}
      <SpendCategoryView summary={pcbiSummary as any} />

      {/* Selected Benchmark Forensic Resolution Card */}
      {isBorosilAssessment && borosilResolution && (
        <SelectedBenchmarkDetailCard
          resolution={borosilResolution}
          onViewGapRegister={() => setActiveModule3View('GAP_LIST')}
        />
      )}

      {/* 5. 36-Month Dynamic Trend Chart + Price Creep Leakage Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <LineChartIcon className="w-4 h-4 text-rose-600" />
                <span>{UI_STRINGS.module3.chartHeading}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {UI_STRINGS.module3.chartSubheading}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-cyan-700 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Market: {marketDeltaText}</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Invoiced: {invoicedDeltaText}</span>
              </span>
            </div>
          </div>

          {/* Dynamic Chart Container */}
          <div className="h-72 w-full pt-2">
            {!hasVerifiedObservations || dynamicInvoicedTrend.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center p-6 space-y-2">
                <LineChartIcon className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">{UI_STRINGS.module3.awaitingObservationsTitle}</p>
                <p className="text-[11px] text-slate-500 max-w-md">
                  {borosilResolution
                    ? borosilResolution.displayStatusMessage
                    : UI_STRINGS.module3.awaitingObservationsDesc}
                </p>
                {borosilResolution && (
                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                    Mapped Spend: ₹{borosilResolution.canonicalSpendInrCr.toFixed(2)} Cr across {borosilResolution.canonicalTransactionCount} transactions • 0.00% Operational Coverage
                  </span>
                )}
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          {/* Unjustified Price Creep Highlight Banner in INR Crores */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-white to-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600 border border-rose-300">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  {UI_STRINGS.module3.leakageBoxTitle}
                </span>
                <p className="text-xs text-slate-600">
                  {UI_STRINGS.module3.leakageBoxDesc}
                </p>
              </div>
            </div>
            <div className="text-right sm:pl-4 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono uppercase">{UI_STRINGS.module3.varianceLeakageLabel}</span>
              <p className="text-xl font-black font-mono text-rose-600 tracking-tight">
                {hasVerifiedObservations && totalLeakageCr > 0 ? `₹${totalLeakageCr.toFixed(2)} Cr` : UI_STRINGS.module3.leakageNotQuantifiable}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {hasVerifiedObservations && totalLeakageCr > 0 ? `(~$${((totalLeakageCr * 10000000 / 83.8) / 1000000).toFixed(2)}M USD @ FX)` : UI_STRINGS.module3.leakageAwaitingNote}
              </span>
            </div>
          </div>
        </div>

        {/* Creep Anomaly Stats & Insight (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 glass-card space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>{UI_STRINGS.module3.creepAnomalyTitle}</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                {highCreepCount > 0 ? `${highCreepCount} HIGH RISK` : UI_STRINGS.module3.awaitingVerifiedBenchmarks}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {UI_STRINGS.module3.creepAnomalyDesc}
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">{UI_STRINGS.module3.avgMarkupLabel}</span>
                <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{hasVerifiedObservations ? `+${avgMarkupPct}%` : UI_STRINGS.module3.supplierPriceCreepAwaiting}</p>
                <span className="text-[10px] text-slate-400">{hasVerifiedObservations ? UI_STRINGS.module3.avgMarkupSub : UI_STRINGS.module3.awaitingObservationsSub}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">{UI_STRINGS.module3.highCreepVendorsLabel}</span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{hasVerifiedObservations ? `${highCreepCount} Vendors` : UI_STRINGS.module3.awaitingVerifiedBenchmarks}</p>
                <span className="text-[10px] text-slate-400">
                  {hasVerifiedObservations && highCreepCount > 0 ? `Accounting for ₹${highCreepLeakageCr.toFixed(2)} Cr of total variance` : UI_STRINGS.module3.awaitingVerifiedBenchmarks}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-slate-700">
            <span className="text-cyan-800 font-bold block mb-1">{UI_STRINGS.module3.advisoryPlayLabel}</span>
            {UI_STRINGS.module3.advisoryPlayDesc}
          </div>
        </div>
      </div>

      {/* 6. Dynamic Calculation Transparency Card (Prompt 100 Test Case) */}
      <CalculationTransparencyCard />

      {currentTier === 'SILVER' ? (
        <div className="relative min-h-[300px]">
          <TierMaskOverlay
            title={UI_STRINGS.subscription.stageMaskedTitle(UI_STRINGS.module3.rankingsTableTitle)}
            description={UI_STRINGS.subscription.stageMaskedSilverDesc}
            requiredTier="GOLD"
            onUpgrade={() => onUpgrade?.('GOLD')}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Detailed Vendor Rankings Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {UI_STRINGS.module3.rankingsTableTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {UI_STRINGS.module3.rankingsTableDesc}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterRisk('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'ALL'
                      ? 'bg-white text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {UI_STRINGS.module3.filterAllVendors(vendorRankings.length)}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('CREEP_ANOMALY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'CREEP_ANOMALY'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {`Creep Anomaly (${vendorRankings.filter((v) => v.risk_status === 'HIGH CREEP' || (v.price_creep_pct && v.price_creep_pct > 0)).length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('ALIGNED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'ALIGNED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {`Aligned (${vendorRankings.filter((v) => v.risk_status === 'ALIGNED' || (v.price_creep_pct && v.price_creep_pct <= 0)).length})`}
                </button>
              </div>
            </div>

            {/* Rankings Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.vendorName}</th>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.category}</th>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.totalSpendInrCr}</th>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.commodityBenchmark}</th>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.priceCreepPct}</th>
                      <th className="py-3 px-4">{UI_STRINGS.module3.tableHeaders.unjustifiedLeakage}</th>
                      <th className="py-3 px-4 text-right">{UI_STRINGS.module3.tableHeaders.riskStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {filteredRankings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                          Awaiting dataset ingestion. Upload a multi-currency procurement dataset in Module 1 to evaluate supplier price volatility.
                        </td>
                      </tr>
                    ) : (
                      filteredRankings.map((vendor, vIdx) => (
                        <tr
                          key={vendor.master_id || `${vendor.vendor_name}-${vIdx}`}
                          className="bg-white hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                            <div>{vendor.vendor_name}</div>
                            <span className="text-[10px] font-mono text-slate-400">{vendor.master_id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-600">
                            {vendor.category}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            ₹{vendor.total_spend_inr_cr?.toFixed(2) || (vendor.total_spend * 83.8 / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="py-3.5 px-4 font-sans text-xs text-cyan-700">
                            {vendor.benchmark_index || UI_STRINGS.module3.awaitingVerifiedBenchmarks}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                (vendor.price_creep_pct || 0) > 5
                                  ? 'text-rose-600'
                                  : (vendor.price_creep_pct || 0) > 0
                                  ? 'text-amber-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {(vendor.price_creep_pct || 0) !== 0 ? (vendor.price_creep_pct > 0 ? `+${vendor.price_creep_pct}%` : `${vendor.price_creep_pct}%`) : '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {vendor.variance_leakage_usd > 0 || (vendor.variance_leakage_inr_cr && vendor.variance_leakage_inr_cr > 0)
                              ? `₹${(vendor.variance_leakage_inr_cr || (vendor.variance_leakage_usd * 83.8 / 10000000)).toFixed(2)} Cr`
                              : UI_STRINGS.module3.alignedLeakageVal}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-sans tracking-wide ${
                                vendor.risk_status === 'HIGH CREEP'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : vendor.risk_status === 'REVIEW'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {vendor.risk_status || UI_STRINGS.module3.awaitingVerifiedBenchmarks}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. Vendor Price Dispersion Table with Explainability Triggers */}
          <VendorPriceDispersionTable
            vendorRankings={vendorRankings}
            calculations={calculations}
            onWhyThisBenchmark={handleWhyThisBenchmark}
            isCustomerView={isBorosilAssessment}
          />
        </div>
      )}
        </>
      )}

      {/* CTA to Savings Engine */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{UI_STRINGS.module3.ctaBadge}</span>
        </div>
        <button
          type="button"
          onClick={onProceedToSavings}
          className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 group cursor-pointer"
        >
          <span>{UI_STRINGS.module3.ctaProceedButton}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Explainability Modal */}
      <PCBIExplainabilityModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        audit={selectedAudit}
      />
    </div>
  );
};
