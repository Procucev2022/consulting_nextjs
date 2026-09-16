'use client';
import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import type { Module3TrendAnalyticsProps } from '../types';
import { TierMaskOverlay } from './TierMaskOverlay';
import {
  UI_STRINGS,
  TIMELINE_MONTHS,
  MARKET_INDEX_DATA,
  VENDOR_INVOICED_DATA
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
  onUpgrade
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>(UI_STRINGS.module3.commodities.icis);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const isDark = theme === 'dark';

  const chartData = {
    labels: TIMELINE_MONTHS as unknown as string[],
    datasets: [
      {
        label: UI_STRINGS.module3.invoicedDatasetLabel,
        data: VENDOR_INVOICED_DATA as unknown as number[],
        borderColor: '#e11d48', // Rose-600
        backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(225, 29, 72, 0.08)',
        borderWidth: 3,
        pointBackgroundColor: '#e11d48',
        pointRadius: 4,
        tension: 0.35,
        fill: '+1'
      },
      {
        label: UI_STRINGS.module3.marketDatasetLabel,
        data: MARKET_INDEX_DATA as unknown as number[],
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

  const filteredRankings = vendorRankings.filter((v) => {
    if (filterRisk === 'ALL') return true;
    if (filterRisk === 'CREEP_ANOMALY') return v.price_creep_pct > 5;
    return v.risk_status === filterRisk;
  });

  const handleUpgradeSilver = () => {
    onUpgrade?.('SILVER');
  };

  const handleUpgradeGold = () => {
    onUpgrade?.('GOLD');
  };

  if (currentTier === 'BRONZE') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <TierMaskOverlay
          requiredTier="SILVER"
          title={UI_STRINGS.subscription.stageMaskedTitle(UI_STRINGS.module3.heading)}
          description={UI_STRINGS.subscription.stageMaskedBronzeDesc}
          onUpgrade={handleUpgradeSilver}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-rose-950/30 border border-rose-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-rose-800 dark:text-cyan-400 bg-rose-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-rose-300 dark:border-cyan-800">
              {UI_STRINGS.module3.badge}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
              {UI_STRINGS.module3.valuationBadge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module3.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module3.description}
          </p>
        </div>

        {/* Commodity Benchmark Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module3.benchmarkLabel}</span>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-cyan-700 dark:text-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value={UI_STRINGS.module3.commodities.icis}>{UI_STRINGS.module3.commodities.icis}</option>
            <option value={UI_STRINGS.module3.commodities.lme}>{UI_STRINGS.module3.commodities.lme}</option>
            <option value={UI_STRINGS.module3.commodities.cass}>{UI_STRINGS.module3.commodities.cassIndex}</option>
            <option value={UI_STRINGS.module3.commodities.fastmarkets}>{UI_STRINGS.module3.commodities.fastmarkets}</option>
          </select>
        </div>
      </div>

      {/* Grid: 36-Month Dynamic Trend Chart + Price Creep Leakage Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <LineChartIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>{UI_STRINGS.module3.chartHeading}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {UI_STRINGS.module3.chartSubheading}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-cyan-700 dark:text-cyan-400 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.module3.chartMarketLabel}</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.module3.chartInvoicedLabel}</span>
              </span>
            </div>
          </div>

          {/* Dynamic Chart Container */}
          <div className="h-72 w-full pt-2">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Unjustified Price Creep Highlight Banner in INR Crores */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-white to-rose-50 dark:from-rose-950/70 dark:via-slate-950 dark:to-rose-950/70 border border-rose-200 dark:border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  {UI_STRINGS.module3.leakageBoxTitle}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {UI_STRINGS.module3.leakageBoxDesc}
                </p>
              </div>
            </div>
            <div className="text-right sm:pl-4 shrink-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">{UI_STRINGS.module3.varianceLeakageLabel}</span>
              <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                {UI_STRINGS.module3.leakageAmountVal}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">{UI_STRINGS.module3.leakageUsdNote}</span>
            </div>
          </div>
        </div>

        {/* Creep Anomaly Stats & Insight (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{UI_STRINGS.module3.creepAnomalyTitle}</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800/60">
                {UI_STRINGS.module3.creepAnomalyBadge}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {UI_STRINGS.module3.creepAnomalyDesc}
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module3.avgMarkupLabel}</span>
                <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{UI_STRINGS.module3.avgMarkupVal}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{UI_STRINGS.module3.avgMarkupSub}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module3.highCreepVendorsLabel}</span>
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{UI_STRINGS.module3.highCreepVendorsVal}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{UI_STRINGS.module3.highCreepVendorsSub}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-cyan-800 dark:text-cyan-400 font-bold block mb-1">{UI_STRINGS.module3.advisoryPlayLabel}</span>
            {UI_STRINGS.module3.advisoryPlayDesc}
          </div>
        </div>
      </div>

      {/* Silver Customer Detail Mask */}
      {currentTier === 'SILVER' ? (
        <div className="space-y-6">
          <TierMaskOverlay
            requiredTier="GOLD"
            title={UI_STRINGS.subscription.stageMaskedTitle(UI_STRINGS.module3.rankingsTableTitle)}
            description={UI_STRINGS.subscription.stageMaskedSilverDesc}
            onUpgrade={handleUpgradeGold}
            isSummaryVisible
          />
          {/* CTA to Savings Engine */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
      ) : (
        /* Vendor Price Volatility & Inflation Rankings Table */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module3.rankingsTableTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.module3.rankingsTableDesc}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterRisk('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRisk === 'ALL'
                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {UI_STRINGS.module3.filterAllVendors(vendorRankings.length)}
            </button>
            <button
              onClick={() => setFilterRisk('CREEP_ANOMALY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRisk === 'CREEP_ANOMALY'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {UI_STRINGS.module3.filterCreepAnomaly}
            </button>
            <button
              onClick={() => setFilterRisk('ALIGNED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRisk === 'ALIGNED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {UI_STRINGS.module3.filterAligned}
            </button>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredRankings.map((vendor) => (
                  <tr
                    key={vendor.master_id}
                    className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      <div>{vendor.vendor_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{vendor.master_id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                      {vendor.category}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      ₹{vendor.total_spend_inr_cr?.toFixed(2) || (vendor.total_spend * 83.8 / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs text-cyan-700 dark:text-cyan-400">
                      {vendor.benchmark_index}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          vendor.price_creep_pct > 5
                            ? 'text-rose-600 dark:text-rose-400'
                            : vendor.price_creep_pct > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {vendor.price_creep_pct > 0 ? `+${vendor.price_creep_pct}%` : `${vendor.price_creep_pct}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {vendor.variance_leakage_usd > 0
                        ? `₹${(vendor.variance_leakage_inr_cr || (vendor.variance_leakage_usd * 83.8 / 10000000)).toFixed(2)} Cr`
                        : UI_STRINGS.module3.alignedLeakageVal}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-sans tracking-wide ${
                          vendor.risk_status === 'HIGH CREEP'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60'
                            : vendor.risk_status === 'REVIEW'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                        }`}
                      >
                        {vendor.risk_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA to Savings Engine */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{UI_STRINGS.module3.ctaBadge}</span>
          </div>
          <button
            onClick={onProceedToSavings}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 group cursor-pointer"
          >
            <span>{UI_STRINGS.module3.ctaProceedButton}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
