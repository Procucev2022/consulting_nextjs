'use client';

/**
 * Enterprise PCBI Source Library View Component (Part I)
 * Searchable repository distinguishing Source Data, Standardized Data, and Active PCBI Series.
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Building2,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { PCBIStatusBadge } from './PCBIStatusBadge';
import type { PCBISourceLibraryViewProps } from '../../../types/pcbiDataLibraryComponents';
import type { CommoditySourceEvidenceObject } from '../../../types/pcbiCommodityDataLab';

export const PCBISourceLibraryView: React.FC<PCBISourceLibraryViewProps> = ({
  sources,
  queue,
  onOpenWorkspace,
  onSelectCommodityUpload
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SOURCE_DATA' | 'STANDARDIZED_DATA' | 'ACTIVE_SERIES'>('ALL');
  const [publisherFilter, setPublisherFilter] = useState<string>('ALL');

  const filteredSources = sources.filter((src: CommoditySourceEvidenceObject) => {
    const matchesSearch =
      searchTerm === '' ||
      src.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.sourceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPublisher = publisherFilter === 'ALL' || src.publisher === publisherFilter;
    return matchesSearch && matchesPublisher;
  });

  const uniquePublishers = Array.from(new Set(sources.map((s) => s.publisher)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search and Category Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-teal-950/80 text-teal-400 border border-teal-800/60 px-2.5 py-0.5 rounded">
                PCBI DATA LIBRARY — SOURCE REGISTRY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {sources.length} Evidence Sources Across {queue.length} Commodities
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Searchable Commodity Source Repository
            </h3>
          </div>

          {onSelectCommodityUpload && (
            <button
              type="button"
              onClick={() => onSelectCommodityUpload(queue[0]?.commodityId || 'COM-MET-FMO')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all shrink-0"
            >
              <UploadCloud size={15} />
              <span>Upload Commodity PCBI Source Data</span>
            </button>
          )}
        </div>

        {/* 3 Domain Categorization Tabs (Part I) */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-bold overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Library Objects' },
            { key: 'SOURCE_DATA', label: '1. Source Data (Raw Publications)' },
            { key: 'STANDARDIZED_DATA', label: '2. Standardized Data (Normalized)' },
            { key: 'ACTIVE_SERIES', label: '3. Active PCBI Series (Production)' }
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === cat.key
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Publisher Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search source by ID, publisher, document name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-medium focus:border-cyan-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={publisherFilter}
              onChange={(e) => setPublisherFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cyan-500 focus:outline-hidden"
            >
              <option value="ALL">All Publishers ({uniquePublishers.length})</option>
              {uniquePublishers.map((pub) => (
                <option key={pub} value={pub}>
                  {pub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Source Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No source evidence objects matched your filter parameters.
          </div>
        ) : (
          filteredSources.map((src: CommoditySourceEvidenceObject) => {
            const parentQueueItem = queue.find((q) => src.sourceId.includes(q.commodityId.replace('COM-', '')));
            return (
              <div
                key={src.sourceId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded">
                      {src.sourceId}
                    </span>
                    <PCBIStatusBadge status={src.approvalStatus} size="sm" />
                  </div>

                  <h4 className="font-extrabold text-white text-sm tracking-tight leading-snug">
                    {src.sourceName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Building2 size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{src.publisher}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2" title={src.gradeSpecification}>
                    {src.gradeSpecification}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Coverage:</span>
                    <span className="text-slate-200">{src.historicalCoverage}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cadence:</span>
                    <span className="text-slate-200">{src.frequency} • {src.currency}/{src.unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Validation:</span>
                    <span className="text-emerald-400 font-bold">{src.validationStatus}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{src.fileType} format</span>
                    <button
                      type="button"
                      onClick={() => onOpenWorkspace(parentQueueItem?.pcbiId || 'PCBI-FEMO-65-001')}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold text-xs hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
