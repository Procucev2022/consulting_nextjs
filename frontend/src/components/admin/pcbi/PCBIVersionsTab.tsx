'use client';

/**
 * PCBI Version History & Published Versions Sub-Tab
 */

import React from 'react';
import {
  Layers,
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIVersionsTabProps } from '../../../types/components';

export const PCBIVersionsTab: React.FC<PCBIVersionsTabProps> = ({
  versions,
  onPublishVersion,
  showOnlyPublished = false
}) => {
  const displayedVersions = showOnlyPublished
    ? versions.filter((v) => v.status === 'PUBLISHED')
    : versions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
            <Layers size={16} className="text-[#0284C7]" />
            {showOnlyPublished
              ? UI_STRINGS.pcbiAdmin.publishedVersionsTitle
              : UI_STRINGS.pcbiAdmin.versionHistoryTitle}
          </h4>
          <p className="text-xs text-[#475569]">
            {showOnlyPublished
              ? UI_STRINGS.pcbiAdmin.publishedVersionsSubtitle
              : UI_STRINGS.pcbiAdmin.versionHistorySubtitle}
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#DCE7F5] rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#DCE7F5] text-[#475569] bg-[#F8FBFE]">
              <th className="py-2.5 px-3 font-semibold">Version</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Source File</th>
              <th className="py-2.5 px-3 font-semibold">Benchmarks</th>
              <th className="py-2.5 px-3 font-semibold">Weekly Records</th>
              <th className="py-2.5 px-3 font-semibold">Quality (A / B / C)</th>
              <th className="py-2.5 px-3 font-semibold">Uploaded</th>
              <th className="py-2.5 px-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
            {displayedVersions.map((v) => (
              <tr key={v.id} className="hover:bg-[#EEF7FF]">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0B1B33] text-sm tabular-nums">{v.version}</span>
                    {v.status === 'PUBLISHED' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">{v.upload_id}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : v.status === 'VALIDATED'
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : v.status === 'ARCHIVED'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-[#475569] border border-[#DCE7F5]'
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <p className="font-mono text-xs text-[#0B1B33] truncate max-w-xs">{v.file_name}</p>
                  <span className="text-[10px] text-[#64748B] tabular-nums">{v.file_size_mb.toFixed(2)} MB</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#0B1B33] tabular-nums">
                  {v.metrics.benchmark_count.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-[#0284C7] font-semibold tabular-nums">
                  {v.metrics.weekly_records_count.toLocaleString()}
                </td>
                <td className="py-3 px-3 font-semibold text-[#475569] tabular-nums">
                  {v.metrics.a_quality_count} / {v.metrics.b_quality_count} / {v.metrics.c_quality_count}
                </td>
                <td className="py-3 px-3">
                  <p className="text-[#0B1B33] tabular-nums">{new Date(v.upload_date).toLocaleDateString()}</p>
                  <span className="text-[10px] text-[#64748B]">By {v.uploaded_by}</span>
                </td>
                <td className="py-3 px-3">
                  {v.status !== 'PUBLISHED' ? (
                    <button
                      type="button"
                      onClick={() => onPublishVersion(v.version)}
                      className="px-3 py-1 bg-[#F97316] hover:bg-[#ea6d00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <Rocket size={12} />
                      <span>Publish</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={13} />
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
