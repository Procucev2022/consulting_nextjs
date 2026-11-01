'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutiveOpportunityBriefView } from '@/components/presentation/ExecutiveOpportunityBriefView';
import { UI_STRINGS } from '@/constants/uiStrings';
import type { ExecutiveOpportunityBriefDownloadPayload } from '@/types';
import { logger as frontendLogger } from '@/utils/logger';
import { authApiClient } from '@/utils/authApi';

export default function ExecutiveBriefPage(): React.ReactElement {
  const router = useRouter();
  const [downloadPayload, setDownloadPayload] = useState<ExecutiveOpportunityBriefDownloadPayload | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const strings = UI_STRINGS.opportunityBrief;

  useEffect(() => {
    if (!downloadPayload) return undefined;
    downloadLinkRef.current?.click();
    return () => URL.revokeObjectURL(downloadPayload.url);
  }, [downloadPayload]);

  const handleDownload = async (format: 'pdf' | 'pptx'): Promise<void> => {
    const url = `/api/reports/executive-brief/download/opportunity-brief/${format}`;
    const formatLabel = format.toUpperCase();
    setDownloadError(null);
    try {
      const token = authApiClient.getStoredToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (!response.ok) {
        const requestId = response.headers.get('x-request-id') ?? strings.requestIdNotReturned;
        setDownloadError(strings.downloadFailed(formatLabel, response.status, requestId));
        frontendLogger.error('Opportunity brief download was rejected by the server', {
          format,
          url,
          statusCode: response.status,
          requestId
        });
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? strings.downloadFilename(format);
      setDownloadPayload({ url: URL.createObjectURL(blob), filename });
    } catch (error: unknown) {
      setDownloadError(strings.downloadNetworkFailed(formatLabel));
      frontendLogger.error('Opportunity brief download request failed', { format, url }, error);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF7FF] px-4 py-8 text-[#0B1B33] sm:px-6 lg:px-8">
      {downloadPayload && (
        <a
          ref={downloadLinkRef}
          href={downloadPayload.url}
          download={downloadPayload.filename}
          className="hidden"
          aria-hidden="true"
        />
      )}
      <main className="mx-auto w-full max-w-7xl">
        {downloadError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800" role="alert" data-testid="brief-download-error">
            {downloadError}
          </p>
        )}
        <ExecutiveOpportunityBriefView
          onDownloadPdf={() => { void handleDownload('pdf'); }}
          onDownloadPptx={() => { void handleDownload('pptx'); }}
          onBackToWorkspace={() => router.push('/')}
        />
      </main>
    </div>
  );
}
