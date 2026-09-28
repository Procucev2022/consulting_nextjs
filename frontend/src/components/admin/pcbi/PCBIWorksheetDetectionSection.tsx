'use client';

/**
 * PCBI Worksheet Detection Section Component
 * Displays identified worksheets, row counts, and override dropdown
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { PCBI_WORKSHEET_PURPOSE_LABELS } from '../../../constants/pcbiAdmin';
import type { PCBIWorksheetType } from '../../../types/pcbiAdmin';
import type { PCBIWorksheetDetectionSectionProps } from '../../../types/components';

export const PCBIWorksheetDetectionSection: React.FC<PCBIWorksheetDetectionSectionProps> = ({
  worksheets,
  onOverrideWorksheet
}) => {
  return (
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            {UI_STRINGS.pcbiAdmin.worksheetDetectionTitle}
          </h4>
          <p className="text-xs text-slate-400">
            {UI_STRINGS.pcbiAdmin.worksheetDetectionSubtitle}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.worksheetCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.detectedAsCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.rowCountCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.confidenceCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.actionCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {worksheets.map((ws) => (
              <tr key={ws.sheetName} className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-mono font-medium text-white">{ws.sheetName}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded text-[11px] font-medium">
                    {ws.purposeLabel}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">{ws.rowCount.toLocaleString()}</td>
                <td className="py-2.5 px-3">
                  <span className="text-emerald-400 font-bold">{ws.confidence}%</span>
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={ws.userOverride || ws.detectedType}
                    onChange={(e) => onOverrideWorksheet(ws.sheetName, e.target.value as PCBIWorksheetType)}
                    aria-label={`Override purpose for ${ws.sheetName}`}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500"
                  >
                    {Object.entries(PCBI_WORKSHEET_PURPOSE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
