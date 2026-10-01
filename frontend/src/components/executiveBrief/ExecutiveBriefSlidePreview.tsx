'use client';
import React from 'react';
import { Eye, Download, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { ExecutiveBriefSlidePreviewProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefSlidePreview: React.FC<ExecutiveBriefSlidePreviewProps> = ({
  onOpenFullReport,
  onDownloadPdf,
  selectedSlideIndex,
  onSelectSlideIndex
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const slides = strings.preview.slides;
  const currentSlide = slides[selectedSlideIndex] || slides[0];

  const handlePrev = (): void => {
    onSelectSlideIndex(selectedSlideIndex > 0 ? selectedSlideIndex - 1 : slides.length - 1);
  };

  const handleNext = (): void => {
    onSelectSlideIndex(selectedSlideIndex < slides.length - 1 ? selectedSlideIndex + 1 : 0);
  };

  return (
    <section aria-labelledby="preview-section-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 id="preview-section-heading" className="text-xs font-black uppercase tracking-wider text-slate-400">
            {strings.preview.sectionTitle}
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">16:9 Presentation Canvas Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFullReport && (
            <button
              type="button"
              data-testid="preview-open-full-btn"
              onClick={onOpenFullReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{strings.preview.openFullReport}</span>
            </button>
          )}
          {onDownloadPdf && (
            <button
              type="button"
              data-testid="preview-download-pdf-btn"
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{strings.preview.downloadPdf}</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5">
        {slides.map((slide, idx) => (
          <button
            key={slide.key}
            type="button"
            data-testid={`slide-tab-${idx}`}
            onClick={() => onSelectSlideIndex(idx)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedSlideIndex === idx
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {slide.title}
          </button>
        ))}
      </div>

      {/* 16:9 Preview Viewport */}
      <div className="relative aspect-video w-full max-h-[460px] bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl text-white">
        {/* Slide Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              SLIDE {String(currentSlide.page).padStart(2, '0')} / 30
            </span>
            <span className="text-sm font-extrabold text-slate-100">{currentSlide.title}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">
            PROCUCEV AI EXECUTIVE BRIEF
          </span>
        </div>

        {/* Slide Content Simulator */}
        <div className="my-auto py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Diagnostic Finding
              </span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Comprehensive data forensics verified across transaction ledgers with full provenance and lineage.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Defensible Opportunity
              </span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Multi-lever overlap elimination ensures accounting-compliant savings without double-counting.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Turnkey Execution
              </span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                On-site category sourcing specialists manage dynamic e-auctions and master contract negotiation.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              Audit Footprint: Reconciled with ₹0.00 Variance against Module 1–4 Certified Data
            </span>
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Certified Presentation Format
            </span>
          </div>
        </div>

        {/* Slide Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="preview-prev-btn"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="preview-next-btn"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-slate-400 font-mono ml-2">
              Slide {selectedSlideIndex + 1} of {slides.length} Preview Highlights
            </span>
          </div>
          <span className="text-[10px] text-slate-400">CONFIDENTIAL — CLIENT USE ONLY</span>
        </div>
      </div>
    </section>
  );
};
