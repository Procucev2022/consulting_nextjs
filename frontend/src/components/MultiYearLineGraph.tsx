'use client';
import React, { useMemo } from 'react';
import type { MultiYearLineGraphProps, MonthWiseSummary } from '../types';
import { UI_STRINGS } from '../constants/uiStrings';
import { MultiYearComparisonCard } from './MultiYearComparisonCard';

const FISCAL_MONTHS = [
  { key: 'Apr', label: 'Apr', fullName: 'April', index: 0 },
  { key: 'May', label: 'May', fullName: 'May', index: 1 },
  { key: 'Jun', label: 'Jun', fullName: 'June', index: 2 },
  { key: 'Jul', label: 'Jul', fullName: 'July', index: 3 },
  { key: 'Aug', label: 'Aug', fullName: 'August', index: 4 },
  { key: 'Sep', label: 'Sep', fullName: 'September', index: 5 },
  { key: 'Oct', label: 'Oct', fullName: 'October', index: 6 },
  { key: 'Nov', label: 'Nov', fullName: 'November', index: 7 },
  { key: 'Dec', label: 'Dec', fullName: 'December', index: 8 },
  { key: 'Jan', label: 'Jan', fullName: 'January', index: 9 },
  { key: 'Feb', label: 'Feb', fullName: 'February', index: 10 },
  { key: 'Mar', label: 'Mar', fullName: 'March', index: 11 }
];

export const MultiYearLineGraph: React.FC<MultiYearLineGraphProps> = ({
  months,
  spendCurrency,
  visibleYears = { FY24: true, FY25: true, FY26: true },
  onToggleYear,
  selectedMonthIndex = 0,
  onSelectMonthIndex,
  periodMetadata
}) => {
  const currSymbol = spendCurrency === 'INR' ? '₹' : '$';
  const currUnit = spendCurrency === 'INR' ? 'Cr' : 'M';

  // Determine whether this dataset genuinely supports multi-year comparison
  const hasMultiYearComparison = Boolean(
    periodMetadata?.hasMultiYearComparison ?? (new Set(months.map((m) => m.fiscal_year)).size >= 2)
  );

  // SVG Coordinate Constants
  const svgWidth = 800;
  const svgHeight = 320;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Single-Year Actual Spend Trend Points
  const actualPoints = useMemo(() => {
    return [...months].sort((a, b) => a.month_key.localeCompare(b.month_key));
  }, [months]);

  const actualYMax = useMemo(() => {
    let peakVal = 0;
    actualPoints.forEach((m) => {
      const val = spendCurrency === 'INR' ? m.spend_inr_cr : (m.spend_usd_m ?? 0);
      if (val > peakVal) peakVal = val;
    });
    return Math.max(100, Math.ceil(peakVal / 50) * 50);
  }, [actualPoints, spendCurrency]);

  const getActualX = (idx: number): number => {
    const total = Math.max(1, actualPoints.length - 1);
    return padLeft + (idx / total) * plotWidth;
  };

  const getActualY = (val: number): number => {
    return padTop + plotHeight - (val / actualYMax) * plotHeight;
  };

  const buildActualPath = (pts: MonthWiseSummary[]): string => {
    if (pts.length === 0) return '';
    return pts
      .map((pt, i) => {
        const val = spendCurrency === 'INR' ? pt.spend_inr_cr : (pt.spend_usd_m ?? 0);
        return `${i === 0 ? 'M' : 'L'} ${getActualX(i).toFixed(1)} ${getActualY(val).toFixed(1)}`;
      })
      .join(' ');
  };

  const buildActualAreaPath = (pts: MonthWiseSummary[]): string => {
    if (pts.length === 0) return '';
    const firstX = getActualX(0).toFixed(1);
    const lastX = getActualX(pts.length - 1).toFixed(1);
    const bottomY = (padTop + plotHeight).toFixed(1);
    const lineParts = pts
      .map((pt, i) => {
        const val = spendCurrency === 'INR' ? pt.spend_inr_cr : (pt.spend_usd_m ?? 0);
        return `${i === 0 ? 'M' : 'L'} ${getActualX(i).toFixed(1)} ${getActualY(val).toFixed(1)}`;
      })
      .join(' ');
    return `${lineParts} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Multi-Year Series Calculation (only used when multi-year data genuinely exists)
  const { fy24Points, fy25Points, fy26Points, multiYMax } = useMemo(() => {
    let peakVal = 0;

    const mapYear = (fy: string): (MonthWiseSummary | null)[] => {
      return FISCAL_MONTHS.map((mDef) => {
        const match = months.find((m) => m.fiscal_year === fy && m.month_label.startsWith(mDef.key));
        if (match) {
          const val = spendCurrency === 'INR' ? match.spend_inr_cr : (match.spend_usd_m ?? 0);
          if (val > peakVal) peakVal = val;
          return match;
        }
        return null;
      });
    };

    const fy24 = mapYear('FY24');
    const fy25 = mapYear('FY25');
    const fy26 = mapYear('FY26');
    const roundedMax = peakVal > 0 ? Math.ceil(peakVal / 50) * 50 : 100;

    return {
      fy24Points: fy24,
      fy25Points: fy25,
      fy26Points: fy26,
      multiYMax: Math.max(100, roundedMax)
    };
  }, [months, spendCurrency]);

  const getMultiX = (index: number): number => {
    return padLeft + (index / 11) * plotWidth;
  };

  const getMultiY = (val: number): number => {
    return padTop + plotHeight - (val / multiYMax) * plotHeight;
  };

  const buildMultiPath = (points: (MonthWiseSummary | null)[]): string => {
    const validCoords: { x: number; y: number }[] = [];
    points.forEach((pt, idx) => {
      if (pt) {
        const val = spendCurrency === 'INR' ? pt.spend_inr_cr : (pt.spend_usd_m ?? 0);
        validCoords.push({ x: getMultiX(idx), y: getMultiY(val) });
      }
    });
    if (validCoords.length === 0) return '';
    return validCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  };

  // If no months are loaded, render an explicit empty state
  if (months.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 font-sans text-xs">
        {UI_STRINGS.documentSummary.month.graph.noData}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE A: SINGLE-YEAR ACTUAL SPEND TREND (VGT 10-MONTH CASE)
  // -------------------------------------------------------------
  if (!hasMultiYearComparison) {
    const safeIndex = Math.min(Math.max(0, selectedMonthIndex), actualPoints.length - 1);
    const selectedMonth = actualPoints[safeIndex] || actualPoints[0];

    const actualYTicks = [
      { value: actualYMax, y: getActualY(actualYMax) },
      { value: Math.round(actualYMax * 0.75), y: getActualY(actualYMax * 0.75) },
      { value: Math.round(actualYMax * 0.5), y: getActualY(actualYMax * 0.5) },
      { value: Math.round(actualYMax * 0.25), y: getActualY(actualYMax * 0.25) },
      { value: 0, y: getActualY(0) }
    ];

    return (
      <div className="space-y-4">
        {/* Header Legend & Verified Coverage Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-900 ring-1 ring-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>{UI_STRINGS.documentSummary.month.graph.legends.actualTrend}</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-700 font-semibold">
              {periodMetadata?.fiscalMonthCoverage || 'FY22 | 10 of 12 months available'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {UI_STRINGS.documentSummary.month.actualCoverageLabel(
              periodMetadata
                ? `${periodMetadata.minTransactionDate.slice(0, 3)} ${periodMetadata.minTransactionDate.slice(-4)} – ${periodMetadata.maxTransactionDate.slice(0, 3)} ${periodMetadata.maxTransactionDate.slice(-4)}`
                : 'Apr 2021 – Jan 2022',
              actualPoints.length
            )}
          </span>
        </div>

        {/* SVG Plot Canvas */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[650px] select-none">
            <defs>
              <linearGradient id="area-actual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines & Y-Axis Labels */}
            {actualYTicks.map((tick, i) => (
              <g key={`actual-ytick-${i}`}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={padLeft + plotWidth}
                  y2={tick.y}
                  stroke="#e2e8f0"
                  strokeDasharray={i === actualYTicks.length - 1 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono font-medium fill-slate-400"
                >
                  {tick.value}
                </text>
              </g>
            ))}

            {/* Y-Axis Title */}
            <text
              x={14}
              y={padTop + plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${padTop + plotHeight / 2})`}
              className="text-[10px] font-mono font-bold fill-slate-500 uppercase tracking-wider"
            >
              {UI_STRINGS.documentSummary.month.graph.yAxisLabel(currUnit)}
            </text>

            {/* X-Axis Month Ticks & Labels */}
            {actualPoints.map((m, idx) => {
              const x = getActualX(idx);
              const isSelected = safeIndex === idx;
              return (
                <g key={`actual-xtick-${m.month_key}`}>
                  <line x1={x} y1={padTop + plotHeight} x2={x} y2={padTop + plotHeight + 6} stroke="#cbd5e1" strokeWidth="1" />
                  <text
                    x={x}
                    y={padTop + plotHeight + 20}
                    textAnchor="middle"
                    className={`text-[10px] font-mono cursor-pointer transition-all ${
                      isSelected ? 'fill-slate-900 scale-110 font-black' : 'fill-slate-500 font-medium'
                    }`}
                  >
                    {m.month_label.split(' ')[0]}
                  </text>
                  <text
                    x={x}
                    y={padTop + plotHeight + 32}
                    textAnchor="middle"
                    className="text-[8px] font-mono fill-slate-400"
                  >
                    {m.month_label.split(' ')[1] || m.fiscal_year}
                  </text>
                </g>
              );
            })}

            {/* Vertical Guideline for Selected Month */}
            {safeIndex >= 0 && (
              <g>
                <line
                  x1={getActualX(safeIndex)}
                  y1={padTop}
                  x2={getActualX(safeIndex)}
                  y2={padTop + plotHeight}
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <rect
                  x={getActualX(safeIndex) - 24}
                  y={padTop - 20}
                  width="48"
                  height="16"
                  rx="4"
                  className="fill-slate-900"
                />
                <text
                  x={getActualX(safeIndex)}
                  y={padTop - 8}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold fill-white"
                >
                  {selectedMonth ? selectedMonth.month_label.split(' ')[0] : ''}
                </text>
              </g>
            )}

            {/* Area Fill Under Actual Spend Line */}
            <path d={buildActualAreaPath(actualPoints)} fill="url(#area-actual)" />

            {/* Actual Spend Line */}
            <path
              d={buildActualPath(actualPoints)}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points on Actual Spend Line */}
            {actualPoints.map((pt, idx) => {
              const val = spendCurrency === 'INR' ? pt.spend_inr_cr : (pt.spend_usd_m ?? 0);
              const cx = getActualX(idx);
              const cy = getActualY(val);
              const isSelected = safeIndex === idx;
              return (
                <g key={`actual-pt-${pt.month_key}`}>
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={11} fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.4" />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4.5}
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-transform"
                    onClick={() => onSelectMonthIndex?.(idx)}
                  />
                </g>
              );
            })}

            {/* Interactive Hit Areas */}
            {actualPoints.map((m, idx) => {
              const x = getActualX(idx);
              const colW = plotWidth / Math.max(1, actualPoints.length - 1);
              return (
                <rect
                  key={`hit-actual-${m.month_key}`}
                  x={x - colW / 2}
                  y={padTop}
                  width={colW}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => onSelectMonthIndex?.(idx)}
                  onClick={() => onSelectMonthIndex?.(idx)}
                />
              );
            })}
          </svg>
        </div>

        {/* Selected Month Detail Card (Zero false YoY comparison) */}
        {selectedMonth && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                  {selectedMonth.fiscal_year}
                </span>
                <h5 className="text-sm font-black text-slate-900">
                  {selectedMonth.month_label}
                </h5>
              </div>
              <p className="text-[11px] text-slate-500">
                Top Category: <span className="font-bold text-slate-700">{selectedMonth.top_material_group}</span> | Facility: <span className="font-bold text-slate-700">{selectedMonth.top_plant}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Validated Spend</span>
                <span className="text-base font-black text-emerald-700">
                  {currSymbol}{(spendCurrency === 'INR' ? selectedMonth.spend_inr_cr : (selectedMonth.spend_usd_m ?? 0)).toFixed(2)} {currUnit}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Line Items</span>
                <span className="text-sm font-black text-cyan-700">
                  {(selectedMonth.records_count ?? selectedMonth.po_count ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Active Vendors</span>
                <span className="text-sm font-black text-indigo-700">
                  {(selectedMonth.unique_vendors_count ?? selectedMonth.vendors_count ?? 1).toLocaleString()}
                </span>
              </div>
              {selectedMonth.mom_change_pct !== undefined && selectedMonth.mom_change_pct !== 0 && (
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">MoM Shift</span>
                  <span
                    className={`text-sm font-black ${
                      selectedMonth.mom_change_pct > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedMonth.mom_change_pct > 0
                      ? `+${selectedMonth.mom_change_pct.toFixed(1)}%`
                      : `${selectedMonth.mom_change_pct.toFixed(1)}%`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE B: MULTI-YEAR COMPARISON GRAPH (ONLY IF 2+ FYs EXIST)
  // -------------------------------------------------------------
  const selectedMonthDef = FISCAL_MONTHS[selectedMonthIndex] || FISCAL_MONTHS[0];
  const selectedFy24 = fy24Points[selectedMonthIndex];
  const selectedFy25 = fy25Points[selectedMonthIndex];
  const selectedFy26 = fy26Points[selectedMonthIndex];

  const fy25YoY =
    selectedFy24 && selectedFy25
      ? ((selectedFy25.spend_inr_cr - selectedFy24.spend_inr_cr) / selectedFy24.spend_inr_cr) * 100
      : null;
  const fy26YoY =
    selectedFy25 && selectedFy26
      ? ((selectedFy26.spend_inr_cr - selectedFy25.spend_inr_cr) / selectedFy25.spend_inr_cr) * 100
      : null;

  const multiYTicks = [
    { value: multiYMax, y: getMultiY(multiYMax) },
    { value: Math.round(multiYMax * 0.75), y: getMultiY(multiYMax * 0.75) },
    { value: Math.round(multiYMax * 0.5), y: getMultiY(multiYMax * 0.5) },
    { value: Math.round(multiYMax * 0.25), y: getMultiY(multiYMax * 0.25) },
    { value: 0, y: getMultiY(0) }
  ];

  return (
    <div className="space-y-4">
      {/* Chart Header & Year Legend Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 font-bold">
            {UI_STRINGS.documentSummary.month.graph.fiscalYearsLabel}
          </span>
          <button
            onClick={() => onToggleYear?.('FY24')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY24
                ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-400 font-bold'
                : 'bg-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>{UI_STRINGS.documentSummary.month.graph.legends.fy24}</span>
          </button>
          <button
            onClick={() => onToggleYear?.('FY25')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY25
                ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400 font-bold'
                : 'bg-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{UI_STRINGS.documentSummary.month.graph.legends.fy25}</span>
          </button>
          <button
            onClick={() => onToggleYear?.('FY26')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY26
                ? 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-400 font-bold'
                : 'bg-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>{UI_STRINGS.documentSummary.month.graph.legends.fy26}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-sans italic">
          {UI_STRINGS.documentSummary.month.graph.clickToInspect}
        </span>
      </div>

      {/* SVG Canvas for Multi-Year Line Graph */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[650px] select-none">
          {multiYTicks.map((tick, i) => (
            <g key={`multi-ytick-${i}`}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={padLeft + plotWidth}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray={i === multiYTicks.length - 1 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text x={padLeft - 10} y={tick.y + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
                {tick.value}
              </text>
            </g>
          ))}

          {FISCAL_MONTHS.map((mDef) => {
            const x = getMultiX(mDef.index);
            const isSelected = selectedMonthIndex === mDef.index;
            return (
              <g key={`multi-xtick-${mDef.key}`}>
                <line x1={x} y1={padTop + plotHeight} x2={x} y2={padTop + plotHeight + 6} stroke="#cbd5e1" strokeWidth="1" />
                <text
                  x={x}
                  y={padTop + plotHeight + 20}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${isSelected ? 'fill-slate-900 font-black' : 'fill-slate-500'}`}
                >
                  {mDef.label}
                </text>
              </g>
            );
          })}

          {visibleYears.FY24 && (
            <path d={buildMultiPath(fy24Points)} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
          )}
          {visibleYears.FY25 && (
            <path d={buildMultiPath(fy25Points)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          )}
          {visibleYears.FY26 && (
            <path d={buildMultiPath(fy26Points)} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* Interactive Hit Areas for Multi-Year */}
          {FISCAL_MONTHS.map((mDef) => {
            const x = getMultiX(mDef.index);
            const colW = plotWidth / 11;
            return (
              <rect
                key={`hit-multi-${mDef.key}`}
                x={x - colW / 2}
                y={padTop}
                width={colW}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onSelectMonthIndex?.(mDef.index)}
                onClick={() => onSelectMonthIndex?.(mDef.index)}
              />
            );
          })}
        </svg>
      </div>

      {/* Multi-Year Comparison Card */}
      <MultiYearComparisonCard
        selectedMonthDef={selectedMonthDef}
        selectedFy24={selectedFy24}
        selectedFy25={selectedFy25}
        selectedFy26={selectedFy26}
        fy25YoY={fy25YoY}
        fy26YoY={fy26YoY}
        spendCurrency={spendCurrency}
      />
    </div>
  );
};
