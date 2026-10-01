'use client';
import React from 'react';
import { FileText, Presentation, RefreshCw, Download, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import type { ExecutiveBriefFormatCardsProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefFormatCards: React.FC<ExecutiveBriefFormatCardsProps> = ({
  clientName,
  pdfAvailable,
  pptxAvailable,
  isGenerating,
  onDownload,
  onOpenRegenerateModal
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  return (
    <section aria-labelledby="format-cards-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 id="format-cards-heading" className="text-xs font-black uppercase tracking-wider text-slate-400">
          {strings.formats.sectionTitle}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">Dual-Format 16:9 Deck</span>
          <button
            type="button"
            data-testid="admin-regenerate-brief-btn"
            onClick={onOpenRegenerateModal}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer disabled:opacity-50"
            title="Regenerate Executive Brief from latest certified Module 1-4 data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{strings.formats.regenerateAction}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Format Card A: PDF */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                {pdfAvailable ? 'Official Artifact Ready' : 'Ready to Render'}
              </span>
              <span className="text-xs font-mono text-slate-400">30 Pages • PDF</span>
            </div>

            <div className="flex items-start gap-3.5 mt-3">
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-wide">
                  {strings.formats.pdfTitle} • {strings.formats.pdfSubtitle}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {strings.formats.pdfDetails} formatted for executive leadership, board members, and audit defense.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={clientName}>
              Prepared for {clientName}
            </span>
            <button
              type="button"
              id="download-pdf-btn"
              data-testid="download-pdf-btn"
              onClick={() => onDownload('pdf')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 border border-cyan-400/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{strings.formats.pdfAction}</span>
            </button>
          </div>
        </div>

        {/* Format Card B: POWERPOINT */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {pptxAvailable ? 'Editable PPTX Ready' : strings.formats.pptxAvailable}
              </span>
              <span className="text-xs font-mono text-slate-400">30 Slides • PPTX</span>
            </div>

            <div className="flex items-start gap-3.5 mt-3">
              <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 shrink-0">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-wide">
                  {strings.formats.pptxTitle} • {strings.formats.pptxSubtitle}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {strings.formats.pptxDetails} with identical certified procurement figures and slide architecture.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Zero variance guaranteed</span>
            <button
              type="button"
              id="download-pptx-btn"
              data-testid="download-pptx-btn"
              onClick={() => onDownload('pptx')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{pptxAvailable ? strings.formats.pptxAction : strings.formats.pptxGenerateAction}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
