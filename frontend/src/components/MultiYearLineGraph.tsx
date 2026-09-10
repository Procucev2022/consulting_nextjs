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
  visibleYears,
  onToggleYear,
  selectedMonthIndex,
  onSelectMonthIndex
}) => {
  const currSymbol = spendCurrency === 'INR' ? '₹' : '$';
  const currUnit = spendCurrency === 'INR' ? 'Cr' : 'M';

  // Extract month series per fiscal year (12 data points each)
  const { fy24Points, fy25Points, fy26Points, yMax } = useMemo(() => {
    let peakVal = 0;

    const mapYear = (fy: 'FY24' | 'FY25' | 'FY26'): (MonthWiseSummary | null)[] => {
      return FISCAL_MONTHS.map((mDef) => {
        const match = months.find((m) => m.fiscal_year === fy && m.month_label.startsWith(mDef.key));
        if (match) {
          const val = spendCurrency === 'INR' ? match.spend_inr_cr : match.spend_usd_m;
          if (val > peakVal) peakVal = val;
          return match;
        }
        return null;
      });
    };

    const fy24 = mapYear('FY24');
    const fy25 = mapYear('FY25');
    const fy26 = mapYear('FY26');

    // Round up yMax to a round ceiling
    const roundedMax = peakVal > 0 ? Math.ceil(peakVal / 50) * 50 : 100;

    return {
      fy24Points: fy24,
      fy25Points: fy25,
      fy26Points: fy26,
      yMax: Math.max(100, roundedMax)
    };
  }, [months, spendCurrency]);

  // SVG Coordinate Constants
  const svgWidth = 800;
  const svgHeight = 320;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (index: number): number => {
    return padLeft + (index / 11) * plotWidth;
  };

  const getY = (val: number): number => {
    return padTop + plotHeight - (val / yMax) * plotHeight;
  };

  // Y-axis tick intervals (5 ticks)
  const yTicks = [
    { value: yMax, y: getY(yMax) },
    { value: Math.round(yMax * 0.75), y: getY(yMax * 0.75) },
    { value: Math.round(yMax * 0.5), y: getY(yMax * 0.5) },
    { value: Math.round(yMax * 0.25), y: getY(yMax * 0.25) },
    { value: 0, y: getY(0) }
  ];

  // Helper to generate SVG polyline path
  const buildPath = (points: (MonthWiseSummary | null)[]): string => {
    const validCoords: { x: number; y: number }[] = [];
    points.forEach((pt, idx) => {
      if (pt) {
        const val = spendCurrency === 'INR' ? pt.spend_inr_cr : pt.spend_usd_m;
        validCoords.push({ x: getX(idx), y: getY(val) });
      }
    });
    if (validCoords.length === 0) return '';
    return validCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  };

  const selectedMonthDef = FISCAL_MONTHS[selectedMonthIndex] || FISCAL_MONTHS[0];
  const selectedFy24 = fy24Points[selectedMonthIndex];
  const selectedFy25 = fy25Points[selectedMonthIndex];
  const selectedFy26 = fy26Points[selectedMonthIndex];

  // Calculate YoY change percentages for inspection
  const fy25YoY =
    selectedFy24 && selectedFy25
      ? ((selectedFy25.spend_inr_cr - selectedFy24.spend_inr_cr) / selectedFy24.spend_inr_cr) * 100
      : null;
  const fy26YoY =
    selectedFy25 && selectedFy26
      ? ((selectedFy26.spend_inr_cr - selectedFy25.spend_inr_cr) / selectedFy25.spend_inr_cr) * 100
      : null;

  return (
    <div className="space-y-4">
      {/* Chart Header & Year Legend Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 dark:text-slate-400 font-bold">
            {UI_STRINGS.documentSummary.month.graph.fiscalYearsLabel}
          </span>
          {/* FY24 Toggle */}
          <button
            onClick={() => onToggleYear('FY24')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY24
                ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 ring-1 ring-sky-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="font-bold">{UI_STRINGS.documentSummary.month.graph.legends.fy24}</span>
          </button>

          {/* FY25 Toggle */}
          <button
            onClick={() => onToggleYear('FY25')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY25
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold">{UI_STRINGS.documentSummary.month.graph.legends.fy25}</span>
          </button>

          {/* FY26 Toggle */}
          <button
            onClick={() => onToggleYear('FY26')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
              visibleYears.FY26
                ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 ring-1 ring-purple-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="font-bold">{UI_STRINGS.documentSummary.month.graph.legends.fy26}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-sans italic">
          {UI_STRINGS.documentSummary.month.graph.clickToInspect}
        </span>
      </div>

      {/* SVG Multi-Line Graph Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="area-fy24" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="area-fy25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="area-fy26" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Amount Labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={svgWidth - padRight}
                y2={t.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={t.value === 0 ? undefined : '3 3'}
                className="dark:stroke-slate-800"
              />
              <text
                x={padLeft - 10}
                y={t.y + 4}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-400 font-semibold"
              >
                {currSymbol}{t.value} {currUnit}
              </text>
            </g>
          ))}

          {/* Y-Axis Label (Vertical) */}
          <text
            x={-padTop - plotHeight / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[10px] font-mono uppercase tracking-wider fill-slate-400 font-bold"
          >
            {UI_STRINGS.documentSummary.month.graph.yAxisLabel(`${currSymbol} ${currUnit}`)}
          </text>

          {/* X-Axis Month Labels */}
          {FISCAL_MONTHS.map((mDef) => {
            const x = getX(mDef.index);
            const isSelected = selectedMonthIndex === mDef.index;
            return (
              <g key={mDef.key}>
                <line
                  x1={x}
                  y1={padTop + plotHeight}
                  x2={x}
                  y2={padTop + plotHeight + 5}
                  stroke={isSelected ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={isSelected ? '2' : '1'}
                  className="dark:stroke-slate-700"
                />
                <text
                  x={x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold transition-all ${
                    isSelected ? 'fill-slate-900 dark:fill-white scale-110 font-black' : 'fill-slate-500'
                  }`}
                >
                  {mDef.label}
                </text>
              </g>
            );
          })}

          {/* Vertical Crosshair Guideline for Selected Month */}
          {selectedMonthIndex >= 0 && (
            <g>
              <line
                x1={getX(selectedMonthIndex)}
                y1={padTop}
                x2={getX(selectedMonthIndex)}
                y2={padTop + plotHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.75"
              />
              <rect
                x={getX(selectedMonthIndex) - 22}
                y={padTop + plotHeight + 24}
                width="44"
                height="16"
                rx="4"
                className="fill-slate-900 dark:fill-emerald-600"
              />
              <text
                x={getX(selectedMonthIndex)}
                y={padTop + plotHeight + 35}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-white"
              >
                {selectedMonthDef.label}
              </text>
            </g>
          )}

          {/* FY24 Line & Area */}
          {visibleYears.FY24 && (
            <g>
              <path
                d={buildPath(fy24Points)}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {fy24Points.map((pt, idx) => {
                if (!pt) return null;
                const val = spendCurrency === 'INR' ? pt.spend_inr_cr : pt.spend_usd_m;
                const cx = getX(idx);
                const cy = getY(val);
                const isSelected = selectedMonthIndex === idx;
                return (
                  <g key={`fy24-pt-${idx}`}>
                    {isSelected && <circle cx={cx} cy={cy} r={10} fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.5" />}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill="#0ea5e9"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* FY25 Line & Area */}
          {visibleYears.FY25 && (
            <g>
              <path
                d={buildPath(fy25Points)}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {fy25Points.map((pt, idx) => {
                if (!pt) return null;
                const val = spendCurrency === 'INR' ? pt.spend_inr_cr : pt.spend_usd_m;
                const cx = getX(idx);
                const cy = getY(val);
                const isSelected = selectedMonthIndex === idx;
                return (
                  <g key={`fy25-pt-${idx}`}>
                    {isSelected && <circle cx={cx} cy={cy} r={10} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* FY26 Line & Area */}
          {visibleYears.FY26 && (
            <g>
              <path
                d={buildPath(fy26Points)}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {fy26Points.map((pt, idx) => {
                if (!pt) return null;
                const val = spendCurrency === 'INR' ? pt.spend_inr_cr : pt.spend_usd_m;
                const cx = getX(idx);
                const cy = getY(val);
                const isSelected = selectedMonthIndex === idx;
                return (
                  <g key={`fy26-pt-${idx}`}>
                    {isSelected && <circle cx={cx} cy={cy} r={10} fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.5" />}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill="#8b5cf6"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Interactive Invisible Overlay Rects for Easy Hover & Click */}
          {FISCAL_MONTHS.map((mDef) => {
            const x = getX(mDef.index);
            const colW = plotWidth / 11;
            return (
              <rect
                key={`hit-${mDef.key}`}
                x={x - colW / 2}
                y={padTop}
                width={colW}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onSelectMonthIndex(mDef.index)}
                onClick={() => onSelectMonthIndex(mDef.index)}
              />
            );
          })}
        </svg>
      </div>

      {/* 3-Year Comparison Card for Selected Month */}
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
