'use client';

import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { UI_STRINGS } from '../../constants/uiStrings';
import type { ReportDownloadActionsProps } from '../../types';

export const ReportDownloadActions: React.FC<ReportDownloadActionsProps> = ({
  testIdPrefix,
  onDownloadPdf,
  onDownloadPptx,
  downloadingFormat = null,
  compact = false,
  className = ''
}): React.ReactElement | null => {
  if (!onDownloadPdf && !onDownloadPptx) {
    return null;
  }

  const strings = UI_STRINGS.opportunityBrief;
  const isDownloading = downloadingFormat !== null;
  const sizeClass = compact ? 'text-[11px] px-2.5 py-1.5 rounded-lg' : 'text-xs px-3.5 py-1.5 rounded-xl';

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {onDownloadPdf && (
        <button
          type="button"
          data-testid={`${testIdPrefix}-pdf-btn`}
          onClick={onDownloadPdf}
          disabled={isDownloading}
          className={`inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${sizeClass}`}
        >
          {downloadingFormat === 'pdf' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>
            {downloadingFormat === 'pdf' ? strings.downloadingReport('PDF') : strings.downloadReportPdf}
          </span>
        </button>
      )}

      {onDownloadPptx && (
        <button
          type="button"
          data-testid={`${testIdPrefix}-pptx-btn`}
          onClick={onDownloadPptx}
          disabled={isDownloading}
          className={`inline-flex items-center gap-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${sizeClass}`}
        >
          {downloadingFormat === 'pptx' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>
            {downloadingFormat === 'pptx' ? strings.downloadingReport('PPTX') : strings.downloadReportPptx}
          </span>
        </button>
      )}
    </div>
  );
};
