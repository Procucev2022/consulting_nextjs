'use client';
import React from 'react';
import { Printer, ChevronLeft, ChevronRight, X, Layout, Layers, Mail, Loader2 } from 'lucide-react';
import { UI_STRINGS, PRESENTATION_SLIDES_LIST } from '../../constants';

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  isAllSlidesView: boolean;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSelectSlide: (slideNumber: number) => void;
  onToggleViewMode: () => void;
  onPrint: () => void;
  onClose: () => void;
  onEmailBrief?: () => void;
  isSendingEmail?: boolean;
}

export const PresentationControls: React.FC<PresentationControlsProps> = ({
  currentSlide,
  totalSlides,
  isAllSlidesView,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
  onToggleViewMode,
  onPrint,
  onClose,
  onEmailBrief,
  isSendingEmail
}) => {
  const strings = UI_STRINGS.presentation;

  return (
    <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-3.5 border-b border-[#DCE7F5] bg-white/95 backdrop-blur-md shrink-0">
      {/* Left: Title & Slide Counter */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-[#0284C7] text-white shadow-xs">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0B1B33]">
            {strings.modalTitle}
          </h2>
          <span className="text-[11px] font-mono text-[#0284C7] font-semibold">
            {strings.slideOf(currentSlide, totalSlides)}
          </span>
        </div>
      </div>

      {/* Middle: Quick Jump Slide Select */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
          {strings.jumpToSlide}
        </span>
        <select
          aria-label={strings.jumpToSlide}
          value={currentSlide}
          onChange={(e) => onSelectSlide(Number(e.target.value))}
          disabled={isAllSlidesView}
          className="text-xs bg-white border border-[#DCE7F5] rounded-lg px-2.5 py-1.5 font-semibold text-[#0B1B33] focus:outline-none focus:border-[#0284C7] cursor-pointer disabled:opacity-50"
        >
          {PRESENTATION_SLIDES_LIST.map((slide) => (
            <option key={slide.id} value={slide.slideNumber}>
              {slide.slideNumber}. {slide.title}
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls: Navigation, View Toggle, Print PDF, Close */}
      <div className="flex items-center space-x-2">
        {/* Prev / Next Buttons */}
        <div className="flex items-center space-x-1 mr-1">
          <button
            type="button"
            aria-label={strings.navPrev}
            onClick={onPrevSlide}
            disabled={currentSlide <= 1 || isAllSlidesView}
            className="p-1.5 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] hover:bg-[#F8FBFE] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={strings.navNext}
            onClick={onNextSlide}
            disabled={currentSlide >= totalSlides || isAllSlidesView}
            className="p-1.5 rounded-lg border border-[#DCE7F5] bg-white text-[#0B1B33] hover:bg-[#F8FBFE] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <button
          type="button"
          aria-label={isAllSlidesView ? strings.viewSingle : strings.viewAll}
          onClick={onToggleViewMode}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#DCE7F5] bg-white text-xs font-semibold text-[#0B1B33] hover:bg-[#F8FBFE] transition-colors"
        >
          <Layout className="w-3.5 h-3.5 text-[#0284C7]" />
          <span className="hidden sm:inline">
            {isAllSlidesView ? strings.viewSingle : strings.viewAll}
          </span>
        </button>

        {/* Email Brief to Buyer */}
        {onEmailBrief && (
          <button
            type="button"
            onClick={onEmailBrief}
            disabled={isSendingEmail}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSendingEmail ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>Email Brief</span>
          </button>
        )}

        {/* Print / Export Landscape PDF */}
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{strings.exportPdf}</span>
        </button>

        {/* Close Modal */}
        <button
          type="button"
          aria-label={strings.closeModal}
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1B33] hover:bg-[#EEF7FF] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
