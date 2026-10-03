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
      <div className="bg-white border border-[#DCE7F5] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded">
                PCBI DATA LIBRARY — SOURCE REGISTRY
              </span>
              <span className="text-xs text-[#475569] font-medium">
                {sources.length} Evidence Sources Across {queue.length} Commodities
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-[#0B1B33] mt-1">
              Searchable Commodity Source Repository
            </h3>
          </div>

          {onSelectCommodityUpload && (
            <button
              type="button"
              onClick={() => onSelectCommodityUpload(queue[0]?.commodityId || 'COM-MET-FMO')}
              className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <UploadCloud size={15} />
              <span>Upload Commodity PCBI Source Data</span>
            </button>
          )}
        </div>

        {/* 3 Domain Categorization Tabs (Part I) */}
        <div className="flex items-center gap-2 border-b border-[#DCE7F5] pb-3 text-xs font-bold overflow-x-auto">
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
                  ? 'bg-sky-50 text-[#0284C7] border border-sky-200 font-bold'
                  : 'text-[#475569] hover:text-[#0B1B33] hover:bg-slate-50 font-medium'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Publisher Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search source by ID, publisher, document name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#DCE7F5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0B1B33] placeholder-[#64748B] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#64748B]" />
            <select
              value={publisherFilter}
              onChange={(e) => setPublisherFilter(e.target.value)}
              className="bg-white border border-[#DCE7F5] rounded-xl px-3 py-2 text-xs text-[#0B1B33] font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
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
          <div className="col-span-full py-12 text-center text-[#64748B] text-xs bg-[#EEF7FF] border border-[#DCE7F5] rounded-2xl">
            No source evidence objects matched your filter parameters.
          </div>
        ) : (
          filteredSources.map((src: CommoditySourceEvidenceObject) => {
            const parentQueueItem = queue.find((q) => src.sourceId.includes(q.commodityId.replace('COM-', '')));
            return (
              <div
                key={src.sourceId}
                className="bg-white border border-[#DCE7F5] hover:border-[#0284C7]/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-[#0284C7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                      {src.sourceId}
                    </span>
                    <PCBIStatusBadge status={src.approvalStatus} size="sm" />
                  </div>

                  <h4 className="font-extrabold text-[#0B1B33] text-sm tracking-tight leading-snug">
                    {src.sourceName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                    <Building2 size={13} className="text-[#64748B] shrink-0" />
                    <span className="truncate">{src.publisher}</span>
                  </div>

                  <p className="text-[11px] text-[#475569] line-clamp-2" title={src.gradeSpecification}>
                    {src.gradeSpecification}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DCE7F5] space-y-2 text-[11px]">
                  <div className="flex justify-between text-[#475569]">
                    <span>Coverage:</span>
                    <span className="text-[#0B1B33] font-medium tabular-nums">{src.historicalCoverage}</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>Cadence:</span>
                    <span className="text-[#0B1B33] font-medium">{src.frequency} • {src.currency}/{src.unit}</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>Validation:</span>
                    <span className="text-emerald-600 font-bold">{src.validationStatus}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#64748B]">{src.fileType} format</span>
                    <button
                      type="button"
                      onClick={() => onOpenWorkspace(parentQueueItem?.pcbiId || 'PCBI-FEMO-65-001')}
                      className="inline-flex items-center gap-1 text-[#0284C7] hover:text-[#0369A1] font-bold text-xs hover:underline"
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
