'use client';
import { apiFetch } from '../../utils/apiFetch';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutiveOpportunityBriefView } from '@/components/presentation/ExecutiveOpportunityBriefView';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER,
  EXECUTIVE_OPPORTUNITY_BRIEF_DOWNLOAD_ENDPOINT
} from '@/constants/app';
import { UI_STRINGS } from '@/constants/uiStrings';
import type { ExecutiveBriefDownloadFormat, ExecutiveOpportunityBriefDownloadPayload } from '@/types';
import { getApiBaseUrl } from '@/utils/apiBase';
import {
  formatExecutiveOpportunityBriefError,
  readExecutiveOpportunityBriefErrorDetails,
  resolveExecutiveBriefAssessmentIdFromSearch,
  resolveExecutiveBriefDownloadFilename
} from '@/utils/executiveOpportunityBriefApi';
import { logger as frontendLogger } from '@/utils/logger';
import { authApiClient } from '@/utils/authApi';

export default function ExecutiveBriefPage(): React.ReactElement {
  const router = useRouter();
  const [assessmentId] = useState<string | undefined>(() =>
    typeof window === 'undefined' ? undefined : resolveExecutiveBriefAssessmentIdFromSearch(window.location.search)
  );
  const [downloadingFormat, setDownloadingFormat] = useState<ExecutiveBriefDownloadFormat | null>(null);
  const [downloadPayload, setDownloadPayload] = useState<ExecutiveOpportunityBriefDownloadPayload | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const strings = UI_STRINGS.opportunityBrief;

  useEffect(() => {
    if (!downloadPayload) return undefined;
    downloadLinkRef.current?.click();
    return () => URL.revokeObjectURL(downloadPayload.url);
  }, [downloadPayload]);

  const handleDownload = async (format: ExecutiveBriefDownloadFormat): Promise<void> => {
    const endpoint = EXECUTIVE_OPPORTUNITY_BRIEF_DOWNLOAD_ENDPOINT(format);
    const url = `${getApiBaseUrl()}${endpoint}`;
    const formatLabel = format.toUpperCase();
    setDownloadError(null);
    setDownloadingFormat(format);
    try {
      const token = authApiClient.getStoredToken();
      const headers: Record<string, string> = {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(assessmentId ? { [EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER]: assessmentId } : {})
      };
      const response = await apiFetch(url, { headers });
      if (!response.ok) {
        const requestId = response.headers.get('x-request-id');
        const details = await readExecutiveOpportunityBriefErrorDetails(response);
        setDownloadError(formatExecutiveOpportunityBriefError({
          statusCode: response.status,
          requestId,
          serverMessage: details.serverMessage,
          formatLabel
        }));
        frontendLogger.error('Opportunity brief download was rejected by the server', {
          format,
          url: endpoint,
          statusCode: response.status,
          requestId: requestId ?? strings.requestIdNotReturned,
          serverMessage: details.serverMessage,
          reason: details.reason
        });
        return;
      }
      const blob = await response.blob();
      const filename = resolveExecutiveBriefDownloadFilename(response.headers.get('content-disposition'), format);
      setDownloadPayload({ url: URL.createObjectURL(blob), filename });
    } catch (error: unknown) {
      setDownloadError(strings.downloadNetworkFailed(formatLabel));
      frontendLogger.error('Opportunity brief download request failed', { format, url }, error);
    } finally {
      setDownloadingFormat(null);
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
          assessmentId={assessmentId}
          downloadingFormat={downloadingFormat}
          onDownloadPdf={() => { void handleDownload('pdf'); }}
          onDownloadPptx={() => { void handleDownload('pptx'); }}
          onBackToWorkspace={() => router.push('/')}
        />
      </main>
    </div>
  );
}
