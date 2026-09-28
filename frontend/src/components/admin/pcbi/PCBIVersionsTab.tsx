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
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            {showOnlyPublished
              ? UI_STRINGS.pcbiAdmin.publishedVersionsTitle
              : UI_STRINGS.pcbiAdmin.versionHistoryTitle}
          </h4>
          <p className="text-xs text-slate-400">
            {showOnlyPublished
              ? UI_STRINGS.pcbiAdmin.publishedVersionsSubtitle
              : UI_STRINGS.pcbiAdmin.versionHistorySubtitle}
          </p>
        </div>
      </div>

      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
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
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {displayedVersions.map((v) => (
              <tr key={v.id} className="hover:bg-slate-800/30">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{v.version}</span>
                    {v.status === 'PUBLISHED' && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{v.upload_id}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.status === 'PUBLISHED'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : v.status === 'VALIDATED'
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                        : v.status === 'ARCHIVED'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <p className="font-mono text-xs text-slate-200 truncate max-w-xs">{v.file_name}</p>
                  <span className="text-[10px] text-slate-400">{v.file_size_mb.toFixed(2)} MB</span>
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {v.metrics.benchmark_count.toLocaleString()}
                </td>
                <td className="py-3 px-3 font-mono text-cyan-300">
                  {v.metrics.weekly_records_count.toLocaleString()}
                </td>
                <td className="py-3 px-3 font-semibold text-slate-300">
                  {v.metrics.a_quality_count} / {v.metrics.b_quality_count} / {v.metrics.c_quality_count}
                </td>
                <td className="py-3 px-3">
                  <p className="text-slate-300">{new Date(v.upload_date).toLocaleDateString()}</p>
                  <span className="text-[10px] text-slate-400">By {v.uploaded_by}</span>
                </td>
                <td className="py-3 px-3">
                  {v.status !== 'PUBLISHED' ? (
                    <button
                      type="button"
                      onClick={() => onPublishVersion(v.version)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      <Rocket size={12} />
                      <span>Publish</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
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
