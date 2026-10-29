'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  LineChart as LineChartIcon,
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { Module3TrendAnalyticsProps } from '../types';
import { TierMaskOverlay } from './TierMaskOverlay';
import { apiClient } from '../utils/api';
import { pcbiBenchmarkResponseSchema, pcbiWeeklyIndexResponseSchema } from '../constants/validation';
import { MODULE3_HIGH_CREEP_THRESHOLD_PERCENT, MODULE3_PCBI_INDEX_HISTORY_LIMIT, UI_STRINGS } from '../constants';
import type { PcbiBenchmarkResponse, PcbiWeeklyIndexResponse } from '../types/validation';
import frontendLogger from '../utils/logger';
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
  assessmentId
}) => {
  const [benchmarks, setBenchmarks] = useState<PcbiBenchmarkResponse>([]);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
  const [weeklyIndices, setWeeklyIndices] = useState<PcbiWeeklyIndexResponse>([]);
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = useState(true);
  const [isLoadingIndices, setIsLoadingIndices] = useState(false);
  const [benchmarkLoadError, setBenchmarkLoadError] = useState(false);
  const [indexLoadError, setIndexLoadError] = useState(false);
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'CREEP_ANOMALY' | 'ALIGNED'>('ALL');

  useEffect(() => {
    let isMounted = true;
    setIsLoadingBenchmarks(true);
    setBenchmarkLoadError(false);
    apiClient.getPCBIMasterBenchmarks()
      .then((response) => {
        if (!isMounted) return;
        const records = pcbiBenchmarkResponseSchema.parse(response.data);
        setBenchmarks(records);
        setSelectedBenchmarkId((current) =>
          records.some((record) => record.pcbi_id === current) ? current : records[0]?.pcbi_id || ''
        );
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        frontendLogger.error('Could not load PCBI benchmarks from D1', { assessmentId, error });
        setBenchmarks([]);
        setSelectedBenchmarkId('');
        setBenchmarkLoadError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBenchmarks(false);
      });

    return () => { isMounted = false; };
  }, [assessmentId]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedBenchmarkId) {
      setWeeklyIndices([]);
      setIndexLoadError(false);
      setIsLoadingIndices(false);
      return () => { isMounted = false; };
    }

    setIsLoadingIndices(true);
    setIndexLoadError(false);
    apiClient.getPCBIWeeklyIndices(selectedBenchmarkId, MODULE3_PCBI_INDEX_HISTORY_LIMIT)
      .then((response) => {
        if (!isMounted) return;
        const records = pcbiWeeklyIndexResponseSchema.parse(response.data);
        setWeeklyIndices([...records].sort((left, right) => left.week_start.localeCompare(right.week_start)));
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        frontendLogger.error('Could not load PCBI weekly history from D1', {
          assessmentId,
          pcbiId: selectedBenchmarkId,
          error
        });
        setWeeklyIndices([]);
        setIndexLoadError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingIndices(false);
      });

    return () => { isMounted = false; };
  }, [assessmentId, selectedBenchmarkId]);

  const totalLeakageCr = vendorRankings.reduce(
    (sum, v) => sum + (v.variance_leakage_inr_cr || 0),
    0
  );
  const highCreepVendors = vendorRankings.filter((v) =>
    v.risk_status === 'HIGH CREEP' || (v.price_creep_pct ?? 0) > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT
  );
  const creepAnomalyCount = vendorRankings.filter((v) =>
    v.risk_status === 'HIGH CREEP' || v.risk_status === 'REVIEW' ||
    (v.price_creep_pct ?? 0) > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT
  ).length;
  const highCreepCount = highCreepVendors.length;
  const highCreepLeakageCr = highCreepVendors.reduce(
    (sum, v) => sum + (v.variance_leakage_inr_cr || 0),
    0
  );
  const avgMarkupPct = vendorRankings.length > 0
    ? (vendorRankings.reduce((sum, v) => sum + (v.price_creep_pct || 0), 0) / vendorRankings.length).toFixed(1)
    : null;

  const isDark = theme === 'dark';

  const selectedBenchmark = benchmarks.find((benchmark) => benchmark.pcbi_id === selectedBenchmarkId);
  const firstIndex = weeklyIndices[0]?.index_value;
  const latestIndex = weeklyIndices[weeklyIndices.length - 1]?.index_value;
  const indexChange = firstIndex && latestIndex !== undefined
    ? `${latestIndex >= firstIndex ? '+' : ''}${(((latestIndex - firstIndex) / firstIndex) * 100).toFixed(1)}%`
    : UI_STRINGS.module3.noIndexHistory;

  const chartData = {
    labels: weeklyIndices.map((record) => record.week_start),
    datasets: [
      {
        label: selectedBenchmark?.benchmark_name || UI_STRINGS.module3.benchmarkLabel,
        data: weeklyIndices.map((record) => record.index_value),
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
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y} ${selectedBenchmark?.benchmark_unit || ''}`
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
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.18)'
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: (value: any) => `${value} ${selectedBenchmark?.benchmark_unit || ''}`
        }
      }
    }
  };

  const filteredRankings = vendorRankings.filter((v) => {
    if (filterRisk === 'CREEP_ANOMALY') {
      return v.risk_status === 'HIGH CREEP' || v.risk_status === 'REVIEW' ||
        (v.price_creep_pct != null && v.price_creep_pct > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT);
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

        {/* Reference benchmark is selected from D1 records. */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-xs text-slate-500">{UI_STRINGS.module3.benchmarkLabel}</span>
          <select
            value={selectedBenchmarkId}
            onChange={(e) => setSelectedBenchmarkId(e.target.value)}
            className="bg-transparent text-xs font-bold text-cyan-700 focus:outline-none cursor-pointer"
            disabled={isLoadingBenchmarks || benchmarks.length === 0}
          >
            {isLoadingBenchmarks ? (
              <option value="">{UI_STRINGS.module3.benchmarkLoading}</option>
            ) : benchmarks.length === 0 ? (
              <option value="">{benchmarkLoadError ? UI_STRINGS.module3.benchmarkLoadFailed : UI_STRINGS.module3.noBenchmarks}</option>
            ) : benchmarks.map((benchmark) => (
              <option key={benchmark.pcbi_id} value={benchmark.pcbi_id}>{benchmark.benchmark_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        {UI_STRINGS.module3.assessmentSummaryUnavailable}
      </div>

      {/* D1 reference series and assessment supplier rankings are displayed independently. */}
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
                <span>{UI_STRINGS.module3.indexChangeLabel(indexChange)}</span>
              </span>
            </div>
          </div>

          {/* Dynamic Chart Container */}
          <div className="h-72 w-full pt-2">
            {isLoadingBenchmarks || isLoadingIndices ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                {UI_STRINGS.module3.benchmarkLoading}
              </div>
            ) : benchmarkLoadError ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-rose-700">
                {UI_STRINGS.module3.benchmarkLoadFailed}
              </div>
            ) : indexLoadError ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-rose-700">
                {UI_STRINGS.module3.indexLoadFailed}
              </div>
            ) : benchmarks.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                {UI_STRINGS.module3.noBenchmarks}
              </div>
            ) : weeklyIndices.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center p-6 space-y-2">
                <LineChartIcon className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">{UI_STRINGS.module3.noIndexHistory}</p>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

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
              <p className="text-2xl font-black font-mono text-rose-600 tracking-tight">
                {vendorRankings.length > 0 ? `₹${totalLeakageCr.toFixed(2)} Cr` : UI_STRINGS.module3.unavailableMetric}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {vendorRankings.length === 0
                  ? UI_STRINGS.module3.noVendorRankings
                  : totalLeakageCr > 0 ? UI_STRINGS.module3.leakageValueSource : UI_STRINGS.module3.alignedLeakageVal}
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
              <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                {UI_STRINGS.module3.creepAnomalyBadge(MODULE3_HIGH_CREEP_THRESHOLD_PERCENT)}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {UI_STRINGS.module3.creepAnomalyDesc}
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">{UI_STRINGS.module3.avgMarkupLabel}</span>
                <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                  {avgMarkupPct === null ? UI_STRINGS.module3.unavailableMetric : `${Number(avgMarkupPct) > 0 ? '+' : ''}${avgMarkupPct}%`}
                </p>
                <span className="text-[10px] text-slate-400">{UI_STRINGS.module3.avgMarkupSub}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">{UI_STRINGS.module3.highCreepVendorsLabel}</span>
                <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                  {vendorRankings.length === 0 ? UI_STRINGS.module3.unavailableMetric : UI_STRINGS.module3.highCreepVendorCount(highCreepCount)}
                </p>
                <span className="text-[10px] text-slate-400">
                  {vendorRankings.length === 0 ? UI_STRINGS.module3.noVendorRankings : UI_STRINGS.module3.highCreepLeakage(highCreepLeakageCr)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

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
                  {UI_STRINGS.module3.filterCreepAnomaly(creepAnomalyCount)}
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
                  {UI_STRINGS.module3.filterAligned(vendorRankings.filter((v) => v.risk_status === 'ALIGNED' || (v.price_creep_pct != null && v.price_creep_pct <= 0)).length)}
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
                          {UI_STRINGS.module3.noVendorRankings}
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
                            {vendor.total_spend_inr_cr != null
                              ? `₹${vendor.total_spend_inr_cr.toFixed(2)} Cr`
                              : UI_STRINGS.module3.unavailableMetric}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-xs text-cyan-700">
                            {vendor.benchmark_index || UI_STRINGS.module3.unavailableMetric}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                (vendor.price_creep_pct ?? 0) > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT
                                  ? 'text-rose-600'
                                  : vendor.price_creep_pct > 0
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {vendor.price_creep_pct == null
                                ? UI_STRINGS.module3.unavailableMetric
                                : `${vendor.price_creep_pct > 0 ? '+' : ''}${vendor.price_creep_pct}%`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">
                            {(vendor.variance_leakage_inr_cr ?? 0) > 0
                              ? `₹${vendor.variance_leakage_inr_cr?.toFixed(2)} Cr`
                              : vendor.variance_leakage_inr_cr == null
                                ? UI_STRINGS.module3.unavailableMetric
                                : UI_STRINGS.module3.alignedLeakageVal}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-sans tracking-wide ${
                                vendor.risk_status === 'HIGH CREEP'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : vendor.risk_status === 'REVIEW'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {vendor.risk_status || UI_STRINGS.module3.unavailableMetric}
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

        </div>
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

    </div>
  );
};
