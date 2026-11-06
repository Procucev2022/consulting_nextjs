import { apiFetch } from '../utils/apiFetch';
/**
 * Downloads evidence files with the Bearer token and saves them through a declarative hidden anchor.
 * A plain <a href> cannot send the Authorization header, so the file is fetched first and saved from
 * a Blob URL. Error bodies are never saved: any non-2xx response becomes a message for the user.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EVIDENCE_DOWNLOAD_CONSTANTS } from '../constants/evidenceDownload';
import { UI_STRINGS } from '../constants/uiStrings';
import type { DeclarativeDownloadPayload } from '../types/components';
import type {
  EvidenceDownloadFailureDetail,
  EvidenceDownloadOutcome,
  UseEvidenceFileDownloadResult
} from '../types/evidenceDownload';
import { apiClient } from '../utils/api';
import { frontendLogger } from '../utils/logger';

const describeError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const readFailureDetail = async (response: Response): Promise<EvidenceDownloadFailureDetail> => {
  const headerRequestId = response.headers.get(EVIDENCE_DOWNLOAD_CONSTANTS.REQUEST_ID_HEADER);
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }
  const message = typeof body.message === 'string' && body.message.length > 0
    ? body.message
    : UI_STRINGS.evidence.downloadFailure.noServerDetail;
  const requestId = typeof body.requestId === 'string' ? body.requestId : headerRequestId;
  return { message, requestId };
};

const buildAuthHeaders = (): Record<string, string> => {
  const token = apiClient.getStoredToken();
  return token ? { [EVIDENCE_DOWNLOAD_CONSTANTS.AUTH_HEADER]: `${EVIDENCE_DOWNLOAD_CONSTANTS.BEARER_PREFIX}${token}` } : {};
};

const fetchEvidenceFile = async (url: string, filename: string): Promise<EvidenceDownloadOutcome> => {
  try {
    const response = await apiFetch(url, { headers: buildAuthHeaders() });
    if (!response.ok) {
      const detail = await readFailureDetail(response);
      return {
        ok: false,
        statusCode: response.status,
        requestId: detail.requestId,
        message: UI_STRINGS.evidence.downloadFailure.httpFailure(
          filename,
          response.status,
          detail.message,
          detail.requestId
        )
      };
    }
    return { ok: true, blob: await response.blob() };
  } catch (error: unknown) {
    return {
      ok: false,
      statusCode: EVIDENCE_DOWNLOAD_CONSTANTS.NETWORK_FAILURE_STATUS,
      requestId: null,
      message: UI_STRINGS.evidence.downloadFailure.networkFailure(filename, describeError(error))
    };
  }
};

export const useEvidenceFileDownload = (): UseEvidenceFileDownloadResult => {
  const [downloadPayload, setDownloadPayload] = useState<DeclarativeDownloadPayload | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!downloadPayload) return;
    downloadLinkRef.current?.click();
    const { href } = downloadPayload;
    window.setTimeout(() => URL.revokeObjectURL(href), EVIDENCE_DOWNLOAD_CONSTANTS.REVOKE_DELAY_MS);
  }, [downloadPayload]);

  const requestDownload = useCallback(async (key: string, url: string, filename: string): Promise<void> => {
    setPendingKey(key);
    setDownloadError(null);
    const outcome = await fetchEvidenceFile(url, filename);
    setPendingKey(null);
    if (outcome.ok === false) {
      frontendLogger.error('Evidence download failed', {
        key,
        filename,
        statusCode: outcome.statusCode,
        requestId: outcome.requestId,
        message: outcome.message
      });
      setDownloadError(outcome.message);
      return;
    }
    setDownloadPayload({ href: URL.createObjectURL(outcome.blob), filename });
  }, []);

  return { downloadPayload, downloadLinkRef, downloadError, pendingKey, requestDownload };
};
