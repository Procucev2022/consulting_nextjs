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
    <div className="p-5 bg-white border border-[#DCE7F5] rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
            <Layers size={16} className="text-[#0284C7]" />
            {UI_STRINGS.pcbiAdmin.worksheetDetectionTitle}
          </h4>
          <p className="text-xs text-[#475569]">
            {UI_STRINGS.pcbiAdmin.worksheetDetectionSubtitle}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#DCE7F5] bg-[#F8FBFE] text-[#475569]">
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.worksheetCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.detectedAsCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.rowCountCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.confidenceCol}</th>
              <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.actionCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
            {worksheets.map((ws) => (
              <tr key={ws.sheetName} className="hover:bg-[#EEF7FF] transition-colors">
                <td className="py-2.5 px-3 font-mono font-medium text-[#0B1B33]">{ws.sheetName}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 bg-sky-50 text-[#0284C7] border border-sky-200 rounded text-[11px] font-medium">
                    {ws.purposeLabel}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium tabular-nums text-[#475569]">{ws.rowCount.toLocaleString()}</td>
                <td className="py-2.5 px-3">
                  <span className="text-emerald-600 font-bold tabular-nums">{ws.confidence}%</span>
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={ws.userOverride || ws.detectedType}
                    onChange={(e) => onOverrideWorksheet(ws.sheetName, e.target.value as PCBIWorksheetType)}
                    aria-label={`Override purpose for ${ws.sheetName}`}
                    className="bg-white border border-[#DCE7F5] text-[#0B1B33] rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
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
